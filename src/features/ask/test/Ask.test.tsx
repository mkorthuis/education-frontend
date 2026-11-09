import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';
import { store } from '@/store/store';
import { askQuestion, AskTurn, clearTurns, contextFrom, setDeepThink, setDraft } from '@/store/slices/askSlice';
import { AskAnswer, askApi } from '@/services/api/endpoints/ask';
import Home from '@/pages/Home';
import AskPage from '../AskPage';

vi.mock('@/services/api/endpoints/ask', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/api/endpoints/ask')>();
  return { ...original, askApi: { ask: vi.fn() } };
});
// The home page's place search loads these
vi.mock('@/services/api/endpoints/locations', () => ({
  locationApi: {
    getDistricts: vi.fn().mockResolvedValue([{ id: 111, name: 'Concord', grades: [] }]),
    getTowns: vi.fn().mockResolvedValue([]),
    getSchools: vi.fn().mockResolvedValue([]),
  },
}));
const ask = vi.mocked(askApi.ask);

const answer = (overrides: Partial<AskAnswer> = {}): AskAnswer => ({
  status: 'answered',
  answer: ['Concord spent $24,351 per student in 2024-25.', 'That is more than the state average.'],
  charts: [],
  tables: [],
  references: [{ label: 'Concord School District: Financials', path: '/district/111/financials' }],
  follow_ups: ['What do Concord teachers earn?'],
  cached: false,
  ...overrides,
});

const httpError = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() },
  });

type Entry = string | { pathname: string; state?: unknown };

const renderAt = (entry: Entry = '/ask') =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ask" element={<AskPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

/** Puts the question in the field directly, for tests that ask several */
const fillAndAsk = async (question: string) => {
  store.dispatch(setDraft(question));
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
};

const typeAndAsk = async (question: string) => {
  await userEvent.type(screen.getByLabelText('Your question'), question);
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
};

// jsdom has no scrolling
Element.prototype.scrollIntoView = vi.fn();

describe('Ask page', () => {
  beforeEach(() => {
    ask.mockReset();
    store.dispatch(clearTurns());
    store.dispatch(setDraft(''));
    store.dispatch(setDeepThink(false));
  });

  it('asks nothing for an empty question and says why', async () => {
    renderAt();
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(screen.getByText('Type a question first, or choose an example.')).toBeInTheDocument();
    expect(ask).not.toHaveBeenCalled();
  });

  it('counts characters near the limit and blocks a question that is too long', async () => {
    renderAt();
    store.dispatch(setDraft('x'.repeat(523)));
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(screen.getByText('523 of 500 characters. Please shorten your question.')).toBeInTheDocument();
    expect(ask).not.toHaveBeenCalled();
  });

  it('shows the answer as plain text under the question, with links to check it', async () => {
    ask.mockResolvedValue(answer({ answer: ['<b>Not bold</b> 2024-25'] }));
    renderAt();
    await typeAndAsk('How much does Concord spend per student?');

    expect(await screen.findByText('<b>Not bold</b>', { exact: false })).toBeInTheDocument();
    // The question is the heading of its answer, and has focus
    expect(screen.getByRole('heading', { name: 'How much does Concord spend per student?' })).toHaveFocus();
    expect(screen.getByRole('link', { name: /Concord School District: Financials/ })).toHaveAttribute('href', '/district/111/financials');
    // Announced a moment later, so a repeated message is read again
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Answer ready.'));
    // The field is empty and ready for the next question
    expect(screen.getByLabelText('Ask your next question')).toHaveValue('');
  });

  it('keeps earlier questions and answers when a follow-up is asked', async () => {
    ask.mockResolvedValueOnce(answer());
    renderAt();
    await typeAndAsk('How much does Concord spend per student?');
    expect(await screen.findByText(/Concord spent \$24,351 per student/)).toBeInTheDocument();

    ask.mockResolvedValueOnce(answer({ answer: ['Concord teachers earned $90,763 on average.'], follow_ups: [] }));
    await userEvent.click(screen.getByRole('button', { name: 'What do Concord teachers earn?' }));
    expect(await screen.findByText('Concord teachers earned $90,763 on average.')).toBeInTheDocument();
    // The follow-up brings the question before it, so it can refer back
    expect(ask).toHaveBeenLastCalledWith(
      'What do Concord teachers earn?',
      [{ question: 'How much does Concord spend per student?', answer: answer().answer }],
      expect.anything(),
      false,
    );
    // Both questions are on the page, in the order asked
    const questions = screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent);
    expect(questions).toEqual(['How much does Concord spend per student?', 'What do Concord teachers earn?', 'Continue the Discussion']);

    await userEvent.click(screen.getByRole('button', { name: 'Clear All Questions' }));
    expect(screen.queryByText('Concord teachers earned $90,763 on average.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Your question')).toHaveFocus();
  });

  it('sends the answered questions on the page with each new one, and starts fresh when cleared', async () => {
    renderAt();
    for (const place of ['Concord', 'Bedford', 'Nashua', 'Keene']) {
      ask.mockResolvedValueOnce(answer({ answer: [`${place} answer.`], follow_ups: [] }));
      await fillAndAsk(`How did ${place} do in math?`);
      expect(await screen.findByText(`${place} answer.`)).toBeInTheDocument();
    }
    ask.mockResolvedValueOnce(answer({ answer: ['Keene science answer.'], follow_ups: [] }));
    await fillAndAsk('What about science?');
    expect(await screen.findByText('Keene science answer.')).toBeInTheDocument();
    expect(ask).toHaveBeenLastCalledWith('What about science?', [
      { question: 'How did Concord do in math?', answer: ['Concord answer.'] },
      { question: 'How did Bedford do in math?', answer: ['Bedford answer.'] },
      { question: 'How did Nashua do in math?', answer: ['Nashua answer.'] },
      { question: 'How did Keene do in math?', answer: ['Keene answer.'] },
    ], expect.anything(), false);

    await userEvent.click(screen.getByRole('button', { name: 'Clear All Questions' }));
    ask.mockResolvedValueOnce(answer({ answer: ['Statewide science answer.'], follow_ups: [] }));
    await fillAndAsk('What about science?');
    expect(await screen.findByText('Statewide science answer.')).toBeInTheDocument();
    expect(ask).toHaveBeenLastCalledWith('What about science?', [], expect.anything(), false);
  }, 15000);

  it('asks the question it was opened with', async () => {
    ask.mockResolvedValue(answer());
    renderAt({ pathname: '/ask', state: { question: 'How much does Concord spend per student?' } });
    expect(await screen.findByText(/Concord spent \$24,351 per student/)).toBeInTheDocument();
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('draws years as a line chart, other categories as bars, and formats table columns by unit', async () => {
    ask.mockResolvedValue(answer({
      charts: [
        { title: 'Cost per Student, Concord', kind: 'line', unit: 'dollars', x_label: 'School year', series: ['All grades'],
          points: [{ label: '2023-24', values: [23000] }, { label: '2024-25', values: [24351] }] },
        { title: 'Cost per Student by District', kind: 'bar', unit: 'dollars', x_label: 'District', series: ['Cost per student'],
          points: [{ label: 'Jackson', values: [50323] }, { label: 'Freedom', values: [41267] }] },
      ],
      tables: [{
        title: 'Graduation by Class', unit: 'percent', columns: ['Class', 'Graduated', 'Students in class'],
        units: [null, 'percent', 'count'], rows: [['Class of 2025', 87.5, 12980], ['Class of 2024', '<10%', null]],
      }],
    }));
    renderAt();
    await typeAndAsk('Spending?');

    const line = (await screen.findByText('Cost per Student, Concord')).closest('figure')!;
    expect(within(line).getByText(/^Line chart\./)).toHaveTextContent('All grades: $23,000 in 2023-24 and $24,351 in 2024-25');
    const bars = screen.getByText('Cost per Student by District').closest('figure')!;
    expect(within(bars).getByText(/^Bar chart\./)).toHaveTextContent('Jackson: $50,323. Freedom: $41,267.');
    const row = screen.getByText('Class of 2025').closest('tr')!;
    expect(within(row).getByText('87.5%')).toBeInTheDocument();
    expect(within(row).getByText('12,980')).toBeInTheDocument();
    expect(within(screen.getByText('Class of 2024').closest('tr')!).getByText('<10%')).toBeInTheDocument();
  });

  it('says when the daily limit is reached and offers the place search instead', async () => {
    ask.mockRejectedValue(httpError(429));
    renderAt();
    await typeAndAsk('Anything?');
    expect(await screen.findByText(/We've reached today's limit on questions\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Look Up a Place' })).toHaveAttribute('href', '/#look-up');
    expect(screen.getByRole('link', { name: 'See Statewide Data' })).toHaveAttribute('href', '/state');
  });

  it("declines off-topic or personal questions with the site's own wording", async () => {
    ask.mockResolvedValue(answer({ status: 'declined', answer: ['No.'], references: [], follow_ups: [] }));
    renderAt();
    await typeAndAsk("Show my son's credits");
    expect(await screen.findByText(/we can't answer questions about a particular student, teacher or family/)).toBeInTheDocument();
    expect(screen.queryByText('No.')).not.toBeInTheDocument();
  });

  it("labels a general explanation as not from the site's data", async () => {
    ask.mockResolvedValue(answer({
      status: 'general',
      answer: ['An IEP is a written plan for a student with a disability.'],
      references: [{ label: 'Education Freedom Accounts', path: '/state/efa' }],
    }));
    renderAt();
    await typeAndAsk('What is an IEP?');
    expect(await screen.findByText('An IEP is a written plan for a student with a disability.')).toBeInTheDocument();
    expect(screen.getByText("General information, not from this site's data.")).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Related Pages on This Site' })).toBeInTheDocument();
    expect(screen.queryByText('Check the Numbers on These Pages')).not.toBeInTheDocument();
  });

  it('links to the sources outside the site, each opening in a new tab', async () => {
    ask.mockResolvedValue(answer({
      answer: ['Parents must be told within 48 hours of a bullying report.'],
      references: [],
      sources: [
        { label: 'RSA 193-F:4, II(i)', url: 'https://gc.nh.gov/rsa/html/XV/193-F/193-F-4.htm', site: 'gc.nh.gov', as_of: '2026-11-08', reasons: ['The 48-hour deadline to tell both families', 'The 5-school-day investigation start'] },
        { label: 'Parent Information Center', url: 'https://picnh.org/about-us/', site: 'picnh.org', as_of: null },
      ],
    }));
    renderAt();
    await typeAndAsk('What does the school have to do about bullying?');
    expect(await screen.findByRole('heading', { name: 'Sources Outside This Site' })).toBeInTheDocument();
    const law = screen.getByRole('link', { name: /RSA 193-F:4, II\(i\).*opens in a new tab/ });
    expect(law).toHaveAttribute('href', 'https://gc.nh.gov/rsa/html/XV/193-F/193-F-4.htm');
    expect(law).toHaveAttribute('target', '_blank');
    expect(law).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('gc.nh.gov · checked Nov 8, 2026')).toBeInTheDocument();
    // Each link says what in the answer it supports, when the answer gave a reason
    expect(within(law).getByText('The 48-hour deadline to tell both families')).toBeInTheDocument();
    expect(within(law).getByText('The 5-school-day investigation start')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /opens in a new tab/ })).toHaveLength(2);
    expect(screen.getByText('picnh.org')).toBeInTheDocument();
  });

  it('shows no outside sources for answers without them', async () => {
    ask.mockResolvedValue(answer());
    renderAt();
    await typeAndAsk('How much does Concord spend per student?');
    expect(await screen.findByText(/Concord spent \$24,351 per student/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sources Outside This Site' })).not.toBeInTheDocument();
  });

  it('asks with Deep Think when it is switched on, and says so', async () => {
    ask.mockResolvedValue(answer());
    renderAt();
    expect(screen.getByRole('button', { name: 'About Deep Think' })).toHaveAccessibleDescription(/takes more time to reason/);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Deep Think' }));
    await typeAndAsk('How does New Hampshire compare with Massachusetts on NAEP math?');
    await waitFor(() => expect(ask).toHaveBeenLastCalledWith('How does New Hampshire compare with Massachusetts on NAEP math?', [], expect.anything(), true));
    expect(await screen.findByText('You asked, with Deep Think')).toBeInTheDocument();
    // Off again, the next question is asked the usual way
    await userEvent.click(screen.getByRole('checkbox', { name: 'Deep Think' }));
    await fillAndAsk('How much does Concord spend per student?');
    await waitFor(() => expect(ask).toHaveBeenLastCalledWith('How much does Concord spend per student?', expect.anything(), expect.anything(), false));
  });

  it('asks an example question in one tap', async () => {
    ask.mockResolvedValue(answer());
    renderAt();
    await userEvent.click(screen.getByRole('button', { name: 'How much does Concord spend per student?' }));
    await waitFor(() => expect(ask).toHaveBeenCalledWith('How much does Concord spend per student?', [], expect.anything(), false));
    expect(await screen.findByRole('heading', { name: 'How much does Concord spend per student?' })).toBeInTheDocument();
  });
});

describe('Follow-up context', () => {
  const turn = (n: number, overrides: Partial<AskTurn> = {}): AskTurn => ({
    id: String(n), question: `Question ${n}?`, context: [], deep: false, status: 'succeeded', response: answer({ answer: [`Answer ${n}.`] }), error: null, ...overrides,
  });

  it('keeps the last ten answered questions, skipping declined and failed ones', () => {
    const turns = [
      ...Array.from({ length: 12 }, (_, n) => turn(n)),
      turn(12, { response: answer({ status: 'declined' }) }),
      turn(13, { status: 'failed', response: null, error: 'server' }),
    ];
    const context = contextFrom(turns);
    expect(context.map(earlier => earlier.question)).toEqual(Array.from({ length: 10 }, (_, n) => `Question ${n + 2}?`));
    expect(context[9]).toEqual({ question: 'Question 11?', answer: ['Answer 11.'] });
  });
});

describe('Home page', () => {
  beforeEach(() => {
    ask.mockReset();
    store.dispatch(clearTurns());
    store.dispatch(setDraft(''));
    store.dispatch(setDeepThink(false));
  });

  it('offers both ways in: look up a place, or ask a question', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Look Up a District or School' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Or Try Asking a Question' })).toBeInTheDocument();
    expect(screen.getByLabelText('District or school')).toBeInTheDocument();
    // Phones get plain links and wider screens a list; jsdom applies neither breakpoint, so both are here
    screen.getAllByRole('link', { name: /All Districts/ }).forEach(link => expect(link).toHaveAttribute('href', '/districts'));
  });

  it('asks from the home page with Deep Think when it is switched on', async () => {
    ask.mockResolvedValue(answer());
    renderAt('/');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Deep Think' }));
    await typeAndAsk('How does New Hampshire compare with Massachusetts on NAEP math?');
    await waitFor(() => expect(ask).toHaveBeenCalledWith('How does New Hampshire compare with Massachusetts on NAEP math?', [], expect.anything(), true), { timeout: 5000 });
    expect(await screen.findByText('You asked, with Deep Think', {}, { timeout: 5000 })).toBeInTheDocument();
    // The switch stays on for the Ask page's next question
    expect(screen.getByRole('checkbox', { name: 'Deep Think' })).toBeChecked();
  });

  it('opens the Ask page with the question and its answer', async () => {
    ask.mockResolvedValue(answer());
    renderAt('/');
    await typeAndAsk('How much does Concord spend per student?');
    // Opening another page takes longer than the default second on a busy machine
    expect(await screen.findByRole('heading', { name: 'Ask About New Hampshire Schools' }, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByText(/Concord spent \$24,351 per student/, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('starts a new discussion, clearing the questions asked before', async () => {
    ask.mockResolvedValue(answer({ answer: ['Earlier answer.'] }));
    await store.dispatch(askQuestion({ question: 'What is the average class size in Claremont?', context: [] }));
    expect(store.getState().ask.turns).toHaveLength(1);
    ask.mockResolvedValue(answer());
    renderAt('/');
    await typeAndAsk('How much does Concord spend per student?');
    expect(await screen.findByText(/Concord spent \$24,351 per student/, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText('What is the average class size in Claremont?')).not.toBeInTheDocument();
    expect(screen.queryByText('Earlier answer.')).not.toBeInTheDocument();
    // Asked on its own, not as a follow-up
    expect(ask).toHaveBeenLastCalledWith('How much does Concord spend per student?', [], expect.anything(), false);
  });
});

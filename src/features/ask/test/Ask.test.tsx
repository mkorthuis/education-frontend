import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';
import { store } from '@/store/store';
import { clearAnswer, setDraft } from '@/store/slices/askSlice';
import { AskAnswer, askApi } from '@/services/api/endpoints/ask';
import AskSection from '../AskSection';

vi.mock('@/services/api/endpoints/ask', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/api/endpoints/ask')>();
  return { ...original, askApi: { ask: vi.fn() } };
});
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

const renderBox = (onLookUpDistrict = vi.fn()) =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <AskSection onLookUpDistrict={onLookUpDistrict} />
      </MemoryRouter>
    </Provider>
  );

const typeAndAsk = async (question: string) => {
  await userEvent.type(screen.getByLabelText('Your question'), question);
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
};

// jsdom has no scrolling
Element.prototype.scrollIntoView = vi.fn();

describe('Ask a Question', () => {
  beforeEach(() => {
    ask.mockReset();
    store.dispatch(clearAnswer());
    store.dispatch(setDraft(''));
  });

  it('asks nothing for an empty question and says why', async () => {
    renderBox();
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(screen.getByText('Type a question first, or choose an example below.')).toBeInTheDocument();
    expect(ask).not.toHaveBeenCalled();
  });

  it('counts characters near the limit and blocks a question that is too long', async () => {
    renderBox();
    store.dispatch(setDraft('x'.repeat(523)));
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(screen.getByText('523 of 500 characters. Please shorten your question.')).toBeInTheDocument();
    expect(ask).not.toHaveBeenCalled();
  });

  it('shows the answer as plain text with links to check it, and focuses the answer heading', async () => {
    ask.mockResolvedValue(answer({ answer: ['<b>Not bold</b> 2024-25'] }));
    renderBox();
    await typeAndAsk('How much does Concord spend per student?');

    expect(await screen.findByText('<b>Not bold</b>', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Answer' })).toHaveFocus();
    expect(screen.getByText('How much does Concord spend per student?', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Concord School District: Financials/ })).toHaveAttribute('href', '/district/111/financials');
    // Announced a moment later, so a repeated message is read again
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Answer ready\.|Your answer is ready/));
    // A follow-up asks again
    ask.mockResolvedValue(answer({ answer: ['Concord teachers earned $90,763 on average.'] }));
    await userEvent.click(screen.getByRole('button', { name: 'What do Concord teachers earn?' }));
    expect(await screen.findByText('Concord teachers earned $90,763 on average.')).toBeInTheDocument();
    expect(ask).toHaveBeenLastCalledWith('What do Concord teachers earn?', expect.anything());
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
    renderBox();
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

  it('says when the daily limit is reached and offers the district picker instead', async () => {
    ask.mockRejectedValue(httpError(429));
    const lookUp = vi.fn();
    renderBox(lookUp);
    await typeAndAsk('Anything?');
    expect(await screen.findByText(/We've reached today's limit on questions\./)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Look Up a District' }));
    expect(lookUp).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'See Statewide Data' })).toHaveAttribute('href', '/state');
  });

  it('declines off-topic or personal questions with the site\'s own wording', async () => {
    ask.mockResolvedValue(answer({ status: 'declined', answer: ['No.'], references: [], follow_ups: [] }));
    renderBox();
    await typeAndAsk("Show my son's credits");
    expect(await screen.findByText(/we can't answer questions about a particular student, teacher or family/)).toBeInTheDocument();
    expect(screen.queryByText('No.')).not.toBeInTheDocument();
  });

  it('asks an example question in one tap', async () => {
    ask.mockResolvedValue(answer());
    renderBox();
    await userEvent.click(screen.getByRole('button', { name: 'How much does Concord spend per student?' }));
    await waitFor(() => expect(ask).toHaveBeenCalledWith('How much does Concord spend per student?', expect.anything()));
    expect(screen.getByLabelText('Your question')).toHaveValue('How much does Concord spend per student?');
  });
});

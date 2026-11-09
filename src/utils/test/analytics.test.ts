import { configureStore } from '@reduxjs/toolkit';
import { askApi, AskAnswer } from '@/services/api/endpoints/ask';
import askReducer, { askQuestion } from '@/store/slices/askSlice';
import { downloadCsv } from '@/features/state/utils/csv';
import { trackEvent, trackOutboundClick } from '../analytics';

const answer = (status: AskAnswer['status'] = 'answered'): AskAnswer => ({
  status, answer: ['Concord spent $20,000 per pupil.'], charts: [], tables: [], references: [], follow_ups: [], cached: false,
});

describe('analytics events', () => {
  let gtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtag = vi.fn();
    window.gtag = gtag;
  });

  afterEach(() => {
    delete (window as Partial<Window>).gtag;
  });

  const events = () => gtag.mock.calls.map(([, name, params]) => [name, params]);

  it('are sent only once Google Analytics has loaded', () => {
    trackEvent('search', { search_term: 'conc' });
    expect(events()).toEqual([['search', { search_term: 'conc' }]]);
    delete (window as Partial<Window>).gtag;
    expect(() => trackEvent('search')).not.toThrow();
  });

  it('track links to other sites, and not the site’s own, mail or phone links', () => {
    document.body.innerHTML = `
      <a id="out" href="https://www.education.nh.gov/data"><span id="inner">NH DOE</span></a>
      <a id="own" href="/district/111">Concord</a>
      <a id="mail" href="mailto:webmaster@nhfacts.com">Email</a>`;
    for (const id of ['inner', 'own', 'mail']) {
      trackOutboundClick({ target: document.getElementById(id) } as unknown as MouseEvent);
    }
    expect(events()).toEqual([['outbound_click', { link_domain: 'www.education.nh.gov', link_url: 'https://www.education.nh.gov/data', page_path: '/' }]]);
  });

  it('track how Ask is used and how it does, never what was asked', async () => {
    const store = configureStore({ reducer: { ask: askReducer } });
    vi.spyOn(askApi, 'ask').mockResolvedValueOnce(answer('no_data')).mockRejectedValueOnce(new Error('broken'));
    await store.dispatch(askQuestion({ question: 'What did Concord spend?', context: [] }));
    await store.dispatch(askQuestion({ question: 'And Bow?', context: [{ question: 'What did Concord spend?', answer: ['$20,000.'] }], deep: true }));
    expect(events()).toEqual([
      ['ask_question', { follow_up: false, more_time: false }],
      ['ask_answer', { follow_up: false, more_time: false, status: 'no_data', cached: false }],
      ['ask_question', { follow_up: true, more_time: true }],
      ['ask_failed', { follow_up: true, more_time: true, reason: 'server' }],
    ]);
    expect(JSON.stringify(gtag.mock.calls)).not.toMatch(/Concord|Bow/);
  });

  it('track downloads', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadCsv('concord-spending', ['Year', 'Spending'], [[2025, 1]]);
    expect(events()).toEqual([['file_download', { file_name: 'concord-spending.csv', file_extension: 'csv', page_path: '/' }]]);
  });
});

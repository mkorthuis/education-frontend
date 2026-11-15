import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// The harness first: it loads the store, which the pages' modules expect to exist
import { answerFrom, DISTRICT_ID } from './entityPages';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { store } from '@/store/store';
import { fetchAllDistrictData } from '@/store/slices/locationSlice';
import { setInflationAdjustment } from '@/store/slices/financeSlice';
import Financials from '@/features/district/components/Financials';
import { CONCORD_STATE_AID, districtYear, FINANCE_FIXTURES, STATE_AID_FIXTURES, townCalculation } from './financialsFixtures';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));

let location = '';
const Location = () => {
  location = `${useLocation().pathname}${useLocation().search}`;
  return null;
};

/** Concord's Financials page at a tab, after its location data has loaded as the site's layout loads it */
const renderFinancials = async (path: string) => {
  await store.dispatch(fetchAllDistrictData(DISTRICT_ID));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/district/${DISTRICT_ID}/financials/${path}`]}>
        <Routes>
          <Route path="/district/:id/financials/:tab?" element={<><Financials /><Location /></>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

const equation = (name: RegExp) => screen.getByRole('table', { name });

beforeEach(() => answerFrom({ ...FINANCE_FIXTURES, ...STATE_AID_FIXTURES }));

afterEach(() => {
  store.dispatch(setInflationAdjustment(false));
});

describe('State Aid tab', () => {
  it('answers first: all the state revenue in its report, per student, in four parts', async () => {
    // 2023-24, the fiscal year the site shows in tests
    await renderFinancials('state-aid');

    expect(await screen.findByRole('heading', { name: /^State Aid in 23\/24/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'State Aid', selected: true })).toBeInTheDocument();
    const summary = within(screen.getByRole('region', { name: /^State Aid in 23\/24/ }));
    expect(summary.getByText(/The state provided Concord/).textContent)
      .toBe('The state provided Concord $6.00M in 23/24. About $6,000 per student.');
    expect(summary.getAllByRole('listitem').map(item => item.textContent)).toEqual([
      'Adequacy Grant $2,000,000', 'SWEPT $3,000,000', 'Special Education Aid $120,000', 'Other State Aid $880,000',
    ]);
    // No tiles, and the chart has no table view or CSV
    expect(screen.queryByText('Total State Aid')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Table' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /as CSV/ })).not.toBeInTheDocument();
  });

  it('figures the adequacy aid as one equation, per student, with every step folded away', async () => {
    await renderFinancials('state-aid');

    const table = await screen.findByRole('table', { name: /How Concord's 2023-24 adequacy aid is figured/ });
    expect(within(table).getByText('Adequate Education Cost in NH')).toBeInTheDocument();
    expect(within(table).getByText('1,000 students × $4,100, plus extra for 300 low-income students')).toBeInTheDocument();
    expect(within(table).getByText('$4,790,000')).toBeInTheDocument();
    expect(within(table).getByText('−$3,000,000')).toBeInTheDocument();
    expect(within(table).queryByText(/gap the state fills/i)).not.toBeInTheDocument();
    expect(within(table).getByText("Cushion So Aid Doesn't Fall Too Fast Year over Year")).toBeInTheDocument();
    expect(within(table).getByText('$2,000,000')).toBeInTheDocument();
    // The cost and cushion go on, the SWEPT comes off last, and the grant is the result; no step numbers
    expect(within(table).getAllByRole('row').slice(1).map(row => (row as HTMLTableRowElement).cells[0].textContent)).toEqual(['', '+', '−', '=']);
    // Per student: $4,790 of the cost for each of its 1,000 students
    expect(within(table).getAllByText(/^\$4,790/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'How Adequacy Aid Is Calculated' })).toBeInTheDocument();
    expect(screen.getByText(/^Statewide adequacy aid is funded first by/)).toHaveTextContent(
      "Statewide adequacy aid is funded first by your local Concord property taxes (SWEPT). It is then topped up by an adequacy grant from the state's Education Trust Fund. Both the adequacy aid and the resulting grant are calculated in the steps below.",
    );
    // The SWEPT stays in town
    expect(within(table).getByText('Concord Raises for Schools (SWEPT)')).toBeInTheDocument();
    expect(within(table).queryByText(/none goes to the state/)).not.toBeInTheDocument();
    expect(screen.getByText('Concord Property Taxes (SWEPT) $3.00M')).toBeInTheDocument();
    expect(screen.getByText('Adequacy Grant (State) $1.79M')).toBeInTheDocument();

    // The DOE's steps, folded away; a step opens to its formula and its figures, without its citation
    expect(screen.queryByRole('table', { name: /adequacy aid calculation/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show Every Step the DOE Uses' }));
    const steps = screen.getByRole('table', { name: /adequacy aid calculation/ });
    expect(within(steps).getByText('1,000 × $4,100')).toBeInTheDocument();
    await userEvent.click(within(steps).getByRole('button', { name: 'Show how Base Adequacy Aid is figured' }));
    expect(within(steps).getByText('As a formula: Resident students (ADM) × Base adequacy per student')).toBeInTheDocument();
    expect(within(steps).queryByText(/^Source:/)).not.toBeInTheDocument();
    // The DOE's "total state aid" is named for what it is
    expect(within(steps).getByText('Adequacy Grant Plus SWEPT')).toBeInTheDocument();
  });

  it('says why the grant changed, in parts that add up to the change', async () => {
    await renderFinancials('state-aid?year=2025');

    expect(await screen.findByText(
      "Concord's adequacy grant fell $300K from 2023-24 to 2024-25. The biggest reason: 50 fewer students (−$209K).",
    )).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why the Grant Changed Since Last Year' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Compared with' })).not.toBeInTheDocument();
    const change = screen.getByRole('table', { name: /Why Concord's adequacy grant changed/ });
    // 50 fewer students at $4,182; the rates up $82 and $46 for last year's 1,000 and 300; $100,000 more SWEPT; $86,700 less cushion
    expect(within(change).getByText('Fewer Students')).toBeInTheDocument();
    expect(within(change).getByText('50 fewer resident students')).toBeInTheDocument();
    expect(within(change).getByText('−$209,100')).toBeInTheDocument();
    expect(within(change).getByText('The base rate rose from $4,100 to $4,182 per student, and the extra rates with it')).toBeInTheDocument();
    expect(within(change).getByText('+$95,800')).toBeInTheDocument();
    expect(within(change).getByText('More Statewide Property Tax Raised in Town')).toBeInTheDocument();
    expect(within(change).getByText('−$100,000')).toBeInTheDocument();
    expect(within(change).getByText('−$86,700')).toBeInTheDocument();
    expect(within(change).queryByText('Other Changes')).not.toBeInTheDocument();
    expect(within(change).getByText('$1,700,000')).toBeInTheDocument();
  });

  it('shows who paid for the district\'s high-cost students, and lists the other aid', async () => {
    await renderFinancials('state-aid');

    // $320,739 of costs: Concord's $133,239 up to the threshold and 20% of $187,500; the state's 80% of it, $120,000 paid of $150,000
    expect(await screen.findByText(/high-cost students cost/)).toHaveTextContent(
      "Concord's high-cost students cost $321K in 2022-23. The state reimbursed $120K (37%), and Concord paid $201K (63%).",
    );
    const sped = within(screen.getByRole('region', { name: 'How the Special Education Aid Is Figured' }));
    expect(sped.getByText("Concord's Share $170,739")).toBeInTheDocument();
    expect(sped.getByText("The State's Share $150,000")).toBeInTheDocument();
    expect(sped.getAllByRole('listitem').map(item => item.textContent)).toEqual([
      'First $66,619 of Each Student $133,239', '20% of Costs from $66,619 to $190,341 $37,500',
      'Reimbursed by the State $120,000', 'Not Paid, Left to Concord $30,000',
    ]);
    expect(screen.getByText(/of a student's special education costs/)).toHaveTextContent(
      "Concord pays the first $66,619 of a student's special education costs, 3.5 times the state average cost per pupil. "
      + 'The state reimburses 80% of costs up to $190,341, 10 times the state average cost per pupil, and 100% above that. '
      + 'However, due to limited funding, the state reimbursed only 80% of what it owed on 2022-23 costs.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show Every Step' }));
    const steps = screen.getByRole('table', { name: /special education aid calculation/ });
    expect(within(steps).getByText('Paid at 80%: the $33,917,000 appropriation fell short')).toBeInTheDocument();

    // Other state aid: the report's other lines, and the adequacy aid it books beyond the DOE's figure
    const other = screen.getByRole('table', { name: /other state aid/ });
    expect(within(other).getByText('School Building Aid')).toBeInTheDocument();
    expect(within(other).getByText("The state's share of payments on school construction debt")).toBeInTheDocument();
    expect(within(other).getByText('Booked Differently in Its Report')).toBeInTheDocument();
    expect(within(other).getByText('$500,000')).toBeInTheDocument();
    expect(within(other).getByText('All Other State Aid')).toBeInTheDocument();
    expect(within(other).getByText('$880,000')).toBeInTheDocument();
  });

  it("estimates what isn't in yet from the year before, adjusted for inflation", async () => {
    await renderFinancials('state-aid?year=2025');

    // 2023-24's $120,000 and $880,000, by the CPI's 321.9 / 313.7
    expect(await screen.findByText(/The state is expected to provide Concord about/)).toHaveTextContent(/^The state is expected to provide Concord about \$5\.83M in 24\/25\./);
    const summary = within(screen.getByRole('region', { name: /^State Aid in 24\/25/ }));
    expect(summary.getAllByRole('listitem').map(item => item.textContent).slice(2)).toEqual([
      'Special Education Aid $123,137 (est.)', 'Other State Aid $903,003 (est.)',
    ]);
    expect(screen.getByText(/^The DOE hasn't published special education aid for 2024-25 yet\./)).toHaveTextContent(
      "The DOE hasn't published special education aid for 2024-25 yet. The estimate here, $123,137, is 2023-24's $120,000 adjusted for inflation.",
    );
    expect(screen.getByText(/^Other state aid comes from/)).toHaveTextContent(
      "Other state aid comes from Concord's financial report for 2024-25, which isn't in yet. The estimate here, $903,003, is 2023-24's $880,000 adjusted for inflation.",
    );
    expect(screen.getByText(/^Faded: estimated from the latest year reported, adjusted for inflation\./)).toBeInTheDocument();
  });

  it('starts at the fiscal year the site shows, and puts any other year chosen in the URL', async () => {
    // 2023-24 in tests, as the other tabs show it, though the DOE has estimated 2024-25
    await renderFinancials('state-aid');

    expect(await screen.findByRole('heading', { name: /^State Aid in 23\/24/ })).toBeInTheDocument();
    // The first year has no earlier one to compare with
    expect(screen.queryByRole('heading', { name: /^Why the Grant Changed/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: 'School year' }));
    await userEvent.click(screen.getByRole('option', { name: '24/25' }));
    expect(await screen.findByRole('heading', { name: /^State Aid in 24\/25/ })).toBeInTheDocument();
    expect(screen.queryByText(/The DOE's estimate of/)).not.toBeInTheDocument();
    expect(location).toBe(`/district/${DISTRICT_ID}/financials/state-aid?year=2025`);

    // Back to the fiscal year, the tab's own address
    await userEvent.click(screen.getByRole('combobox', { name: 'School year' }));
    await userEvent.click(screen.getByRole('option', { name: '23/24' }));
    expect(await screen.findByRole('heading', { name: /^State Aid in 23\/24/ })).toBeInTheDocument();
    expect(location).toBe(`/district/${DISTRICT_ID}/financials/state-aid`);
  });

  it("restates only the years' chart after inflation, and says so in its title", async () => {
    store.dispatch(setInflationAdjustment(true));
    await renderFinancials('state-aid?year=2025');

    // The chart in the site's year's dollars, 2023-24 in tests: 2024-25 by the CPI's 313.7 / 321.9
    const chart = await screen.findByRole('heading', { name: 'State Aid by Year In Current Dollars' });
    expect(chart).toBeInTheDocument();
    expect(screen.getByText(/^Stacked column chart of state aid by year, in current dollars, .* 2023-24: \$6,000,000 in all\./)).toBeInTheDocument();
    // Not the page's title, as on the other tabs
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent('In Current Dollars');
    // The year's own figures as reported
    expect(within(equation(/adequacy aid is figured/)).getByText('$4,676,700')).toBeInTheDocument();
    expect(screen.getByText(/^The DOE hasn't published special education aid for 2024-25 yet\./)).toHaveTextContent(
      "The DOE hasn't published special education aid for 2024-25 yet. The estimate here, $123,137, is 2023-24's $120,000 adjusted for inflation.",
    );

    await userEvent.click(screen.getByRole('button', { name: 'Per Student' }));
    expect(screen.getByText('Per Resident Student')).toBeInTheDocument();
  });

  it("figures each member town's aid, and a town whose SWEPT is more than its cost", async () => {
    // A cooperative of two towns: 40% of Bow's aid, and all of Dunbarton's grant, which is only
    // hold-harmless aid because its SWEPT is more than its cost
    const bow = townCalculation([50, 'Bow'], { base: 4182, frl: 2346 }, { resident: 1000, frl: 100 }, 2000000, 0, { grant: 1000000, swept: 800000, of: 0.4 });
    const dunbarton = townCalculation([140, 'Dunbarton'], { base: 4182, frl: 2346 }, { resident: 100, frl: 10 }, 900000, 50000, { grant: 50000, swept: 900000, of: 1 });
    answerFrom({
      ...FINANCE_FIXTURES,
      ...STATE_AID_FIXTURES,
      'finance/adequacy-aid/district/111/calculation': [CONCORD_STATE_AID[0], districtYear(2025, 'estimate', '2024-10-01', [bow, dunbarton], null)],
    });
    await renderFinancials('state-aid?year=2025');

    expect(await screen.findByText(/^Statewide adequacy aid is funded first by your local property taxes in each member town \(SWEPT\)\. It is then topped up/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bow · 40%', pressed: true })).toBeInTheDocument();
    expect(screen.getByText(/Concord receives 40% of Bow's aid: \$1,000,000 of its \$2,416,600 adequacy grant and \$800,000 of its \$2,000,000 SWEPT/)).toBeInTheDocument();
    // Per student only for a district of one whole town
    expect(screen.queryByText(/per student\.$/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Dunbarton · 100%' }));
    const table = equation(/How Dunbarton's 2024-25 adequacy aid is figured/);
    expect(within(table).getByText('100 students × $4,182, plus extra for 10 low-income students')).toBeInTheDocument();
    expect(within(table).getByText('No Grant Below $0')).toBeInTheDocument();
    expect(within(table).getByText('The SWEPT covers the whole cost, with $458,340 to spare')).toBeInTheDocument();
  });

  it('says when every member town\'s aid goes wholly to the district', async () => {
    const bow = townCalculation([50, 'Bow'], { base: 4182, frl: 2346 }, { resident: 1000, frl: 100 }, 2000000, 0);
    const dunbarton = townCalculation([140, 'Dunbarton'], { base: 4182, frl: 2346 }, { resident: 100, frl: 10 }, 900000, 50000);
    answerFrom({
      ...FINANCE_FIXTURES,
      ...STATE_AID_FIXTURES,
      'finance/adequacy-aid/district/111/calculation': [CONCORD_STATE_AID[0], districtYear(2025, 'estimate', '2024-10-01', [bow, dunbarton], null)],
    });
    await renderFinancials('state-aid?year=2025');

    expect(await screen.findByRole('button', { name: 'Bow', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dunbarton' })).toBeInTheDocument();
    expect(screen.queryByText(/Concord receives \d+% of/)).not.toBeInTheDocument();
  });

  it('says so in a sentence when a district gets no grant in either year', async () => {
    const dunbarton = (fiscalYear: number, swept: number) => districtYear(fiscalYear, 'final', '2024-04-01',
      [townCalculation([140, 'Dunbarton'], { base: 4182, frl: 2346 }, { resident: 100, frl: 10 }, swept, 0)], null);
    answerFrom({ ...FINANCE_FIXTURES, ...STATE_AID_FIXTURES, 'finance/adequacy-aid/district/111/calculation': [dunbarton(2024, 900000), dunbarton(2025, 950000)] });
    await renderFinancials('state-aid?year=2025');

    expect(await screen.findByText(
      'Concord received no adequacy grant in 2023-24 or 2024-25: the statewide property tax raised in town covered the whole cost both years.',
    )).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: /Why Concord's adequacy grant changed/ })).not.toBeInTheDocument();
    // The description says the SWEPT alone funds it
    expect(screen.getByText(/^In 24\/25, statewide adequacy aid is funded entirely by/)).toHaveTextContent(
      "In 24/25, statewide adequacy aid is funded entirely by your local Dunbarton property taxes (SWEPT). They raise more than the state's cost of an adequate education for Dunbarton's students, so the state pays no adequacy grant, and Dunbarton keeps all of it for its own schools. The adequacy aid is calculated in the steps below.",
    );
  });

  it("says so when the state aid can't be loaded", async () => {
    answerFrom(FINANCE_FIXTURES);
    await renderFinancials('state-aid');

    expect(await screen.findByText("The state aid calculation couldn't be loaded. Please try again later.")).toBeInTheDocument();
  });

  it('links the Revenues tab\'s adequacy aid to how it\'s calculated', async () => {
    await renderFinancials('revenues');

    await userEvent.click(await screen.findByText('Revenue from State Sources'));
    await userEvent.click(await screen.findByText('Unrestricted Grants-In-Aid'));
    // The adequacy grant and SWEPT link to how they're calculated; building aid doesn't
    await waitFor(() => expect(screen.getAllByRole('link', { name: "How It's Calculated" })).toHaveLength(2));
    screen.getAllByRole('link', { name: "How It's Calculated" }).forEach(link =>
      expect(link.getAttribute('href')).toMatch(new RegExp(`^/district/${DISTRICT_ID}/financials/state-aid\\?year=`)));
  });
});

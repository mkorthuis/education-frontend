import React, { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { store } from '@/store/store';
import { fetchData } from '@/services/api/utils/apiUtils';
import { fixtureFor } from './stateApiFixtures';
import StateOverview from '../pages/StateOverview';
import StateAcademics from '../pages/StateAcademics';
import StateOutcomes from '../pages/StateOutcomes';
import StateFinancials from '../pages/StateFinancials';
import StateStaff from '../pages/StateStaff';
import StateEnrollment from '../pages/StateEnrollment';
import StateSafety from '../pages/StateSafety';
import StateEfa from '../pages/StateEfa';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api/utils/apiUtils')>();
  return { ...actual, fetchData: vi.fn() };
});

// Every request is answered from the fixtures; a request with no fixture fails the page loudly.
// Set before each test because the Vitest config resets mocks.
beforeEach(() => {
  vi.mocked(fetchData).mockImplementation(async (url: string) => {
    const fixture = fixtureFor(url);
    if (fixture === undefined) throw new Error(`No fixture for ${url}`);
    return structuredClone(fixture);
  });
});

const CurrentPath = () => <p>At {useLocation().pathname}</p>;

const renderPage = (page: React.ReactElement, path = '/') =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/state/*" element={page} />
            <Route path="*" element={<CurrentPath />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    </Provider>
  );

const TIMEOUT = { timeout: 3000 };

// A sentence whose school years sit in their own spans (so they don't break across lines)
const sentence = (text: string | RegExp) => (_content: string, element: Element | null) =>
  element?.tagName === 'P' && (typeof text === 'string' ? element.textContent === text : text.test(element.textContent ?? ''));

describe('State pages', () => {
  it('overview shows the key figures, grouped, each linking to its page', async () => {
    renderPage(<StateOverview />, '/state');

    await screen.findByText('Proficient in Math', undefined, TIMEOUT);
    // No plain-language summary or district picker on the overview
    expect(screen.queryByText('In brief')).not.toBeInTheDocument();
    expect(screen.queryByText('See how your district compares')).not.toBeInTheDocument();

    // Tiles are grouped, say where they lead, and link to the detail pages
    // (Role queries are slow on a page this size, so headings and links are checked by element)
    expect(screen.getByText('Explore Statewide Data').tagName).toBe('H1');
    expect(screen.queryByText(/^Figures for all of New Hampshire/)).not.toBeInTheDocument();
    expect(screen.getByText('Results', { selector: 'h3' }).tagName).toBe('H3');
    expect(screen.getByText('Proficient in Math').closest('a')).toHaveAttribute('href', '/state/academic');
    expect(within(screen.getByText('Proficient in Math').closest('a')!).getByText(/See test scores/)).toBeInTheDocument();
    // Each tile: the figure and its short year, an arrow with the change and its comparison year
    // (the whole change in words for screen readers), and a grey note only on the dollar tiles and truancy
    const mathTile = within(screen.getByText('Proficient in Math').closest('a')!);
    expect(mathTile.getByText('44%')).toBeInTheDocument();
    expect(mathTile.getByText('25/26')).toBeInTheDocument();
    expect(mathTile.getByText('4%')).toBeInTheDocument();
    expect(mathTile.getByText('Since 17/18')).toBeInTheDocument();
    expect(mathTile.getByText('Down 4 percentage points since 2017-18')).toBeInTheDocument();
    expect(mathTile.getByText('Down 4 percentage points since 2017-18').closest('p')).toHaveStyle({ color: '#c62828' });
    // Phones show students in thousands
    const studentsTile = within(screen.getByText('Students', { selector: 'p' }).closest('a')!);
    expect(studentsTile.getByText('149,403')).toBeInTheDocument();
    expect(studentsTile.getByText('149K')).toBeInTheDocument();
    expect(within(screen.getByText('Average Teacher Salary', { selector: 'span' }).closest('a')!).getByText('$72K')).toBeInTheDocument();
    expect(within(screen.getByText('Cost per Student', { selector: 'p' }).closest('a')!).getByText(/^\$\d+K$/)).toBeInTheDocument();
    expect(screen.getByText('$4.1B')).toBeInTheDocument();
    expect(within(screen.getByText('Education Freedom Accounts', { selector: 'span' }).closest('a')!).getByText(/^\d+(\.\d)?K$/)).toBeInTheDocument();
    const costTile = within(screen.getByText('Cost per Student', { selector: 'p' }).closest('a')!);
    // A rise in cost per student is bad, so it's red
    expect(costTile.getByText('Up 50% since 2014-15').closest('p')).toHaveStyle({ color: '#c62828' });
    expect(costTile.getByText(/^Up \d+% after inflation$/)).toBeInTheDocument();
    expect(within(screen.getByText('Total School District Spending').closest('a')!).getByText('$4.14B')).toBeInTheDocument();
    const gradTile = within(screen.getByText('Four-Year Graduation Rate', { selector: 'span' }).closest('a')!);
    expect(gradTile.getByText('2025')).toBeInTheDocument();
    // Phones show shorter titles on some tiles
    expect(gradTile.getByText('Graduation Rate')).toBeInTheDocument();
    expect(screen.getByText('Total Spending')).toBeInTheDocument();
    expect(screen.getByText("EFA's")).toBeInTheDocument();
    expect(gradTile.getByText('Since 2015')).toBeInTheDocument();
    expect(screen.getByText('Teachers').closest('a')).not.toHaveTextContent('students per teacher');
    expect(screen.queryByText(/estimated state aid/)).not.toBeInTheDocument();
    // Students and staff come first, then financials, then results; district and school counts replace truancy
    expect(screen.getByText('Key Figures').tagName).toBe('H2');
    const bandOrder = ['Schools', 'Financials', 'Results'].map(title => screen.getAllByText(title, { selector: 'h3' }).find(heading => heading.closest('section'))!);
    expect(bandOrder[0].compareDocumentPosition(bandOrder[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bandOrder[1].compareDocumentPosition(bandOrder[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // District and school counts get a change and trend line too, even when the change is flat
    const districtTile = within((await screen.findByText('School Districts')).closest('a')!);
    expect(districtTile.getByText('166')).toBeInTheDocument();
    expect(districtTile.getByText('24/25')).toBeInTheDocument();
    expect(districtTile.getByText('0%')).toBeInTheDocument();
    expect(districtTile.getByText('No change since 2015-16')).toBeInTheDocument();
    expect(districtTile.getByText('166 run their own schools')).toBeInTheDocument();
    expect(districtTile.getByText('166 run schools')).toBeInTheDocument();
    const schoolTile = within(screen.getByText('Public Schools').closest('a')!);
    expect(schoolTile.getByText('442')).toBeInTheDocument();
    expect(schoolTile.getByText('Up 3% since 2015-16')).toBeInTheDocument();
    expect(schoolTile.getByText('excl. charter')).toBeInTheDocument();
    expect(screen.queryByText('Students who were truant')).not.toBeInTheDocument();
    expect(screen.getByText(/^Education Freedom Accounts/, { selector: 'h3' }).closest('a')).toHaveAttribute('href', '/state/efa');
    expect(screen.queryByText('What these terms mean')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
    // The largest page, and it also waits for the district and school lists
  }, 15000);

  it('academics leads with key figures, lists grades first, and names student groups plainly', async () => {
    renderPage(<StateAcademics />, '/state/academic');

    expect(await screen.findByText(sentence('In 2025-26, 44% of students were proficient in math, 55% in reading and 38% in science.'), undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText(sentence('22% at the highest level (4 of 4)'))).toBeInTheDocument();
    const gradeTable = screen.getByText('Percent proficient by grade, 2025-26');
    const groupTable = screen.getByText('Percent proficient by student group, 2025-26');
    expect(gradeTable.compareDocumentPosition(groupTable) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(screen.getByText('Grade 3').closest('tr')!).getByText('54%')).toBeInTheDocument();

    const iepRow = screen.getByText('Students with disabilities (IEP)').closest('tr')!;
    expect(within(iepRow).getByText('13%')).toBeInTheDocument();
    expect(within(iepRow).getByText('17%')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Disability' })).toBeInTheDocument();
  });

  it('academics shows the student group from the address, compared with all students', async () => {
    renderPage(<StateAcademics />, '/state/academic?group=9');

    expect(await screen.findByText(sentence('Students with disabilities (IEP), 2025-26: 13% proficient in math and 17% in reading.'), undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('For comparison, 44% of all students were proficient in math, so this group is 31 points below all students.')).toBeInTheDocument();
    expect(screen.getByText('Percent proficient by year: Students with disabilities (IEP)')).toBeInTheDocument();
    expect(screen.getByText(sentence('7% at the highest level (4 of 4); All students: 44%'))).toBeInTheDocument();
  });

  it('graduation leads with the rate and uses the same plan names in the table', async () => {
    renderPage(<StateOutcomes />, '/state/outcomes');
    expect(await screen.findByText(sentence('87.5% of the class of 2025 graduated in four years; 2.2% dropped out.'), undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Plans of the Class of 2025 (preliminary)')).toBeInTheDocument();
    expect(within(screen.getByText('Four-year college', { selector: 'th' }).closest('tr')!).getByText('50.0%')).toBeInTheDocument();
    expect(within(screen.getByText('All graduates').closest('tr')!).getByText('1,000')).toBeInTheDocument();
  });

  it('financials compares students and spending over the same ten years, and totals revenue', async () => {
    renderPage(<StateFinancials />, '/state/financials');
    expect(await screen.findByText(sentence(/^From 2014-15 to 2024-25, the number of students went down 9% while total spending went up 38% \(up \d+% after inflation\)\.$/), undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Revenue by source, 2024-25')).toBeInTheDocument();
    expect(within(screen.getByText('Local', { selector: 'th' }).closest('tr')!).getByText('75.0%')).toBeInTheDocument();
    expect(within(screen.getByText('Total').closest('tr')!).getByText('$4,000')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: "Show in today's dollars (adjusted for inflation)" })).toBeInTheDocument();
    expect(screen.getByText(/The vertical axis starts at \$\d+K, not zero\./)).toBeInTheDocument();
  });

  it('financials sends the district picker to the same page for that district', async () => {
    renderPage(<StateFinancials />, '/state/financials');
    const picker = await screen.findByLabelText('See these figures for your district', undefined, TIMEOUT);
    await userEvent.type(picker, 'Bed');
    await userEvent.click(await screen.findByRole('option', { name: 'Bedford' }));
    expect(await screen.findByText('At /district/7/financials')).toBeInTheDocument();
  });

  it('graduation explains when a district has no graduation page instead of opening an empty one', async () => {
    vi.mocked(fetchData).mockImplementation(async (url: string) => {
      if (url.includes('location/school')) return [];
      const fixture = fixtureFor(url);
      if (fixture === undefined) throw new Error(`No fixture for ${url}`);
      return structuredClone(fixture);
    });
    renderPage(<StateOutcomes />, '/state/outcomes');
    const picker = await screen.findByLabelText('See these figures for your district', undefined, TIMEOUT);
    await userEvent.type(picker, 'Ber');
    await userEvent.click(await screen.findByRole('option', { name: 'Berlin' }));
    expect(await screen.findByText(/^Berlin doesn't run its own schools; its students attend schools in other districts\. It has no Graduation page on this site\./)).toBeInTheDocument();
    expect(screen.getByText("Go to Berlin's overview").closest('a')).toHaveAttribute('href', '/district/3');
    expect(screen.queryByText(/^At \/district/)).not.toBeInTheDocument();
  });

  it('staff lists staff by type with the base year in the header', async () => {
    renderPage(<StateStaff />, '/state/staff');
    expect(await screen.findByText('Staff by type, 2024-25', undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Change since 2014-15' })).toBeInTheDocument();
    expect(within(screen.getByText('Teachers', { selector: 'th' }).closest('tr')!).getByText('−7%')).toBeInTheDocument();
    expect(within(screen.getByText('All staff').closest('tr')!).getByText('20,000')).toBeInTheDocument();

    // Key figures use the shared tile: short year, an arrow change colored by whether it's good,
    // and the change in words for screen readers
    const salaryTile = within(screen.getByText('Average Teacher Salary').closest('.MuiCard-root') as HTMLElement);
    expect(salaryTile.getByText('25/26')).toBeInTheDocument();
    expect(salaryTile.getByText(/^Since \d\d\/\d\d$/)).toBeInTheDocument();
    const salaryChange = salaryTile.getByText(/^Up \d+% since \d{4}-\d{2}$/).closest('p');
    expect(salaryChange).toHaveStyle({ color: '#2e7d32' });
  });

  it('enrollment compares grades with the year before the pandemic, not 2020-21', async () => {
    renderPage(<StateEnrollment />, '/state/enrollment');
    expect(await screen.findByText('Enrollment by grade, 2025-26', undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Change since 2019-20' })).toBeInTheDocument();
    expect(within(screen.getByText('Kindergarten', { selector: 'th' }).closest('tr')!).getByText('−6%')).toBeInTheDocument();
    expect(screen.getByText(/^Compared with 2019-20, before the pandemic/)).toBeInTheDocument();
  });

  it('safety gives truancy as a share of students and lists incidents by type', async () => {
    renderPage(<StateSafety />, '/state/safety');
    expect(await screen.findByText(sentence('In 2024-25, 30,546 students (18.8%) had 10 or more half-days of unexcused absence.'), undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Serious safety incidents')).toBeInTheDocument();
    expect(within(screen.getByText('Arson').closest('tr')!).getAllByText('3')).toHaveLength(2);
  });

  it('EFA marks the preliminary count and estimates aid by category', async () => {
    renderPage(<StateEfa />, '/state/efa');
    expect(await screen.findByText('Aid by category, 2026-27 (preliminary)', undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText(sentence("12,500 students have Education Freedom Accounts for 2026-27 (the state's preliminary count as of August 2, 2026), up from 10,000 in 2025-26."))).toBeInTheDocument();
    expect(within(screen.getByText('Base amount (every EFA student)').closest('tr')!).getByText('$50 million')).toBeInTheDocument();
    expect(screen.getByText('$4,160')).toBeInTheDocument();
    expect(screen.getByText('Children\'s Scholarship Fund NH').closest('a')).toHaveAttribute('href', 'https://nh.scholarshipfund.org/apply/nh-education-freedom-accounts');
  });
});

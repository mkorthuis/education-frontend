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
    // Students: the latest October 1 public school count (the fixture's 2025-26), in thousands on phones
    const studentsTile = within(screen.getByText('Students', { selector: 'p' }).closest('a')!);
    expect(studentsTile.getByText('29,894')).toBeInTheDocument();
    expect(studentsTile.getByText('30K')).toBeInTheDocument();
    expect(studentsTile.getByText('25/26')).toBeInTheDocument();
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
    expect(gradTile.getByText('24/25')).toBeInTheDocument();
    // Phones show shorter titles on some tiles
    expect(gradTile.getByText('Graduation Rate')).toBeInTheDocument();
    expect(screen.getByText('Total Spending')).toBeInTheDocument();
    expect(screen.getByText("EFA's")).toBeInTheDocument();
    expect(gradTile.getByText('Since 14/15')).toBeInTheDocument();
    expect(screen.getByText('Teachers').closest('a')).not.toHaveTextContent('students per teacher');
    expect(screen.queryByText(/estimated state aid/)).not.toBeInTheDocument();
    // Students and staff come first, then financials, then results; district and school counts replace truancy
    expect(screen.getByText('Key Statewide Figures').tagName).toBe('H2');
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
    // The takeaway is the intro's second paragraph, beside the tiles on wide screens
    expect(await screen.findByText(sentence(/From 2014-15 to 2024-25, the number of students went down 9% while total spending went up 38% \(up \d+% after inflation\)\./), undefined, TIMEOUT)).toBeInTheDocument();
    // Support services ($150M to $200M) and the state's share of revenue (33.3% to 25%) since 2014-15
    expect(screen.getByText(sentence(/Spending on support services increased 33% since 2014-15\. Meanwhile, the state's share of school funding decreased 25%\./))).toBeInTheDocument();
    // Revenue by source, 2024-25 against 2014-15, without shares
    expect(screen.getByText('Revenue By Source')).toBeInTheDocument();
    const localRow = within(screen.getByText('Local', { selector: 'th' }).closest('tr')!);
    expect(localRow.getByText('$3,000')).toBeInTheDocument();
    expect(localRow.getByText('$2,000')).toBeInTheDocument();
    expect(localRow.getByText('+50%')).toBeInTheDocument();
    expect(localRow.queryByText('75.0%')).not.toBeInTheDocument();
    const revenueTable = screen.getByText('Local', { selector: 'th' }).closest('table')!;
    const totalRow = within(within(revenueTable).getByText('Total').closest('tr')!);
    expect(totalRow.getByText('$4,000')).toBeInTheDocument();
    expect(totalRow.getByText('$3,000')).toBeInTheDocument();
    // Its inflation button restates 2014-15 in 2024-25 dollars
    const buttons = screen.getAllByRole('button', { name: 'Adj. For Inflation' });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(buttons[buttons.length - 1]).toHaveAttribute('aria-pressed', 'true');
    expect(localRow.queryByText('$2,000')).not.toBeInTheDocument();
    // The revenue chart has no Chart/Table toggle, and no CSV links anywhere
    expect(screen.queryByRole('button', { name: 'Table' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
    // Cost per student has the Adj. For Inflation button (between the spending and revenue tables') and no notes
    expect(buttons).toHaveLength(3);
    expect(screen.queryByText(/The vertical axis starts at/)).not.toBeInTheDocument();
    expect(screen.queryByText(/adjusted for inflation with the Consumer Price Index/)).not.toBeInTheDocument();
    // One Excel download for the whole page
    expect(screen.getByRole('button', { name: 'Download Excel' })).toBeEnabled();
    // No "Not on this page" box or source line
    expect(screen.queryByText('Not on this page')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
  });

  it('financials breaks spending down by category, compared with 2014-15', async () => {
    renderPage(<StateFinancials />, '/state/financials');
    expect(await screen.findByText('Spending Breakdown By Year', undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Compare spending with' })).toHaveTextContent('Compare 14/15');
    // Each category is an accordion: closed, it shows the category's totals
    const line = (name: string) => within(screen.getByText(name, { selector: 'td, th' }).closest('tr')!);
    const category = (name: string) => screen.getByRole('button', { name });
    const categoryRow = (name: string) => within(category(name).closest('tr')!);
    expect(category('Instruction')).toHaveAttribute('aria-expanded', 'false');
    expect(categoryRow('Instruction').getByText('$1.50B')).toBeInTheDocument();
    expect(categoryRow('Instruction').getByText('$1.00B')).toBeInTheDocument();
    // Special education is its own category, opening to its one line
    expect(categoryRow('Special Education').getByText('$800.0M')).toBeInTheDocument();
    expect(categoryRow('Special Education').getByText('$400.0M')).toBeInTheDocument();
    expect(categoryRow('Support Services').getByText('$200.0M')).toBeInTheDocument();
    expect(categoryRow('Other Spending').getByText('$100.0M')).toBeInTheDocument();
    expect(screen.queryByText('Regular Instruction')).not.toBeInTheDocument();
    // Opened, its DOE-25 lines under readable names, with the latest year, 2014-15 and the change
    await userEvent.click(category('Instruction'));
    expect(category('Instruction')).toHaveAttribute('aria-expanded', 'true');
    expect(line('Regular Instruction').getByText('$1.50B')).toBeInTheDocument();
    expect(line('Regular Instruction').getByText('$1.00B')).toBeInTheDocument();
    await userEvent.click(category('Special Education'));
    expect(screen.getAllByText('Special Education', { selector: 'td, th' })).toHaveLength(1);
    await userEvent.click(category('Support Services'));
    expect(line('Transportation').getByText('$200.0M')).toBeInTheDocument();
    await userEvent.click(category('Other Spending'));
    expect(line('Debt Interest').getByText('$100.0M')).toBeInTheDocument();
    // Bond principal and fund transfers are left out, as NH DOE's total leaves them out
    expect(line('All Spending').getByText('$2.60B')).toBeInTheDocument();
    expect(line('All Spending').getByText('$1.60B')).toBeInTheDocument();
    expect(screen.queryByText('Debt Payments')).not.toBeInTheDocument();
    // Closing a category hides its lines again
    await userEvent.click(category('Instruction'));
    expect(screen.queryByText('Regular Instruction')).not.toBeInTheDocument();
    await userEvent.click(category('Instruction'));
    expect(screen.getByText('Where School Spending Goes')).toBeInTheDocument();
    // The chart's shares leave out principal and transfers too: $1.5B of $2.6B is instruction. It
    // shows one category at a time, Instruction first
    expect(screen.getByText(/^Line chart\.[^]*Instruction: 62\.5% in 2014-15 and 57\.7% in 2024-25\. The table/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Show spending category' }));
    await userEvent.click(screen.getByRole('option', { name: 'Special Education' }));
    expect(screen.getByText(/^Line chart\.[^]*Special Education: 25\.0% in 2014-15 and 30\.8% in 2024-25\. The table/)).toBeInTheDocument();
    // Adjusted for inflation, the latest year stays as spent and 2014-15 is restated in 2024-25 dollars
    // The spending table's button is the first on the page
    await userEvent.click(screen.getAllByRole('button', { name: 'Adj. For Inflation' })[0]);
    expect(screen.getAllByRole('button', { name: 'Adj. For Inflation' })[0]).toHaveAttribute('aria-pressed', 'true');
    expect(line('Regular Instruction').getByText('$1.50B')).toBeInTheDocument();
    expect(line('Regular Instruction').queryByText('$1.00B')).not.toBeInTheDocument();
  });

  it('financials has no district picker', async () => {
    renderPage(<StateFinancials />, '/state/financials');
    expect(await screen.findByText('Revenue By Source', undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.queryByLabelText('See these figures for your district')).not.toBeInTheDocument();
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

  it('staff compares staff by type with 2014-15 by default', async () => {
    renderPage(<StateStaff />, '/state/staff');
    expect(await screen.findByText('Staff By Type', undefined, TIMEOUT)).toBeInTheDocument();
    // Both tables put the latest year next to 2014-15
    expect(screen.getAllByRole('columnheader', { name: /^2024-25/ })).toHaveLength(2);
    expect(screen.getAllByRole('columnheader', { name: /^2014-15/ })).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: 'Compare staff with' })).toHaveTextContent('Compare 14/15');
    // The district Staff page's staff type names, in its order
    const teachers = within(screen.getAllByText('Teacher')[0].closest('tr')!);
    expect(teachers.getByText('15,000')).toBeInTheDocument();
    expect(teachers.getByText('−7%')).toBeInTheDocument();
    // A type the earlier year doesn't have shows a dash and no change
    expect(within(screen.getAllByText('Instruction Support')[0].closest('tr')!).getAllByText('—')).toHaveLength(2);
    expect(within(screen.getByText('All Staff').closest('tr')!).getByText('20,000')).toBeInTheDocument();
    expect(screen.getByLabelText('Staff who support classroom instruction but are not classroom teachers')).toBeInTheDocument();

    // Teacher education compares the same way, degrees in order
    expect(screen.getByRole('combobox', { name: 'Compare teacher education with' })).toHaveTextContent('Compare 14/15');
    const bachelors = within(screen.getByText("Bachelor's", { selector: 'th' }).closest('tr')!);
    expect(bachelors.getByText('5,000')).toBeInTheDocument();
    expect(bachelors.getByText('6,000')).toBeInTheDocument();
    expect(bachelors.getByText('−17%')).toBeInTheDocument();
    expect(within(screen.getByText('All Teachers').closest('tr')!).getAllByText('13,000')).toHaveLength(2);
    expect(screen.queryByText("Teachers' highest degree")).not.toBeInTheDocument();
    // The class size tile is the statewide average for all grades
    const classTile = within(screen.getAllByText('Average Class Size').map(el => el.closest('.MuiCard-root')).find(Boolean) as HTMLElement);
    expect(classTile.getByText('15.3')).toBeInTheDocument();
    expect(classTile.getByText('24/25')).toBeInTheDocument();
    // Average class size starts with NH DOE's statewide average for all grades, then by grade level
    const classSizeView = screen.getByRole('combobox', { name: 'Show average class size' });
    expect(classSizeView).toHaveTextContent('All Students');
    expect(screen.getByText('Students per Class, All Grades')).toBeInTheDocument();
    await userEvent.click(classSizeView);
    await userEvent.click(await screen.findByRole('option', { name: 'By Grade Level' }));
    expect(screen.getByText('Students per Class By Grade Level')).toBeInTheDocument();
    // and students per teacher, titled as such
    await userEvent.click(classSizeView);
    await userEvent.click(await screen.findByRole('option', { name: 'Students per Teacher' }));
    expect(screen.getByText('Students Divided By Full-Time-Equivalent Teachers')).toBeInTheDocument();
    // The staff share chart picks a staff type, teachers first
    expect(screen.getByRole('combobox', { name: 'Show staff type' })).toHaveTextContent('Teachers');
    expect(screen.getByText('As % of Staff')).toBeInTheDocument();
    // Titles, headers and labels in Title Case
    ['Teacher Education', 'Percent Change in Staff', 'Students Divided By Full-Time-Equivalent Teachers'].forEach(text =>
      expect(screen.getByText(text)).toBeInTheDocument());

    // Key figures use the shared tile: short year, an arrow change colored by whether it's good,
    // and the change in words for screen readers
    // The salary chart shares the tile's name
    const salaryTile = within(screen.getAllByText('Average Teacher Salary').map(el => el.closest('.MuiCard-root')).find(Boolean) as HTMLElement);
    expect(salaryTile.getByText('25/26')).toBeInTheDocument();
    expect(salaryTile.getByText(/^Since \d\d\/\d\d$/)).toBeInTheDocument();
    const salaryChange = salaryTile.getByText(/^Up \d+% since \d{4}-\d{2}$/).closest('p');
    expect(salaryChange).toHaveStyle({ color: '#2e7d32' });
    expect(salaryTile.queryByText(/after inflation$/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('See these figures for your district')).not.toBeInTheDocument();

    // The salary chart is one State Average line, in actual or inflation-adjusted dollars
    expect(screen.getByText('(Annual Salary)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Adj. For Inflation' }));
    expect(screen.getByText(/^\(Annual Salary in \d{4}-\d{2} Dollars\)$/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /as CSV$/ })).not.toBeInTheDocument();
    // One Excel download for the whole page
    expect(screen.getByRole('button', { name: 'Download Excel' })).toBeInTheDocument();
    // No "Not on this page" box or source line
    expect(screen.queryByText('Not on this page')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
  });

  it('enrollment compares the tiles, type of school and grades with 2014-15', async () => {
    renderPage(<StateEnrollment />, '/state/enrollment');
    expect(await screen.findByText('Public School Enrollment By Grade, 2025-26', undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader', { name: /^Change Since 2014-15/ })[0]).toBeInTheDocument();
    expect(within(screen.getByText('Kindergarten', { selector: 'th' }).closest('tr')!).getByText('+6%')).toBeInTheDocument();
    // All three tiles compare with 2014-15; no district picker, note box or source line
    const tile = (label: string) => screen.getAllByText(label, { selector: 'p' }).map(element => element.closest('.MuiCard-root')).find(Boolean);
    expect(tile('Kindergarten')).toHaveTextContent('Up 6% since 2014-15');
    expect(tile('Grade 12')).toHaveTextContent('Up 2% since 2014-15');
    // The students chart shows all students, the three levels, or one grade
    await userEvent.click(screen.getByRole('combobox', { name: 'Show public school students' }));
    await userEvent.click(await screen.findByRole('option', { name: 'By Level' }));
    expect(await screen.findByText('Elementary (K-5)')).toBeInTheDocument();
    expect(screen.getByText('# of Students By Level')).toBeInTheDocument();
    // One Excel download for the page in place of CSV links
    expect(screen.getByRole('button', { name: 'Download Excel' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /as CSV$/ })).not.toBeInTheDocument();
    // No Chart/Table toggle on any enrollment chart
    expect(screen.queryByRole('button', { name: 'Table' })).not.toBeInTheDocument();
    // Charter schools beside district schools, from the state's enrollment by type of school
    expect(await screen.findByText('Enrollment by Type of School, 2024-25')).toBeInTheDocument();
    expect(within(screen.getByText('Charter Schools', { selector: 'th' }).closest('tr')!).getByText('+140%')).toBeInTheDocument();
    expect(screen.getByText(/^Private School Counts unavailable for 25\/26\. Displaying 24\/25\. EFA Students not counted here\.$/)).toBeInTheDocument();
    expect(within(screen.getByText('Private Schools', { selector: 'th' }).closest('tr')!).getByText('16,700')).toBeInTheDocument();
    expect(screen.getByText('All Schools', { selector: 'th' })).toBeInTheDocument();
    expect(screen.queryByLabelText('See these figures for your district')).not.toBeInTheDocument();
    expect(screen.queryByText('Not on this page')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
  });

  it('safety gives truancy as a share of students and lists incidents by type', async () => {
    renderPage(<StateSafety />, '/state/safety');
    // The takeaway is the intro's second paragraph, beside the tiles on wide screens, built from the data
    expect(await screen.findByText(sentence(new RegExp(
      '^What New Hampshire\'s public schools report .*'
      + 'Truancy has about doubled since 2015-16: 18\\.8% of students \\(30,546\\) missed 10 or more half-days without an excuse in 2024-25, up from 9\\.1%\\. '
      + 'Bullying reports and restraints are down, but seclusions are up 36%\\.$'
    )), undefined, TIMEOUT)).toBeInTheDocument();
    // Phones get a short truancy title and subtitle
    expect(screen.getByText('% Students Truant')).toBeInTheDocument();
    expect(screen.getByText('10+ Half Days Unexcused')).toBeInTheDocument();
    // Titles, subtitles and labels in Title Case
    ['Serious Safety Incidents', 'Share of Students Who Were Truant', 'Bullying Reports', 'Restraints and Seclusions', 'Other Serious Incidents'].forEach(text =>
      expect(screen.getAllByText(text).length).toBeGreaterThan(0));
    // Incidents compare the latest year with the earliest (there's no 2014-15), like the Staff page's tables
    expect(screen.getByRole('combobox', { name: 'Compare incidents with' })).toHaveTextContent('Compare 15/16');
    const arson = within(screen.getByText('Arson').closest('tr')!);
    expect(arson.getByText('3')).toBeInTheDocument();
    expect(arson.getByText('4')).toBeInTheDocument();
    expect(arson.getByText('−25%')).toBeInTheDocument();
    expect(screen.getByText('All Serious Incidents')).toBeInTheDocument();
    // One Excel download for the whole page
    expect(screen.getByRole('button', { name: 'Download Excel' })).toBeEnabled();
    // No "Not on this page" box or source line
    expect(screen.queryByText('Not on this page')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('See these figures for your district')).not.toBeInTheDocument();
  });

  it('EFA says once that the latest count is preliminary and estimates aid by category', async () => {
    renderPage(<StateEfa />, '/state/efa');
    expect(await screen.findByText('Aid by Category, 2026-27', undefined, TIMEOUT)).toBeInTheDocument();
    // Preliminary is said once, in the intro, not on each tile and chart
    expect(screen.getByText(/2026-27 numbers are preliminary; other years are final\./)).toBeInTheDocument();
    expect(screen.queryAllByText(/preliminary/i)).toHaveLength(1);
    expect(screen.queryByText(/students have Education Freedom Accounts for/)).not.toBeInTheDocument();
    expect(screen.queryByText(/At the state's per-student aid amounts/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('See these figures for your district')).not.toBeInTheDocument();
    expect(screen.getByText('In Addition to Base Amount')).toBeInTheDocument();
    // Special education aid beside the share of all public school students with a disability
    expect(await screen.findByText('State Special Education')).toBeInTheDocument();
    expect(screen.getByText('Dashed lines: All New Hampshire public school students, through 2025-26.')).toBeInTheDocument();
    expect(screen.queryByText(/English learner/)).not.toBeInTheDocument();
    expect(screen.queryByText('Not on this page')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Source:/)).not.toBeInTheDocument();
    expect(within(screen.getByText('Base Amount (Every EFA Student)').closest('tr')!).getByText('$50 Million')).toBeInTheDocument();
    expect(screen.getByText('$4,160')).toBeInTheDocument();
    expect(screen.getByText('Children\'s Scholarship Fund NH').closest('a')).toHaveAttribute('href', 'https://nh.scholarshipfund.org/apply/nh-education-freedom-accounts');
  });

  it('EFA grants chart switches between a count and a share of enrollment, with no table toggle', async () => {
    renderPage(<StateEfa />, '/state/efa');
    expect(await screen.findByText('EFA Grants By Year', undefined, TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('Number of Students')).toBeInTheDocument();
    // One Excel download for the whole page, in place of each chart's CSV
    expect(screen.getByRole('button', { name: 'Download Excel' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /as CSV$/ })).not.toBeInTheDocument();
    // No Chart/Table toggle on any EFA chart
    expect(screen.queryByRole('button', { name: 'Table' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Show EFA grants as' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Percentage' }));
    expect(await screen.findByText('Percentage of Public School Enrollment')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Show EFA grants as' })).toHaveTextContent('Percentage');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { store } from '@/store/store';
import { fetchData } from '@/services/api/utils/apiUtils';
import { fetchAllSchoolData, fetchDistrictById } from '@/store/slices/locationSlice';
import { fixtureFor } from '@/features/state/test/stateApiFixtures';
import School from '../pages/School';
import SchoolEnrollment from '../components/Enrollment';
import BackToDistrict from '@/components/layout/public/BackToDistrict';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api/utils/apiUtils')>();
  return { ...actual, fetchData: vi.fn() };
});

const grades = (...names: string[]) => names.map(name => ({
  id: ['Preschool', 'Kindergarten', ...Array.from({ length: 12 }, (_, n) => `Grade ${n + 1}`)].indexOf(name) + 1,
  name,
}));
const HIGH = grades('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12');
const PK5 = grades('Preschool', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5');
const K6 = grades('Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6');

// Test results for all students in all grades, at a school or across its district
const result = (place: { school_id?: number; district_id: number }, year: number, subject: number, proficient: number) => ({
  id: (place.school_id ?? place.district_id) * 100000 + year * 10 + subject,
  year,
  school_id: place.school_id ?? null,
  district_id: place.district_id,
  assessment_subgroup_id: 1,
  assessment_subject_id: subject,
  grade_id: null,
  level_4_percentage: null,
  above_proficient_percentage: proficient,
  above_proficient_percentage_exception: null,
});
const enrollment = (schoolId: number, counts: Record<number, number>) =>
  Object.entries(counts).map(([year, count], index) => ({ id: schoolId * 100 + index, school_id: schoolId, grade_id: 11, year: Number(year), enrollment: count }));

const CONCORD = { id: 111, name: 'Concord', sau_id: 8, is_public: true, towns: [111], grades: [...PK5, ...HIGH] };
const JACKSON = { id: 271, name: 'Jackson', sau_id: 9, is_public: true, towns: [271], grades: K6 };
const CONCORD_HIGH = { id: 20, name: 'Concord High School', district_id: 111, town_id: 111, city: 'CONCORD', grades: HIGH };
const ABBOT_DOWNING = { id: 21, name: 'Abbot-Downing School', district_id: 111, grades: PK5 };
// A town that isn't one of the district's: the school's city stands in, in title case
const JACKSON_GRAMMAR = { id: 30, name: 'Jackson Grammar School', district_id: 271, town_id: 999, city: 'JACKSON', grades: K6 };
// A charter school: its "district" is its own board, which serves no town; Conway's district serves its town
const CONWAY = { id: 113, name: 'Conway', sau_id: 9, is_public: true, kind: 'district', towns: [113], grades: [...K6, ...HIGH] };
const ROBERT_FROST_BOARD = { id: 750, name: 'Robert Frost Charter School', sau_id: 450, is_public: false, kind: 'charter', towns: [], grades: HIGH };
const ROBERT_FROST = { id: 40, name: 'Robert Frost Charter School (H)', district_id: 750, town_id: 113, city: 'CONWAY', grades: HIGH, kind: 'charter' };
// A charter school that opened after the latest figures the state has published
const NEW_BOARD = { id: 751, name: 'Breakthrough Academy', sau_id: 451, is_public: false, kind: 'charter', towns: [], grades: HIGH };
const NEW_CHARTER = {
  id: 41, name: 'Breakthrough Academy (H)', district_id: 751, town_id: 113, city: 'CONWAY', grades: HIGH, kind: 'charter',
  open_date: '2026-09-01', not_yet_reported: ['enrollment', 'test_scores', 'graduation', 'safety'],
};

// Responses by path under /api/v1/ and the school or district asked about; anything else is statewide
const FIXTURES: Record<string, unknown> = {
  'location/school/20': CONCORD_HIGH,
  'location/school/21': ABBOT_DOWNING,
  'location/school/30': JACKSON_GRAMMAR,
  'location/district?school_id=20': [CONCORD],
  'location/district?school_id=21': [CONCORD],
  'location/district?school_id=30': [JACKSON],
  'location/district/271': JACKSON,
  'location/school?district_id=111': [CONCORD_HIGH, ABBOT_DOWNING],
  'location/school?district_id=271': [JACKSON_GRAMMAR],
  'location/town?district_id=111': [{ id: 111, name: 'Concord' }],
  'location/town?district_id=271': [{ id: 271, name: 'Jackson' }],
  'location/sau?district_id=111': [{ id: 8, name: 'Concord SAU Office' }],
  'location/sau?district_id=271': [{ id: 9, name: 'SAU 9 Office' }],
  'location/school/40': ROBERT_FROST,
  'location/district?school_id=40': [ROBERT_FROST_BOARD],
  'location/school?district_id=750': [ROBERT_FROST],
  'location/town?district_id=750': [],
  'location/sau?district_id=750': [{ id: 450, name: 'Robert Frost Charter School' }],
  'location/school/41': NEW_CHARTER,
  'location/district?school_id=41': [NEW_BOARD],
  'location/school?district_id=751': [NEW_CHARTER],
  'location/town?district_id=751': [],
  'location/sau?district_id=751': [{ id: 451, name: 'Breakthrough Academy' }],
  'enrollment/school/41': [],
  'assessment/school?school_id=41': [],
  'outcome/outcome/graduation-cohort/school?school_id=41': [],
  'outcome/outcome/post-graduation/school?school_id=41': [],
  // The public districts, with the towns they serve
  'location/district': [CONCORD, JACKSON, CONWAY],
  'enrollment/school/40': enrollment(40, { 2016: 40, 2025: 52 }),
  'assessment/school?school_id=40': [result({ school_id: 40, district_id: 750 }, 2026, 1, 27)],
  'outcome/outcome/graduation-cohort/school?school_id=40': [{ school_id: 40, year: 2025, cohort_size: 12, graduate: 9, earned_hiset: 0, dropped_out: 1 }],
  'outcome/outcome/post-graduation/school?school_id=40': [],
  'enrollment/school/20': enrollment(20, { 2016: 1700, 2025: 1394 }),
  'enrollment/school/21': enrollment(21, { 2016: 434, 2025: 343 }),
  'enrollment/school/30': enrollment(30, { 2016: 37, 2025: 37 }),
  'assessment/school?school_id=20': [result({ school_id: 20, district_id: 111 }, 2015, 1, 31), result({ school_id: 20, district_id: 111 }, 2026, 1, 19), result({ school_id: 20, district_id: 111 }, 2026, 2, 58)],
  'assessment/school?school_id=21': [result({ school_id: 21, district_id: 111 }, 2026, 1, 55), result({ school_id: 21, district_id: 111 }, 2026, 2, 54)],
  'assessment/school?school_id=30': [result({ school_id: 30, district_id: 271 }, 2026, 1, 63), result({ school_id: 30, district_id: 271 }, 2026, 2, 69)],
  'assessment/district?district_id=111': [result({ district_id: 111 }, 2026, 1, 41), result({ district_id: 111 }, 2026, 2, 55)],
  'outcome/outcome/graduation-cohort/school?school_id=20': [
    { school_id: 20, year: 2015, cohort_size: 300, graduate: 246, earned_hiset: 0, dropped_out: 5 },
    { school_id: 20, year: 2025, cohort_size: 371, graduate: 271, earned_hiset: 13, dropped_out: 4 },
  ],
  'outcome/outcome/post-graduation/school?school_id=20': [
    { school_id: 20, year: 2025, value: 60, post_graduation_type: { id: 1, name: '4 Year College' } },
    { school_id: 20, year: 2025, value: 40, post_graduation_type: { id: 4, name: 'Employed' } },
  ],
};

const respond = (url: string): unknown => {
  const [rawPath, query = ''] = url.split('?');
  const path = rawPath.replace(/^\/api\/v1\//, '');
  const params = new URLSearchParams(query);
  const place = params.has('school_id') ? `?school_id=${params.get('school_id')}` : params.has('district_id') ? `?district_id=${params.get('district_id')}` : '';
  return FIXTURES[path + place] ?? (place ? undefined : fixtureFor(url));
};

// Every request is answered from the fixtures; a request with no fixture fails the page loudly.
// Set before each test because the Vitest config resets mocks.
beforeEach(() => {
  // As in .env.development and .env.production, which tests don't load
  vi.stubEnv('VITE_GRADUATION_GRADE', 'Grade 12');
  vi.mocked(fetchData).mockImplementation(async (url: string) => {
    const fixture = respond(url);
    if (fixture === undefined) throw new Error(`No fixture for ${url}`);
    return structuredClone(fixture);
  });
});

const renderSchool = async (id: number) => {
  await store.dispatch(fetchAllSchoolData(id));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/school/${id}`]}>
        <Routes>
          <Route path="/school/:id" element={<School />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

const TIMEOUT = { timeout: 3000 };
// Text queries and direct lookups: role queries by name walk every element of these long pages
const nav = (label: string) => document.querySelector<HTMLElement>(`nav[aria-label="${label}"]`);
const linkTo = (text: string) => screen.getByText(text).closest('a')!;

describe('School overview', () => {
  it('shows the school, its district, its pages and the district\'s other schools, with figures beside the district\'s and state\'s', async () => {
    await renderSchool(20);
    expect(screen.getByText('Concord High School', { selector: 'h1' })).toBeInTheDocument();
    // From tablets up, the district is a link in the line under the title (phones have the back link)
    const districtLink = screen.getByText('Concord School District', { selector: 'a' });
    expect(districtLink).toHaveAttribute('href', '/district/111');
    expect(districtLink.parentElement).toHaveTextContent('Located in Concord · Concord School District · Grades 9-12');

    const pages = nav('Concord High School pages')!;
    expect(pages.querySelectorAll('a')).toHaveLength(5);
    expect(pages.querySelector('[aria-disabled="true"]')).toBeNull();
    expect(linkTo('Academic Performance')).toHaveAttribute('href', '/school/20/academic');

    // The district's own pages for what's reported district-wide
    const districtWide = [...nav('Concord School District data for the whole district')!.querySelectorAll('a')];
    expect(districtWide.map(link => [link.querySelector('h4')?.textContent, link.getAttribute('href')])).toEqual([
      ['Financials', '/district/111/financials'],
      ['Staff', '/district/111/staff'],
      ['Education Freedom Accounts', '/district/111/efa'],
    ]);
    expect(screen.getByText('District-Wide Data', { selector: 'h3' })).toBeInTheDocument();

    // The district's other schools, not this one
    const others = [...nav('Other schools in Concord School District')!.querySelectorAll('a')];
    expect(others.map(link => link.textContent)).toEqual(['Abbot-Downing SchoolPK-5']);
    expect(others[0]).toHaveAttribute('href', '/school/21');

    expect(await screen.findByText('1,394', {}, TIMEOUT)).toBeInTheDocument();
    expect(linkTo('Proficient in Math')).toHaveTextContent(/19%.*District 41%\s*Statewide 44%/);
    // The district's only high school: its graduation rate would be the district's, so only the state's
    const graduation = linkTo('Four-Year Graduation Rate');
    expect(graduation).toHaveTextContent('73.0%');
    expect(graduation).toHaveTextContent('Statewide 87.5%');
    expect(graduation).not.toHaveTextContent('District');
  });

  it('greys out graduation for a school without a grade 12', async () => {
    await renderSchool(21);
    const graduation = screen.getByText('Graduation / College').closest('[aria-disabled="true"]') as HTMLElement;
    expect(graduation).not.toBeNull();
    expect(within(graduation).getByText('Not available: no grade 12')).toBeInTheDocument();
    expect(await screen.findByText('343', {}, TIMEOUT)).toBeInTheDocument();
    expect(screen.queryByText('Four-Year Graduation Rate')).not.toBeInTheDocument();
  });

  it('compares a district\'s only school with the state alone', async () => {
    await renderSchool(30);
    expect(nav('Other schools in Jackson School District')).toBeNull();
    expect(screen.getByText('Jackson School District', { selector: 'a' }).parentElement).toHaveTextContent('Located in Jackson · Jackson School District · Grades K-6');
    expect(screen.queryByText('Other Schools in the District')).not.toBeInTheDocument();
    // No district test scores are requested: they'd be this school's own (an unexpected request fails)
    expect(await screen.findByText('63%', {}, TIMEOUT)).toBeInTheDocument();
    expect(linkTo('Proficient in Math')).toHaveTextContent('Statewide 44%');
    expect(linkTo('Proficient in Math')).not.toHaveTextContent('District');
  });

  it('shows a charter school with the district serving its town, never its own board as a district', async () => {
    await renderSchool(40);
    // The town is the link to its district, which is named for it
    const conway = await screen.findByText('Conway', { selector: 'a' }, TIMEOUT);
    expect(conway).toHaveAttribute('href', '/district/113');
    expect(conway).toHaveAttribute('aria-label', 'Conway School District');
    expect(conway.parentElement).toHaveTextContent('Located in Conway · Public charter school · Grades 9-12');
    expect(screen.queryByText(/Robert Frost Charter School School District/)).not.toBeInTheDocument();
    expect(screen.queryByText('District-Wide Data')).not.toBeInTheDocument();
    expect(screen.getByText('About Charter Schools')).toBeInTheDocument();
    // Compared with the state alone (a request for its board's test scores would fail)
    expect(await screen.findByText('27%', {}, TIMEOUT)).toBeInTheDocument();
    expect(linkTo('Proficient in Math')).toHaveTextContent('Statewide 44%');
    expect(linkTo('Proficient in Math')).not.toHaveTextContent('District');
  });
});

describe('A school that opened after the latest figures', () => {
  it('says under its facts when it opened and that state data is minimal, and greys out the pages with no data, keeping their lines', async () => {
    await renderSchool(41);
    expect(screen.getByText('School Opened on September 1, 2026. State data currently minimal.')).toHaveStyle({ fontStyle: 'italic' });
    const pages = nav('Breakthrough Academy (H) pages')!;
    const greyed = (title: string) => within(pages).getByText(title).closest('[aria-disabled="true"]') as HTMLElement;
    expect(within(greyed('Academic Performance')).getByText('Test scores by subject and grade')).toBeInTheDocument();
    expect(within(greyed('Graduation / College')).getByText("Graduation and graduates' plans")).toBeInTheDocument();
    expect(within(greyed('Safety')).getByText('Bullying, truancy and incidents')).toBeInTheDocument();
    expect(within(greyed('Enrollment')).getByText('Students by year and grade')).toBeInTheDocument();
    expect(within(greyed('Enrollment')).getByText('School Opened on September 1, 2026. No state data yet.')).toBeInTheDocument();
    expect(within(pages).getByText('Contact Information').closest('[aria-disabled="true"]')).toBeNull();
  });

  it('says nothing of the kind for a school the state has reported on', async () => {
    await renderSchool(40);
    expect(screen.queryByText(/State data currently minimal/)).not.toBeInTheDocument();
  });

  it('says in one line that there\'s no enrollment, rather than showing empty charts and projected zeros', async () => {
    await store.dispatch(fetchAllSchoolData(41));
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/school/41/enrollment']}>
          <SchoolEnrollment />
        </MemoryRouter>
      </Provider>
    );
    expect(await screen.findByText('The state hasn\'t reported enrollment for this school.', {}, TIMEOUT)).toBeInTheDocument();
    expect(screen.queryByText('Enrollment Projections')).not.toBeInTheDocument();
    // The page says why, as the overview does
    expect(screen.getByText('School Opened on September 1, 2026. State data currently minimal.')).toBeInTheDocument();
  });
});

describe('Back to the district', () => {
  const renderAt = (path: string) =>
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <BackToDistrict />
        </MemoryRouter>
      </Provider>
    );

  it('links a charter school to the district serving its town', async () => {
    await store.dispatch(fetchAllSchoolData(40));
    renderAt('/school/40/academic');
    const back = await screen.findByRole('link', { name: 'Back to Conway School District' }, TIMEOUT);
    expect(back).toHaveAttribute('href', '/district/113');
  });

  it('links every school page back to the school\'s district', async () => {
    await store.dispatch(fetchAllSchoolData(20));
    renderAt('/school/20/academic');
    const back = screen.getByRole('link', { name: 'Back to Concord School District' });
    expect(back).toHaveAttribute('href', '/district/111');
    expect(back).toHaveTextContent('Concord School District');
  });

  it('shows nothing off school pages, or before the school\'s own district is loaded', async () => {
    await store.dispatch(fetchAllSchoolData(20));
    const { unmount } = renderAt('/district/111');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    unmount();
    // A district left over from an earlier page isn't this school's
    await store.dispatch(fetchDistrictById(271));
    renderAt('/school/20');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

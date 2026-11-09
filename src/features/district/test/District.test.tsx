import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { store } from '@/store/store';
import { fetchData } from '@/services/api/utils/apiUtils';
import { fetchAllDistrictData } from '@/store/slices/locationSlice';
import { fixtureFor } from '@/features/state/test/stateApiFixtures';
import District from '../pages/District';
import { districtFacts, districtPhoneTitle, listNames } from '../utils/labels';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api/utils/apiUtils')>();
  return { ...actual, fetchData: vi.fn() };
});

const grades = (...names: string[]) => names.map(name => ({
  id: ['Preschool', 'Kindergarten', ...Array.from({ length: 12 }, (_, n) => `Grade ${n + 1}`)].indexOf(name) + 1,
  name,
}));
const K8 = grades('Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8');
const PK5 = grades('Preschool', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5');
const HIGH = grades('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12');

// District test results for all students in all grades; a null share with an exception is one the
// state withheld as under 10% or over 90%
const result = (districtId: number, year: number, subject: number, proficient: number | null, exception: string | null = null) => ({
  id: districtId * 100000 + year * 10 + subject,
  year,
  district_id: districtId,
  school_id: null,
  assessment_subgroup_id: 1,
  assessment_subject_id: subject,
  grade_id: null,
  level_4_percentage: null,
  above_proficient_percentage: proficient,
  above_proficient_percentage_exception: exception,
});
const plans = (districtId: number, year: number, counts: Record<string, number>) =>
  Object.entries(counts).map(([name, value], index) => ({ district_id: districtId, year, value, post_graduation_type: { id: index + 1, name } }));

// Each district's responses, by path under /api/v1/; anything else is a statewide request
const DISTRICTS: Record<number, Record<string, unknown>> = {
  111: {
    'location/district/111': { id: 111, name: 'Concord', sau_id: 8, is_public: true, towns: [111], grades: [...PK5, ...grades('Grade 6', 'Grade 7', 'Grade 8'), ...HIGH] },
    'location/school': [
      { id: 2, name: 'Concord High School', district_id: 111, grades: HIGH },
      { id: 1, name: 'Abbot-Downing School', district_id: 111, grades: PK5 },
    ],
    'location/town': [{ id: 111, name: 'Concord' }],
    'location/sau': [{ id: 8, name: 'Concord SAU Office' }],
    'finance/per-pupil/district': [
      { id: 1, year: 2015, total: 15000, district_id: 111 },
      { id: 2, year: 2025, total: 24351, district_id: 111 },
    ],
    'enrollment/town': [
      { id: 1, town_id: 111, grade_id: 3, year: 2015, enrollment: 2500 },
      { id: 2, town_id: 111, grade_id: 4, year: 2015, enrollment: 2000 },
      { id: 3, town_id: 111, grade_id: 3, year: 2026, enrollment: 2000 },
      { id: 4, town_id: 111, grade_id: 4, year: 2026, enrollment: 1701 },
    ],
    'education-freedom-account/entry': [
      { id: 1, town_id: 111, year: 2022, entry_type_id: 1, value: 50 },
      { id: 2, town_id: 111, year: 2027, entry_type_id: 1, value: 377 },
    ],
    'staff/district/teacher-average-salary': [
      { id: 1, district_id: 111, year: 2015, salary: 70000 },
      { id: 2, district_id: 111, year: 2026, salary: 90763 },
    ],
    'assessment/district': [result(111, 2015, 1, 43), result(111, 2015, 2, 51), result(111, 2026, 1, 41), result(111, 2026, 2, 55)],
    'outcome/outcome/graduation-cohort/district': [
      { district_id: 111, year: 2015, cohort_size: 300, graduate: 246, earned_hiset: 0, dropped_out: 5 },
      { district_id: 111, year: 2025, cohort_size: 371, graduate: 271, earned_hiset: 13, dropped_out: 4 },
    ],
    // The class of 2025: 45% planning college, plans unknown for 35%
    'outcome/outcome/post-graduation/district': [
      ...plans(111, 2015, { '4 Year College': 60, 'Less 4 Year College': 15, Employed: 20, Unknown: 5 }),
      ...plans(111, 2025, { '4 Year College': 40, 'Less 4 Year College': 5, Employed: 20, Unknown: 35 }),
    ],
  },
  // Runs no schools
  5: {
    'location/district/5': { id: 5, name: 'Albany', sau_id: 9, is_public: true, towns: [5], grades: K8 },
    'location/school': [],
    'location/town': [{ id: 5, name: 'Albany' }],
    'location/sau': [{ id: 9, name: 'SAU 9 Office' }],
    'finance/per-pupil/district': [],
    'enrollment/town': [
      { id: 5, town_id: 5, grade_id: 3, year: 2015, enrollment: 90 },
      { id: 6, town_id: 5, grade_id: 3, year: 2026, enrollment: 67 },
    ],
    'education-freedom-account/entry': [{ id: 3, town_id: 5, year: 2027, entry_type_id: 1, value: 3 }],
  },
  // A K-8 district whose latest math result was withheld as over 90%
  327: {
    'location/district/327': { id: 327, name: 'Lyme', sau_id: 76, is_public: true, towns: [327], grades: K8 },
    'location/school': [{ id: 3, name: 'Lyme Elementary School', district_id: 327, grades: K8 }],
    'location/town': [{ id: 327, name: 'Lyme' }],
    'location/sau': [{ id: 76, name: 'SAU 76 Office' }],
    'finance/per-pupil/district': [{ id: 3, year: 2025, total: 33556, district_id: 327 }],
    'enrollment/town': [{ id: 7, town_id: 327, grade_id: 3, year: 2026, enrollment: 252 }],
    'education-freedom-account/entry': [],
    'staff/district/teacher-average-salary': [{ id: 3, district_id: 327, year: 2026, salary: 85054 }],
    'assessment/district': [result(327, 2015, 1, 69), result(327, 2026, 1, null, 'SCORE_OVER_90'), result(327, 2026, 2, 85)],
  },
};

const respond = (url: string): unknown => {
  const [rawPath, query = ''] = url.split('?');
  const path = rawPath.replace(/^\/api\/v1\//, '');
  const districtId = Number(new URLSearchParams(query).get('district_id') ?? path.match(/^location\/district\/(\d+)$/)?.[1]);
  return DISTRICTS[districtId]?.[path] ?? fixtureFor(url);
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

const CurrentPath = () => <p>At {useLocation().pathname}</p>;

const renderDistrict = async (id: number) => {
  await store.dispatch(fetchAllDistrictData(id));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/district/${id}`]}>
        <Routes>
          <Route path="/district/:id" element={<District />} />
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

const TIMEOUT = { timeout: 3000 };

// Text queries and direct lookups: role queries by name walk every element of these long pages
const nav = (label: string) => document.querySelector<HTMLElement>(`nav[aria-label="${label}"]`)!;
const linkTo = (text: string) => screen.getByText(text).closest('a');

describe('District overview', () => {
  it('shows the district, its pages, key figures beside the state\'s, and its schools', async () => {
    await renderDistrict(111);
    expect(screen.getByText('Concord School District', { selector: 'h1' })).toBeInTheDocument();
    expect(screen.getByText('SAU 8 · Serves Concord · Grades PK-12 · 2 schools')).toBeInTheDocument();

    expect(nav('Concord School District pages').querySelectorAll('a')).toHaveLength(8);
    expect(linkTo('Academic Performance')).toHaveAttribute('href', '/district/111/academic');
    expect(linkTo('Financials')).toHaveAttribute('href', '/district/111/financials');
    expect(nav('Concord School District pages').querySelector('[aria-disabled="true"]')).toBeNull();

    // Tiles, each with the state's figure for the same year
    expect(await screen.findByText('$24,351', {}, TIMEOUT)).toBeInTheDocument();
    // One fact a line in each note
    expect(linkTo('Cost per Student')).toHaveTextContent(/Statewide \$21,000\s*Up \d+% after inflation/);
    expect(screen.getByText('3,701')).toBeInTheDocument();
    expect(screen.getByText('Public school students living in Concord')).toBeInTheDocument();
    expect(screen.getByText('Statewide 44%')).toBeInTheDocument();
    expect(screen.getByText('73.0%')).toBeInTheDocument();
    expect(screen.getByText('Statewide 87.5%')).toBeInTheDocument();
    // So many unknown plans that the college share needs saying so
    expect(linkTo('Planning to Attend College')).toHaveTextContent(/Statewide 67%\s*Plans unknown for 35%/);

    // Schools from the youngest grades up, linked to their pages
    const schools = [...nav('Schools in Concord School District').querySelectorAll('a')];
    expect(schools.map(link => link.textContent)).toEqual(['Abbot-Downing SchoolPK-5', 'Concord High School9-12']);
    expect(schools[0]).toHaveAttribute('href', '/school/1');
    // The schools come before the figures, on phones as on wide screens
    const keyFigures = screen.getByText('Key District Figures');
    expect(nav('Schools in Concord School District').compareDocumentPosition(keyFigures) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('greys out the pages a district without schools has no data for', async () => {
    await renderDistrict(5);
    const pages = nav('Albany School District pages');
    expect([...pages.querySelectorAll('a')].map(link => link.querySelector('h3')?.textContent))
      .toEqual(['Financials', 'Enrollment', 'Education Freedom Accounts', 'Contact Information']);
    // The rest stay in place, greyed out and not links, with the tabs' reason
    const greyed = [...pages.querySelectorAll('[aria-disabled="true"]')];
    expect(greyed.map(card => card.querySelector('h3')?.textContent)).toEqual(['Academic Performance', 'Graduation / College', 'Safety', 'Staff']);
    expect(greyed.every(card => card.closest('a') === null && card.querySelector('a') === null)).toBe(true);
    // The reason shows on the card itself, not only on hover
    expect(greyed.every(card => card.textContent?.includes('Not available: runs no schools'))).toBe(true);
    expect(within(greyed[0] as HTMLElement).getByText(/does not operate schools/)).toBeInTheDocument();
    expect(screen.getByText('SAU 9 · Serves Albany · Runs no schools of its own')).toBeInTheDocument();

    expect(await screen.findByText('67', {}, TIMEOUT)).toBeInTheDocument();
    expect(screen.queryByText('Results')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost per Student')).not.toBeInTheDocument();
    expect(screen.queryByText('Schools', { selector: 'h2' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Ask About/)).not.toBeInTheDocument();
  });

  it('shows a withheld result as over 90% with no change, and greys out graduation', async () => {
    await renderDistrict(327);
    const graduation = screen.getByText('Graduation / College').closest('[aria-disabled="true"]') as HTMLElement;
    expect(graduation).not.toBeNull();
    expect(graduation.querySelector('a')).toBeNull();
    expect(within(graduation).getByText(/does not educate Grade 12 students/)).toBeInTheDocument();
    expect(within(graduation).getByText('Not available: no grade 12')).toBeInTheDocument();
    const math = (await screen.findByText('>90%', {}, TIMEOUT)).closest('a')!;
    expect(within(math).getByText('Proficient in Math')).toBeInTheDocument();
    expect(within(math).queryByText(/Since/)).not.toBeInTheDocument();
    expect(within(linkTo('Proficient in Reading')!).getByText('85%')).toBeInTheDocument();
    // A small district's count isn't shortened on phones
    expect(within(linkTo('Students')!).queryByText('0.3K')).not.toBeInTheDocument();
    expect(screen.queryByText('Four-Year Graduation Rate')).not.toBeInTheDocument();
  });
});

describe('District labels', () => {
  it('lists names with "and" before the last', () => {
    expect(listNames(['Concord'])).toBe('Concord');
    expect(listNames(['Hampton', 'Hampton Falls'])).toBe('Hampton and Hampton Falls');
    expect(listNames(['Brentwood', 'East Kingston', 'Exeter'])).toBe('Brentwood, East Kingston and Exeter');
  });

  it('describes the district under its title', () => {
    expect(districtFacts({ sauId: 16, towns: [{ name: 'Exeter' }, { name: 'Stratham' }], grades: HIGH, schoolCount: 1 }))
      .toEqual(['SAU 16', 'Serves Exeter and Stratham', 'Grades 9-12', '1 school']);
  });

  it('on phones, puts the SAU in the title and keeps only the towns under it', () => {
    expect(districtPhoneTitle('Concord', 8)).toBe('Concord (SAU 8)');
    expect(districtFacts({ sauId: 16, towns: [{ name: 'Exeter' }, { name: 'Stratham' }], grades: HIGH, schoolCount: 1, phone: true }))
      .toEqual(['Serves Exeter and Stratham']);
    expect(districtFacts({ sauId: 9, towns: [{ name: 'Albany' }], schoolCount: 0, phone: true }))
      .toEqual(['Serves Albany', 'Runs no schools of its own']);
  });
});

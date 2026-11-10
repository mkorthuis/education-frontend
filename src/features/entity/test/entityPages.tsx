// Shared by the district and school page tests. Each test file mocks fetchData and downloadWorkbook:
//
//   vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));
//   vi.mock('@/features/state/utils/excel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/state/utils/excel')>()), downloadWorkbook: vi.fn() }));
import React from 'react';
import { expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { store } from '@/store/store';
import { fetchData } from '@/services/api/utils/apiUtils';
import { fetchAllDistrictData, fetchAllSchoolData } from '@/store/slices/locationSlice';
import { downloadWorkbook, ExcelSheet } from '@/features/state/utils/excel';
import { fixtureFor } from '@/features/state/test/stateApiFixtures';
import { EntityKind } from '../entity';

const grades = (...names: string[]) => names.map(name => ({
  id: ['Preschool', 'Kindergarten', ...Array.from({ length: 12 }, (_, n) => `Grade ${n + 1}`)].indexOf(name) + 1,
  name,
}));
const HIGH = grades('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12');
const PK5 = grades('Preschool', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5');

/** Concord School District (111) and Concord High School (20) */
export const DISTRICT_ID = 111;
export const SCHOOL_ID = 20;
const CONCORD = { id: DISTRICT_ID, name: 'Concord', sau_id: 8, is_public: true, towns: [111], grades: [...PK5, ...HIGH] };
const CONCORD_HIGH = { id: SCHOOL_ID, name: 'Concord High School', district_id: DISTRICT_ID, town_id: 111, city: 'CONCORD', grades: HIGH };
const ABBOT_DOWNING = { id: 21, name: 'Abbot-Downing School', district_id: DISTRICT_ID, grades: PK5 };

const LOCATIONS: Record<string, unknown> = {
  'location/district/111': CONCORD,
  'location/school/20': CONCORD_HIGH,
  'location/district?school_id=20': [CONCORD],
  'location/school?district_id=111': [CONCORD_HIGH, ABBOT_DOWNING],
  'location/town?district_id=111': [{ id: 111, name: 'Concord' }],
  'location/sau?district_id=111': [{ id: 8, name: 'Concord SAU Office' }],
};

/**
 * Answers each request from `fixtures`, keyed by its path under /api/v1/ and the school or district
 * asked about ("outcome/outcome/graduation-cohort/school?school_id=20"); a request for neither falls
 * back to the statewide fixtures. A request with no fixture fails the page loudly. Call it in
 * beforeEach: the Vitest config resets mocks.
 */
export const answerFrom = (fixtures: Record<string, unknown>) => {
  // As in .env.development and .env.production, which tests don't load
  vi.stubEnv('VITE_GRADUATION_GRADE', 'Grade 12');
  vi.mocked(fetchData).mockImplementation(async (url: string) => {
    const [rawPath, query = ''] = url.split('?');
    const path = rawPath.replace(/^\/api\/v1\//, '');
    const params = new URLSearchParams(query);
    const place = params.has('school_id') ? `?school_id=${params.get('school_id')}` : params.has('district_id') ? `?district_id=${params.get('district_id')}` : '';
    const fixture = fixtures[path + place] ?? LOCATIONS[path + place] ?? (place ? undefined : fixtureFor(url));
    if (fixture === undefined) throw new Error(`No fixture for ${url}`);
    return structuredClone(fixture);
  });
};

/** Concord's or Concord High's page, after its location data has loaded as the site's layout loads it */
export const renderEntityPage = async (kind: EntityKind, page: React.ReactElement) => {
  const id = kind === 'district' ? DISTRICT_ID : SCHOOL_ID;
  await store.dispatch(kind === 'district' ? fetchAllDistrictData(id) : fetchAllSchoolData(id));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/${kind}/${id}/page`]}>
        <Routes>
          <Route path={`/${kind}/:id/*`} element={page} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

/** Clicks Download Excel once the page's data has loaded, and returns the file name and sheets saved. */
export const downloadExcel = async (): Promise<{ fileName: string; sheets: ExcelSheet[] }> => {
  const button = await screen.findByRole('button', { name: 'Download Excel' }, { timeout: 3000 });
  await waitFor(() => expect(button).toBeEnabled(), { timeout: 3000 });
  await userEvent.click(button);
  await waitFor(() => expect(downloadWorkbook).toHaveBeenCalledTimes(1));
  const [fileName, sheets] = vi.mocked(downloadWorkbook).mock.calls[0];
  // What Excel would refuse, or show askew: sheet names it can't take, and cells without a header
  const names = sheets.map(entry => entry.name);
  expect(new Set(names.map(name => name.toLowerCase())).size).toBe(names.length);
  names.forEach(name => expect(name).toMatch(/^[^:\\/?*[\]]{1,31}$/));
  sheets.forEach(entry => [...entry.rows, ...(entry.totalRow ? [entry.totalRow] : [])].forEach(cells =>
    expect(cells.length, `a row of "${entry.name}"`).toBeLessThanOrEqual(entry.columns.length)));
  return { fileName, sheets };
};

/** A sheet by name, failing the test if it's missing */
export const sheet = (sheets: ExcelSheet[], name: string): ExcelSheet => {
  const found = sheets.find(entry => entry.name === name);
  if (!found) throw new Error(`No sheet "${name}" among ${sheets.map(entry => entry.name).join(', ')}`);
  return found;
};

/** A sheet's row whose first cell is `label` */
export const row = (found: ExcelSheet, label: string | number) => {
  const match = found.rows.find(entry => entry[0] === label);
  if (!match) throw new Error(`No row "${label}" in "${found.name}"`);
  return match;
};

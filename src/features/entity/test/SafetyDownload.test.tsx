import { beforeEach, describe, expect, it, vi } from 'vitest';
// The harness first: it loads the store, which the pages' modules expect to exist
import { answerFrom, downloadExcel, renderEntityPage, row, sheet } from './entityPages';
import DistrictSafety from '@/features/district/components/Safety';
import SchoolSafety from '@/features/school/components/Safety';

vi.mock('@/services/api/utils/apiUtils', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/services/api/utils/apiUtils')>()), fetchData: vi.fn() }));
vi.mock('@/features/state/utils/excel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/state/utils/excel')>()), downloadWorkbook: vi.fn() }));

const ANY_KIND = { id: 1, name: 'Bullying (of any kind)' };
const CYBER = { id: 2, name: 'Cyber-bullying' };
const GENDER = { id: 1, name: 'Gender' };
const DISABILITY = { id: 4, name: 'Disability' };
const IN_SCHOOL = { id: 1, name: 'Who Received In-School Suspensions' };
const OUT_OF_SCHOOL = { id: 2, name: 'Who Received Out-of-School Suspensions' };
const EXPELLED = { id: 3, name: 'Who Were Expelled' };
const INJURY = { id: 1, name: 'Violent Incidents With Physical Injury Requiring Professional Medical Attention' };
const WEAPONS = { id: 3, name: 'Weapons Possession' };
const DRUGS = { id: 4, name: 'Illicit Drugs' };
const DISRUPTION = { id: 7, name: 'Disruption' };
const ARSONS = { id: 4, name: 'Arsons' };

// New Hampshire in 2024-25 (162,544 students, from the statewide fixtures), for the datasets those leave out
const STATE = {
  'safety/state/bullying': [
    { id: 1, year: 2025, reported: 1626, investigated_actual: 684, bullying_type: ANY_KIND },
    { id: 2, year: 2025, reported: 300, investigated_actual: 120, bullying_type: CYBER },
  ],
  'safety/state/harassment': [{ id: 1, year: 2025, incident_count: 600, student_impact_count: 700, student_engaged_count: 500, classification: GENDER }],
  'safety/state/bullying/classification': [],
  'safety/state/bullying/impact': [],
  'safety/state/discipline/count': [
    { id: 1, year: 2025, count: 3000, count_type: IN_SCHOOL },
    { id: 2, year: 2025, count: 5000, count_type: OUT_OF_SCHOOL },
    { id: 3, year: 2025, count: 20, count_type: EXPELLED },
  ],
  'safety/state/discipline/incident': [{ id: 1, year: 2025, count: 400, incident_type: WEAPONS }],
};

const TYPES = {
  'safety/bullying-type': [ANY_KIND, CYBER],
  'safety/bullying-classification-type': [{ id: 1, name: 'Gender' }, { id: 4, name: 'Disability' }],
  'safety/bullying-impact-type': [{ id: 3, name: 'Included Physical Harm' }],
  'safety/harassment-classification': [GENDER, DISABILITY],
  'safety/discipline-count-type': [IN_SCHOOL, OUT_OF_SCHOOL, EXPELLED],
  'safety/discipline-incident-type': [INJURY, WEAPONS, DRUGS, DISRUPTION],
  'safety/school-safety-type': [ARSONS],
};

// The same figures for the district and its high school: 4,000 students in 2024-25
const safety = (kind: 'district' | 'school', place: Record<string, number>, query: string) => {
  const rows = (entries: Record<string, unknown>[]) => entries.map((entry, index) => ({ ...place, id: index + 1, year: 2025, ...entry }));
  return {
    [`safety/${kind}/enrollment${query}`]: [{ ...place, year: 2024, total_enrollment: 3900 }, { ...place, year: 2025, total_enrollment: 4000 }],
    [`safety/${kind}/truancy${query}`]: rows([{ count: 200 }]),
    [`safety/${kind}/bullying${query}`]: rows([
      { reported: 40, investigated_actual: 20, bullying_type: ANY_KIND },
      { reported: 10, investigated_actual: 4, bullying_type: CYBER },
    ]),
    [`safety/${kind}/bullying/classification${query}`]: rows([
      { count: 5, classification_type: { id: 1, name: 'Gender' } },
      { count: 3, classification_type: { id: 4, name: 'Disability' } },
      { year: 2024, count: 1, classification_type: { id: 1, name: 'Gender' } },
    ]),
    [`safety/${kind}/bullying/impact${query}`]: rows([{ count: 2, impact_type: { id: 3, name: 'Included Physical Harm' } }]),
    [`safety/${kind}/harassment${query}`]: rows([
      { incident_count: 6, student_impact_count: 7, student_engaged_count: 5, classification: GENDER },
      { incident_count: 2, student_impact_count: 2, student_engaged_count: 1, classification: DISABILITY },
    ]),
    [`safety/${kind}/restraint${query}`]: rows([{ generated: 8, active_investigation: 0, closed_investigation: 8, bodily_injury: 1, serious_injury: 0 }]),
    [`safety/${kind}/seclusion${query}`]: rows([{ generated: 2, active_investigation: 1, closed_investigation: 1 }]),
    [`safety/${kind}/discipline/count${query}`]: rows([
      { count: 30, count_type: IN_SCHOOL },
      { count: 50, count_type: OUT_OF_SCHOOL },
      { count: 1, count_type: EXPELLED },
    ]),
    [`safety/${kind}/discipline/incident${query}`]: rows([
      { count: 3, incident_type: INJURY },
      { count: 2, incident_type: WEAPONS },
      { count: 5, incident_type: DRUGS },
      { count: 10, incident_type: DISRUPTION },
    ]),
  };
};

beforeEach(() => answerFrom({
  ...TYPES,
  ...STATE,
  ...safety('district', { district_id: 111 }, '?district_id=111'),
  ...safety('school', { school_id: 20 }, '?school_id=20'),
  'safety/district/safety?district_id=111': [],
  // The district page reads its schools' serious incidents and harassment; a zero count isn't listed
  'safety/school/safety?district_id=111': [
    { id: 1, school_id: 20, district_id: 111, year: 2025, count: 1, safety_type: ARSONS },
    { id: 2, school_id: 21, district_id: 111, year: 2025, count: 0, safety_type: ARSONS },
  ],
  'safety/school/harassment?district_id=111': [],
  'safety/school/safety?school_id=20': [{ id: 1, school_id: 20, year: 2025, count: 1, safety_type: ARSONS }],
}));

const NH_STUDENTS = 162544;

describe('Safety download', () => {
  it("saves every category and year for the district, with New Hampshire's rates beside it", async () => {
    await renderEntityPage('district', <DistrictSafety />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-school-district-safety.xlsx');
    expect(sheets.map(entry => entry.name)).toEqual([
      'Truancy', 'Bullying By Year', 'Bullying Classifications', 'Bullying Impacts', 'Harassment By Type', 'Harassment By Year',
      'Restraints', 'Seclusions', 'Suspensions By Year', 'Suspension Incidents', 'Serious Incidents', 'Notes',
    ]);
    // 200 of 4,000 students truant, against 30,546 of 162,544 statewide
    const truancy = row(sheet(sheets, 'Truancy'), '2024-25');
    expect(truancy.slice(0, 4)).toEqual(['2024-25', 200, 4000, 0.05]);
    expect(truancy[4]).toBeCloseTo(30546 / NH_STUDENTS);
    // Each bullying type apart: 20 confirmed of any kind is 0.5 per 100 students, 4 cyber 0.1
    const bullying = sheet(sheets, 'Bullying By Year');
    expect(bullying.columns.map(column => column.header)).toContain('NH Cyber-Bullying: Confirmed per 100 Students');
    const bullying2025 = row(bullying, '2024-25');
    expect(bullying2025.slice(0, 5)).toEqual(['2024-25', 4000, 40, 20, 0.5]);
    expect(bullying2025[5]).toBeCloseTo((684 / NH_STUDENTS) * 100);
    expect(bullying2025.slice(6, 9)).toEqual([10, 4, 0.1]);
    expect(bullying2025[9]).toBeCloseTo((120 / NH_STUDENTS) * 100);
    // Every year of the classifications, not just the one picked on the page
    const classifications = sheet(sheets, 'Bullying Classifications');
    expect(row(classifications, 'Gender')).toEqual(['Gender', 1, 5]);
    expect(classifications.totalRow).toEqual(['Total', 1, 8]);
    // Harassment by type, with a bold total for each year
    const harassment = sheet(sheets, 'Harassment By Type');
    expect(harassment.rows).toEqual([['2024-25', 'Gender', 6, 7, 5], ['2024-25', 'Disability', 2, 2, 1], ['2024-25', 'All Types', 8, 9, 6]]);
    expect(harassment.subtotalRows).toEqual([2]);
    expect(row(sheet(sheets, 'Harassment By Year'), '2024-25')[4]).toBeCloseTo((600 / NH_STUDENTS) * 100);
    const restraints = row(sheet(sheets, 'Restraints'), '2024-25');
    expect(restraints.slice(0, 4)).toEqual(['2024-25', 4000, 8, 0.2]);
    expect(restraints[4]).toBeCloseTo((1100 / NH_STUDENTS) * 100);
    // 80 students suspended (2 per 100), 1 expelled against 20 statewide
    const suspensions = row(sheet(sheets, 'Suspensions By Year'), '2024-25');
    expect(suspensions.slice(0, 6)).toEqual(['2024-25', 4000, 30, 50, 80, 2]);
    expect(suspensions[6]).toBeCloseTo((8000 / NH_STUDENTS) * 100);
    expect(suspensions.slice(-2)).toEqual([1, 20]);
    // Grouped as the page groups them: weapons and drugs together
    const incidents = sheet(sheets, 'Suspension Incidents');
    expect(incidents.rows.map(entry => entry[1])).toEqual([
      'Violent Incidents Requiring Medical Attention', 'Others Related to Drug, Alcohol, Violence, Weapons', 'Disruption', 'All Incidents',
    ]);
    expect(incidents.rows[1][2]).toBe(7);
    expect(incidents.rows[1][3]).toBeCloseTo(0.175);
    expect(incidents.rows[1][4]).toBe(400);
    expect(incidents.rows[3].slice(2, 4)).toEqual([20, 0.5]);
    expect(incidents.subtotalRows).toEqual([3]);
    // Each school's serious incidents, leaving out types with none
    expect(sheet(sheets, 'Serious Incidents').rows).toEqual([['Concord High School', '2024-25', 'Arsons', 1]]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Safety for Concord School District');
  });

  it("names a school's file after the school and lists its own serious incidents", async () => {
    await renderEntityPage('school', <SchoolSafety />);
    const { fileName, sheets } = await downloadExcel();

    expect(fileName).toBe('concord-high-school-safety.xlsx');
    expect(row(sheet(sheets, 'Truancy'), '2024-25').slice(0, 4)).toEqual(['2024-25', 200, 4000, 0.05]);
    const serious = sheet(sheets, 'Serious Incidents');
    expect(serious.columns.map(column => column.header)).toEqual(['School Year', 'Incident', 'Incidents']);
    expect(serious.rows).toEqual([['2024-25', 'Arsons', 1]]);
    expect(sheet(sheets, 'Notes').subtitle).toBe('Safety for Concord High School');
  });
});

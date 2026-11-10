import { EfaEntryData, EfaEntryTypeData, EfaStateEntryData } from '@/store/slices/efaSlice';
import { StateTownEnrollmentData, TownEnrollmentData } from '@/services/api/endpoints/enrollments';
import { Town } from '@/store/slices/locationSlice';
import { COUNT, DOLLARS, ExcelSheet, ExcelValue, notesSheet, PERCENT } from '@/features/state/utils/excel';
import { EFA_BASE_AID, formatSchoolYear, PRELIMINARY } from '@/features/state/utils/stateMetrics';
import { entityTitle, nh } from '@/features/entity/excel';

export interface EfaData {
  name: string;
  displayName: string;
  towns: Town[];
  entries: EfaEntryData[];
  stateEntries: EfaStateEntryData[];
  entryTypes: EfaEntryTypeData[];
  townEnrollment: TownEnrollmentData[];
  stateTownEnrollment: StateTownEnrollmentData[];
}

// The aid categories as the page's table names and orders them
const FREE_AND_REDUCED = 'Federal Free & Reduced (F&R) Price Meal Eligible';
const AID_NAMES: Record<string, string> = {
  [EFA_BASE_AID]: 'Base Student Aid',
  [FREE_AND_REDUCED]: 'Free & Reduced Meal Aid',
  'English Language Learn Aid': 'English Learner Aid',
};
const aidPriority = (name: string): number => {
  if (name === EFA_BASE_AID) return 1;
  if (name === FREE_AND_REDUCED) return 2;
  if (name === 'Special Education Aid') return 3;
  if (name === 'English Language Learn Aid') return 4;
  if (name.includes('3rd Grade')) return 5;
  return 100;
};

const sumBy = <T>(rows: T[], key: (row: T) => number | string, value: (row: T) => number) => {
  const sums = new Map<number | string, number>();
  rows.forEach(row => sums.set(key(row), (sums.get(key(row)) ?? 0) + value(row)));
  return sums;
};

const share = (count: number | undefined, total: number | undefined): ExcelValue =>
  typeof count === 'number' && total ? count / total : null;

/**
 * The Education Freedom Accounts page as one workbook: EFA grants by year as a share of public school
 * enrollment beside New Hampshire's, students and state grants in each aid category for every year,
 * and, for a district of more than one town, the same by town.
 */
export const efaWorkbook = (data: EfaData): ExcelSheet[] => {
  const title = entityTitle('district', data.name);
  const typeNames = new Map(data.entryTypes.map(type => [type.id, type.name]));
  const typeName = (id: number) => typeNames.get(id) ?? `Type ${id}`;
  const aidName = (id: number) => AID_NAMES[typeName(id)] ?? typeName(id);
  const byAid = (a: number, b: number) => aidPriority(typeName(a)) - aidPriority(typeName(b)) || aidName(a).localeCompare(aidName(b));
  // Each aid category's per-student amount for its year
  const amounts = new Map(data.entryTypes.map(type => [`${type.id}-${type.year}`, type.value]));
  const amount = (id: number, year: number): number | null => amounts.get(`${id}-${year}`) ?? null;
  const grants = (id: number, year: number, students: number): number | null => {
    const perStudent = amount(id, year);
    return perStudent === null ? null : perStudent * students;
  };
  const isBaseAid = (id: number) => typeName(id) === EFA_BASE_AID;

  // Every EFA student gets the base amount, so its count is the count of students
  const students = sumBy(data.entries.filter(row => isBaseAid(row.entry_type_id)), row => row.year, row => row.value);
  const stateStudents = sumBy(data.stateEntries.filter(row => isBaseAid(row.entry_type_id)), row => row.year, row => row.value);
  const enrolled = sumBy(data.townEnrollment, row => row.year, row => row.enrollment);
  const stateEnrolled = sumBy(data.stateTownEnrollment, row => row.year, row => row.total_enrollment);
  const grantYears = [...new Set([...data.entries, ...data.stateEntries].map(row => row.year))].sort((a, b) => a - b);

  // Students and grants in each aid category, summed over the district's towns
  const years = [...new Set(data.entries.map(row => row.year))].sort((a, b) => a - b);
  const categoryRows: ExcelValue[][] = [];
  const yearTotals: number[] = [];
  years.forEach(year => {
    const counts = sumBy(data.entries.filter(row => row.year === year), row => row.entry_type_id, row => row.value);
    const ids = [...counts.keys()].map(Number).sort(byAid);
    ids.forEach(id => categoryRows.push([formatSchoolYear(year), aidName(id), counts.get(id)!, amount(id, year), grants(id, year, counts.get(id)!)]));
    yearTotals.push(categoryRows.length);
    categoryRows.push([
      formatSchoolYear(year), 'Total', students.get(year) ?? 0, null,
      ids.reduce((sum, id) => sum + (grants(id, year, counts.get(id)!) ?? 0), 0),
    ]);
  });

  const townNames = new Map(data.towns.map(town => [town.id, town.name]));
  const townName = (id: number) => townNames.get(id) ?? `Town ${id}`;
  const entryTowns = new Set(data.entries.map(row => row.town_id));
  const townRows = [...data.entries]
    .sort((a, b) => a.year - b.year || townName(a.town_id).localeCompare(townName(b.town_id)) || byAid(a.entry_type_id, b.entry_type_id))
    .map(row => [
      formatSchoolYear(row.year), townName(row.town_id), aidName(row.entry_type_id), row.value,
      amount(row.entry_type_id, row.year), grants(row.entry_type_id, row.year, row.value),
    ]);
  const latestYear = grantYears[grantYears.length - 1];

  return [
    {
      name: 'EFA Grants By Year',
      subtitle: `${title}: students with an EFA grant, and their share of public school enrollment, beside New Hampshire's`,
      columns: [
        { header: 'School Year', width: 12 },
        { header: 'EFA Grants', format: COUNT },
        { header: 'Public School Enrollment', width: 24, format: COUNT },
        { header: '% of Public School Enrollment', width: 28, format: PERCENT },
        { header: nh('EFA Grants'), format: COUNT },
        { header: nh('Public School Enrollment'), width: 26, format: COUNT },
        { header: nh('% of Public School Enrollment'), width: 30, format: PERCENT },
      ],
      rows: grantYears.map(year => {
        const count = students.get(year) ?? 0;
        const stateCount = stateStudents.get(year);
        return [
          formatSchoolYear(year), count, enrolled.get(year) ?? null, share(count, enrolled.get(year)),
          stateCount ?? null, stateEnrolled.get(year) ?? null, share(stateCount, stateEnrolled.get(year)),
        ];
      }),
    },
    {
      name: 'Students and Grants By Year',
      title: 'EFA Students and State Grants By Aid Category',
      subtitle: `${title}: EFA students in each aid category and the estimated state grants for them, each year`,
      columns: [
        { header: 'School Year', width: 12 },
        { header: 'Aid Category', width: 28 },
        { header: 'Students', format: COUNT },
        { header: 'Per Student', format: DOLLARS },
        { header: 'State Grants', width: 16, format: DOLLARS },
      ],
      rows: categoryRows,
      subtotalRows: yearTotals,
    },
    ...(entryTowns.size > 1 ? [{
      name: 'EFA Students By Town',
      title: 'EFA Students and State Grants By Town',
      subtitle: `${title}: each aid category in each town, by the town where EFA students live`,
      columns: [
        { header: 'School Year', width: 12 },
        { header: 'Town', width: 20 },
        { header: 'Aid Category', width: 28 },
        { header: 'Students', format: COUNT },
        { header: 'Per Student', format: DOLLARS },
        { header: 'State Grants', width: 16, format: DOLLARS },
      ],
      rows: townRows,
    }] : []),
    notesSheet(`${data.displayName} for ${title}`, [
      ...(latestYear === PRELIMINARY.efaYear
        ? [`${formatSchoolYear(PRELIMINARY.efaYear)} numbers are preliminary, from the state's count as of ${PRELIMINARY.efaAsOf}; other years are final.`]
        : []),
      'EFA grants, students and state grants by aid category: NH Department of Education, Education Freedom Account aid calculations (RSA 194-F), by the town where each EFA student lives; the district\'s figures are its towns\' totals. State grants are the students in each aid category times that year\'s per-student amount: estimates, not actual payments to families.',
      'Public school enrollment: NH Department of Education town enrollment by grade (October 1), for the district\'s towns and, in the NH columns, the whole state. Its totals include out-of-state students attending NH schools, NH students attending out-of-state schools and students whose parents pay tuition.',
      'Students can receive more than one kind of extra aid on top of the base amount, so each year\'s total counts each student once (Base Student Aid).',
      'Columns starting "NH" are New Hampshire\'s figures for the same school year.',
    ]),
  ];
};

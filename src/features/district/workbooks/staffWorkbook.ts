import { STAFF_TYPE_ORDER } from '@/features/district/utils/staffDataProcessing';
import { COUNT, DOLLARS, ExcelSheet, ExcelValue, notesSheet, PERCENT } from '@/features/state/utils/excel';
import { adjustSeriesForInflation, formatSchoolYear, sortByYear, valueIn, YearValue } from '@/features/state/utils/stateMetrics';
import { entityTitle, nh } from '@/features/entity/excel';

interface Named { id: number; name: string }
interface CountRow { year: number; value: number }
type StaffRow = CountRow & { staff_type: Named };
type EducationRow = CountRow & { teacher_type: Named };
interface SalaryRow { year: number; salary: number }
interface SalaryBandRow { year: number; min_salary: number; max_salary: number; steps: number; salary_band_type: Named & { description?: string } }
interface ClassSizeRow { year: number; grades_1_2: number | null; grades_3_4: number | null; grades_5_8: number | null; all_grades: number | null }

export interface StaffData {
  name: string;
  displayName: string;
  staffTypes: Named[];
  teacherEducationTypes: Named[];
  salaryBandTypes: (Named & { description?: string })[];
  staff: StaffRow[];
  stateStaff: StaffRow[];
  teacherEducation: EducationRow[];
  stateTeacherEducation: EducationRow[];
  salary: SalaryRow[];
  stateSalary: SalaryRow[];
  salaryBands: SalaryBandRow[];
  stateSalaryBands: SalaryBandRow[];
  classSize: ClassSizeRow[];
  stateClassSize: ClassSizeRow[];
}

// Degrees in order, by the type's name (the state's report says "Bachelor", older code "Bachelors")
const DEGREE_NAMES: Record<string, string> = {
  Bachelor: "Bachelor's",
  Bachelors: "Bachelor's",
  Masters: "Master's",
  'Beyond Masters': "Beyond Master's",
  None: 'None',
};
const DEGREE_ORDER = Object.keys(DEGREE_NAMES);

const CLASS_SIZES = [
  { key: 'all_grades', name: 'All Grades' },
  { key: 'grades_1_2', name: 'Grades 1-2' },
  { key: 'grades_3_4', name: 'Grades 3-4' },
  { key: 'grades_5_8', name: 'Grades 5-8' },
] as const;

const share = (count: number | null | undefined, total: number): ExcelValue =>
  typeof count === 'number' && total > 0 ? count / total : null;

// Types in the page's order, then any it doesn't know, with each one's id
const ordered = (types: Named[], order: readonly string[]): Named[] => {
  const rank = (name: string) => (order.includes(name) ? order.indexOf(name) : order.length);
  return [...types].sort((a, b) => rank(a.name) - rank(b.name));
};

const yearsOf = (...lists: { year: number }[][]) => [...new Set(lists.flat().map(row => row.year))].sort((a, b) => a - b);

/** Each year's count for each type, with the year's total */
const byTypeAndYear = <T extends CountRow>(rows: T[], typeId: (row: T) => number) => {
  const years = new Map<number, Map<number, number>>();
  rows.forEach(row => {
    const counts = years.get(row.year) ?? new Map<number, number>();
    counts.set(typeId(row), (counts.get(typeId(row)) ?? 0) + row.value);
    years.set(row.year, counts);
  });
  const total = (year: number) => [...(years.get(year)?.values() ?? [])].reduce((sum, count) => sum + count, 0);
  const count = (year: number, id: number) => years.get(year)?.get(id) ?? null;
  return { total, count };
};

// NH DOE reports a missing class size as 0; the page treats it as no figure
const classSize = (row: ClassSizeRow | undefined, key: typeof CLASS_SIZES[number]['key']): ExcelValue => row?.[key] || null;

/**
 * The district Staff page as one workbook: teacher pay, staff by type, teachers' education, salary
 * bands and class size, each with New Hampshire's figures where the page compares them.
 */
export const staffWorkbook = (data: StaffData): ExcelSheet[] => {
  const title = entityTitle('district', data.name);

  // Salaries, actual and in the latest year's dollars
  const salary: YearValue[] = sortByYear(data.salary).map(row => ({ year: row.year, value: row.salary }));
  const stateSalary: YearValue[] = sortByYear(data.stateSalary).map(row => ({ year: row.year, value: row.salary }));
  const dollarsYear = salary.length ? salary[salary.length - 1].year : null;
  const dollars = dollarsYear ? `${formatSchoolYear(dollarsYear)} Dollars` : 'Today\'s Dollars';
  const adjusted = dollarsYear ? adjustSeriesForInflation(salary, dollarsYear) : [];
  const stateAdjusted = dollarsYear ? adjustSeriesForInflation(stateSalary, dollarsYear) : [];

  // Staff by type
  const staffTypes = ordered(data.staffTypes, STAFF_TYPE_ORDER);
  const staff = byTypeAndYear(data.staff, row => row.staff_type.id);
  const stateStaff = byTypeAndYear(data.stateStaff, row => row.staff_type.id);
  const staffYears = yearsOf(data.staff);
  const latestStaffYear = staffYears[staffYears.length - 1];

  // Teachers by highest degree
  const degrees = ordered(data.teacherEducationTypes, DEGREE_ORDER);
  const degreeName = (type: Named) => DEGREE_NAMES[type.name] ?? type.name;
  const education = byTypeAndYear(data.teacherEducation, row => row.teacher_type.id);
  const stateEducation = byTypeAndYear(data.stateTeacherEducation, row => row.teacher_type.id);
  const educationYears = yearsOf(data.teacherEducation);
  const latestEducationYear = educationYears[educationYears.length - 1];

  // Salary bands, in the order of the band types
  const bandRank = (row: SalaryBandRow) => {
    const index = data.salaryBandTypes.findIndex(type => type.id === row.salary_band_type.id);
    return index === -1 ? data.salaryBandTypes.length : index;
  };
  const bands = [...data.salaryBands].sort((a, b) => a.year - b.year || bandRank(a) - bandRank(b));
  const stateBand = (row: SalaryBandRow) =>
    data.stateSalaryBands.find(state => state.year === row.year && state.salary_band_type.id === row.salary_band_type.id);

  const classSizes = new Map(data.classSize.map(row => [row.year, row]));
  const stateClassSizes = new Map(data.stateClassSize.map(row => [row.year, row]));

  // A latest-year table: each type's count and share of the total, with New Hampshire's share
  const latestTable = (
    name: string, subtitle: string, firstHeader: string, countHeader: string, totalLabel: string,
    types: Named[], label: (type: Named) => string, year: number | undefined,
    district: ReturnType<typeof byTypeAndYear>, state: ReturnType<typeof byTypeAndYear>,
  ): ExcelSheet => {
    const total = year ? district.total(year) : 0;
    const stateTotal = year ? state.total(year) : 0;
    return {
      name: year ? `${name}, ${formatSchoolYear(year)}` : name,
      subtitle,
      columns: [
        { header: firstHeader, width: 24 },
        { header: countHeader, width: 14, format: COUNT },
        { header: 'Share', format: PERCENT },
        { header: nh('Share'), format: PERCENT },
      ],
      rows: year ? types.map(type => [label(type), district.count(year, type.id), share(district.count(year, type.id), total), share(state.count(year, type.id), stateTotal)]) : [],
      totalRow: year ? [totalLabel, total, total ? 1 : null, stateTotal ? 1 : null] : undefined,
    };
  };

  return [
    {
      name: 'Average Teacher Salary',
      subtitle: `${title}'s average teacher salary and New Hampshire's, actual and in ${dollars.toLowerCase()}`,
      columns: [
        { header: 'School Year', width: 12 },
        { header: 'Average Salary', width: 16, format: DOLLARS },
        { header: nh('Average Salary'), width: 18, format: DOLLARS },
        { header: `In ${dollars}`, width: 22, format: DOLLARS },
        { header: nh(`In ${dollars}`), width: 24, format: DOLLARS },
      ],
      rows: yearsOf(data.salary, data.stateSalary).map(year => [
        formatSchoolYear(year), valueIn(salary, year), valueIn(stateSalary, year), valueIn(adjusted, year), valueIn(stateAdjusted, year),
      ]),
    },
    latestTable(
      'Staff By Type', `${title}'s staff (full-time equivalents), with each type's share beside New Hampshire's`,
      'Staff Type', 'Staff', 'All Staff', staffTypes, type => type.name, latestStaffYear, staff, stateStaff,
    ),
    {
      name: 'Staff By Type By Year',
      subtitle: 'Full-time equivalents',
      columns: [
        { header: 'School Year', width: 12 },
        ...staffTypes.map(type => ({ header: type.name, width: 16, format: COUNT })),
        { header: 'All Staff', width: 12, format: COUNT },
      ],
      rows: staffYears.map(year => [formatSchoolYear(year), ...staffTypes.map(type => staff.count(year, type.id)), staff.total(year)]),
    },
    {
      name: 'Staff Types As % of Staff',
      subtitle: 'Each staff type as a percentage of all staff, with New Hampshire\'s',
      columns: [
        { header: 'School Year', width: 12 },
        ...staffTypes.map(type => ({ header: `${type.name} (%)`, width: 16, format: PERCENT })),
        ...staffTypes.map(type => ({ header: nh(`${type.name} (%)`), width: 18, format: PERCENT })),
      ],
      rows: yearsOf(data.staff, data.stateStaff).map(year => [
        formatSchoolYear(year),
        ...staffTypes.map(type => share(staff.count(year, type.id), staff.total(year))),
        ...staffTypes.map(type => share(stateStaff.count(year, type.id), stateStaff.total(year))),
      ]),
    },
    latestTable(
      'Teacher Education', `${title}'s teachers by highest degree, with each degree's share beside New Hampshire's`,
      'Highest Degree', 'Teachers', 'All Teachers', degrees, degreeName, latestEducationYear, education, stateEducation,
    ),
    {
      name: 'Teacher Education By Year',
      subtitle: 'Teachers by highest degree, with each degree\'s share beside New Hampshire\'s',
      columns: [
        { header: 'School Year', width: 12 },
        ...degrees.map(type => ({ header: degreeName(type), width: 16, format: COUNT })),
        { header: 'All Teachers', width: 14, format: COUNT },
        ...degrees.map(type => ({ header: `${degreeName(type)} (%)`, width: 16, format: PERCENT })),
        ...degrees.map(type => ({ header: nh(`${degreeName(type)} (%)`), width: 18, format: PERCENT })),
      ],
      rows: yearsOf(data.teacherEducation, data.stateTeacherEducation).map(year => [
        formatSchoolYear(year),
        ...degrees.map(type => education.count(year, type.id)),
        education.total(year) || null,
        ...degrees.map(type => share(education.count(year, type.id), education.total(year))),
        ...degrees.map(type => share(stateEducation.count(year, type.id), stateEducation.total(year))),
      ]),
    },
    {
      name: 'Teacher Salary Bands',
      subtitle: 'The lowest and highest teacher salary in each band and its steps, with the average of New Hampshire\'s districts',
      columns: [
        { header: 'School Year', width: 12 },
        { header: 'Salary Band', width: 40 },
        { header: 'Minimum', width: 14, format: DOLLARS },
        { header: 'Maximum', width: 14, format: DOLLARS },
        { header: 'Steps', width: 10, format: COUNT },
        { header: nh('Average Minimum'), width: 18, format: DOLLARS },
        { header: nh('Average Maximum'), width: 18, format: DOLLARS },
      ],
      rows: bands.map(row => [
        formatSchoolYear(row.year), row.salary_band_type.description || row.salary_band_type.name, row.min_salary, row.max_salary, row.steps,
        stateBand(row)?.min_salary ?? null, stateBand(row)?.max_salary ?? null,
      ]),
    },
    {
      name: 'Class Size By Year',
      title: 'Average Class Size',
      subtitle: 'Students per class, all grades and by grade level, with New Hampshire\'s',
      columns: [
        { header: 'School Year', width: 12 },
        ...CLASS_SIZES.map(size => ({ header: size.name, format: '0.0' })),
        ...CLASS_SIZES.map(size => ({ header: nh(size.name), width: 14, format: '0.0' })),
      ],
      rows: yearsOf(data.classSize, data.stateClassSize).map(year => [
        formatSchoolYear(year),
        ...CLASS_SIZES.map(size => classSize(classSizes.get(year), size.key)),
        ...CLASS_SIZES.map(size => classSize(stateClassSizes.get(year), size.key)),
      ]),
    },
    notesSheet(`${data.displayName} for ${title}`, [
      'Sources: NH Department of Education Full Time Equivalent Staff Count, Teacher Average Salary, Teacher Attainment, Teacher Starting Salary and Average Class Size reports (iPlatform).',
      'Staff are full-time equivalents as of October 1: part-time staff count as fractions. Teacher education counts teachers by highest degree.',
      `Salaries in ${dollars.toLowerCase()} are adjusted with the consumer price index (CPI-U, U.S. city average).`,
      'Salary bands are from the district\'s salary schedule: the lowest and highest salary for teachers in each band (by degree, such as BA or MA+30) and the number of steps. New Hampshire\'s figures average the districts\' bands. The page shows only the latest year\'s bands, without New Hampshire\'s.',
      'A blank class size means NH DOE reports none for that year or grade level. NH DOE doesn\'t say which grades the all-grades figure covers.',
      'Columns starting "NH" are New Hampshire\'s figures for the same school year.',
    ]),
  ];
};

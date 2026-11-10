import {
  EntryType,
  FinancialItem,
  PerPupilExpenditure,
  ProcessedReport,
  StateADM,
  StateExpenditure,
  StateExpenditureRollup,
  StateRevenue,
} from '@/store/slices/financeSlice';
import { FinancialComparisonItem } from '@/components/ui/tables';
import { asFraction, DOLLARS, ExcelSheet, ExcelValue, notesSheet, PERCENT } from '@/features/state/utils/excel';
import { formatSchoolYear } from '@/features/state/utils/stateMetrics';
import { calculateInflationAdjustedAmount } from '@/utils/calculations';
import { entityTitle, nh } from '@/features/entity/excel';
import { costBreakdown } from '../utils/costBreakdown';
import {
  expenditureLine,
  instructionAndSupport,
  normalizeRevenueCategory,
  sortExpenditureComparisonItems,
  sortRevenueComparisonItems,
} from '../utils/financialDataProcessing';

export interface FinancialsData {
  name: string;
  displayName: string;
  /** The year the Overall tab's cost breakdown shows */
  breakdownYear: number;
  /** The district's processed DOE-25 reports, by year */
  reports: Record<string, ProcessedReport>;
  perPupil: PerPupilExpenditure[];
  statePerPupil: PerPupilExpenditure[];
  stateRollups: StateExpenditureRollup[];
  stateRevenue: StateRevenue[];
  stateExpenditure: StateExpenditure[];
  stateADM: StateADM[];
  revenueEntryTypes: EntryType[];
  expenditureEntryTypes: EntryType[];
}

// Revenue by source, sorted as the Overall tab's revenue card sorts it: by the name of the line's
// super category ("Revenue from Local Sources")
const SOURCES = [
  { key: 'local', name: 'Local Sources' },
  { key: 'state', name: 'State Sources' },
  { key: 'federal', name: 'Federal Sources' },
  { key: 'other', name: 'Other Sources' },
] as const;
type Source = typeof SOURCES[number]['key'];
const sourceOf = (superCategory: string): Source =>
  superCategory.includes('Local') ? 'local'
    : superCategory.includes('State') ? 'state'
      : superCategory.includes('Federal') ? 'federal'
        : 'other';
const bySource = (items: { source: Source; value: number }[]): Record<Source, number> =>
  items.reduce((totals, item) => ({ ...totals, [item.source]: totals[item.source] + item.value }), { local: 0, state: 0, federal: 0, other: 0 });

const total = (items: { value: number }[]) => items.reduce((sum, item) => sum + item.value, 0);
const share = (value: number | null | undefined, whole: number): ExcelValue => (typeof value === 'number' && whole > 0 ? value / whole : null);
const sortedYears = (years: Iterable<number>) => [...new Set(years)].sort((a, b) => a - b);

interface Line {
  category: string;
  subCategory: string;
  name: string;
}
const lineKey = (line: Line) => `${line.category}|${line.subCategory}|${line.name}`;

// Balance sheet lines as the Balance Sheet tab sorts them: by category and type, then the largest first
const sortBalanceLines = (items: FinancialComparisonItem[]) => [...items].sort((a, b) =>
  a.category.localeCompare(b.category) || a.subCategory.localeCompare(b.subCategory) || b.currentValue - a.currentValue);

/**
 * Each line's value in every year, grouped as the page's tables group them and in their order, which
 * follows the latest year's values
 */
const linesByYear = (
  reports: Record<string, ProcessedReport>,
  years: number[],
  items: (report: ProcessedReport) => FinancialItem[],
  line: (item: FinancialItem) => Line | null,
  sort: (items: FinancialComparisonItem[]) => FinancialComparisonItem[],
) => {
  const lines = new Map<string, Line & { values: Map<number, number> }>();
  years.forEach(year => items(reports[year]).forEach(item => {
    const found = line(item);
    if (!found) return;
    const entry = lines.get(lineKey(found)) ?? { ...found, values: new Map<number, number>() };
    entry.values.set(year, (entry.values.get(year) ?? 0) + item.value);
    lines.set(lineKey(found), entry);
  }));
  const latest = years[years.length - 1];
  return sort([...lines.values()].map(({ category, subCategory, name, values }) => ({
    category, subCategory, name, currentValue: values.get(latest) ?? 0, previousValue: 0,
  }))).map(item => lines.get(lineKey(item))!);
};

const balanceLine = (superCategoryIds: number[]) => (item: FinancialItem): Line | null => {
  const superCategory = item.entry_type.category?.super_category;
  if (!superCategory || !superCategoryIds.includes(superCategory.id)) return null;
  return { category: superCategory.name || 'Uncategorized', subCategory: item.entry_type.category?.name || 'Uncategorized', name: item.entry_type.name };
};

/**
 * The Financials page as one workbook: the Overall tab's spending, revenue and cost per student by
 * year with New Hampshire's beside them, its cost breakdown, then every line of the Expenditures,
 * Revenues and Balance Sheet tabs in every year
 */
export const financialsWorkbook = (data: FinancialsData): ExcelSheet[] => {
  const title = entityTitle('district', data.name);
  const reportYears = sortedYears(Object.keys(data.reports).map(Number));
  const latestReportYear = reportYears[reportYears.length - 1];
  const yearColumn = { header: 'School Year', width: 12 };
  const inDollarsOf = (year: number) => `In ${formatSchoolYear(year)} Dollars`;
  const adjusted = (value: number | null | undefined, year: number, toYear: number | undefined): ExcelValue =>
    typeof value === 'number' && toYear ? calculateInflationAdjustedAmount(value, year, toYear) : null;

  // Spending by year, with the state's total spending
  const stateSpending = new Map(data.stateRollups.map(row => [row.year, row.total]));
  const spendingSheet: ExcelSheet = {
    name: 'Spending By Year',
    title: 'Total Spending, Instruction and Support Services',
    subtitle: `${title}'s spending as reported, with New Hampshire's total spending`,
    columns: [
      yearColumn,
      { header: 'Total Spending', width: 16, format: DOLLARS },
      { header: 'Instruction', width: 16, format: DOLLARS },
      { header: 'Support Services', width: 16, format: DOLLARS },
      { header: `Total Spending, ${latestReportYear ? inDollarsOf(latestReportYear) : 'Adjusted'}`, width: 22, format: DOLLARS, wrap: true },
      { header: nh('Total Spending'), width: 18, format: DOLLARS },
    ],
    rows: reportYears.map(year => {
      const report = data.reports[year];
      const spending = total(report.expenditures);
      const { instruction, support } = instructionAndSupport(report);
      return [formatSchoolYear(year), spending, instruction, support, adjusted(spending, year, latestReportYear), stateSpending.get(year) ?? null];
    }),
  };

  // The Overall tab's breakdown of the page's year, as shares and per student, beside the state's
  const breakdownReport = data.reports[data.breakdownYear];
  const stateItems = data.stateExpenditure.filter(item => item.year === data.breakdownYear);
  // As the page does, per student with the state's latest average daily membership
  const latestStateADM = data.stateADM.reduce<StateADM | null>((latest, row) => (!latest || row.year > latest.year ? row : latest), null);
  const breakdownInput = { stateItems, entryTypes: data.expenditureEntryTypes, districtReport: breakdownReport, stateADM: latestStateADM };
  const shares = costBreakdown('percentage', breakdownInput);
  const perStudent = costBreakdown('admCost', breakdownInput);
  const hasState = stateItems.length > 0;
  const breakdownSheet: ExcelSheet = {
    name: 'Spending Breakdown',
    title: `Breakdown of District Costs, ${formatSchoolYear(data.breakdownYear)}`,
    subtitle: 'Each category\'s share of spending and cost per student, beside New Hampshire\'s',
    columns: [
      { header: 'Category', width: 26 },
      { header: 'Share of Spending', width: 14, format: PERCENT },
      { header: nh('Share of Spending'), width: 14, format: PERCENT },
      { header: 'Per Student', width: 14, format: DOLLARS },
      { header: nh('Per Student'), width: 14, format: DOLLARS },
    ],
    rows: shares.map((row, index) => [
      row.isSubcategory ? `    ${row.name}` : row.name,
      asFraction(row.district),
      hasState ? asFraction(row.state) : null,
      perStudent[index].district,
      hasState ? perStudent[index].state : null,
    ]),
    subtotalRows: shares.flatMap((row, index) => (row.isSubcategory ? [] : [index])),
  };

  // Revenue by source and year, with the state's mix of sources
  const stateSourceOf = new Map(data.revenueEntryTypes.map(type => [type.id, sourceOf(type.category?.super_category?.name || 'Uncategorized')]));
  const stateRevenueByYear = new Map(sortedYears(data.stateRevenue.map(row => row.year)).map(year => [
    year,
    bySource(data.stateRevenue.filter(row => row.year === year).map(row => ({ source: stateSourceOf.get(row.entry_type_id) ?? 'other', value: row.value }))),
  ]));
  const revenueSheet: ExcelSheet = {
    name: 'Revenue By Year',
    title: 'Revenue By Source',
    subtitle: `${title}'s revenue as received, and each source's share beside New Hampshire's`,
    columns: [
      yearColumn,
      { header: 'Total Revenue', width: 16, format: DOLLARS },
      ...SOURCES.map(source => ({ header: source.name, width: 16, format: DOLLARS })),
      ...SOURCES.map(source => ({ header: `${source.name} (%)`, width: 14, format: PERCENT })),
      ...SOURCES.map(source => ({ header: nh(`${source.name} (%)`), width: 14, format: PERCENT })),
    ],
    rows: reportYears.map(year => {
      const revenues = data.reports[year].revenues;
      const sources = bySource(revenues.map(revenue => ({ source: sourceOf(revenue.entry_type.category?.super_category?.name || 'Uncategorized'), value: revenue.value })));
      const revenue = total(revenues);
      const state = stateRevenueByYear.get(year);
      const stateTotal = state ? SOURCES.reduce((sum, source) => sum + state[source.key], 0) : 0;
      return [
        formatSchoolYear(year),
        revenue,
        ...SOURCES.map(source => sources[source.key]),
        ...SOURCES.map(source => share(sources[source.key], revenue)),
        ...SOURCES.map(source => share(state?.[source.key], stateTotal)),
      ];
    }),
  };

  // Cost per student by school level, the district's and the state's
  const statePerPupil = new Map(data.statePerPupil.map(row => [row.year, row]));
  const districtPerPupil = new Map(data.perPupil.map(row => [row.year, row]));
  const perPupilYears = sortedYears([...districtPerPupil.keys(), ...statePerPupil.keys()]);
  const latestPerPupilYear = data.perPupil.length ? Math.max(...data.perPupil.map(row => row.year)) : perPupilYears[perPupilYears.length - 1];
  const levels = ['elementary', 'middle', 'high'] as const;
  const levelNames = { elementary: 'Elementary', middle: 'Middle', high: 'High' };
  const allGradesAdjusted = `All Grades, ${latestPerPupilYear ? inDollarsOf(latestPerPupilYear) : 'Adjusted'}`;
  const perPupilSheet: ExcelSheet = {
    name: 'Cost Per Student',
    subtitle: 'Current spending less tuition and transportation, per student, by school level',
    columns: [
      yearColumn,
      ...levels.map(level => ({ header: levelNames[level], width: 14, format: DOLLARS })),
      { header: 'All Grades', width: 14, format: DOLLARS },
      { header: allGradesAdjusted, width: 22, format: DOLLARS, wrap: true },
      ...levels.map(level => ({ header: nh(levelNames[level]), width: 14, format: DOLLARS })),
      { header: nh('All Grades'), width: 14, format: DOLLARS },
      { header: nh(allGradesAdjusted), width: 22, format: DOLLARS, wrap: true },
    ],
    rows: perPupilYears.map(year => {
      const district = districtPerPupil.get(year);
      const state = statePerPupil.get(year);
      return [
        formatSchoolYear(year),
        ...levels.map(level => district?.[level] ?? null),
        district?.total ?? null,
        adjusted(district?.total, year, latestPerPupilYear),
        ...levels.map(level => state?.[level] ?? null),
        state?.total ?? null,
        adjusted(state?.total, year, latestPerPupilYear),
      ];
    }),
  };

  // Every line of the Expenditures, Revenues and Balance Sheet tabs, a column per year
  const lineSheet = (
    name: string,
    subtitle: string,
    headers: [string, string, string],
    lines: ReturnType<typeof linesByYear>,
    totalLabel: string,
  ): ExcelSheet => ({
    name,
    subtitle,
    columns: [
      { header: headers[0], width: 32 },
      { header: headers[1], width: 28 },
      { header: headers[2], width: 36 },
      ...reportYears.map(year => ({ header: formatSchoolYear(year), width: 14, format: DOLLARS })),
    ],
    rows: lines.map(line => [line.category, line.subCategory, line.name, ...reportYears.map(year => line.values.get(year) ?? null)]),
    totalRow: [totalLabel, null, null, ...reportYears.map(year => lines.reduce((sum, line) => sum + (line.values.get(year) ?? 0), 0))],
  });
  const expenditureLines = linesByYear(data.reports, reportYears, report => report.expenditures, expenditureLine, sortExpenditureComparisonItems);
  const revenueLines = linesByYear(
    data.reports, reportYears, report => report.revenues,
    revenue => ({
      category: normalizeRevenueCategory(revenue.entry_type.category?.super_category?.name || 'Uncategorized'),
      subCategory: revenue.entry_type.category?.name || 'Uncategorized',
      name: revenue.entry_type.name,
    }),
    sortRevenueComparisonItems,
  );
  // Assets are super categories 1 and 3, liabilities 2, as on the Balance Sheet tab
  const assetLines = linesByYear(data.reports, reportYears, report => report.balance_sheets, balanceLine([1, 3]), sortBalanceLines);
  const liabilityLines = linesByYear(data.reports, reportYears, report => report.balance_sheets, balanceLine([2]), sortBalanceLines);

  return [
    spendingSheet,
    ...(breakdownReport ? [breakdownSheet] : []),
    revenueSheet,
    perPupilSheet,
    lineSheet('Expenditure Breakdown', 'Every spending line on the district\'s DOE-25 report, as reported', ['Category', 'Sub Category', 'Expenditure Type'], expenditureLines, 'Total'),
    lineSheet('Revenue Breakdown', 'Every revenue line on the district\'s DOE-25 report, as received', ['Category', 'Sub Category', 'Revenue Source'], revenueLines, 'Total'),
    lineSheet('Assets Breakdown', 'The district\'s assets on its DOE-25 balance sheet', ['Category', 'Type', 'Asset'], assetLines, 'Total Assets'),
    lineSheet('Liabilities Breakdown', 'The district\'s liabilities on its DOE-25 balance sheet', ['Category', 'Type', 'Liability'], liabilityLines, 'Total Liabilities'),
    notesSheet(`${data.displayName} for ${title}`, [
      'Sources: NH Department of Education DOE-25 district annual financial reports (spending, revenue and balance sheet) and cost per pupil reports; for New Hampshire, the statewide expenditure summary (total spending), DOE-25 totals and average daily membership.',
      'Dollar figures are as reported, in each year\'s dollars. Columns "In ... Dollars" are adjusted with the consumer price index (CPI-U, U.S. city average), as the page\'s Adjust For Inflation button does.',
      'Instruction and support services are the totals the Overall tab charts; support services include food service. The page compares the growth of total spending over ten years with New Hampshire\'s total spending, NH DOE\'s total expenditures for elementary and secondary education.',
      `The spending breakdown is for ${formatSchoolYear(data.breakdownYear)}, the year the page shows. Per student, it divides spending by average daily membership, leaving out the district's spending for a school level it has no students in; New Hampshire's is divided by the state's latest average daily membership.`,
      'Revenue sources follow the DOE-25\'s revenue categories. Other sources include borrowing (bond sales) and transfers between the district\'s own funds. Local revenue is mostly property taxes.',
      'Cost per student is NH DOE\'s cost per pupil: current spending less tuition and transportation, divided by average daily membership.',
      'The Expenditure, Revenue, Assets and Liabilities sheets hold every line the page\'s tables show, for every year on file rather than the two the page compares.',
      'Columns starting "NH" are New Hampshire\'s figures for the same school year.',
    ]),
  ];
};

import { BaseEarlyExitData } from '@/store/slices/outcomeSlice';
import { POST_GRADUATION_TYPE_ORDER } from '@/features/district/utils/outcomeDataProcessing';
import { COUNT, ExcelSheet, ExcelValue, notesSheet, PERCENT } from '@/features/state/utils/excel';
import { PLAN_LABELS, plainLabel } from '@/features/state/utils/labels';
import { formatSchoolYear, GraduationCohortRow, pivotByYear, PostGraduationRow, sortByYear, YearRow } from '@/features/state/utils/stateMetrics';
import { EntityKind } from '../entity';
import { entityTitle, nh } from '../excel';

export interface OutcomesData {
  kind: EntityKind;
  name: string;
  displayName: string;
  cohorts: GraduationCohortRow[];
  stateCohorts: GraduationCohortRow[];
  postGraduation: PostGraduationRow[];
  statePostGraduation: PostGraduationRow[];
  earlyExit: BaseEarlyExitData[];
  stateEarlyExit: BaseEarlyExitData[];
}

const share = (count: number | null | undefined, total: number): ExcelValue =>
  typeof count === 'number' && total > 0 ? count / total : null;

// Plans in the page's table order, then any the order doesn't know
const planOrder = (rows: PostGraduationRow[]): string[] => {
  const names = new Set(rows.map(row => row.post_graduation_type.name));
  const known: string[] = POST_GRADUATION_TYPE_ORDER.filter(name => names.has(name));
  return [...known, ...[...names].filter(name => !known.includes(name))];
};

const total = (row: YearRow | undefined, plans: string[]) =>
  plans.reduce((sum, plan) => sum + ((row?.[plan] as number | null | undefined) ?? 0), 0);

/**
 * The Graduation / College page as one workbook: each class's graduation, its plans after high school
 * (the latest class and over time) and the annual dropout rate the page leaves out, each with New
 * Hampshire's figures for the same class or year.
 */
export const outcomesWorkbook = (data: OutcomesData): ExcelSheet[] => {
  const title = entityTitle(data.kind, data.name);
  const stateCohort = new Map(data.stateCohorts.map(cohort => [cohort.year, cohort]));
  const stateRate = (year: number, count: (cohort: GraduationCohortRow) => number) => {
    const cohort = stateCohort.get(year);
    return cohort ? share(count(cohort), cohort.cohort_size) : null;
  };

  const plans = planOrder([...data.postGraduation, ...data.statePostGraduation]);
  const planCounts = pivotByYear(data.postGraduation, row => row.post_graduation_type.name, row => row.value);
  const statePlanCounts = new Map(
    pivotByYear(data.statePostGraduation, row => row.post_graduation_type.name, row => row.value).map(row => [row.year, row])
  );
  const latest = planCounts[planCounts.length - 1];
  const latestTotal = total(latest, plans);
  const latestState = latest ? statePlanCounts.get(latest.year) : undefined;
  const latestStateTotal = total(latestState, plans);

  const stateExit = new Map(data.stateEarlyExit.map(row => [row.year, row]));

  return [
    {
      name: 'Graduation By Class',
      title: 'Four-Year Graduation Rate and What Happened to Each Class',
      subtitle: `${title}: students who started grade 9 together, adjusted for transfers in and out, four years later`,
      columns: [
        { header: 'Class of', width: 10 },
        { header: 'Students in Class', width: 14, format: COUNT },
        { header: 'Graduated', format: COUNT },
        { header: 'Earned a HiSET', width: 14, format: COUNT },
        { header: 'Dropped Out', format: COUNT },
        { header: 'Still in High School or Other', width: 18, format: COUNT },
        { header: 'Graduated (%)', width: 14, format: PERCENT },
        { header: 'Earned a HiSET (%)', width: 14, format: PERCENT },
        { header: 'Dropped Out (%)', width: 14, format: PERCENT },
        { header: 'Still in High School or Other (%)', width: 18, format: PERCENT },
        { header: nh('Graduated (%)'), width: 14, format: PERCENT },
        { header: nh('Earned a HiSET (%)'), width: 14, format: PERCENT },
        { header: nh('Dropped Out (%)'), width: 14, format: PERCENT },
      ],
      rows: sortByYear(data.cohorts).filter(cohort => cohort.cohort_size > 0).map(cohort => {
        const other = cohort.cohort_size - cohort.graduate - cohort.earned_hiset - cohort.dropped_out;
        return [
          cohort.year, cohort.cohort_size, cohort.graduate, cohort.earned_hiset, cohort.dropped_out, other,
          share(cohort.graduate, cohort.cohort_size), share(cohort.earned_hiset, cohort.cohort_size),
          share(cohort.dropped_out, cohort.cohort_size), share(other, cohort.cohort_size),
          stateRate(cohort.year, row => row.graduate), stateRate(cohort.year, row => row.earned_hiset), stateRate(cohort.year, row => row.dropped_out),
        ];
      }),
    },
    {
      name: latest ? `Plans of the Class of ${latest.year}` : 'Plans of the Latest Class',
      subtitle: `${title}'s graduates, with New Hampshire's for the same class`,
      columns: [
        { header: 'Plan', width: 36 },
        { header: 'Graduates', format: COUNT },
        { header: 'Share', format: PERCENT },
        { header: nh('Share'), format: PERCENT },
      ],
      rows: latest
        ? plans.map(plan => [plainLabel(PLAN_LABELS, plan), latest[plan] ?? null, share(latest[plan], latestTotal), share(latestState?.[plan], latestStateTotal)])
        : [],
      totalRow: latest ? ['All Graduates', latestTotal, latestTotal ? 1 : null, latestStateTotal ? 1 : null] : undefined,
    },
    {
      name: 'Plans Over Time',
      title: "Graduates' Plans After High School Over Time",
      subtitle: 'Percentage of graduates; reported by high school graduates, not confirmed',
      columns: [
        { header: 'Class of', width: 10 },
        ...plans.map(plan => ({ header: plainLabel(PLAN_LABELS, plan), width: 16, format: PERCENT })),
        { header: 'All Graduates', width: 14, format: COUNT },
        ...plans.map(plan => ({ header: nh(plainLabel(PLAN_LABELS, plan)), width: 16, format: PERCENT })),
      ],
      rows: planCounts.map(counts => {
        const graduates = total(counts, plans);
        const state = statePlanCounts.get(counts.year);
        const stateGraduates = total(state, plans);
        return [
          counts.year,
          ...plans.map(plan => share(counts[plan], graduates)),
          graduates,
          ...plans.map(plan => share(state?.[plan], stateGraduates)),
        ];
      }),
    },
    {
      name: 'Annual Dropout Rate',
      subtitle: 'Percentage of high school students (grades 9-12) who dropped out during the school year',
      columns: [
        { header: 'School Year', width: 12 },
        { header: 'Students (Grades 9-12)', width: 16, format: COUNT },
        { header: 'Dropped Out', format: COUNT },
        { header: 'Annual Dropout Rate', width: 14, format: PERCENT },
        { header: 'Four-Year Estimate', width: 14, format: PERCENT },
        { header: nh('Annual Dropout Rate'), width: 14, format: PERCENT },
      ],
      rows: sortByYear(data.earlyExit).map(row => [
        formatSchoolYear(row.year), row.adjusted_fall_enrollment, row.dropped_out, row.annual_dropout_percentage, row.four_year_dropout_percentage,
        stateExit.get(row.year)?.annual_dropout_percentage ?? null,
      ]),
    },
    notesSheet(`${data.displayName} for ${title}`, [
      'Sources: NH Department of Education graduation cohort, completers by category (post-graduation plans) and early exit (dropout) reports.',
      'A class is the students who started grade 9 together, adjusted for students transferring in and out; students who move away are taken out of the class. Graduated means a regular or adult high school diploma within four years. Earned a HiSET means they left and later earned a high school equivalency certificate. Dropped Out means they left without a diploma, aren\'t still enrolled and didn\'t earn a HiSET.',
      'Still in High School or Other is the rest of the class: students still enrolled in high school after four years, or who left with a non-standard diploma. The page doesn\'t show it; it\'s the class size less the other three.',
      'Plans are what graduates report at the end of senior year, not confirmed enrollment or employment. Shares are of all reported graduates, including those whose plans are unknown.',
      'The annual dropout rate counts every high school student each year, so it\'s lower than the share of a class that drops out over four years. The four-year estimate is the state\'s: the chance a student drops out at some point in grades 9-12 at that year\'s rates. The page doesn\'t show either.',
      'Columns starting "NH" are New Hampshire\'s figures for the same class or school year.',
    ]),
  ];
};

/**
 * Cohort-based enrollment projection shared by the district and school
 * Enrollment Projection tables.
 *
 * Kindergarten and Grade 1 are projected as historical averages; every later
 * grade is last year's (projected) size of the grade below plus the average
 * cohort change for that grade transition, repeated once per projected year.
 *
 * The district and school pages grew separate copies of this algorithm that
 * drifted apart. The drift is kept on purpose (the pages must not change) and
 * is selected by `supportedGrades`: `null` gives the district rules, an array
 * gives the school rules. The differences are:
 * - Rows for one (year, grade): district sums them (one row per town); school
 *   uses the first row for cohort changes, the last row for current class sizes.
 * - Cohort change inclusion: district needs both summed enrollments > 0; school
 *   only needs both rows to exist (0/null enrollments count as 0).
 * - K/G1 averages: district averages per-year totals over the years that have
 *   rows; school averages individual rows and uses 0 for unsupported grades.
 * - Supported grades (school only): unsupported grades are 0 in current class
 *   sizes, projections and totals. If the lowest supported grade id is not K or
 *   G1, that grade is projected as its own historical row average. The lowest id
 *   can be Preschool (1), or Infinity for an empty list, which adds an unseen
 *   `Infinity` key to the projection.
 * - Totals: district sums every grade id present; school sums supported ids only.
 * - Table "Current" cells use the summed rows on both pages (`currentSum`),
 *   which can differ from the school's last-row `currentClassSizes`.
 */

// Grade ID constants
export const GRADE_IDS = {
  KINDERGARTEN: 2,
  GRADE_1: 3,
  GRADE_2: 4,
  GRADE_3: 5,
  GRADE_4: 6,
  GRADE_5: 7,
  GRADE_6: 8,
  GRADE_7: 9,
  GRADE_8: 10,
  GRADE_9: 11,
  GRADE_10: 12,
  GRADE_11: 13,
  GRADE_12: 14,
} as const;

export interface EnrollmentRow {
  year: number;
  grade_id: number;
  enrollment: number | null | undefined;
}

export interface EnrollmentProjectionYears {
  startYear: number;
  endYear: number;
  futureYear: number;
}

/** What the summary tables hand their page for the projection chart. */
export interface EnrollmentProjectionSnapshot {
  currentClassSizes: { [key: number]: number };
  projectedClassSizes: { [key: number]: number };
  endYear: number;
  futureYear: number;
}

export interface EnrollmentProjection {
  /** Average change per transition, keyed `grade{g}To{g+1}`, rounded to 2 places. */
  cohortChanges: { [key: string]: number };
  avgKClass: number;
  avgG1Class: number;
  currentClassSizes: { [key: number]: number };
  projectedClassSizes: { [key: number]: number };
  currentTotalEnrollment: number;
  projectedTotalEnrollment: number;
  /** Unrounded sum of all rows at (endYear, gradeId), 0 if there are none. */
  currentSum: (gradeId: number) => number;
}

interface Cell {
  sum: number;
  first: number;
}

type RowIndex = Map<number, Map<number, Cell>>;

const value = (row: EnrollmentRow): number => row.enrollment || 0;

const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

/** Text for a Change cell: '-' for no change, otherwise signed with 2 decimals. */
export const formatChange = (change: number): string =>
  change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '-';

/** Groups rows by year then grade, keeping the sum and the first row's value. */
const indexRows = (rows: readonly EnrollmentRow[]): RowIndex => {
  const index: RowIndex = new Map();
  rows.forEach(row => {
    let byGrade = index.get(row.year);
    if (!byGrade) {
      byGrade = new Map();
      index.set(row.year, byGrade);
    }
    const cell = byGrade.get(row.grade_id);
    if (cell) {
      cell.sum += value(row);
    } else {
      byGrade.set(row.grade_id, { sum: value(row), first: value(row) });
    }
  });
  return index;
};

/** District: both summed enrollments must be positive. */
const districtCohortChange = (next: Cell | undefined, prev: Cell | undefined): number | null => {
  const nextSum = next ? next.sum : 0;
  const prevSum = prev ? prev.sum : 0;
  return nextSum > 0 && prevSum > 0 ? nextSum - prevSum : null;
};

/** School: both rows must exist; the first row of each counts. */
const schoolCohortChange = (next: Cell | undefined, prev: Cell | undefined): number | null =>
  next && prev ? next.first - prev.first : null;

const averageCohortChanges = (
  index: RowIndex,
  startYear: number,
  endYear: number,
  cohortChange: (next: Cell | undefined, prev: Cell | undefined) => number | null
): { [key: string]: number } => {
  const changes: { [key: string]: number[] } = {};
  for (let grade = GRADE_IDS.GRADE_1; grade < GRADE_IDS.GRADE_12; grade++) {
    changes[`grade${grade}To${grade + 1}`] = [];
  }

  // Each year in the range except the last, then each grade transition
  for (let year = startYear; year < endYear; year++) {
    for (let grade = GRADE_IDS.GRADE_1; grade < GRADE_IDS.GRADE_12; grade++) {
      const change = cohortChange(index.get(year + 1)?.get(grade + 1), index.get(year)?.get(grade));
      if (change !== null) {
        changes[`grade${grade}To${grade + 1}`].push(change);
      }
    }
  }

  const averages: { [key: string]: number } = {};
  Object.entries(changes).forEach(([key, values]) => {
    averages[key] = values.length > 0 ? Number(calculateAverage(values).toFixed(2)) : 0;
  });
  return averages;
};

/** District: per-grade sum of the endYear rows, for every grade id present. */
const districtCurrentClassSizes = (rows: readonly EnrollmentRow[], endYear: number) => {
  const currentYearData = rows
    .filter(item => item.year === endYear)
    .reduce((acc, item) => {
      if (!acc[item.grade_id]) {
        acc[item.grade_id] = 0;
      }
      acc[item.grade_id] += value(item);
      return acc;
    }, {} as { [key: number]: number });

  const currentClassSizes: { [key: number]: number } = {};
  Object.entries(currentYearData).forEach(([gradeId, enrollment]) => {
    currentClassSizes[Number(gradeId)] = enrollment;
  });
  return currentClassSizes;
};

/** School: the last endYear row per grade, 0 for unsupported grades. */
const schoolCurrentClassSizes = (
  rows: readonly EnrollmentRow[],
  endYear: number,
  supportedGrades: readonly number[]
) => {
  const currentClassSizes: { [key: number]: number } = {};
  rows.filter(item => item.year === endYear).forEach(item => {
    currentClassSizes[item.grade_id] = supportedGrades.includes(item.grade_id) ? value(item) : 0;
  });
  return currentClassSizes;
};

const inYearRange = (row: EnrollmentRow, gradeId: number, startYear: number, endYear: number) =>
  row.year >= startYear && row.year <= endYear && row.grade_id === gradeId;

/** District: mean of the per-year totals, over the years that have rows. */
const districtGradeAverage = (
  rows: readonly EnrollmentRow[],
  gradeId: number,
  startYear: number,
  endYear: number
) =>
  calculateAverage(
    Object.values(rows
      .filter(item => inYearRange(item, gradeId, startYear, endYear))
      .reduce((acc, item) => {
        if (!acc[item.year]) {
          acc[item.year] = 0;
        }
        acc[item.year] += value(item);
        return acc;
      }, {} as { [key: number]: number }))
  );

/** School: mean of the individual rows. */
const schoolGradeAverage = (
  rows: readonly EnrollmentRow[],
  gradeId: number,
  startYear: number,
  endYear: number
) =>
  calculateAverage(
    rows.filter(item => inYearRange(item, gradeId, startYear, endYear)).map(value)
  );

/**
 * Projects enrollment from `endYear` to `futureYear`.
 *
 * @param supportedGrades `null` for the district (all towns, all grades), or the
 *   school's grade ids in API order for the school rules (see the file comment).
 */
export const projectEnrollment = (
  rows: readonly EnrollmentRow[],
  { startYear, endYear, futureYear }: EnrollmentProjectionYears,
  supportedGrades: readonly number[] | null
): EnrollmentProjection => {
  const isSchool = supportedGrades !== null;
  const isSupported = (gradeId: number) => supportedGrades === null || supportedGrades.includes(gradeId);

  const index = indexRows(rows);
  const cohortChanges = averageCohortChanges(
    index,
    startYear,
    endYear,
    isSchool ? schoolCohortChange : districtCohortChange
  );

  const currentClassSizes = supportedGrades === null
    ? districtCurrentClassSizes(rows, endYear)
    : schoolCurrentClassSizes(rows, endYear, supportedGrades);

  const gradeAverage = (gradeId: number) => {
    if (!isSchool) return districtGradeAverage(rows, gradeId, startYear, endYear);
    return isSupported(gradeId) ? schoolGradeAverage(rows, gradeId, startYear, endYear) : 0;
  };
  const avgKClass = gradeAverage(GRADE_IDS.KINDERGARTEN);
  const avgG1Class = gradeAverage(GRADE_IDS.GRADE_1);

  // School only: an entry grade other than K or G1 is projected as its own average
  const earliestGrade = supportedGrades === null ? null : Math.min(...supportedGrades);
  const earliestUsesAverage = earliestGrade !== null &&
    earliestGrade !== GRADE_IDS.KINDERGARTEN &&
    earliestGrade !== GRADE_IDS.GRADE_1;
  const avgEarliestClass = earliestUsesAverage
    ? schoolGradeAverage(rows, earliestGrade, startYear, endYear)
    : 0;

  const yearsToProject = futureYear - endYear;
  let currentProjections = { ...currentClassSizes };

  for (let year = 0; year < yearsToProject; year++) {
    const nextYearProjections: { [key: number]: number } = {};

    nextYearProjections[GRADE_IDS.KINDERGARTEN] = avgKClass;
    nextYearProjections[GRADE_IDS.GRADE_1] = avgG1Class;
    if (earliestUsesAverage) {
      nextYearProjections[earliestGrade] = avgEarliestClass;
    }

    // Grades 2-12: the grade below's current size plus its cohort change
    for (let grade = GRADE_IDS.GRADE_1; grade < GRADE_IDS.GRADE_12; grade++) {
      if (!isSupported(grade + 1)) {
        nextYearProjections[grade + 1] = 0;
      } else if (earliestUsesAverage && grade + 1 === earliestGrade) {
        nextYearProjections[grade + 1] = avgEarliestClass;
      } else {
        const currentGradeEnrollment = currentProjections[grade] || 0;
        const cohortChange = cohortChanges[`grade${grade}To${grade + 1}`] || 0;
        nextYearProjections[grade + 1] = currentGradeEnrollment + cohortChange;
      }
    }

    currentProjections = nextYearProjections;
  }

  const projectedClassSizes: { [key: number]: number } = {};
  Object.assign(projectedClassSizes, currentProjections);

  const total = (sizes: { [key: number]: number }) =>
    Object.entries(sizes)
      .filter(([gradeId]) => isSupported(Number(gradeId)))
      .reduce((sum, [, size]) => sum + size, 0);

  const endYearRows = index.get(endYear);

  return {
    cohortChanges,
    avgKClass,
    avgG1Class,
    currentClassSizes,
    projectedClassSizes,
    currentTotalEnrollment: total(currentClassSizes),
    projectedTotalEnrollment: total(projectedClassSizes),
    currentSum: (gradeId: number) => endYearRows?.get(gradeId)?.sum ?? 0,
  };
};

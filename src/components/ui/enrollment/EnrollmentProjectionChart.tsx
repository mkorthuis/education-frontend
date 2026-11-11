import React, { useMemo } from 'react';
import TrendChart, { CONTEXT_COLOR, SERIES_COLORS } from '@/features/state/components/TrendChart';
import { formatCompact, formatCount, formatSchoolYear } from '@/features/state/utils/stateMetrics';
import { GRADE_IDS } from '@/utils/enrollmentProjection';

interface EnrollmentProjectionChartProps {
  /** Students by grade id */
  currentEnrollment: { [gradeId: number]: number };
  projectedEnrollment: { [gradeId: number]: number };
  endYear: number;
  futureYear: number;
  /** The grade ids to show, e.g. a school's; kindergarten to grade 12 by default */
  grades?: number[];
}

const K_TO_12 = Array.from({ length: 13 }, (_, index) => GRADE_IDS.KINDERGARTEN + index);
const gradeLabel = (id: number) => (id === GRADE_IDS.KINDERGARTEN ? 'K' : `G${id - GRADE_IDS.KINDERGARTEN}`);

/** Students in each grade now and as projected, beside the projection's table. The chart's "years" are grades. */
const EnrollmentProjectionChart: React.FC<EnrollmentProjectionChartProps> = ({
  currentEnrollment,
  projectedEnrollment,
  endYear,
  futureYear,
  grades
}) => {
  const rows = useMemo(() => K_TO_12
    .filter(id => !grades || grades.includes(id))
    .map(id => ({ year: id, current: currentEnrollment[id] ?? null, projected: projectedEnrollment[id] ?? null })),
  [currentEnrollment, projectedEnrollment, grades]);

  return (
    <TrendChart
      title="Current and Projected Students By Grade"
      shortTitle="Students By Grade"
      subtitle="# of Students"
      data={rows}
      series={[
        { key: 'current', name: `Current (${formatSchoolYear(endYear)})`, color: CONTEXT_COLOR },
        { key: 'projected', name: `Projected (${formatSchoolYear(futureYear)})`, color: SERIES_COLORS[0] },
      ]}
      format={formatCount}
      axisFormat={value => formatCompact(value)}
      axis="fit"
      yearLabel={gradeLabel}
      yearHeader="Grade"
      // The projection's table beside it lists the grades
      showViewToggle={false}
    />
  );
};

export default EnrollmentProjectionChart;

import React, { useMemo } from 'react';
import { SchoolEnrollmentData } from '@/services/api/endpoints/enrollments';
import TrendChart from '@/features/state/components/TrendChart';
import { formatCompact, formatCount, mergeSeries, REMOTE_BAND, totalsByYear } from '@/features/state/utils/stateMetrics';

export interface SchoolEnrollmentChartProps {
  enrollmentData: SchoolEnrollmentData[];
}

const SERIES = [{ key: 'students', name: 'Students' }];

/** The school's students each year, across its grades */
const SchoolEnrollmentChart: React.FC<SchoolEnrollmentChartProps> = ({ enrollmentData }) => {
  const rows = useMemo(() => mergeSeries({ students: totalsByYear(enrollmentData, row => row.enrollment) }), [enrollmentData]);

  return (
    <TrendChart
      title="Current Students"
      subtitle="# of Students"
      // Phones show the chart alone
      viewToggleOnPhones={false}
      data={rows}
      series={SERIES}
      format={formatCount}
      axisFormat={value => formatCompact(value)}
      axis="fit"
      // Its axis labels say where it starts
      showAxisNote={false}
      bands={REMOTE_BAND}
    />
  );
};

export default SchoolEnrollmentChart;

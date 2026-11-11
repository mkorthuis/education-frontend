import React, { useMemo } from 'react';
import { SchoolEnrollmentData } from '@/services/api/endpoints/enrollments';
import TrendChart from '@/features/state/components/TrendChart';
import { formatCompact, formatCount, mergeSeries, REMOTE_BAND, totalsByYear } from '@/features/state/utils/stateMetrics';

export interface SchoolEnrollmentChartProps {
  enrollmentData: SchoolEnrollmentData[];
}

/** The school's students each year, across its grades */
const SchoolEnrollmentChart: React.FC<SchoolEnrollmentChartProps> = ({ enrollmentData }) => {
  const rows = useMemo(() => mergeSeries({ students: totalsByYear(enrollmentData, row => row.enrollment) }), [enrollmentData]);

  return (
    <TrendChart
      title="Current Students"
      subtitle="# of Students"
      data={rows}
      series={[{ key: 'students', name: 'Students' }]}
      format={formatCount}
      axisFormat={value => formatCompact(value)}
      axis="fit"
      bands={REMOTE_BAND}
    />
  );
};

export default SchoolEnrollmentChart;

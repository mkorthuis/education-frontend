import React, { useMemo, useState } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { Measurement } from '@/store/slices/measurementSlice';
import TrendChart from '@/features/state/components/TrendChart';
import ChartSelect from '@/features/state/components/ChartSelect';
import { formatCompact, formatCount, mergeSeries, REMOTE_BAND, YearValue } from '@/features/state/utils/stateMetrics';
import {
  ENROLLMENT_MEASUREMENT_TYPES,
  ENROLLMENT_MEASUREMENT_TYPE_NAMES,
  ENROLLMENT_MEASUREMENT_TYPE_ORDER,
  processEnrollmentMeasurements
} from '@/features/district/utils/enrollmentDataProcessing';

interface SchoolEnrollmentChartProps {
  measurements: Measurement[];
}

type EnrollmentMeasurementType = typeof ENROLLMENT_MEASUREMENT_TYPES[keyof typeof ENROLLMENT_MEASUREMENT_TYPES];

const { TOTAL_ENROLLMENT } = ENROLLMENT_MEASUREMENT_TYPES;

const PHONE_NAMES: Record<EnrollmentMeasurementType, string> = {
  [ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT]: 'Total Enrollment',
  [ENROLLMENT_MEASUREMENT_TYPES.ECONOMICALLY_DISADVANTAGED]: 'Low Income',
  [ENROLLMENT_MEASUREMENT_TYPES.ENGLISH_LANGUAGE_LEARNER]: 'ELL',
  [ENROLLMENT_MEASUREMENT_TYPES.STUDENTS_WITH_DISABILITY]: 'Student w/Disability'
};

/** Students in the district's schools each year, in all or in one group, with all beside a group */
const SchoolEnrollmentChart: React.FC<SchoolEnrollmentChartProps> = ({ measurements }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [picked, setPicked] = useState<EnrollmentMeasurementType>(TOTAL_ENROLLMENT);

  // Students in each group by year; a group the state reports as "<10%" or ">90%" has no count that year
  const byType = useMemo(() => {
    const processed = processEnrollmentMeasurements(measurements);
    return new Map(ENROLLMENT_MEASUREMENT_TYPE_ORDER.map(type => [type, processed
      .filter(measurement => Number(measurement.measurement_type.id) === type)
      .map((measurement): YearValue => ({ year: Number(measurement.year), value: measurement.actualValue }))]));
  }, [measurements]);

  // The groups with any students to show
  const types = ENROLLMENT_MEASUREMENT_TYPE_ORDER.filter(type => byType.get(type)!.some(point => point.value > 0));
  const type = types.includes(picked) ? picked : types[0] ?? TOTAL_ENROLLMENT;
  const name = (option: EnrollmentMeasurementType) => (isMobile ? PHONE_NAMES : ENROLLMENT_MEASUREMENT_TYPE_NAMES)[option];

  return (
    <TrendChart
      // The picker names the group, as on the State Enrollment page
      title="District School Enrollment"
      subtitle="# of Students"
      control={<ChartSelect value={type} options={types.map(option => ({ value: option, label: name(option) }))} onChange={setPicked} label="Students to show" />}
      data={mergeSeries({ students: byType.get(type)! })}
      series={[{ key: 'students', name: ENROLLMENT_MEASUREMENT_TYPE_NAMES[type] }]}
      compare={type === TOTAL_ENROLLMENT ? undefined : { data: mergeSeries({ students: byType.get(TOTAL_ENROLLMENT)! }), label: 'Total Enrollment' }}
      format={formatCount}
      axisFormat={value => formatCompact(value)}
      axis="fit"
      bands={REMOTE_BAND}
    />
  );
};

export default SchoolEnrollmentChart;

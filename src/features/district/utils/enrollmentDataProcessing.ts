export const ENROLLMENT_MEASUREMENT_TYPES = {
  ECONOMICALLY_DISADVANTAGED: 34,
  ENGLISH_LANGUAGE_LEARNER: 35,
  STUDENTS_WITH_DISABILITY: 36,
  TOTAL_ENROLLMENT: 37
} as const;

export const ENROLLMENT_MEASUREMENT_TYPE_NAMES = {
  [ENROLLMENT_MEASUREMENT_TYPES.ECONOMICALLY_DISADVANTAGED]: 'Economically Disadvantaged',
  [ENROLLMENT_MEASUREMENT_TYPES.ENGLISH_LANGUAGE_LEARNER]: 'English Language Learner',
  [ENROLLMENT_MEASUREMENT_TYPES.STUDENTS_WITH_DISABILITY]: 'Students with Disability',
  [ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT]: 'Total Enrollment'
} as const;

export const ENROLLMENT_MEASUREMENT_TYPE_ORDER = [
  ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT,
  ENROLLMENT_MEASUREMENT_TYPES.ECONOMICALLY_DISADVANTAGED,
  ENROLLMENT_MEASUREMENT_TYPES.ENGLISH_LANGUAGE_LEARNER,
  ENROLLMENT_MEASUREMENT_TYPES.STUDENTS_WITH_DISABILITY
] as const;

import { Measurement } from '@/store/slices/measurementSlice';

interface ProcessedEnrollmentMeasurement extends Measurement {
  actualValue: number;
}

type EnrollmentMeasurementType = typeof ENROLLMENT_MEASUREMENT_TYPES[keyof typeof ENROLLMENT_MEASUREMENT_TYPES];
type PercentageMeasurementType = typeof ENROLLMENT_MEASUREMENT_TYPES.ECONOMICALLY_DISADVANTAGED | 
                               typeof ENROLLMENT_MEASUREMENT_TYPES.ENGLISH_LANGUAGE_LEARNER | 
                               typeof ENROLLMENT_MEASUREMENT_TYPES.STUDENTS_WITH_DISABILITY;

export const processEnrollmentMeasurements = (measurements: Measurement[]): ProcessedEnrollmentMeasurement[] => {
  // Filter to only enrollment measurements
  const enrollmentMeasurements = measurements.filter(m => 
    ENROLLMENT_MEASUREMENT_TYPE_ORDER.includes(Number(m.measurement_type.id) as EnrollmentMeasurementType)
  );

  // Process each measurement
  return enrollmentMeasurements.map(measurement => {
    // Find total enrollment for the same year as this measurement
    const totalEnrollment = enrollmentMeasurements.find(
      m => Number(m.measurement_type.id) === ENROLLMENT_MEASUREMENT_TYPES.TOTAL_ENROLLMENT && 
          m.year === measurement.year
    )?.value || 0;

    const isPercentage = [
      ENROLLMENT_MEASUREMENT_TYPES.ECONOMICALLY_DISADVANTAGED,
      ENROLLMENT_MEASUREMENT_TYPES.ENGLISH_LANGUAGE_LEARNER,
      ENROLLMENT_MEASUREMENT_TYPES.STUDENTS_WITH_DISABILITY
    ].includes(Number(measurement.measurement_type.id) as PercentageMeasurementType);

    // Skip if percentage is 10% or 90%
    if (isPercentage && (measurement.value === 10 || measurement.value === 90)) {
      return null;
    }

    // Calculate actual value
    const actualValue = isPercentage
      ? Math.round((measurement.value / 100) * totalEnrollment)
      : measurement.value;

    return {
      ...measurement,
      actualValue
    };
  }).filter((measurement): measurement is ProcessedEnrollmentMeasurement => measurement !== null);
}; 
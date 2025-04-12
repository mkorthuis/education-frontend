/**
 * Constants for suspension type strings
 */
export const IN_SCHOOL_SUSPENSION_TYPE = 'Who Received In-School Suspensions';
export const OUT_OF_SCHOOL_SUSPENSION_TYPE = 'Who Received Out-of-School Suspensions';
export const EARLIEST_YEAR = 2016;

/**
 * Calculates the number of incidents per 100 students
 * @param count - The number of incidents
 * @param enrollment - The total enrollment number
 * @param decimalPlaces - Number of decimal places to round to (default: 2)
 * @returns - Incidents per 100 students as a number, or 0 if enrollment is 0 or invalid
 */
export const calculatePer100Students = (
  count: number,
  enrollment: number,
  decimalPlaces: number = 2
): number => {
  // Return 0 if enrollment is 0 or invalid to avoid division by zero
  if (!enrollment || enrollment <= 0) {
    return 0;
  }

  // Calculate incidents per 100 students
  const per100 = (count / enrollment) * 100;
  
  // Round to specified decimal places
  return Number(per100.toFixed(decimalPlaces));
};

/**
 * Calculates the percentage difference between two values
 * @param value - The value to compare
 * @param baseline - The baseline value to compare against
 * @returns - Percentage difference as an integer (positive if higher, negative if lower)
 */
export const calculatePercentageDifference = (
  value: number,
  baseline: number
): number => {
  // Return 0 if baseline is 0 or invalid to avoid division by zero
  if (!baseline || baseline === 0) {
    return 0;
  }

  // Calculate percentage difference
  const percentDifference = ((value - baseline) / baseline) * 100;
  
  // Round to nearest integer
  return Math.round(percentDifference);
};

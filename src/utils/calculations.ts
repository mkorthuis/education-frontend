import { School } from '@/store/slices/locationSlice';

/**
 * Calculates the total enrollment for a school
 */
export const calculateTotalEnrollment = (school: School): number => {
  if (!school.enrollment) return 0;
  
  return Object.values(school.enrollment).reduce(
    (sum: number, count: any) => sum + Number(count), 0
  );
}; 
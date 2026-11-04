import { useEffect, useState } from 'react';
import { enrollmentApi } from '@/services/api/endpoints/enrollments';
import { sortByYear } from '../utils/stateMetrics';

export interface SchoolCountRow {
  year: number;
  /** Public schools with any students in kindergarten to grade 12 (not preschool-only, not charter) */
  schools: number;
  /** Public districts running those schools */
  districts: number;
}

/** Public schools and school districts by year, oldest first; empty until loaded or if the request fails. */
export const useSchoolCounts = (): SchoolCountRow[] => {
  const [counts, setCounts] = useState<SchoolCountRow[]>([]);
  useEffect(() => {
    let active = true;
    Promise.resolve(enrollmentApi.getStateSchoolCounts())
      .then(rows => { if (active && Array.isArray(rows)) setCounts(sortByYear(rows)); })
      .catch(() => { /* The tiles are left out when the counts can't load */ });
    return () => { active = false; };
  }, []);
  return counts;
};

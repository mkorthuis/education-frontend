import { useEffect, useState } from 'react';
import { enrollmentApi } from '@/services/api/endpoints/enrollments';
import { measurementApi } from '@/services/api/endpoints/measurements';
import { sortByYear, YearValue } from '../utils/stateMetrics';

export type StudentGroup = 'lowIncome' | 'specialEducation';

// Students with disabilities have no statewide count in the data; the district figures are
// weighted by enrollment instead (see the backend's /measurement/state)
const DISABILITY_MEASURE = 'Students with Disability (%)';

type CountRow = { year: number; enrollment: number | null; eligible: number | null };
const percentOf = (rows: CountRow[]): YearValue[] => sortByYear(rows
  .filter(row => row.eligible !== null && row.enrollment)
  .map(row => ({ year: row.year, value: (row.eligible! / row.enrollment!) * 100 })));

const LOADERS: Record<StudentGroup, () => Promise<YearValue[]>> = {
  // Eligible for free or reduced-price lunch, as of October 1
  lowIncome: async () => percentOf(await enrollmentApi.getStateReducedLunch()),
  specialEducation: async () => {
    const types: { id: number; name: string }[] = await measurementApi.getMeasurementTypes();
    const type = types.find(entry => entry.name === DISABILITY_MEASURE);
    if (!type) return [];
    const rows: { year: number; field: number }[] = await measurementApi.getStateMeasurements(type.id);
    return sortByYear(rows.map(row => ({ year: row.year, value: row.field })));
  },
};

/**
 * The share of all public school students in each group by year, as percentages. Each group loads
 * on its own: a group is empty until it loads, and stays empty if it can't.
 */
export const useStatewideGroups = (): Partial<Record<StudentGroup, YearValue[]>> => {
  const [groups, setGroups] = useState<Partial<Record<StudentGroup, YearValue[]>>>({});
  useEffect(() => {
    let active = true;
    (Object.keys(LOADERS) as StudentGroup[]).forEach(group => {
      Promise.resolve()
        .then(LOADERS[group])
        .then(values => { if (active) setGroups(current => ({ ...current, [group]: values })); })
        .catch(() => { /* The chart leaves out a statewide line that can't load */ });
    });
    return () => { active = false; };
  }, []);
  return groups;
};

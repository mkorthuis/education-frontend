import { useEffect, useMemo, useState } from 'react';
import { locationApi } from '@/services/api/endpoints/locations';
import { School, Town } from '@/store/slices/locationSlice';

/**
 * The public charter schools located in the given towns (by the town in their address), from the
 * list of every charter school. None while it loads, or if it can't be loaded: the list is an aside
 * on the district's page, not its content.
 */
export const useCharterSchoolsIn = (towns: Town[]): School[] => {
  const [charters, setCharters] = useState<School[]>([]);

  useEffect(() => {
    let current = true;
    locationApi.getCharterSchools()
      .then((rows: School[]) => { if (current) setCharters(rows); })
      .catch(() => undefined);
    return () => { current = false; };
  }, []);

  return useMemo(() => {
    const townIds = new Set(towns.map(town => town.id));
    return charters.filter(school => school.town_id != null && townIds.has(school.town_id));
  }, [charters, towns]);
};

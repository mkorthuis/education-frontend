import { useEffect, useMemo, useState } from 'react';
import { locationApi } from '@/services/api/endpoints/locations';
import { District, isCharterSchool, School } from '@/store/slices/locationSlice';
import { hostDistricts, isOnlineSchool } from '../utils/hostDistricts';

/**
 * The school districts serving a charter school's town (see hostDistricts), from the list of
 * districts, loaded only for a charter school. None while it loads, or if it can't be loaded: the
 * page then says where the school is without the links.
 */
export const useHostDistricts = (school: School | null): District[] => {
  const needed = isCharterSchool(school) && !isOnlineSchool(school);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    if (!needed) return undefined;
    let current = true;
    locationApi.getDistricts()
      .then((rows: District[]) => { if (current) setDistricts(rows); })
      .catch(() => undefined);
    return () => { current = false; };
  }, [needed]);

  return useMemo(() => (school ? hostDistricts(school, districts) : []), [school, districts]);
};

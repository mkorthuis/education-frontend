import { useEffect, useState } from 'react';
import { financeApi } from '@/services/api/endpoints/finances';
import { AidFormula, DistrictAidYear, DistrictSpedAid, DistrictStateAid, SpedAidYear } from '../utils/stateAid';

const LOADING: DistrictStateAid = { status: 'loading', years: [], formulas: {}, spedYears: [], sped: [] };

/**
 * The district's adequacy aid every year, with each member town's calculation, each year's formula (its
 * rates and the names of its parts), and its special education aid. Unavailable when the adequacy aid can't
 * be loaded: the Financials page's other tabs and its download don't wait on it. Without the special
 * education aid, the tab takes it from the district's financial reports.
 */
export const useDistrictStateAid = (districtId: number | undefined): DistrictStateAid => {
  const [aid, setAid] = useState<DistrictStateAid>(LOADING);

  useEffect(() => {
    if (!districtId) return;
    let current = true;
    setAid(LOADING);
    (async () => {
      // Each year's formula as soon as the years are in, beside the special education aid
      const yearsLoaded = financeApi.getDistrictAdequacyAid(districtId) as Promise<DistrictAidYear[]>;
      const [years, formulas, spedYears, sped] = await Promise.all([
        yearsLoaded,
        yearsLoaded.then(list => Promise.all(list.map(year => financeApi.getAdequacyAidFormula(year.fiscal_year) as Promise<AidFormula>))),
        (financeApi.getSpecialEducationAidYears() as Promise<SpedAidYear[]>).catch(() => [] as SpedAidYear[]),
        (financeApi.getDistrictSpecialEducationAid(districtId) as Promise<DistrictSpedAid[]>).catch(() => [] as DistrictSpedAid[]),
      ]);
      const byYear = Object.fromEntries(years.map((year, index) => [year.fiscal_year, formulas[index]]));
      if (current) {
        setAid({
          status: 'ready',
          years: [...years].sort((a, b) => a.fiscal_year - b.fiscal_year),
          formulas: byYear,
          // A district's aid only in the years the DOE's list has, so the two agree
          spedYears: [...spedYears].sort((a, b) => a.fiscal_year - b.fiscal_year),
          sped: sped.filter(row => spedYears.some(year => year.fiscal_year === row.fiscal_year)),
        });
      }
    })().catch(() => {
      if (current) setAid({ ...LOADING, status: 'unavailable' });
    });
    return () => { current = false; };
  }, [districtId]);

  return aid;
};

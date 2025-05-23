import React from 'react';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { useParams } from 'react-router-dom';
import { FISCAL_YEAR } from '@/utils/environment';
import SharedOutcomeSummaryCard from '@/components/ui/outcomes/OutcomeSummaryCard';

const OutcomeSummaryCard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const districtParams = { district_id: districtId };
  const stateParams = {};

  const district = useAppSelector(selectCurrentDistrict);
  const districtName = district?.name || 'District';

  const districtData = useAppSelector(state => 
    outcomeSlice.selectDistrictGraduationCohortData(state, districtParams));
  const stateData = useAppSelector(state => 
    outcomeSlice.selectStateGraduationCohortData(state, stateParams));
  const districtPostGradData = useAppSelector(state => 
    outcomeSlice.selectDistrictPostGraduationData(state, districtParams));
  const statePostGradData = useAppSelector(state => 
    outcomeSlice.selectStatePostGraduationData(state, stateParams));
  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);

  const fiscalYear = parseInt(FISCAL_YEAR);
  
  const districtStats = districtData.find(d => d.year === fiscalYear) || 
    { graduate: 0, earned_hiset: 0, dropped_out: 0, cohort_size: 0 };
  const stateStats = stateData.find(d => d.year === fiscalYear) || 
    { graduate: 0, earned_hiset: 0, dropped_out: 0, cohort_size: 0 };

  return (
    <SharedOutcomeSummaryCard
      entityLabel="District"
      entityStats={districtStats}
      stateStats={stateStats}
      entityPostGradData={districtPostGradData}
      statePostGradData={statePostGradData}
      postGraduationTypes={postGraduationTypes}
      fiscalYear={fiscalYear}
    />
  );
};

export default OutcomeSummaryCard; 
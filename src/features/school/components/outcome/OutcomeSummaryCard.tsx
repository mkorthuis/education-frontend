import React from 'react';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { useParams } from 'react-router-dom';
import { FISCAL_YEAR } from '@/utils/environment';
import SharedOutcomeSummaryCard from '@/components/ui/outcomes/OutcomeSummaryCard';

const OutcomeSummaryCard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const schoolId = id ? parseInt(id) : 0;
  const schoolParams = { school_id: schoolId };
  const stateParams = {};

  const school = useAppSelector(selectCurrentSchool);
  const schoolName = school?.name || 'School';

  const schoolData = useAppSelector(state => 
    outcomeSlice.selectSchoolGraduationCohortData(state, schoolParams));
  const stateData = useAppSelector(state => 
    outcomeSlice.selectStateGraduationCohortData(state, stateParams));
  const schoolPostGradData = useAppSelector(state => 
    outcomeSlice.selectSchoolPostGraduationData(state, schoolParams));
  const statePostGradData = useAppSelector(state => 
    outcomeSlice.selectStatePostGraduationData(state, stateParams));
  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);

  const fiscalYear = parseInt(FISCAL_YEAR);
  
  const schoolStats = schoolData.find(d => d.year === fiscalYear) || 
    { graduate: 0, earned_hiset: 0, dropped_out: 0, cohort_size: 0 };
  const stateStats = stateData.find(d => d.year === fiscalYear) || 
    { graduate: 0, earned_hiset: 0, dropped_out: 0, cohort_size: 0 };

  return (
    <SharedOutcomeSummaryCard
      entityLabel="School"
      entityStats={schoolStats}
      stateStats={stateStats}
      entityPostGradData={schoolPostGradData}
      statePostGradData={statePostGradData}
      postGraduationTypes={postGraduationTypes}
      fiscalYear={fiscalYear}
    />
  );
};

export default OutcomeSummaryCard; 
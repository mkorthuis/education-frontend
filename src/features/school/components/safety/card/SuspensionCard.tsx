import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  selectSchoolDisciplineCountData, 
  selectStateDisciplineCountData,
  selectSelectedSafetyPage,
  setSelectedSafetyPage,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData,
  selectDisciplineCountTypes
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { 
  calculatePer100Students,
  calculatePercentageDifference,
  IN_SCHOOL_SUSPENSION_TYPE,
  OUT_OF_SCHOOL_SUSPENSION_TYPE
} from '@/utils/safetyCalculations';
import { FISCAL_YEAR } from '@/utils/environment';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

const SuspensionCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
  const isSelected = selectedSafetyPage === 'suspension';
  
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  const stateParams = {};
  
  const schoolDisciplineData = useAppSelector(state => selectSchoolDisciplineCountData(state, schoolParams));
  const stateDisciplineData = useAppSelector(state => selectStateDisciplineCountData(state, stateParams));
  const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));
  const disciplineCountTypes = useAppSelector(selectDisciplineCountTypes);

  const filteredCurrentYearData = schoolDisciplineData.filter(item => item.year === parseInt(FISCAL_YEAR));

  // Find in-school and out-of-school suspension count types
  const inSchoolSuspensionType = disciplineCountTypes.find(type => 
    type.name.includes(IN_SCHOOL_SUSPENSION_TYPE));
  const outOfSchoolSuspensionType = disciplineCountTypes.find(type => 
    type.name.includes(OUT_OF_SCHOOL_SUSPENSION_TYPE));

  // Get the counts for each suspension type
  const inSchoolSuspensionsCount = filteredCurrentYearData.find(item => 
    item.count_type.id === inSchoolSuspensionType?.id)?.count || 0;
  const outOfSchoolSuspensionsCount = filteredCurrentYearData.find(item => 
    item.count_type.id === outOfSchoolSuspensionType?.id)?.count || 0;

  // Calculate total suspensions
  const totalSuspensions = inSchoolSuspensionsCount + outOfSchoolSuspensionsCount;

  // Get state suspension data for comparison
  const stateFilteredCurrentYearData = stateDisciplineData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const stateInSchoolSuspensionsCount = stateFilteredCurrentYearData.find(item => 
    item.count_type.id === inSchoolSuspensionType?.id)?.count || 0;
  const stateOutOfSchoolSuspensionsCount = stateFilteredCurrentYearData.find(item => 
    item.count_type.id === outOfSchoolSuspensionType?.id)?.count || 0;
  const stateTotalSuspensions = stateInSchoolSuspensionsCount + stateOutOfSchoolSuspensionsCount;

  // Calculate school and state enrollment for the comparison
  const schoolEnrollment = schoolEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
  const stateEnrollment = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

  // Calculate per 100 students for comparison
  const schoolSuspensionsPer100 = calculatePer100Students(totalSuspensions, schoolEnrollment);
  const stateSuspensionsPer100 = calculatePer100Students(stateTotalSuspensions, stateEnrollment);

  // Calculate percentage difference from state average
  const percentageDiff = calculatePercentageDifference(schoolSuspensionsPer100, stateSuspensionsPer100);

  const handleClick = () => {
    dispatch(setSelectedSafetyPage('suspension'));
  };

  return (
    <DefaultSafetyCard
      onClick={handleClick}
      isSelected={isSelected}
      title="Suspensions and Expulsions"
      shortTitle="Suspend"
    >
      <Box sx={{ my: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {totalSuspensions === 0 ? "No" : totalSuspensions} Suspension{totalSuspensions === 1 ? "" : "s"} in {formatFiscalYear(FISCAL_YEAR)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          ({outOfSchoolSuspensionsCount} Out-of-School Suspension{outOfSchoolSuspensionsCount === 1 ? "" : "s"})
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box>
        <Typography variant="body2">
          {percentageDiff === 0 ? "Same as" : percentageDiff > 0 ? `${percentageDiff}% Higher Than` : `${-percentageDiff}% Lower Than`} State Average
        </Typography>
      </Box>
    </DefaultSafetyCard>
  );
};

export default SuspensionCard; 
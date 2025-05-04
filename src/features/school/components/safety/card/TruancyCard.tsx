import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  selectSchoolTruancyData, 
  selectStateTruancyData, 
  selectSchoolEnrollmentData, 
  selectStateEnrollmentData,
  selectSelectedSafetyPage,
  setSelectedSafetyPage
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { calculatePer100Students, calculatePercentageDifference } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { useNavigate, useParams } from 'react-router-dom';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const TruancyCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
  const isSelected = selectedSafetyPage === 'truancy';

  const school = useAppSelector(selectCurrentSchool);
  const schoolId = school?.id || 0;
  const schoolParams = { school_id: schoolId };
  const stateParams = {};
  
  const schoolTruancyData = useAppSelector(state => selectSchoolTruancyData(state, schoolParams));
  const stateTruancyData = useAppSelector(state => selectStateTruancyData(state, stateParams));
  const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  // Filter data for the current fiscal year
  const filtered2024Data = schoolTruancyData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const schoolTruantStudents = filtered2024Data.reduce((sum, item) => sum + (item.count || 0), 0);

  const stateFiltered2024Data = stateTruancyData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const stateTruantStudents = stateFiltered2024Data.reduce((sum, item) => sum + (item.count || 0), 0);

  // Get enrollment for the current fiscal year
  const schoolEnrollment2024 = schoolEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
  const stateEnrollment2024 = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;

  // Calculate per 100 students for comparison
  const schoolTruantStudentsPer100 = calculatePer100Students(schoolTruantStudents, schoolEnrollment2024);
  const stateTruantStudentsPer100 = calculatePer100Students(stateTruantStudents, stateEnrollment2024);
  const percentDifference = calculatePercentageDifference(schoolTruantStudentsPer100, stateTruantStudentsPer100);

  // Calculate percentage of students who are truant
  const percentageTruantStudents = Math.round((schoolTruantStudents / schoolEnrollment2024) * 100);

  const handleClick = () => {
    const path = PAGE_REGISTRY.school.safety.urlPatterns[0].replace(':id', id || '').replace(':category?', 'truancy');
    navigate(path);
    dispatch(setSelectedSafetyPage('truancy'));
  };

  return (
    <DefaultSafetyCard
      onClick={handleClick}
      isSelected={isSelected}
      title="Truancies"
      shortTitle="Truancy"
    >
      <Box sx={{ my: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {schoolTruantStudents} Truant Student{schoolTruantStudents === 1 ? "" : "s"} in {formatFiscalYear(FISCAL_YEAR)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          ({percentageTruantStudents}% of Students)
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box>
        <Typography variant="body2">
          {percentDifference === 0 ? "Same as" : percentDifference > 0 ? `${percentDifference}% Higher Than` : `${-percentDifference}% Lower Than`} State Average
        </Typography>
      </Box>
    </DefaultSafetyCard>
  );
};

export default TruancyCard; 
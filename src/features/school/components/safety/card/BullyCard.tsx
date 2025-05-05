import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import DefaultSafetyCard from './DefaultSafetyCard';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  selectSchoolBullyingData, 
  selectStateBullyingData, 
  selectSelectedSafetyPage, 
  setSelectedSafetyPage,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { calculatePer100Students, calculatePercentageDifference } from '@/utils/safetyCalculations';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { useNavigate, useParams } from 'react-router-dom';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

const BullyCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);
  const isSelected = selectedSafetyPage === 'bullying';
  
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  const stateParams = {};
  
  const schoolBullyingData = useAppSelector(state => selectSchoolBullyingData(state, schoolParams));
  const stateBullyingData = useAppSelector(state => selectStateBullyingData(state, stateParams));
  const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  // Filter data for current fiscal year and calculate sums
  const filteredCurrentYearData = schoolBullyingData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const actualSum = filteredCurrentYearData.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
  const reportedSum = filteredCurrentYearData.reduce((sum, item) => sum + (item.reported || 0), 0);

  // Filter state bullying data for current year
  const stateFilteredCurrentYearData = stateBullyingData.filter(item => item.year === parseInt(FISCAL_YEAR));
  const stateActualSum = stateFilteredCurrentYearData.reduce((sum, item) => sum + (item.investigated_actual || 0), 0);
  
  // Find current year enrollment data
  const schoolEnrollmentCurrentYear = schoolEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
  const stateEnrollmentCurrentYear = stateEnrollmentData.find(item => item.year === parseInt(FISCAL_YEAR))?.total_enrollment || 0;
  
  // Use utility functions for calculations
  const schoolIncidentsPer100 = calculatePer100Students(actualSum, schoolEnrollmentCurrentYear);
  const stateIncidentsPer100 = calculatePer100Students(stateActualSum, stateEnrollmentCurrentYear);
  const percentDifference = calculatePercentageDifference(schoolIncidentsPer100, stateIncidentsPer100);

  const handleClick = () => {
    const path = PAGE_REGISTRY.school.safety.urlPatterns[0].replace(':id', id || '').replace(':category?', 'bullying');
    navigate(path);
    dispatch(setSelectedSafetyPage('bullying'));
  };

  return (
    <DefaultSafetyCard
      onClick={handleClick}
      isSelected={isSelected}
      title="Bullying"
      shortTitle="Bully"
    >
      <Box sx={{ my: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {actualSum === 0 ? "No" : actualSum} Bullying Incident{actualSum === 1 ? "" : "s"} In {formatFiscalYear(FISCAL_YEAR)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          ({reportedSum === 0 ? "None" : reportedSum} Reported)
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

export default BullyCard; 
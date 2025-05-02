import React from 'react';
import { Box, Typography, Card, CardContent, Divider, useTheme } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { useParams } from 'react-router-dom';
import { FISCAL_YEAR } from '@/utils/environment';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { POST_GRADUATION_TYPES, POST_GRADUATION_TYPE_ORDER } from '@/features/district/utils/outcomeDataProcessing';

const OutcomeSummaryCard: React.FC = () => {
  const theme = useTheme();
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

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Number(((value / total) * 100));
  };

  const graduationPercentage = calculatePercentage(districtStats.graduate, districtStats.cohort_size);
  const stateGraduationPercentage = calculatePercentage(stateStats.graduate, stateStats.cohort_size);
  const graduationDifference = Math.abs(Number((graduationPercentage - stateGraduationPercentage).toFixed(2)));
  
  const dropoutPercentage = calculatePercentage(districtStats.dropped_out, districtStats.cohort_size);
  const stateDropoutPercentage = calculatePercentage(stateStats.dropped_out, stateStats.cohort_size);
  
  const earnedHisetPercentage = calculatePercentage(districtStats.earned_hiset, districtStats.cohort_size);

  // Calculate post-graduation percentages
  const getPostGradPercentage = (typeId: number, data: any[], total: number) => {
    const value = data.find(item => 
      item.year === fiscalYear && 
      item.post_graduation_type.id === typeId
    )?.value || 0;
    return calculatePercentage(value, total);
  };

  const getCombinedPostSecondaryPercentage = (data: any[], total: number) => {
    const fourYearType = postGraduationTypes.find(t => t.name === POST_GRADUATION_TYPES.FOUR_YEAR_COLLEGE)?.id;
    const lessThanFourYearType = postGraduationTypes.find(t => 
      t.name === POST_GRADUATION_TYPES.LESS_THAN_FOUR_YEAR_COLLEGE
    )?.id;

    const fourYearValue = fourYearType ? 
      data.find(item => item.year === fiscalYear && item.post_graduation_type.id === fourYearType)?.value || 0 : 0;
    const lessThanFourYearValue = lessThanFourYearType ? 
      data.find(item => item.year === fiscalYear && item.post_graduation_type.id === lessThanFourYearType)?.value || 0 : 0;

    return calculatePercentage(fourYearValue + lessThanFourYearValue, total);
  };

  const fullTimeJobType = postGraduationTypes.find(t => t.name === POST_GRADUATION_TYPES.EMPLOYED)?.id;
  const armedForcesType = postGraduationTypes.find(t => t.name === POST_GRADUATION_TYPES.ARMED_FORCES)?.id;

  const postSecondaryPercentage = getCombinedPostSecondaryPercentage(districtPostGradData, districtStats.cohort_size);
  const statePostSecondaryPercentage = getCombinedPostSecondaryPercentage(statePostGradData, stateStats.cohort_size);
  const postSecondaryDifference = Math.abs(Number((postSecondaryPercentage - statePostSecondaryPercentage).toFixed(2)));

  const fullTimeJobPercentage = fullTimeJobType ? 
    getPostGradPercentage(fullTimeJobType, districtPostGradData, districtStats.cohort_size) : 0;

  const armedForcesPercentage = armedForcesType ? 
    getPostGradPercentage(armedForcesType, districtPostGradData, districtStats.cohort_size) : 0;

  return (
    <>
      <Box sx={{ 
        display: { xs: 'none', md: 'flex' },
        flexDirection: { md: 'row' },
        alignItems: { md: 'center' },
        justifyContent: 'space-between',
        mb: 2
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              textAlign: "left",
              width: "100%",
              fontWeight: 'medium'
            }} 
          >
            Key Graduation Statistics
          </Typography>
          <Typography        
            variant="body2" 
            sx={{ 
              textAlign: "left",
              width: "100%",
              fontWeight: 'medium',
              fontStyle: 'italic',
              color: 'text.secondary'
            }}
          >
            (Class of '{FISCAL_YEAR.toString().slice(-2)})
          </Typography>
        </Box>
      </Box>

      <Card sx={{ 
        border: '1px solid', 
        borderColor: 'divider', 
        backgroundColor: 'grey.100'
      }}>
        <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              {graduationPercentage.toFixed(1)}% Graduation Rate. 
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {stateGraduationPercentage.toFixed(1)}% State Average
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              {postSecondaryPercentage.toFixed(1)}% Plan For Post Secondary Education.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {statePostSecondaryPercentage.toFixed(1)}% State Average
            </Typography>
          </Box>

          <Divider sx={{ my: 1, display: { xs: 'none', lg: 'block' } }} />

          <Box sx={{ 
            mb: 2,
            display: { xs: 'none', lg: 'block' }
          }}>
            <Typography variant="body1">
              {armedForcesPercentage.toFixed(1)}% Will Join Armed Forces.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {statePostGradData.find(item => 
                item.year === fiscalYear && 
                item.post_graduation_type.id === armedForcesType
              ) ? ((statePostGradData.find(item => 
                item.year === fiscalYear && 
                item.post_graduation_type.id === armedForcesType
              )?.value || 0) / stateStats.cohort_size * 100).toFixed(1) : '0.0'}% State Average
            </Typography>
          </Box>

          <Divider sx={{ my: 1, display: { xs: 'none', lg: 'block' } }} />

          <Box sx={{ 
            display: { xs: 'none', lg: 'block' }
          }}>
            <Typography variant="body1">
              {dropoutPercentage.toFixed(1)}% Dropout Rate.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {stateDropoutPercentage.toFixed(1)}% State Average
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default OutcomeSummaryCard; 
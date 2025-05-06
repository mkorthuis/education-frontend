import React from 'react';
import { Box, Typography, Card, CardContent, Divider } from '@mui/material';
import { FISCAL_YEAR } from '@/utils/environment';
import { POST_GRADUATION_TYPES } from '@/features/district/utils/outcomeDataProcessing';

export interface GraduationCohortStats {
  graduate: number;
  earned_hiset: number;
  dropped_out: number;
  cohort_size: number;
}

export interface PostGraduationTypeData {
  year: number;
  post_graduation_type: {
    id: number;
    name: string;
  };
  value: number;
}

export interface PostGraduationType {
  id: number;
  name: string;
  description?: string;
}

export interface OutcomeSummaryCardProps {
  entityLabel: string;  // "School" or "District"
  entityStats: GraduationCohortStats;
  stateStats: GraduationCohortStats;
  entityPostGradData: PostGraduationTypeData[];
  statePostGradData: PostGraduationTypeData[];
  postGraduationTypes: PostGraduationType[];
  fiscalYear: number;
}

const OutcomeSummaryCard: React.FC<OutcomeSummaryCardProps> = ({
  entityLabel,
  entityStats,
  stateStats,
  entityPostGradData,
  statePostGradData,
  postGraduationTypes,
  fiscalYear
}) => {
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Number(((value / total) * 100));
  };

  const graduationPercentage = calculatePercentage(entityStats.graduate, entityStats.cohort_size);
  const stateGraduationPercentage = calculatePercentage(stateStats.graduate, stateStats.cohort_size);
  const graduationDifference = Math.abs(Number((graduationPercentage - stateGraduationPercentage).toFixed(2)));
  
  const dropoutPercentage = calculatePercentage(entityStats.dropped_out, entityStats.cohort_size);
  const stateDropoutPercentage = calculatePercentage(stateStats.dropped_out, stateStats.cohort_size);
  
  const earnedHisetPercentage = calculatePercentage(entityStats.earned_hiset, entityStats.cohort_size);

  // Calculate post-graduation percentages
  const getPostGradPercentage = (typeId: number, data: PostGraduationTypeData[], total: number) => {
    const value = data.find(item => 
      item.year === fiscalYear && 
      item.post_graduation_type.id === typeId
    )?.value || 0;
    return calculatePercentage(value, total);
  };

  const getCombinedPostSecondaryPercentage = (data: PostGraduationTypeData[], total: number) => {
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

  const postSecondaryPercentage = getCombinedPostSecondaryPercentage(entityPostGradData, entityStats.cohort_size);
  const statePostSecondaryPercentage = getCombinedPostSecondaryPercentage(statePostGradData, stateStats.cohort_size);
  const postSecondaryDifference = Math.abs(Number((postSecondaryPercentage - statePostSecondaryPercentage).toFixed(2)));

  const fullTimeJobPercentage = fullTimeJobType ? 
    getPostGradPercentage(fullTimeJobType, entityPostGradData, entityStats.cohort_size) : 0;

  const armedForcesPercentage = armedForcesType ? 
    getPostGradPercentage(armedForcesType, entityPostGradData, entityStats.cohort_size) : 0;

  const armedForcesStatePercentage = armedForcesType && stateStats.cohort_size > 0 ?
    ((statePostGradData.find(item => 
      item.year === fiscalYear && 
      item.post_graduation_type.id === armedForcesType
    )?.value || 0) / stateStats.cohort_size * 100) : 0;

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
              {armedForcesStatePercentage.toFixed(1)}% State Average
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
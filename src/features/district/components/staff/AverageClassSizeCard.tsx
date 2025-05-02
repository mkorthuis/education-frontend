import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent, useTheme, Divider, Tooltip } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import * as classSizeSlice from '@/store/slices/classSizeSlice';
import * as enrollmentSlice from '@/store/slices/enrollmentSlice';
import { useParams } from 'react-router-dom';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { calculateAverageClassSize } from '@/features/district/utils/staffDataProcessing';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const AverageClassSizeCard: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const districtParams = { district_id: districtId };
  const stateParams = {};

  // Get class size data
  const districtClassSizeData = useAppSelector(state => 
    classSizeSlice.selectDistrictClassSizeData(state, districtParams));
  const stateClassSizeData = useAppSelector(state => 
    classSizeSlice.selectStateClassSizeData(state, stateParams));

  // Get enrollment data
  const districtEnrollmentData = useAppSelector(state => 
    enrollmentSlice.selectTownEnrollment(state, districtParams));
  const stateEnrollmentData = useAppSelector(state => 
    enrollmentSlice.selectStateTownEnrollment(state, stateParams));

  // Find fiscal year and earliest years in data
  const { fiscalYear, earliestYearData } = useMemo(() => {
    const years = districtClassSizeData.map(item => item.year);
    const fiscalYear = Math.max(...years.filter(year => year % 2 === 0)); // Get latest even year
    
    // Find the earliest year that has all_grades data
    const earliestYearData = districtClassSizeData
      .filter(item => item.all_grades !== null && item.all_grades !== 0)
      .sort((a, b) => a.year - b.year)[0];

    return {
      fiscalYear,
      earliestYearData
    };
  }, [districtClassSizeData]);

  // If no valid earliest year data, don't render anything
  if (!earliestYearData) {
    return null;
  }

  // Get fiscal year and earliest year class sizes
  const fiscalYearData = districtClassSizeData.find(item => item.year === fiscalYear);
  const stateAverageData = stateClassSizeData.find(item => item.year === fiscalYear);

  // Get enrollment data for fiscal year and earliest years
  const fiscalYearEnrollment = districtEnrollmentData.find(item => item.year === fiscalYear);
  const stateFiscalYearEnrollments = stateEnrollmentData.filter(item => item.year === fiscalYear);
  const earliestYearEnrollment = districtEnrollmentData.find(item => item.year === earliestYearData.year);

  // Aggregate state enrollment data across grade IDs
  const stateFiscalYearEnrollment = useMemo(() => {
    if (!stateFiscalYearEnrollments.length) return undefined;
    
    // Map grade_id to grade number (2->K, 3->1, 4->2, etc.)
    const gradeMap: Record<number, number> = {
      2: 0,  // Kindergarten
      3: 1,  // Grade 1
      4: 2,  // Grade 2
      5: 3,  // Grade 3
      6: 4,  // Grade 4
      7: 5,  // Grade 5
      8: 6,  // Grade 6
      9: 7,  // Grade 7
      10: 8  // Grade 8
    };

    // Create enrollment object with grades 1-8
    const enrollment: Record<string, number> = {};
    stateFiscalYearEnrollments.forEach(item => {
      const gradeNum = gradeMap[item.grade_id];
      if (gradeNum !== undefined) {
        enrollment[`grade_${gradeNum + 1}`] = item.total_enrollment;
      }
    });

    return {
      year: fiscalYear,
      ...enrollment
    };
  }, [stateFiscalYearEnrollments, fiscalYear]);

  const fiscalYearClassSize = fiscalYearData ? calculateAverageClassSize(fiscalYearData, fiscalYearEnrollment) : 0;
  const stateAverageClassSize = stateAverageData && stateAverageData.all_grades === null 
    ? calculateAverageClassSize(stateAverageData, stateFiscalYearEnrollment)
    : stateAverageData?.all_grades || 0;
  const earliestYearClassSize = calculateAverageClassSize(earliestYearData, earliestYearEnrollment);

  // Calculate percentage change
  const classSizeChange = fiscalYearClassSize - earliestYearClassSize;
  const changeDirection = classSizeChange >= 0 ? 'Increase' : 'Decrease';
  const changeColor = classSizeChange >= 0 ? 'error.main' : 'success.main'; // Note: For class size, decrease is good
 
  // Calculate yearly percentage change
  const totalPercentageChange = earliestYearClassSize > 0 
    ? ((fiscalYearClassSize - earliestYearClassSize) / earliestYearClassSize) * 100 
    : 0;

  // Format class size
  const formatClassSize = (size: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(size);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  return (
    <>
      <Card sx={{ 
        border: '1px solid', 
        borderColor: 'divider', 
        backgroundColor: 'grey.100'
      }}>
        <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" fontWeight="bold">
                {fiscalYearClassSize > 0 ? (
                  `Avg. Class Size is ${formatClassSize(fiscalYearClassSize)} Students in ${formatFiscalYear(fiscalYear)}`
                ) : (
                  'We Could Not Calculate the Avg. Class Size.'
                )}
              </Typography>
              <Tooltip 
                title="When possible, we use NH DOE Average Class Size. If it is unavailable, we calculate it based on the average class sizes for grades 1-8, weighted by enrollment." 
                arrow 
                placement="right"
              >
                <HelpOutlineIcon fontSize="small" sx={{ width: 16, height: 16, color: 'text.secondary' }} />
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {fiscalYearClassSize > 0 ? (
                `${formatClassSize(stateAverageClassSize)} Students State Average`
              ) : (
                'Only Calculated for Less Than 9th Grade.'
              )}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
            {fiscalYearClassSize > 0 ? (
              <>
                <Typography variant="body2" sx={{ color: changeColor }}>
                  {formatPercentage(totalPercentageChange)} {changeDirection}
                </Typography>
                <Typography variant="body2">
                  in Class Size Since {formatFiscalYear(earliestYearData.year)}
                </Typography>
              </>
            ) : (
              <Typography variant="body2">&nbsp;</Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default AverageClassSizeCard; 
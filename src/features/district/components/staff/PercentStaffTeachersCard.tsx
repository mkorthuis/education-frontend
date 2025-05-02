import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent, useTheme, Divider } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import * as staffSlice from '@/store/slices/staffSlice';
import { useParams } from 'react-router-dom';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

const PercentStaffTeachersCard: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const districtParams = { district_id: districtId };
  const stateParams = {};

  // Get staff data
  const districtStaffData = useAppSelector(state => 
    staffSlice.selectDistrictStaffData(state, districtParams));
  const stateStaffData = useAppSelector(state => 
    staffSlice.selectStateStaffData(state, stateParams));
  const staffTypes = useAppSelector(staffSlice.selectStaffTypes);

  // Find teacher type ID
  const teacherTypeId = useMemo(() => {
    const teacherType = staffTypes.find(type => 
      type.name.toLowerCase().includes('teacher'));
    return teacherType?.id;
  }, [staffTypes]);

  // Calculate percentages
  const calculatePercentages = (data: any[], year: number) => {
    const yearData = data.filter(item => item.year === year);
    const totalStaff = yearData.reduce((sum, item) => sum + item.value, 0);
    const teacherCount = yearData.find(item => 
      item.staff_type.id === teacherTypeId)?.value || 0;
    
    return totalStaff > 0 ? (teacherCount / totalStaff) * 100 : 0;
  };

  // Find latest and earliest years in data
  const { latestYear, earliestYear } = useMemo(() => {
    const years = districtStaffData.map(item => item.year);
    return {
      latestYear: Math.max(...years),
      earliestYear: Math.min(...years)
    };
  }, [districtStaffData]);

  const currentYearPercentage = calculatePercentages(districtStaffData, latestYear);
  const stateAveragePercentage = calculatePercentages(stateStaffData, latestYear);
  const earliestYearPercentage = calculatePercentages(districtStaffData, earliestYear);

  // Calculate percentage change
  const percentageChange = currentYearPercentage - earliestYearPercentage;
  const changeDirection = percentageChange >= 0 ? 'Increase' : 'Decrease';
  const absoluteChange = Math.abs(percentageChange);
  const changeColor = percentageChange >= 0 ? 'success.main' : 'error.main';

  return (
    <>

      <Card sx={{ 
        border: '1px solid', 
        borderColor: 'divider', 
        backgroundColor: 'grey.100'
      }}>
        <CardContent sx={{ py: 2, px: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="body1" fontWeight="bold">
              Teachers Are {currentYearPercentage.toFixed(1)}% of Staff in {formatFiscalYear(latestYear)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {stateAveragePercentage.toFixed(1)}% State Average
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: changeColor }}>
              {absoluteChange.toFixed(1)}% {changeDirection}
            </Typography>
            <Typography variant="body2" sx={{ }}>
              Since {formatFiscalYear(earliestYear)}  
              <Typography component="span" variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                &nbsp;({earliestYearPercentage.toFixed(1)}%)
              </Typography>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default PercentStaffTeachersCard; 
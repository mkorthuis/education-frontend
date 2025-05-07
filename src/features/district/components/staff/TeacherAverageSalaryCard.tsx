import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent, useTheme, Divider } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import * as staffSlice from '@/store/slices/staffSlice';
import { useParams } from 'react-router-dom';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';

const TeacherAverageSalaryCard: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const districtParams = { district_id: districtId };
  const stateParams = {};

  // Get salary data
  const districtSalaryData = useAppSelector(state => 
    staffSlice.selectDistrictTeacherAverageSalaryData(state, districtParams));
  const stateSalaryData = useAppSelector(state => 
    staffSlice.selectStateTeacherAverageSalaryData(state, stateParams));

  // Find latest and earliest years in data
  const { latestYear, earliestYear } = useMemo(() => {
    const years = districtSalaryData.map(item => item.year);
    return {
      latestYear: Math.max(...years),
      earliestYear: Math.min(...years)
    };
  }, [districtSalaryData]);

  // Get current and earliest year salaries
  const currentYearSalary = districtSalaryData.find(item => item.year === latestYear)?.salary || 0;
  const stateAverageSalary = stateSalaryData.find(item => item.year === latestYear)?.salary || 0;
  const earliestYearSalary = districtSalaryData.find(item => item.year === earliestYear)?.salary || 0;

  // Calculate percentage change
  const salaryChange = currentYearSalary - earliestYearSalary;
  const changeDirection = salaryChange >= 0 ? 'Increase' : 'Decrease';
  const absoluteChange = Math.abs(salaryChange);
  const changeColor = salaryChange >= 0 ? 'success.main' : 'error.main';

  // Calculate yearly percentage increase
  const yearsElapsed = latestYear - earliestYear;
  const totalPercentageChange = Math.abs(((currentYearSalary - earliestYearSalary) / earliestYearSalary) * 100);
  const yearlyPercentageIncrease = yearsElapsed > 0 ? totalPercentageChange / yearsElapsed : 0;

  // Format salary as currency
  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(salary);
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
            <Typography variant="body1" fontWeight="bold">
              Average Teacher Salary {formatSalary(currentYearSalary)} in {formatFiscalYear(latestYear)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {formatSalary(stateAverageSalary)} State Average
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                <Typography variant="body2" sx={{ color: changeColor }}>{formatPercentage(yearlyPercentageIncrease)} Increase</Typography>
                <Typography variant="body2">in Annual Pay</Typography>
                <Typography variant="body2"> Since {formatFiscalYear(earliestYear)}
                </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default TeacherAverageSalaryCard; 
import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent, Divider, Tooltip } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import * as classSizeSlice from '@/store/slices/classSizeSlice';
import { useParams } from 'react-router-dom';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const AverageClassSizeCard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const districtParams = { district_id: districtId };

  // Get class size data
  const districtClassSizeData = useAppSelector(state =>
    classSizeSlice.selectDistrictClassSizeData(state, districtParams));

  // The earliest and latest years with NH DOE's average class size for all grades
  const { earliestYearData, latestYearData } = useMemo(() => {
    const years = districtClassSizeData
      .filter(item => item.all_grades !== null && item.all_grades !== 0)
      .sort((a, b) => a.year - b.year);
    return { earliestYearData: years[0], latestYearData: years[years.length - 1] };
  }, [districtClassSizeData]);

  // If NH DOE has no average class size for the district, don't render anything
  if (!earliestYearData || !latestYearData) {
    return null;
  }

  const latestClassSize = latestYearData.all_grades!;
  const earliestClassSize = earliestYearData.all_grades!;

  // Calculate percentage change
  const classSizeChange = latestClassSize - earliestClassSize;
  const changeDirection = classSizeChange >= 0 ? 'Increase' : 'Decrease';
  const changeColor = classSizeChange >= 0 ? 'error.main' : 'success.main'; // Note: For class size, decrease is good
  const totalPercentageChange = Math.abs((classSizeChange / earliestClassSize) * 100);

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
                {`Avg. Class Size is ${formatClassSize(latestClassSize)} Students in ${formatFiscalYear(latestYearData.year)}`}
              </Typography>
              <Tooltip
                title="NH DOE's Average Class Size, for the latest year it has published."
                arrow
                placement="right"
              >
                <HelpOutlineIcon fontSize="small" sx={{ width: 16, height: 16, color: 'text.secondary' }} />
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Latest Year Published by NH DOE
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: changeColor }}>
              {formatPercentage(totalPercentageChange)} {changeDirection}
            </Typography>
            <Typography variant="body2">
              in Class Size Since {formatFiscalYear(earliestYearData.year)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default AverageClassSizeCard;

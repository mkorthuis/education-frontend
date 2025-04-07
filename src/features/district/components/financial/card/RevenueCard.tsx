import React from 'react';
import { Typography, Card, CardContent } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectTotalRevenuesByYear } from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { formatFiscalYear } from '../../../utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';

interface RevenueCardProps {
  className?: string;
}

const RevenueCard: React.FC<RevenueCardProps> = ({ className }) => {
  // Get the total revenues for the current fiscal year
  const totalCurrentRevenues = useAppSelector(state => selectTotalRevenuesByYear(state, FISCAL_YEAR));
  const totalPreviousRevenues = useAppSelector(state => selectTotalRevenuesByYear(state, (parseInt(FISCAL_YEAR) - 1).toString()));
  
  return (
    <Card sx={{ flex: 1 }} className={className}>
      <CardContent>
        <Typography variant="h6">
          {formatFiscalYear(FISCAL_YEAR)} Revenue: {formatCompactNumber(totalCurrentRevenues || 0)}
        </Typography>
        <Typography variant="h6">
          {formatFiscalYear(parseInt(FISCAL_YEAR) - 1)} Revenue: {formatCompactNumber(totalPreviousRevenues || 0)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RevenueCard;
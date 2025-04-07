import React from 'react';
import { Typography, Card, CardContent } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectTotalExpendituresByYear } from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { formatFiscalYear } from '../../../utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';

interface ExpendituresCardProps {
  className?: string;
}

const ExpendituresCard: React.FC<ExpendituresCardProps> = ({ className }) => {
  // Get the total expenditures for the current fiscal year
  const totalCurrentExpenditures = useAppSelector(state => selectTotalExpendituresByYear(state, FISCAL_YEAR));
  const totalPreviousExpenditures = useAppSelector(state => selectTotalExpendituresByYear(state, (parseInt(FISCAL_YEAR) - 1).toString()));
  
  return (
    <Card sx={{ flex: 1 }} className={className}>
      <CardContent>
        <Typography variant="h6">
          {formatFiscalYear(FISCAL_YEAR)} Expenditures: {formatCompactNumber(totalCurrentExpenditures || 0)}
        </Typography>
        <Typography variant="h6">
          {formatFiscalYear(parseInt(FISCAL_YEAR) - 1)} Expenditures: {formatCompactNumber(totalPreviousExpenditures || 0)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ExpendituresCard;
import React from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { SvgIconProps } from '@mui/material';
import { formatCompactNumber } from '@/utils/formatting';

interface FinancialChangeProps {
  /**
   * The current value
   */
  current: number;
  
  /**
   * The previous/comparison value
   */
  previous: number;
  
  /**
   * The size of the arrow icon
   */
  iconSize?: SvgIconProps['fontSize'];
  
  /**
   * Optional custom formatter for the difference value
   */
  formatValue?: (value: number) => string;
}

/**
 * A component that displays financial change with directional arrows and percentage
 */
const FinancialChange: React.FC<FinancialChangeProps> = ({ 
  current, 
  previous, 
  iconSize = 'small',
  formatValue = formatCompactNumber
}) => {
  // Don't show anything if previous value is invalid
  if (previous <= 0) {
    return null;
  }
  
  // Calculate difference and percentage
  const difference = current - previous;
  const percentChange = (difference / previous) * 100;
  const isIncrease = difference > 0;
  
  return (
    <>
      {' '}
      ({isIncrease ? (
        <ArrowUpwardIcon fontSize={iconSize} color="success" />
      ) : (
        <ArrowDownwardIcon fontSize={iconSize} color="error" />
      )}
      {formatValue(Math.abs(difference))} ({Math.abs(percentChange).toFixed(1)}%))
    </>
  );
};

export default FinancialChange; 
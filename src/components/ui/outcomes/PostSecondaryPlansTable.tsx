import React, { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { FISCAL_YEAR } from '@/utils/environment';
import { ChartHeader } from '@/features/state/components/chartText';
import ChartSelect from '@/features/state/components/ChartSelect';

// Common interface for data rows
export interface PostSecondaryPlanRow {
  name: string;
  entityPercentage: number;  // School or district percentage
  comparisonPercentage: number;  // State or previous year percentage
  difference: number;
}

// Props for the component
export interface PostSecondaryPlansTableProps {
  title?: string;
  subtitle?: string;
  entityLabel: string;  // "School" or "District"
  availableYears: number[];
  tableData: PostSecondaryPlanRow[];
  totalEntityPercentage: number;
  totalComparisonPercentage: number;
  totalDifference: number;
  initialComparisonYear?: number;
  tooltipMap?: Map<string, string>;
  onViewModeChange: (mode: 'comparison' | 'state') => void;
  onComparisonYearChange: (year: number) => void;
}

const PostSecondaryPlansTable: React.FC<PostSecondaryPlansTableProps> = ({
  title = 'Post Secondary Plans',
  subtitle = `Percentage of Graduates, Class of ${FISCAL_YEAR}`,
  entityLabel,
  availableYears,
  tableData,
  totalEntityPercentage,
  totalComparisonPercentage,
  totalDifference,
  initialComparisonYear,
  tooltipMap = new Map(),
  onViewModeChange,
  onComparisonYearChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const defaultFiscalYear = parseInt(FISCAL_YEAR);
  
  // What the class is compared with: the state average, or an earlier class
  const [compare, setCompare] = useState<'state' | number>('state');
  const viewMode = compare === 'state' ? 'state' : 'comparison';
  const comparisonYear = compare === 'state' ? (initialComparisonYear || defaultFiscalYear - 1) : compare;
  const compareOptions: { value: 'state' | number; label: string }[] = [
    { value: 'state', label: 'State Average' },
    ...availableYears.map(year => ({ value: year, label: `Class of ${year}` })),
  ];
  const changeCompare = (next: 'state' | number) => {
    setCompare(next);
    if (next === 'state') {
      onViewModeChange('state');
    } else {
      onComparisonYearChange(next);
      onViewModeChange('comparison');
    }
  };

  return (
    <>
      {/* Titled like the charts beside it, with one picker for what the class is compared with */}
      <ChartHeader
        title={title}
        subtitle={subtitle}
        actions={<ChartSelect value={compare} options={compareOptions} onChange={changeCompare} label="Compare with" />}
      />
      <TableContainer component={Paper} sx={{ bgcolor: 'grey.100', border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.200', '& th': { borderBottom: '2px solid', borderColor: 'grey.400', fontWeight: 'bold' } }}>
            <TableRow>
              <TableCell colSpan={2} align="right">
                {isMobile ? `Class of '${FISCAL_YEAR.toString().slice(-2)}` : `Class of ${FISCAL_YEAR}`}
              </TableCell>
              <TableCell align="right">
                {viewMode === 'comparison'
                  ? (isMobile ? `'${comparisonYear.toString().slice(-2)}` : `Class of ${comparisonYear}`)
                  : (isMobile ? 'State Avg' : 'State Average')}
              </TableCell>
              {!isMobile && (
                <TableCell align="right">Difference</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {row.name}
                    {tooltipMap.has(row.name) && (
                      <Tooltip 
                        title={tooltipMap.get(row.name) || ''} 
                        arrow 
                        placement="right"
                      >
                        <HelpOutlineIcon fontSize="small" sx={{ width: 16, height: 16, color: 'text.secondary' }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{
                    color: isMobile ? (
                      row.entityPercentage > row.comparisonPercentage ? 'success.main' : 
                      row.entityPercentage < row.comparisonPercentage ? 'error.main' : 
                      'text.primary'
                    ) : 'inherit'
                  }}
                >
                  {row.entityPercentage.toFixed(2)}%
                </TableCell>
                <TableCell align="right">{row.comparisonPercentage.toFixed(2)}%</TableCell>
                {!isMobile && (
                  <TableCell align="right">
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end',
                      color: row.difference > 0 ? 'success.main' : row.difference < 0 ? 'error.main' : 'text.primary'
                    }}>
                      {row.difference !== 0 && (
                        row.difference > 0 ? 
                          <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} /> : 
                          <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                      )}
                      <Typography variant="body2">
                        {Math.abs(row.difference).toFixed(2)}%
                      </Typography>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'grey.200', '& td': { borderTop: '2px solid', borderColor: 'grey.400' } }}>
              <TableCell>Total</TableCell>
              <TableCell 
                align="right"
                sx={{
                  color: 'text.secondary'
                }}
              >
                {totalEntityPercentage.toFixed(2)}%
              </TableCell>
              <TableCell align="right">{totalComparisonPercentage.toFixed(2)}%</TableCell>
              {!isMobile && (
                <TableCell align="right">
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-end',
                    color: 'text.secondary'
                  }}>
                    <Typography variant="body2">
                      {Math.abs(totalDifference).toFixed(2)}%
                    </Typography>
                  </Box>
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default PostSecondaryPlansTable; 
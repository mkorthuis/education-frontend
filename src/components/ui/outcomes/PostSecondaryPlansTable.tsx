import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  useTheme, 
  useMediaQuery, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  ToggleButtonGroup, 
  ToggleButton, 
  Tooltip 
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { FISCAL_YEAR } from '@/utils/environment';

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
  subtitle = '(Vs. State or Prev. Year)',
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
  
  // State for view mode and comparison year
  const [viewMode, setViewMode] = useState<'comparison' | 'state'>('state');
  const [comparisonYear, setComparisonYear] = useState<string | number>(
    initialComparisonYear || defaultFiscalYear - 1
  );

  // Handlers
  const handleComparisonYearChange = (event: SelectChangeEvent<string | number>) => {
    const year = Number(event.target.value);
    setComparisonYear(year);
    onComparisonYearChange(year);
    setViewMode('comparison');
    onViewModeChange('comparison');
  };

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'comparison' | 'state' | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
      onViewModeChange(newViewMode);
    }
  };

  const handleDropdownOpen = () => {
    setViewMode('comparison');
    onViewModeChange('comparison');
  };

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'center' : 'center', 
        justifyContent: 'space-between',
        mb: 2 
      }}>
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'center' : 'flex-start',
          mb: isMobile ? 2 : 0
        }}>
          <Typography 
            variant={isMobile ? "h6" : "body1"} 
            sx={{ 
              textAlign: isMobile ? "center" : "left",
              width: "100%",
              fontWeight: 'medium',
              fontSize: isMobile ? '1.25rem' : 'inherit'
            }} 
          >
            {title}
          </Typography>
          {!isMobile && (
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
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: isMobile ? '100%' : 'auto',
          flexDirection: 'row',
          justifyContent: isMobile ? 'center' : 'flex-end',
          gap: 2
        }}>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150,
              ml: isMobile ? 0 : 2,
            }}
          >
            <Select
              value={comparisonYear}
              onChange={handleComparisonYearChange}
              onOpen={handleDropdownOpen}
              displayEmpty
              inputProps={{ 'aria-label': 'comparison year selector' }}
              sx={{ 
                bgcolor: viewMode === 'comparison' ? 'rgba(0, 0, 0, 0.08)' : 'white',
                '&.Mui-focused': {
                  bgcolor: viewMode === 'comparison' ? 'rgba(0, 0, 0, 0.08)' : 'white'
                },
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '4px',
                '& .MuiOutlinedInput-notchedOutline': { 
                  border: 'none' 
                },
                '&:hover': {
                  bgcolor: viewMode === 'comparison' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {availableYears.map((year) => (
                <MenuItem 
                  key={year} 
                  value={year}
                  sx={{
                    fontWeight: 500
                  }}
                >
                  Compare '{year.toString().slice(-2)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="table view mode"
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'rgba(0, 0, 0, 0.87)',
                fontWeight: 500
              },
              '& .MuiToggleButton-root.Mui-selected': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
                color: 'rgba(0, 0, 0, 0.87)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.12)'
                }
              }
            }}
          >
            <Tooltip title="Show state average comparison">
              <ToggleButton value="state" aria-label="state average view">
                State Avg
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'grey.100', border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.200', '& th': { borderBottom: '2px solid', borderColor: 'grey.400', fontWeight: 'bold' } }}>
            <TableRow>
              <TableCell colSpan={2} align="right">
                {`Class of '${FISCAL_YEAR.toString().slice(-2)}`}
              </TableCell>
              <TableCell align="right">
                {viewMode === 'comparison' 
                  ? (isMobile ? `'${comparisonYear.toString().slice(-2)}` : `Class '${comparisonYear.toString().slice(-2)}`)
                  : 'State Avg'}
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
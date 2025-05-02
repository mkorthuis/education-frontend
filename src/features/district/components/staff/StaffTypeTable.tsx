import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, useMediaQuery, FormControl, Select, MenuItem, SelectChangeEvent, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import * as staffSlice from '@/store/slices/staffSlice';
import { useParams } from 'react-router-dom';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import { STAFF_TYPE_ORDER, STAFF_TYPES_WITH_TOOLTIP, STAFF_TYPE_MOBILE_NAMES, STAFF_TYPE_TOOLTIPS } from '@/features/district/utils/staffDataProcessing';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const StaffTypeTable: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const districtParams = { district_id: districtId };
  const stateParams = {};
  const defaultFiscalYear = parseInt(FISCAL_YEAR);
  const [comparisonYear, setComparisonYear] = useState<string | number>(defaultFiscalYear - 1);
  const [viewMode, setViewMode] = useState<'comparison' | 'state'>('state');

  // Get staff data
  const districtStaffData = useAppSelector(state => 
    staffSlice.selectDistrictStaffData(state, districtParams));
  const stateStaffData = useAppSelector(state => 
    staffSlice.selectStateStaffData(state, stateParams));
  const staffTypes = useAppSelector(staffSlice.selectStaffTypes);

  // Get available years for comparison, excluding current fiscal year
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    districtStaffData.forEach(item => {
      if (item.year < defaultFiscalYear) {
        years.add(item.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [districtStaffData, defaultFiscalYear]);

  // Set initial comparison year to the most recent available year
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(Number(comparisonYear))) {
      setComparisonYear(availableYears[0]);
    }
  }, [availableYears, comparisonYear]);

  // Handle comparison year change
  const handleComparisonYearChange = (event: SelectChangeEvent<string | number>) => {
    setComparisonYear(event.target.value);
  };

  // Handle dropdown open
  const handleDropdownOpen = () => {
    setViewMode('comparison');
  };

  // Handle view mode change
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'comparison' | 'state' | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Process data for the table
  const tableData = useMemo(() => {
    const currentYear = defaultFiscalYear;
    const compareYear = Number(comparisonYear);

    // Calculate district totals and percentages
    const districtTotals = districtStaffData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = 0;
      }
      acc[item.year] += item.value;
      return acc;
    }, {} as Record<number, number>);

    // Calculate state totals and percentages
    const stateTotals = stateStaffData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = 0;
      }
      acc[item.year] += item.value;
      return acc;
    }, {} as Record<number, number>);

    // Create rows for each staff type
    return [...staffTypes]
      .sort((a, b) => {
        const aIndex = STAFF_TYPE_ORDER.indexOf(a.name as typeof STAFF_TYPE_ORDER[number]);
        const bIndex = STAFF_TYPE_ORDER.indexOf(b.name as typeof STAFF_TYPE_ORDER[number]);
        return aIndex - bIndex;
      })
      .map(type => {
        const currentItem = districtStaffData.find(
          item => item.year === currentYear && 
          item.staff_type.id === type.id
        );
        const comparisonItem = viewMode === 'comparison' 
          ? districtStaffData.find(
              item => item.year === compareYear && 
              item.staff_type.id === type.id
            )
          : stateStaffData.find(
              item => item.year === currentYear && 
              item.staff_type.id === type.id
            );

        const districtCount = currentItem?.value || 0;
        const comparisonCount = comparisonItem?.value || 0;
        const districtPercentage = currentItem && districtTotals[currentYear] > 0
          ? (currentItem.value / districtTotals[currentYear]) * 100
          : 0;
        const comparisonPercentage = comparisonItem && 
          (viewMode === 'comparison' ? districtTotals[compareYear] : stateTotals[currentYear]) > 0
          ? (comparisonItem.value / (viewMode === 'comparison' ? districtTotals[compareYear] : stateTotals[currentYear])) * 100
          : 0;

        // Calculate difference based on view mode
        const difference = viewMode === 'comparison'
          ? comparisonCount > 0 
            ? ((districtCount - comparisonCount) / comparisonCount) * 100
            : 0
          : districtPercentage - comparisonPercentage;

        return {
          name: type.name,
          districtCount,
          comparisonCount,
          districtPercentage,
          comparisonPercentage,
          difference
        };
      });
  }, [districtStaffData, stateStaffData, staffTypes, defaultFiscalYear, comparisonYear, viewMode]);

  // Calculate totals
  const totals = useMemo(() => {
    const districtTotal = tableData.reduce((total, item) => total + item.districtPercentage, 0);
    const comparisonTotal = tableData.reduce((total, item) => total + item.comparisonPercentage, 0);
    const districtCountTotal = tableData.reduce((total, item) => total + item.districtCount, 0);
    const comparisonCountTotal = tableData.reduce((total, item) => total + item.comparisonCount, 0);

    // Calculate total difference based on view mode
    const differenceTotal = viewMode === 'comparison'
      ? comparisonCountTotal > 0
        ? ((districtCountTotal - comparisonCountTotal) / comparisonCountTotal) * 100
        : 0
      : districtTotal - comparisonTotal;

    return {
      districtTotal,
      comparisonTotal,
      differenceTotal,
      districtCountTotal,
      comparisonCountTotal
    };
  }, [tableData, viewMode]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'center' : 'center', 
        justifyContent: 'space-between',
        mb: 2,
        width: '100%'
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
            Staff Composition
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
              (Vs. State or Prev. Year)
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
              <TableCell>Staff Type</TableCell>
              {viewMode === 'comparison' ? (
                <>
                  <TableCell align="right">{formatFiscalYear(defaultFiscalYear)}</TableCell>
                  <TableCell align="right">{formatFiscalYear(Number(comparisonYear))}</TableCell>
                  <TableCell align="right">{isMobile ? 'Change' : '% Change'}</TableCell>
                </>
              ) : (
                <>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">{isMobile ? '%' : '% of Staff'}</TableCell>
                  <TableCell align="right">{isMobile ? 'State' : 'State Avg'}</TableCell>
                  {!isMobile && <TableCell align="right">Difference</TableCell>}
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isMobile ? (
                      STAFF_TYPE_MOBILE_NAMES[row.name as keyof typeof STAFF_TYPE_MOBILE_NAMES] !== row.name ? (
                        <Tooltip title={row.name} arrow placement="right">
                          <span>{STAFF_TYPE_MOBILE_NAMES[row.name as keyof typeof STAFF_TYPE_MOBILE_NAMES]}</span>
                        </Tooltip>
                      ) : (
                        STAFF_TYPE_MOBILE_NAMES[row.name as keyof typeof STAFF_TYPE_MOBILE_NAMES]
                      )
                    ) : row.name}
                    {STAFF_TYPES_WITH_TOOLTIP.includes(row.name as any) && (
                      <Tooltip 
                        title={STAFF_TYPE_TOOLTIPS[row.name as keyof typeof STAFF_TYPE_TOOLTIPS]} 
                        arrow 
                        placement="right"
                      >
                        <HelpOutlineIcon fontSize="small" sx={{ width: 16, height: 16, color: 'text.secondary' }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                {viewMode === 'comparison' ? (
                  <>
                    <TableCell align="right">{row.districtCount.toFixed(1)}</TableCell>
                    <TableCell align="right">{row.comparisonCount.toFixed(1)}</TableCell>
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
                          {Math.abs(row.difference).toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell align="right">{row.districtCount.toFixed(1)}</TableCell>
                    <TableCell 
                      align="right"
                      sx={{
                        color: isMobile ? (
                          row.districtPercentage > row.comparisonPercentage ? 'success.main' : 
                          row.districtPercentage < row.comparisonPercentage ? 'error.main' : 
                          'text.primary'
                        ) : 'inherit'
                      }}
                    >
                      {row.districtPercentage.toFixed(1)}%
                    </TableCell>
                    <TableCell align="right">{row.comparisonPercentage.toFixed(1)}%</TableCell>
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
                            {Math.abs(row.difference).toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                  </>
                )}
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: 'grey.200', '& td': { borderTop: '2px solid', borderColor: 'grey.400' } }}>
              <TableCell>Total</TableCell>
              {viewMode === 'comparison' ? (
                <>
                  <TableCell align="right">{totals.districtCountTotal.toFixed(1)}</TableCell>
                  <TableCell align="right">{totals.comparisonCountTotal.toFixed(1)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end',
                      color: totals.differenceTotal > 0 ? 'success.main' : totals.differenceTotal < 0 ? 'error.main' : 'text.primary'
                    }}>
                      {totals.differenceTotal !== 0 && (
                        totals.differenceTotal > 0 ? 
                          <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} /> : 
                          <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                      )}
                      <Typography variant="body2">
                        {Math.abs(totals.differenceTotal).toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell align="right">{totals.districtCountTotal.toFixed(1)}</TableCell>
                  <TableCell 
                    align="right"
                    sx={{
                      color: 'text.secondary'
                    }}
                  >
                    {totals.districtTotal.toFixed(1)}%
                  </TableCell>
                  <TableCell align="right">{totals.comparisonTotal.toFixed(1)}%</TableCell>
                  {!isMobile && (
                    <TableCell align="right">
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end',
                        color: 'text.secondary'
                      }}>
                        <Typography variant="body2">
                          {Math.abs(totals.differenceTotal).toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  )}
                </>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StaffTypeTable; 
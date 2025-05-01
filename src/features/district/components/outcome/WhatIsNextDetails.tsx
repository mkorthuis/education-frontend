import React, { useMemo, useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Box, Typography, FormControl, Select, MenuItem, SelectChangeEvent, useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { useParams } from 'react-router-dom';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import { POST_GRADUATION_TYPE_ORDER, POST_GRADUATION_TYPES_WITH_TOOLTIP } from '@/features/district/utils/outcomeDataProcessing';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface PostGraduationDataItem {
  year: number;
  post_graduation_type: {
    id: number;
    name: string;
  };
  value: number;
}

const WhatIsNextDetails: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const districtId = id ? parseInt(id) : 0;
  const defaultFiscalYear = parseInt(FISCAL_YEAR);
  const [comparisonYear, setComparisonYear] = useState<string | number>(defaultFiscalYear - 1);
  const [viewMode, setViewMode] = useState<'comparison' | 'state'>('state');

  const postGraduationTypes = useAppSelector(outcomeSlice.selectPostGraduationTypes);
  const districtData = useAppSelector(state => 
    outcomeSlice.selectDistrictPostGraduationData(state, { district_id: districtId }));
  const stateData = useAppSelector(state => 
    outcomeSlice.selectStatePostGraduationData(state, {}));

  // Get available years for comparison, excluding current fiscal year
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    districtData.forEach(item => {
      if (item.year < defaultFiscalYear) {
        years.add(item.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [districtData, defaultFiscalYear]);

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
    const currentYear = defaultFiscalYear.toString();
    const compareYear = comparisonYear.toString();

    // Calculate district totals and percentages for both years
    const districtTotals = districtData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = 0;
      }
      acc[item.year] += item.value;
      return acc;
    }, {} as Record<string, number>);

    // Calculate state totals and percentages
    const stateTotals = stateData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = 0;
      }
      acc[item.year] += item.value;
      return acc;
    }, {} as Record<string, number>);

    // Create rows for each post-graduation type
    return [...postGraduationTypes]
      .sort((a, b) => {
        const aIndex = POST_GRADUATION_TYPE_ORDER.indexOf(a.name as typeof POST_GRADUATION_TYPE_ORDER[number]);
        const bIndex = POST_GRADUATION_TYPE_ORDER.indexOf(b.name as typeof POST_GRADUATION_TYPE_ORDER[number]);
        return aIndex - bIndex;
      })
      .map(type => {
        const currentItem = districtData.find(
          item => item.year.toString() === currentYear && 
          item.post_graduation_type.id === type.id
        );
        const comparisonItem = viewMode === 'comparison' 
          ? districtData.find(
              item => item.year.toString() === compareYear && 
              item.post_graduation_type.id === type.id
            )
          : stateData.find(
              item => item.year.toString() === currentYear && 
              item.post_graduation_type.id === type.id
            );

        const currentPercentage = currentItem && districtTotals[currentYear] > 0
          ? (currentItem.value / districtTotals[currentYear]) * 100
          : 0;
        const comparisonPercentage = comparisonItem && 
          (viewMode === 'comparison' ? districtTotals[compareYear] : stateTotals[currentYear]) > 0
          ? (comparisonItem.value / (viewMode === 'comparison' ? districtTotals[compareYear] : stateTotals[currentYear])) * 100
          : 0;

        return {
          name: type.name,
          districtPercentage: currentPercentage,
          comparisonPercentage,
          difference: currentPercentage - comparisonPercentage
        };
      });
  }, [districtData, stateData, postGraduationTypes, defaultFiscalYear, comparisonYear, viewMode]);

  // Calculate totals
  const totals = useMemo(() => {
    const districtTotal = tableData.reduce((total, item) => total + item.districtPercentage, 0);
    const comparisonTotal = tableData.reduce((total, item) => total + item.comparisonPercentage, 0);
    const differenceTotal = districtTotal - comparisonTotal;

    return {
      districtTotal,
      comparisonTotal,
      differenceTotal
    };
  }, [tableData]);

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
            Post Secondary Plans
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
                    {POST_GRADUATION_TYPES_WITH_TOOLTIP.includes(row.name as any) && (
                      <Tooltip 
                        title={postGraduationTypes.find(type => type.name === row.name)?.description || ''} 
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
                      row.districtPercentage > row.comparisonPercentage ? 'success.main' : 
                      row.districtPercentage < row.comparisonPercentage ? 'error.main' : 
                      'text.primary'
                    ) : 'inherit'
                  }}
                >
                  {row.districtPercentage.toFixed(2)}%
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
                {totals.districtTotal.toFixed(2)}%
              </TableCell>
              <TableCell align="right">{totals.comparisonTotal.toFixed(2)}%</TableCell>
              {!isMobile && (
                <TableCell align="right">
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-end',
                    color: 'text.secondary'
                  }}>
                    <Typography variant="body2">
                      {Math.abs(totals.differenceTotal).toFixed(2)}%
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

export default WhatIsNextDetails; 
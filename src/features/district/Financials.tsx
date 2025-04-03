import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, Paper, CircularProgress, Tooltip, Divider, Tabs, Tab } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData 
} from '@/features/location/store/locationSlice';
import {
  fetchFinancialReport,
  selectExpendituresByEntryType,
  selectExpendituresByFundType,
  selectTotalExpenditures,
  selectRevenuesByEntryType,
  selectRevenuesByFundType,
  selectTotalRevenues,
  selectFinanceLoading,
  selectFinanceError
} from '@/features/finance/store/financeSlice';

// Define types for the financial data
type FundType = {
  id: number;
  state_name: string;
  state_id: string;
};

type EntryType = {
  id: number;
  name: string;
  page: string;
  account_no: string;
  line: string;
  category?: {
    id: number;
    name: string;
    super_category?: {
      id: number;
      name: string;
    }
  }
};

type ExpenditureRaw = {
  id: number;
  value: number;
  entry_type_id: number;
  fund_type_id: number;
};

type Expenditure = {
  id: number;
  value: number;
  entry_type: EntryType;
  fund_type: FundType;
};

type EntryTypesResponse = {
  balance_entry_types: EntryType[];
  revenue_entry_types: EntryType[];
  expenditure_entry_types: EntryType[];
};

type FundTypesResponse = {
  balance_fund_types: FundType[];
  revenue_fund_types: FundType[];
  expenditure_fund_types: FundType[];
};

type FinancialDataRaw = {
  doe_form: {
    id: number;
    year: number;
    date_created: string;
    date_updated: string;
    district_id: number;
  };
  balance_sheets: any[];
  revenues: any[];
  expenditures: ExpenditureRaw[];
};

type FinancialData = {
  doe_form: {
    id: number;
    year: number;
    date_created: string;
    date_updated: string;
    district_id: number;
  };
  balance_sheets: any[];
  revenues: any[];
  expenditures: Expenditure[];
};

// Chart item type used for rendering
type ChartItem = {
  name: string;
  value: number;
  percentage: number;
};

const Financials: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const dispatch = useAppDispatch();
  const [mainTabValue, setMainTabValue] = useState(0);
  const [expenditureTabValue, setExpenditureTabValue] = useState(0);
  const [revenueTabValue, setRevenueTabValue] = useState(0);
  
  // Get financial data from Redux store using selectors
  const entryTypeData = useAppSelector(selectExpendituresByEntryType);
  const fundTypeData = useAppSelector(selectExpendituresByFundType);
  const totalExpenditures = useAppSelector(selectTotalExpenditures);
  
  // Get revenue data from Redux store
  const revenueEntryTypeData = useAppSelector(selectRevenuesByEntryType);
  const revenueFundTypeData = useAppSelector(selectRevenuesByFundType);
  const totalRevenues = useAppSelector(selectTotalRevenues);
  
  const financeLoading = useAppSelector(selectFinanceLoading);
  const financeError = useAppSelector(selectFinanceError);

  useEffect(() => {
    if (id) {
      // If district data isn't loaded yet, fetch it
      if (!district && !districtLoading) {
        dispatch(fetchAllDistrictData(id));
      }
      
      // Fetch financial data for the district
      dispatch(fetchFinancialReport({ districtId: id }));
    }
  }, [dispatch, id, district, districtLoading]);

  // Process entry type data with "Other" rollup
  const processDataWithRollup = (data: ChartItem[]): ChartItem[] => {
    // If 5 or fewer items, return as is
    if (data.length <= 5) return data;
    
    // Take top 5 items
    const top5 = data.slice(0, 5);
    
    // Combine the rest into "Other"
    const otherItems = data.slice(5);
    const otherValue = otherItems.reduce((sum, item) => sum + item.value, 0);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Add "Other" item to the result
    return [
      ...top5,
      {
        name: "Other",
        value: otherValue,
        percentage: (otherValue / total) * 100
      }
    ];
  };

  const entryTypeDataWithRollup = processDataWithRollup(entryTypeData);
  const revenueEntryTypeDataWithRollup = processDataWithRollup(revenueEntryTypeData);
  const isLoading = districtLoading || financeLoading;

  // Generate a unique color for each item
  const getColor = (index: number) => {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b',
      '#27ae60', '#8e44ad', '#f1c40f', '#e67e22', '#95a5a6'
    ];
    return colors[index % colors.length];
  };

  // Create a single bar with segments for fund types
  const renderSegmentedBar = (data: ChartItem[]) => {
    return (
      <Box sx={{ display: 'flex', width: '100%', height: 40, overflow: 'hidden', mb: 2 }}>
        {data.map((item, index) => (
          <Tooltip
            key={item.name}
            title={`${item.name}: $${item.value.toLocaleString()} (${item.percentage.toFixed(1)}%)`}
          >
            <Box
              sx={{
                width: `${item.percentage}%`,
                height: '100%',
                bgcolor: getColor(index),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                '&:hover': {
                  opacity: 0.9,
                  cursor: 'pointer'
                }
              }}
            >
              {item.percentage > 5 ? `${item.percentage.toFixed(0)}%` : ''}
            </Box>
          </Tooltip>
        ))}
      </Box>
    );
  };

  const handleMainTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue);
  };

  const handleExpenditureTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setExpenditureTabValue(newValue);
  };

  const handleRevenueTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setRevenueTabValue(newValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Render chart items list with bars
  const renderChartItems = (items: ChartItem[]) => (
    <Box sx={{ mt: 2, mb: 4 }}>
      {items.map((item, index) => (
        <Box key={item.name} sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" sx={{ width: '35%', pr: 2 }}>
              {item.name}
            </Typography>
            <Typography variant="body2" sx={{ width: '15%', textAlign: 'right', pr: 2 }}>
              {formatCurrency(item.value)}
            </Typography>
            <Typography variant="body2" sx={{ width: '10%', textAlign: 'right', pr: 2 }}>
              {item.percentage.toFixed(1)}%
            </Typography>
          </Box>
          <Tooltip title={`${item.name}: ${formatCurrency(item.value)} (${item.percentage.toFixed(1)}%)`}>
            <Box 
              sx={{ 
                width: `${item.percentage}%`, 
                height: 24, 
                bgcolor: getColor(index),
                borderRadius: 1
              }}
            />
          </Tooltip>
        </Box>
      ))}
    </Box>
  );

  // Render color legend for chart items
  const renderLegend = (items: ChartItem[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
      {items.map((item, index) => (
        <Box key={item.name} sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              bgcolor: getColor(index), 
              mr: 1, 
              borderRadius: '2px' 
            }} 
          />
          <Typography variant="body2">
            {item.name}: {formatCurrency(item.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  return (
      <>
      <Typography variant="h6" gutterBottom>
        {district?.name || 'District'}
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : financeError ? (
          <Typography color="error">{financeError}</Typography>
        ) : entryTypeData.length === 0 && revenueEntryTypeData.length === 0 ? (
          <Typography>No financial data available for this district.</Typography>
        ) : (
          <Box>
            <Tabs value={mainTabValue} onChange={handleMainTabChange} sx={{ mb: 3 }}>
              <Tab label="Expenditures" />
              <Tab label="Revenues" />
            </Tabs>

            {mainTabValue === 0 && (
              // Expenditures Tab
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Total Expenditures: {formatCurrency(totalExpenditures)}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Expenditure By Fund Type
                  </Typography>
                  {renderSegmentedBar(fundTypeData)}
                  {renderLegend(fundTypeData)}
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Expenditure By Program
                  </Typography>
                  {renderSegmentedBar(entryTypeDataWithRollup)}
                  {renderLegend(entryTypeDataWithRollup)}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Tabs value={expenditureTabValue} onChange={handleExpenditureTabChange} sx={{ mb: 2 }}>
                  <Tab label="By Program" />
                  <Tab label="By Expenditure Type" />
                </Tabs>

                {expenditureTabValue === 0 && renderChartItems(entryTypeData)}
                {expenditureTabValue === 1 && renderChartItems(fundTypeData)}
              </Box>
            )}

            {mainTabValue === 1 && (
              // Revenues Tab
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Total Revenues: {formatCurrency(totalRevenues)}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Revenue By Fund Type
                  </Typography>
                  {renderSegmentedBar(revenueFundTypeData)}
                  {renderLegend(revenueFundTypeData)}
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Revenue By Source
                  </Typography>
                  {renderSegmentedBar(revenueEntryTypeDataWithRollup)}
                  {renderLegend(revenueEntryTypeDataWithRollup)}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Tabs value={revenueTabValue} onChange={handleRevenueTabChange} sx={{ mb: 2 }}>
                  <Tab label="By Source" />
                  <Tab label="By Revenue Type" />
                </Tabs>

                {revenueTabValue === 0 && renderChartItems(revenueEntryTypeData)}
                {revenueTabValue === 1 && renderChartItems(revenueFundTypeData)}
              </Box>
            )}
          </Box>
        )}
      </Box>
      </>
  );
};

export default Financials; 
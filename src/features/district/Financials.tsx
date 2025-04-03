import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, Paper, CircularProgress, Tooltip, Divider, Tabs, Tab } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData 
} from '@/features/location/store/locationSlice';
import { financeApi } from '@/services/api/endpoints/finances';

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
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [fundTypes, setFundTypes] = useState<FundType[]>([]);
  const [entryTypesLoading, setEntryTypesLoading] = useState(false);
  const [fundTypesLoading, setFundTypesLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // If district data isn't loaded yet, fetch it
      if (!district && !districtLoading) {
        dispatch(fetchAllDistrictData(id));
      }
    }
  }, [dispatch, id, district, districtLoading]);

  // Fetch entry types and fund types
  useEffect(() => {
    const fetchEntryTypes = async () => {
      setEntryTypesLoading(true);
      try {
        const data: EntryTypesResponse = await financeApi.getEntryTypes();
        // Use expenditure entry types for expenditure analysis
        setEntryTypes(data.expenditure_entry_types);
      } catch (err) {
        console.error('Error fetching entry types:', err);
      } finally {
        setEntryTypesLoading(false);
      }
    };

    const fetchFundTypes = async () => {
      setFundTypesLoading(true);
      try {
        const data: FundTypesResponse = await financeApi.getFundTypes();
        // Use expenditure fund types for expenditure analysis
        setFundTypes(data.expenditure_fund_types);
      } catch (err) {
        console.error('Error fetching fund types:', err);
      } finally {
        setFundTypesLoading(false);
      }
    };

    fetchEntryTypes();
    fetchFundTypes();
  }, []);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (id && entryTypes.length > 0 && fundTypes.length > 0) {
        setLoading(true);
        try {
          const rawData: FinancialDataRaw = await financeApi.getFinanceData(id, '2024');
          
          // Create lookup maps for entry types and fund types
          const entryTypeMap = new Map<number, EntryType>();
          const fundTypeMap = new Map<number, FundType>();
          
          entryTypes.forEach(entry => entryTypeMap.set(entry.id, entry));
          fundTypes.forEach(fund => fundTypeMap.set(fund.id, fund));
          
          // Process expenditures to include full entry type and fund type objects
          const processedExpenditures: Expenditure[] = rawData.expenditures.map(exp => ({
            id: exp.id,
            value: exp.value,
            entry_type: entryTypeMap.get(exp.entry_type_id) || { 
              id: exp.entry_type_id, 
              name: `Unknown (${exp.entry_type_id})`,
              page: '',
              account_no: '',
              line: ''
            },
            fund_type: fundTypeMap.get(exp.fund_type_id) || { 
              id: exp.fund_type_id, 
              state_name: `Unknown (${exp.fund_type_id})`,
              state_id: ''
            }
          }));
          
          // Create processed financial data
          const processedData: FinancialData = {
            ...rawData,
            expenditures: processedExpenditures
          };
          
          setFinancialData(processedData);
          setError(null);
        } catch (err) {
          console.error('Error fetching financial data:', err);
          setError('Failed to load financial data. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFinancialData();
  }, [id, entryTypes, fundTypes]);

  // Process expenditure data by entry type
  const processByEntryType = (): ChartItem[] => {
    if (!financialData?.expenditures) return [];

    // Group by entry_type.name and sum values
    const entryTypeMap = new Map<string, number>();
    
    financialData.expenditures.forEach(exp => {
      const entryTypeName = exp.entry_type.name;
      const currentSum = entryTypeMap.get(entryTypeName) || 0;
      entryTypeMap.set(entryTypeName, currentSum + exp.value);
    });

    // Calculate total for percentages
    const total = Array.from(entryTypeMap.values()).reduce((sum, value) => sum + value, 0);

    // Convert to array and sort by value descending
    return Array.from(entryTypeMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / total) * 100
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Process expenditure data by entry type with "Other" rollup
  const processByEntryTypeWithRollup = (): ChartItem[] => {
    const allEntryTypes = processByEntryType();
    
    // If 5 or fewer items, return as is
    if (allEntryTypes.length <= 5) return allEntryTypes;
    
    // Take top 5 items
    const top5 = allEntryTypes.slice(0, 5);
    
    // Combine the rest into "Other"
    const otherItems = allEntryTypes.slice(5);
    const otherValue = otherItems.reduce((sum, item) => sum + item.value, 0);
    const total = allEntryTypes.reduce((sum, item) => sum + item.value, 0);
    
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

  // Process expenditure data by fund type
  const processByFundType = (): ChartItem[] => {
    if (!financialData?.expenditures) return [];

    // Group by fund_type.state_name and sum values
    const fundTypeMap = new Map<string, number>();
    
    financialData.expenditures.forEach(exp => {
      const fundTypeName = exp.fund_type.state_name;
      const currentSum = fundTypeMap.get(fundTypeName) || 0;
      fundTypeMap.set(fundTypeName, currentSum + exp.value);
    });

    // Calculate total for percentages
    const total = Array.from(fundTypeMap.values()).reduce((sum, value) => sum + value, 0);

    // Convert to array and sort by value descending
    return Array.from(fundTypeMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / total) * 100
      }))
      .sort((a, b) => b.value - a.value);
  };

  const entryTypeData = processByEntryType();
  const entryTypeDataWithRollup = processByEntryTypeWithRollup();
  const fundTypeData = processByFundType();
  const isLoading = districtLoading || loading || entryTypesLoading || fundTypesLoading;

  // Generate a unique color for each item
  const getColor = (index: number) => {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b',
      '#27ae60', '#8e44ad', '#f1c40f', '#e67e22', '#95a5a6'
    ];
    return colors[index % colors.length];
  };

  // Calculate the total expenditure amount
  const totalExpenditures = financialData?.expenditures.reduce(
    (total, exp) => total + exp.value, 0
  ) || 0;

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

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
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : financialData?.expenditures.length === 0 ? (
          <Typography>No financial data available for this district.</Typography>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Total Expenditures: {formatCurrency(totalExpenditures)}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Expenditure By Fund Type
              </Typography>
              {renderSegmentedBar(fundTypeData)}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                {fundTypeData.map((item, index) => (
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
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Expenditure By Program
              </Typography>
              {renderSegmentedBar(entryTypeDataWithRollup)}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                {entryTypeDataWithRollup.map((item, index) => (
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
            </Box>

            <Divider sx={{ my: 3 }} />

            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="By Program" />
              <Tab label="By Expenditure Type" />
            </Tabs>

            {tabValue === 0 && (
              <Box sx={{ mt: 2, mb: 4 }}>
                {entryTypeData.map((item, index) => (
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
            )}

            {tabValue === 1 && (
              <Box sx={{ mt: 2, mb: 4 }}>
                {fundTypeData.map((item, index) => (
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
            )}
          </Box>
        )}
      </Box>
      </>
  );
};

export default Financials; 
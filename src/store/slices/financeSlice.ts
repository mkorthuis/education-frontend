import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { financeApi } from '@/services/api/endpoints/finances';

// Define types for the financial data
export interface FundType {
  id: number;
  state_name: string;
  state_id: string;
}

export interface EntryType {
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
}

export interface FinancialItem {
  id: number;
  value: number;
  entry_type: EntryType;
  fund_type: FundType;
}

export interface FinancialItemRaw {
  id: number;
  value: number;
  entry_type_id: number;
  fund_type_id: number;
}

// Type aliases for semantic clarity
export interface Expenditure extends FinancialItem {}
export interface Revenue extends FinancialItem {}
export interface BalanceSheet extends FinancialItem {}

export interface ExpenditureRaw extends FinancialItemRaw {}
export interface RevenueRaw extends FinancialItemRaw {}
export interface BalanceSheetRaw extends FinancialItemRaw {}

export interface FinancialReport {
  doe_form: {
    id: number;
    year: number;
    date_created: string;
    date_updated: string;
    district_id: number;
  };
  balance_sheets: BalanceSheetRaw[];
  revenues: RevenueRaw[];
  expenditures: ExpenditureRaw[];
}

export interface ProcessedReport {
  balance_sheets: BalanceSheet[];
  revenues: Revenue[];
  expenditures: Expenditure[];
}

export interface FinanceState {
  // Entry and fund type collections
  balanceEntryTypes: EntryType[];
  revenueEntryTypes: EntryType[];
  expenditureEntryTypes: EntryType[];
  balanceFundTypes: FundType[];
  revenueFundTypes: FundType[];
  expenditureFundTypes: FundType[];
  
  // For current financial report
  currentFinancialReport: FinancialReport | null;
  processedReport: ProcessedReport | null;
  
  // For comparison year financial reports (multiple years support)
  comparisonReports: Record<string, FinancialReport>;
  processedComparisonReports: Record<string, ProcessedReport>;
  
  // For backward compatibility
  comparisonFinancialReport: FinancialReport | null;
  comparisonProcessedReport: ProcessedReport | null;
  
  // Status
  loading: boolean;
  entryTypesLoaded: boolean;
  fundTypesLoaded: boolean;
  error: string | null;
}

const initialState: FinanceState = {
  balanceEntryTypes: [],
  revenueEntryTypes: [],
  expenditureEntryTypes: [],
  balanceFundTypes: [],
  revenueFundTypes: [],
  expenditureFundTypes: [],
  currentFinancialReport: null,
  processedReport: null,
  comparisonReports: {},
  processedComparisonReports: {},
  comparisonFinancialReport: null,
  comparisonProcessedReport: null,
  loading: false,
  entryTypesLoaded: false,
  fundTypesLoaded: false,
  error: null,
};

// Generic error handler function for thunks
const handleApiError = (error: any, errorMessage: string) => {
  console.error(errorMessage, error);
  return errorMessage;
};

// Async thunks for fetching financial data
export const fetchEntryTypes = createAsyncThunk(
  'finance/fetchEntryTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await financeApi.getEntryTypes();
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch entry types'));
    }
  }
);

export const fetchFundTypes = createAsyncThunk(
  'finance/fetchFundTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await financeApi.getFundTypes();
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch fund types'));
    }
  }
);

export const fetchFinancialReport = createAsyncThunk(
  'finance/fetchFinancialReport',
  async ({ 
    districtId, 
    year = '2024', 
    forceRefresh = false,
    includeComparisonYear = true,
    comparisonYear = null
  }: { 
    districtId: string; 
    year?: string; 
    forceRefresh?: boolean;
    includeComparisonYear?: boolean;
    comparisonYear?: string | null;
  }, { rejectWithValue, getState, dispatch }) => {
    try {
      // Check if entry types and fund types are loaded, if not fetch them first
      const state = getState() as RootState;
      const { entryTypesLoaded, fundTypesLoaded } = state.finance;
      
      if (!entryTypesLoaded) {
        await dispatch(fetchEntryTypes());
      }
      
      if (!fundTypesLoaded) {
        await dispatch(fetchFundTypes());
      }
      
      // Fetch current year data
      const currentYearData = await financeApi.getFinanceData(districtId, year, forceRefresh);
      
      // If requested, also fetch comparison year data
      let comparisonYearData = null;
      if (includeComparisonYear) {
        // Use the specified comparison year or default to the previous year
        const yearToFetch = comparisonYear || (parseInt(year) - 1).toString();
        try {
          comparisonYearData = await financeApi.getFinanceData(districtId, yearToFetch, forceRefresh);
        } catch (error) {
          console.warn(`Failed to fetch comparison year (${yearToFetch}) data:`, error);
          // Continue even if comparison year fetch fails
        }
      }
      
      return { currentYearData, comparisonYearData, comparisonYear };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch financial report'));
    }
  }
);

// New thunk to fetch a specific comparison year
export const fetchComparisonYearReport = createAsyncThunk(
  'finance/fetchComparisonYearReport',
  async ({ 
    districtId, 
    year,
    forceRefresh = false
  }: { 
    districtId: string; 
    year: string;
    forceRefresh?: boolean;
  }, { rejectWithValue, getState, dispatch }) => {
    try {
      // Check if entry types and fund types are loaded, if not fetch them first
      const state = getState() as RootState;
      const { entryTypesLoaded, fundTypesLoaded, processedComparisonReports } = state.finance;
      
      // Return early if we already have this year in the store and not forcing refresh
      if (!forceRefresh && processedComparisonReports[year]) {
        return { year, reportData: null, alreadyExists: true };
      }
      
      if (!entryTypesLoaded) {
        await dispatch(fetchEntryTypes());
      }
      
      if (!fundTypesLoaded) {
        await dispatch(fetchFundTypes());
      }
      
      // Fetch the comparison year data
      const reportData = await financeApi.getFinanceData(districtId, year, forceRefresh);
      
      return { year, reportData, alreadyExists: false };
    } catch (error) {
      return rejectWithValue(handleApiError(error, `Failed to fetch year ${year} financial report`));
    }
  }
);

// Helper function to process raw financial items with entry and fund types
const processFinancialItems = <T extends FinancialItemRaw>(
  items: T[], 
  entryTypeMap: Map<number, EntryType>, 
  fundTypeMap: Map<number, FundType>
): FinancialItem[] => {
  return items.map((item: T) => ({
    id: item.id,
    value: item.value,
    entry_type: entryTypeMap.get(item.entry_type_id) || { 
      id: item.entry_type_id, 
      name: `Unknown (${item.entry_type_id})`,
      page: '',
      account_no: '',
      line: ''
    },
    fund_type: fundTypeMap.get(item.fund_type_id) || { 
      id: item.fund_type_id, 
      state_name: `Unknown (${item.fund_type_id})`,
      state_id: ''
    }
  }));
};

export const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    clearFinancialData: (state) => {
      state.currentFinancialReport = null;
      state.processedReport = null;
      state.comparisonFinancialReport = null;
      state.comparisonProcessedReport = null;
      state.comparisonReports = {};
      state.processedComparisonReports = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchEntryTypes
      .addCase(fetchEntryTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntryTypes.fulfilled, (state, action) => {
        state.balanceEntryTypes = action.payload.balance_entry_types;
        state.revenueEntryTypes = action.payload.revenue_entry_types;
        state.expenditureEntryTypes = action.payload.expenditure_entry_types;
        state.entryTypesLoaded = true;
        state.loading = false;
      })
      .addCase(fetchEntryTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchFundTypes
      .addCase(fetchFundTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFundTypes.fulfilled, (state, action) => {
        state.balanceFundTypes = action.payload.balance_fund_types;
        state.revenueFundTypes = action.payload.revenue_fund_types;
        state.expenditureFundTypes = action.payload.expenditure_fund_types;
        state.fundTypesLoaded = true;
        state.loading = false;
      })
      .addCase(fetchFundTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchFinancialReport
      .addCase(fetchFinancialReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinancialReport.fulfilled, (state, action) => {
        const { currentYearData, comparisonYearData, comparisonYear } = action.payload;
        
        // Process current year data
        state.currentFinancialReport = currentYearData;
        if (currentYearData) {
          // Create lookup maps for all entry types and fund types
          const balanceEntryTypeMap = new Map<number, EntryType>();
          const revenueEntryTypeMap = new Map<number, EntryType>();
          const expenditureEntryTypeMap = new Map<number, EntryType>();
          
          const balanceFundTypeMap = new Map<number, FundType>();
          const revenueFundTypeMap = new Map<number, FundType>();
          const expenditureFundTypeMap = new Map<number, FundType>();
          
          // Populate entry type maps
          state.balanceEntryTypes.forEach(entryType => {
            balanceEntryTypeMap.set(entryType.id, entryType);
          });
          
          state.revenueEntryTypes.forEach(entryType => {
            revenueEntryTypeMap.set(entryType.id, entryType);
          });
          
          state.expenditureEntryTypes.forEach(entryType => {
            expenditureEntryTypeMap.set(entryType.id, entryType);
          });
          
          // Populate fund type maps
          state.balanceFundTypes.forEach(fundType => {
            balanceFundTypeMap.set(fundType.id, fundType);
          });
          
          state.revenueFundTypes.forEach(fundType => {
            revenueFundTypeMap.set(fundType.id, fundType);
          });
          
          state.expenditureFundTypes.forEach(fundType => {
            expenditureFundTypeMap.set(fundType.id, fundType);
          });
          
          // Process raw data into processed data
          const processedReport: ProcessedReport = {
            balance_sheets: processFinancialItems(
              currentYearData.balance_sheets,
              balanceEntryTypeMap,
              balanceFundTypeMap
            ) as BalanceSheet[],
            
            revenues: processFinancialItems(
              currentYearData.revenues,
              revenueEntryTypeMap,
              revenueFundTypeMap
            ) as Revenue[],
            
            expenditures: processFinancialItems(
              currentYearData.expenditures,
              expenditureEntryTypeMap,
              expenditureFundTypeMap
            ) as Expenditure[]
          };
          
          state.processedReport = processedReport;
        }
        
        // Process comparison year data if available
        state.comparisonFinancialReport = comparisonYearData;
        if (comparisonYearData) {
          // Use the same maps as above since they're already populated
          const balanceEntryTypeMap = new Map<number, EntryType>();
          const revenueEntryTypeMap = new Map<number, EntryType>();
          const expenditureEntryTypeMap = new Map<number, EntryType>();
          
          const balanceFundTypeMap = new Map<number, FundType>();
          const revenueFundTypeMap = new Map<number, FundType>();
          const expenditureFundTypeMap = new Map<number, FundType>();
          
          // Populate entry type maps
          state.balanceEntryTypes.forEach(entryType => {
            balanceEntryTypeMap.set(entryType.id, entryType);
          });
          
          state.revenueEntryTypes.forEach(entryType => {
            revenueEntryTypeMap.set(entryType.id, entryType);
          });
          
          state.expenditureEntryTypes.forEach(entryType => {
            expenditureEntryTypeMap.set(entryType.id, entryType);
          });
          
          // Populate fund type maps
          state.balanceFundTypes.forEach(fundType => {
            balanceFundTypeMap.set(fundType.id, fundType);
          });
          
          state.revenueFundTypes.forEach(fundType => {
            revenueFundTypeMap.set(fundType.id, fundType);
          });
          
          state.expenditureFundTypes.forEach(fundType => {
            expenditureFundTypeMap.set(fundType.id, fundType);
          });
          
          const comparisonProcessedReport: ProcessedReport = {
            balance_sheets: processFinancialItems(
              comparisonYearData.balance_sheets,
              balanceEntryTypeMap,
              balanceFundTypeMap
            ) as BalanceSheet[],
            
            revenues: processFinancialItems(
              comparisonYearData.revenues,
              revenueEntryTypeMap,
              revenueFundTypeMap
            ) as Revenue[],
            
            expenditures: processFinancialItems(
              comparisonYearData.expenditures,
              expenditureEntryTypeMap,
              expenditureFundTypeMap
            ) as Expenditure[]
          };
          
          state.comparisonProcessedReport = comparisonProcessedReport;
          
          // Store in the multi-year map as well
          if (comparisonYear) {
            state.comparisonReports[comparisonYear] = comparisonYearData;
            state.processedComparisonReports[comparisonYear] = comparisonProcessedReport;
          } else if (comparisonYearData.doe_form?.year) {
            const year = comparisonYearData.doe_form.year.toString();
            state.comparisonReports[year] = comparisonYearData;
            state.processedComparisonReports[year] = comparisonProcessedReport;
          }
        }
        
        state.loading = false;
      })
      .addCase(fetchFinancialReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchComparisonYearReport
      .addCase(fetchComparisonYearReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComparisonYearReport.fulfilled, (state, action) => {
        const { year, reportData, alreadyExists } = action.payload;
        
        // If the report already exists in the store and we're not refreshing, skip processing
        if (alreadyExists) {
          state.loading = false;
          return;
        }
        
        // Process the report data
        if (reportData) {
          // Create lookup maps for all entry types and fund types
          const balanceEntryTypeMap = new Map<number, EntryType>();
          const revenueEntryTypeMap = new Map<number, EntryType>();
          const expenditureEntryTypeMap = new Map<number, EntryType>();
          
          const balanceFundTypeMap = new Map<number, FundType>();
          const revenueFundTypeMap = new Map<number, FundType>();
          const expenditureFundTypeMap = new Map<number, FundType>();
          
          // Populate entry type maps
          state.balanceEntryTypes.forEach(entryType => {
            balanceEntryTypeMap.set(entryType.id, entryType);
          });
          
          state.revenueEntryTypes.forEach(entryType => {
            revenueEntryTypeMap.set(entryType.id, entryType);
          });
          
          state.expenditureEntryTypes.forEach(entryType => {
            expenditureEntryTypeMap.set(entryType.id, entryType);
          });
          
          // Populate fund type maps
          state.balanceFundTypes.forEach(fundType => {
            balanceFundTypeMap.set(fundType.id, fundType);
          });
          
          state.revenueFundTypes.forEach(fundType => {
            revenueFundTypeMap.set(fundType.id, fundType);
          });
          
          state.expenditureFundTypes.forEach(fundType => {
            expenditureFundTypeMap.set(fundType.id, fundType);
          });
          
          const processedReport: ProcessedReport = {
            balance_sheets: processFinancialItems(
              reportData.balance_sheets,
              balanceEntryTypeMap,
              balanceFundTypeMap
            ) as BalanceSheet[],
            
            revenues: processFinancialItems(
              reportData.revenues,
              revenueEntryTypeMap,
              revenueFundTypeMap
            ) as Revenue[],
            
            expenditures: processFinancialItems(
              reportData.expenditures,
              expenditureEntryTypeMap,
              expenditureFundTypeMap
            ) as Expenditure[]
          };
          
          // Store the raw and processed reports in the maps
          state.comparisonReports[year] = reportData;
          state.processedComparisonReports[year] = processedReport;
        }
        
        state.loading = false;
      })
      .addCase(fetchComparisonYearReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearFinancialData } = financeSlice.actions;

// Selectors

// Select the processed expenditures, grouped by entry type
export const selectExpendituresByEntryType = (state: RootState) => {
  if (!state.finance.processedReport) return [];
  
  // Group by entry type and sum values
  const groupedByEntryType = state.finance.processedReport.expenditures.reduce((acc, expenditure) => {
    const typeName = expenditure.entry_type.name;
    if (!acc[typeName]) {
      acc[typeName] = {
        name: typeName,
        value: 0,
      };
    }
    acc[typeName].value += expenditure.value;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);
  
  // Convert to array and calculate percentages
  const result = Object.values(groupedByEntryType);
  const total = result.reduce((sum, item) => sum + item.value, 0);
  
  return result.map(item => ({
    ...item,
    percentage: (item.value / total) * 100
  })).sort((a, b) => b.value - a.value);
};

// Select the processed expenditures, grouped by fund type
export const selectExpendituresByFundType = (state: RootState) => {
  if (!state.finance.processedReport) return [];
  
  // Group by fund type and sum values
  const groupedByFundType = state.finance.processedReport.expenditures.reduce((acc, expenditure) => {
    const typeName = expenditure.fund_type.state_name;
    if (!acc[typeName]) {
      acc[typeName] = {
        name: typeName,
        value: 0,
      };
    }
    acc[typeName].value += expenditure.value;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);
  
  // Convert to array and calculate percentages
  const result = Object.values(groupedByFundType);
  const total = result.reduce((sum, item) => sum + item.value, 0);
  
  return result.map(item => ({
    ...item,
    percentage: (item.value / total) * 100
  })).sort((a, b) => b.value - a.value);
};

// Calculate total expenditures
export const selectTotalExpenditures = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return state.finance.processedReport.expenditures.reduce((sum, item) => sum + item.value, 0);
};

// Select the processed revenues, grouped by entry type
export const selectRevenuesByEntryType = (state: RootState) => {
  if (!state.finance.processedReport) return [];
  
  // Group by entry type and sum values
  const groupedByEntryType = state.finance.processedReport.revenues.reduce((acc, revenue) => {
    const typeName = revenue.entry_type.name;
    if (!acc[typeName]) {
      acc[typeName] = {
        name: typeName,
        value: 0,
      };
    }
    acc[typeName].value += revenue.value;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);
  
  // Convert to array and calculate percentages
  const result = Object.values(groupedByEntryType);
  const total = result.reduce((sum, item) => sum + item.value, 0);
  
  return result.map(item => ({
    ...item,
    percentage: (item.value / total) * 100
  })).sort((a, b) => b.value - a.value);
};

// Select the processed revenues, grouped by fund type
export const selectRevenuesByFundType = (state: RootState) => {
  if (!state.finance.processedReport) return [];
  
  // Group by fund type and sum values
  const groupedByFundType = state.finance.processedReport.revenues.reduce((acc, revenue) => {
    const typeName = revenue.fund_type.state_name;
    if (!acc[typeName]) {
      acc[typeName] = {
        name: typeName,
        value: 0,
      };
    }
    acc[typeName].value += revenue.value;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);
  
  // Convert to array and calculate percentages
  const result = Object.values(groupedByFundType);
  const total = result.reduce((sum, item) => sum + item.value, 0);
  
  return result.map(item => ({
    ...item,
    percentage: (item.value / total) * 100
  })).sort((a, b) => b.value - a.value);
};

// Calculate total revenues
export const selectTotalRevenues = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return state.finance.processedReport.revenues.reduce((sum, item) => sum + item.value, 0);
};

// Calculate total balance sheet value
export const selectTotalAssets = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return state.finance.processedReport.balance_sheets.reduce((sum, item) => sum + item.value, 0);
};

// Select assets only (super category 1 & 3)
export const selectTotalAssetsOnly = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return state.finance.processedReport.balance_sheets
    .filter(item => {
      const superCategoryId = item.entry_type.category?.super_category?.id;
      return superCategoryId === 1 || superCategoryId === 3;
    })
    .reduce((sum, item) => sum + item.value, 0);
};

// Select liabilities only (super category 2)
export const selectTotalLiabilities = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return state.finance.processedReport.balance_sheets
    .filter(item => {
      const superCategoryId = item.entry_type.category?.super_category?.id;
      return superCategoryId === 2;
    })
    .reduce((sum, item) => sum + item.value, 0);
};

// Select the financial report
export const selectFinancialReport = (state: RootState) => state.finance.currentFinancialReport;

// Select the processed report
export const selectProcessedReport = (state: RootState) => state.finance.processedReport;

// Select loading status
export const selectFinanceLoading = (state: RootState) => state.finance.loading;

// Select error status
export const selectFinanceError = (state: RootState) => state.finance.error;

// Comparison year selectors
export const selectComparisonYearFinancialReport = (state: RootState) => state.finance.comparisonFinancialReport;
export const selectComparisonYearProcessedReport = (state: RootState) => state.finance.comparisonProcessedReport;

// Calculate total expenditures for comparison year
export const selectComparisonYearTotalExpenditures = (state: RootState) => {
  if (!state.finance.comparisonProcessedReport) return 0;
  return state.finance.comparisonProcessedReport.expenditures.reduce((sum, item) => sum + item.value, 0);
};

// Calculate total revenues for comparison year
export const selectComparisonYearTotalRevenues = (state: RootState) => {
  if (!state.finance.comparisonProcessedReport) return 0;
  return state.finance.comparisonProcessedReport.revenues.reduce((sum, item) => sum + item.value, 0);
};

// Calculate total balance sheet value for comparison year
export const selectComparisonYearTotalAssets = (state: RootState) => {
  if (!state.finance.comparisonProcessedReport) return 0;
  return state.finance.comparisonProcessedReport.balance_sheets.reduce((sum, item) => sum + item.value, 0);
};

// Select comparison year assets only (super category 1 & 3)
export const selectComparisonYearTotalAssetsOnly = (state: RootState) => {
  if (!state.finance.comparisonProcessedReport) return 0;
  return state.finance.comparisonProcessedReport.balance_sheets
    .filter(item => {
      const superCategoryId = item.entry_type.category?.super_category?.id;
      return superCategoryId === 1 || superCategoryId === 3;
    })
    .reduce((sum, item) => sum + item.value, 0);
};

// Select comparison year liabilities only (super category 2)
export const selectComparisonYearTotalLiabilities = (state: RootState) => {
  if (!state.finance.comparisonProcessedReport) return 0;
  return state.finance.comparisonProcessedReport.balance_sheets
    .filter(item => {
      const superCategoryId = item.entry_type.category?.super_category?.id;
      return superCategoryId === 2;
    })
    .reduce((sum, item) => sum + item.value, 0);
};

// For backward compatibility, keep the previous selectors with the same names
export const selectPreviousYearFinancialReport = selectComparisonYearFinancialReport;
export const selectPreviousYearProcessedReport = selectComparisonYearProcessedReport;
export const selectPreviousYearTotalExpenditures = selectComparisonYearTotalExpenditures;
export const selectPreviousYearTotalRevenues = selectComparisonYearTotalRevenues;
export const selectPreviousYearTotalAssets = selectComparisonYearTotalAssets;

// New selectors for multi-year comparison
export const selectComparisonReportByYear = (state: RootState, year: string) => 
  state.finance.comparisonReports[year] || null;

export const selectProcessedComparisonReportByYear = (state: RootState, year: string) => 
  state.finance.processedComparisonReports[year] || null;

// Function to get total expenditures for a specific year
export const selectTotalExpendituresByYear = (state: RootState, year: string) => {
  const report = state.finance.processedComparisonReports[year];
  if (!report) return 0;
  return report.expenditures.reduce((sum, item) => sum + item.value, 0);
};

// Function to get total revenues for a specific year
export const selectTotalRevenuesByYear = (state: RootState, year: string) => {
  const report = state.finance.processedComparisonReports[year];
  if (!report) return 0;
  return report.revenues.reduce((sum, item) => sum + item.value, 0);
};

// Function to get total assets for a specific year
export const selectTotalAssetsByYear = (state: RootState, year: string) => {
  const report = state.finance.processedComparisonReports[year];
  if (!report) return 0;
  return report.balance_sheets
    .filter(item => {
      const superCategoryId = item.entry_type.category?.super_category?.id;
      return superCategoryId === 1 || superCategoryId === 3;
    })
    .reduce((sum, item) => sum + item.value, 0);
};

// Function to get total liabilities for a specific year
export const selectTotalLiabilitiesByYear = (state: RootState, year: string) => {
  const report = state.finance.processedComparisonReports[year];
  if (!report) return 0;
  return report.balance_sheets
    .filter(item => {
      const superCategoryId = item.entry_type.category?.super_category?.id;
      return superCategoryId === 2;
    })
    .reduce((sum, item) => sum + item.value, 0);
};

// Export the reducer
export default financeSlice.reducer; 
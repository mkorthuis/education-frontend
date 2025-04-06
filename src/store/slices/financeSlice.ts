import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { financeApi } from '@/services/api/endpoints/finances';
import { FISCAL_YEAR } from '@/utils/environment';

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

// New interface for per pupil expenditure data
export interface PerPupilExpenditure {
  id: number;
  year: number;
  elementary: number;
  middle: number;
  high: number;
  total: number;
  district_id?: number; // Optional since state averages don't have a district_id
  date_created: string;
  date_updated: string;
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
  
  // Per pupil expenditure data
  perPupilExpenditureAllData: PerPupilExpenditure[];
  statePerPupilExpenditureAllData: PerPupilExpenditure[];
  
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
  perPupilExpenditureAllData: [],
  statePerPupilExpenditureAllData: [],
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

// Helper functions to create maps from arrays
const createEntryTypeMap = (entryTypes: EntryType[]): Map<number, EntryType> => {
  const map = new Map<number, EntryType>();
  entryTypes.forEach(entryType => {
    map.set(entryType.id, entryType);
  });
  return map;
};

const createFundTypeMap = (fundTypes: FundType[]): Map<number, FundType> => {
  const map = new Map<number, FundType>();
  fundTypes.forEach(fundType => {
    map.set(fundType.id, fundType);
  });
  return map;
};

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

// Helper function to process a report
const processReport = (
  report: FinancialReport, 
  state: FinanceState
): ProcessedReport => {
  const balanceEntryTypeMap = createEntryTypeMap(state.balanceEntryTypes);
  const revenueEntryTypeMap = createEntryTypeMap(state.revenueEntryTypes);
  const expenditureEntryTypeMap = createEntryTypeMap(state.expenditureEntryTypes);
  
  const balanceFundTypeMap = createFundTypeMap(state.balanceFundTypes);
  const revenueFundTypeMap = createFundTypeMap(state.revenueFundTypes);
  const expenditureFundTypeMap = createFundTypeMap(state.expenditureFundTypes);
  
  return {
    balance_sheets: processFinancialItems(
      report.balance_sheets,
      balanceEntryTypeMap,
      balanceFundTypeMap
    ) as BalanceSheet[],
    
    revenues: processFinancialItems(
      report.revenues,
      revenueEntryTypeMap,
      revenueFundTypeMap
    ) as Revenue[],
    
    expenditures: processFinancialItems(
      report.expenditures,
      expenditureEntryTypeMap,
      expenditureFundTypeMap
    ) as Expenditure[]
  };
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

// Helper to ensure entry types and fund types are loaded
const ensureTypesLoaded = async (state: RootState, dispatch: any) => {
  const { entryTypesLoaded, fundTypesLoaded } = state.finance;
  
  const promises = [];
  if (!entryTypesLoaded) {
    promises.push(dispatch(fetchEntryTypes()));
  }
  
  if (!fundTypesLoaded) {
    promises.push(dispatch(fetchFundTypes()));
  }
  
  if (promises.length > 0) {
    await Promise.all(promises);
  }
};

export const fetchFinancialReport = createAsyncThunk(
  'finance/fetchFinancialReport',
  async ({ 
    districtId, 
    year = FISCAL_YEAR, 
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
      // Ensure entry types and fund types are loaded
      await ensureTypesLoaded(getState() as RootState, dispatch);
      
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
      const state = getState() as RootState;
      
      // Return early if we already have this year in the store and not forcing refresh
      if (!forceRefresh && state.finance.processedComparisonReports[year]) {
        return { year, reportData: null, alreadyExists: true };
      }
      
      // Ensure entry types and fund types are loaded
      await ensureTypesLoaded(state, dispatch);
      
      // Fetch the comparison year data
      const reportData = await financeApi.getFinanceData(districtId, year, forceRefresh);
      
      return { year, reportData, alreadyExists: false };
    } catch (error) {
      return rejectWithValue(handleApiError(error, `Failed to fetch year ${year} financial report`));
    }
  }
);

// New thunk to fetch per pupil expenditure data
export const fetchPerPupilExpenditure = createAsyncThunk(
  'finance/fetchPerPupilExpenditure',
  async ({ 
    districtId,
    year,
    forceRefresh = false
  }: { 
    districtId: string; 
    year?: string;
    forceRefresh?: boolean;
  }, { rejectWithValue }) => {
    try {
      // Don't specify year parameter to get all data
      const perPupilData = await financeApi.getPerPupilExpendituresForDistrict(districtId, year, forceRefresh);
      return perPupilData;
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch per pupil expenditure data'));
    }
  }
);

// New thunk to fetch state average per pupil expenditure data
export const fetchStatePerPupilExpenditure = createAsyncThunk(
  'finance/fetchStatePerPupilExpenditure',
  async ({ 
    year,
    forceRefresh = false
  }: { 
    year?: string;
    forceRefresh?: boolean;
  }, { rejectWithValue }) => {
    try {
      // Don't specify year parameter to get the all data
      const statePerPupilData = await financeApi.getPerPupilExpendituresForState(year, forceRefresh);
      return statePerPupilData;
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch state average per pupil expenditure data'));
    }
  }
);

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
        if (currentYearData) {
          state.currentFinancialReport = currentYearData;
          state.processedReport = processReport(currentYearData, state);
        }
        
        // Process comparison year data if available
        if (comparisonYearData) {
          state.comparisonFinancialReport = comparisonYearData;
          const processedComparisonReport = processReport(comparisonYearData, state);
          state.comparisonProcessedReport = processedComparisonReport;
          
          // Store in the multi-year map as well
          const yearKey = comparisonYear || 
            (comparisonYearData.doe_form?.year ? comparisonYearData.doe_form.year.toString() : null);
          
          if (yearKey) {
            state.comparisonReports[yearKey] = comparisonYearData;
            state.processedComparisonReports[yearKey] = processedComparisonReport;
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
          const processedReport = processReport(reportData, state);
          
          // Store the raw and processed reports in the maps
          state.comparisonReports[year] = reportData;
          state.processedComparisonReports[year] = processedReport;
        }
        
        state.loading = false;
      })
      .addCase(fetchComparisonYearReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchPerPupilExpenditure
      .addCase(fetchPerPupilExpenditure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPerPupilExpenditure.fulfilled, (state, action) => {
        // API returns an array with objects containing per pupil expenditure data
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          // Store all data
          state.perPupilExpenditureAllData = action.payload;
        } else {
          state.perPupilExpenditureAllData = [];
        }
        state.loading = false;
      })
      .addCase(fetchPerPupilExpenditure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchStatePerPupilExpenditure
      .addCase(fetchStatePerPupilExpenditure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatePerPupilExpenditure.fulfilled, (state, action) => {
        // API returns an array with objects containing state per pupil expenditure data
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.statePerPupilExpenditureAllData = action.payload;
        } else {
          state.statePerPupilExpenditureAllData = [];
        }
        state.loading = false;
      })
      .addCase(fetchStatePerPupilExpenditure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearFinancialData } = financeSlice.actions;

// --- Selector Helper Functions ---

// Filter balance sheet items by asset type (assets or liabilities)
const filterBalanceItems = (items: BalanceSheet[], isAsset: boolean): BalanceSheet[] => {
  return items.filter(item => {
    const superCategoryId = item.entry_type.category?.super_category?.id;
    return isAsset 
      ? (superCategoryId === 1 || superCategoryId === 3) // Assets
      : (superCategoryId === 2); // Liabilities
  });
};

// Helper to get total for financial items
const calculateTotal = (items: FinancialItem[]): number => {
  return items.reduce((sum, item) => sum + item.value, 0);
};

// --- SELECTORS ---

// Basic Selectors
export const selectFinancialReport = (state: RootState) => state.finance.currentFinancialReport;
export const selectProcessedReport = (state: RootState) => state.finance.processedReport;
export const selectFinanceLoading = (state: RootState) => state.finance.loading;
export const selectFinanceError = (state: RootState) => state.finance.error;
export const selectPerPupilExpenditureAllData = (state: RootState) => state.finance.perPupilExpenditureAllData;
export const selectStatePerPupilExpenditureAllData = (state: RootState) => state.finance.statePerPupilExpenditureAllData;

// Expenditure Selectors
export const selectTotalExpenditures = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return calculateTotal(state.finance.processedReport.expenditures);
};

// Revenue Selectors
export const selectTotalRevenues = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return calculateTotal(state.finance.processedReport.revenues);
};

// Balance Sheet Selectors
export const selectTotalAssets = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return calculateTotal(state.finance.processedReport.balance_sheets);
};

export const selectTotalAssetsOnly = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return calculateTotal(
    filterBalanceItems(state.finance.processedReport.balance_sheets, true)
  );
};

export const selectTotalLiabilities = (state: RootState) => {
  if (!state.finance.processedReport) return 0;
  return calculateTotal(
    filterBalanceItems(state.finance.processedReport.balance_sheets, false)
  );
};

// Multi-Year Comparison Selectors
export const selectProcessedComparisonReportByYear = (state: RootState, year: string) => 
  state.finance.processedComparisonReports[year] || null;

export const selectTotalExpendituresByYear = (state: RootState, year: string) => {
  const report = state.finance.processedComparisonReports[year];
  if (!report) return 0;
  return calculateTotal(report.expenditures);
};

export const selectTotalRevenuesByYear = (state: RootState, year: string) => {
  const report = state.finance.processedComparisonReports[year];
  if (!report) return 0;
  return calculateTotal(report.revenues);
};

export const selectTotalAssetsByYear = (state: RootState, year: string) => {
  const report = state.finance.processedComparisonReports[year];
  if (!report) return 0;
  return calculateTotal(filterBalanceItems(report.balance_sheets, true));
};

export const selectTotalLiabilitiesByYear = (state: RootState, year: string) => {
  const report = state.finance.processedComparisonReports[year];
  if (!report) return 0;
  return calculateTotal(filterBalanceItems(report.balance_sheets, false));
};

// Per Pupil Expenditure Selectors
export const selectLatestPerPupilExpenditure = (state: RootState) => {
  const allData = state.finance.perPupilExpenditureAllData;
  if (!allData || allData.length === 0) return null;
  
  // Find the entry with the highest year value
  const latest = allData.reduce((latest, current) => {
    return current.year > latest.year ? current : latest;
  }, allData[0]);
  
  return latest.total;
};

export const selectLatestPerPupilExpenditureDetails = (state: RootState) => {
  const allData = state.finance.perPupilExpenditureAllData;
  if (!allData || allData.length === 0) return null;
  
  // Find the entry with the highest year value
  return allData.reduce((latest, current) => {
    return current.year > latest.year ? current : latest;
  }, allData[0]);
};


export const selectLatestStatePerPupilExpenditureDetails = (state: RootState) => {
  const allData = state.finance.statePerPupilExpenditureAllData;
  if (!allData || allData.length === 0) return null;
  
  // Find the entry with the highest year value
  return allData.reduce((latest, current) => {
    return current.year > latest.year ? current : latest;
  }, allData[0]);
};

// Per Pupil Expenditure Selectors by Year
export const selectPerPupilExpenditureByYear = (state: RootState, year: number) => {
  const allData = state.finance.perPupilExpenditureAllData;
  if (!allData || allData.length === 0) return null;
  
  // Find the entry matching the requested year
  return allData.find(item => item.year === year) || null;
};

export const selectStatePerPupilExpenditureByYear = (state: RootState, year: number) => {
  const allData = state.finance.statePerPupilExpenditureAllData;
  if (!allData || allData.length === 0) return null;
  
  // Find the entry matching the requested year
  return allData.find(item => item.year === year) || null;
};

// Export the reducer
export default financeSlice.reducer; 
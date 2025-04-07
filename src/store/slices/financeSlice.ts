// financeSlice.v2.ts - Empty file for new implementation 
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { financeApi } from '@/services/api/endpoints/finances';
import { FISCAL_YEAR } from '@/utils/environment';

// Define types for entry types
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

// Define types for fund types
export interface FundType {
  id: number;
  state_name: string;
  state_id: string;
}

// Define type for per pupil expenditure data
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

// Define type for state expenditure data
export interface StateExpenditure {
  id: number;
  year: number;
  operating_elementary: number;
  operating_middle: number;
  operating_high: number;
  operating_total: number;
  current_elementary: number;
  current_middle: number;
  current_high: number;
  current_total: number;
  total: number;
  date_created: string;
  date_updated: string;
}

// Define type for state revenue data
export interface StateRevenue {
  id: number;
  entry_type_id: number;
  year: number;
  value: number;
}
// Define types for financial items
export interface FinancialItemRaw {
  id: number;
  value: number;
  entry_type_id: number;
  fund_type_id: number;
}

export interface FinancialItem {
  id: number;
  value: number;
  entry_type: EntryType;
  fund_type: FundType;
}

// Type aliases for semantic clarity
export interface ExpenditureRaw extends FinancialItemRaw {}
export interface RevenueRaw extends FinancialItemRaw {}
export interface BalanceSheetRaw extends FinancialItemRaw {}

export interface Expenditure extends FinancialItem {}
export interface Revenue extends FinancialItem {}
export interface BalanceSheet extends FinancialItem {}

// Define financial report structure
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

// Define processed report structure with expanded items
export interface ProcessedReport {
  balance_sheets: BalanceSheet[];
  revenues: Revenue[];
  expenditures: Expenditure[];
}

// Initial state interface
export interface FinanceState {
  // Entry types collections
  balanceEntryTypes: EntryType[];
  revenueEntryTypes: EntryType[];
  expenditureEntryTypes: EntryType[];
  
  // Fund types collections
  balanceFundTypes: FundType[];
  revenueFundTypes: FundType[];
  expenditureFundTypes: FundType[];
  
  // Financial reports
  financialReports: Record<string, FinancialReport>;
  processedReports: Record<string, ProcessedReport>;
  processedReportDistrictId: string | null;
  // Per pupil expenditure data
  perPupilExpenditureAllData: PerPupilExpenditure[];
  statePerPupilExpenditureAllData: PerPupilExpenditure[];
  // State expenditure data
  stateExpenditureAllData: StateExpenditure[];
  // State revenue data
  stateRevenueAllData: StateRevenue[];

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
  financialReports: {},
  processedReports: {},
  processedReportDistrictId: null,
  perPupilExpenditureAllData: [],
  statePerPupilExpenditureAllData: [],
  stateExpenditureAllData: [],
  stateRevenueAllData: [],
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

// Async thunk for fetching entry types
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

// Async thunk for fetching fund types
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

// Async thunk for fetching financial report for a specific year
export const fetchFinancialReports = createAsyncThunk(
  'finance/fetchFinancialReport',
  async ({ 
    districtId
  }: { 
    districtId: string; 
  }, { rejectWithValue, getState, dispatch }) => {
    try {
      // Ensure entry types and fund types are loaded first
      await ensureTypesLoaded(getState() as RootState, dispatch);
      
      // Fetch the financial report for the specified year
      const reportData = await financeApi.getFinanceData(districtId);
      
      return { reportData };
    } catch (error) {
      return rejectWithValue(handleApiError(error, `Failed to fetch financial report`));
    }
  }
);

// Async thunk for fetching per pupil expenditure data
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

// Async thunk for fetching state average per pupil expenditure data
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
      // Don't specify year parameter to get all data
      const statePerPupilData = await financeApi.getPerPupilExpendituresForState(year, forceRefresh);
      return statePerPupilData;
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch state average per pupil expenditure data'));
    }
  }
);

// Async thunk for fetching state expenditure data
export const fetchStateExpenditures = createAsyncThunk(
  'finance/fetchStateExpenditures',
  async ({ 
    year,
    forceRefresh = false
  }: { 
    year?: string;
    forceRefresh?: boolean;
  }, { rejectWithValue }) => {
    try {
      // Don't specify year parameter to get all data
      const stateExpenditureData = await financeApi.getStateExpenditures(year, forceRefresh);
      return stateExpenditureData;
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch state expenditure data'));
    }
  }
);


// Async thunk for fetching state revenue data
export const fetchStateRevenue = createAsyncThunk(
  'finance/fetchStateRevenue',
  async ({ 
    year,
    revenueEntryTypeId,
    forceRefresh = false
  }: { 
    year?: string;
    revenueEntryTypeId?: string;
    forceRefresh?: boolean;
  }, { rejectWithValue }) => {
    try {
      // Don't specify year parameter to get all data
      const stateRevenueData = await financeApi.getStateRevenue(year, revenueEntryTypeId, forceRefresh);
      return stateRevenueData;
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch state revenue data'));
    }
  }
);

// Helper to ensure entry types and fund types are loaded
export const ensureTypesLoaded = async (state: RootState, dispatch: any) => {
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

// Create the finance slice
export const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    // Add a reducer to clear finance state when district changes
    clearFinanceState: (state) => {
      // Reset district-specific data but keep entry types and fund types
      state.financialReports = {};
      state.processedReports = {};
      state.processedReportDistrictId = null;
      state.perPupilExpenditureAllData = [];
      state.error = null;
      // Don't reset statePerPupilExpenditureAllData as it's not district specific
      // Don't reset stateExpenditureAllData as it's not district specific
      // Don't reset loading state as it will be managed by subsequent fetch actions
    }
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
      .addCase(fetchFinancialReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinancialReports.fulfilled, (state, action) => {
        const { reportData } = action.payload;
        
        if (reportData && Array.isArray(reportData)) {
          // Store the district ID from the first report
          state.processedReportDistrictId = reportData[0].doe_form.district_id;
          // Process each report in the array
          reportData.forEach(report => {
            if (report && report.doe_form && report.doe_form.year) {
              const year = report.doe_form.year.toString();
              
              // Store the raw report data
              state.financialReports[year] = report;
              
              // Process the report data and store the processed version
              state.processedReports[year] = processReport(report, state);
            }
          });
        }
        
        state.loading = false;
      })
      .addCase(fetchFinancialReports.rejected, (state, action) => {
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
      })
      
      // Handle fetchStateExpenditures
      .addCase(fetchStateExpenditures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStateExpenditures.fulfilled, (state, action) => {
        // API returns an array with objects containing state expenditure data
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.stateExpenditureAllData = action.payload;
        } else {
          state.stateExpenditureAllData = [];
        }
        state.loading = false;
      })
      .addCase(fetchStateExpenditures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchStateRevenue
      .addCase(fetchStateRevenue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStateRevenue.fulfilled, (state, action) => {
        // API returns an array with objects containing state revenue data
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.stateRevenueAllData = action.payload;
        } else {
          state.stateRevenueAllData = [];
        }
        state.loading = false;
      })
      .addCase(fetchStateRevenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export the new action
export const { clearFinanceState } = financeSlice.actions;

// Helper to get total for financial items
const calculateTotal = (items: FinancialItem[]): number => {
  return items.reduce((sum, item) => sum + item.value, 0);
};

// Filter balance sheet items by asset type (assets or liabilities)
const filterBalanceItems = (items: BalanceSheet[], isAsset: boolean): BalanceSheet[] => {
  return items.filter(item => {
    const superCategoryId = item.entry_type.category?.super_category?.id;
    return isAsset 
      ? (superCategoryId === 1 || superCategoryId === 3) // Assets
      : (superCategoryId === 2); // Liabilities
  });
};

// Export selectors
export const selectFinanceLoading = (state: RootState) => state.finance.loading;
export const selectFinanceError = (state: RootState) => state.finance.error;

export const selectFinancialReports = (state: RootState) => state.finance.processedReports;

export const selectBalanceEntryTypes = (state: RootState) => state.finance.balanceEntryTypes;
export const selectRevenueEntryTypes = (state: RootState) => state.finance.revenueEntryTypes;
export const selectExpenditureEntryTypes = (state: RootState) => state.finance.expenditureEntryTypes;
export const selectBalanceFundTypes = (state: RootState) => state.finance.balanceFundTypes;
export const selectRevenueFundTypes = (state: RootState) => state.finance.revenueFundTypes;
export const selectExpenditureFundTypes = (state: RootState) => state.finance.expenditureFundTypes;
export const selectEntryTypesLoaded = (state: RootState) => state.finance.entryTypesLoaded;
export const selectFundTypesLoaded = (state: RootState) => state.finance.fundTypesLoaded;
export const selectPerPupilExpenditureAllData = (state: RootState) => state.finance.perPupilExpenditureAllData;
export const selectStatePerPupilExpenditureAllData = (state: RootState) => state.finance.statePerPupilExpenditureAllData;
export const selectProcessedReportDistrictId = (state: RootState) => state.finance.processedReportDistrictId;
export const selectStateExpenditureAllData = (state: RootState) => state.finance.stateExpenditureAllData;
export const selectStateRevenueAllData = (state: RootState) => state.finance.stateRevenueAllData;
export const selectTotalExpendituresByYear = (state: RootState, year: string) => {
  const report = state.finance.processedReports[year];
  if (!report) return 0;
  return calculateTotal(report.expenditures);
};

export const selectTotalRevenuesByYear = (state: RootState, year: string) => {
  const report = state.finance.processedReports[year];
  if (!report) return 0;
  return calculateTotal(report.revenues);
};

export const selectTotalAssetsByYear = (state: RootState, year: string) => {
  const report = state.finance.processedReports[year];
  if (!report) return 0;
  return calculateTotal(filterBalanceItems(report.balance_sheets, true));
};

export const selectTotalLiabilitiesByYear = (state: RootState, year: string) => {
  const report = state.finance.processedReports[year];
  if (!report) return 0;
  return calculateTotal(filterBalanceItems(report.balance_sheets, false));
};

// Per Pupil Expenditure Selectors
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

// State Expenditure Selectors
export const selectLatestStateExpenditureDetails = (state: RootState) => {
  const allData = state.finance.stateExpenditureAllData;
  if (!allData || allData.length === 0) return null;
  
  // Find the entry with the highest year value
  return allData.reduce((latest, current) => {
    return current.year > latest.year ? current : latest;
  }, allData[0]);
};

export const selectStateExpenditureByYear = (state: RootState, year: number) => {
  const allData = state.finance.stateExpenditureAllData;
  if (!allData || allData.length === 0) return null;
  
  // Find the entry matching the requested year
  return allData.find(item => item.year === year) || null;
};

// State Revenue Selectors
export const selectLatestStateRevenueDetails = (state: RootState) => {
  const allData = state.finance.stateRevenueAllData;
  if (!allData || allData.length === 0) return null;

  // Find the entry with the highest year value
  return allData.reduce((latest, current) => {
    return current.year > latest.year ? current : latest;
  }, allData[0]);
};

export const selectStateRevenueByYear = (state: RootState, year: number) => {
  const allData = state.finance.stateRevenueAllData;
  if (!allData || allData.length === 0) return null;

  // Find the entry matching the requested year
  return allData.find(item => item.year === year) || null;
};

// Export reducer
export default financeSlice.reducer; 
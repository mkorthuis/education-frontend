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
    forceRefresh = false 
  }: { 
    districtId: string; 
    year?: string; 
    forceRefresh?: boolean 
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
      
      return await financeApi.getFinanceData(districtId, year, forceRefresh);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch financial report'));
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
        state.currentFinancialReport = action.payload;
        
        // Process the raw data to include full entry type and fund type objects
        if (action.payload) {
          // Create lookup maps for all entry types and fund types
          const balanceEntryTypeMap = new Map<number, EntryType>();
          const revenueEntryTypeMap = new Map<number, EntryType>();
          const expenditureEntryTypeMap = new Map<number, EntryType>();
          
          const balanceFundTypeMap = new Map<number, FundType>();
          const revenueFundTypeMap = new Map<number, FundType>();
          const expenditureFundTypeMap = new Map<number, FundType>();
          
          // Populate maps
          state.balanceEntryTypes.forEach(entry => balanceEntryTypeMap.set(entry.id, entry));
          state.revenueEntryTypes.forEach(entry => revenueEntryTypeMap.set(entry.id, entry));
          state.expenditureEntryTypes.forEach(entry => expenditureEntryTypeMap.set(entry.id, entry));
          
          state.balanceFundTypes.forEach(fund => balanceFundTypeMap.set(fund.id, fund));
          state.revenueFundTypes.forEach(fund => revenueFundTypeMap.set(fund.id, fund));
          state.expenditureFundTypes.forEach(fund => expenditureFundTypeMap.set(fund.id, fund));
          
          // Process each type of financial data
          const processedBalanceSheets = processFinancialItems(
            action.payload.balance_sheets || [],
            balanceEntryTypeMap,
            balanceFundTypeMap
          );
          
          const processedRevenues = processFinancialItems(
            action.payload.revenues || [],
            revenueEntryTypeMap,
            revenueFundTypeMap
          );
          
          const processedExpenditures = processFinancialItems(
            action.payload.expenditures || [],
            expenditureEntryTypeMap,
            expenditureFundTypeMap
          );
          
          // Store processed data
          state.processedReport = {
            balance_sheets: processedBalanceSheets as BalanceSheet[],
            revenues: processedRevenues as Revenue[],
            expenditures: processedExpenditures as Expenditure[]
          };
        }
        
        state.loading = false;
      })
      .addCase(fetchFinancialReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearFinancialData } = financeSlice.actions;

// Basic selectors
export const selectBalanceEntryTypes = (state: RootState) => state.finance.balanceEntryTypes;
export const selectRevenueEntryTypes = (state: RootState) => state.finance.revenueEntryTypes;
export const selectExpenditureEntryTypes = (state: RootState) => state.finance.expenditureEntryTypes;
export const selectBalanceFundTypes = (state: RootState) => state.finance.balanceFundTypes;
export const selectRevenueFundTypes = (state: RootState) => state.finance.revenueFundTypes;
export const selectExpenditureFundTypes = (state: RootState) => state.finance.expenditureFundTypes;
export const selectCurrentFinancialReport = (state: RootState) => state.finance.currentFinancialReport;
export const selectProcessedReport = (state: RootState) => state.finance.processedReport;
export const selectFinanceLoading = (state: RootState) => state.finance.loading;
export const selectFinanceError = (state: RootState) => state.finance.error;
export const selectEntryTypesLoaded = (state: RootState) => state.finance.entryTypesLoaded;
export const selectFundTypesLoaded = (state: RootState) => state.finance.fundTypesLoaded;

// Generic function to group and process financial items by a specific field
const processFinancialItemsByField = <T extends FinancialItem>(
  items: T[] | undefined,
  fieldExtractor: (item: T) => string
) => {
  if (!items || items.length === 0) return [];

  // Group by field and sum values
  const groupMap = new Map<string, number>();
  
  items.forEach((item: T) => {
    const fieldValue = fieldExtractor(item);
    const currentSum = groupMap.get(fieldValue) || 0;
    groupMap.set(fieldValue, currentSum + item.value);
  });

  // Calculate total for percentages
  const total = Array.from(groupMap.values()).reduce((sum, value) => sum + value, 0);

  // Convert to array and sort by value descending
  return Array.from(groupMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      percentage: (value / total) * 100
    }))
    .sort((a, b) => b.value - a.value);
};

// Process selectors for expenditures
export const selectExpendituresByEntryType = (state: RootState) => {
  return processFinancialItemsByField(
    state.finance.processedReport?.expenditures,
    (item) => item.entry_type.name
  );
};

export const selectExpendituresByFundType = (state: RootState) => {
  return processFinancialItemsByField(
    state.finance.processedReport?.expenditures,
    (item) => item.fund_type.state_name
  );
};

// Process selectors for revenues
export const selectRevenuesByEntryType = (state: RootState) => {
  return processFinancialItemsByField(
    state.finance.processedReport?.revenues,
    (item) => item.entry_type.name
  );
};

export const selectRevenuesByFundType = (state: RootState) => {
  return processFinancialItemsByField(
    state.finance.processedReport?.revenues,
    (item) => item.fund_type.state_name
  );
};

// Process selectors for balance sheets
export const selectBalanceSheetsByEntryType = (state: RootState) => {
  return processFinancialItemsByField(
    state.finance.processedReport?.balance_sheets,
    (item) => item.entry_type.name
  );
};

export const selectBalanceSheetsByFundType = (state: RootState) => {
  return processFinancialItemsByField(
    state.finance.processedReport?.balance_sheets,
    (item) => item.fund_type.state_name
  );
};

// Total amounts selectors
export const selectTotalExpenditures = (state: RootState) => {
  if (!state.finance.processedReport?.expenditures) return 0;
  
  return state.finance.processedReport.expenditures.reduce(
    (total, exp) => total + exp.value, 0
  );
};

export const selectTotalRevenues = (state: RootState) => {
  if (!state.finance.processedReport?.revenues) return 0;
  
  return state.finance.processedReport.revenues.reduce(
    (total, rev) => total + rev.value, 0
  );
};

export const selectTotalBalanceSheets = (state: RootState) => {
  if (!state.finance.processedReport?.balance_sheets) return 0;
  
  return state.finance.processedReport.balance_sheets.reduce(
    (total, bal) => total + bal.value, 0
  );
};

export default financeSlice.reducer; 
import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder, AsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { financeApi } from '@/services/api/endpoints/finances';
import { FISCAL_YEAR } from '@/utils/environment';
import { LoadingState, retryFailedLoads, resetFailedStatuses } from '@/store/utils/loadingState';
import { handleApiError } from '@/store/utils/apiError';

// ================ TYPE DEFINITIONS ================

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

export interface FundType {
  id: number;
  state_name: string;
  state_id: string;
}

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

export interface StateExpenditureRollup {
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

export interface StateADM {
  year: number;
  elementary: number;
  middle: number;
  high: number;
  total: number;
}

export interface StateRevenue {
  id: number;
  entry_type_id: number;
  year: number;
  value: number;
}

export interface StateExpenditure {
  id: number;
  entry_type_id: number;
  year: number;
  value: number;
}

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

export interface ADM {
  id: number;
  elementary: number;
  middle: number;
  high: number;
  total: number;
}

// Type aliases for semantic clarity
export interface ExpenditureRaw extends FinancialItemRaw {}
export interface RevenueRaw extends FinancialItemRaw {}
export interface BalanceSheetRaw extends FinancialItemRaw {}

export interface Expenditure extends FinancialItem {}
export interface Revenue extends FinancialItem {}
export interface BalanceSheet extends FinancialItem {}

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
  adm: ADM;
}

export interface ProcessedReport {
  balance_sheets: BalanceSheet[];
  revenues: Revenue[];
  expenditures: Expenditure[];
  adm: ADM;
}

// ================ STATE INTERFACE ================

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
  processedReportDistrictId: number | null;
  // Request id of the latest fetchFinancialReports call; responses from older calls are ignored
  reportsRequestId: string | null;

  // Per pupil expenditure data
  perPupilExpenditureAllData: PerPupilExpenditure[];
  statePerPupilExpenditureAllData: PerPupilExpenditure[];
  
  // State expenditure data
  stateExpenditureRollupData: StateExpenditureRollup[];
  stateRevenueAllData: StateRevenue[];
  stateExpenditureAllData: StateExpenditure[];
  stateADMData: StateADM[];

  // Adjustments
  adjustForInflation: boolean;

  // Status
  loadingStates: {
    entryTypes: LoadingState;
    fundTypes: LoadingState;
    financialReports: LoadingState;
    perPupilExpenditure: LoadingState;
    statePerPupilExpenditure: LoadingState;
    stateExpenditureRollups: LoadingState;
    stateRevenue: LoadingState;
    stateExpenditure: LoadingState;
    stateADM: LoadingState;
  };
  entryTypesLoaded: boolean;
  fundTypesLoaded: boolean;
  error: string | null;
}

// ================ INITIAL STATE ================

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
  reportsRequestId: null,
  perPupilExpenditureAllData: [],
  statePerPupilExpenditureAllData: [],
  stateExpenditureRollupData: [],
  stateRevenueAllData: [],
  stateExpenditureAllData: [],
  stateADMData: [],
  adjustForInflation: false,
  loadingStates: {
    entryTypes: LoadingState.IDLE,
    fundTypes: LoadingState.IDLE,
    financialReports: LoadingState.IDLE,
    perPupilExpenditure: LoadingState.IDLE,
    statePerPupilExpenditure: LoadingState.IDLE,
    stateExpenditureRollups: LoadingState.IDLE,
    stateRevenue: LoadingState.IDLE,
    stateExpenditure: LoadingState.IDLE,
    stateADM: LoadingState.IDLE,
  },
  entryTypesLoaded: false,
  fundTypesLoaded: false,
  error: null,
};

// ================ HELPER FUNCTIONS ================

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
    ) as Expenditure[],
    adm: report.adm
  };
};

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

// Helper to get total for financial items
const calculateTotal = (items: FinancialItem[]): number => {
  return items.reduce((sum, item) => sum + item.value, 0);
};

// State fields filled by the single-slot array fetches
type ArrayField =
  | 'perPupilExpenditureAllData'
  | 'statePerPupilExpenditureAllData'
  | 'stateExpenditureRollupData'
  | 'stateRevenueAllData'
  | 'stateExpenditureAllData'
  | 'stateADMData';

// Reducers for one single-slot array fetch. Pending clears the shared error field; fulfilled stores the
// payload only when it is a non-empty array (anything else becomes a new empty array); rejected sets the
// shared error field.
const addArrayFetchCases = (
  builder: ActionReducerMapBuilder<FinanceState>,
  thunk: AsyncThunk<any, any, any>,
  loadingKey: keyof FinanceState['loadingStates'],
  dataField: ArrayField
) => {
  builder
    .addCase(thunk.pending, (state) => {
      state.loadingStates[loadingKey] = LoadingState.LOADING;
      state.error = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      if (Array.isArray(action.payload) && action.payload.length > 0) {
        state[dataField] = action.payload;
      } else {
        state[dataField] = [];
      }
      state.loadingStates[loadingKey] = LoadingState.SUCCEEDED;
    })
    .addCase(thunk.rejected, (state, action) => {
      state.loadingStates[loadingKey] = LoadingState.FAILED;
      state.error = action.payload as string;
    });
};

// ================ ASYNC THUNKS ================

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
    districtId: number; 
  }, { rejectWithValue, getState, dispatch }) => {
    try {
      // Ensure entry types and fund types are loaded first
      await ensureTypesLoaded(getState() as RootState, dispatch);
      
      // Fetch the financial report for the specified year using the new API signature
      const reportData = await financeApi.getFinanceData({
        district_id: districtId
      });
      
      return { reportData };
    } catch (error) {
      return rejectWithValue(handleApiError(error, `Failed to fetch financial report`));
    }
  }
);

// Single-slot array fetch shared by the per pupil and state data thunks. The `params` mapper is annotated
// with the thunk's argument type and destructures the argument's first field. It runs before the try, so an
// undefined argument rejects with a TypeError naming that field and nothing is logged.
const createArrayFetch = <Arg extends { forceRefresh?: boolean }, Options>(typePrefix: string, config: {
  // Options object literal in the API's query order (the URL, and so the axios cache key, follows it)
  params: (arg: Arg) => Options;
  request: (options: Options, forceRefresh: boolean) => Promise<any>;
  errorMessage: string;
}) => createAsyncThunk(
  typePrefix,
  async (arg: Arg, { rejectWithValue }) => {
    const options = config.params(arg);
    const { forceRefresh = false } = arg;
    try {
      return await config.request(options, forceRefresh);
    } catch (error) {
      return rejectWithValue(handleApiError(error, config.errorMessage));
    }
  }
);

// Async thunk for fetching per pupil expenditure data
export const fetchPerPupilExpenditure = createArrayFetch('finance/fetchPerPupilExpenditure', {
  params: ({ districtId, year }: { districtId: number; year?: string; forceRefresh?: boolean; }) => ({ district_id: districtId, year }),
  request: (options, forceRefresh) => financeApi.getPerPupilExpendituresForDistrict(options, forceRefresh),
  errorMessage: 'Failed to fetch per pupil expenditure data',
});

// Async thunk for fetching state average per pupil expenditure data
export const fetchStatePerPupilExpenditure = createArrayFetch('finance/fetchStatePerPupilExpenditure', {
  params: ({ year }: { year?: string; forceRefresh?: boolean; }) => ({ year }),
  request: (options, forceRefresh) => financeApi.getPerPupilExpendituresForState(options, forceRefresh),
  errorMessage: 'Failed to fetch state average per pupil expenditure data',
});

// Async thunk for fetching state expenditure data
export const fetchStateExpenditureRollups = createArrayFetch('finance/fetchStateExpenditureRollups', {
  params: ({ year }: { year?: string; forceRefresh?: boolean; }) => ({ year }),
  request: (options, forceRefresh) => financeApi.getStateExpenditureRollups(options, forceRefresh),
  // Same message as fetchStateExpenditure, kept
  errorMessage: 'Failed to fetch state expenditure data',
});

// Async thunk for fetching state revenue data
export const fetchStateRevenue = createArrayFetch('finance/fetchStateRevenue', {
  params: ({ year, revenueEntryTypeId }: { year?: string; revenueEntryTypeId?: string; forceRefresh?: boolean; }) => ({ year, revenue_entry_type_id: revenueEntryTypeId }),
  request: (options, forceRefresh) => financeApi.getStateRevenue(options, forceRefresh),
  errorMessage: 'Failed to fetch state revenue data',
});

// Async thunk for fetching state expenditure data
export const fetchStateExpenditure = createArrayFetch('finance/fetchStateExpenditure', {
  params: ({ year, expenditureEntryTypeId }: { year?: string; expenditureEntryTypeId?: string; forceRefresh?: boolean; }) => ({ year, expenditure_entry_type_id: expenditureEntryTypeId }),
  request: (options, forceRefresh) => financeApi.getStateExpenditure(options, forceRefresh),
  errorMessage: 'Failed to fetch state expenditure data',
});

// Async thunk for fetching state ADM data
export const fetchStateADM = createArrayFetch('finance/fetchStateADM', {
  params: ({ year }: { year?: string; forceRefresh?: boolean; }) => ({ year }),
  request: (options, forceRefresh) => financeApi.getStateADM(options, forceRefresh),
  errorMessage: 'Failed to fetch state ADM data',
});

// ================ SLICE DEFINITION ================

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
      // Don't reset stateExpenditureRollupsData as it's not district specific
      // Don't reset stateADMData as it's not district specific
    },
    // Add a reducer to toggle inflation adjustment
    toggleInflationAdjustment: (state) => {
      state.adjustForInflation = !state.adjustForInflation;
    },
    setInflationAdjustment: (state, action: PayloadAction<boolean>) => {
      state.adjustForInflation = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchEntryTypes
      .addCase(fetchEntryTypes.pending, (state) => {
        state.loadingStates.entryTypes = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(fetchEntryTypes.fulfilled, (state, action) => {
        state.balanceEntryTypes = action.payload.balance_entry_types ?? [];
        state.revenueEntryTypes = action.payload.revenue_entry_types ?? [];
        state.expenditureEntryTypes = action.payload.expenditure_entry_types ?? [];
        state.entryTypesLoaded = true;
        state.loadingStates.entryTypes = LoadingState.SUCCEEDED;
      })
      .addCase(fetchEntryTypes.rejected, (state, action) => {
        state.loadingStates.entryTypes = LoadingState.FAILED;
        state.error = action.payload as string;
      })
      
      // Handle fetchFundTypes
      .addCase(fetchFundTypes.pending, (state) => {
        state.loadingStates.fundTypes = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(fetchFundTypes.fulfilled, (state, action) => {
        state.balanceFundTypes = action.payload.balance_fund_types;
        state.revenueFundTypes = action.payload.revenue_fund_types;
        state.expenditureFundTypes = action.payload.expenditure_fund_types;
        state.fundTypesLoaded = true;
        state.loadingStates.fundTypes = LoadingState.SUCCEEDED;
      })
      .addCase(fetchFundTypes.rejected, (state, action) => {
        state.loadingStates.fundTypes = LoadingState.FAILED;
        state.error = action.payload as string;
      })
      
      // Handle fetchFinancialReport
      .addCase(fetchFinancialReports.pending, (state, action) => {
        state.reportsRequestId = action.meta.requestId;
        state.loadingStates.financialReports = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(fetchFinancialReports.fulfilled, (state, action) => {
        // Ignore a response for a district the user has already moved away from
        if (action.meta.requestId !== state.reportsRequestId) return;

        const { reportData } = action.payload;

        if (reportData && Array.isArray(reportData)) {
          // Store the district ID from the first report (or the requested one if there are none)
          state.processedReportDistrictId = reportData[0]?.doe_form?.district_id ?? action.meta.arg.districtId;
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
        
        state.loadingStates.financialReports = LoadingState.SUCCEEDED;
      })
      .addCase(fetchFinancialReports.rejected, (state, action) => {
        if (action.meta.requestId !== state.reportsRequestId) return;
        state.loadingStates.financialReports = LoadingState.FAILED;
        state.error = action.payload as string;
      });

    addArrayFetchCases(builder, fetchPerPupilExpenditure, 'perPupilExpenditure', 'perPupilExpenditureAllData');
    addArrayFetchCases(builder, fetchStatePerPupilExpenditure, 'statePerPupilExpenditure', 'statePerPupilExpenditureAllData');
    addArrayFetchCases(builder, fetchStateExpenditureRollups, 'stateExpenditureRollups', 'stateExpenditureRollupData');
    addArrayFetchCases(builder, fetchStateRevenue, 'stateRevenue', 'stateRevenueAllData');
    addArrayFetchCases(builder, fetchStateExpenditure, 'stateExpenditure', 'stateExpenditureAllData');
    addArrayFetchCases(builder, fetchStateADM, 'stateADM', 'stateADMData');

    // Retry on a page's load error: failed requests go back to IDLE so the page requests them again
    builder.addCase(retryFailedLoads, (state) => {
      resetFailedStatuses(state.loadingStates);
    });
  },
});

// ================ EXPORTS ================

// Export actions
export const { 
  clearFinanceState, 
  toggleInflationAdjustment,
  setInflationAdjustment
} = financeSlice.actions;

// ================ SELECTORS ================

// Check if any data is currently loading
export const selectAnyFinanceLoading = (state: RootState) => {
  const loadingStates = state.finance.loadingStates;
  return Object.values(loadingStates).some(loadingState => loadingState === LoadingState.LOADING);
};

// Error selector
export const selectFinanceError = (state: RootState) => state.finance.error;

// Entry and fund types selectors
export const selectRevenueEntryTypes = (state: RootState) => state.finance.revenueEntryTypes;
export const selectExpenditureEntryTypes = (state: RootState) => state.finance.expenditureEntryTypes;
export const selectEntryTypesLoaded = (state: RootState) => state.finance.entryTypesLoaded;

// Financial reports selectors
export const selectFinancialReports = (state: RootState) => state.finance.processedReports;
export const selectProcessedReportDistrictId = (state: RootState) => state.finance.processedReportDistrictId;

// Per pupil expenditure selectors
export const selectPerPupilExpenditureAllData = (state: RootState) => state.finance.perPupilExpenditureAllData;
export const selectStatePerPupilExpenditureAllData = (state: RootState) => state.finance.statePerPupilExpenditureAllData;

// State data selectors
export const selectStateRevenueAllData = (state: RootState) => state.finance.stateRevenueAllData;

// Total calculations selectors
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

// Latest entry by year (the first one wins on ties), or null when there is no data
const latestByYear = <T extends { year: number }>(allData: T[]) => {
  if (!allData || allData.length === 0) return null;
  
  // Find the entry with the highest year value
  return allData.reduce((latest, current) => {
    return current.year > latest.year ? current : latest;
  }, allData[0]);
};

// Entry matching the requested year, or null when there is none
const findByYear = <T extends { year: number }>(allData: T[], year: number) => {
  if (!allData || allData.length === 0) return null;
  
  // Find the entry matching the requested year
  return allData.find(item => item.year === year) || null;
};

// Per Pupil Expenditure Selectors
export const selectLatestPerPupilExpenditureDetails = (state: RootState) => latestByYear(state.finance.perPupilExpenditureAllData);
export const selectLatestStatePerPupilExpenditureDetails = (state: RootState) => latestByYear(state.finance.statePerPupilExpenditureAllData);

// Per Pupil Expenditure Selectors by Year
export const selectPerPupilExpenditureByYear = (state: RootState, year: number) => findByYear(state.finance.perPupilExpenditureAllData, year);
export const selectStatePerPupilExpenditureByYear = (state: RootState, year: number) => findByYear(state.finance.statePerPupilExpenditureAllData, year);

// State Expenditure Selectors
export const selectLatestStateExpenditureRollupDetails = (state: RootState) => latestByYear(state.finance.stateExpenditureRollupData);
export const selectStateExpenditureRollupsByYear = (state: RootState, year: number) => findByYear(state.finance.stateExpenditureRollupData, year);

// State Revenue Selectors
export const selectLatestStateRevenueDetails = (state: RootState) => {
  const allData = state.finance.stateRevenueAllData;
  if (!allData || allData.length === 0) return [];
  // Find all entries for the current fiscal year
  return allData.filter(item => item.year === parseInt(FISCAL_YEAR));
};

// State Expenditure Selectors
export const selectLatestStateExpenditureDetails = (state: RootState) => {
  const allData = state.finance.stateExpenditureAllData;
  if (!allData || allData.length === 0) return [];
  
  // Find all entries for the current fiscal year
  return allData.filter(item => item.year === parseInt(FISCAL_YEAR));
};

// State ADM Selectors
export const selectLatestStateADM = (state: RootState) => latestByYear(state.finance.stateADMData);

// Inflation adjustment selector
export const selectAdjustForInflation = (state: RootState) => state.finance.adjustForInflation;

// Export reducer
export default financeSlice.reducer; 
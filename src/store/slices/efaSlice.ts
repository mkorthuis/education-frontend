import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { efaApi } from '@/services/api/endpoints/efa';
import { createSelector } from '@reduxjs/toolkit';

export enum LoadingState {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed'
}

// Parameter interfaces
export interface BaseEfaParams {
    year?: number | null;
    forceRefresh?: boolean;
}

export interface EfaEntryParams extends BaseEfaParams {
    district_id?: number | null;
    town_id?: number | null;
}

export interface EfaStateEntryParams extends BaseEfaParams {
    entry_type_id?: number | null;
}

// Data interfaces
export interface EfaEntryTypeData {
    id: number;
    name: string;
    description: string;
    year: number;
    value: number;
}

export interface EfaEntryData {
    id: number;
    town_id: number;
    year: number;
    entry_type_id: number;
    value: number;
    date_created: string;
    date_updated: string;
}

export interface EfaStateEntryData {
    year: number;
    entry_type_id: number;
    value: number;
}

// Type definitions
export type EfaCategory = 'entries' | 'stateEntries';
export type EfaTypeCategory = 'entryTypes';

// State interface
interface EfaState {
    // Loading statuses
    dataLoadingStatus: Record<EfaCategory, Record<string, LoadingState>>;
    typeLoadingStatus: Record<EfaTypeCategory, LoadingState>;
    
    // Data storage
    data: {
        entries: Record<string, EfaEntryData[]>;
        stateEntries: Record<string, EfaStateEntryData[]>;
    }
    
    // Types/metadata
    entryTypes: EfaEntryTypeData[];
}

// Initial state
const initialState: EfaState = {
    dataLoadingStatus: {
        entries: {},
        stateEntries: {}
    },
    typeLoadingStatus: {
        entryTypes: LoadingState.IDLE
    },
    data: {
        entries: {},
        stateEntries: {}
    },
    entryTypes: []
}

// Create options key helper function
const createOptionsKey = (params: Record<string, any>): string => {
    const sortedParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    
    const keyString = sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
    return keyString || '_default';
};

// Async thunks
export const fetchEfaEntryTypes = createAsyncThunk(
    'efa/fetchEfaEntryTypes',
    async (params: BaseEfaParams = {}, { rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const data = await efaApi.getEfaEntryTypes(options, forceRefresh);
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchEfaEntries = createAsyncThunk(
    'efa/fetchEfaEntries',
    async (params: EfaEntryParams = {}, { getState, dispatch, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            
            // Now we can uncomment this since we've added the reducer to the store
            const efaState = (getState() as RootState).efa;
            if (efaState.typeLoadingStatus.entryTypes === LoadingState.IDLE && efaState.entryTypes.length === 0) {
                await dispatch(fetchEfaEntryTypes({})).unwrap();
            }
            
            const key = createOptionsKey(options);
            const data = await efaApi.getEfaEntries(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchEfaStateEntries = createAsyncThunk(
    'efa/fetchEfaStateEntries',
    async (params: EfaStateEntryParams = {}, { getState, dispatch, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            
            // Ensure entry types are loaded first if needed
            const efaState = (getState() as RootState).efa;
            if (efaState.typeLoadingStatus.entryTypes === LoadingState.IDLE && efaState.entryTypes.length === 0) {
                await dispatch(fetchEfaEntryTypes({})).unwrap();
            }
            
            const key = createOptionsKey(options);
            const data = await efaApi.getEfaStateEntries(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Create the slice
export const efaSlice = createSlice({
    name: 'efa',
    initialState,
    reducers: {
        clearEfaData: (state) => initialState,
    },
    extraReducers: (builder) => {
        // Entry Types
        builder
            .addCase(fetchEfaEntryTypes.pending, (state) => {
                state.typeLoadingStatus.entryTypes = LoadingState.LOADING;
            })
            .addCase(fetchEfaEntryTypes.fulfilled, (state, action) => {
                state.entryTypes = action.payload;
                state.typeLoadingStatus.entryTypes = LoadingState.SUCCEEDED;
            })
            .addCase(fetchEfaEntryTypes.rejected, (state) => {
                state.typeLoadingStatus.entryTypes = LoadingState.FAILED;
            })
            
        // EFA Entries
            .addCase(fetchEfaEntries.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.dataLoadingStatus.entries[key] = LoadingState.LOADING;
            })
            .addCase(fetchEfaEntries.fulfilled, (state, action) => {
                state.data.entries[action.payload.key] = action.payload.data;
                state.dataLoadingStatus.entries[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchEfaEntries.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.dataLoadingStatus.entries[key] = LoadingState.FAILED;
            })
            
        // EFA State Entries
            .addCase(fetchEfaStateEntries.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.dataLoadingStatus.stateEntries[key] = LoadingState.LOADING;
            })
            .addCase(fetchEfaStateEntries.fulfilled, (state, action) => {
                state.data.stateEntries[action.payload.key] = action.payload.data;
                state.dataLoadingStatus.stateEntries[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchEfaStateEntries.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.dataLoadingStatus.stateEntries[key] = LoadingState.FAILED;
            });
    }
});

// Export actions
export const { clearEfaData } = efaSlice.actions;

// Selectors
export const selectEfaEntryTypesLoadingStatus = (state: RootState) => 
    state.efa.typeLoadingStatus.entryTypes;

export const selectEfaEntriesLoadingStatus = (state: RootState, params: EfaEntryParams) => {
    const key = createOptionsKey({ ...params });
    return state.efa.dataLoadingStatus.entries[key] || LoadingState.IDLE;
};

export const selectEfaStateEntriesLoadingStatus = (state: RootState, params: EfaStateEntryParams) => {
    const key = createOptionsKey({ ...params });
    return state.efa.dataLoadingStatus.stateEntries[key] || LoadingState.IDLE;
};

export const selectEfaEntryTypes = (state: RootState) => state.efa.entryTypes;

export const selectEfaEntries = createSelector(
    [(state: RootState) => state.efa.data.entries, 
     (_: RootState, params: EfaEntryParams) => {
        const { forceRefresh = false, ...options } = params;
        return createOptionsKey(options);
     }],
    (entriesData, key) => entriesData[key] || []
);

export const selectEfaStateEntries = createSelector(
    [(state: RootState) => state.efa.data.stateEntries, 
     (_: RootState, params: EfaStateEntryParams) => {
        const { forceRefresh = false, ...options } = params;
        return createOptionsKey(options);
     }],
    (stateEntriesData, key) => stateEntriesData[key] || []
);

export default efaSlice.reducer;

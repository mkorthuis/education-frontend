import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { efaApi } from '@/services/api/endpoints/efa';
import { LoadingState } from '@/store/utils/loadingState';
import { createOptionsKeyDropNull } from '@/store/utils/cacheKey';
import { createKeyedThunk, addKeyedCases, prefetchIfIdle, type ThunkHooks } from '@/store/utils/keyedResource';
import { addTypeListCases } from '@/store/utils/typeLists';
import { makeStatusSelector, makeMemoDataSelector } from '@/store/utils/selectors';

export { LoadingState };

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

// Types are fetched first only when IDLE && empty; unwrap() so a types failure aborts the data fetch.
// The gate is synchronous: when it is false nothing is awaited (same-tick dispatches, only the first waits).
const prefetchEntryTypes = ({ getState, dispatch }: ThunkHooks) => {
    const efaState = (getState() as RootState).efa;
    return prefetchIfIdle(efaState.typeLoadingStatus.entryTypes, efaState.entryTypes, () => dispatch(fetchEfaEntryTypes({})));
};

// No slice cache check; null is dropped from the key but still forwarded to the API.
export const fetchEfaEntries = createKeyedThunk<EfaEntryParams, EfaEntryData>('efa/fetchEfaEntries', {
    key: createOptionsKeyDropNull,
    request: (options, forceRefresh) => efaApi.getEfaEntries(options, forceRefresh),
    before: prefetchEntryTypes,
});

export const fetchEfaStateEntries = createKeyedThunk<EfaStateEntryParams, EfaStateEntryData>('efa/fetchEfaStateEntries', {
    key: createOptionsKeyDropNull,
    request: (options, forceRefresh) => efaApi.getEfaStateEntries(options, forceRefresh),
    before: prefetchEntryTypes,
});

// Create the slice
export const efaSlice = createSlice({
    name: 'efa',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Entry Types
        addTypeListCases(builder, fetchEfaEntryTypes, 'entryTypes');

        // EFA Entries
        addKeyedCases(builder, fetchEfaEntries, {
            data: (state) => state.data.entries,
            status: (state) => state.dataLoadingStatus.entries,
            key: createOptionsKeyDropNull,
        });

        // EFA State Entries
        addKeyedCases(builder, fetchEfaStateEntries, {
            data: (state) => state.data.stateEntries,
            status: (state) => state.dataLoadingStatus.stateEntries,
            key: createOptionsKeyDropNull,
        });
    }
});

// Selectors
export const selectEfaEntryTypesLoadingStatus = (state: RootState) => 
    state.efa.typeLoadingStatus.entryTypes;

// Loading selectors: key keeps forceRefresh (as pending does) and undefined params give '_default'
export const selectEfaEntriesLoadingStatus = makeStatusSelector<RootState, EfaEntryParams>((state) => state.efa.dataLoadingStatus.entries, createOptionsKeyDropNull);
export const selectEfaStateEntriesLoadingStatus = makeStatusSelector<RootState, EfaStateEntryParams>((state) => state.efa.dataLoadingStatus.stateEntries, createOptionsKeyDropNull);

export const selectEfaEntryTypes = (state: RootState) => state.efa.entryTypes;

// Data selectors (memoized): key strips forceRefresh; undefined params throw
export const selectEfaEntries = makeMemoDataSelector<RootState, EfaEntryParams, EfaEntryData>((state) => state.efa.data.entries, createOptionsKeyDropNull);
export const selectEfaStateEntries = makeMemoDataSelector<RootState, EfaStateEntryParams, EfaStateEntryData>((state) => state.efa.data.stateEntries, createOptionsKeyDropNull);

export default efaSlice.reducer;

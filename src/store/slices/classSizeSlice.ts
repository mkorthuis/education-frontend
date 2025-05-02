import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { classSizeApi } from '@/services/api/endpoints/classSize';
import { RootState } from '@/store/store';

// ------------------------------
// Loading helpers
// ------------------------------
export enum LoadingState {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed'
}

// ------------------------------
// Query-parameter interfaces
// ------------------------------
export interface BaseClassSizeParams {
    year?: number;
    forceRefresh?: boolean;
}

export interface SchoolClassSizeParams extends BaseClassSizeParams {
    school_id?: number;
    district_id?: number;
}

export interface DistrictClassSizeParams extends BaseClassSizeParams {
    district_id?: number;
}

export interface StateClassSizeParams extends BaseClassSizeParams {}

// ------------------------------
// Response data interfaces
// ------------------------------
interface BaseClassSizeData {
    id: number;
    year: number;
    grades_1_2: number;
    grades_3_4: number;
    grades_5_8: number;
    all_grades: number;
}

export interface SchoolClassSizeData extends BaseClassSizeData {
    school_id: number;
    district_id: number;
}

export interface DistrictClassSizeData extends BaseClassSizeData {
    district_id: number;
}

export interface StateClassSizeData extends BaseClassSizeData {}

// ------------------------------
// Utility for caching keys
// ------------------------------
const createOptionsKey = (params: Record<string, any>): string => {
    const sortedParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    const keyString = sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
    return keyString || '_default';
};

// ------------------------------
// Async thunks
// ------------------------------
export const fetchSchoolClassSizeData = createAsyncThunk(
    'classSize/fetchSchoolClassSizeData',
    async (params: SchoolClassSizeParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).classSize.schoolData[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await classSizeApi.getSchoolClassSizeData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchDistrictClassSizeData = createAsyncThunk(
    'classSize/fetchDistrictClassSizeData',
    async (params: DistrictClassSizeParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).classSize.districtData[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await classSizeApi.getDistrictClassSizeData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchStateClassSizeData = createAsyncThunk(
    'classSize/fetchStateClassSizeData',
    async (params: StateClassSizeParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).classSize.stateData[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await classSizeApi.getStateClassSizeData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// ------------------------------
// State definition
// ------------------------------
interface ClassSizeState {
    // loading status
    schoolDataLoadingStatus: Record<string, LoadingState>;
    districtDataLoadingStatus: Record<string, LoadingState>;
    stateDataLoadingStatus: Record<string, LoadingState>;
    // data
    schoolData: Record<string, SchoolClassSizeData[]>;
    districtData: Record<string, DistrictClassSizeData[]>;
    stateData: Record<string, StateClassSizeData[]>;
}

const initialState: ClassSizeState = {
    schoolDataLoadingStatus: {},
    districtDataLoadingStatus: {},
    stateDataLoadingStatus: {},
    schoolData: {},
    districtData: {},
    stateData: {}
};

// ------------------------------
// Slice
// ------------------------------
export const classSizeSlice = createSlice({
    name: 'classSize',
    initialState,
    reducers: {
        clearClassSize: () => initialState
    },
    extraReducers: (builder) => {
        // School Class Size Data
        builder
            .addCase(fetchSchoolClassSizeData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.schoolDataLoadingStatus[key] = LoadingState.LOADING;
            })
            .addCase(fetchSchoolClassSizeData.fulfilled, (state, action) => {
                state.schoolData[action.payload.key] = action.payload.data;
                state.schoolDataLoadingStatus[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchSchoolClassSizeData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.schoolDataLoadingStatus[key] = LoadingState.FAILED;
            })

            // District Class Size Data
            .addCase(fetchDistrictClassSizeData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus[key] = LoadingState.LOADING;
            })
            .addCase(fetchDistrictClassSizeData.fulfilled, (state, action) => {
                state.districtData[action.payload.key] = action.payload.data;
                state.districtDataLoadingStatus[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchDistrictClassSizeData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus[key] = LoadingState.FAILED;
            })

            // State Class Size Data
            .addCase(fetchStateClassSizeData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus[key] = LoadingState.LOADING;
            })
            .addCase(fetchStateClassSizeData.fulfilled, (state, action) => {
                state.stateData[action.payload.key] = action.payload.data;
                state.stateDataLoadingStatus[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStateClassSizeData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus[key] = LoadingState.FAILED;
            });
    }
});

// ------------------------------
// Actions
// ------------------------------
export const { clearClassSize } = classSizeSlice.actions;

// ------------------------------
// Selectors
// ------------------------------
// Loading status helpers
const selectLoadingStatusHelper = (
    state: RootState,
    category: 'schoolData' | 'districtData' | 'stateData',
    params: BaseClassSizeParams
) => {
    const options = { ...params };
    const key = createOptionsKey(options);
    return state.classSize[`${category}LoadingStatus`][key] || LoadingState.IDLE;
};

// Loading selectors
export const selectSchoolClassSizeLoadingStatus = (state: RootState, params: SchoolClassSizeParams) =>
    selectLoadingStatusHelper(state, 'schoolData', params);
export const selectDistrictClassSizeLoadingStatus = (state: RootState, params: DistrictClassSizeParams) =>
    selectLoadingStatusHelper(state, 'districtData', params);
export const selectStateClassSizeLoadingStatus = (state: RootState, params: StateClassSizeParams) =>
    selectLoadingStatusHelper(state, 'stateData', params);

// Data selectors (memoized)
export const selectSchoolClassSizeData = createSelector(
    [
        (state: RootState) => state.classSize.schoolData,
        (_: RootState, params: SchoolClassSizeParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectDistrictClassSizeData = createSelector(
    [
        (state: RootState) => state.classSize.districtData,
        (_: RootState, params: DistrictClassSizeParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectStateClassSizeData = createSelector(
    [
        (state: RootState) => state.classSize.stateData,
        (_: RootState, params: StateClassSizeParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

// ------------------------------
// Reducer export
// ------------------------------
export default classSizeSlice.reducer; 
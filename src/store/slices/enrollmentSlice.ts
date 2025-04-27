import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { enrollmentApi, TownEnrollmentData, StateTownEnrollmentData } from '@/services/api/endpoints/enrollments';
import { createSelector } from '@reduxjs/toolkit';

export enum LoadingState {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed'
}

// Parameter interfaces
export interface BaseEnrollmentParams {
    year?: number | null;
    forceRefresh?: boolean;
}

export interface TownEnrollmentParams extends BaseEnrollmentParams {
    town_id?: number | null;
    district_id?: number | null;
}

export interface StateTownEnrollmentParams extends BaseEnrollmentParams {
    grade_id?: number | null;
}

// Type definitions
export type EnrollmentCategory = 'townEnrollments' | 'stateTownEnrollments';

// State interface
interface EnrollmentState {
    // Loading statuses
    loadingStatus: Record<EnrollmentCategory, Record<string, LoadingState>>;
    
    // Data storage
    data: {
        townEnrollments: Record<string, TownEnrollmentData[]>;
        stateTownEnrollments: Record<string, StateTownEnrollmentData[]>;
    }
}

// Initial state
const initialState: EnrollmentState = {
    loadingStatus: {
        townEnrollments: {},
        stateTownEnrollments: {}
    },
    data: {
        townEnrollments: {},
        stateTownEnrollments: {}
    }
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
export const fetchTownEnrollment = createAsyncThunk(
    'enrollment/fetchTownEnrollment',
    async (params: TownEnrollmentParams = {}, { rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const data = await enrollmentApi.getTownEnrollment(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchStateTownEnrollment = createAsyncThunk(
    'enrollment/fetchStateTownEnrollment',
    async (params: StateTownEnrollmentParams = {}, { rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const data = await enrollmentApi.getStateTownEnrollment(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Create the slice
export const enrollmentSlice = createSlice({
    name: 'enrollment',
    initialState,
    reducers: {
        clearEnrollmentData: (state) => initialState,
    },
    extraReducers: (builder) => {
        // Town Enrollments
        builder
            .addCase(fetchTownEnrollment.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.loadingStatus.townEnrollments[key] = LoadingState.LOADING;
            })
            .addCase(fetchTownEnrollment.fulfilled, (state, action) => {
                state.data.townEnrollments[action.payload.key] = action.payload.data;
                state.loadingStatus.townEnrollments[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchTownEnrollment.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.loadingStatus.townEnrollments[key] = LoadingState.FAILED;
            })
            
        // State Town Enrollments
            .addCase(fetchStateTownEnrollment.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.loadingStatus.stateTownEnrollments[key] = LoadingState.LOADING;
            })
            .addCase(fetchStateTownEnrollment.fulfilled, (state, action) => {
                state.data.stateTownEnrollments[action.payload.key] = action.payload.data;
                state.loadingStatus.stateTownEnrollments[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStateTownEnrollment.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.loadingStatus.stateTownEnrollments[key] = LoadingState.FAILED;
            });
    }
});

// Export actions
export const { clearEnrollmentData } = enrollmentSlice.actions;

// Selectors
export const selectTownEnrollmentLoadingStatus = (state: RootState, params: TownEnrollmentParams) => {
    const key = createOptionsKey({ ...params });
    return state.enrollment.loadingStatus.townEnrollments[key] || LoadingState.IDLE;
};

export const selectStateTownEnrollmentLoadingStatus = (state: RootState, params: StateTownEnrollmentParams) => {
    const key = createOptionsKey({ ...params });
    return state.enrollment.loadingStatus.stateTownEnrollments[key] || LoadingState.IDLE;
};

export const selectTownEnrollment = createSelector(
    [(state: RootState) => state.enrollment.data.townEnrollments, 
     (_: RootState, params: TownEnrollmentParams) => {
        const { forceRefresh = false, ...options } = params;
        return createOptionsKey(options);
     }],
    (townEnrollmentData, key) => townEnrollmentData[key] || []
);

export const selectStateTownEnrollment = createSelector(
    [(state: RootState) => state.enrollment.data.stateTownEnrollments, 
     (_: RootState, params: StateTownEnrollmentParams) => {
        const { forceRefresh = false, ...options } = params;
        return createOptionsKey(options);
     }],
    (stateTownEnrollmentData, key) => stateTownEnrollmentData[key] || []
);

export default enrollmentSlice.reducer; 
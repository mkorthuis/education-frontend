import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { outcomesApi } from '@/services/api/endpoints/outcomes';
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
// Post-Graduation interfaces
export interface BaseSchoolParams {
    year?: string;
    forceRefresh?: boolean;
    school_id?: number;
    district_id?: number;
    post_graduation_type_id?: number; // for post-grad filter
}

export interface BaseDistrictParams {
    year?: string;
    forceRefresh?: boolean;
    district_id?: number;
    post_graduation_type_id?: number; // for post-grad filter
}

export interface BaseStateParams {
    year?: string;
    forceRefresh?: boolean;
    post_graduation_type_id?: number; // for post-grad filter
}

// Early-Exit interfaces - no post_graduation_type_id
export interface BaseSchoolEarlyExitParams {
    year?: string;
    forceRefresh?: boolean;
    school_id?: number;
    district_id?: number;
}

export interface BaseDistrictEarlyExitParams {
    year?: string;
    forceRefresh?: boolean;
    district_id?: number;
}

export interface BaseStateEarlyExitParams {
    year?: string;
    forceRefresh?: boolean;
}

// Graduation Cohort interfaces
export interface BaseSchoolGraduationCohortParams {
    year?: string;
    forceRefresh?: boolean;
    school_id?: number;
    district_id?: number;
}

export interface BaseDistrictGraduationCohortParams {
    year?: string;
    forceRefresh?: boolean;
    district_id?: number;
}

export interface BaseStateGraduationCohortParams {
    year?: string;
    forceRefresh?: boolean;
}

// ------------------------------
// Response data interfaces
// ------------------------------
export interface PostGraduationType {
    id: number;
    name: string;
    description: string;
}

interface BasePostGraduationOutcomeData {
    id: number;
    year: number;
    value: number;
    post_graduation_type: PostGraduationType;
}
export interface SchoolPostGraduationOutcomeData extends BasePostGraduationOutcomeData {
    school_id: number;
}
export interface DistrictPostGraduationOutcomeData extends BasePostGraduationOutcomeData {
    district_id: number;
}
export interface StatePostGraduationOutcomeData extends BasePostGraduationOutcomeData {}

export interface BaseEarlyExitData {
    id: number;
    year: number;
    adjusted_fall_enrollment: number;
    earned_hiset: number;
    enrolled_in_college: number;
    dropped_out: number;
    missing: number;
    annual_early_exit_percentage: number;
    four_year_early_exit_percentage: number;
    annual_dropout_percentage: number;
    four_year_dropout_percentage: number;
}
export interface SchoolEarlyExitData extends BaseEarlyExitData {
    school_id: number;
}
export interface DistrictEarlyExitData extends BaseEarlyExitData {
    district_id: number;
}
export interface StateEarlyExitData extends BaseEarlyExitData {}

export interface BaseGraduationCohortData {
    id: number;
    year: number;
    cohort_size: number;
    graduate: number;
    earned_hiset: number;
    dropped_out: number;
}

export interface SchoolGraduationCohortData extends BaseGraduationCohortData {
    school_id: number;
}

export interface DistrictGraduationCohortData extends BaseGraduationCohortData {
    district_id: number;
}

export interface StateGraduationCohortData extends BaseGraduationCohortData {}

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
export const fetchPostGraduationTypes = createAsyncThunk(
    'outcomes/fetchPostGraduationTypes',
    async (_, { rejectWithValue }) => {
        try {
            const data = await outcomesApi.getPostGraduationTypes();
            return data as PostGraduationType[];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchSchoolPostGraduationOutcomes = createAsyncThunk(
    'outcomes/fetchSchoolPostGraduationOutcomes',
    async (params: BaseSchoolParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).outcomes.schoolData.postGraduation[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await outcomesApi.getSchoolPostGraduationOutcomes(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchDistrictPostGraduationOutcomes = createAsyncThunk(
    'outcomes/fetchDistrictPostGraduationOutcomes',
    async (params: BaseDistrictParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).outcomes.districtData.postGraduation[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await outcomesApi.getDistrictPostGraduationOutcomes(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchStatePostGraduationOutcomes = createAsyncThunk(
    'outcomes/fetchStatePostGraduationOutcomes',
    async (params: BaseStateParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).outcomes.stateData.postGraduation[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await outcomesApi.getStatePostGraduationOutcomes(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchSchoolEarlyExitData = createAsyncThunk(
    'outcomes/fetchSchoolEarlyExitData',
    async (params: BaseSchoolEarlyExitParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).outcomes.schoolData.earlyExit[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await outcomesApi.getSchoolEarlyExitData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchDistrictEarlyExitData = createAsyncThunk(
    'outcomes/fetchDistrictEarlyExitData',
    async (params: BaseDistrictEarlyExitParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).outcomes.districtData.earlyExit[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await outcomesApi.getDistrictEarlyExitData(options, forceRefresh); 
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchStateEarlyExitData = createAsyncThunk(
    'outcomes/fetchStateEarlyExitData',
    async (params: BaseStateEarlyExitParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).outcomes.stateData.earlyExit[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await outcomesApi.getStateEarlyExitData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchSchoolGraduationCohortData = createAsyncThunk(
    'outcomes/fetchSchoolGraduationCohortData',
    async (params: BaseSchoolGraduationCohortParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).outcomes.schoolData.graduationCohort[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await outcomesApi.getSchoolGraduationCohortData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchDistrictGraduationCohortData = createAsyncThunk(
    'outcomes/fetchDistrictGraduationCohortData',
    async (params: BaseDistrictGraduationCohortParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).outcomes.districtData.graduationCohort[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await outcomesApi.getDistrictGraduationCohortData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchStateGraduationCohortData = createAsyncThunk(
    'outcomes/fetchStateGraduationCohortData',
    async (params: BaseStateGraduationCohortParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).outcomes.stateData.graduationCohort[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await outcomesApi.getStateGraduationCohortData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// ------------------------------
// State definition
// ------------------------------
interface OutcomesState {
    // loading status
    typeLoadingStatus: {
        postGraduationTypes: LoadingState;
    };
    schoolDataLoadingStatus: {
        postGraduation: Record<string, LoadingState>;
        earlyExit: Record<string, LoadingState>;
        graduationCohort: Record<string, LoadingState>;
    };
    districtDataLoadingStatus: {
        postGraduation: Record<string, LoadingState>;
        earlyExit: Record<string, LoadingState>;
        graduationCohort: Record<string, LoadingState>;
    };
    stateDataLoadingStatus: {
        postGraduation: Record<string, LoadingState>;
        earlyExit: Record<string, LoadingState>;
        graduationCohort: Record<string, LoadingState>;
    };
    // data
    postGraduationTypes: PostGraduationType[];
    schoolData: {
        postGraduation: Record<string, SchoolPostGraduationOutcomeData[]>;
        earlyExit: Record<string, SchoolEarlyExitData[]>;
        graduationCohort: Record<string, SchoolGraduationCohortData[]>;
    };
    districtData: {
        postGraduation: Record<string, DistrictPostGraduationOutcomeData[]>;
        earlyExit: Record<string, DistrictEarlyExitData[]>;
        graduationCohort: Record<string, DistrictGraduationCohortData[]>;
    };
    stateData: {
        postGraduation: Record<string, StatePostGraduationOutcomeData[]>;
        earlyExit: Record<string, StateEarlyExitData[]>;
        graduationCohort: Record<string, StateGraduationCohortData[]>;
    };
}

const initialState: OutcomesState = {
    typeLoadingStatus: {
        postGraduationTypes: LoadingState.IDLE
    },
    schoolDataLoadingStatus: {
        postGraduation: {},
        earlyExit: {},
        graduationCohort: {}
    },
    districtDataLoadingStatus: {
        postGraduation: {},
        earlyExit: {},
        graduationCohort: {}
    },
    stateDataLoadingStatus: {
        postGraduation: {},
        earlyExit: {},
        graduationCohort: {}
    },
    postGraduationTypes: [],
    schoolData: {
        postGraduation: {},
        earlyExit: {},
        graduationCohort: {}
    },
    stateData: {
        postGraduation: {},
        earlyExit: {},
        graduationCohort: {}
    },
    districtData: {
        postGraduation: {},
        earlyExit: {},
        graduationCohort: {}
    }
};

// ------------------------------
// Slice
// ------------------------------
export const outcomeSlice = createSlice({
    name: 'outcomes',
    initialState,
    reducers: {
        clearOutcomes: () => initialState
    },
    extraReducers: (builder) => {
        // Post-Graduation Types
        builder
            .addCase(fetchPostGraduationTypes.pending, (state) => {
                state.typeLoadingStatus.postGraduationTypes = LoadingState.LOADING;
            })
            .addCase(fetchPostGraduationTypes.fulfilled, (state, action) => {
                state.postGraduationTypes = action.payload;
                state.typeLoadingStatus.postGraduationTypes = LoadingState.SUCCEEDED;
            })
            .addCase(fetchPostGraduationTypes.rejected, (state) => {
                state.typeLoadingStatus.postGraduationTypes = LoadingState.FAILED;
            })

            // School Post-Graduation Outcomes
            .addCase(fetchSchoolPostGraduationOutcomes.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.schoolDataLoadingStatus.postGraduation[key] = LoadingState.LOADING;
            })
            .addCase(fetchSchoolPostGraduationOutcomes.fulfilled, (state, action) => {
                state.schoolData.postGraduation[action.payload.key] = action.payload.data;
                state.schoolDataLoadingStatus.postGraduation[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchSchoolPostGraduationOutcomes.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.schoolDataLoadingStatus.postGraduation[key] = LoadingState.FAILED;
            })

            // District Post-Graduation Outcomes
            .addCase(fetchDistrictPostGraduationOutcomes.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.postGraduation[key] = LoadingState.LOADING;
            })
            .addCase(fetchDistrictPostGraduationOutcomes.fulfilled, (state, action) => {
                state.districtData.postGraduation[action.payload.key] = action.payload.data;
                state.districtDataLoadingStatus.postGraduation[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchDistrictPostGraduationOutcomes.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.postGraduation[key] = LoadingState.FAILED;
            })
            
            // State Post-Graduation Outcomes
            .addCase(fetchStatePostGraduationOutcomes.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.postGraduation[key] = LoadingState.LOADING;
            })
            .addCase(fetchStatePostGraduationOutcomes.fulfilled, (state, action) => {
                state.stateData.postGraduation[action.payload.key] = action.payload.data;
                state.stateDataLoadingStatus.postGraduation[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStatePostGraduationOutcomes.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.postGraduation[key] = LoadingState.FAILED;
            })

            // School Early-Exit
            .addCase(fetchSchoolEarlyExitData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.schoolDataLoadingStatus.earlyExit[key] = LoadingState.LOADING;
            })
            .addCase(fetchSchoolEarlyExitData.fulfilled, (state, action) => {
                state.schoolData.earlyExit[action.payload.key] = action.payload.data;
                state.schoolDataLoadingStatus.earlyExit[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchSchoolEarlyExitData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.schoolDataLoadingStatus.earlyExit[key] = LoadingState.FAILED;
            })

            // District Early-Exit
            .addCase(fetchDistrictEarlyExitData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.earlyExit[key] = LoadingState.LOADING;
            })
            .addCase(fetchDistrictEarlyExitData.fulfilled, (state, action) => {
                state.districtData.earlyExit[action.payload.key] = action.payload.data;
                state.districtDataLoadingStatus.earlyExit[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchDistrictEarlyExitData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.earlyExit[key] = LoadingState.FAILED;
            })


            // State Early-Exit
            .addCase(fetchStateEarlyExitData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.earlyExit[key] = LoadingState.LOADING;
            })
            .addCase(fetchStateEarlyExitData.fulfilled, (state, action) => {
                state.stateData.earlyExit[action.payload.key] = action.payload.data;
                state.stateDataLoadingStatus.earlyExit[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStateEarlyExitData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.earlyExit[key] = LoadingState.FAILED;
            })

            // School Graduation Cohort
            .addCase(fetchSchoolGraduationCohortData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.schoolDataLoadingStatus.graduationCohort[key] = LoadingState.LOADING;
            })
            .addCase(fetchSchoolGraduationCohortData.fulfilled, (state, action) => {
                state.schoolData.graduationCohort[action.payload.key] = action.payload.data;
                state.schoolDataLoadingStatus.graduationCohort[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchSchoolGraduationCohortData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.schoolDataLoadingStatus.graduationCohort[key] = LoadingState.FAILED;
            })

            // District Graduation Cohort
            .addCase(fetchDistrictGraduationCohortData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.graduationCohort[key] = LoadingState.LOADING;
            })
            .addCase(fetchDistrictGraduationCohortData.fulfilled, (state, action) => {
                state.districtData.graduationCohort[action.payload.key] = action.payload.data;
                state.districtDataLoadingStatus.graduationCohort[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchDistrictGraduationCohortData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.graduationCohort[key] = LoadingState.FAILED;
            })

            // State Graduation Cohort
            .addCase(fetchStateGraduationCohortData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.graduationCohort[key] = LoadingState.LOADING;
            })
            .addCase(fetchStateGraduationCohortData.fulfilled, (state, action) => {
                state.stateData.graduationCohort[action.payload.key] = action.payload.data;
                state.stateDataLoadingStatus.graduationCohort[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStateGraduationCohortData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.graduationCohort[key] = LoadingState.FAILED;
            });
    }
});

// ------------------------------
// Actions
// ------------------------------
export const { clearOutcomes } = outcomeSlice.actions;

// ------------------------------
// Selectors
// ------------------------------
export const selectPostGraduationTypes = (state: RootState) => state.outcomes.postGraduationTypes;
export const selectPostGraduationTypesLoadingStatus = (state: RootState) => state.outcomes.typeLoadingStatus.postGraduationTypes;

// Loading status helpers
const selectLoadingStatusHelper = (
    state: RootState,
    category: 'postGraduation' | 'earlyExit' | 'graduationCohort',
    params: BaseSchoolParams | BaseStateParams | BaseSchoolGraduationCohortParams | BaseDistrictGraduationCohortParams | BaseStateGraduationCohortParams,
    level: 'school' | 'district' | 'state'
) => {
    const options = { ...params };
    const key = createOptionsKey(options);
    return level === 'school'
        ? state.outcomes.schoolDataLoadingStatus[category][key] || LoadingState.IDLE
        : level === 'district'
            ? state.outcomes.districtDataLoadingStatus[category][key] || LoadingState.IDLE
            : state.outcomes.stateDataLoadingStatus[category][key] || LoadingState.IDLE;
};

// Loading selectors
export const selectSchoolPostGraduationLoadingStatus = (state: RootState, params: BaseSchoolParams) =>
    selectLoadingStatusHelper(state, 'postGraduation', params, 'school');
export const selectDistrictPostGraduationLoadingStatus = (state: RootState, params: BaseDistrictParams) =>
    selectLoadingStatusHelper(state, 'postGraduation', params, 'district');
export const selectStatePostGraduationLoadingStatus = (state: RootState, params: BaseStateParams) =>
    selectLoadingStatusHelper(state, 'postGraduation', params, 'state');

// Loading status helpers for early exit
const selectEarlyExitLoadingStatusHelper = (
    state: RootState,
    params: BaseSchoolEarlyExitParams | BaseDistrictEarlyExitParams | BaseStateEarlyExitParams,
    level: 'school' | 'district' | 'state'
) => {
    const options = { ...params };
    const key = createOptionsKey(options);
    return level === 'school'
        ? state.outcomes.schoolDataLoadingStatus.earlyExit[key] || LoadingState.IDLE
        : level === 'district'
            ? state.outcomes.districtDataLoadingStatus.earlyExit[key] || LoadingState.IDLE
            : state.outcomes.stateDataLoadingStatus.earlyExit[key] || LoadingState.IDLE;
};

// Updated early exit loading selectors
export const selectSchoolEarlyExitLoadingStatus = (state: RootState, params: BaseSchoolEarlyExitParams) =>
    selectEarlyExitLoadingStatusHelper(state, params, 'school');
export const selectDistrictEarlyExitLoadingStatus = (state: RootState, params: BaseDistrictEarlyExitParams) =>
    selectEarlyExitLoadingStatusHelper(state, params, 'district');
export const selectStateEarlyExitLoadingStatus = (state: RootState, params: BaseStateEarlyExitParams) =>
    selectEarlyExitLoadingStatusHelper(state, params, 'state');

// Loading status helpers for graduation cohort
export const selectSchoolGraduationCohortLoadingStatus = (state: RootState, params: BaseSchoolGraduationCohortParams) =>
    selectLoadingStatusHelper(state, 'graduationCohort', params, 'school');
export const selectDistrictGraduationCohortLoadingStatus = (state: RootState, params: BaseDistrictGraduationCohortParams) =>
    selectLoadingStatusHelper(state, 'graduationCohort', params, 'district');
export const selectStateGraduationCohortLoadingStatus = (state: RootState, params: BaseStateGraduationCohortParams) =>
    selectLoadingStatusHelper(state, 'graduationCohort', params, 'state');

// Data selectors (memoized)
export const selectSchoolPostGraduationData = createSelector(
    [
        (state: RootState) => state.outcomes.schoolData.postGraduation,
        (_: RootState, params: BaseSchoolParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectDistrictPostGraduationData = createSelector(
    [
        (state: RootState) => state.outcomes.districtData.postGraduation,
        (_: RootState, params: BaseDistrictParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectStatePostGraduationData = createSelector(
    [
        (state: RootState) => state.outcomes.stateData.postGraduation,
        (_: RootState, params: BaseStateParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectSchoolEarlyExitData = createSelector(
    [
        (state: RootState) => state.outcomes.schoolData.earlyExit,
        (_: RootState, params: BaseSchoolEarlyExitParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectDistrictEarlyExitData = createSelector(
    [
        (state: RootState) => state.outcomes.districtData.earlyExit,
        (_: RootState, params: BaseDistrictEarlyExitParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectStateEarlyExitData = createSelector(
    [
        (state: RootState) => state.outcomes.stateData.earlyExit,
        (_: RootState, params: BaseStateEarlyExitParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectSchoolGraduationCohortData = createSelector(
    [
        (state: RootState) => state.outcomes.schoolData.graduationCohort,
        (_: RootState, params: BaseSchoolGraduationCohortParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectDistrictGraduationCohortData = createSelector(
    [
        (state: RootState) => state.outcomes.districtData.graduationCohort,
        (_: RootState, params: BaseDistrictGraduationCohortParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectStateGraduationCohortData = createSelector(
    [
        (state: RootState) => state.outcomes.stateData.graduationCohort,
        (_: RootState, params: BaseStateGraduationCohortParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

// ------------------------------
// Reducer export
// ------------------------------
export default outcomeSlice.reducer; 
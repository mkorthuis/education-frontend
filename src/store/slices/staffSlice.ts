import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { staffApi } from '@/services/api/endpoints/staff';
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
// Staff interfaces
export interface BaseStaffParams {
    year?: number;
    forceRefresh?: boolean;
    staff_type_id?: number;
}

export interface DistrictStaffParams extends BaseStaffParams {
    district_id?: number;
}

export interface StateStaffParams extends BaseStaffParams {}

// Teacher Education interfaces
export interface BaseTeacherEducationParams {
    year?: number;
    forceRefresh?: boolean;
    teacher_type_id?: number;
}

export interface DistrictTeacherEducationParams extends BaseTeacherEducationParams {
    district_id?: number;
}

export interface StateTeacherEducationParams extends BaseTeacherEducationParams {}

// Teacher Salary Band interfaces
export interface BaseTeacherSalaryBandParams {
    year?: number;
    forceRefresh?: boolean;
    salary_band_type_id?: number;
}

export interface DistrictTeacherSalaryBandParams extends BaseTeacherSalaryBandParams {
    district_id?: number;
}

export interface StateTeacherSalaryBandParams extends BaseTeacherSalaryBandParams {}

// Teacher Average Salary interfaces
export interface BaseTeacherAverageSalaryParams {
    year?: number;
    forceRefresh?: boolean;
}

export interface DistrictTeacherAverageSalaryParams extends BaseTeacherAverageSalaryParams {
    district_id?: number;
}

export interface StateTeacherAverageSalaryParams extends BaseTeacherAverageSalaryParams {}

// ------------------------------
// Response data interfaces
// ------------------------------
export interface StaffType {
    id: number;
    name: string;
}

export interface TeacherEducationType {
    id: number;
    name: string;
}

export interface TeacherSalaryBandType {
    id: number;
    name: string;
    description: string;
}

interface BaseStaffData {
    id: number;
    year: number;
    value: number;
    staff_type: StaffType;
}

export interface DistrictStaffData extends BaseStaffData {
    district_id: number;
}

export interface StateStaffData extends BaseStaffData {}

interface BaseTeacherEducationData {
    id: number;
    year: number;
    value: number;
    teacher_type: TeacherEducationType;
}

export interface DistrictTeacherEducationData extends BaseTeacherEducationData {
    district_id: number;
}

export interface StateTeacherEducationData extends BaseTeacherEducationData {}

interface BaseTeacherAverageSalaryData {
    id: number;
    year: number;
    salary: number;
}

export interface DistrictTeacherAverageSalaryData extends BaseTeacherAverageSalaryData {
    district_id: number;
}

export interface StateTeacherAverageSalaryData extends BaseTeacherAverageSalaryData {}

interface BaseTeacherSalaryBandData {
    id: number;
    year: number;
    min_salary: number;
    max_salary: number;
    steps: number;
    salary_band_type: TeacherSalaryBandType;
}

export interface DistrictTeacherSalaryBandData extends BaseTeacherSalaryBandData {
    district_id: number;
}

export interface StateTeacherSalaryBandData extends BaseTeacherSalaryBandData {}

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
export const fetchStaffTypes = createAsyncThunk(
    'staff/fetchStaffTypes',
    async (_, { rejectWithValue }) => {
        try {
            const data = await staffApi.getStaffTypes();
            return data as StaffType[];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchTeacherEducationTypes = createAsyncThunk(
    'staff/fetchTeacherEducationTypes',
    async (_, { rejectWithValue }) => {
        try {
            const data = await staffApi.getTeacherEducationTypes();
            return data as TeacherEducationType[];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchTeacherSalaryBandTypes = createAsyncThunk(
    'staff/fetchTeacherSalaryBandTypes',
    async (_, { rejectWithValue }) => {
        try {
            const data = await staffApi.getTeacherSalaryBandTypes();
            return data as TeacherSalaryBandType[];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchDistrictStaffData = createAsyncThunk(
    'staff/fetchDistrictStaffData',
    async (params: DistrictStaffParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).staff.districtData.staff[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await staffApi.getDistrictStaffData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchStateStaffData = createAsyncThunk(
    'staff/fetchStateStaffData',
    async (params: StateStaffParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).staff.stateData.staff[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await staffApi.getStateStaffData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchDistrictTeacherEducationData = createAsyncThunk(
    'staff/fetchDistrictTeacherEducationData',
    async (params: DistrictTeacherEducationParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).staff.districtData.teacherEducation[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await staffApi.getDistrictTeacherEducationData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchStateTeacherEducationData = createAsyncThunk(
    'staff/fetchStateTeacherEducationData',
    async (params: StateTeacherEducationParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).staff.stateData.teacherEducation[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await staffApi.getStateTeacherEducationData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchDistrictTeacherAverageSalary = createAsyncThunk(
    'staff/fetchDistrictTeacherAverageSalary',
    async (params: DistrictTeacherAverageSalaryParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).staff.districtData.teacherAverageSalary[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await staffApi.getDistrictTeacherAverageSalary(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchStateTeacherAverageSalary = createAsyncThunk(
    'staff/fetchStateTeacherAverageSalary',
    async (params: StateTeacherAverageSalaryParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).staff.stateData.teacherAverageSalary[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await staffApi.getStateTeacherAverageSalary(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchDistrictTeacherSalaryBandData = createAsyncThunk(
    'staff/fetchDistrictTeacherSalaryBandData',
    async (params: DistrictTeacherSalaryBandParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).staff.districtData.teacherSalaryBand[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await staffApi.getDistrictTeacherSalaryBandData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchStateTeacherSalaryBandData = createAsyncThunk(
    'staff/fetchStateTeacherSalaryBandData',
    async (params: StateTeacherSalaryBandParams = {}, { getState, rejectWithValue }) => {
        try {
            const { forceRefresh = false, ...options } = params;
            const key = createOptionsKey(options);
            const cached = (getState() as RootState).staff.stateData.teacherSalaryBand[key];
            if (cached && !forceRefresh) {
                return { key, data: cached };
            }
            const data = await staffApi.getStateTeacherSalaryBandData(options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// ------------------------------
// State definition
// ------------------------------
interface StaffState {
    // loading status
    typeLoadingStatus: {
        staffTypes: LoadingState;
        teacherEducationTypes: LoadingState;
        teacherSalaryBandTypes: LoadingState;
    };
    districtDataLoadingStatus: {
        staff: Record<string, LoadingState>;
        teacherEducation: Record<string, LoadingState>;
        teacherAverageSalary: Record<string, LoadingState>;
        teacherSalaryBand: Record<string, LoadingState>;
    };
    stateDataLoadingStatus: {
        staff: Record<string, LoadingState>;
        teacherEducation: Record<string, LoadingState>;
        teacherAverageSalary: Record<string, LoadingState>;
        teacherSalaryBand: Record<string, LoadingState>;
    };
    // data
    staffTypes: StaffType[];
    teacherEducationTypes: TeacherEducationType[];
    teacherSalaryBandTypes: TeacherSalaryBandType[];
    districtData: {
        staff: Record<string, DistrictStaffData[]>;
        teacherEducation: Record<string, DistrictTeacherEducationData[]>;
        teacherAverageSalary: Record<string, DistrictTeacherAverageSalaryData[]>;
        teacherSalaryBand: Record<string, DistrictTeacherSalaryBandData[]>;
    };
    stateData: {
        staff: Record<string, StateStaffData[]>;
        teacherEducation: Record<string, StateTeacherEducationData[]>;
        teacherAverageSalary: Record<string, StateTeacherAverageSalaryData[]>;
        teacherSalaryBand: Record<string, StateTeacherSalaryBandData[]>;
    };
}

const initialState: StaffState = {
    typeLoadingStatus: {
        staffTypes: LoadingState.IDLE,
        teacherEducationTypes: LoadingState.IDLE,
        teacherSalaryBandTypes: LoadingState.IDLE
    },
    districtDataLoadingStatus: {
        staff: {},
        teacherEducation: {},
        teacherAverageSalary: {},
        teacherSalaryBand: {}
    },
    stateDataLoadingStatus: {
        staff: {},
        teacherEducation: {},
        teacherAverageSalary: {},
        teacherSalaryBand: {}
    },
    staffTypes: [],
    teacherEducationTypes: [],
    teacherSalaryBandTypes: [],
    districtData: {
        staff: {},
        teacherEducation: {},
        teacherAverageSalary: {},
        teacherSalaryBand: {}
    },
    stateData: {
        staff: {},
        teacherEducation: {},
        teacherAverageSalary: {},
        teacherSalaryBand: {}
    }
};

// ------------------------------
// Slice
// ------------------------------
export const staffSlice = createSlice({
    name: 'staff',
    initialState,
    reducers: {
        clearStaff: () => initialState
    },
    extraReducers: (builder) => {
        // Staff Types
        builder
            .addCase(fetchStaffTypes.pending, (state) => {
                state.typeLoadingStatus.staffTypes = LoadingState.LOADING;
            })
            .addCase(fetchStaffTypes.fulfilled, (state, action) => {
                state.staffTypes = action.payload;
                state.typeLoadingStatus.staffTypes = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStaffTypes.rejected, (state) => {
                state.typeLoadingStatus.staffTypes = LoadingState.FAILED;
            })

            // Teacher Education Types
            .addCase(fetchTeacherEducationTypes.pending, (state) => {
                state.typeLoadingStatus.teacherEducationTypes = LoadingState.LOADING;
            })
            .addCase(fetchTeacherEducationTypes.fulfilled, (state, action) => {
                state.teacherEducationTypes = action.payload;
                state.typeLoadingStatus.teacherEducationTypes = LoadingState.SUCCEEDED;
            })
            .addCase(fetchTeacherEducationTypes.rejected, (state) => {
                state.typeLoadingStatus.teacherEducationTypes = LoadingState.FAILED;
            })

            // Teacher Salary Band Types
            .addCase(fetchTeacherSalaryBandTypes.pending, (state) => {
                state.typeLoadingStatus.teacherSalaryBandTypes = LoadingState.LOADING;
            })
            .addCase(fetchTeacherSalaryBandTypes.fulfilled, (state, action) => {
                state.teacherSalaryBandTypes = action.payload;
                state.typeLoadingStatus.teacherSalaryBandTypes = LoadingState.SUCCEEDED;
            })
            .addCase(fetchTeacherSalaryBandTypes.rejected, (state) => {
                state.typeLoadingStatus.teacherSalaryBandTypes = LoadingState.FAILED;
            })

            // District Staff Data
            .addCase(fetchDistrictStaffData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.staff[key] = LoadingState.LOADING;
            })
            .addCase(fetchDistrictStaffData.fulfilled, (state, action) => {
                state.districtData.staff[action.payload.key] = action.payload.data;
                state.districtDataLoadingStatus.staff[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchDistrictStaffData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.staff[key] = LoadingState.FAILED;
            })

            // State Staff Data
            .addCase(fetchStateStaffData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.staff[key] = LoadingState.LOADING;
            })
            .addCase(fetchStateStaffData.fulfilled, (state, action) => {
                state.stateData.staff[action.payload.key] = action.payload.data;
                state.stateDataLoadingStatus.staff[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStateStaffData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.staff[key] = LoadingState.FAILED;
            })

            // District Teacher Education Data
            .addCase(fetchDistrictTeacherEducationData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.teacherEducation[key] = LoadingState.LOADING;
            })
            .addCase(fetchDistrictTeacherEducationData.fulfilled, (state, action) => {
                state.districtData.teacherEducation[action.payload.key] = action.payload.data;
                state.districtDataLoadingStatus.teacherEducation[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchDistrictTeacherEducationData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.teacherEducation[key] = LoadingState.FAILED;
            })

            // State Teacher Education Data
            .addCase(fetchStateTeacherEducationData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.teacherEducation[key] = LoadingState.LOADING;
            })
            .addCase(fetchStateTeacherEducationData.fulfilled, (state, action) => {
                state.stateData.teacherEducation[action.payload.key] = action.payload.data;
                state.stateDataLoadingStatus.teacherEducation[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStateTeacherEducationData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.teacherEducation[key] = LoadingState.FAILED;
            })

            // District Teacher Average Salary
            .addCase(fetchDistrictTeacherAverageSalary.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.teacherAverageSalary[key] = LoadingState.LOADING;
            })
            .addCase(fetchDistrictTeacherAverageSalary.fulfilled, (state, action) => {
                state.districtData.teacherAverageSalary[action.payload.key] = action.payload.data;
                state.districtDataLoadingStatus.teacherAverageSalary[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchDistrictTeacherAverageSalary.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.teacherAverageSalary[key] = LoadingState.FAILED;
            })

            // State Teacher Average Salary
            .addCase(fetchStateTeacherAverageSalary.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.teacherAverageSalary[key] = LoadingState.LOADING;
            })
            .addCase(fetchStateTeacherAverageSalary.fulfilled, (state, action) => {
                state.stateData.teacherAverageSalary[action.payload.key] = action.payload.data;
                state.stateDataLoadingStatus.teacherAverageSalary[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStateTeacherAverageSalary.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.teacherAverageSalary[key] = LoadingState.FAILED;
            })

            // District Teacher Salary Band Data
            .addCase(fetchDistrictTeacherSalaryBandData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.teacherSalaryBand[key] = LoadingState.LOADING;
            })
            .addCase(fetchDistrictTeacherSalaryBandData.fulfilled, (state, action) => {
                state.districtData.teacherSalaryBand[action.payload.key] = action.payload.data;
                state.districtDataLoadingStatus.teacherSalaryBand[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchDistrictTeacherSalaryBandData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.districtDataLoadingStatus.teacherSalaryBand[key] = LoadingState.FAILED;
            })

            // State Teacher Salary Band Data
            .addCase(fetchStateTeacherSalaryBandData.pending, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.teacherSalaryBand[key] = LoadingState.LOADING;
            })
            .addCase(fetchStateTeacherSalaryBandData.fulfilled, (state, action) => {
                state.stateData.teacherSalaryBand[action.payload.key] = action.payload.data;
                state.stateDataLoadingStatus.teacherSalaryBand[action.payload.key] = LoadingState.SUCCEEDED;
            })
            .addCase(fetchStateTeacherSalaryBandData.rejected, (state, action) => {
                const key = createOptionsKey(action.meta.arg);
                state.stateDataLoadingStatus.teacherSalaryBand[key] = LoadingState.FAILED;
            });
    }
});

// ------------------------------
// Actions
// ------------------------------
export const { clearStaff } = staffSlice.actions;

// ------------------------------
// Selectors
// ------------------------------
export const selectStaffTypes = (state: RootState) => state.staff.staffTypes;
export const selectTeacherEducationTypes = (state: RootState) => state.staff.teacherEducationTypes;
export const selectTeacherSalaryBandTypes = (state: RootState) => state.staff.teacherSalaryBandTypes;

export const selectStaffTypesLoadingStatus = (state: RootState) => state.staff.typeLoadingStatus.staffTypes;
export const selectTeacherEducationTypesLoadingStatus = (state: RootState) => state.staff.typeLoadingStatus.teacherEducationTypes;
export const selectTeacherSalaryBandTypesLoadingStatus = (state: RootState) => state.staff.typeLoadingStatus.teacherSalaryBandTypes;

// Loading status helpers
const selectLoadingStatusHelper = (
    state: RootState,
    category: 'staff' | 'teacherEducation' | 'teacherAverageSalary' | 'teacherSalaryBand',
    params: BaseStaffParams | BaseTeacherEducationParams | BaseTeacherSalaryBandParams,
    level: 'district' | 'state'
) => {
    const options = { ...params };
    const key = createOptionsKey(options);
    return level === 'district'
        ? state.staff.districtDataLoadingStatus[category][key] || LoadingState.IDLE
        : state.staff.stateDataLoadingStatus[category][key] || LoadingState.IDLE;
};

// Loading selectors
export const selectDistrictStaffLoadingStatus = (state: RootState, params: DistrictStaffParams) =>
    selectLoadingStatusHelper(state, 'staff', params, 'district');
export const selectStateStaffLoadingStatus = (state: RootState, params: StateStaffParams) =>
    selectLoadingStatusHelper(state, 'staff', params, 'state');

export const selectDistrictTeacherEducationLoadingStatus = (state: RootState, params: DistrictTeacherEducationParams) =>
    selectLoadingStatusHelper(state, 'teacherEducation', params, 'district');
export const selectStateTeacherEducationLoadingStatus = (state: RootState, params: StateTeacherEducationParams) =>
    selectLoadingStatusHelper(state, 'teacherEducation', params, 'state');

export const selectDistrictTeacherAverageSalaryLoadingStatus = (state: RootState, params: DistrictTeacherAverageSalaryParams) =>
    selectLoadingStatusHelper(state, 'teacherAverageSalary', params, 'district');
export const selectStateTeacherAverageSalaryLoadingStatus = (state: RootState, params: StateTeacherAverageSalaryParams) =>
    selectLoadingStatusHelper(state, 'teacherAverageSalary', params, 'state');

export const selectDistrictTeacherSalaryBandLoadingStatus = (state: RootState, params: DistrictTeacherSalaryBandParams) =>
    selectLoadingStatusHelper(state, 'teacherSalaryBand', params, 'district');
export const selectStateTeacherSalaryBandLoadingStatus = (state: RootState, params: StateTeacherSalaryBandParams) =>
    selectLoadingStatusHelper(state, 'teacherSalaryBand', params, 'state');

// Data selectors (memoized)
export const selectDistrictStaffData = createSelector(
    [
        (state: RootState) => state.staff.districtData.staff,
        (_: RootState, params: DistrictStaffParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectStateStaffData = createSelector(
    [
        (state: RootState) => state.staff.stateData.staff,
        (_: RootState, params: StateStaffParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectDistrictTeacherEducationData = createSelector(
    [
        (state: RootState) => state.staff.districtData.teacherEducation,
        (_: RootState, params: DistrictTeacherEducationParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectStateTeacherEducationData = createSelector(
    [
        (state: RootState) => state.staff.stateData.teacherEducation,
        (_: RootState, params: StateTeacherEducationParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectDistrictTeacherAverageSalaryData = createSelector(
    [
        (state: RootState) => state.staff.districtData.teacherAverageSalary,
        (_: RootState, params: DistrictTeacherAverageSalaryParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectStateTeacherAverageSalaryData = createSelector(
    [
        (state: RootState) => state.staff.stateData.teacherAverageSalary,
        (_: RootState, params: StateTeacherAverageSalaryParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectDistrictTeacherSalaryBandData = createSelector(
    [
        (state: RootState) => state.staff.districtData.teacherSalaryBand,
        (_: RootState, params: DistrictTeacherSalaryBandParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

export const selectStateTeacherSalaryBandData = createSelector(
    [
        (state: RootState) => state.staff.stateData.teacherSalaryBand,
        (_: RootState, params: StateTeacherSalaryBandParams) => {
            const { forceRefresh = false, ...options } = params;
            return createOptionsKey(options);
        }
    ],
    (data, key) => data[key] || []
);

// ------------------------------
// Reducer export
// ------------------------------
export default staffSlice.reducer; 
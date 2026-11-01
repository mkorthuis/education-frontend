import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { enrollmentApi, TownEnrollmentData, StateTownEnrollmentData, SchoolEnrollmentData } from '@/services/api/endpoints/enrollments';
import { LoadingState } from '@/store/utils/loadingState';
import { createOptionsKeyDropNull } from '@/store/utils/cacheKey';
import { createKeyedThunk, addKeyedCases, needsRequest } from '@/store/utils/keyedResource';
import { makeStatusSelector, makeMemoDataSelector } from '@/store/utils/selectors';

export { LoadingState };

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
export type EnrollmentCategory = 'townEnrollments' | 'stateTownEnrollments' | 'schoolEnrollments';

// State interface
interface EnrollmentState {
    // Loading statuses
    loadingStatus: Record<EnrollmentCategory, Record<string, LoadingState>>;
    
    // Data storage
    data: {
        townEnrollments: Record<string, TownEnrollmentData[]>;
        stateTownEnrollments: Record<string, StateTownEnrollmentData[]>;
        schoolEnrollments: Record<string, SchoolEnrollmentData[]>;
    }
}

// Initial state
const initialState: EnrollmentState = {
    loadingStatus: {
        townEnrollments: {},
        stateTownEnrollments: {},
        schoolEnrollments: {}
    },
    data: {
        townEnrollments: {},
        stateTownEnrollments: {},
        schoolEnrollments: {}
    }
}

// Async thunks
// Null is dropped from the key but still forwarded to the API.
export const fetchTownEnrollment = createKeyedThunk<TownEnrollmentParams, TownEnrollmentData>('enrollment/fetchTownEnrollment', {
    key: createOptionsKeyDropNull,
    status: (getState, key) => (getState() as RootState).enrollment.loadingStatus.townEnrollments[key],
    request: (options, forceRefresh) => enrollmentApi.getTownEnrollment(options, forceRefresh),
});

export const fetchStateTownEnrollment = createKeyedThunk<StateTownEnrollmentParams, StateTownEnrollmentData>('enrollment/fetchStateTownEnrollment', {
    key: createOptionsKeyDropNull,
    status: (getState, key) => (getState() as RootState).enrollment.loadingStatus.stateTownEnrollments[key],
    request: (options, forceRefresh) => enrollmentApi.getStateTownEnrollment(options, forceRefresh),
});

// Hand-written: schoolId is a path param, re-added to the key; no default arg.
export const fetchSchoolEnrollments = createAsyncThunk(
    'enrollment/fetchSchoolEnrollments',
    async (params: { schoolId: number } & BaseEnrollmentParams, { rejectWithValue }) => {
        try {
            const { schoolId, forceRefresh = false, ...options } = params;
            const key = createOptionsKeyDropNull({ schoolId, ...options });
            const data = await enrollmentApi.getSchoolEnrollments(schoolId, options, forceRefresh);
            return { key, data };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    },
    {
        // A key that is already loading or loaded is not requested again unless forceRefresh is set
        condition: (params, { getState }) => {
            const { schoolId, forceRefresh = false, ...options } = params;
            const key = createOptionsKeyDropNull({ schoolId, ...options });
            return forceRefresh || needsRequest((getState() as RootState).enrollment.loadingStatus.schoolEnrollments[key]);
        },
    }
);

// Create the slice
export const enrollmentSlice = createSlice({
    name: 'enrollment',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Town Enrollments
        addKeyedCases(builder, fetchTownEnrollment, {
            data: (state) => state.data.townEnrollments,
            status: (state) => state.loadingStatus.townEnrollments,
            key: createOptionsKeyDropNull,
        });

        // State Town Enrollments
        addKeyedCases(builder, fetchStateTownEnrollment, {
            data: (state) => state.data.stateTownEnrollments,
            status: (state) => state.loadingStatus.stateTownEnrollments,
            key: createOptionsKeyDropNull,
        });

        // School Enrollments
        addKeyedCases(builder, fetchSchoolEnrollments, {
            data: (state) => state.data.schoolEnrollments,
            status: (state) => state.loadingStatus.schoolEnrollments,
            key: createOptionsKeyDropNull,
        });
    }
});

// Selectors
// Loading selectors: key keeps forceRefresh (as pending does) and undefined params give '_default'
export const selectTownEnrollmentLoadingStatus = makeStatusSelector<RootState, TownEnrollmentParams>((state) => state.enrollment.loadingStatus.townEnrollments, createOptionsKeyDropNull);
export const selectStateTownEnrollmentLoadingStatus = makeStatusSelector<RootState, StateTownEnrollmentParams>((state) => state.enrollment.loadingStatus.stateTownEnrollments, createOptionsKeyDropNull);
export const selectSchoolEnrollmentLoadingStatus = makeStatusSelector<RootState, { schoolId: number } & BaseEnrollmentParams>((state) => state.enrollment.loadingStatus.schoolEnrollments, createOptionsKeyDropNull);

// Data selectors (memoized): key strips forceRefresh; undefined params throw
export const selectTownEnrollment = makeMemoDataSelector<RootState, TownEnrollmentParams, TownEnrollmentData>((state) => state.enrollment.data.townEnrollments, createOptionsKeyDropNull);
export const selectStateTownEnrollment = makeMemoDataSelector<RootState, StateTownEnrollmentParams, StateTownEnrollmentData>((state) => state.enrollment.data.stateTownEnrollments, createOptionsKeyDropNull);
export const selectSchoolEnrollment = makeMemoDataSelector<RootState, { schoolId: number } & BaseEnrollmentParams, SchoolEnrollmentData>((state) => state.enrollment.data.schoolEnrollments, createOptionsKeyDropNull);

export default enrollmentSlice.reducer; 
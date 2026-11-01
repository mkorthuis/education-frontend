import { createSlice, type AsyncThunk } from '@reduxjs/toolkit';
import { staffApi } from '@/services/api/endpoints/staff';
import { RootState } from '@/store/store';
import { LoadingState } from '@/store/utils/loadingState';
import { createKeyedThunk, addKeyedCases, type KeyedPayload, type KeyedOptions } from '@/store/utils/keyedResource';
import { createTypeListThunk, addTypeListCases } from '@/store/utils/typeLists';
import { makeStatusSelector, makeMemoDataSelector } from '@/store/utils/selectors';

// ------------------------------
// Loading helpers
// ------------------------------
export { LoadingState };

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
// Async thunks
// ------------------------------
export const fetchStaffTypes = createTypeListThunk<StaffType[]>('staff/fetchStaffTypes', () => staffApi.getStaffTypes(),
    (getState) => (getState() as RootState).staff.typeLoadingStatus.staffTypes);
export const fetchTeacherEducationTypes = createTypeListThunk<TeacherEducationType[]>('staff/fetchTeacherEducationTypes', () => staffApi.getTeacherEducationTypes(),
    (getState) => (getState() as RootState).staff.typeLoadingStatus.teacherEducationTypes);
export const fetchTeacherSalaryBandTypes = createTypeListThunk<TeacherSalaryBandType[]>('staff/fetchTeacherSalaryBandTypes', () => staffApi.getTeacherSalaryBandTypes(),
    (getState) => (getState() as RootState).staff.typeLoadingStatus.teacherSalaryBandTypes);

type StaffLevel = 'district' | 'state';
type StaffCategory = keyof StaffState['districtData'];
type StaffRow<L extends StaffLevel, C extends StaffCategory> = StaffState[`${L}Data`][C][string][number];

// Thunk argument per (level, category): exactly the annotations of the hand-written thunks.
interface StaffParamsMap {
    district: { staff: DistrictStaffParams; teacherEducation: DistrictTeacherEducationParams; teacherAverageSalary: DistrictTeacherAverageSalaryParams; teacherSalaryBand: DistrictTeacherSalaryBandParams };
    state: { staff: StateStaffParams; teacherEducation: StateTeacherEducationParams; teacherAverageSalary: StateTeacherAverageSalaryParams; teacherSalaryBand: StateTeacherSalaryBandParams };
}

// Filled by staffThunk at module evaluation; the extraReducers loop reads it.
const STAFF_THUNKS: Array<{ thunk: AsyncThunk<KeyedPayload<any>, any, any>; level: StaffLevel; category: StaffCategory }> = [];

const staffThunk = <L extends StaffLevel, C extends StaffCategory>(typePrefix: string, level: L, category: C,
    request: (options: KeyedOptions<StaffParamsMap[L][C]>, forceRefresh: boolean) => Promise<any>) => {
    const thunk = createKeyedThunk<StaffParamsMap[L][C], StaffRow<L, C>>(typePrefix, {
        request,
        status: (getState, key) => (getState() as RootState).staff[`${level}DataLoadingStatus`][category][key],
    });
    STAFF_THUNKS.push({ thunk, level, category });
    return thunk;
};

export const fetchDistrictStaffData = staffThunk('staff/fetchDistrictStaffData', 'district', 'staff',
    (options, forceRefresh) => staffApi.getDistrictStaffData(options, forceRefresh));
export const fetchStateStaffData = staffThunk('staff/fetchStateStaffData', 'state', 'staff',
    (options, forceRefresh) => staffApi.getStateStaffData(options, forceRefresh));

export const fetchDistrictTeacherEducationData = staffThunk('staff/fetchDistrictTeacherEducationData', 'district', 'teacherEducation',
    (options, forceRefresh) => staffApi.getDistrictTeacherEducationData(options, forceRefresh));
export const fetchStateTeacherEducationData = staffThunk('staff/fetchStateTeacherEducationData', 'state', 'teacherEducation',
    (options, forceRefresh) => staffApi.getStateTeacherEducationData(options, forceRefresh));

// Thunk and API names have no 'Data' suffix here; the data selectors do.
export const fetchDistrictTeacherAverageSalary = staffThunk('staff/fetchDistrictTeacherAverageSalary', 'district', 'teacherAverageSalary',
    (options, forceRefresh) => staffApi.getDistrictTeacherAverageSalary(options, forceRefresh));
export const fetchStateTeacherAverageSalary = staffThunk('staff/fetchStateTeacherAverageSalary', 'state', 'teacherAverageSalary',
    (options, forceRefresh) => staffApi.getStateTeacherAverageSalary(options, forceRefresh));

export const fetchDistrictTeacherSalaryBandData = staffThunk('staff/fetchDistrictTeacherSalaryBandData', 'district', 'teacherSalaryBand',
    (options, forceRefresh) => staffApi.getDistrictTeacherSalaryBandData(options, forceRefresh));
export const fetchStateTeacherSalaryBandData = staffThunk('staff/fetchStateTeacherSalaryBandData', 'state', 'teacherSalaryBand',
    (options, forceRefresh) => staffApi.getStateTeacherSalaryBandData(options, forceRefresh));

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
        // Staff, Teacher Education and Teacher Salary Band Types
        addTypeListCases(builder, fetchStaffTypes, 'staffTypes');
        addTypeListCases(builder, fetchTeacherEducationTypes, 'teacherEducationTypes');
        addTypeListCases(builder, fetchTeacherSalaryBandTypes, 'teacherSalaryBandTypes');

        // Keyed data: pending/rejected keyed on the raw meta.arg, fulfilled on payload.key
        for (const { thunk, level, category } of STAFF_THUNKS) {
            addKeyedCases(builder, thunk, {
                data: (state) => state[`${level}Data`][category],
                status: (state) => state[`${level}DataLoadingStatus`][category],
            });
        }
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

// Loading selectors: key keeps forceRefresh (as pending does) and undefined params give '_default'
export const selectDistrictStaffLoadingStatus = makeStatusSelector<RootState, DistrictStaffParams>((state) => state.staff.districtDataLoadingStatus.staff);
export const selectStateStaffLoadingStatus = makeStatusSelector<RootState, StateStaffParams>((state) => state.staff.stateDataLoadingStatus.staff);

export const selectDistrictTeacherEducationLoadingStatus = makeStatusSelector<RootState, DistrictTeacherEducationParams>((state) => state.staff.districtDataLoadingStatus.teacherEducation);
export const selectStateTeacherEducationLoadingStatus = makeStatusSelector<RootState, StateTeacherEducationParams>((state) => state.staff.stateDataLoadingStatus.teacherEducation);

export const selectDistrictTeacherAverageSalaryLoadingStatus = makeStatusSelector<RootState, DistrictTeacherAverageSalaryParams>((state) => state.staff.districtDataLoadingStatus.teacherAverageSalary);
export const selectStateTeacherAverageSalaryLoadingStatus = makeStatusSelector<RootState, StateTeacherAverageSalaryParams>((state) => state.staff.stateDataLoadingStatus.teacherAverageSalary);

export const selectDistrictTeacherSalaryBandLoadingStatus = makeStatusSelector<RootState, DistrictTeacherSalaryBandParams>((state) => state.staff.districtDataLoadingStatus.teacherSalaryBand);
export const selectStateTeacherSalaryBandLoadingStatus = makeStatusSelector<RootState, StateTeacherSalaryBandParams>((state) => state.staff.stateDataLoadingStatus.teacherSalaryBand);

// Data selectors (memoized): key strips forceRefresh; undefined params throw
export const selectDistrictStaffData = makeMemoDataSelector<RootState, DistrictStaffParams, DistrictStaffData>((state) => state.staff.districtData.staff);
export const selectStateStaffData = makeMemoDataSelector<RootState, StateStaffParams, StateStaffData>((state) => state.staff.stateData.staff);

export const selectDistrictTeacherEducationData = makeMemoDataSelector<RootState, DistrictTeacherEducationParams, DistrictTeacherEducationData>((state) => state.staff.districtData.teacherEducation);
export const selectStateTeacherEducationData = makeMemoDataSelector<RootState, StateTeacherEducationParams, StateTeacherEducationData>((state) => state.staff.stateData.teacherEducation);

export const selectDistrictTeacherAverageSalaryData = makeMemoDataSelector<RootState, DistrictTeacherAverageSalaryParams, DistrictTeacherAverageSalaryData>((state) => state.staff.districtData.teacherAverageSalary);
export const selectStateTeacherAverageSalaryData = makeMemoDataSelector<RootState, StateTeacherAverageSalaryParams, StateTeacherAverageSalaryData>((state) => state.staff.stateData.teacherAverageSalary);

export const selectDistrictTeacherSalaryBandData = makeMemoDataSelector<RootState, DistrictTeacherSalaryBandParams, DistrictTeacherSalaryBandData>((state) => state.staff.districtData.teacherSalaryBand);
export const selectStateTeacherSalaryBandData = makeMemoDataSelector<RootState, StateTeacherSalaryBandParams, StateTeacherSalaryBandData>((state) => state.staff.stateData.teacherSalaryBand);

// ------------------------------
// Reducer export
// ------------------------------
export default staffSlice.reducer; 
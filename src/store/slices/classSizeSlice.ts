import { createSlice, type AsyncThunk } from '@reduxjs/toolkit';
import { classSizeApi } from '@/services/api/endpoints/classSize';
import { RootState } from '@/store/store';
import { LoadingState } from '@/store/utils/loadingState';
import { createKeyedThunk, addKeyedCases, type KeyedPayload, type KeyedOptions } from '@/store/utils/keyedResource';
import { makeStatusSelector, makeMemoDataSelector } from '@/store/utils/selectors';

// ------------------------------
// Loading helpers
// ------------------------------
export { LoadingState };

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
// Async thunks
// ------------------------------
type ClassSizeLevel = 'school' | 'district' | 'state';
type ClassSizeRow<L extends ClassSizeLevel> = ClassSizeState[`${L}Data`][string][number];

// Thunk argument per level: exactly the annotations of the hand-written thunks.
interface ClassSizeParamsMap {
    school: SchoolClassSizeParams;
    district: DistrictClassSizeParams;
    state: StateClassSizeParams;
}

// Filled by classSizeThunk at module evaluation; the extraReducers loop reads it.
const CLASS_SIZE_THUNKS: Array<{ thunk: AsyncThunk<KeyedPayload<any>, any, any>; level: ClassSizeLevel }> = [];

// Flat buckets (one per level). Every class size thunk checks the slice cache before calling the API ([] is a hit; status still cycles).
const classSizeThunk = <L extends ClassSizeLevel>(typePrefix: string, level: L,
    request: (options: KeyedOptions<ClassSizeParamsMap[L]>, forceRefresh: boolean) => Promise<any>) => {
    const thunk = createKeyedThunk<ClassSizeParamsMap[L], ClassSizeRow<L>>(typePrefix, {
        request,
        cached: (getState, key) => (getState() as RootState).classSize[`${level}Data`][key] as ClassSizeRow<L>[] | undefined,
    });
    CLASS_SIZE_THUNKS.push({ thunk, level });
    return thunk;
};

// No school selectors exist for this thunk.
export const fetchSchoolClassSizeData = classSizeThunk('classSize/fetchSchoolClassSizeData', 'school',
    (options, forceRefresh) => classSizeApi.getSchoolClassSizeData(options, forceRefresh));
export const fetchDistrictClassSizeData = classSizeThunk('classSize/fetchDistrictClassSizeData', 'district',
    (options, forceRefresh) => classSizeApi.getDistrictClassSizeData(options, forceRefresh));
export const fetchStateClassSizeData = classSizeThunk('classSize/fetchStateClassSizeData', 'state',
    (options, forceRefresh) => classSizeApi.getStateClassSizeData(options, forceRefresh));

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
    reducers: {},
    extraReducers: (builder) => {
        // Keyed data: pending/rejected keyed on the raw meta.arg, fulfilled on payload.key
        for (const { thunk, level } of CLASS_SIZE_THUNKS) {
            addKeyedCases(builder, thunk, {
                data: (state) => state[`${level}Data`],
                status: (state) => state[`${level}DataLoadingStatus`],
            });
        }
    }
});

// ------------------------------
// Selectors
// ------------------------------
// Loading selectors: key keeps forceRefresh (as pending does) and undefined params give '_default'
export const selectDistrictClassSizeLoadingStatus = makeStatusSelector<RootState, DistrictClassSizeParams>((state) => state.classSize.districtDataLoadingStatus);
export const selectStateClassSizeLoadingStatus = makeStatusSelector<RootState, StateClassSizeParams>((state) => state.classSize.stateDataLoadingStatus);

// Data selectors (memoized): key strips forceRefresh; undefined params throw
export const selectDistrictClassSizeData = makeMemoDataSelector<RootState, DistrictClassSizeParams, DistrictClassSizeData>((state) => state.classSize.districtData);
export const selectStateClassSizeData = makeMemoDataSelector<RootState, StateClassSizeParams, StateClassSizeData>((state) => state.classSize.stateData);

// ------------------------------
// Reducer export
// ------------------------------
export default classSizeSlice.reducer; 
import { createSlice, type AsyncThunk } from '@reduxjs/toolkit';
import { outcomesApi } from '@/services/api/endpoints/outcomes';
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
// Async thunks
// ------------------------------
export const fetchPostGraduationTypes = createTypeListThunk<PostGraduationType[]>('outcomes/fetchPostGraduationTypes', () => outcomesApi.getPostGraduationTypes(),
    (getState) => (getState() as RootState).outcomes.typeLoadingStatus.postGraduationTypes);

type OutcomeLevel = 'school' | 'district' | 'state';
type OutcomeCategory = keyof OutcomesState['schoolData'];
type OutcomeRow<L extends OutcomeLevel, C extends OutcomeCategory> = OutcomesState[`${L}Data`][C][string][number];

// Thunk argument per (level, category): exactly the annotations of the hand-written thunks.
interface OutcomeParamsMap {
    school: { postGraduation: BaseSchoolParams; earlyExit: BaseSchoolEarlyExitParams; graduationCohort: BaseSchoolGraduationCohortParams };
    district: { postGraduation: BaseDistrictParams; earlyExit: BaseDistrictEarlyExitParams; graduationCohort: BaseDistrictGraduationCohortParams };
    state: { postGraduation: BaseStateParams; earlyExit: BaseStateEarlyExitParams; graduationCohort: BaseStateGraduationCohortParams };
}

// Filled by outcomeThunk at module evaluation; the extraReducers loop reads it.
const OUTCOME_THUNKS: Array<{ thunk: AsyncThunk<KeyedPayload<any>, any, any>; level: OutcomeLevel; category: OutcomeCategory }> = [];

const outcomeThunk = <L extends OutcomeLevel, C extends OutcomeCategory>(typePrefix: string, level: L, category: C,
    request: (options: KeyedOptions<OutcomeParamsMap[L][C]>, forceRefresh: boolean) => Promise<any>) => {
    // Payload rows stay any: EntityOutcomes dispatches a school | district thunk union,
    // which only type-checks while both payload types are compatible.
    const thunk = createKeyedThunk<OutcomeParamsMap[L][C], any>(typePrefix, {
        request,
        status: (getState, key) => (getState() as RootState).outcomes[`${level}DataLoadingStatus`][category][key],
    });
    OUTCOME_THUNKS.push({ thunk, level, category });
    return thunk;
};

// Thunk and API names say 'Outcomes'; the selectors say 'PostGraduation'.
export const fetchSchoolPostGraduationOutcomes = outcomeThunk('outcomes/fetchSchoolPostGraduationOutcomes', 'school', 'postGraduation',
    (options, forceRefresh) => outcomesApi.getSchoolPostGraduationOutcomes(options, forceRefresh));
export const fetchDistrictPostGraduationOutcomes = outcomeThunk('outcomes/fetchDistrictPostGraduationOutcomes', 'district', 'postGraduation',
    (options, forceRefresh) => outcomesApi.getDistrictPostGraduationOutcomes(options, forceRefresh));
export const fetchStatePostGraduationOutcomes = outcomeThunk('outcomes/fetchStatePostGraduationOutcomes', 'state', 'postGraduation',
    (options, forceRefresh) => outcomesApi.getStatePostGraduationOutcomes(options, forceRefresh));

export const fetchSchoolEarlyExitData = outcomeThunk('outcomes/fetchSchoolEarlyExitData', 'school', 'earlyExit',
    (options, forceRefresh) => outcomesApi.getSchoolEarlyExitData(options, forceRefresh));
export const fetchDistrictEarlyExitData = outcomeThunk('outcomes/fetchDistrictEarlyExitData', 'district', 'earlyExit',
    (options, forceRefresh) => outcomesApi.getDistrictEarlyExitData(options, forceRefresh));
export const fetchStateEarlyExitData = outcomeThunk('outcomes/fetchStateEarlyExitData', 'state', 'earlyExit',
    (options, forceRefresh) => outcomesApi.getStateEarlyExitData(options, forceRefresh));

export const fetchSchoolGraduationCohortData = outcomeThunk('outcomes/fetchSchoolGraduationCohortData', 'school', 'graduationCohort',
    (options, forceRefresh) => outcomesApi.getSchoolGraduationCohortData(options, forceRefresh));
export const fetchDistrictGraduationCohortData = outcomeThunk('outcomes/fetchDistrictGraduationCohortData', 'district', 'graduationCohort',
    (options, forceRefresh) => outcomesApi.getDistrictGraduationCohortData(options, forceRefresh));
export const fetchStateGraduationCohortData = outcomeThunk('outcomes/fetchStateGraduationCohortData', 'state', 'graduationCohort',
    (options, forceRefresh) => outcomesApi.getStateGraduationCohortData(options, forceRefresh));

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
    reducers: {},
    extraReducers: (builder) => {
        // Post-Graduation Types
        addTypeListCases(builder, fetchPostGraduationTypes, 'postGraduationTypes');

        // Keyed data: pending/rejected keyed on the raw meta.arg, fulfilled on payload.key
        for (const { thunk, level, category } of OUTCOME_THUNKS) {
            addKeyedCases(builder, thunk, {
                data: (state) => state[`${level}Data`][category],
                status: (state) => state[`${level}DataLoadingStatus`][category],
            });
        }
    }
});

// ------------------------------
// Selectors
// ------------------------------
export const selectPostGraduationTypes = (state: RootState) => state.outcomes.postGraduationTypes;
export const selectPostGraduationTypesLoadingStatus = (state: RootState) => state.outcomes.typeLoadingStatus.postGraduationTypes;

// Loading selectors: key keeps forceRefresh (as pending does) and undefined params give '_default'
export const selectSchoolPostGraduationLoadingStatus = makeStatusSelector<RootState, BaseSchoolParams>((state) => state.outcomes.schoolDataLoadingStatus.postGraduation);
export const selectDistrictPostGraduationLoadingStatus = makeStatusSelector<RootState, BaseDistrictParams>((state) => state.outcomes.districtDataLoadingStatus.postGraduation);
export const selectStatePostGraduationLoadingStatus = makeStatusSelector<RootState, BaseStateParams>((state) => state.outcomes.stateDataLoadingStatus.postGraduation);

export const selectSchoolEarlyExitLoadingStatus = makeStatusSelector<RootState, BaseSchoolEarlyExitParams>((state) => state.outcomes.schoolDataLoadingStatus.earlyExit);
export const selectDistrictEarlyExitLoadingStatus = makeStatusSelector<RootState, BaseDistrictEarlyExitParams>((state) => state.outcomes.districtDataLoadingStatus.earlyExit);
export const selectStateEarlyExitLoadingStatus = makeStatusSelector<RootState, BaseStateEarlyExitParams>((state) => state.outcomes.stateDataLoadingStatus.earlyExit);

export const selectSchoolGraduationCohortLoadingStatus = makeStatusSelector<RootState, BaseSchoolGraduationCohortParams>((state) => state.outcomes.schoolDataLoadingStatus.graduationCohort);
export const selectDistrictGraduationCohortLoadingStatus = makeStatusSelector<RootState, BaseDistrictGraduationCohortParams>((state) => state.outcomes.districtDataLoadingStatus.graduationCohort);
export const selectStateGraduationCohortLoadingStatus = makeStatusSelector<RootState, BaseStateGraduationCohortParams>((state) => state.outcomes.stateDataLoadingStatus.graduationCohort);

// Data selectors (memoized): key strips forceRefresh; undefined params throw
export const selectSchoolPostGraduationData = makeMemoDataSelector<RootState, BaseSchoolParams, SchoolPostGraduationOutcomeData>((state) => state.outcomes.schoolData.postGraduation);
export const selectDistrictPostGraduationData = makeMemoDataSelector<RootState, BaseDistrictParams, DistrictPostGraduationOutcomeData>((state) => state.outcomes.districtData.postGraduation);
export const selectStatePostGraduationData = makeMemoDataSelector<RootState, BaseStateParams, StatePostGraduationOutcomeData>((state) => state.outcomes.stateData.postGraduation);

export const selectSchoolEarlyExitData = makeMemoDataSelector<RootState, BaseSchoolEarlyExitParams, SchoolEarlyExitData>((state) => state.outcomes.schoolData.earlyExit);
export const selectDistrictEarlyExitData = makeMemoDataSelector<RootState, BaseDistrictEarlyExitParams, DistrictEarlyExitData>((state) => state.outcomes.districtData.earlyExit);
export const selectStateEarlyExitData = makeMemoDataSelector<RootState, BaseStateEarlyExitParams, StateEarlyExitData>((state) => state.outcomes.stateData.earlyExit);

export const selectSchoolGraduationCohortData = makeMemoDataSelector<RootState, BaseSchoolGraduationCohortParams, SchoolGraduationCohortData>((state) => state.outcomes.schoolData.graduationCohort);
export const selectDistrictGraduationCohortData = makeMemoDataSelector<RootState, BaseDistrictGraduationCohortParams, DistrictGraduationCohortData>((state) => state.outcomes.districtData.graduationCohort);
export const selectStateGraduationCohortData = makeMemoDataSelector<RootState, BaseStateGraduationCohortParams, StateGraduationCohortData>((state) => state.outcomes.stateData.graduationCohort);

// ------------------------------
// Reducer export
// ------------------------------
export default outcomeSlice.reducer; 

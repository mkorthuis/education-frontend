import { createSlice, PayloadAction, type AsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { safetyApi } from '@/services/api/endpoints/safety';
import { LoadingState } from '@/store/utils/loadingState';
import { createOptionsKey } from '@/store/utils/cacheKey';
import { addKeyedCases, createKeyedThunk, prefetchIfIdle, type KeyedPayload, type KeyedOptions, type ThunkHooks } from '@/store/utils/keyedResource';
import { addTypeListCases, createTypeListThunk } from '@/store/utils/typeLists';
import { makeDataSelector, makeMemoStatusSelector, makeMemoDataSelector } from '@/store/utils/selectors';

export { LoadingState };

export interface BaseSchoolParams {
    year?: string;
    forceRefresh?: boolean;
    school_id?: number;
    district_id?: number;
}
export interface SchoolSafetyParams extends BaseSchoolParams { safety_type_id?: number; }
export interface SchoolBullyingParams extends BaseSchoolParams { bullying_type_id?: number; }
export interface SchoolBullyingClassificationParams extends BaseSchoolParams { bullying_classification_type_id?: number; }
export interface SchoolBullyingImpactParams extends BaseSchoolParams { bullying_impact_type_id?: number; }
export interface SchoolDisciplineIncidentParams extends BaseSchoolParams { discipline_incident_type_id?: number; }
export interface SchoolDisciplineCountParams extends BaseSchoolParams { discipline_count_type_id?: number; }
export interface SchoolHarassmentParams extends BaseSchoolParams { harassment_classification_id?: number; }

export interface BaseDistrictParams {
    year?: string;
    forceRefresh?: boolean;
    district_id?: number;
}
export interface DistrictSafetyParams extends BaseDistrictParams { safety_type_id?: number; }
export interface DistrictBullyingParams extends BaseDistrictParams { bullying_type_id?: number; }
export interface DistrictBullyingClassificationParams extends BaseDistrictParams { bullying_classification_type_id?: number; }
export interface DistrictBullyingImpactParams extends BaseDistrictParams { bullying_impact_type_id?: number; }
export interface DistrictDisciplineIncidentParams extends BaseDistrictParams { discipline_incident_type_id?: number; }
export interface DistrictDisciplineCountParams extends BaseDistrictParams { discipline_count_type_id?: number; }
export interface DistrictHarassmentParams extends BaseDistrictParams { harassment_classification_id?: number; }

export interface BaseStateParams {
    year?: string;
    forceRefresh?: boolean;
}
export interface StateSafetyParams extends BaseStateParams { safety_type_id?: number; }
export interface StateBullyingParams extends BaseStateParams { bullying_type_id?: number; }
export interface StateBullyingClassificationParams extends BaseStateParams { bullying_classification_type_id?: number; }
export interface StateBullyingImpactParams extends BaseStateParams { bullying_impact_type_id?: number; }
export interface StateDisciplineIncidentParams extends BaseStateParams { discipline_incident_type_id?: number; }
export interface StateDisciplineCountParams extends BaseStateParams { discipline_count_type_id?: number; }
export interface StateHarassmentParams extends BaseStateParams { harassment_classification_id?: number; }

export interface SchoolSafetyType {
    id: number;
    name: string;
}

export interface BaseTruancyData {
    id: number;
    year: number;
    count: number;
}
export interface SchoolTruancyData extends BaseTruancyData { school_id: number; }
export interface DistrictTruancyData extends BaseTruancyData { district_id: number; }
export interface StateTruancyData extends BaseTruancyData {}

export interface SafetyTypeData {
    id: number;
    name: string;
}

export interface BaseSafetyData {
    id: number;
    year: number;
    count: number;
    safety_type: SafetyTypeData;
}
export interface SchoolSafetyData extends BaseSafetyData { school_id: number; }
export interface DistrictSafetyData extends BaseSafetyData { district_id: number; }
export interface StateSafetyData extends BaseSafetyData {}

export interface BaseHarassmentData {
    id: number;
    year: number;
    incident_count: number;
    student_impact_count: number;
    student_engaged_count: number;
    classification: HarassmentClassificationData;
}
export interface SchoolHarassmentData extends BaseHarassmentData { school_id: number; }
export interface DistrictHarassmentData extends BaseHarassmentData { district_id: number; }
export interface StateHarassmentData extends BaseHarassmentData {}

export interface HarassmentClassificationData {
    id: number;
    name: string;
}
export interface BaseSeclusionData {
    id: number;
    year: number;
    generated: number;
    active_investigation: number;
    closed_investigation: number;
}
export interface SchoolSeclusionData extends BaseSeclusionData { school_id: number; }
export interface DistrictSeclusionData extends BaseSeclusionData { district_id: number; }
export interface StateSeclusionData extends BaseSeclusionData {}

export interface BaseRestraintData {
    id: number;
    school_id: number;
    year: number;
    generated: number;
    active_investigation: number;
    closed_investigation: number;
    bodily_injury: number;
    serious_injury: number;
}
export interface SchoolRestraintData extends BaseRestraintData { school_id: number; }
export interface DistrictRestraintData extends BaseRestraintData { district_id: number; }
export interface StateRestraintData extends BaseRestraintData {}

export interface BaseBullyingData {
    id: number;
    school_id: number;
    year: number;
    reported: number;
    investigated_actual: number;
    bullying_type: {
        id: number;
        name: string;
    };
}
export interface SchoolBullyingData extends BaseBullyingData { school_id: number; }
export interface DistrictBullyingData extends BaseBullyingData { district_id: number; }
export interface StateBullyingData extends BaseBullyingData {}

export interface BaseBullyingClassificationData {
    id: number;
    school_id: number;
    year: number;
    count: number;
    classification_type: {
        id: number;
        name: string;
    };
}
export interface SchoolBullyingClassificationData extends BaseBullyingClassificationData { school_id: number; }
export interface DistrictBullyingClassificationData extends BaseBullyingClassificationData { district_id: number; }
export interface StateBullyingClassificationData extends BaseBullyingClassificationData {}

export interface BaseBullyingImpactData {
    id: number;
    school_id: number;
    year: number;
    count: number;
    impact_type: {
        id: number;
        name: string;
    };
}
export interface SchoolBullyingImpactData extends BaseBullyingImpactData { school_id: number; }
export interface DistrictBullyingImpactData extends BaseBullyingImpactData { district_id: number; }
export interface StateBullyingImpactData extends BaseBullyingImpactData {}

export interface BaseDisciplineCountData {
    id: number;
    school_id: number;
    year: number;
    count: number;
    count_type: {
        id: number;
        name: string;
    };
}
export interface SchoolDisciplineCountData extends BaseDisciplineCountData { school_id: number; }
export interface DistrictDisciplineCountData extends BaseDisciplineCountData { district_id: number; }
export interface StateDisciplineCountData extends BaseDisciplineCountData {}

export interface BaseDisciplineIncidentData {
    id: number;
    school_id: number;
    year: number;
    count: number;
    incident_type: {
        id: number;
        name: string;
    };
}
export interface SchoolDisciplineIncidentData extends BaseDisciplineIncidentData { school_id: number; }
export interface DistrictDisciplineIncidentData extends BaseDisciplineIncidentData { district_id: number; }
export interface StateDisciplineIncidentData extends BaseDisciplineIncidentData {}

export interface BaseEnrollmentData {
    year: number;
    total_enrollment: number;
}
export interface SchoolEnrollmentData extends BaseEnrollmentData { school_id: number; }
export interface DistrictEnrollmentData extends BaseEnrollmentData { district_id: number; }
export interface StateEnrollmentData extends BaseEnrollmentData {}

export interface BullyingTypeData {
    id: number;
    name: string;
}

export interface BullyingClassificationTypeData {
    id: number;
    name: string;
}

export interface BullyingImpactTypeData {
    id: number;
    name: string;
}

export interface DisciplineCountTypeData {
    id: number;
    name: string;
}

export interface DisciplineIncidentTypeData {
    id: number;
    name: string;
}

export type SafetyPage = 'truancy' | 'schoolSafetyIncidents' | 'harassment' | 'bullying' | 'restraint' | 'seclusion' | 'serious' | 'suspension';
export type SafetyCategory = 'truancy' | 'safetyIncidents' | 'harassment' | 'bullying' | 'restraint' | 'seclusion' | 'bullyingClassification' | 'bullyingImpact' | 'disciplineCount' | 'disciplineIncident' | 'enrollment';
type SafetyTypeCategory = 'schoolSafetyTypes' | 'harassmentClassification' | 'bullyingTypes' | 'bullyingClassificationTypes' | 'bullyingImpactTypes' | 'disciplineCountTypes' | 'disciplineIncidentTypes';

interface SafetyState {
    
    schoolDataLoadingStatus: Record<SafetyCategory, Record<string, LoadingState>>;
    districtDataLoadingStatus: Record<SafetyCategory, Record<string, LoadingState>>;
    stateDataLoadingStatus: Record<SafetyCategory, Record<string, LoadingState>>;

    typeLoadingStatus: Record<SafetyTypeCategory, LoadingState>;
    
    schoolData: {
        truancy: Record<string, SchoolTruancyData[]>;
        safetyIncidents: Record<string, SchoolSafetyData[]>;
        harassment: Record<string, SchoolHarassmentData[]>;
        bullying: Record<string, SchoolBullyingData[]>;
        restraint: Record<string, SchoolRestraintData[]>;
        seclusion: Record<string, SchoolSeclusionData[]>;
        bullyingClassification: Record<string, SchoolBullyingClassificationData[]>;
        bullyingImpact: Record<string, SchoolBullyingImpactData[]>;
        disciplineCount: Record<string, SchoolDisciplineCountData[]>;
        disciplineIncident: Record<string, SchoolDisciplineIncidentData[]>;
        enrollment: Record<string, SchoolEnrollmentData[]>;
    }
    districtData: {
        truancy: Record<string, DistrictTruancyData[]>;
        safetyIncidents: Record<string, DistrictSafetyData[]>;
        harassment: Record<string, DistrictHarassmentData[]>;   
        restraint: Record<string, DistrictRestraintData[]>;
        seclusion: Record<string, DistrictSeclusionData[]>;
        bullying: Record<string, DistrictBullyingData[]>;
        bullyingClassification: Record<string, DistrictBullyingClassificationData[]>;
        bullyingImpact: Record<string, DistrictBullyingImpactData[]>;
        disciplineCount: Record<string, DistrictDisciplineCountData[]>;
        disciplineIncident: Record<string, DistrictDisciplineIncidentData[]>;
        enrollment: Record<string, DistrictEnrollmentData[]>;
    }
    stateData: {
        truancy: Record<string, StateTruancyData[]>;
        safetyIncidents: Record<string, StateSafetyData[]>;
        harassment: Record<string, StateHarassmentData[]>;
        restraint: Record<string, StateRestraintData[]>;
        seclusion: Record<string, StateSeclusionData[]>;
        bullying: Record<string, StateBullyingData[]>;
        bullyingClassification: Record<string, StateBullyingClassificationData[]>;
        bullyingImpact: Record<string, StateBullyingImpactData[]>;
        disciplineCount: Record<string, StateDisciplineCountData[]>;
        disciplineIncident: Record<string, StateDisciplineIncidentData[]>;
        enrollment: Record<string, StateEnrollmentData[]>;
    }   

    schoolSafetyTypes: SchoolSafetyType[];
    harassmentClassification: HarassmentClassificationData[];
    bullyingTypes: BullyingTypeData[];
    bullyingClassificationTypes: BullyingClassificationTypeData[];
    bullyingImpactTypes: BullyingImpactTypeData[];
    disciplineCountTypes: DisciplineCountTypeData[];
    disciplineIncidentTypes: DisciplineIncidentTypeData[];
    
    selectedSafetyPage: SafetyPage | null;
}

// Every loading map and schoolData/districtData share this key order; each call returns fresh, distinct buckets.
const categoryMaps = () => ({
    truancy: {},
    safetyIncidents: {},
    harassment: {},
    bullying: {},
    restraint: {},
    seclusion: {},
    bullyingClassification: {},
    bullyingImpact: {},
    disciplineCount: {},
    disciplineIncident: {},
    enrollment: {}
});

// stateData lists restraint and seclusion before bullying; kept so the initial state's key order is unchanged.
const stateDataMaps = () => ({
    truancy: {},
    safetyIncidents: {},
    harassment: {},
    restraint: {},
    seclusion: {},
    bullying: {},
    bullyingClassification: {},
    bullyingImpact: {},
    disciplineCount: {},
    disciplineIncident: {},
    enrollment: {}
});

const initialState: SafetyState = {
    schoolDataLoadingStatus: categoryMaps(),
    districtDataLoadingStatus: categoryMaps(),
    stateDataLoadingStatus: categoryMaps(),
    
    typeLoadingStatus: {
        schoolSafetyTypes: LoadingState.IDLE,
        harassmentClassification: LoadingState.IDLE,
        bullyingTypes: LoadingState.IDLE,
        bullyingClassificationTypes: LoadingState.IDLE,
        bullyingImpactTypes: LoadingState.IDLE,
        disciplineCountTypes: LoadingState.IDLE,
        disciplineIncidentTypes: LoadingState.IDLE
    },

    schoolData: categoryMaps(),
    districtData: categoryMaps(),
    stateData: stateDataMaps(),
    
    schoolSafetyTypes: [],
    harassmentClassification: [],
    bullyingTypes: [],
    bullyingClassificationTypes: [],
    bullyingImpactTypes: [],
    disciplineCountTypes: [],
    disciplineIncidentTypes: [],

    selectedSafetyPage: null
}

type SafetyLevel = 'school' | 'district' | 'state';
type SafetyRow<L extends SafetyLevel, C extends SafetyCategory> = SafetyState[`${L}Data`][C][string][number];

// Thunk argument per (level, category): exactly the annotations of the hand-written thunks.
interface SafetyParamsMap {
    school: {
        truancy: BaseSchoolParams; safetyIncidents: SchoolSafetyParams; harassment: SchoolHarassmentParams;
        seclusion: BaseSchoolParams; restraint: BaseSchoolParams; bullying: SchoolBullyingParams;
        bullyingClassification: SchoolBullyingClassificationParams; bullyingImpact: SchoolBullyingImpactParams;
        disciplineCount: SchoolDisciplineCountParams; disciplineIncident: SchoolDisciplineIncidentParams; enrollment: BaseSchoolParams;
    };
    district: {
        truancy: BaseDistrictParams; safetyIncidents: DistrictSafetyParams; harassment: DistrictHarassmentParams;
        seclusion: BaseDistrictParams; restraint: BaseDistrictParams; bullying: DistrictBullyingParams;
        bullyingClassification: DistrictBullyingClassificationParams; bullyingImpact: DistrictBullyingImpactParams;
        disciplineCount: DistrictDisciplineCountParams; disciplineIncident: DistrictDisciplineIncidentParams; enrollment: BaseDistrictParams;
    };
    state: {
        truancy: BaseStateParams; safetyIncidents: StateSafetyParams; harassment: StateHarassmentParams;
        seclusion: BaseStateParams; restraint: BaseStateParams; bullying: StateBullyingParams;
        bullyingClassification: StateBullyingClassificationParams; bullyingImpact: StateBullyingImpactParams;
        disciplineCount: StateDisciplineCountParams; disciplineIncident: StateDisciplineIncidentParams; enrollment: BaseStateParams;
    };
}

// Filled by the export lines below at module evaluation, before createSlice builds its reducer.
const SAFETY_DATA_THUNKS: Array<{ thunk: AsyncThunk<KeyedPayload<any>, any, any>; level: SafetyLevel; category: SafetyCategory }> = [];
const SAFETY_TYPE_THUNKS = {} as Record<SafetyTypeCategory, AsyncThunk<any, void, {}>>;

const safetyTypeThunk = (typePrefix: string, field: SafetyTypeCategory, request: () => Promise<any>) => {
    // Payload stays any: the type thunks return the untyped API data.
    const thunk = createTypeListThunk<any>(typePrefix, request);
    SAFETY_TYPE_THUNKS[field] = thunk;
    return thunk;
};

// Types are fetched first only when IDLE && empty: FAILED and SUCCEEDED-but-empty lists are never retried.
// unwrap() so a types failure aborts the data fetch. The registry is read when the thunk runs, not here.
const typePrefetch = (types: SafetyTypeCategory) => ({ getState, dispatch }: ThunkHooks) => {
    const safetyState = (getState() as RootState).safety;
    return prefetchIfIdle(safetyState.typeLoadingStatus[types], safetyState[types], () => dispatch(SAFETY_TYPE_THUNKS[types]()));
};

const safetyDataThunk = <L extends SafetyLevel, C extends SafetyCategory>(typePrefix: string, level: L, category: C,
    request: (options: KeyedOptions<SafetyParamsMap[L][C]>, forceRefresh: boolean) => Promise<any>,
    behaviour: { cache?: true; types?: SafetyTypeCategory } = {}) => {
    const thunk = createKeyedThunk<SafetyParamsMap[L][C], SafetyRow<L, C>>(typePrefix, {
        request,
        cached: behaviour.cache ? (getState, key) => (getState() as RootState).safety[`${level}Data`][category][key] as SafetyRow<L, C>[] | undefined : undefined,
        before: behaviour.types ? typePrefetch(behaviour.types) : undefined,
    });
    SAFETY_DATA_THUNKS.push({ thunk, level, category });
    return thunk;
};

export const fetchSchoolSafetyTypes = safetyTypeThunk('safety/fetchSchoolSafetyTypes', 'schoolSafetyTypes', () => safetyApi.getSchoolSafetyTypes());
// Thunk name is singular; the endpoint is plural.
export const fetchHarassmentClassification = safetyTypeThunk('safety/fetchHarassmentClassification', 'harassmentClassification', () => safetyApi.getHarassmentClassifications());
export const fetchBullyingTypes = safetyTypeThunk('safety/fetchBullyingTypes', 'bullyingTypes', () => safetyApi.getBullyingTypes());
export const fetchBullyingClassificationTypes = safetyTypeThunk('safety/fetchBullyingClassificationTypes', 'bullyingClassificationTypes', () => safetyApi.getBullyingClassificationTypes());
export const fetchBullyingImpactTypes = safetyTypeThunk('safety/fetchBullyingImpactTypes', 'bullyingImpactTypes', () => safetyApi.getBullyingImpactTypes());
export const fetchDisciplineCountTypes = safetyTypeThunk('safety/fetchDisciplineCountTypes', 'disciplineCountTypes', () => safetyApi.getDisciplineCountTypes());
export const fetchDisciplineIncidentTypes = safetyTypeThunk('safety/fetchDisciplineIncidentTypes', 'disciplineIncidentTypes', () => safetyApi.getDisciplineIncidentTypes());

// Truancy and enrollment are the only safety categories that check the slice cache;
// seclusion and restraint neither check the cache nor prefetch a type list.
// Every other category fetches its type list first; safety incidents use the school safety types at all three levels.
export const fetchSchoolTruancyData = safetyDataThunk('safety/fetchSchoolTruancyData', 'school', 'truancy',
    (options, forceRefresh) => safetyApi.getSchoolTruancies(options, forceRefresh), { cache: true });

export const fetchSchoolSafetyIncidents = safetyDataThunk('safety/fetchSchoolSafetyIncidents', 'school', 'safetyIncidents',
    (options, forceRefresh) => safetyApi.getSchoolSafetyIncidents(options, forceRefresh), { types: 'schoolSafetyTypes' });

export const fetchSchoolHarassmentIncidents = safetyDataThunk('safety/fetchSchoolHarassmentIncidents', 'school', 'harassment',
    (options, forceRefresh) => safetyApi.getSchoolHarassmentIncidents(options, forceRefresh), { types: 'harassmentClassification' });

export const fetchSchoolSeclusions = safetyDataThunk('safety/fetchSchoolSeclusions', 'school', 'seclusion',
    (options, forceRefresh) => safetyApi.getSchoolSeclusions(options, forceRefresh));

export const fetchSchoolRestraints = safetyDataThunk('safety/fetchSchoolRestraints', 'school', 'restraint',
    (options, forceRefresh) => safetyApi.getSchoolRestraints(options, forceRefresh));

export const fetchSchoolBullyingIncidents = safetyDataThunk('safety/fetchSchoolBullyingIncidents', 'school', 'bullying',
    (options, forceRefresh) => safetyApi.getSchoolBullyingIncidents(options, forceRefresh), { types: 'bullyingTypes' });

export const fetchSchoolBullyingClassifications = safetyDataThunk('safety/fetchSchoolBullyingClassifications', 'school', 'bullyingClassification',
    (options, forceRefresh) => safetyApi.getSchoolBullyingClassifications(options, forceRefresh), { types: 'bullyingClassificationTypes' });

export const fetchSchoolBullyingImpacts = safetyDataThunk('safety/fetchSchoolBullyingImpacts', 'school', 'bullyingImpact',
    (options, forceRefresh) => safetyApi.getSchoolBullyingImpacts(options, forceRefresh), { types: 'bullyingImpactTypes' });

export const fetchSchoolDisciplineCounts = safetyDataThunk('safety/fetchSchoolDisciplineCounts', 'school', 'disciplineCount',
    (options, forceRefresh) => safetyApi.getSchoolDisciplineCounts(options, forceRefresh), { types: 'disciplineCountTypes' });

export const fetchSchoolDisciplineIncidents = safetyDataThunk('safety/fetchSchoolDisciplineIncidents', 'school', 'disciplineIncident',
    (options, forceRefresh) => safetyApi.getSchoolDisciplineIncidents(options, forceRefresh), { types: 'disciplineIncidentTypes' });

export const fetchSchoolEnrollmentData = safetyDataThunk('safety/fetchSchoolEnrollmentData', 'school', 'enrollment',
    (options, forceRefresh) => safetyApi.getSchoolEnrollment(options, forceRefresh), { cache: true });

// District Level Thunks
export const fetchDistrictTruancyData = safetyDataThunk('safety/fetchDistrictTruancyData', 'district', 'truancy',
    (options, forceRefresh) => safetyApi.getDistrictTruancies(options, forceRefresh), { cache: true });

export const fetchDistrictSafetyIncidents = safetyDataThunk('safety/fetchDistrictSafetyIncidents', 'district', 'safetyIncidents',
    (options, forceRefresh) => safetyApi.getDistrictSafetyIncidents(options, forceRefresh), { types: 'schoolSafetyTypes' });

export const fetchDistrictHarassmentIncidents = safetyDataThunk('safety/fetchDistrictHarassmentIncidents', 'district', 'harassment',
    (options, forceRefresh) => safetyApi.getDistrictHarassmentIncidents(options, forceRefresh), { types: 'harassmentClassification' });

export const fetchDistrictSeclusions = safetyDataThunk('safety/fetchDistrictSeclusions', 'district', 'seclusion',
    (options, forceRefresh) => safetyApi.getDistrictSeclusions(options, forceRefresh));

export const fetchDistrictRestraints = safetyDataThunk('safety/fetchDistrictRestraints', 'district', 'restraint',
    (options, forceRefresh) => safetyApi.getDistrictRestraints(options, forceRefresh));

export const fetchDistrictBullyingIncidents = safetyDataThunk('safety/fetchDistrictBullyingIncidents', 'district', 'bullying',
    (options, forceRefresh) => safetyApi.getDistrictBullyingIncidents(options, forceRefresh), { types: 'bullyingTypes' });

export const fetchDistrictBullyingClassifications = safetyDataThunk('safety/fetchDistrictBullyingClassifications', 'district', 'bullyingClassification',
    (options, forceRefresh) => safetyApi.getDistrictBullyingClassifications(options, forceRefresh), { types: 'bullyingClassificationTypes' });

export const fetchDistrictBullyingImpacts = safetyDataThunk('safety/fetchDistrictBullyingImpacts', 'district', 'bullyingImpact',
    (options, forceRefresh) => safetyApi.getDistrictBullyingImpacts(options, forceRefresh), { types: 'bullyingImpactTypes' });

export const fetchDistrictDisciplineCounts = safetyDataThunk('safety/fetchDistrictDisciplineCounts', 'district', 'disciplineCount',
    (options, forceRefresh) => safetyApi.getDistrictDisciplineCounts(options, forceRefresh), { types: 'disciplineCountTypes' });

export const fetchDistrictDisciplineIncidents = safetyDataThunk('safety/fetchDistrictDisciplineIncidents', 'district', 'disciplineIncident',
    (options, forceRefresh) => safetyApi.getDistrictDisciplineIncidents(options, forceRefresh), { types: 'disciplineIncidentTypes' });

export const fetchDistrictEnrollmentData = safetyDataThunk('safety/fetchDistrictEnrollmentData', 'district', 'enrollment',
    (options, forceRefresh) => safetyApi.getDistrictEnrollment(options, forceRefresh), { cache: true });

// State Level Thunks
export const fetchStateTruancyData = safetyDataThunk('safety/fetchStateTruancyData', 'state', 'truancy',
    (options, forceRefresh) => safetyApi.getStateTruancies(options, forceRefresh), { cache: true });

export const fetchStateSafetyIncidents = safetyDataThunk('safety/fetchStateSafetyIncidents', 'state', 'safetyIncidents',
    (options, forceRefresh) => safetyApi.getStateSafetyIncidents(options, forceRefresh), { types: 'schoolSafetyTypes' });

export const fetchStateHarassmentIncidents = safetyDataThunk('safety/fetchStateHarassmentIncidents', 'state', 'harassment',
    (options, forceRefresh) => safetyApi.getStateHarassmentIncidents(options, forceRefresh), { types: 'harassmentClassification' });

export const fetchStateSeclusions = safetyDataThunk('safety/fetchStateSeclusions', 'state', 'seclusion',
    (options, forceRefresh) => safetyApi.getStateSeclusions(options, forceRefresh));

export const fetchStateRestraints = safetyDataThunk('safety/fetchStateRestraints', 'state', 'restraint',
    (options, forceRefresh) => safetyApi.getStateRestraints(options, forceRefresh));

export const fetchStateBullyingIncidents = safetyDataThunk('safety/fetchStateBullyingIncidents', 'state', 'bullying',
    (options, forceRefresh) => safetyApi.getStateBullyingIncidents(options, forceRefresh), { types: 'bullyingTypes' });

export const fetchStateBullyingClassifications = safetyDataThunk('safety/fetchStateBullyingClassifications', 'state', 'bullyingClassification',
    (options, forceRefresh) => safetyApi.getStateBullyingClassifications(options, forceRefresh), { types: 'bullyingClassificationTypes' });

export const fetchStateBullyingImpacts = safetyDataThunk('safety/fetchStateBullyingImpacts', 'state', 'bullyingImpact',
    (options, forceRefresh) => safetyApi.getStateBullyingImpacts(options, forceRefresh), { types: 'bullyingImpactTypes' });

export const fetchStateDisciplineCounts = safetyDataThunk('safety/fetchStateDisciplineCounts', 'state', 'disciplineCount',
    (options, forceRefresh) => safetyApi.getStateDisciplineCounts(options, forceRefresh), { types: 'disciplineCountTypes' });

export const fetchStateDisciplineIncidents = safetyDataThunk('safety/fetchStateDisciplineIncidents', 'state', 'disciplineIncident',
    (options, forceRefresh) => safetyApi.getStateDisciplineIncidents(options, forceRefresh), { types: 'disciplineIncidentTypes' });

export const fetchStateEnrollmentData = safetyDataThunk('safety/fetchStateEnrollmentData', 'state', 'enrollment',
    (options, forceRefresh) => safetyApi.getStateEnrollment(options, forceRefresh), { cache: true });

export const safetySlice = createSlice({
    name: 'safety',
    initialState,
    reducers: {
        setSelectedSafetyPage: (state, action: PayloadAction<SafetyPage | null>) => {
            state.selectedSafetyPage = action.payload;
        },
    },
    extraReducers: (builder) => {
        // The field list comes from the typed initialState, so a type list without a registered thunk fails at store creation.
        for (const field of Object.keys(initialState.typeLoadingStatus) as SafetyTypeCategory[]) {
            addTypeListCases(builder, SAFETY_TYPE_THUNKS[field], field);
        }
        // Keyed data: pending/rejected keyed on the raw meta.arg, fulfilled on payload.key, in the buckets of the
        // level and category each thunk was registered with.
        for (const { thunk, level, category } of SAFETY_DATA_THUNKS) {
            addKeyedCases(builder, thunk, {
                data: (state) => state[`${level}Data`][category],
                status: (state) => state[`${level}DataLoadingStatus`][category],
            });
        }
    }
})

export const { setSelectedSafetyPage } = safetySlice.actions;

// Helper function for creating loading status selectors
const selectLoadingStatus = (state: RootState, category: SafetyCategory, params: BaseSchoolParams) => {
    const options = { ...params };
    const key = createOptionsKey(options);
    
    if ('school_id' in params) {
        return state.safety.schoolDataLoadingStatus[category][key] || LoadingState.IDLE;
    } else if ('district_id' in params) {
        return state.safety.districtDataLoadingStatus[category][key] || LoadingState.IDLE;
    } else {
        return state.safety.stateDataLoadingStatus[category][key] || LoadingState.IDLE;
    }
}

// School loading status selectors
export const selectSchoolTruancyLoadingStatus = (state: RootState, params: BaseSchoolParams) => 
    selectLoadingStatus(state, 'truancy', params);

export const selectSchoolSafetyIncidentsLoadingStatus = (state: RootState, params: SchoolSafetyParams) => 
    selectLoadingStatus(state, 'safetyIncidents', params);

export const selectSchoolHarassmentIncidentsLoadingStatus = (state: RootState, params: BaseSchoolParams) => 
    selectLoadingStatus(state, 'harassment', params);

export const selectSchoolSeclusionLoadingStatus = (state: RootState, params: BaseSchoolParams) => 
    selectLoadingStatus(state, 'seclusion', params);

export const selectSchoolRestraintLoadingStatus = (state: RootState, params: BaseSchoolParams) => 
    selectLoadingStatus(state, 'restraint', params);

export const selectSchoolBullyingIncidentsLoadingStatus = (state: RootState, params: SchoolBullyingParams) => 
    selectLoadingStatus(state, 'bullying', params);

export const selectSchoolBullyingClassificationsLoadingStatus = (state: RootState, params: SchoolBullyingClassificationParams) => 
    selectLoadingStatus(state, 'bullyingClassification', params);

export const selectSchoolBullyingImpactsLoadingStatus = (state: RootState, params: SchoolBullyingImpactParams) => 
    selectLoadingStatus(state, 'bullyingImpact', params);

export const selectSchoolDisciplineCountsLoadingStatus = (state: RootState, params: SchoolDisciplineCountParams) => 
    selectLoadingStatus(state, 'disciplineCount', params);

export const selectSchoolDisciplineIncidentsLoadingStatus = (state: RootState, params: SchoolDisciplineIncidentParams) => 
    selectLoadingStatus(state, 'disciplineIncident', params);

export const selectSchoolEnrollmentLoadingStatus = (state: RootState, params: BaseSchoolParams) => 
    selectLoadingStatus(state, 'enrollment', params);

// School data selectors stay plain (not memoized), so a miss returns a fresh [] on every call
export const selectSchoolTruancyData = makeDataSelector<RootState, BaseSchoolParams, SchoolTruancyData>((state) => state.safety.schoolData.truancy);
export const selectSchoolSafetyData = makeDataSelector<RootState, SchoolSafetyParams, SchoolSafetyData>((state) => state.safety.schoolData.safetyIncidents);
export const selectSchoolHarassmentData = makeDataSelector<RootState, BaseSchoolParams, SchoolHarassmentData>((state) => state.safety.schoolData.harassment);
export const selectSchoolSeclusionData = makeDataSelector<RootState, BaseSchoolParams, SchoolSeclusionData>((state) => state.safety.schoolData.seclusion);
export const selectSchoolRestraintData = makeDataSelector<RootState, BaseSchoolParams, SchoolRestraintData>((state) => state.safety.schoolData.restraint);
export const selectSchoolBullyingData = makeDataSelector<RootState, SchoolBullyingParams, SchoolBullyingData>((state) => state.safety.schoolData.bullying);
export const selectSchoolBullyingClassificationData = makeDataSelector<RootState, SchoolBullyingClassificationParams, SchoolBullyingClassificationData>((state) => state.safety.schoolData.bullyingClassification);
export const selectSchoolBullyingImpactData = makeDataSelector<RootState, SchoolBullyingImpactParams, SchoolBullyingImpactData>((state) => state.safety.schoolData.bullyingImpact);
export const selectSchoolDisciplineCountData = makeDataSelector<RootState, SchoolDisciplineCountParams, SchoolDisciplineCountData>((state) => state.safety.schoolData.disciplineCount);
export const selectSchoolDisciplineIncidentData = makeDataSelector<RootState, SchoolDisciplineIncidentParams, SchoolDisciplineIncidentData>((state) => state.safety.schoolData.disciplineIncident);
export const selectSchoolEnrollmentData = makeDataSelector<RootState, BaseSchoolParams, SchoolEnrollmentData>((state) => state.safety.schoolData.enrollment);

// District loading status selectors with memoization
export const selectDistrictTruancyLoadingStatus = makeMemoStatusSelector<RootState, BaseDistrictParams>((state) => state.safety.districtDataLoadingStatus.truancy);
export const selectDistrictSafetyIncidentsLoadingStatus = makeMemoStatusSelector<RootState, DistrictSafetyParams>((state) => state.safety.districtDataLoadingStatus.safetyIncidents);
export const selectDistrictHarassmentIncidentsLoadingStatus = makeMemoStatusSelector<RootState, DistrictHarassmentParams>((state) => state.safety.districtDataLoadingStatus.harassment);
export const selectDistrictSeclusionLoadingStatus = makeMemoStatusSelector<RootState, BaseDistrictParams>((state) => state.safety.districtDataLoadingStatus.seclusion);
export const selectDistrictRestraintLoadingStatus = makeMemoStatusSelector<RootState, BaseDistrictParams>((state) => state.safety.districtDataLoadingStatus.restraint);
export const selectDistrictBullyingIncidentsLoadingStatus = makeMemoStatusSelector<RootState, DistrictBullyingParams>((state) => state.safety.districtDataLoadingStatus.bullying);
export const selectDistrictBullyingClassificationsLoadingStatus = makeMemoStatusSelector<RootState, DistrictBullyingClassificationParams>((state) => state.safety.districtDataLoadingStatus.bullyingClassification);
export const selectDistrictBullyingImpactsLoadingStatus = makeMemoStatusSelector<RootState, DistrictBullyingImpactParams>((state) => state.safety.districtDataLoadingStatus.bullyingImpact);
export const selectDistrictDisciplineCountsLoadingStatus = makeMemoStatusSelector<RootState, DistrictDisciplineCountParams>((state) => state.safety.districtDataLoadingStatus.disciplineCount);
export const selectDistrictDisciplineIncidentsLoadingStatus = makeMemoStatusSelector<RootState, DistrictDisciplineIncidentParams>((state) => state.safety.districtDataLoadingStatus.disciplineIncident);
export const selectDistrictEnrollmentLoadingStatus = makeMemoStatusSelector<RootState, BaseDistrictParams>((state) => state.safety.districtDataLoadingStatus.enrollment);

// State loading status selectors with memoization
export const selectStateTruancyLoadingStatus = makeMemoStatusSelector<RootState, BaseStateParams>((state) => state.safety.stateDataLoadingStatus.truancy);
export const selectStateSafetyIncidentsLoadingStatus = makeMemoStatusSelector<RootState, StateSafetyParams>((state) => state.safety.stateDataLoadingStatus.safetyIncidents);
export const selectStateHarassmentIncidentsLoadingStatus = makeMemoStatusSelector<RootState, StateHarassmentParams>((state) => state.safety.stateDataLoadingStatus.harassment);
export const selectStateSeclusionLoadingStatus = makeMemoStatusSelector<RootState, BaseStateParams>((state) => state.safety.stateDataLoadingStatus.seclusion);
export const selectStateRestraintLoadingStatus = makeMemoStatusSelector<RootState, BaseStateParams>((state) => state.safety.stateDataLoadingStatus.restraint);
export const selectStateBullyingIncidentsLoadingStatus = makeMemoStatusSelector<RootState, StateBullyingParams>((state) => state.safety.stateDataLoadingStatus.bullying);
export const selectStateBullyingClassificationsLoadingStatus = makeMemoStatusSelector<RootState, StateBullyingClassificationParams>((state) => state.safety.stateDataLoadingStatus.bullyingClassification);
export const selectStateBullyingImpactsLoadingStatus = makeMemoStatusSelector<RootState, StateBullyingImpactParams>((state) => state.safety.stateDataLoadingStatus.bullyingImpact);
export const selectStateDisciplineCountsLoadingStatus = makeMemoStatusSelector<RootState, StateDisciplineCountParams>((state) => state.safety.stateDataLoadingStatus.disciplineCount);
export const selectStateDisciplineIncidentsLoadingStatus = makeMemoStatusSelector<RootState, StateDisciplineIncidentParams>((state) => state.safety.stateDataLoadingStatus.disciplineIncident);
export const selectStateEnrollmentLoadingStatus = makeMemoStatusSelector<RootState, BaseStateParams>((state) => state.safety.stateDataLoadingStatus.enrollment);

// District Data Selectors
export const selectDistrictTruancyData = makeMemoDataSelector<RootState, BaseDistrictParams, DistrictTruancyData>((state) => state.safety.districtData.truancy);
export const selectDistrictSafetyData = makeMemoDataSelector<RootState, DistrictSafetyParams, DistrictSafetyData>((state) => state.safety.districtData.safetyIncidents);
export const selectDistrictHarassmentData = makeMemoDataSelector<RootState, DistrictHarassmentParams, DistrictHarassmentData>((state) => state.safety.districtData.harassment);
export const selectDistrictSeclusionData = makeMemoDataSelector<RootState, BaseDistrictParams, DistrictSeclusionData>((state) => state.safety.districtData.seclusion);
export const selectDistrictRestraintData = makeMemoDataSelector<RootState, BaseDistrictParams, DistrictRestraintData>((state) => state.safety.districtData.restraint);
export const selectDistrictBullyingData = makeMemoDataSelector<RootState, DistrictBullyingParams, DistrictBullyingData>((state) => state.safety.districtData.bullying);
export const selectDistrictBullyingClassificationData = makeMemoDataSelector<RootState, DistrictBullyingClassificationParams, DistrictBullyingClassificationData>((state) => state.safety.districtData.bullyingClassification);
export const selectDistrictBullyingImpactData = makeMemoDataSelector<RootState, DistrictBullyingImpactParams, DistrictBullyingImpactData>((state) => state.safety.districtData.bullyingImpact);
export const selectDistrictDisciplineCountData = makeMemoDataSelector<RootState, DistrictDisciplineCountParams, DistrictDisciplineCountData>((state) => state.safety.districtData.disciplineCount);
export const selectDistrictDisciplineIncidentData = makeMemoDataSelector<RootState, DistrictDisciplineIncidentParams, DistrictDisciplineIncidentData>((state) => state.safety.districtData.disciplineIncident);
export const selectDistrictEnrollmentData = makeMemoDataSelector<RootState, BaseDistrictParams, DistrictEnrollmentData>((state) => state.safety.districtData.enrollment);

// State Data Selectors
export const selectStateTruancyData = makeMemoDataSelector<RootState, BaseStateParams, StateTruancyData>((state) => state.safety.stateData.truancy);
export const selectStateSafetyData = makeMemoDataSelector<RootState, StateSafetyParams, StateSafetyData>((state) => state.safety.stateData.safetyIncidents);
export const selectStateHarassmentData = makeMemoDataSelector<RootState, StateHarassmentParams, StateHarassmentData>((state) => state.safety.stateData.harassment);
export const selectStateSeclusionData = makeMemoDataSelector<RootState, BaseStateParams, StateSeclusionData>((state) => state.safety.stateData.seclusion);
export const selectStateRestraintData = makeMemoDataSelector<RootState, BaseStateParams, StateRestraintData>((state) => state.safety.stateData.restraint);
export const selectStateBullyingData = makeMemoDataSelector<RootState, StateBullyingParams, StateBullyingData>((state) => state.safety.stateData.bullying);
export const selectStateBullyingClassificationData = makeMemoDataSelector<RootState, StateBullyingClassificationParams, StateBullyingClassificationData>((state) => state.safety.stateData.bullyingClassification);
export const selectStateBullyingImpactData = makeMemoDataSelector<RootState, StateBullyingImpactParams, StateBullyingImpactData>((state) => state.safety.stateData.bullyingImpact);
export const selectStateDisciplineCountData = makeMemoDataSelector<RootState, StateDisciplineCountParams, StateDisciplineCountData>((state) => state.safety.stateData.disciplineCount);
export const selectStateDisciplineIncidentData = makeMemoDataSelector<RootState, StateDisciplineIncidentParams, StateDisciplineIncidentData>((state) => state.safety.stateData.disciplineIncident);
export const selectStateEnrollmentData = makeMemoDataSelector<RootState, BaseStateParams, StateEnrollmentData>((state) => state.safety.stateData.enrollment);

export const selectHarassmentClassification = (state: RootState) => state.safety.harassmentClassification;
export const selectBullyingTypes = (state: RootState) => state.safety.bullyingTypes;
export const selectBullyingClassificationTypes = (state: RootState) => state.safety.bullyingClassificationTypes;
export const selectBullyingImpactTypes = (state: RootState) => state.safety.bullyingImpactTypes;
export const selectDisciplineCountTypes = (state: RootState) => state.safety.disciplineCountTypes;
export const selectDisciplineIncidentTypes = (state: RootState) => state.safety.disciplineIncidentTypes;

export const selectSelectedSafetyPage = (state: RootState) => state.safety.selectedSafetyPage;


export default safetySlice.reducer;
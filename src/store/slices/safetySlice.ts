import { createSlice, PayloadAction, type AsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { safetyApi } from '@/services/api/endpoints/safety';
import { createSelector } from '@reduxjs/toolkit';
import { LoadingState } from '@/store/utils/loadingState';
import { createOptionsKey } from '@/store/utils/cacheKey';
import { createKeyedThunk, prefetchIfIdle, type KeyedPayload, type KeyedOptions, type ThunkHooks } from '@/store/utils/keyedResource';
import { createTypeListThunk } from '@/store/utils/typeLists';

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

const initialState: SafetyState = {
    schoolDataLoadingStatus: {
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
    },
    districtDataLoadingStatus: {
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
    },
    stateDataLoadingStatus: {
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
    },
    
    typeLoadingStatus: {
        schoolSafetyTypes: LoadingState.IDLE,
        harassmentClassification: LoadingState.IDLE,
        bullyingTypes: LoadingState.IDLE,
        bullyingClassificationTypes: LoadingState.IDLE,
        bullyingImpactTypes: LoadingState.IDLE,
        disciplineCountTypes: LoadingState.IDLE,
        disciplineIncidentTypes: LoadingState.IDLE
    },

    schoolData: {
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
    },
    districtData: {
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
    },
    stateData: {
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
    },
    
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
        builder.addCase(fetchSchoolSafetyTypes.pending, (state, action) => {
            state.typeLoadingStatus.schoolSafetyTypes = LoadingState.LOADING;
        })
        .addCase(fetchSchoolSafetyTypes.fulfilled, (state, action) => {
            state.schoolSafetyTypes = action.payload;
            state.typeLoadingStatus.schoolSafetyTypes = LoadingState.SUCCEEDED;
        })  
        .addCase(fetchSchoolSafetyTypes.rejected, (state, action) => {
            state.typeLoadingStatus.schoolSafetyTypes = LoadingState.FAILED;
        })

        .addCase(fetchHarassmentClassification.pending, (state, action) => {
            state.typeLoadingStatus.harassmentClassification = LoadingState.LOADING;
        })
        .addCase(fetchHarassmentClassification.fulfilled, (state, action) => {
            state.harassmentClassification = action.payload;
            state.typeLoadingStatus.harassmentClassification = LoadingState.SUCCEEDED;
        })
        .addCase(fetchHarassmentClassification.rejected, (state, action) => {
            state.typeLoadingStatus.harassmentClassification = LoadingState.FAILED;
        })

        // Bullying Types
        .addCase(fetchBullyingTypes.pending, (state, action) => {
            state.typeLoadingStatus.bullyingTypes = LoadingState.LOADING;
        })
        .addCase(fetchBullyingTypes.fulfilled, (state, action) => {
            state.bullyingTypes = action.payload;
            state.typeLoadingStatus.bullyingTypes = LoadingState.SUCCEEDED;
        })
        .addCase(fetchBullyingTypes.rejected, (state, action) => {
            state.typeLoadingStatus.bullyingTypes = LoadingState.FAILED;
        })
        
        // Bullying Classification Types
        .addCase(fetchBullyingClassificationTypes.pending, (state, action) => {
            state.typeLoadingStatus.bullyingClassificationTypes = LoadingState.LOADING;
        })
        .addCase(fetchBullyingClassificationTypes.fulfilled, (state, action) => {
            state.bullyingClassificationTypes = action.payload;
            state.typeLoadingStatus.bullyingClassificationTypes = LoadingState.SUCCEEDED;
        })
        .addCase(fetchBullyingClassificationTypes.rejected, (state, action) => {
            state.typeLoadingStatus.bullyingClassificationTypes = LoadingState.FAILED;
        })
        
        // Bullying Impact Types
        .addCase(fetchBullyingImpactTypes.pending, (state, action) => {
            state.typeLoadingStatus.bullyingImpactTypes = LoadingState.LOADING;
        })
        .addCase(fetchBullyingImpactTypes.fulfilled, (state, action) => {
            state.bullyingImpactTypes = action.payload;
            state.typeLoadingStatus.bullyingImpactTypes = LoadingState.SUCCEEDED;
        })
        .addCase(fetchBullyingImpactTypes.rejected, (state, action) => {
            state.typeLoadingStatus.bullyingImpactTypes = LoadingState.FAILED;
        })
        
        // Discipline Count Types
        .addCase(fetchDisciplineCountTypes.pending, (state, action) => {
            state.typeLoadingStatus.disciplineCountTypes = LoadingState.LOADING;
        })
        .addCase(fetchDisciplineCountTypes.fulfilled, (state, action) => {
            state.disciplineCountTypes = action.payload;
            state.typeLoadingStatus.disciplineCountTypes = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDisciplineCountTypes.rejected, (state, action) => {
            state.typeLoadingStatus.disciplineCountTypes = LoadingState.FAILED;
        })
        
        // Discipline Incident Types
        .addCase(fetchDisciplineIncidentTypes.pending, (state, action) => {
            state.typeLoadingStatus.disciplineIncidentTypes = LoadingState.LOADING;
        })
        .addCase(fetchDisciplineIncidentTypes.fulfilled, (state, action) => {
            state.disciplineIncidentTypes = action.payload;
            state.typeLoadingStatus.disciplineIncidentTypes = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDisciplineIncidentTypes.rejected, (state, action) => {
            state.typeLoadingStatus.disciplineIncidentTypes = LoadingState.FAILED;
        })
        
        .addCase(fetchSchoolTruancyData.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.truancy[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolTruancyData.fulfilled, (state, action) => {
            state.schoolData.truancy[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.truancy[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolTruancyData.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.truancy[key] = LoadingState.FAILED;
        })
        
        .addCase(fetchSchoolSafetyIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.safetyIncidents[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolSafetyIncidents.fulfilled, (state, action) => {
            state.schoolData.safetyIncidents[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.safetyIncidents[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolSafetyIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.safetyIncidents[key] = LoadingState.FAILED;
        })

        .addCase(fetchSchoolHarassmentIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.harassment[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolHarassmentIncidents.fulfilled, (state, action) => {
            state.schoolData.harassment[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.harassment[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolHarassmentIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.harassment[key] = LoadingState.FAILED;
        })

        // Seclusions
        .addCase(fetchSchoolSeclusions.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.seclusion[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolSeclusions.fulfilled, (state, action) => {
            state.schoolData.seclusion[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.seclusion[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolSeclusions.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.seclusion[key] = LoadingState.FAILED;
        })

        // Restraints
        .addCase(fetchSchoolRestraints.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.restraint[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolRestraints.fulfilled, (state, action) => {
            state.schoolData.restraint[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.restraint[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolRestraints.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.restraint[key] = LoadingState.FAILED;
        })

        // Bullying Incidents
        .addCase(fetchSchoolBullyingIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.bullying[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolBullyingIncidents.fulfilled, (state, action) => {
            state.schoolData.bullying[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.bullying[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolBullyingIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.bullying[key] = LoadingState.FAILED;
        })

        // Bullying Classifications
        .addCase(fetchSchoolBullyingClassifications.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.bullyingClassification[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolBullyingClassifications.fulfilled, (state, action) => {
            state.schoolData.bullyingClassification[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.bullyingClassification[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolBullyingClassifications.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.bullyingClassification[key] = LoadingState.FAILED;
        })

        // Bullying Impacts
        .addCase(fetchSchoolBullyingImpacts.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.bullyingImpact[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolBullyingImpacts.fulfilled, (state, action) => {
            state.schoolData.bullyingImpact[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.bullyingImpact[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolBullyingImpacts.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.bullyingImpact[key] = LoadingState.FAILED;
        })

        // Discipline Counts
        .addCase(fetchSchoolDisciplineCounts.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.disciplineCount[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolDisciplineCounts.fulfilled, (state, action) => {
            state.schoolData.disciplineCount[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.disciplineCount[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolDisciplineCounts.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.disciplineCount[key] = LoadingState.FAILED;
        })

        // Discipline Incidents
        .addCase(fetchSchoolDisciplineIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.disciplineIncident[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolDisciplineIncidents.fulfilled, (state, action) => {
            state.schoolData.disciplineIncident[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.disciplineIncident[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolDisciplineIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.disciplineIncident[key] = LoadingState.FAILED;
        })

        .addCase(fetchSchoolEnrollmentData.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.enrollment[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolEnrollmentData.fulfilled, (state, action) => {
            state.schoolData.enrollment[action.payload.key] = action.payload.data;
            state.schoolDataLoadingStatus.enrollment[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolEnrollmentData.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.schoolDataLoadingStatus.enrollment[key] = LoadingState.FAILED;
        })

        // District Level Reducers
        // District Truancy
        .addCase(fetchDistrictTruancyData.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.truancy[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictTruancyData.fulfilled, (state, action) => {
            state.districtData.truancy[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.truancy[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictTruancyData.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.truancy[key] = LoadingState.FAILED;
        })
        
        // District Safety Incidents
        .addCase(fetchDistrictSafetyIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.safetyIncidents[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictSafetyIncidents.fulfilled, (state, action) => {
            state.districtData.safetyIncidents[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.safetyIncidents[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictSafetyIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.safetyIncidents[key] = LoadingState.FAILED;
        })

        // District Harassment
        .addCase(fetchDistrictHarassmentIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.harassment[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictHarassmentIncidents.fulfilled, (state, action) => {
            state.districtData.harassment[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.harassment[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictHarassmentIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.harassment[key] = LoadingState.FAILED;
        })

        // District Seclusions
        .addCase(fetchDistrictSeclusions.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.seclusion[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictSeclusions.fulfilled, (state, action) => {
            state.districtData.seclusion[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.seclusion[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictSeclusions.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.seclusion[key] = LoadingState.FAILED;
        })

        // District Restraints
        .addCase(fetchDistrictRestraints.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.restraint[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictRestraints.fulfilled, (state, action) => {
            state.districtData.restraint[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.restraint[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictRestraints.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.restraint[key] = LoadingState.FAILED;
        })

        // District Bullying
        .addCase(fetchDistrictBullyingIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.bullying[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictBullyingIncidents.fulfilled, (state, action) => {
            state.districtData.bullying[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.bullying[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictBullyingIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.bullying[key] = LoadingState.FAILED;
        })

        // District Bullying Classifications
        .addCase(fetchDistrictBullyingClassifications.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.bullyingClassification[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictBullyingClassifications.fulfilled, (state, action) => {
            state.districtData.bullyingClassification[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.bullyingClassification[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictBullyingClassifications.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.bullyingClassification[key] = LoadingState.FAILED;
        })

        // District Bullying Impacts
        .addCase(fetchDistrictBullyingImpacts.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.bullyingImpact[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictBullyingImpacts.fulfilled, (state, action) => {
            state.districtData.bullyingImpact[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.bullyingImpact[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictBullyingImpacts.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.bullyingImpact[key] = LoadingState.FAILED;
        })

        // District Discipline Counts
        .addCase(fetchDistrictDisciplineCounts.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.disciplineCount[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictDisciplineCounts.fulfilled, (state, action) => {
            state.districtData.disciplineCount[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.disciplineCount[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictDisciplineCounts.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.disciplineCount[key] = LoadingState.FAILED;
        })

        // District Discipline Incidents
        .addCase(fetchDistrictDisciplineIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.disciplineIncident[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictDisciplineIncidents.fulfilled, (state, action) => {
            state.districtData.disciplineIncident[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.disciplineIncident[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictDisciplineIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.disciplineIncident[key] = LoadingState.FAILED;
        })

        // District Enrollment
        .addCase(fetchDistrictEnrollmentData.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.enrollment[key] = LoadingState.LOADING;
        })
        .addCase(fetchDistrictEnrollmentData.fulfilled, (state, action) => {
            state.districtData.enrollment[action.payload.key] = action.payload.data;
            state.districtDataLoadingStatus.enrollment[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchDistrictEnrollmentData.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.districtDataLoadingStatus.enrollment[key] = LoadingState.FAILED;
        })

        // State Level Reducers
        // State Truancy
        .addCase(fetchStateTruancyData.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.truancy[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateTruancyData.fulfilled, (state, action) => {
            state.stateData.truancy[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.truancy[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateTruancyData.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.truancy[key] = LoadingState.FAILED;
        })
        
        // State Safety Incidents
        .addCase(fetchStateSafetyIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.safetyIncidents[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateSafetyIncidents.fulfilled, (state, action) => {
            state.stateData.safetyIncidents[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.safetyIncidents[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateSafetyIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.safetyIncidents[key] = LoadingState.FAILED;
        })

        // State Harassment
        .addCase(fetchStateHarassmentIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.harassment[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateHarassmentIncidents.fulfilled, (state, action) => {
            state.stateData.harassment[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.harassment[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateHarassmentIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.harassment[key] = LoadingState.FAILED;
        })

        // State Seclusions
        .addCase(fetchStateSeclusions.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.seclusion[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateSeclusions.fulfilled, (state, action) => {
            state.stateData.seclusion[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.seclusion[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateSeclusions.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.seclusion[key] = LoadingState.FAILED;
        })

        // State Restraints
        .addCase(fetchStateRestraints.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.restraint[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateRestraints.fulfilled, (state, action) => {
            state.stateData.restraint[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.restraint[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateRestraints.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.restraint[key] = LoadingState.FAILED;
        })

        // State Bullying
        .addCase(fetchStateBullyingIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.bullying[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateBullyingIncidents.fulfilled, (state, action) => {
            state.stateData.bullying[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.bullying[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateBullyingIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.bullying[key] = LoadingState.FAILED;
        })

        // State Bullying Classifications
        .addCase(fetchStateBullyingClassifications.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.bullyingClassification[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateBullyingClassifications.fulfilled, (state, action) => {
            state.stateData.bullyingClassification[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.bullyingClassification[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateBullyingClassifications.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.bullyingClassification[key] = LoadingState.FAILED;
        })

        // State Bullying Impacts
        .addCase(fetchStateBullyingImpacts.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.bullyingImpact[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateBullyingImpacts.fulfilled, (state, action) => {
            state.stateData.bullyingImpact[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.bullyingImpact[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateBullyingImpacts.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.bullyingImpact[key] = LoadingState.FAILED;
        })

        // State Discipline Counts
        .addCase(fetchStateDisciplineCounts.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.disciplineCount[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateDisciplineCounts.fulfilled, (state, action) => {
            state.stateData.disciplineCount[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.disciplineCount[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateDisciplineCounts.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.disciplineCount[key] = LoadingState.FAILED;
        })

        // State Discipline Incidents
        .addCase(fetchStateDisciplineIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.disciplineIncident[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateDisciplineIncidents.fulfilled, (state, action) => {
            state.stateData.disciplineIncident[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.disciplineIncident[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateDisciplineIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.disciplineIncident[key] = LoadingState.FAILED;
        })

        // State Enrollment
        .addCase(fetchStateEnrollmentData.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.enrollment[key] = LoadingState.LOADING;
        })
        .addCase(fetchStateEnrollmentData.fulfilled, (state, action) => {
            state.stateData.enrollment[action.payload.key] = action.payload.data;
            state.stateDataLoadingStatus.enrollment[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchStateEnrollmentData.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.stateDataLoadingStatus.enrollment[key] = LoadingState.FAILED;
        })
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

export const selectSchoolTruancyData = (state: RootState, params: BaseSchoolParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.truancy[key] || [];
}   

export const selectSchoolSafetyData = (state: RootState, params: SchoolSafetyParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.safetyIncidents[key] || [];
}   

export const selectSchoolHarassmentData = (state: RootState, params: BaseSchoolParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.harassment[key] || [];
}   

export const selectSchoolSeclusionData = (state: RootState, params: BaseSchoolParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.seclusion[key] || [];
}   

export const selectSchoolRestraintData = (state: RootState, params: BaseSchoolParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.restraint[key] || [];
}   

export const selectSchoolBullyingData = (state: RootState, params: SchoolBullyingParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.bullying[key] || [];
}   

export const selectSchoolBullyingClassificationData = (state: RootState, params: SchoolBullyingClassificationParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.bullyingClassification[key] || [];
}   

export const selectSchoolBullyingImpactData = (state: RootState, params: SchoolBullyingImpactParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.bullyingImpact[key] || [];
}   

export const selectSchoolDisciplineCountData = (state: RootState, params: SchoolDisciplineCountParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.disciplineCount[key] || [];
}   

export const selectSchoolDisciplineIncidentData = (state: RootState, params: SchoolDisciplineIncidentParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.disciplineIncident[key] || [];
}   

export const selectSchoolEnrollmentData = (state: RootState, params: BaseSchoolParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolData.enrollment[key] || [];
}   



// District loading status selectors with memoization
export const selectDistrictTruancyLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.truancy,
     (_: RootState, params: BaseDistrictParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictSafetyIncidentsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.safetyIncidents,
     (_: RootState, params: DistrictSafetyParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictHarassmentIncidentsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.harassment,
     (_: RootState, params: DistrictHarassmentParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictSeclusionLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.seclusion,
     (_: RootState, params: BaseDistrictParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictRestraintLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.restraint,
     (_: RootState, params: BaseDistrictParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictBullyingIncidentsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.bullying,
     (_: RootState, params: DistrictBullyingParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictBullyingClassificationsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.bullyingClassification,
     (_: RootState, params: DistrictBullyingClassificationParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictBullyingImpactsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.bullyingImpact,
     (_: RootState, params: DistrictBullyingImpactParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictDisciplineCountsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.disciplineCount,
     (_: RootState, params: DistrictDisciplineCountParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictDisciplineIncidentsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.disciplineIncident,
     (_: RootState, params: DistrictDisciplineIncidentParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectDistrictEnrollmentLoadingStatus = createSelector(
    [(state: RootState) => state.safety.districtDataLoadingStatus.enrollment,
     (_: RootState, params: BaseDistrictParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

// State loading status selectors with memoization
export const selectStateTruancyLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.truancy,
     (_: RootState, params: BaseStateParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateSafetyIncidentsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.safetyIncidents,
     (_: RootState, params: StateSafetyParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateHarassmentIncidentsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.harassment,
     (_: RootState, params: StateHarassmentParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateSeclusionLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.seclusion,
     (_: RootState, params: BaseStateParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateRestraintLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.restraint,
     (_: RootState, params: BaseStateParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateBullyingIncidentsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.bullying,
     (_: RootState, params: StateBullyingParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateBullyingClassificationsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.bullyingClassification,
     (_: RootState, params: StateBullyingClassificationParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateBullyingImpactsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.bullyingImpact,
     (_: RootState, params: StateBullyingImpactParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateDisciplineCountsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.disciplineCount,
     (_: RootState, params: StateDisciplineCountParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateDisciplineIncidentsLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.disciplineIncident,
     (_: RootState, params: StateDisciplineIncidentParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

export const selectStateEnrollmentLoadingStatus = createSelector(
    [(state: RootState) => state.safety.stateDataLoadingStatus.enrollment,
     (_: RootState, params: BaseStateParams) => {
        const options = { ...params };
        return createOptionsKey(options);
     }],
    (loadingStatus, key) => loadingStatus[key] || LoadingState.IDLE
);

// District Data Selectors
export const selectDistrictTruancyData = createSelector(
    [(state: RootState) => state.safety.districtData.truancy, 
     (_: RootState, params: BaseDistrictParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (truancyData, key) => truancyData[key] || []
);

export const selectDistrictSafetyData = createSelector(
    [(state: RootState) => state.safety.districtData.safetyIncidents, 
     (_: RootState, params: DistrictSafetyParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (safetyData, key) => safetyData[key] || []
);

export const selectDistrictHarassmentData = createSelector(
    [(state: RootState) => state.safety.districtData.harassment, 
     (_: RootState, params: DistrictHarassmentParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (harassmentData, key) => harassmentData[key] || []
);

export const selectDistrictSeclusionData = createSelector(
    [(state: RootState) => state.safety.districtData.seclusion, 
     (_: RootState, params: BaseDistrictParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (seclusionData, key) => seclusionData[key] || []
);

export const selectDistrictRestraintData = createSelector(
    [(state: RootState) => state.safety.districtData.restraint, 
     (_: RootState, params: BaseDistrictParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (restraintData, key) => restraintData[key] || []
);

export const selectDistrictBullyingData = createSelector(
    [(state: RootState) => state.safety.districtData.bullying, 
     (_: RootState, params: DistrictBullyingParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (bullyingData, key) => bullyingData[key] || []
);

export const selectDistrictBullyingClassificationData = createSelector(
    [(state: RootState) => state.safety.districtData.bullyingClassification, 
     (_: RootState, params: DistrictBullyingClassificationParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (bullyingClassificationData, key) => bullyingClassificationData[key] || []
);

export const selectDistrictBullyingImpactData = createSelector(
    [(state: RootState) => state.safety.districtData.bullyingImpact, 
     (_: RootState, params: DistrictBullyingImpactParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (bullyingImpactData, key) => bullyingImpactData[key] || []
);

export const selectDistrictDisciplineCountData = createSelector(
    [(state: RootState) => state.safety.districtData.disciplineCount, 
     (_: RootState, params: DistrictDisciplineCountParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (disciplineCountData, key) => disciplineCountData[key] || []
);

export const selectDistrictDisciplineIncidentData = createSelector(
    [(state: RootState) => state.safety.districtData.disciplineIncident, 
     (_: RootState, params: DistrictDisciplineIncidentParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (disciplineIncidentData, key) => disciplineIncidentData[key] || []
);

export const selectDistrictEnrollmentData = createSelector(
    [(state: RootState) => state.safety.districtData.enrollment, 
     (_: RootState, params: BaseDistrictParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (enrollmentData, key) => enrollmentData[key] || []
);

// State Data Selectors
export const selectStateTruancyData = createSelector(
    [(state: RootState) => state.safety.stateData.truancy, 
     (_: RootState, params: BaseStateParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (truancyData, key) => truancyData[key] || []
);

export const selectStateSafetyData = createSelector(
    [(state: RootState) => state.safety.stateData.safetyIncidents, 
     (_: RootState, params: StateSafetyParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (safetyData, key) => safetyData[key] || []
);

export const selectStateHarassmentData = createSelector(
    [(state: RootState) => state.safety.stateData.harassment, 
     (_: RootState, params: StateHarassmentParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (harassmentData, key) => harassmentData[key] || []
);

export const selectStateSeclusionData = createSelector(
    [(state: RootState) => state.safety.stateData.seclusion, 
     (_: RootState, params: BaseStateParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (seclusionData, key) => seclusionData[key] || []
);

export const selectStateRestraintData = createSelector(
    [(state: RootState) => state.safety.stateData.restraint, 
     (_: RootState, params: BaseStateParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (restraintData, key) => restraintData[key] || []
);

export const selectStateBullyingData = createSelector(
    [(state: RootState) => state.safety.stateData.bullying, 
     (_: RootState, params: StateBullyingParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (bullyingData, key) => bullyingData[key] || []
);

export const selectStateBullyingClassificationData = createSelector(
    [(state: RootState) => state.safety.stateData.bullyingClassification, 
     (_: RootState, params: StateBullyingClassificationParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (bullyingClassificationData, key) => bullyingClassificationData[key] || []
);

export const selectStateBullyingImpactData = createSelector(
    [(state: RootState) => state.safety.stateData.bullyingImpact, 
     (_: RootState, params: StateBullyingImpactParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (bullyingImpactData, key) => bullyingImpactData[key] || []
);

export const selectStateDisciplineCountData = createSelector(
    [(state: RootState) => state.safety.stateData.disciplineCount, 
     (_: RootState, params: StateDisciplineCountParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (disciplineCountData, key) => disciplineCountData[key] || []
);

export const selectStateDisciplineIncidentData = createSelector(
    [(state: RootState) => state.safety.stateData.disciplineIncident, 
     (_: RootState, params: StateDisciplineIncidentParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (disciplineIncidentData, key) => disciplineIncidentData[key] || []
);  

export const selectStateEnrollmentData = createSelector(
    [(state: RootState) => state.safety.stateData.enrollment, 
     (_: RootState, params: BaseStateParams) => {
        const {forceRefresh = false, ...options} = params;
        return createOptionsKey(options);
     }],
    (enrollmentData, key) => enrollmentData[key] || []
);

export const selectHarassmentClassification = (state: RootState) => state.safety.harassmentClassification;
export const selectBullyingTypes = (state: RootState) => state.safety.bullyingTypes;
export const selectBullyingClassificationTypes = (state: RootState) => state.safety.bullyingClassificationTypes;
export const selectBullyingImpactTypes = (state: RootState) => state.safety.bullyingImpactTypes;
export const selectDisciplineCountTypes = (state: RootState) => state.safety.disciplineCountTypes;
export const selectDisciplineIncidentTypes = (state: RootState) => state.safety.disciplineIncidentTypes;

export const selectSelectedSafetyPage = (state: RootState) => state.safety.selectedSafetyPage;


export default safetySlice.reducer;
// Safety slice internals: state shape, initial state builders, thunk registries and their factories.
// Imported by name from safetySlice.ts and never re-exported; this file must not import safetySlice.ts.
import { type AsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import { LoadingState } from '@/store/utils/loadingState';
import { createKeyedThunk, prefetchIfIdle, type KeyedPayload, type KeyedOptions, type ThunkHooks } from '@/store/utils/keyedResource';
import { createTypeListThunk } from '@/store/utils/typeLists';
import type {
    SafetyCategory, SafetyPage,
    BaseSchoolParams, SchoolSafetyParams, SchoolBullyingParams, SchoolBullyingClassificationParams, SchoolBullyingImpactParams,
    SchoolDisciplineIncidentParams, SchoolDisciplineCountParams, SchoolHarassmentParams,
    BaseDistrictParams, DistrictSafetyParams, DistrictBullyingParams, DistrictBullyingClassificationParams, DistrictBullyingImpactParams,
    DistrictDisciplineIncidentParams, DistrictDisciplineCountParams, DistrictHarassmentParams,
    BaseStateParams, StateSafetyParams, StateBullyingParams, StateBullyingClassificationParams, StateBullyingImpactParams,
    StateDisciplineIncidentParams, StateDisciplineCountParams, StateHarassmentParams,
    SchoolSafetyType, HarassmentClassificationData, BullyingTypeData, BullyingClassificationTypeData, BullyingImpactTypeData,
    DisciplineCountTypeData, DisciplineIncidentTypeData,
    SchoolTruancyData, SchoolSafetyData, SchoolHarassmentData, SchoolBullyingData, SchoolRestraintData, SchoolSeclusionData,
    SchoolBullyingClassificationData, SchoolBullyingImpactData, SchoolDisciplineCountData, SchoolDisciplineIncidentData, SchoolEnrollmentData,
    DistrictTruancyData, DistrictSafetyData, DistrictHarassmentData, DistrictRestraintData, DistrictSeclusionData, DistrictBullyingData,
    DistrictBullyingClassificationData, DistrictBullyingImpactData, DistrictDisciplineCountData, DistrictDisciplineIncidentData, DistrictEnrollmentData,
    StateTruancyData, StateSafetyData, StateHarassmentData, StateRestraintData, StateSeclusionData, StateBullyingData,
    StateBullyingClassificationData, StateBullyingImpactData, StateDisciplineCountData, StateDisciplineIncidentData, StateEnrollmentData,
} from './types';

export type SafetyTypeCategory = 'schoolSafetyTypes' | 'harassmentClassification' | 'bullyingTypes' | 'bullyingClassificationTypes' | 'bullyingImpactTypes' | 'disciplineCountTypes' | 'disciplineIncidentTypes';

export interface SafetyState {
    
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
export const categoryMaps = () => ({
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
export const stateDataMaps = () => ({
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


export type SafetyLevel = 'school' | 'district' | 'state';
export type SafetyRow<L extends SafetyLevel, C extends SafetyCategory> = SafetyState[`${L}Data`][C][string][number];

// Thunk argument per (level, category): exactly the annotations of the hand-written thunks.
export interface SafetyParamsMap {
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

// Filled by the export lines in safetySlice.ts at module evaluation, before createSlice builds its reducer.
export const SAFETY_DATA_THUNKS: Array<{ thunk: AsyncThunk<KeyedPayload<any>, any, any>; level: SafetyLevel; category: SafetyCategory }> = [];
export const SAFETY_TYPE_THUNKS = {} as Record<SafetyTypeCategory, AsyncThunk<any, void, {}>>;

export const safetyTypeThunk = (typePrefix: string, field: SafetyTypeCategory, request: () => Promise<any>) => {
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

export const safetyDataThunk = <L extends SafetyLevel, C extends SafetyCategory>(typePrefix: string, level: L, category: C,
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

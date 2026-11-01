import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { safetyApi } from '@/services/api/endpoints/safety';
import { LoadingState } from '@/store/utils/loadingState';
import { createOptionsKey } from '@/store/utils/cacheKey';
import { addKeyedCases } from '@/store/utils/keyedResource';
import { addTypeListCases } from '@/store/utils/typeLists';
import { makeDataSelector, makeMemoStatusSelector, makeMemoDataSelector } from '@/store/utils/selectors';
import type {
    SafetyPage, SafetyCategory,
    BaseSchoolParams, SchoolSafetyParams, SchoolBullyingParams, SchoolBullyingClassificationParams, SchoolBullyingImpactParams,
    SchoolDisciplineIncidentParams, SchoolDisciplineCountParams,
    BaseDistrictParams, DistrictSafetyParams, DistrictBullyingParams, DistrictBullyingClassificationParams, DistrictBullyingImpactParams,
    DistrictDisciplineIncidentParams, DistrictDisciplineCountParams, DistrictHarassmentParams,
    BaseStateParams, StateSafetyParams, StateBullyingParams, StateBullyingClassificationParams, StateBullyingImpactParams,
    StateDisciplineIncidentParams, StateDisciplineCountParams, StateHarassmentParams,
    SchoolTruancyData, SchoolSafetyData, SchoolHarassmentData, SchoolBullyingData, SchoolRestraintData, SchoolSeclusionData,
    SchoolBullyingClassificationData, SchoolBullyingImpactData, SchoolDisciplineCountData, SchoolDisciplineIncidentData, SchoolEnrollmentData,
    DistrictTruancyData, DistrictSafetyData, DistrictHarassmentData, DistrictRestraintData, DistrictSeclusionData, DistrictBullyingData,
    DistrictBullyingClassificationData, DistrictBullyingImpactData, DistrictDisciplineCountData, DistrictDisciplineIncidentData, DistrictEnrollmentData,
    StateTruancyData, StateSafetyData, StateHarassmentData, StateRestraintData, StateSeclusionData, StateBullyingData,
    StateBullyingClassificationData, StateBullyingImpactData, StateDisciplineCountData, StateDisciplineIncidentData, StateEnrollmentData,
} from './safety/types';
// Internal to the slice: imported by name and never re-exported.
import {
    categoryMaps, stateDataMaps, safetyDataThunk, safetyTypeThunk, SAFETY_DATA_THUNKS, SAFETY_TYPE_THUNKS,
    type SafetyState, type SafetyTypeCategory,
} from './safety/internal';

export { LoadingState };
// The public interfaces and type aliases live in safety/types.ts; this module path stays the one importers use.
export * from './safety/types';

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

export const fetchSchoolSafetyTypes = safetyTypeThunk('safety/fetchSchoolSafetyTypes', 'schoolSafetyTypes', () => safetyApi.getSchoolSafetyTypes());
// Thunk name is singular; the endpoint is plural.
export const fetchHarassmentClassification = safetyTypeThunk('safety/fetchHarassmentClassification', 'harassmentClassification', () => safetyApi.getHarassmentClassifications());
export const fetchBullyingTypes = safetyTypeThunk('safety/fetchBullyingTypes', 'bullyingTypes', () => safetyApi.getBullyingTypes());
export const fetchBullyingClassificationTypes = safetyTypeThunk('safety/fetchBullyingClassificationTypes', 'bullyingClassificationTypes', () => safetyApi.getBullyingClassificationTypes());
export const fetchBullyingImpactTypes = safetyTypeThunk('safety/fetchBullyingImpactTypes', 'bullyingImpactTypes', () => safetyApi.getBullyingImpactTypes());
export const fetchDisciplineCountTypes = safetyTypeThunk('safety/fetchDisciplineCountTypes', 'disciplineCountTypes', () => safetyApi.getDisciplineCountTypes());
export const fetchDisciplineIncidentTypes = safetyTypeThunk('safety/fetchDisciplineIncidentTypes', 'disciplineIncidentTypes', () => safetyApi.getDisciplineIncidentTypes());

// Truancy, enrollment, seclusion and restraint don't prefetch a type list.
// Every other category fetches its type list first; safety incidents use the school safety types at all three levels.
export const fetchSchoolTruancyData = safetyDataThunk('safety/fetchSchoolTruancyData', 'school', 'truancy',
    (options, forceRefresh) => safetyApi.getSchoolTruancies(options, forceRefresh));

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
    (options, forceRefresh) => safetyApi.getSchoolEnrollment(options, forceRefresh));

// District Level Thunks
export const fetchDistrictTruancyData = safetyDataThunk('safety/fetchDistrictTruancyData', 'district', 'truancy',
    (options, forceRefresh) => safetyApi.getDistrictTruancies(options, forceRefresh));

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
    (options, forceRefresh) => safetyApi.getDistrictEnrollment(options, forceRefresh));

// State Level Thunks
export const fetchStateTruancyData = safetyDataThunk('safety/fetchStateTruancyData', 'state', 'truancy',
    (options, forceRefresh) => safetyApi.getStateTruancies(options, forceRefresh));

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
    (options, forceRefresh) => safetyApi.getStateEnrollment(options, forceRefresh));

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
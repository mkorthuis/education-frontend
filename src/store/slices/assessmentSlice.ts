import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { assessmentsApi } from '@/services/api/endpoints/assessments';
import { fetchGrades, Grade } from '@/store/slices/locationSlice';
import { ALL_GRADES_ID, ALL_STUDENTS_SUBGROUP_ID } from '@/features/district/utils/assessmentDataProcessing';
import { LoadingState, retryFailedLoads, resetFailedStatuses } from '@/store/utils/loadingState';
import { createOptionsKey } from '@/store/utils/cacheKey';
import { createKeyedThunk, addKeyedCases, type ThunkHooks } from '@/store/utils/keyedResource';
import { createTypeListThunk, addTypeListCases } from '@/store/utils/typeLists';
import { makeMemoDataSelector } from '@/store/utils/selectors';

// ================ TYPE DEFINITIONS ================

// Base Types
export interface AssessmentSubject {
  id: number;
  name: string;
  description: string;
}

export interface AssessmentSubgroup {
  id: number;
  name: string;
  description: string | null;
}

// Base Assessment Data Interface
interface BaseAssessmentData {
  id: number;
  year: number;
  assessment_subgroup_id: number;
  assessment_subject_id: number;
  assessment_subgroup?: AssessmentSubgroup;
  assessment_subject?: AssessmentSubject;
  grade_id: number | null;
  grade?: Grade | null;
  total_fay_students_low: number;
  total_fay_students_high: number;
  level_1_percentage: number | null;
  level_1_percentage_exception: string | null;
  level_2_percentage: number | null;
  level_2_percentage_exception: string | null;
  level_3_percentage: number | null;
  level_3_percentage_exception: string | null;
  level_4_percentage: number | null;
  level_4_percentage_exception: string | null;
  above_proficient_percentage: number | null;
  above_proficient_percentage_exception: string | null;
  participate_percentage: number | null;
  mean_sgp: number | null;
  average_score: number | null;
}

// Assessment Data Interfaces
export interface AssessmentDistrictData extends BaseAssessmentData {
  district_id: number;
  school_id: number | null;
  district_name: string;
  school_name: string | null;
}

export interface AssessmentStateData extends BaseAssessmentData {
  district_id: null;
  school_id: null;
  district_name: null;
  school_name: null;
}

export interface AssessmentSchoolData extends BaseAssessmentData {
  district_id: number | null;
  school_id: number;
  district_name: string | null;
  school_name: string;
}

// Parameter Interfaces
export interface BaseAssessmentParams {
  year?: string;
  assessment_subgroup_id?: number;
  assessment_subject_id?: number;
  grade_id?: number;
  forceRefresh?: boolean;
}

export interface FetchAssessmentDistrictDataParams extends BaseAssessmentParams {
  district_id?: number;
}

export interface FetchAssessmentStateDataParams extends BaseAssessmentParams {
  // No additional fields needed
}

export interface FetchAssessmentSchoolDataParams extends BaseAssessmentParams {
  school_id?: string;
}

// Query Key Types
export type AssessmentDataQueryKey = string;

// Response Types
interface AssessmentDataResponse<T, P> {
  params: Omit<P, 'forceRefresh'>;
  data: T[];
}

export type DistrictDataResponse = AssessmentDataResponse<AssessmentDistrictData, FetchAssessmentDistrictDataParams>;
export type StateDataResponse = AssessmentDataResponse<AssessmentStateData, FetchAssessmentStateDataParams>;
export type SchoolDataResponse = AssessmentDataResponse<AssessmentSchoolData, FetchAssessmentSchoolDataParams>;

type AssessmentCategory = 'state' | 'district' | 'school';
type AssessmentTypeCategory = 'subjects' | 'subgroups';

// ================ STATE INTERFACE ================

export interface AssessmentState {
  dataLoadingStatus: Record<AssessmentCategory, Record<string, LoadingState>>;
  typeLoadingStatus: Record<AssessmentTypeCategory, LoadingState>;

  stateData: Record<string, AssessmentStateData[]>;
  districtData: Record<string, AssessmentDistrictData[]>;
  schoolData: Record<string, AssessmentSchoolData[]>;

  subjects: AssessmentSubject[];
  subgroups: AssessmentSubgroup[];
    
  currentDistrictKey: AssessmentDataQueryKey | null;
  currentStateKey: AssessmentDataQueryKey | null;
  currentSchoolKey: AssessmentDataQueryKey | null;
  
  // Selected IDs
  selectedSubjectId: number | null;
  selectedGradeId: number | null;
  selectedSubgroupId: number | null;
}

// ================ INITIAL STATE ================

const initialState: AssessmentState = {
  dataLoadingStatus: {
    state: {},
    district: {},
    school: {},
  },
  typeLoadingStatus: {
    subjects: LoadingState.IDLE,
    subgroups: LoadingState.IDLE,
  },

  stateData: {},
  districtData: {},
  schoolData: {},

  subjects: [],
  subgroups: [],

  currentDistrictKey: null,
  currentStateKey: null,
  currentSchoolKey: null,
  
  selectedSubjectId: null,
  selectedGradeId: ALL_GRADES_ID,
  selectedSubgroupId: ALL_STUDENTS_SUBGROUP_ID
};

// ================ HELPER FUNCTIONS ================

// Helper function to enrich assessment data with related objects
const enrichAssessmentData = <T extends BaseAssessmentData>(
  data: T[], 
  subjects: AssessmentSubject[], 
  subgroups: AssessmentSubgroup[],
  grades: Grade[]
): T[] => {
  // Create lookup maps for subjects and subgroups
  const subjectsMap = subjects.reduce((acc, subject) => {
    acc[subject.id] = subject;
    return acc;
  }, {} as Record<number, AssessmentSubject>);

  const subgroupsMap = subgroups.reduce((acc, subgroup) => {
    acc[subgroup.id] = subgroup;
    return acc;
  }, {} as Record<number, AssessmentSubgroup>);
  
  // Create lookup map for grades
  const gradesMap = grades.reduce((acc, grade) => {
    // Convert string id to number for mapping
    acc[Number(grade.id)] = grade;
    return acc;
  }, {} as Record<number, Grade>);
  
  // Enrich each item with its related objects
  return data.map(item => {
    // Create a new object with all properties except the specified IDs
    const { 
      grade_id, 
      assessment_subgroup_id, 
      assessment_subject_id, 
      ...rest 
    } = item;
    
    // Return new object with related objects added but without the ID fields
    return {
      ...rest,
      // Add the related objects
      assessment_subject: subjectsMap[assessment_subject_id],
      assessment_subgroup: subgroupsMap[assessment_subgroup_id],
      // Add grade if grade_id exists
      grade: grade_id !== null ? gradesMap[grade_id] : null
    } as T; // Cast back to the original type
  });
};

// ================ ASYNC THUNKS ================

// Async thunk for fetching assessment subjects
export const fetchAssessmentSubjects = createTypeListThunk<any>('assessment/fetchAssessmentSubjects', () => assessmentsApi.getAssessmentSubjects(),
  (getState) => (getState() as RootState).assessment.typeLoadingStatus.subjects);

// Async thunk for fetching assessment subgroups
export const fetchAssessmentSubgroups = createTypeListThunk<any>('assessment/fetchAssessmentSubgroups', () => assessmentsApi.getAssessmentSubgroups(),
  (getState) => (getState() as RootState).assessment.typeLoadingStatus.subgroups);

// Helper to ensure assessment reference data is loaded
export const ensureTypesLoaded = async (state: RootState, dispatch: any) => {
  const assessmentState = state.assessment;
  const { grades } = state.location;
  
  const promises = [];
  
  if (assessmentState.typeLoadingStatus.subjects === LoadingState.IDLE && assessmentState.subjects.length === 0) 
    promises.push(dispatch(fetchAssessmentSubjects()));
  if (assessmentState.typeLoadingStatus.subgroups === LoadingState.IDLE && assessmentState.subgroups.length === 0) 
    promises.push(dispatch(fetchAssessmentSubgroups()));
  
  // Also ensure grades are loaded from location slice
  if (!grades || grades.length === 0) {
    promises.push(dispatch(fetchGrades(false)));
  }
  
  if (promises.length > 0) await Promise.all(promises);
};

// Reference data is always awaited before the request (ensureTypesLoaded returns a promise even when it starts nothing).
const awaitTypes = ({ getState, dispatch }: ThunkHooks) => ensureTypesLoaded(getState() as RootState, dispatch);

// Enrichment reads subjects, subgroups and grades from the state as it is after the request.
const enrichFromState = <T>(rawData: any, getState: () => unknown) => {
  const state = getState() as RootState;
  return enrichAssessmentData(
    rawData as unknown as BaseAssessmentData[],
    state.assessment.subjects,
    state.assessment.subgroups,
    state.location.grades
  ) as unknown as T[];
};

// Async thunk for fetching assessment district data
export const fetchAssessmentDistrictData = createKeyedThunk<FetchAssessmentDistrictDataParams, AssessmentDistrictData>('assessment/fetchAssessmentDistrictData', {
  before: awaitTypes,
  status: (getState, key) => (getState() as RootState).assessment.dataLoadingStatus.district[key],
  request: (options, forceRefresh) => assessmentsApi.getAssessmentDistrictData(options, forceRefresh),
  transform: (rawData, getState) => enrichFromState<AssessmentDistrictData>(rawData, getState),
});

// Async thunk for fetching assessment state data
export const fetchAssessmentStateData = createKeyedThunk<FetchAssessmentStateDataParams, AssessmentStateData>('assessment/fetchAssessmentStateData', {
  before: awaitTypes,
  status: (getState, key) => (getState() as RootState).assessment.dataLoadingStatus.state[key],
  request: (options, forceRefresh) => assessmentsApi.getAssessmentStateData(options, forceRefresh),
  transform: (rawData, getState) => enrichFromState<AssessmentStateData>(rawData, getState),
});

// Async thunk for fetching assessment school data
export const fetchAssessmentSchoolData = createKeyedThunk<FetchAssessmentSchoolDataParams, AssessmentSchoolData>('assessment/fetchAssessmentSchoolData', {
  before: awaitTypes,
  status: (getState, key) => (getState() as RootState).assessment.dataLoadingStatus.school[key],
  request: (options, forceRefresh) => assessmentsApi.getAssessmentSchoolData(options, forceRefresh),
  transform: (rawData, getState) => enrichFromState<AssessmentSchoolData>(rawData, getState),
});

// ================ SLICE DEFINITION ================

export const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,
  reducers: {
    clearAssessments: (state) => initialState,
    clearDistrictData: (state) => {
      state.districtData = {};
      state.dataLoadingStatus.district = {};
      state.currentDistrictKey = null;
    },
    clearStateData: (state) => {
      state.stateData = {};
      state.dataLoadingStatus.state = {};
      state.currentStateKey = null;
    },
    clearSchoolData: (state) => {
      state.schoolData = {};
      state.dataLoadingStatus.school = {};
      state.currentSchoolKey = null;
    },
    setCurrentDistrictDataKey: (state, action: PayloadAction<AssessmentDataQueryKey>) => {
      state.currentDistrictKey = action.payload;
    },
    setCurrentStateDataKey: (state, action: PayloadAction<AssessmentDataQueryKey>) => {
      state.currentStateKey = action.payload;
    },
    setCurrentSchoolDataKey: (state, action: PayloadAction<AssessmentDataQueryKey>) => {
      state.currentSchoolKey = action.payload;
    },
    setSelectedSubjectId: (state, action: PayloadAction<number | null>) => {
      state.selectedSubjectId = action.payload;
    },
    setSelectedGradeId: (state, action: PayloadAction<number | null>) => {
      state.selectedGradeId = action.payload;
    },
    setSelectedSubgroupId: (state, action: PayloadAction<number | null>) => {
      state.selectedSubgroupId = action.payload;
    },
    // Add new action to reset all filters
    resetFilters: (state) => {
      state.selectedGradeId = ALL_GRADES_ID;
      state.selectedSubgroupId = ALL_STUDENTS_SUBGROUP_ID;
    },
    // Reset a FAILED data load back to IDLE so the page's fetch effect requests it again
    resetFailedAssessmentLoad: (state, action: PayloadAction<{ category: AssessmentCategory; params: BaseAssessmentParams & Record<string, any> }>) => {
      const {forceRefresh = false, ...options} = action.payload.params;
      const key = createOptionsKey(options);
      if (state.dataLoadingStatus[action.payload.category][key] === LoadingState.FAILED) {
        state.dataLoadingStatus[action.payload.category][key] = LoadingState.IDLE;
      }
    },
  },
  extraReducers: (builder) => {
    addTypeListCases(builder, fetchAssessmentSubjects, 'subjects');
    addTypeListCases(builder, fetchAssessmentSubgroups, 'subgroups');

    addKeyedCases(builder, fetchAssessmentDistrictData, {
      data: (state) => state.districtData,
      status: (state) => state.dataLoadingStatus.district,
    });
    // Only the state fetch records its key as current; the district and school pages set theirs after the fetch resolves.
    addKeyedCases(builder, fetchAssessmentStateData, {
      data: (state) => state.stateData,
      status: (state) => state.dataLoadingStatus.state,
      onFulfilled: (state, payload) => { state.currentStateKey = payload.key; },
    });
    addKeyedCases(builder, fetchAssessmentSchoolData, {
      data: (state) => state.schoolData,
      status: (state) => state.dataLoadingStatus.school,
    });

    // Retry on a page's load error: failed requests go back to IDLE so the page requests them again
    builder.addCase(retryFailedLoads, (state) => {
      resetFailedStatuses(state.dataLoadingStatus);
      resetFailedStatuses(state.typeLoadingStatus);
    });
  },
});

// ================ EXPORTS ================

// Export actions
export const { 
  clearAssessments, 
  clearDistrictData,
  clearStateData,
  clearSchoolData,
  setCurrentDistrictDataKey,
  setCurrentStateDataKey,
  setCurrentSchoolDataKey,
  setSelectedSubjectId,
  setSelectedGradeId,
  setSelectedSubgroupId,
  resetFilters,
  resetFailedAssessmentLoad
} = assessmentSlice.actions;

// ================ SELECTORS ================


export const selectAssessmentStateLoadingStatus = (state: RootState, params: FetchAssessmentStateDataParams) => {
  const {forceRefresh = false, ...options} = params;
  const key = createOptionsKey(options);
  return state.assessment.dataLoadingStatus.state[key] || LoadingState.IDLE;
}
export const selectAssessmentDistrictLoadingStatus = (state: RootState, params: FetchAssessmentDistrictDataParams) => {
  const {forceRefresh = false, ...options} = params;
  const key = createOptionsKey(options);
  return state.assessment.dataLoadingStatus.district[key] || LoadingState.IDLE;
}
export const selectAssessmentSchoolLoadingStatus = (state: RootState, params: FetchAssessmentSchoolDataParams) => { 
  const {forceRefresh = false, ...options} = params;
  const key = createOptionsKey(options);
  return state.assessment.dataLoadingStatus.school[key] || LoadingState.IDLE;
}

export const selectAssessmentSubgroups = (state: RootState) => state.assessment.subgroups || [];

export const selectCurrentAssessmentStateData = createSelector(
  [(state: RootState) => state.assessment.currentStateKey, 
   (state: RootState) => state.assessment.stateData],
  (currentKey, stateData) => {
    return currentKey ? stateData[currentKey] || [] : [];
  }
);

export const selectCurrentAssessmentDistrictData = createSelector(
  [(state: RootState) => state.assessment.currentDistrictKey, 
   (state: RootState) => state.assessment.districtData],
  (currentKey, districtData) => {
    return currentKey ? districtData[currentKey] || [] : [];
  }
);

export const selectCurrentAssessmentSchoolData = createSelector(
  [(state: RootState) => state.assessment.currentSchoolKey, 
   (state: RootState) => state.assessment.schoolData],
  (currentKey, schoolData) => {
    return currentKey ? schoolData[currentKey] || [] : [];
  }
);

export const selectAssessmentStateData = makeMemoDataSelector<RootState, FetchAssessmentStateDataParams, AssessmentStateData>(state => state.assessment.stateData);

export const selectAssessmentDistrictData = makeMemoDataSelector<RootState, FetchAssessmentDistrictDataParams, AssessmentDistrictData>(state => state.assessment.districtData);

export const selectAssessmentSchoolData = makeMemoDataSelector<RootState, FetchAssessmentSchoolDataParams, AssessmentSchoolData>(state => state.assessment.schoolData);

// Selected subject selectors
export const selectSelectedSubjectId = (state: RootState) => state.assessment.selectedSubjectId;
export const selectSelectedSubject = (state: RootState) => {
  const selectedId = state.assessment.selectedSubjectId;
  if (selectedId === null) return null;
  return state.assessment.subjects.find(subject => subject.id === selectedId) || null;
};
export const selectSelectedGradeId = (state: RootState) => state.assessment.selectedGradeId;
export const selectSelectedSubgroupId = (state: RootState) => state.assessment.selectedSubgroupId;


// Export reducer
export default assessmentSlice.reducer;

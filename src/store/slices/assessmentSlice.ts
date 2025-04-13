import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import { RootState } from '@/store/store';
import { assessmentsApi } from '@/services/api/endpoints/assessments';
import { fetchGrades, Grade } from '@/store/slices/locationSlice';
import { ALL_GRADES_ID, ALL_STUDENTS_SUBGROUP_ID } from '@/features/district/utils/assessmentDataProcessing';
import { LoadingState } from './safetySlice';

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
  school_id: string;
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
  
  // Error State
  error: string | null;
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
  selectedSubgroupId: ALL_STUDENTS_SUBGROUP_ID,
  
  error: null
};

// ================ HELPER FUNCTIONS ================

// Generic key creation function
const createOptionsKey = (params: Record<string, any>): string => {
  const sortedParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  
  const keyString = sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
  // Ensure we never return an empty string as a key
  return keyString || '_default';
};

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
export const fetchAssessmentSubjects = createAsyncThunk(
  'assessment/fetchAssessmentSubjects',
  async (_, { rejectWithValue }) => {
    try {
      return await assessmentsApi.getAssessmentSubjects();
    } catch (error : any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching assessment subgroups
export const fetchAssessmentSubgroups = createAsyncThunk(
  'assessment/fetchAssessmentSubgroups',
  async (_, { rejectWithValue }) => {
    try {
      return await assessmentsApi.getAssessmentSubgroups();
    } catch (error : any) {
      return rejectWithValue(error.message);
    }
  }
);

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

// Async thunk for fetching assessment district data
export const fetchAssessmentDistrictData = createAsyncThunk(
  'assessment/fetchAssessmentDistrictData',
  async (params: FetchAssessmentDistrictDataParams, { rejectWithValue, dispatch, getState }) => {
    try {
      
      const {forceRefresh = false, ...options} = params;
      await ensureTypesLoaded(getState() as RootState, dispatch);

      const key = createOptionsKey(options);
      const rawData = await assessmentsApi.getAssessmentDistrictData(options, forceRefresh);
      
      const state = getState() as RootState;
      const data = enrichAssessmentData(
        rawData as unknown as BaseAssessmentData[], 
        state.assessment.subjects, 
        state.assessment.subgroups,
        state.location.grades
      ) as unknown as AssessmentDistrictData[];
      
      return { key, data };
    } catch (error : any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching assessment state data
export const fetchAssessmentStateData = createAsyncThunk(
  'assessment/fetchAssessmentStateData',
  async (params: FetchAssessmentStateDataParams, { rejectWithValue, dispatch, getState }) => {
    try {
      const {forceRefresh = false, ...options} = params;
      await ensureTypesLoaded(getState() as RootState, dispatch);
      const key = createOptionsKey(options);
      const rawData = await assessmentsApi.getAssessmentStateData(options, forceRefresh);
      
      const state = getState() as RootState;
      const data = enrichAssessmentData(
        rawData as unknown as BaseAssessmentData[], 
        state.assessment.subjects, 
        state.assessment.subgroups,
        state.location.grades
      ) as unknown as AssessmentStateData[];
      
      return {key, data };
    } catch (error : any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching assessment state data
export const fetchAssessmentSchoolData = createAsyncThunk(
  'assessment/fetchAssessmentSchoolData',
  async (params: FetchAssessmentSchoolDataParams, { rejectWithValue, dispatch, getState }) => {
    try {
      const {forceRefresh = false, ...options} = params;
      await ensureTypesLoaded(getState() as RootState, dispatch);
      const key = createOptionsKey(options);
      const rawData = await assessmentsApi.getAssessmentSchoolData(options, forceRefresh);
      
      const state = getState() as RootState;
      const data = enrichAssessmentData(
        rawData as unknown as BaseAssessmentData[], 
        state.assessment.subjects, 
        state.assessment.subgroups,
        state.location.grades
      ) as unknown as AssessmentSchoolData[];
      
      return {key, data };
    } catch (error : any) {
      return rejectWithValue(error.message);
    }
  }
);

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
  },
  extraReducers: (builder) => {

    builder
      .addCase(fetchAssessmentSubjects.pending, (state) => {
        state.typeLoadingStatus.subjects = LoadingState.LOADING;
      })
      .addCase(fetchAssessmentSubjects.fulfilled, (state, action) => {
        state.subjects = action.payload;
        state.typeLoadingStatus.subjects = LoadingState.SUCCEEDED;
      })
      .addCase(fetchAssessmentSubjects.rejected, (state, action) => {
        state.typeLoadingStatus.subjects = LoadingState.FAILED;
      })
      
      .addCase(fetchAssessmentSubgroups.pending, (state) => {
        state.typeLoadingStatus.subgroups = LoadingState.LOADING;
      })
      .addCase(fetchAssessmentSubgroups.fulfilled, (state, action) => {
        state.subgroups = action.payload;
        state.typeLoadingStatus.subgroups = LoadingState.SUCCEEDED;
      })
      .addCase(fetchAssessmentSubgroups.rejected, (state, action) => {
        state.typeLoadingStatus.subgroups = LoadingState.FAILED;
      })
      
      .addCase(fetchAssessmentDistrictData.pending, (state, action) => {
        const key = createOptionsKey(action.meta.arg);
        state.dataLoadingStatus.district[key] = LoadingState.LOADING;
      })
      .addCase(fetchAssessmentDistrictData.fulfilled, (state, action) => {
        state.districtData[action.payload.key] = action.payload.data;
        state.dataLoadingStatus.district[action.payload.key] = LoadingState.SUCCEEDED;
      })
      .addCase(fetchAssessmentDistrictData.rejected, (state, action) => {
        const key = createOptionsKey(action.meta.arg);
        state.dataLoadingStatus.district[key] = LoadingState.FAILED;
      })
      
      .addCase(fetchAssessmentStateData.pending, (state, action) => {
        const key = createOptionsKey(action.meta.arg);
        state.dataLoadingStatus.state[key] = LoadingState.LOADING;
      })
      .addCase(fetchAssessmentStateData.fulfilled, (state, action) => {
        state.stateData[action.payload.key] = action.payload.data;
        state.currentStateKey = action.payload.key;
        state.dataLoadingStatus.state[action.payload.key] = LoadingState.SUCCEEDED;
      })
      .addCase(fetchAssessmentStateData.rejected, (state, action) => {
        const key = createOptionsKey(action.meta.arg);
        state.dataLoadingStatus.state[key] = LoadingState.FAILED;
      })
      
      // Handle fetchAssessmentSchoolData
      .addCase(fetchAssessmentSchoolData.pending, (state, action) => {
        const key = createOptionsKey(action.meta.arg);
        state.dataLoadingStatus.school[key] = LoadingState.LOADING;
      })
      .addCase(fetchAssessmentSchoolData.fulfilled, (state, action) => {
        state.schoolData[action.payload.key] = action.payload.data;
        state.dataLoadingStatus.school[action.payload.key] = LoadingState.SUCCEEDED;
      })
      .addCase(fetchAssessmentSchoolData.rejected, (state, action) => {
        const key = createOptionsKey(action.meta.arg);
        state.dataLoadingStatus.school[key] = LoadingState.FAILED;
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
  resetFilters
} = assessmentSlice.actions;

// ================ SELECTORS ================


export const selectAssessmentSubjectsLoadingStatus = (state: RootState) => state.assessment.typeLoadingStatus.subjects;
export const selectAssessmentSubgroupsLoadingStatus = (state: RootState) => state.assessment.typeLoadingStatus.subgroups;

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

export const selectAssessmentSubjects = (state: RootState) => state.assessment.subjects || [];
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

export const selectAssessmentStateData = createSelector(
  [(state: RootState) => state.assessment.stateData,
   (_: RootState, params: FetchAssessmentStateDataParams) => {
     const {forceRefresh = false, ...options} = params;
     return createOptionsKey(options);
   }],
  (stateData, key) => stateData[key] || []
);

export const selectAssessmentDistrictData = createSelector(
  [(state: RootState) => state.assessment.districtData,
   (_: RootState, params: FetchAssessmentDistrictDataParams) => {
     const {forceRefresh = false, ...options} = params;
     return createOptionsKey(options);
   }],
  (districtData, key) => districtData[key] || []
);

export const selectAssessmentSchoolData = createSelector(
  [(state: RootState) => state.assessment.schoolData,
   (_: RootState, params: FetchAssessmentSchoolDataParams) => {
     const {forceRefresh = false, ...options} = params;
     return createOptionsKey(options);
   }],
  (schoolData, key) => schoolData[key] || []
);

export const selectAssessmentError = (state: RootState) => state.assessment.error;

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

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { assessmentsApi } from '@/services/api/endpoints/assessments';
import { fetchGrades, Grade } from '@/store/slices/locationSlice';

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
  assessment_subgroup_id?: string;
  assessment_subject_id?: string;
  grade_id?: string;
  forceRefresh?: boolean;
}

export interface FetchAssessmentDistrictDataParams extends BaseAssessmentParams {
  district_id: string;
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

// ================ STATE INTERFACE ================

export interface AssessmentState {
  subjects: AssessmentSubject[];
  subgroups: AssessmentSubgroup[];
  
  // Data Maps
  districtDataMap: Record<AssessmentDataQueryKey, DistrictDataResponse>;
  stateDataMap: Record<AssessmentDataQueryKey, StateDataResponse>;
  schoolDataMap: Record<AssessmentDataQueryKey, SchoolDataResponse>;
  
  // Current Keys
  currentDistrictDataKey: AssessmentDataQueryKey | null;
  currentStateDataKey: AssessmentDataQueryKey | null;
  currentSchoolDataKey: AssessmentDataQueryKey | null;
  
  // Loading States
  loading: boolean;
  loadingStates: {
    subjects: boolean;
    subgroups: boolean;
    districtData: boolean;
    stateData: boolean;
    schoolData: boolean;
  };
  
  // Status Flags
  subjectsLoaded: boolean;
  subgroupsLoaded: boolean;
  
  // Error State
  error: string | null;
}

// ================ INITIAL STATE ================

const initialState: AssessmentState = {
  subjects: [],
  subgroups: [],
  districtDataMap: {},
  stateDataMap: {},
  schoolDataMap: {},
  currentDistrictDataKey: null,
  currentStateDataKey: null,
  currentSchoolDataKey: null,
  loading: false,
  loadingStates: {
    subjects: false,
    subgroups: false,
    districtData: false,
    stateData: false,
    schoolData: false
  },
  subjectsLoaded: false,
  subgroupsLoaded: false,
  error: null
};

// ================ HELPER FUNCTIONS ================

// Generic key creation function
const createQueryKey = (params: Record<string, any>): AssessmentDataQueryKey => {
  const sortedParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  
  return sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
};

// Error handler function for thunks
const handleApiError = (error: any, errorMessage: string) => {
  console.error(errorMessage, error);
  return errorMessage;
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
    // Create a new object that preserves all original properties
    return {
      ...item,
      // Add the related objects
      assessment_subject: subjectsMap[item.assessment_subject_id],
      assessment_subgroup: subgroupsMap[item.assessment_subgroup_id],
      // Add grade if grade_id exists
      grade: item.grade_id !== null ? gradesMap[item.grade_id] : null
    } as T; // Cast back to the original type
  });
};

// ================ ASYNC THUNKS ================

// Async thunk for fetching assessment subjects
export const fetchAssessmentSubjects = createAsyncThunk(
  'assessment/fetchAssessmentSubjects',
  async (forceRefresh: boolean = false, { rejectWithValue }) => {
    try {
      const subjects = await assessmentsApi.getAssessmentSubjects(forceRefresh);
      return subjects;
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch assessment subjects'));
    }
  }
);

// Async thunk for fetching assessment subgroups
export const fetchAssessmentSubgroups = createAsyncThunk(
  'assessment/fetchAssessmentSubgroups',
  async (forceRefresh: boolean = false, { rejectWithValue }) => {
    try {
      const subgroups = await assessmentsApi.getAssessmentSubgroups(forceRefresh);
      return subgroups;
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch assessment subgroups'));
    }
  }
);

// Helper to ensure assessment reference data is loaded
export const ensureAssessmentDataLoaded = async (state: RootState, dispatch: any) => {
  const { subjectsLoaded, subgroupsLoaded } = state.assessment;
  const { grades } = state.location;
  
  const promises = [];
  
  if (!subjectsLoaded) promises.push(dispatch(fetchAssessmentSubjects(false)));
  if (!subgroupsLoaded) promises.push(dispatch(fetchAssessmentSubgroups(false)));
  
  // Also ensure grades are loaded from location slice
  if (!grades || grades.length === 0) {
    promises.push(dispatch(fetchGrades(false)));
  }
  
  if (promises.length > 0) await Promise.all(promises);
};

// Async thunk for fetching assessment district data
export const fetchAssessmentDistrictData = createAsyncThunk<
  { key: string; params: Omit<FetchAssessmentDistrictDataParams, 'forceRefresh'>; data: AssessmentDistrictData[] },
  FetchAssessmentDistrictDataParams
>(
  'assessment/fetchAssessmentDistrictData',
  async (params: FetchAssessmentDistrictDataParams, { rejectWithValue, dispatch, getState }) => {
    try {
      await ensureAssessmentDataLoaded(getState() as RootState, dispatch);
      
      const { forceRefresh = false, ...queryParams } = params;
      const districtData = await assessmentsApi.getAssessmentDistrictData(forceRefresh, queryParams);
      const queryKey = createQueryKey(queryParams);
      
      // Type-safe access to state
      const state = getState() as RootState;
      const enrichedData = enrichAssessmentData(
        districtData as unknown as BaseAssessmentData[], 
        state.assessment.subjects, 
        state.assessment.subgroups,
        state.location.grades
      ) as unknown as AssessmentDistrictData[];
      
      return {
        key: queryKey,
        params: queryParams,
        data: enrichedData
      };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch assessment district data'));
    }
  }
);

// Async thunk for fetching assessment state data
export const fetchAssessmentStateData = createAsyncThunk<
  { key: string; params: Omit<FetchAssessmentStateDataParams, 'forceRefresh'>; data: AssessmentStateData[] },
  FetchAssessmentStateDataParams
>(
  'assessment/fetchAssessmentStateData',
  async (params: FetchAssessmentStateDataParams, { rejectWithValue, dispatch, getState }) => {
    try {
      await ensureAssessmentDataLoaded(getState() as RootState, dispatch);
      
      const { forceRefresh = false, ...queryParams } = params;
      const stateData = await assessmentsApi.getAssessmentStateData(forceRefresh, queryParams);
      const queryKey = createQueryKey(queryParams);
      
      // Type-safe access to state
      const state = getState() as RootState;
      const enrichedData = enrichAssessmentData(
        stateData as unknown as BaseAssessmentData[], 
        state.assessment.subjects, 
        state.assessment.subgroups,
        state.location.grades
      ) as unknown as AssessmentStateData[];
      
      return {
        key: queryKey,
        params: queryParams,
        data: enrichedData
      };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch assessment state data'));
    }
  }
);

// Async thunk for fetching assessment school data
export const fetchAssessmentSchoolData = createAsyncThunk<
  { key: string; params: Omit<FetchAssessmentSchoolDataParams, 'forceRefresh'>; data: AssessmentSchoolData[] },
  FetchAssessmentSchoolDataParams
>(
  'assessment/fetchAssessmentSchoolData',
  async (params: FetchAssessmentSchoolDataParams, { rejectWithValue, dispatch, getState }) => {
    try {
      await ensureAssessmentDataLoaded(getState() as RootState, dispatch);
      
      const { forceRefresh = false, ...queryParams } = params;
      const schoolData = await assessmentsApi.getAssessmentSchoolData(forceRefresh, queryParams);
      const queryKey = createQueryKey(queryParams);
      
      // Type-safe access to state
      const state = getState() as RootState;
      const enrichedData = enrichAssessmentData(
        schoolData as unknown as BaseAssessmentData[], 
        state.assessment.subjects, 
        state.assessment.subgroups,
        state.location.grades
      ) as unknown as AssessmentSchoolData[];
      
      return {
        key: queryKey,
        params: queryParams,
        data: enrichedData
      };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch assessment school data'));
    }
  }
);

// ================ SLICE DEFINITION ================

export const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,
  reducers: {
    clearAssessments: (state) => {
      state.subjects = [];
      state.subgroups = [];
      state.districtDataMap = {};
      state.stateDataMap = {};
      state.schoolDataMap = {};
      state.currentDistrictDataKey = null;
      state.currentStateDataKey = null;
      state.currentSchoolDataKey = null;
      state.error = null;
    },
    clearDistrictData: (state) => {
      state.districtDataMap = {};
      state.currentDistrictDataKey = null;
    },
    clearStateData: (state) => {
      state.stateDataMap = {};
      state.currentStateDataKey = null;
    },
    clearSchoolData: (state) => {
      state.schoolDataMap = {};
      state.currentSchoolDataKey = null;
    },
    setCurrentDistrictDataKey: (state, action: PayloadAction<AssessmentDataQueryKey>) => {
      state.currentDistrictDataKey = action.payload;
    },
    setCurrentStateDataKey: (state, action: PayloadAction<AssessmentDataQueryKey>) => {
      state.currentStateDataKey = action.payload;
    },
    setCurrentSchoolDataKey: (state, action: PayloadAction<AssessmentDataQueryKey>) => {
      state.currentSchoolDataKey = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Helper function to update loading states
    const updateLoadingState = (state: AssessmentState) => {
      state.loading = Object.values(state.loadingStates).some(isLoading => isLoading);
    };

    // Handle fetchAssessmentSubjects
    builder
      .addCase(fetchAssessmentSubjects.pending, (state) => {
        state.loadingStates.subjects = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssessmentSubjects.fulfilled, (state, action) => {
        state.subjects = action.payload;
        state.subjectsLoaded = true;
        state.loadingStates.subjects = false;
        updateLoadingState(state);
      })
      .addCase(fetchAssessmentSubjects.rejected, (state, action) => {
        state.loadingStates.subjects = false;
        updateLoadingState(state);
        state.error = action.payload as string;
      })
      
      // Handle fetchAssessmentSubgroups
      .addCase(fetchAssessmentSubgroups.pending, (state) => {
        state.loadingStates.subgroups = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssessmentSubgroups.fulfilled, (state, action) => {
        state.subgroups = action.payload;
        state.subgroupsLoaded = true;
        state.loadingStates.subgroups = false;
        updateLoadingState(state);
      })
      .addCase(fetchAssessmentSubgroups.rejected, (state, action) => {
        state.loadingStates.subgroups = false;
        updateLoadingState(state);
        state.error = action.payload as string;
      })
      
      // Handle fetchAssessmentDistrictData
      .addCase(fetchAssessmentDistrictData.pending, (state) => {
        state.loadingStates.districtData = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssessmentDistrictData.fulfilled, (state, action) => {
        const { key, params, data } = action.payload;
        state.districtDataMap[key] = { params, data };
        state.currentDistrictDataKey = key;
        state.loadingStates.districtData = false;
        updateLoadingState(state);
      })
      .addCase(fetchAssessmentDistrictData.rejected, (state, action) => {
        state.loadingStates.districtData = false;
        updateLoadingState(state);
        state.error = action.payload as string;
      })
      
      // Handle fetchAssessmentStateData
      .addCase(fetchAssessmentStateData.pending, (state) => {
        state.loadingStates.stateData = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssessmentStateData.fulfilled, (state, action) => {
        const { key, params, data } = action.payload;
        state.stateDataMap[key] = { params, data };
        state.currentStateDataKey = key;
        state.loadingStates.stateData = false;
        updateLoadingState(state);
      })
      .addCase(fetchAssessmentStateData.rejected, (state, action) => {
        state.loadingStates.stateData = false;
        updateLoadingState(state);
        state.error = action.payload as string;
      })
      
      // Handle fetchAssessmentSchoolData
      .addCase(fetchAssessmentSchoolData.pending, (state) => {
        state.loadingStates.schoolData = true;
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssessmentSchoolData.fulfilled, (state, action) => {
        const { key, params, data } = action.payload;
        state.schoolDataMap[key] = { params, data };
        state.currentSchoolDataKey = key;
        state.loadingStates.schoolData = false;
        updateLoadingState(state);
      })
      .addCase(fetchAssessmentSchoolData.rejected, (state, action) => {
        state.loadingStates.schoolData = false;
        updateLoadingState(state);
        state.error = action.payload as string;
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
  setCurrentSchoolDataKey
} = assessmentSlice.actions;

// ================ SELECTORS ================

// Reference data selectors
export const selectAssessmentSubjects = (state: RootState) => state.assessment.subjects || [];
export const selectAssessmentSubgroups = (state: RootState) => state.assessment.subgroups || [];

// Current data selectors
export const selectCurrentAssessmentDistrictData = (state: RootState) => {
  const { currentDistrictDataKey, districtDataMap } = state.assessment;
  return (currentDistrictDataKey && districtDataMap[currentDistrictDataKey]?.data) || [];
};

export const selectCurrentAssessmentStateData = (state: RootState) => {
  const { currentStateDataKey, stateDataMap } = state.assessment;
  return (currentStateDataKey && stateDataMap[currentStateDataKey]?.data) || [];
};

export const selectCurrentAssessmentSchoolData = (state: RootState) => {
  const { currentSchoolDataKey, schoolDataMap } = state.assessment;
  return (currentSchoolDataKey && schoolDataMap[currentSchoolDataKey]?.data) || [];
};

// Data selectors by key
export const selectAssessmentDistrictDataByKey = (key: AssessmentDataQueryKey) => (state: RootState) => 
  state.assessment.districtDataMap[key]?.data || [];

export const selectAssessmentStateDataByKey = (key: AssessmentDataQueryKey) => (state: RootState) => 
  state.assessment.stateDataMap[key]?.data || [];

export const selectAssessmentSchoolDataByKey = (key: AssessmentDataQueryKey) => (state: RootState) => 
  state.assessment.schoolDataMap[key]?.data || [];

// Data selectors by params
export const selectAssessmentDistrictDataByParams = (params: Omit<FetchAssessmentDistrictDataParams, 'forceRefresh'>) => (state: RootState) => {
  const key = createQueryKey(params);
  return state.assessment.districtDataMap[key]?.data || [];
};

export const selectAssessmentStateDataByParams = (params: Omit<FetchAssessmentStateDataParams, 'forceRefresh'>) => (state: RootState) => {
  const key = createQueryKey(params);
  return state.assessment.stateDataMap[key]?.data || [];
};

export const selectAssessmentSchoolDataByParams = (params: Omit<FetchAssessmentSchoolDataParams, 'forceRefresh'>) => (state: RootState) => {
  const key = createQueryKey(params);
  return state.assessment.schoolDataMap[key]?.data || [];
};

// Map selectors
export const selectAllDistrictDataMap = (state: RootState) => state.assessment.districtDataMap;
export const selectAllStateDataMap = (state: RootState) => state.assessment.stateDataMap;
export const selectAllSchoolDataMap = (state: RootState) => state.assessment.schoolDataMap;

// Current key selectors
export const selectCurrentDistrictDataKey = (state: RootState) => state.assessment.currentDistrictDataKey;
export const selectCurrentStateDataKey = (state: RootState) => state.assessment.currentStateDataKey;
export const selectCurrentSchoolDataKey = (state: RootState) => state.assessment.currentSchoolDataKey;

// Loading state selectors
export const selectAssessmentLoading = (state: RootState) => state.assessment.loading;
export const selectAssessmentSubjectsLoading = (state: RootState) => state.assessment.loadingStates.subjects;
export const selectAssessmentSubgroupsLoading = (state: RootState) => state.assessment.loadingStates.subgroups;
export const selectAssessmentDistrictDataLoading = (state: RootState) => state.assessment.loadingStates.districtData;
export const selectAssessmentStateDataLoading = (state: RootState) => state.assessment.loadingStates.stateData;
export const selectAssessmentSchoolDataLoading = (state: RootState) => state.assessment.loadingStates.schoolData;

// Status selectors
export const selectSubjectsLoaded = (state: RootState) => state.assessment.subjectsLoaded;
export const selectSubgroupsLoaded = (state: RootState) => state.assessment.subgroupsLoaded;
export const selectAssessmentError = (state: RootState) => state.assessment.error;

// General loading state
export const selectAnyAssessmentLoading = (state: RootState) => 
  Object.values(state.assessment.loadingStates).some(isLoading => isLoading);

// Export reducer
export default assessmentSlice.reducer;

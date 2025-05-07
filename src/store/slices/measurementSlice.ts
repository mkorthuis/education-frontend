import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { measurementApi } from '@/services/api/endpoints/measurements';
import { LoadingState } from './safetySlice';

// ================ TYPE DEFINITIONS ================

export interface Measurement {
  id: string;
  value: number;
  year: string;
  district_id?: string;
  school_id?: string;
  measurement_type: MeasurementType;
  [key: string]: any;
}

export interface MeasurementType {
  id: string;
  name: string;
  category: string;
  [key: string]: any;
}

// Define the measurement categories based on the API response
export enum MeasurementCategory {
  ACADEMIC_GROWTH = 'Academic Growth',
  ACHIEVEMENT = 'Achievement',
  COLLEGE_CAREER_READINESS = 'College and Career Readiness',
  EDUCATOR = 'Educator',
  ESSA = 'ESSA',
  FINANCE = 'Finance',
  PROFILE = 'Profile',
  SCHOOL_ENVIRONMENT = 'School Environment'
}

// Define a parameter type for fetching measurements
export interface FetchMeasurementsParams {
  entityId: string;
  entityType: 'district' | 'school';
  forceRefresh?: boolean;
}

// ================ STATE INTERFACE ================

interface MeasurementState {
  // Keyed by entityId
  latestMeasurements: Record<string, Measurement[]>;
  allMeasurements: Record<string, Measurement[]>;
  measurementTypes: MeasurementType[];
  measurementTypeByIdMap: Record<string, MeasurementType>;
  measurementTypesLoaded: boolean;
  loadingStates: {
    measurementTypes: LoadingState;
    // Keyed by entityId
    measurements: Record<string, LoadingState>;
    allMeasurements: Record<string, LoadingState>;
  };
  error: string | null;
}

// ================ INITIAL STATE ================

const initialState: MeasurementState = {
  latestMeasurements: {},
  allMeasurements: {},
  measurementTypes: [],
  measurementTypeByIdMap: {},
  measurementTypesLoaded: false,
  loadingStates: {
    measurementTypes: LoadingState.IDLE,
    measurements: {},
    allMeasurements: {}
  },
  error: null
};

// ================ HELPER FUNCTIONS ================

// Generic error handler function for thunks
const handleApiError = (error: any, errorMessage: string) => {
  console.error(errorMessage, error);
  return errorMessage;
};

// Helper to ensure measurement types are loaded
export const ensureMeasurementTypesLoaded = async (state: RootState, dispatch: any) => {
  const { measurementTypesLoaded } = state.measurement;
  
  if (!measurementTypesLoaded) {
    await dispatch(fetchMeasurementTypes());
  }
};

// Helper to create a key for measurements
const createMeasurementKey = (params: FetchMeasurementsParams): string => {
  if (!params) {
    return '';
  }
  if (!params.entityType) {
    return '';
  }
  return `${params.entityType}_${params.entityId}`;
};

// ================ ASYNC THUNKS ================

// Async thunk for fetching measurement types
export const fetchMeasurementTypes = createAsyncThunk(
  'measurement/fetchMeasurementTypes',
  async (_, { rejectWithValue }) => {
    try {
      const measurementTypes = await measurementApi.getMeasurementTypes();
      // Create lookup map for measurement types
      const measurementTypeByIdMap = measurementTypes.reduce((acc: Record<string, MeasurementType>, type: MeasurementType) => {
        acc[type.id] = type;
        return acc;
      }, {} as Record<string, MeasurementType>);
      
      return {measurementTypes, measurementTypeByIdMap};
      
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch measurement types'));
    }
  }
);

// Async thunk for fetching all measurements at once
export const fetchLatestMeasurements = createAsyncThunk(
  'measurement/fetchLatestMeasurements',
  async (params: FetchMeasurementsParams, { rejectWithValue, getState, dispatch }) => {
    try {
      // Ensure measurement types are loaded first
      await ensureMeasurementTypesLoaded(getState() as RootState, dispatch);
      
      // Get the loaded measurement types
      const state = getState() as RootState;
      
      // Fetch measurements based on entity type
      let measurementsArray;
      if (params.entityType === 'district') {
        measurementsArray = await measurementApi.getLatestDistrictMeasurements(params.entityId, params.forceRefresh);
      } else {
        measurementsArray = await measurementApi.getLatestSchoolMeasurements(params.entityId, params.forceRefresh);
      }
      
      // Make sure we have an array of measurements
      if (!Array.isArray(measurementsArray)) {
        console.error('Expected array of measurements but got:', measurementsArray);
        return { key: createMeasurementKey(params), data: [] };
      }

      const measurements = measurementsArray.map(rawMeasurement => {
        const measurement: Measurement = {
          id: String(rawMeasurement.id),
          value: rawMeasurement.field, // API returns 'field' for the value
          year: String(rawMeasurement.year),
          district_id: String(rawMeasurement.district_id),
          school_id: rawMeasurement.school_id ? String(rawMeasurement.school_id) : undefined,
          measurement_type: state.measurement.measurementTypeByIdMap[rawMeasurement.measurement_type_id]
        };
        return measurement;
      });

      return { key: createMeasurementKey(params), data: measurements };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch measurements'));
    }
  }
);

// Async thunk for fetching all measurements for an entity
export const fetchAllMeasurements = createAsyncThunk(
  'measurement/fetchAllMeasurements',
  async (params: FetchMeasurementsParams, { rejectWithValue, getState, dispatch }) => {
    try {
      // Ensure measurement types are loaded first
      await ensureMeasurementTypesLoaded(getState() as RootState, dispatch);
      
      // Get the loaded measurement types
      const state = getState() as RootState;
      
      // Fetch measurements based on entity type
      let measurementsArray;
      if (params.entityType === 'district') {
        measurementsArray = await measurementApi.getAllDistrictMeasurements(params.entityId, params.forceRefresh);
      } else {
        measurementsArray = await measurementApi.getAllSchoolMeasurements(params.entityId, params.forceRefresh);
      }
      
      // Make sure we have an array of measurements
      if (!Array.isArray(measurementsArray)) {
        console.error('Expected array of measurements but got:', measurementsArray);
        return { key: createMeasurementKey(params), data: [] };
      }

      const measurements = measurementsArray.map(rawMeasurement => {
        const measurement: Measurement = {
          id: String(rawMeasurement.id),
          value: rawMeasurement.field, // API returns 'field' for the value
          year: String(rawMeasurement.year),
          district_id: String(rawMeasurement.district_id),
          school_id: rawMeasurement.school_id ? String(rawMeasurement.school_id) : undefined,
          measurement_type: state.measurement.measurementTypeByIdMap[rawMeasurement.measurement_type_id]
        };
        return measurement;
      });

      return { key: createMeasurementKey(params), data: measurements };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch all measurements'));
    }
  }
);

// ================ SLICE DEFINITION ================

export const measurementSlice = createSlice({
  name: 'measurement',
  initialState,
  reducers: {
    clearMeasurements: (state) => {
      state.latestMeasurements = {};
      state.allMeasurements = {};
      state.error = null;
    },
    resetMeasurementState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchMeasurementTypes
      .addCase(fetchMeasurementTypes.pending, (state) => {
        state.loadingStates.measurementTypes = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(fetchMeasurementTypes.fulfilled, (state, action) => {
        state.measurementTypes = action.payload.measurementTypes;
        state.measurementTypeByIdMap = action.payload.measurementTypeByIdMap;
        state.measurementTypesLoaded = true;
        state.loadingStates.measurementTypes = LoadingState.SUCCEEDED;
      })
      .addCase(fetchMeasurementTypes.rejected, (state, action) => {
        state.loadingStates.measurementTypes = LoadingState.FAILED;
        state.error = action.payload as string;
      })
      
      // Handle fetchLatestMeasurements
      .addCase(fetchLatestMeasurements.pending, (state, action) => {
        const key = createMeasurementKey(action.meta.arg);
        state.loadingStates.measurements[key] = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(fetchLatestMeasurements.fulfilled, (state, action) => {
        state.latestMeasurements[action.payload.key] = action.payload.data;
        state.loadingStates.measurements[action.payload.key] = LoadingState.SUCCEEDED;
      })
      .addCase(fetchLatestMeasurements.rejected, (state, action) => {
        const key = createMeasurementKey(action.meta.arg);
        state.loadingStates.measurements[key] = LoadingState.FAILED;
        state.error = action.payload as string;
      })
      
      // Handle fetchAllMeasurements
      .addCase(fetchAllMeasurements.pending, (state, action) => {
        const key = createMeasurementKey(action.meta.arg);
        state.loadingStates.allMeasurements[key] = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(fetchAllMeasurements.fulfilled, (state, action) => {
        state.allMeasurements[action.payload.key] = action.payload.data;
        state.loadingStates.allMeasurements[action.payload.key] = LoadingState.SUCCEEDED;
      })
      .addCase(fetchAllMeasurements.rejected, (state, action) => {
        const key = createMeasurementKey(action.meta.arg);
        state.loadingStates.allMeasurements[key] = LoadingState.FAILED;
        state.error = action.payload as string;
      });
  },
});

// ================ EXPORTS ================

// Export actions
export const { clearMeasurements, resetMeasurementState } = measurementSlice.actions;

// ================ SELECTORS ================

export const selectLatestMeasurements = (state: RootState, params: FetchMeasurementsParams) => {
  const key = createMeasurementKey(params);
  return state.measurement.latestMeasurements[key] || [];
};

// Helper selector to filter measurements by category if needed
export const selectMeasurementsByCategory = (category: string) => 
  (state: RootState, params: FetchMeasurementsParams) => {
    const key = createMeasurementKey(params);
    return (state.measurement.latestMeasurements[key] || []).filter(
      m => m.measurement_type.category === category
    );
  };

export const selectMeasurementTypesLoadingState = (state: RootState) => 
  state.measurement.loadingStates.measurementTypes;

export const selectLatestMeasurementsLoadingState = (state: RootState, params: FetchMeasurementsParams) => {
  if (!params) {
    return LoadingState.IDLE;
  }
  const key = createMeasurementKey(params);
  return state.measurement.loadingStates.measurements[key] || LoadingState.IDLE;
};

export const selectLatestMeasurementsError = (state: RootState) => 
  state.measurement.error;

export const selectMeasurementTypesLoaded = (state: RootState) => 
  state.measurement.measurementTypesLoaded;

export const selectMeasurementTypes = (state: RootState) => 
  state.measurement.measurementTypes;

// Check if any data is currently loading
export const selectAnyMeasurementLoading = (state: RootState, params: FetchMeasurementsParams) => {
  const key = createMeasurementKey(params);
  return state.measurement.loadingStates.measurements[key] === LoadingState.LOADING;
};

export const selectAllMeasurements = (state: RootState, params: FetchMeasurementsParams) => {
  const key = createMeasurementKey(params);
  return state.measurement.allMeasurements[key] || [];
};

// Helper selector to filter all measurements by category if needed
export const selectAllMeasurementsByCategory = (category: string) => 
  (state: RootState, params: FetchMeasurementsParams) => {
    const key = createMeasurementKey(params);
    return (state.measurement.allMeasurements[key] || []).filter(
      m => m.measurement_type.category === category
    );
  };

export const selectAllMeasurementsLoadingState = (state: RootState, params: FetchMeasurementsParams) => {
  const key = createMeasurementKey(params);
  return state.measurement.loadingStates.allMeasurements[key] || LoadingState.IDLE;
};

// Export reducer
export default measurementSlice.reducer; 
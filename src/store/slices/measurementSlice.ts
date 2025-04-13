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
  measurements: Measurement[]; 
  measurementTypes: MeasurementType[]; 
  measurementTypeByIdMap: Record<string, MeasurementType>; 
  measurementTypesLoaded: boolean;
  loadingStates: {
    measurementTypes: LoadingState;
    measurements: LoadingState;
  };
  error: string | null;
}

// ================ INITIAL STATE ================

const initialState: MeasurementState = {
  measurements: [],
  measurementTypes: [],
  measurementTypeByIdMap: {},
  measurementTypesLoaded: false,
  loadingStates: {
    measurementTypes: LoadingState.IDLE,
    measurements: LoadingState.IDLE
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
        measurementsArray = await measurementApi.getLatestDistrictMeasurements(params.entityId, params.forceRefresh);
      } else {
        measurementsArray = await measurementApi.getLatestSchoolMeasurements(params.entityId, params.forceRefresh);
      }
      
      // Make sure we have an array of measurements
      if (!Array.isArray(measurementsArray)) {
        console.error('Expected array of measurements but got:', measurementsArray);
        return [] as Measurement[]; // Return empty array of the expected type
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

      return measurements;
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch measurements'));
    }
  }
);

// ================ SLICE DEFINITION ================

export const measurementSlice = createSlice({
  name: 'measurement',
  initialState,
  reducers: {
    clearMeasurements: (state) => {
      state.measurements = [];
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
      
      // Handle fetchAllMeasurements
      .addCase(fetchAllMeasurements.pending, (state) => {
        state.loadingStates.measurements = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(fetchAllMeasurements.fulfilled, (state, action) => {
        // Update measurements from payload
        state.measurements = action.payload;
        state.loadingStates.measurements = LoadingState.SUCCEEDED;
      })
      .addCase(fetchAllMeasurements.rejected, (state, action) => {
        state.loadingStates.measurements = LoadingState.FAILED;
        state.error = action.payload as string;
      });
  },
});

// ================ EXPORTS ================

// Export actions
export const { clearMeasurements, resetMeasurementState } = measurementSlice.actions;

// ================ SELECTORS ================

export const selectAllMeasurements = (state: RootState) => state.measurement.measurements;

// Helper selector to filter measurements by category if needed
export const selectMeasurementsByCategory = (category: string) => 
  (state: RootState) => state.measurement.measurements.filter(
    m => m.measurement_type.category === category
  );

export const selectMeasurementTypesLoadingState = (state: RootState) => 
  state.measurement.loadingStates.measurementTypes;

export const selectMeasurementsLoadingState = (state: RootState) => 
  state.measurement.loadingStates.measurements;

export const selectMeasurementsError = (state: RootState) => 
  state.measurement.error;

export const selectMeasurementTypesLoaded = (state: RootState) => 
  state.measurement.measurementTypesLoaded;

export const selectMeasurementTypes = (state: RootState) => 
  state.measurement.measurementTypes;

// Check if any data is currently loading
export const selectAnyMeasurementLoading = (state: RootState) => {
  const { measurementTypes, measurements } = state.measurement.loadingStates;
  return measurementTypes === LoadingState.LOADING || measurements === LoadingState.LOADING;
};

// Export reducer
export default measurementSlice.reducer; 
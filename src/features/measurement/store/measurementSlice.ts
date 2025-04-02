import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { measurementApi } from '@/services/api';

// Define types for the slice state
export interface Measurement {
  id: string;
  value: number;
  year: string;
  district_id?: string;
  school_id?: string;
  measurement_type_id: string;
  category?: string; // Category from measurement type
  measurementType?: string; // Name of the measurement type
  measurementCategoryName?: string; // Name of the category
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

// Define the initial state
interface MeasurementState {
  measurements: Measurement[]; // Array of all measurements
  measurementTypes: MeasurementType[]; // Add measurement types to state
  loading: boolean;
  error: string | null;
}

const initialState: MeasurementState = {
  measurements: [], // Initialize as empty array
  measurementTypes: [], // Initialize measurement types as empty array
  loading: false,
  error: null
};

// Generic error handler function for thunks
const handleApiError = (error: any, errorMessage: string) => {
  console.error(errorMessage, error);
  return errorMessage;
};

// Define a parameter type for fetching measurements
export interface FetchMeasurementsParams {
  entityId: string;
  entityType: 'district' | 'school';
}

// Async thunk for fetching all measurements at once
export const fetchAllMeasurements = createAsyncThunk(
  'measurement/fetchAllMeasurements',
  async (params: string | FetchMeasurementsParams, { rejectWithValue, getState }) => {
    try {
      // Handle backward compatibility: if params is a string, it's a district ID
      const entityId = typeof params === 'string' ? params : params.entityId;
      const entityType = typeof params === 'string' ? 'district' : params.entityType;
      
      if (!entityId) return { measurements: [], measurementTypes: [] };
      
      // Check if measurement types are already loaded
      const state = getState() as RootState;
      let measurementTypes = state.measurement.measurementTypes;
      
      // Fetch measurement types if not already loaded
      if (!measurementTypes.length) {
        try {
          measurementTypes = await measurementApi.getMeasurementTypes();
        } catch (error) {
          console.error('Failed to fetch measurement types', error);
        }
      }
      
      // Create lookup map for measurement types
      const typeMap = measurementTypes.reduce((acc, type) => {
        acc[type.id] = type;
        return acc;
      }, {} as Record<string, MeasurementType>);
      
      // Fetch measurements based on entity type
      let measurementsArray;
      if (entityType === 'district') {
        measurementsArray = await measurementApi.getLatestDistrictMeasurements(entityId);
      } else {
        measurementsArray = await measurementApi.getLatestSchoolMeasurements(entityId);
      }
      
      // Make sure we have an array of measurements
      if (!Array.isArray(measurementsArray)) {
        console.error('Expected array of measurements but got:', measurementsArray);
        return { measurements: [], measurementTypes };
      }
      
      // Process each measurement and add measurement type info
      const processedMeasurements = measurementsArray.map(rawMeasurement => {
        // Adapt field names from API to our internal model
        const measurement: Measurement = {
          id: String(rawMeasurement.id),
          value: rawMeasurement.field, // API returns 'field' for the value
          year: String(rawMeasurement.year),
          district_id: String(rawMeasurement.district_id),
          school_id: rawMeasurement.school_id ? String(rawMeasurement.school_id) : undefined,
          measurement_type_id: String(rawMeasurement.measurement_type_id)
        };
        
        // Find the measurement type
        const measurementType = typeMap[measurement.measurement_type_id];
        
        if (measurementType) {
          // Add the measurement type name to the measurement
          measurement.measurementType = measurementType.name;
          measurement.category = measurementType.category;
          measurement.measurementCategoryName = measurementType.category;
        } else {
          console.warn(`No measurement type found for id: ${measurement.measurement_type_id}`);
        }
        
        return measurement;
      });
      
      return {
        measurements: processedMeasurements,
        measurementTypes
      };
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch measurements'));
    }
  }
);

// Create the measurement slice
export const measurementSlice = createSlice({
  name: 'measurement',
  initialState,
  reducers: {
    clearMeasurements: (state) => {
      state.measurements = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchAllMeasurements
      .addCase(fetchAllMeasurements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMeasurements.fulfilled, (state, action) => {
        // If payload has both measurements and measurementTypes
        if (action.payload) {
          if (action.payload.measurements) {
            state.measurements = action.payload.measurements;
          }
          if (action.payload.measurementTypes) {
            state.measurementTypes = action.payload.measurementTypes;
          }
        }
        state.loading = false;
      })
      .addCase(fetchAllMeasurements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearMeasurements } = measurementSlice.actions;

// Selectors
export const selectAllMeasurements = (state: RootState) => state.measurement.measurements;

// Helper selector to filter measurements by category if needed
export const selectMeasurementsByCategory = (category: string) => 
  (state: RootState) => state.measurement.measurements.filter(
    m => m.measurementCategoryName === category
  );

export const selectMeasurementsLoading = (state: RootState) => state.measurement.loading;
export const selectMeasurementsError = (state: RootState) => state.measurement.error;

// Add selector for measurement types
export const selectMeasurementTypes = (state: RootState) => state.measurement.measurementTypes;

// Export reducer
export default measurementSlice.reducer; 
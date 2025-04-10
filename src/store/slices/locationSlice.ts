import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { locationApi } from '@/services/api/endpoints/locations';

// Define types for the slice state
export interface District {
  id: number;
  name: string;
}

export interface Grade {
  id: number;
  name: string;
}

export interface School {
  id: number;
  name: string;
  grades?: Grade[];
  enrollment?: Record<string, number>;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
  webpage?: string | null;
  principal_first_name?: string | null;
  principal_last_name?: string | null;
  school_type?: { id: number; name: string };
}

export interface Town {
  id: number;
  name: string;
}

export interface Staff {
  id: number;
  sau_id: number;
  first_name: string;
  last_name: string;
  title: string;
  admin_type: string;
  email: string;
}

export interface Sau {
  id: number;
  name?: string;
  address1?: string | null;
  address2?: string | null;
  town?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  fax?: string | null;
  webpage?: string | null;
  staff?: Staff[];
}

export interface LocationState {
  districts: District[];
  grades: Grade[];
  currentDistrict: District | null;
  currentSchools: School[];
  currentTowns: Town[];
  currentSau: Sau | null;
  currentSchool: School | null;
  loading: boolean;
  loadingStates: {
    districts: boolean;
    grades: boolean;
    district: boolean;
    schools: boolean;
    towns: boolean;
    sau: boolean;
    school: boolean;
  };
  error: string | null;
}

const initialState: LocationState = {
  districts: [],
  grades: [],
  currentDistrict: null,
  currentSchools: [],
  currentTowns: [],
  currentSau: null,
  currentSchool: null,
  loading: false,
  loadingStates: {
    districts: false,
    grades: false,
    district: false,
    schools: false,
    towns: false,
    sau: false,
    school: false,
  },
  error: null,
};

// Generic error handler function for thunks
const handleApiError = (error: any, errorMessage: string) => {
  console.error(errorMessage, error);
  return errorMessage;
};

// Async thunks for fetching location data
export const fetchDistricts = createAsyncThunk(
  'location/fetchDistricts',
  async (_, { rejectWithValue }) => {
    try {
      return await locationApi.getDistricts();
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch districts'));
    }
  }
);

export const fetchDistrictById = createAsyncThunk(
  'location/fetchDistrictById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await locationApi.getDistrictById(id);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch district'));
    }
  }
);

export const fetchSchoolsByDistrictId = createAsyncThunk(
  'location/fetchSchoolsByDistrictId',
  async (id: number, { rejectWithValue }) => {
    try {
      return await locationApi.getSchoolsByDistrictId(id);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch schools'));
    }
  }
);

export const fetchTownsByDistrictId = createAsyncThunk(
  'location/fetchTownsByDistrictId',
  async (id: number, { rejectWithValue }) => {
    try {
      return await locationApi.getTownsByDistrictId(id);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch towns'));
    }
  }
);

export const fetchSauByDistrictId = createAsyncThunk(
  'location/fetchSauByDistrictId',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await locationApi.getSauByDistrictId(id);
      return data[0]; // Get the first SAU from the array
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch SAU'));
    }
  }
);

export const fetchAllDistrictData = createAsyncThunk(
  'location/fetchAllDistrictData',
  async (id: number, { dispatch }) => {
    if (!id) return;
    
    // Fetch all district data in parallel
    await Promise.all([
      dispatch(fetchDistrictById(id)),
      dispatch(fetchSchoolsByDistrictId(id)),
      dispatch(fetchTownsByDistrictId(id)),
      dispatch(fetchSauByDistrictId(id))
    ]);

    return id;
  }
);

export const fetchSchoolById = createAsyncThunk(
  'location/fetchSchoolById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await locationApi.getSchoolById(id);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch school'));
    }
  }
);

export const fetchDistrictBySchoolId = createAsyncThunk(
  'location/fetchDistrictBySchoolId',
  async (id: number, { rejectWithValue }) => {
    try {
      const districts = await locationApi.getDistrictBySchoolId(id);
      return districts; // Return the entire array
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch district for school'));
    }
  }
);

export const fetchAllSchoolData = createAsyncThunk(
  'location/fetchAllSchoolData',
  async (id: number, { dispatch, getState }) => {
    if (!id) return;
    
    // Fetch all school data in parallel
    await Promise.all([
      dispatch(fetchSchoolById(id)),
      dispatch(fetchDistrictBySchoolId(id))
    ]);

    // After fetching the district, get the district ID and fetch the SAU data
    const state = getState() as RootState;
    const district = state.location.currentDistrict;
    
    if (district && district.id) {
      dispatch(fetchSauByDistrictId(district.id));
    }

    return id;
  }
);

// Add new async thunk for fetching grades
export const fetchGrades = createAsyncThunk(
  'location/fetchGrades',
  async (forceRefresh: boolean = false, { rejectWithValue }) => {
    try {
      return await locationApi.getGrades(forceRefresh);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch grades'));
    }
  }
);

// Create the location slice
export const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    clearSchoolData: (state) => {
      state.currentSchool = null;
      state.error = null;
      state.loadingStates.school = false;
    },
    clearDistrictData: (state) => {
      state.currentDistrict = null;
      state.currentSchools = [];
      state.currentTowns = [];
      state.currentSau = null;
      state.error = null;
      // Reset relevant loading states
      state.loadingStates.district = false;
      state.loadingStates.schools = false;
      state.loadingStates.towns = false;
      state.loadingStates.sau = false;
    },
    clearGradesData: (state) => {
      state.grades = [];
      state.loadingStates.grades = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchDistricts
      .addCase(fetchDistricts.pending, (state) => {
        state.loading = true;
        state.loadingStates.districts = true;
        state.error = null;
      })
      .addCase(fetchDistricts.fulfilled, (state, action) => {
        state.districts = action.payload;
        state.loading = false;
        state.loadingStates.districts = false;
      })
      .addCase(fetchDistricts.rejected, (state, action) => {
        state.loading = false;
        state.loadingStates.districts = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchDistrictById
      .addCase(fetchDistrictById.pending, (state) => {
        state.loading = true;
        state.loadingStates.district = true;
        state.error = null;
      })
      .addCase(fetchDistrictById.fulfilled, (state, action) => {
        state.currentDistrict = action.payload;
        state.loading = false;
        state.loadingStates.district = false;
      })
      .addCase(fetchDistrictById.rejected, (state, action) => {
        state.loading = false;
        state.loadingStates.district = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchSchoolsByDistrictId
      .addCase(fetchSchoolsByDistrictId.pending, (state) => {
        state.loading = true;
        state.loadingStates.schools = true;
        state.error = null;
      })
      .addCase(fetchSchoolsByDistrictId.fulfilled, (state, action) => {
        state.currentSchools = action.payload;
        state.loading = false;
        state.loadingStates.schools = false;
      })
      .addCase(fetchSchoolsByDistrictId.rejected, (state, action) => {
        state.loading = false;
        state.loadingStates.schools = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchTownsByDistrictId
      .addCase(fetchTownsByDistrictId.pending, (state) => {
        state.loading = true;
        state.loadingStates.towns = true;
        state.error = null;
      })
      .addCase(fetchTownsByDistrictId.fulfilled, (state, action) => {
        state.currentTowns = action.payload;
        state.loading = false;
        state.loadingStates.towns = false;
      })
      .addCase(fetchTownsByDistrictId.rejected, (state, action) => {
        state.loading = false;
        state.loadingStates.towns = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchSauByDistrictId
      .addCase(fetchSauByDistrictId.pending, (state) => {
        state.loading = true;
        state.loadingStates.sau = true;
        state.error = null;
      })
      .addCase(fetchSauByDistrictId.fulfilled, (state, action) => {
        state.currentSau = action.payload;
        state.loading = false;
        state.loadingStates.sau = false;
      })
      .addCase(fetchSauByDistrictId.rejected, (state, action) => {
        state.loading = false;
        state.loadingStates.sau = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchSchoolById
      .addCase(fetchSchoolById.pending, (state) => {
        state.loading = true;
        state.loadingStates.school = true;
        state.error = null;
      })
      .addCase(fetchSchoolById.fulfilled, (state, action) => {
        state.currentSchool = action.payload;
        state.loading = false;
        state.loadingStates.school = false;
      })
      .addCase(fetchSchoolById.rejected, (state, action) => {
        state.loading = false;
        state.loadingStates.school = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchDistrictBySchoolId
      .addCase(fetchDistrictBySchoolId.pending, (state) => {
        state.loading = true;
        state.loadingStates.district = true;
        state.error = null;
      })
      .addCase(fetchDistrictBySchoolId.fulfilled, (state, action) => {
        // When fetching district by school ID, we get an array, so take the first one
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.currentDistrict = action.payload[0];
        }
        state.loading = false;
        state.loadingStates.district = false;
      })
      .addCase(fetchDistrictBySchoolId.rejected, (state, action) => {
        state.loading = false;
        state.loadingStates.district = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchGrades
      .addCase(fetchGrades.pending, (state) => {
        state.loading = true;
        state.loadingStates.grades = true;
        state.error = null;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.grades = action.payload;
        state.loading = false;
        state.loadingStates.grades = false;
      })
      .addCase(fetchGrades.rejected, (state, action) => {
        state.loading = false;
        state.loadingStates.grades = false;
        state.error = action.payload as string;
      })
  },
});

// Export actions
export const { clearSchoolData, clearDistrictData, clearGradesData } = locationSlice.actions;

// Export selectors
export const selectDistricts = (state: RootState) => state.location.districts;
export const selectCurrentDistrict = (state: RootState) => state.location.currentDistrict;
export const selectCurrentSchools = (state: RootState) => state.location.currentSchools;
export const selectCurrentTowns = (state: RootState) => state.location.currentTowns;
export const selectCurrentSau = (state: RootState) => state.location.currentSau;
export const selectCurrentSchool = (state: RootState) => state.location.currentSchool;
export const selectLocationLoading = (state: RootState) => state.location.loading;
export const selectLocationError = (state: RootState) => state.location.error;

// Specific loading state selectors
export const selectDistrictsLoading = (state: RootState) => state.location.loadingStates.districts;
export const selectDistrictLoading = (state: RootState) => state.location.loadingStates.district;
export const selectSchoolsLoading = (state: RootState) => state.location.loadingStates.schools;
export const selectTownsLoading = (state: RootState) => state.location.loadingStates.towns;
export const selectSauLoading = (state: RootState) => state.location.loadingStates.sau;
export const selectSchoolLoading = (state: RootState) => state.location.loadingStates.school;
export const selectGradesLoading = (state: RootState) => state.location.loadingStates.grades;

// Check if any location data is currently loading
export const selectAnyLocationLoading = (state: RootState) => {
  const loadingStates = state.location.loadingStates;
  return Object.values(loadingStates).some(isLoading => isLoading);
};

// Export the reducer
export default locationSlice.reducer; 
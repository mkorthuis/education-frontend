import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { locationApi } from '@/services/api';
import { fetchAllMeasurements } from '@/features/measurement/store/measurementSlice';

// Define types for the slice state
export interface District {
  id: string;
  name: string;
  [key: string]: any;
}

export interface Grade {
  id: string;
  name: string;
  [key: string]: any;
}

export interface School {
  id: string;
  name: string;
  grades?: Grade[];
  enrollment?: Record<string, number>;
  [key: string]: any;
}

export interface Town {
  id: string;
  name: string;
  [key: string]: any;
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
  [key: string]: any;
}

export interface LocationState {
  districts: District[];
  currentDistrict: District | null;
  currentSchools: School[];
  currentTowns: Town[];
  currentSau: Sau | null;
  currentSchool: School | null;
  loading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  districts: [],
  currentDistrict: null,
  currentSchools: [],
  currentTowns: [],
  currentSau: null,
  currentSchool: null,
  loading: false,
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
  async (id: string, { rejectWithValue }) => {
    try {
      return await locationApi.getDistrictById(id);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch district'));
    }
  }
);

export const fetchSchoolsByDistrictId = createAsyncThunk(
  'location/fetchSchoolsByDistrictId',
  async (id: string, { rejectWithValue }) => {
    try {
      return await locationApi.getSchoolsByDistrictId(id);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch schools'));
    }
  }
);

export const fetchTownsByDistrictId = createAsyncThunk(
  'location/fetchTownsByDistrictId',
  async (id: string, { rejectWithValue }) => {
    try {
      return await locationApi.getTownsByDistrictId(id);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch towns'));
    }
  }
);

export const fetchSauByDistrictId = createAsyncThunk(
  'location/fetchSauByDistrictId',
  async (id: string, { rejectWithValue }) => {
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
  async (id: string, { dispatch }) => {
    if (!id) return;
    
    // Fetch all district data in parallel
    await Promise.all([
      dispatch(fetchDistrictById(id)),
      dispatch(fetchSchoolsByDistrictId(id)),
      dispatch(fetchTownsByDistrictId(id)),
      dispatch(fetchSauByDistrictId(id))
    ]);

    // Once district data is loaded, trigger fetch of all measurements at once
    // We don't await this - it's a background fetch that will load data for sub-pages
    dispatch(fetchAllMeasurements({ entityId: id, entityType: 'district' })); // This still works with the string param for backward compatibility

    return id;
  }
);

export const fetchSchoolById = createAsyncThunk(
  'location/fetchSchoolById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await locationApi.getSchoolById(id);
    } catch (error) {
      return rejectWithValue(handleApiError(error, 'Failed to fetch school'));
    }
  }
);

export const fetchDistrictBySchoolId = createAsyncThunk(
  'location/fetchDistrictBySchoolId',
  async (id: string, { rejectWithValue }) => {
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
  async (id: string, { dispatch, getState }) => {
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
      // Fetch SAU data for the district
      await dispatch(fetchSauByDistrictId(district.id));
    }

    // Once school data is loaded, trigger fetch of all measurements at once
    // We don't await this - it's a background fetch that will load data for sub-pages
    dispatch(fetchAllMeasurements({ entityId: id, entityType: 'school' }));

    return id;
  }
);

export const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    clearDistrictData: (state) => {
      state.currentDistrict = null;
      state.currentSchools = [];
      state.currentTowns = [];
      state.currentSau = null;
      state.error = null;
    },
    clearSchoolData: (state) => {
      state.currentSchool = null;
      state.currentDistrict = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchDistricts
      .addCase(fetchDistricts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDistricts.fulfilled, (state, action: PayloadAction<District[]>) => {
        state.districts = action.payload;
        state.loading = false;
      })
      .addCase(fetchDistricts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Handle fetchDistrictById
      .addCase(fetchDistrictById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDistrictById.fulfilled, (state, action: PayloadAction<District>) => {
        state.currentDistrict = action.payload;
      })
      .addCase(fetchDistrictById.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Handle fetchSchoolsByDistrictId
      .addCase(fetchSchoolsByDistrictId.fulfilled, (state, action: PayloadAction<School[]>) => {
        state.currentSchools = action.payload;
      })
      .addCase(fetchSchoolsByDistrictId.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Handle fetchTownsByDistrictId
      .addCase(fetchTownsByDistrictId.fulfilled, (state, action: PayloadAction<Town[]>) => {
        state.currentTowns = action.payload;
      })
      .addCase(fetchTownsByDistrictId.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Handle fetchSauByDistrictId
      .addCase(fetchSauByDistrictId.fulfilled, (state, action: PayloadAction<Sau>) => {
        state.currentSau = action.payload;
      })
      .addCase(fetchSauByDistrictId.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Handle fetchAllDistrictData
      .addCase(fetchAllDistrictData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDistrictData.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchAllDistrictData.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Failed to load district information. Please try again later.';
      })
      
      // Handle fetchSchoolById
      .addCase(fetchSchoolById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchoolById.fulfilled, (state, action: PayloadAction<School>) => {
        state.currentSchool = action.payload;
      })
      .addCase(fetchSchoolById.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Handle fetchDistrictBySchoolId
      .addCase(fetchDistrictBySchoolId.fulfilled, (state, action: PayloadAction<District[]>) => {
        // If array is empty, set to null; otherwise take the first item
        state.currentDistrict = action.payload.length > 0 ? action.payload[0] : null;
      })
      .addCase(fetchDistrictBySchoolId.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Handle fetchAllSchoolData
      .addCase(fetchAllSchoolData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSchoolData.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchAllSchoolData.rejected, (state, action) => {
        state.loading = false;
        state.error = 'Failed to load school information. Please try again later.';
      });
  },
});

export const { clearDistrictData, clearSchoolData } = locationSlice.actions;

// Selectors
export const selectDistricts = (state: RootState) => state.location.districts;
export const selectCurrentDistrict = (state: RootState) => state.location.currentDistrict;
export const selectCurrentSchools = (state: RootState) => state.location.currentSchools;
export const selectCurrentTowns = (state: RootState) => state.location.currentTowns;
export const selectCurrentSau = (state: RootState) => state.location.currentSau;
export const selectCurrentSchool = (state: RootState) => state.location.currentSchool;
export const selectLocationLoading = (state: RootState) => state.location.loading;
export const selectLocationError = (state: RootState) => state.location.error;

export default locationSlice.reducer; 
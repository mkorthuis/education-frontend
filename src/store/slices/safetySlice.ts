import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { safetyApi } from '@/services/api/endpoints/safety';

export enum LoadingState {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed'
}

export interface BaseSafetyParams {
    year?: string;
    school_id?: number;
    district_id?: number;
    forceRefresh?: boolean;
}

export interface SchoolSafetyParams extends BaseSafetyParams {
    safety_type_id?: number;
}

export interface SchoolSafetyType {
    id: number;
    name: string;
}

export interface TruancyData {
    id: number;
    school_id: number;
    year: number;
    count: number;
}

export interface SafetyTypeData {
    id: number;
    name: string;
}

export interface SchoolSafetyData {
    id: number;
    school_id: number;
    year: number;
    count: number;
    safety_type: SafetyTypeData;
}

export interface HarassmentData {
    id: number;
    school_id: number;
    year: number;
    incident_count: number;
    student_impact_count: number;
    student_engaged_count: number;
    classification: HarassmentClassificationData;
}

export interface HarassmentClassificationData {
    id: number;
    name: string;
}

export type SafetyCategory = 'truancy' | 'schoolSafetyIncidents' | 'harassment' | 'bullying' | 'suspension' | 'restraint' | 'serious';
type SafetyTypeCategory = 'schoolSafetyTypes' | 'harassmentClassification';

interface SafetyState {
    dataLoadingStatus: Record<SafetyCategory, Record<string, LoadingState>>;
    typeLoadingStatus: Record<SafetyTypeCategory, LoadingState>;
    truancyData: Record<string, TruancyData[]>;
    schoolSafetyData: Record<string, SchoolSafetyData[]>;
    harassmentData: Record<string, HarassmentData[]>;

    schoolSafetyTypes: SchoolSafetyType[];
    harassmentClassification: HarassmentClassificationData[];
    
    selectedSafetyCategory: SafetyCategory | null;
}

const initialState: SafetyState = {
    dataLoadingStatus: {
        truancy: {},
        schoolSafetyIncidents: {},
        harassment: {},
        bullying: {},
        suspension: {},
        restraint: {},
        serious: {},
    },
    typeLoadingStatus: {
        schoolSafetyTypes: LoadingState.IDLE,
        harassmentClassification: LoadingState.IDLE,
    },

    truancyData: {},
    schoolSafetyData: {},
    harassmentData: {},

    schoolSafetyTypes: [],
    harassmentClassification: [],
    
    selectedSafetyCategory: null
}

// Generic key creation function
const createOptionsKey = (params: Record<string, any>): string => {
    const sortedParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    
    const keyString = sortedParams.map(([key, value]) => `${key}=${value}`).join('&');
    // Ensure we never return an empty string as a key
    return keyString || '_default';
  };



export const fetchSchoolSafetyTypes = createAsyncThunk(
    'safety/fetchSchoolSafetyTypes',
    async (_, { rejectWithValue }) => {
        try {
            const data = await safetyApi.getSchoolSafetyTypes();
            return data;
        } catch (error : any) {
            return rejectWithValue(error.message);
        }
    }
)

export const fetchHarassmentClassification = createAsyncThunk(
    'safety/fetchHarassmentClassification',
    async (_, {rejectWithValue}) => {
        try {
            const data = await safetyApi.getHarassmentClassifications();
            return data;
        } catch (error : any) {
            return rejectWithValue(error.message);
        }
    }
)

export const fetchTruancyData = createAsyncThunk(
    'safety/fetchTruancyData',
    async (params: BaseSafetyParams = {}, {getState, rejectWithValue}) => {
        try {
            const {forceRefresh = false, ...options} = params;
            const key = createOptionsKey(options);
            const cachedData = (getState() as RootState).safety.truancyData[key];
            if (cachedData && !forceRefresh) {
                return {key, data: cachedData}
            }
            const data = await safetyApi.getTruancies(options, forceRefresh);
            return { key, data }
        } catch (error : any) {
            return rejectWithValue(error.message);
        }
    }
)

export const fetchSchoolSafetyIncidents = createAsyncThunk(
    'safety/fetchSchoolSafetyIncidents',
    async (params: SchoolSafetyParams = {}, {getState, dispatch, rejectWithValue}) => {
        try {
            const {forceRefresh = false, ...options} = params;

            const safetyState = (getState() as RootState).safety;
            if (safetyState.typeLoadingStatus.schoolSafetyTypes === LoadingState.IDLE && safetyState.schoolSafetyTypes.length === 0) {
                await dispatch(fetchSchoolSafetyTypes()).unwrap();
            }

            const key = createOptionsKey(options);
            const data = await safetyApi.getSchoolSafetyIncidents(options, forceRefresh);
            return { key, data };
        } catch (error : any) {
            return rejectWithValue(error.message);
        }
    }
)

export const fetchHarassmentIncidents = createAsyncThunk(
    'safety/fetchHarassmentIncidents',
    async (params: BaseSafetyParams = {}, {getState, dispatch, rejectWithValue}) => {
        try {
            const {forceRefresh = false, ...options} = params;

            const safetyState = (getState() as RootState).safety;
            if (safetyState.typeLoadingStatus.harassmentClassification === LoadingState.IDLE && safetyState.harassmentClassification.length === 0) {
                await dispatch(fetchHarassmentClassification()).unwrap();
            }

            const key = createOptionsKey(options);
            const data = await safetyApi.getHarassmentIncidents(options, forceRefresh);
            return { key, data };
        } catch (error : any) {
            return rejectWithValue(error.message);
        }
    }
)

export const safetySlice = createSlice({
    name: 'safety',
    initialState,
    reducers: {
        clearSafety: (state) => initialState,
        clearSafetyData: (state) => {
            state.dataLoadingStatus = {
                truancy: {},
                schoolSafetyIncidents: {},
                harassment: {},
                bullying: {},
                suspension: {},
                restraint: {},
                serious: {},
            };
            state.truancyData = {};
            state.schoolSafetyData = {};
            state.harassmentData = {};
        },
        setSelectedSafetyCategory: (state, action: PayloadAction<SafetyCategory | null>) => {
            state.selectedSafetyCategory = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchSchoolSafetyTypes.pending, (state, action) => {
            state.typeLoadingStatus.schoolSafetyTypes = LoadingState.LOADING;
        })
        .addCase(fetchSchoolSafetyTypes.fulfilled, (state, action) => {
            state.schoolSafetyTypes = action.payload;
            state.typeLoadingStatus.schoolSafetyTypes = LoadingState.SUCCEEDED;
        })  
        .addCase(fetchSchoolSafetyTypes.rejected, (state, action) => {
            state.typeLoadingStatus.schoolSafetyTypes = LoadingState.FAILED;
        })

        .addCase(fetchHarassmentClassification.pending, (state, action) => {
            state.typeLoadingStatus.harassmentClassification = LoadingState.LOADING;
        })
        .addCase(fetchHarassmentClassification.fulfilled, (state, action) => {
            state.harassmentClassification = action.payload;
            state.typeLoadingStatus.harassmentClassification = LoadingState.SUCCEEDED;
        })
        .addCase(fetchHarassmentClassification.rejected, (state, action) => {
            state.typeLoadingStatus.harassmentClassification = LoadingState.FAILED;
        })
        
        .addCase(fetchTruancyData.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.dataLoadingStatus.truancy[key] = LoadingState.LOADING;
        })
        .addCase(fetchTruancyData.fulfilled, (state, action) => {
            state.truancyData[action.payload.key] = action.payload.data;
            state.dataLoadingStatus.truancy[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchTruancyData.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.dataLoadingStatus.truancy[key] = LoadingState.FAILED;
        })
        
        .addCase(fetchSchoolSafetyIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.dataLoadingStatus.schoolSafetyIncidents[key] = LoadingState.LOADING;
        })
        .addCase(fetchSchoolSafetyIncidents.fulfilled, (state, action) => {
            state.schoolSafetyData[action.payload.key] = action.payload.data;
            state.dataLoadingStatus.schoolSafetyIncidents[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchSchoolSafetyIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.dataLoadingStatus.schoolSafetyIncidents[key] = LoadingState.FAILED;
        })

        .addCase(fetchHarassmentIncidents.pending, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.dataLoadingStatus.harassment[key] = LoadingState.LOADING;
        })
        .addCase(fetchHarassmentIncidents.fulfilled, (state, action) => {
            state.harassmentData[action.payload.key] = action.payload.data;
            state.dataLoadingStatus.harassment[action.payload.key] = LoadingState.SUCCEEDED;
        })
        .addCase(fetchHarassmentIncidents.rejected, (state, action) => {
            const key = createOptionsKey(action.meta.arg);
            state.dataLoadingStatus.harassment[key] = LoadingState.FAILED;
        })
    }
})

export const { clearSafety, clearSafetyData, setSelectedSafetyCategory } = safetySlice.actions;

const selectLoadingStatus = (state: RootState, category: SafetyCategory, params: BaseSafetyParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.dataLoadingStatus[category][key] || LoadingState.IDLE;
}

export const selectTruancyLoadingStatus = (state: RootState, params: BaseSafetyParams) => 
    selectLoadingStatus(state, 'truancy', params);

export const selectSchoolSafetyIncidentsLoadingStatus = (state: RootState, params: SchoolSafetyParams) => 
    selectLoadingStatus(state, 'schoolSafetyIncidents', params);

export const selectHarassmentIncidentsLoadingStatus = (state: RootState, params: BaseSafetyParams) => 
    selectLoadingStatus(state, 'harassment', params);

export const selectSchoolSafetyTypesLoadingStatus = (state: RootState) => 
    state.safety.typeLoadingStatus.schoolSafetyTypes;

export const selectHarassmentClassificationLoadingStatus = (state: RootState) => 
    state.safety.typeLoadingStatus.harassmentClassification;


export const selectTruancyData = (state: RootState, params: BaseSafetyParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.truancyData[key] || [];
}   

export const selectSchoolSafetyData = (state: RootState, params: SchoolSafetyParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.schoolSafetyData[key] || [];
}   

export const selectHarassmentData = (state: RootState, params: BaseSafetyParams) => {
    const {forceRefresh = false, ...options} = params;
    const key = createOptionsKey(options);
    return state.safety.harassmentData[key] || [];
}   

export const selectSchoolSafetyTypes = (state: RootState) => state.safety.schoolSafetyTypes;
export const selectHarassmentClassification = (state: RootState) => state.safety.harassmentClassification;

export const selectSelectedSafetyCategory = (state: RootState) => state.safety.selectedSafetyCategory;

export default safetySlice.reducer;
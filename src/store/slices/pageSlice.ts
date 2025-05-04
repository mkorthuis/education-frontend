import { createSlice, createAction, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { PATHS } from '@/routes/paths';
import { 
  fetchDistrictById, 
  fetchDistrictBySchoolId, 
  fetchSchoolById,
  Grade 
} from '@/store/slices/locationSlice';

// Define a type for route path entries
export type RoutePathEntry = {
  path: string;
  title: string;
  shortName?: string;
};

// Page types
export interface PageInfo {
  name: string;
  path: string;
  shortName?: string;
  enabled?: boolean;
  tooltip?: string;
}

export interface PageState {
  district: {
    id: number | null;
    name: string;
    availablePages: PageInfo[];
  };
  school: {
    id: number | null;
    name: string;
    availablePages: PageInfo[];
  };
  currentPage: PageInfo;
  showSecondaryNav: boolean;
}

// Helper function to replace path parameters
export const replacePathParams = (path: string, params: Record<string, string | number>): string => {
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value));
  }
  return result;
};

// Helper function to determine current page from a pathname
export const determineCurrentPage = (pathname: string, availablePages: PageInfo[]): PageInfo | null => {
  // Sort pages by path length (descending) to match most specific routes first
  const sortedPages = [...availablePages].sort((a, b) => b.path.length - a.path.length);
  
  for (const page of sortedPages) {
    // Convert route with params (like "/district/:id/safety") to regex pattern
    const pattern = page.path.replace(/:\w+(\?)?/g, '[^/]+');
    const regexPattern = new RegExp(`^${pattern.replace(/\//g, '\\/')}$`);
    
    if (regexPattern.test(pathname)) {
      return page;
    }
  }
  
  return null;
};

// Initial state
const initialState: PageState = {
  district: {
    id: null,
    name: '',
    availablePages: []
  },
  school: {
    id: null,
    name: '',
    availablePages: []
  },
  currentPage: {
    name: 'Home',
    path: '/',
    enabled: true,
    tooltip: ''
  },
  showSecondaryNav: true
};

// Create slice
export const pageSlice = createSlice({
  name: 'page',
  initialState,
  reducers: {
    setDistrict: (state, action: PayloadAction<{ id: number | null; name: string; availablePages?: PageInfo[] }>) => {
      state.district.id = action.payload.id;
      state.district.name = action.payload.name;
      if (action.payload.availablePages) {
        state.district.availablePages = action.payload.availablePages;
      }
    },
    setSchool: (state, action: PayloadAction<{ id: number | null; name: string; availablePages?: PageInfo[] }>) => {
      state.school.id = action.payload.id;
      state.school.name = action.payload.name;
      if (action.payload.availablePages) {
        state.school.availablePages = action.payload.availablePages;
      }
    },
    setCurrentPage: (state, action: PayloadAction<PageInfo>) => {
      state.currentPage = action.payload;
    },
    setShowSecondaryNav: (state, action: PayloadAction<boolean>) => {
      state.showSecondaryNav = action.payload;
    }
  }
});

// Export actions
export const { 
  setDistrict, 
  setSchool, 
  setCurrentPage, 
  setShowSecondaryNav 
} = pageSlice.actions;

// Thunk to update district pages after all data is loaded
export const updateDistrictPages = createAsyncThunk(
  'page/updateDistrictPages',
  (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const currentDistrict = state.location.currentDistrict;
    
    if (!currentDistrict) return;
    
    // Get relevant data for conditionally enabling pages
    const hasSchools = state.location.currentSchools && state.location.currentSchools.length > 0;
    
    // Check if district has graduation grade
    const hasGraduationGrade = currentDistrict.grades?.some(
      (grade: Grade) => grade.name === import.meta.env.VITE_GRADUATION_GRADE
    );
    
    // Generate district pages from PATHS
    const districtPages: PageInfo[] = [
      { 
        name: PATHS.PUBLIC.DISTRICT.title, 
        path: replacePathParams(PATHS.PUBLIC.DISTRICT.path, { id: currentDistrict.id }),
        shortName: (PATHS.PUBLIC.DISTRICT as RoutePathEntry).shortName,
        enabled: true,
        tooltip: ''
      },
      { 
        name: PATHS.PUBLIC.DISTRICT_ACADEMIC.title, 
        path: replacePathParams(PATHS.PUBLIC.DISTRICT_ACADEMIC.path, { id: currentDistrict.id }),
        shortName: (PATHS.PUBLIC.DISTRICT_ACADEMIC as RoutePathEntry).shortName,
        enabled: hasSchools,
        tooltip: !hasSchools ? 'Your town does not operate schools. Please view the districts who receive your students for information' : ''
      },
      { 
        name: PATHS.PUBLIC.DISTRICT_OUTCOMES.title, 
        path: replacePathParams(PATHS.PUBLIC.DISTRICT_OUTCOMES.path, { id: currentDistrict.id }),
        shortName: (PATHS.PUBLIC.DISTRICT_OUTCOMES as RoutePathEntry).shortName,
        enabled: hasSchools && hasGraduationGrade,
        tooltip: !hasSchools 
          ? 'Your town does not operate schools. Please view the districts who receive your students for information'
          : !hasGraduationGrade 
            ? `This district does not educate ${import.meta.env.VITE_GRADUATION_GRADE} students. Please view the districts who receive your ${import.meta.env.VITE_GRADUATION_GRADE} students for information.`
            : ''
      },
      { 
        name: PATHS.PUBLIC.DISTRICT_FINANCIALS.title, 
        path: replacePathParams(PATHS.PUBLIC.DISTRICT_FINANCIALS.path, { id: currentDistrict.id }),
        shortName: (PATHS.PUBLIC.DISTRICT_FINANCIALS as RoutePathEntry).shortName,
        enabled: true,
        tooltip: ''
      },
      { 
        name: PATHS.PUBLIC.DISTRICT_DEMOGRAPHICS.title, 
        path: replacePathParams(PATHS.PUBLIC.DISTRICT_DEMOGRAPHICS.path, { id: currentDistrict.id }),
        shortName: (PATHS.PUBLIC.DISTRICT_DEMOGRAPHICS as RoutePathEntry).shortName,
        enabled: false,
        tooltip: 'Working with NH DOE to fix a bug in their data. Once resolved, demographic data will be available.'
      },
      { 
        name: PATHS.PUBLIC.DISTRICT_SAFETY.title, 
        path: replacePathParams(PATHS.PUBLIC.DISTRICT_SAFETY.path, { id: currentDistrict.id }),
        shortName: (PATHS.PUBLIC.DISTRICT_SAFETY as RoutePathEntry).shortName,
        enabled: hasSchools,
        tooltip: !hasSchools ? 'Your town does not operate schools. Please view the districts who receive your students for information' : ''
      },
      { 
        name: PATHS.PUBLIC.DISTRICT_STAFF.title, 
        path: replacePathParams(PATHS.PUBLIC.DISTRICT_STAFF.path, { id: currentDistrict.id }),
        shortName: (PATHS.PUBLIC.DISTRICT_STAFF as RoutePathEntry).shortName,
        enabled: hasSchools,
        tooltip: !hasSchools ? 'Your town does not operate schools. Please view the districts who receive your students for information' : ''
      },
      { 
        name: PATHS.PUBLIC.DISTRICT_EFA.title, 
        path: replacePathParams(PATHS.PUBLIC.DISTRICT_EFA.path, { id: currentDistrict.id }),
        shortName: (PATHS.PUBLIC.DISTRICT_EFA as RoutePathEntry).shortName,
        enabled: true,
        tooltip: ''
      },
      { 
        name: PATHS.PUBLIC.DISTRICT_CONTACT.title, 
        path: replacePathParams(PATHS.PUBLIC.DISTRICT_CONTACT.path, { id: currentDistrict.id }),
        shortName: (PATHS.PUBLIC.DISTRICT_CONTACT as RoutePathEntry).shortName,
        enabled: true,
        tooltip: ''
      }
    ];
    
    // Update the district pages
    dispatch(setDistrict({
      id: currentDistrict.id,
      name: currentDistrict.name,
      availablePages: districtPages
    }));
  }
);

// Thunk to update school pages after all data is loaded
export const updateSchoolPages = createAsyncThunk(
  'page/updateSchoolPages',
  (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const currentSchool = state.location.currentSchool;
    
    if (!currentSchool) return;
    
    // Generate school pages from PATHS
    const schoolPages: PageInfo[] = [
      { 
        name: PATHS.PUBLIC.SCHOOL.title, 
        path: replacePathParams(PATHS.PUBLIC.SCHOOL.path, { id: currentSchool.id }),
        shortName: (PATHS.PUBLIC.SCHOOL as RoutePathEntry).shortName,
        enabled: true,
        tooltip: ''
      },
      { 
        name: PATHS.PUBLIC.SCHOOL_ACADEMIC.title, 
        path: replacePathParams(PATHS.PUBLIC.SCHOOL_ACADEMIC.path, { id: currentSchool.id }),
        shortName: (PATHS.PUBLIC.SCHOOL_ACADEMIC as RoutePathEntry).shortName,
        enabled: true,
        tooltip: ''
      },
      { 
        name: PATHS.PUBLIC.SCHOOL_FINANCIALS.title, 
        path: replacePathParams(PATHS.PUBLIC.SCHOOL_FINANCIALS.path, { id: currentSchool.id }),
        shortName: (PATHS.PUBLIC.SCHOOL_FINANCIALS as RoutePathEntry).shortName,
        enabled: false,
        tooltip: 'Coming Soon'
      },
      { 
        name: PATHS.PUBLIC.SCHOOL_DEMOGRAPHICS.title, 
        path: replacePathParams(PATHS.PUBLIC.SCHOOL_DEMOGRAPHICS.path, { id: currentSchool.id }),
        shortName: (PATHS.PUBLIC.SCHOOL_DEMOGRAPHICS as RoutePathEntry).shortName,
        enabled: false,
        tooltip: 'Coming Soon'
      },
      { 
        name: PATHS.PUBLIC.SCHOOL_SAFETY.title, 
        path: replacePathParams(PATHS.PUBLIC.SCHOOL_SAFETY.path, { id: currentSchool.id }),
        shortName: (PATHS.PUBLIC.SCHOOL_SAFETY as RoutePathEntry).shortName,
        enabled: true,
        tooltip: ''
      },
      { 
        name: PATHS.PUBLIC.SCHOOL_STAFF.title, 
        path: replacePathParams(PATHS.PUBLIC.SCHOOL_STAFF.path, { id: currentSchool.id }),
        shortName: (PATHS.PUBLIC.SCHOOL_STAFF as RoutePathEntry).shortName,
        enabled: false,
        tooltip: 'Coming Soon'
      },
      { 
        name: PATHS.PUBLIC.SCHOOL_CONTACT.title, 
        path: replacePathParams(PATHS.PUBLIC.SCHOOL_CONTACT.path, { id: currentSchool.id }),
        shortName: (PATHS.PUBLIC.SCHOOL_CONTACT as RoutePathEntry).shortName,
        enabled: true,
        tooltip: ''
      }
    ];
    
    // Update the school pages
    dispatch(setSchool({
      id: currentSchool.id,
      name: currentSchool.name,
      availablePages: schoolPages
    }));
  }
);

// Thunk action to update current page based on pathname
export const updateCurrentPage = createAsyncThunk(
  'page/updateCurrentPage',
  (pathname: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const { district, school } = state.page;
    
    // Try to match against school pages first (more specific)
    if (school.availablePages.length > 0) {
      const matchedPage = determineCurrentPage(pathname, school.availablePages);
      if (matchedPage) {
        dispatch(setCurrentPage(matchedPage));
        return;
      }
    }
    
    // Then try district pages
    if (district.availablePages.length > 0) {
      const matchedPage = determineCurrentPage(pathname, district.availablePages);
      if (matchedPage) {
        dispatch(setCurrentPage(matchedPage));
        return;
      }
    }
    
    // Default to home page if no match
    dispatch(setCurrentPage({
      name: 'Home',
      path: '/',
      enabled: true,
      tooltip: ''
    }));
  }
);

// Export selectors
export const selectDistrict = (state: RootState) => state.page.district;
export const selectSchool = (state: RootState) => state.page.school;
export const selectCurrentPage = (state: RootState) => state.page.currentPage;
export const selectShowSecondaryNav = (state: RootState) => state.page.showSecondaryNav;

// Middleware factory for syncing location with page state
export const createSyncLocationWithPageMiddleware = () => {
  return (store: any) => (next: any) => (action: any) => {
    // First, run the original action
    const result = next(action);
    
    // After the action has been processed, check if it was one of our district-related target actions
    if (fetchDistrictById.fulfilled.match(action) || fetchDistrictBySchoolId.fulfilled.match(action)) {
      // We'll now handle this in the updateDistrictPages thunk
    }
    
    // Check if it was a school-related action
    if (fetchSchoolById.fulfilled.match(action)) {
      // We'll now handle this in the updateSchoolPages thunk
    }
    
    return result;
  };
};

// Export reducer
export default pageSlice.reducer; 
import { createSlice, createAction, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { PAGE_REGISTRY, PageEntry } from '@/routes/pageRegistry';
import { 
  fetchDistrictById, 
  fetchDistrictBySchoolId, 
  fetchSchoolById,
  Grade 
} from '@/store/slices/locationSlice';
import { matchPath } from 'react-router-dom';

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
  currentPageId: string; // Just store the ID instead of the whole entry
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

// Find a PageEntry from PAGE_REGISTRY based on a pathname
export const findPageEntryByPathname = (pathname: string): PageEntry => {
  // Search in all categories
  for (const category of Object.values(PAGE_REGISTRY)) {
    for (const pageKey of Object.keys(category)) {
      const page = category[pageKey];
      // Check if any of the URL patterns match
      if (page.urlPatterns && page.urlPatterns.some(pattern => 
        matchPath(pattern, pathname) !== null
      )) {
        return page;
      }
    }
  }
  // Default to home page if no match
  return PAGE_REGISTRY.general.home;
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
  currentPageId: PAGE_REGISTRY.general.home.id,
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
    setCurrentPage: (state, action: PayloadAction<{ pageId: string }>) => {
      state.currentPageId = action.payload.pageId;
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

// Helper function to convert a PageEntry to PageInfo with an entity ID
const pageEntryToPageInfo = (entry: PageEntry, entityId: number): PageInfo => {
  const path = replacePathParams(entry.urlPatterns[0], { id: entityId });
  return {
    name: entry.displayName,
    path,
    shortName: entry.shortName,
    enabled: typeof entry.enabled === 'function' ? false : entry.enabled, // We'll evaluate functions later
    tooltip: typeof entry.tooltip === 'function' ? '' : (entry.tooltip || '')
  };
};

// Thunk to update district pages after all data is loaded
export const updateDistrictPages = createAsyncThunk(
  'page/updateDistrictPages',
  (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const currentDistrict = state.location.currentDistrict;
    
    if (!currentDistrict) return;
    
    // Convert registry entries to page info objects
    const districtPages: PageInfo[] = Object.values(PAGE_REGISTRY.district).map(entry => {
      const pageInfo = pageEntryToPageInfo(entry, currentDistrict.id);
      
      // Handle conditional enabling
      if (typeof entry.enabled === 'function') {
        pageInfo.enabled = entry.enabled(currentDistrict);
      }
      
      // Handle conditional tooltips
      if (typeof entry.tooltip === 'function') {
        pageInfo.tooltip = entry.tooltip(currentDistrict);
      }
      
      return pageInfo;
    });
    
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
    
    // Convert registry entries to page info objects
    const schoolPages: PageInfo[] = Object.values(PAGE_REGISTRY.school).map(entry => {
      const pageInfo = pageEntryToPageInfo(entry, currentSchool.id);
      
      // Handle conditional enabling
      if (typeof entry.enabled === 'function') {
        pageInfo.enabled = entry.enabled(currentSchool);
      }
      
      // Handle conditional tooltips
      if (typeof entry.tooltip === 'function') {
        pageInfo.tooltip = entry.tooltip(currentSchool);
      }
      
      return pageInfo;
    });
    
    // Update the school pages
    dispatch(setSchool({
      id: currentSchool.id,
      name: currentSchool.name,
      availablePages: schoolPages
    }));
  }
);

// Update current page based on location
export const updateCurrentPage = createAsyncThunk(
  'page/updateCurrentPage',
  async (pathname: string, { dispatch }) => {
    const pageEntry = findPageEntryByPathname(pathname);
    
    // Set the current page using the pageId
    dispatch(setCurrentPage({ pageId: pageEntry.id }));
    
    return pageEntry.id;
  }
);

// Middleware to sync location with page state
export const createSyncLocationWithPageMiddleware = () => {
  return (store: any) => (next: any) => (action: any) => {
    // Call the next dispatch method in the middleware chain
    const result = next(action);
    
    // If we're changing the district or school, fetch the appropriate data
    if (action.type === 'location/setCurrentDistrictId') {
      const districtId = action.payload;
      
      if (districtId) {
        // Fetch the district data based on the ID
        store.dispatch(fetchDistrictById(districtId));
      } else {
        // Clear district and school states if ID is null
        store.dispatch(setDistrict({ id: null, name: '', availablePages: [] }));
        store.dispatch(setSchool({ id: null, name: '', availablePages: [] }));
      }
    }
    
    if (action.type === 'location/setCurrentSchoolId') {
      const schoolId = action.payload;
      
      if (schoolId) {
        // Fetch the school data based on the ID
        store.dispatch(fetchSchoolById(schoolId));
        
        // Fetch the parent district for this school
        store.dispatch(fetchDistrictBySchoolId(schoolId));
      } else {
        // Clear school state if ID is null
        store.dispatch(setSchool({ id: null, name: '', availablePages: [] }));
      }
    }
    
    return result;
  };
};

// Helper function to get the PageEntry from the PAGE_REGISTRY by ID
export const getPageEntryById = (pageId: string): PageEntry => {
  // Search in all registry categories
  for (const category of Object.values(PAGE_REGISTRY)) {
    for (const key of Object.keys(category)) {
      if (category[key].id === pageId) {
        return category[key];
      }
    }
  }
  
  // Fallback to home
  return PAGE_REGISTRY.general.home;
};

// Selectors
export const selectDistrict = (state: RootState) => state.page.district;
export const selectSchool = (state: RootState) => state.page.school;
export const selectCurrentPageId = (state: RootState) => state.page.currentPageId;
export const selectCurrentPage = (state: RootState) => getPageEntryById(state.page.currentPageId);
export const selectShowSecondaryNav = (state: RootState) => state.page.showSecondaryNav;

export default pageSlice.reducer; 
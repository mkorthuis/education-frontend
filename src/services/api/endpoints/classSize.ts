import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

// Base URL for all class size related requests
const BASE_ENDPOINT_URL = BASE_API_URL + 'class-size/';

// =======================
//  Query Param Interfaces
// =======================

// Base class size options
interface BaseClassSizeOptions {
    year?: number;
}

// School class size options
interface SchoolClassSizeOptions extends BaseClassSizeOptions {
    school_id?: number;
    district_id?: number;
}

// District class size options
interface DistrictClassSizeOptions extends BaseClassSizeOptions {
    district_id?: number;
}

// State class size options
interface StateClassSizeOptions extends BaseClassSizeOptions {}

// Helper to build URLs for class size endpoints
const buildClassSizeUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const classSizeApi = {
    // ===== School Class Size Data =====
    getSchoolClassSizeData: (
        options: SchoolClassSizeOptions = {},
        forceRefresh = false
    ) => fetchData(buildClassSizeUrl('class-size/school', options), forceRefresh),

    // ===== District Class Size Data =====
    getDistrictClassSizeData: (
        options: DistrictClassSizeOptions = {},
        forceRefresh = false
    ) => fetchData(buildClassSizeUrl('class-size/district', options), forceRefresh),

    // ===== State Class Size Data =====
    getStateClassSizeData: (
        options: StateClassSizeOptions = {},
        forceRefresh = false
    ) => fetchData(buildClassSizeUrl('class-size/state', options), forceRefresh)
}; 
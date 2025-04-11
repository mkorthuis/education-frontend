import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'location/';

// Helper function specific to location endpoints
const buildLocationUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const locationApi = {
    // Base endpoints
    getDistricts: (forceRefresh = false) => 
        fetchData(buildLocationUrl('district', { is_public: true }), forceRefresh),
    
    getGrades: (forceRefresh = false) => 
        fetchData(buildLocationUrl('grade'), forceRefresh),
    
    // ID-based endpoints
    getDistrictById: (id: number, forceRefresh = false) => 
        fetchData(buildLocationUrl(`district/${id}`), forceRefresh),
    
    getSchoolById: (id: number, forceRefresh = false) => 
        fetchData(buildLocationUrl(`school/${id}`), forceRefresh),
    
    getGradeById: (id: string, forceRefresh = false) => 
        fetchData(buildLocationUrl(`grade/${id}`), forceRefresh),
    
    // Relation-based endpoints
    getSchoolsByDistrictId: (id: number, forceRefresh = false) => 
        fetchData(buildLocationUrl('school', { district_id: id }), forceRefresh),
    
    getDistrictBySchoolId: (id: number, forceRefresh = false) => 
        fetchData(buildLocationUrl('district', { school_id: id }), forceRefresh),
    
    getTownsByDistrictId: (id: number, forceRefresh = false) => 
        fetchData(buildLocationUrl('town', { district_id: id }), forceRefresh),
    
    getSauByDistrictId: (id: number, forceRefresh = false) => 
        fetchData(buildLocationUrl('sau', { district_id: id }), forceRefresh)
};
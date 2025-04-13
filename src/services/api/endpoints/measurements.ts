import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'measurement/';

// Define interfaces for measurement options
interface LatestMeasurementOptions {
    district_id?: string;
    school_id?: string;
    measurement_type_id?: string;
    year?: string;
}

// Helper function specific to measurement endpoints
const buildMeasurementUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const measurementApi = {
    getLatestMeasurements: (options: LatestMeasurementOptions, forceRefresh = false) => 
        fetchData(buildMeasurementUrl('latest', options), forceRefresh),
    
    getLatestDistrictMeasurements: (districtId: string, forceRefresh = false) => 
        fetchData(buildMeasurementUrl('latest', { district_id: districtId }), forceRefresh),
    
    getLatestSchoolMeasurements: (schoolId: string, forceRefresh = false) => 
        fetchData(buildMeasurementUrl('latest', { school_id: schoolId }), forceRefresh),
    
    getMeasurementTypes: (forceRefresh = false) => 
        fetchData(buildMeasurementUrl('type'), forceRefresh)
};
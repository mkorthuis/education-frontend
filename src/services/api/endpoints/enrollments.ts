import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'enrollment/';

export const enrollmentApi = {
    getLatestSchoolEnrollment: (schoolId: string, forceRefresh = false) => 
        fetchData(buildUrl(BASE_ENDPOINT_URL, `school/${schoolId}/latest`), forceRefresh),
    
    getStateEnrollment: (forceRefresh = false) => 
        fetchData(buildUrl(BASE_ENDPOINT_URL, 'state'), forceRefresh)
};
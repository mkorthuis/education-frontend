import axiosInstance from '../config/axios';
import { BASE_API_URL } from '../config/constants';
import { skipCache, invalidateCache } from '../../../utils/cacheUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'enrollment/';


export const enrollmentApi = {

    getLatestSchoolEnrollment: async (schoolId: string, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `school/${schoolId}/latest`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },
    
        
};
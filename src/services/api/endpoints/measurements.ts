import axiosInstance from '../config/axios';
import { BASE_API_URL } from '../config/constants';
import { skipCache, invalidateCache } from '../../../utils/cacheUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'measurement/';


export const measurementApi = {

    getLatestMeasurements: async (districtId: string, schoolId: string, measurementTypeId: string, year: string, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `latest?district_id=${districtId}&school_id=${schoolId}&measurement_type_id=${measurementTypeId}&year=${year}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getLatestDistrictMeasurements: async (districtId: string, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `latest?district_id=${districtId}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getLatestSchoolMeasurements: async (schoolId: string, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `latest?school_id=${schoolId}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },
    
    getMeasurementTypes: async (forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + 'type';
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },
        
};
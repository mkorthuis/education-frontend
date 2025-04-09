import axiosInstance from '../config/axios';
import { BASE_API_URL } from '../config/constants';
import { skipCache, invalidateCache } from '../../../utils/cacheUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'location/';


export const locationApi = {

    getDistricts: async (forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + 'district?is_public=true';
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },
    
    getDistrictById: async (id: number, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `district/${id}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getSchoolsByDistrictId: async (id: number, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `school?district_id=${id}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getSchoolById: async (id: number, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `school/${id}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getDistrictBySchoolId: async (id: number, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `district?school_id=${id}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getTownsByDistrictId: async (id: number, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `town?district_id=${id}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getSauByDistrictId: async (id: number, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `sau?district_id=${id}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getGrades: async (forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + 'grade';
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getGradeById: async (id: string, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `grade/${id}`;
        const response = await axiosInstance.get(
            url,
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },
    
};
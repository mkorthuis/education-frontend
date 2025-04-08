import axiosInstance from '../config/axios';
import { BASE_API_URL } from '../config/constants';
import { skipCache, invalidateCache } from '../../../utils/cacheUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'assessments/';


export const assessmentsApi = {

    getAssessmentSubgroups: async (forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `subgroup`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getAssessmentSubjects: async (forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `subject`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getAssessmentStateData: async (
        forceRefresh = false,
        options?: {
            year?: string;
            assessment_subgroup_id?: string;
            assessment_subject_id?: string;
            grade_id?: string;
        }
    ) => {
        const url = BASE_ENDPOINT_URL + `state`;
        const params = new URLSearchParams();
        
        if (options) {
            if (options.year) params.append('year', options.year);
            if (options.assessment_subgroup_id) params.append('assessment_subgroup_id', options.assessment_subgroup_id);
            if (options.assessment_subject_id) params.append('assessment_subject_id', options.assessment_subject_id);
            if (options.grade_id) params.append('grade_id', options.grade_id);
        }
        
        const queryString = params.toString();
        const finalUrl = queryString ? `${url}?${queryString}` : url;
        
        const response = await axiosInstance.get(
            finalUrl, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getAssessmentDistrictData: async (
        forceRefresh = false,
        options?: {
            district_id?: string;
            year?: string;
            assessment_subgroup_id?: string;
            assessment_subject_id?: string;
            grade_id?: string;
        }
    ) => {
        const url = BASE_ENDPOINT_URL + `district`;
        const params = new URLSearchParams();
        
        if (options) {
            if (options.district_id) params.append('district_id', options.district_id);
            if (options.year) params.append('year', options.year);
            if (options.assessment_subgroup_id) params.append('assessment_subgroup_id', options.assessment_subgroup_id);
            if (options.assessment_subject_id) params.append('assessment_subject_id', options.assessment_subject_id);
            if (options.grade_id) params.append('grade_id', options.grade_id);
        }
        
        const queryString = params.toString();
        const finalUrl = queryString ? `${url}?${queryString}` : url;
        
        const response = await axiosInstance.get(
            finalUrl,  
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getAssessmentSchoolData: async (
        forceRefresh = false,
        options?: {
            school_id?: string;
            year?: string;
            assessment_subgroup_id?: string;
            assessment_subject_id?: string;
            grade_id?: string;
        }
    ) => {
        const url = BASE_ENDPOINT_URL + `school`;
        const params = new URLSearchParams();   
        
        if (options) {
            if (options.school_id) params.append('school_id', options.school_id);
            if (options.year) params.append('year', options.year);
            if (options.assessment_subgroup_id) params.append('assessment_subgroup_id', options.assessment_subgroup_id);
            if (options.assessment_subject_id) params.append('assessment_subject_id', options.assessment_subject_id);
            if (options.grade_id) params.append('grade_id', options.grade_id);
        }
        
        const queryString = params.toString();
        const finalUrl = queryString ? `${url}?${queryString}` : url;
        
        const response = await axiosInstance.get(
            finalUrl, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getLatestSchoolEnrollment: async (schoolId: string, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `school/${schoolId}/latest`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getStateEnrollment: async (forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `state`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },
        
};
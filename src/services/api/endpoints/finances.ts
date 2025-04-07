import axiosInstance from '../config/axios';
import { BASE_API_URL } from '../config/constants';
import { skipCache, invalidateCache } from '../../../utils/cacheUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'finance/';


export const financeApi = {

    getFinanceData: async (districtId: string, year?: string, forceRefresh = false) => {
        const queryParams = new URLSearchParams();
        queryParams.append('district_id', districtId);
        if (year) {
            queryParams.append('year', year);
        }
        
        const url = BASE_ENDPOINT_URL + `report?${queryParams.toString()}`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getEntryTypes: async (forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + 'entry-types';
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },
    
    getFundTypes: async (forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + 'fund-types';
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getPerPupilExpendituresForDistrict: async (districtId: string, year?: string, forceRefresh = false) => {
        const queryParams = new URLSearchParams();
        queryParams.append('district_id', districtId);
        if (year) {
            queryParams.append('year', year);
        }
        
        const url = BASE_ENDPOINT_URL + `per-pupil/district?${queryParams.toString()}`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getPerPupilExpendituresForState: async (year?: string, forceRefresh = false) => {
        const queryParams = new URLSearchParams();
        if (year) {
            queryParams.append('year', year);
        }
       
        const url = BASE_ENDPOINT_URL + `per-pupil/state?${queryParams.toString()}`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getStateExpenditureRollups: async (year?: string, forceRefresh = false) => {
        const queryParams = new URLSearchParams();
        if (year) {
            queryParams.append('year', year);
        }
        const url = BASE_ENDPOINT_URL + `state-expenditure-rollup?${queryParams.toString()}`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },

    getStateRevenue: async (year?: string, revenueEntryTypeId?: string, forceRefresh = false) => {
        const queryParams = new URLSearchParams();
        if (year) {
            queryParams.append('year', year);
        }
        if (revenueEntryTypeId) {
            queryParams.append('revenue_entry_type_id', revenueEntryTypeId);
        }
        const url = BASE_ENDPOINT_URL + `state-revenue?${queryParams.toString()}`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },   

    getStateExpenditure: async (year?: string, expenditureEntryTypeId?: string, forceRefresh = false) => {
        const queryParams = new URLSearchParams();
        if (year) {
            queryParams.append('year', year);
        }
        if (expenditureEntryTypeId) {
            queryParams.append('expenditure_entry_type_id', expenditureEntryTypeId);
        }
        const url = BASE_ENDPOINT_URL + `state-expenditure?${queryParams.toString()}`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    }
};  
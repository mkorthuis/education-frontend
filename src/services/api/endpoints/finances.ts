import axiosInstance from '../config/axios';
import { BASE_API_URL } from '../config/constants';
import { skipCache, invalidateCache } from '../../../utils/cacheUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'finance/';


export const financeApi = {

    getFinanceData: async (districtId: string, year: string, forceRefresh = false) => {
        const url = BASE_ENDPOINT_URL + `report?district_id=${districtId}&year=${year}`;
        const response = await axiosInstance.get(
            url, 
            forceRefresh ? skipCache() : undefined
        );
        return response.data;
    },
    
        
};
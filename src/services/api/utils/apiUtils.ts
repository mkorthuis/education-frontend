import axiosInstance from '../config/axios';
import { skipCache } from '../../../utils/cacheUtils';

/**
 * Builds a URL with query parameters
 * 
 * @param baseUrl The base endpoint URL
 * @param endpoint The specific endpoint path
 * @param options Optional query parameters
 * @returns The complete URL with query string
 */
export const buildUrl = (baseUrl: string, endpoint: string, options: Record<string, any> = {}): string => {
    const url = baseUrl + endpoint;
    const params = new URLSearchParams();
    
    // Add params that exist to URL params
    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
            params.append(key, value.toString());
        }
    });
    
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
};

/**
 * Makes an API GET request with optional cache control
 * 
 * @param url The URL to fetch
 * @param forceRefresh Whether to bypass cache
 * @returns The response data
 */
export const fetchData = async (url: string, forceRefresh = false) => {
    const response = await axiosInstance.get(url, forceRefresh ? skipCache() : undefined);
    return response.data;
}; 
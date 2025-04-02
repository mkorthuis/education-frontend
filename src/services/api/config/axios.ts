import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { logout } from '@features/auth/services/auth';
import { BASE_API_URL } from './constants';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Extend Axios types to include our custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipCache?: boolean;
  }
}

// Simple cache implementation
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check if we should use cached data
    if (config.method === 'get' && !config.skipCache) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cachedResponse = cache[cacheKey];
      
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
        // Return cached data by rejecting request with cached data
        return Promise.reject({
          __CACHED__: true,
          response: { data: cachedResponse.data }
        });
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
      // Cache successful GET responses
      if (response.config.method === 'get' && !response.config.skipCache) {
        const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
        cache[cacheKey] = {
          data: response.data,
          timestamp: Date.now()
        };
      }
      return response;
    },
    async (error) => {
      // Return cached response if this is our special cache case
      if (error.__CACHED__) {
        return error.response;
      }

      const originalRequest = error.config;
  
      // If the error status is 401 and there is no originalRequest._retry flag,
      // it means the token has expired and we need to refresh it
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
  
        try {
          const response = await axios.post(`${BASE_URL}${BASE_API_URL}user/login/refresh-token`, {}, { withCredentials: true });
          const { access_token } = response.data;
  
          localStorage.setItem('access_token', access_token);
  
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return axios(originalRequest);
        } catch (error) {
          logout();
        }
      }

      if (error.response?.status === 401) {
        logout();
      }
  
      return Promise.reject(error);
    }
  );

export default axiosInstance;

// Helper to clear the cache (useful after mutations)
export const clearCache = () => {
  Object.keys(cache).forEach(key => delete cache[key]);
};

// Helper to clear a specific cache entry
export const clearCacheEntry = (url: string, params?: any) => {
  const cacheKey = `${url}${JSON.stringify(params || {})}`;
  delete cache[cacheKey];
};
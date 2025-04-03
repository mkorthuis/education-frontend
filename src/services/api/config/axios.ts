import axios, { AxiosRequestConfig } from 'axios';
import { 
  authInterceptor, 
  cacheInterceptor, 
  loggerInterceptor, 
  contentTypeInterceptor, 
  requestErrorHandler
} from './interceptors/requestInterceptors';
import {
  responseSuccessInterceptor,
  responseErrorInterceptor
} from './interceptors/responseInterceptors';
import {
  requestTimingInterceptor,
  responseTimingInterceptor,
  errorTimingInterceptor
} from './interceptors/performanceInterceptors';
import {
  clearCache,
  clearCacheEntry
} from './interceptors/cacheUtils';
import { logout } from '@features/auth/services/auth';
import { BASE_API_URL } from './constants';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Extend Axios types to include our custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipCache?: boolean;
  }
}

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Accept': 'application/json'
  }
});

// Add request interceptors (in order of execution)
axiosInstance.interceptors.request.use(requestTimingInterceptor);
axiosInstance.interceptors.request.use(loggerInterceptor);
axiosInstance.interceptors.request.use(authInterceptor);
axiosInstance.interceptors.request.use(contentTypeInterceptor);
axiosInstance.interceptors.request.use(cacheInterceptor, requestErrorHandler);

// Add response interceptors (in order of execution)
axiosInstance.interceptors.response.use(
  responseTimingInterceptor, 
  errorTimingInterceptor
);
axiosInstance.interceptors.response.use(
  responseSuccessInterceptor, 
  responseErrorInterceptor
);

export default axiosInstance;

// Export cache utilities for public use
export { clearCache, clearCacheEntry };
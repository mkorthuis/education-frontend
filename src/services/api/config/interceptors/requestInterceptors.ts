import { InternalAxiosRequestConfig } from 'axios';

// Cache handling types
interface CacheEntry {
  data: any;
  timestamp: number;
}

export const cache: Record<string, CacheEntry> = {};
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Authentication interceptor - adds auth token to request headers
 */
export const authInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

/**
 * Cache interceptor - handles caching for GET requests
 */
export const cacheInterceptor = (config: InternalAxiosRequestConfig) => {
  // Check if we should use cached data (only for GET requests)
  if (config.method?.toLowerCase() === 'get' && !config.skipCache) {
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
};

/**
 * Logger interceptor - logs all outgoing requests
 */
export const loggerInterceptor = (config: InternalAxiosRequestConfig) => {
  if (import.meta.env.DEV) {
    console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
      headers: config.headers
    });
  }
  return config;
};

/**
 * Content type interceptor - ensures proper content type is set
 */
export const contentTypeInterceptor = (config: InternalAxiosRequestConfig) => {
  if (config.method?.toLowerCase() !== 'get' && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
};

/**
 * Error handler for request interceptors
 */
export const requestErrorHandler = (error: any) => {
  if (import.meta.env.DEV) {
    console.error('Request interceptor error:', error);
  }
  return Promise.reject(error);
}; 
import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Store request start times for calculating duration
const requestTimings: Record<string, number> = {};

/**
 * Request timing interceptor - records when a request starts
 */
export const requestTimingInterceptor = (config: InternalAxiosRequestConfig) => {
  // Generate a unique ID for this request
  const requestId = Math.random().toString(36).substring(2);
  config.headers['X-Request-ID'] = requestId;
  
  // Record the start time
  requestTimings[requestId] = performance.now();
  
  return config;
};

/**
 * Response timing interceptor - calculates and logs request duration
 */
export const responseTimingInterceptor = (response: AxiosResponse) => {
  const requestId = response.config.headers['X-Request-ID'] as string;
  
  if (requestId && requestTimings[requestId]) {
    const duration = performance.now() - requestTimings[requestId];
    
    // Log the timing in development mode
    if (import.meta.env.DEV) {
      console.log(`Request timing: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration.toFixed(2)}ms`);
    }
    
    // Clean up the timing entry
    delete requestTimings[requestId];
    
    // Add timing information to the response for potential analytics
    response.headers['X-Response-Time'] = duration.toString();
  }
  
  return response;
};

/**
 * Error timing interceptor - logs timing for failed requests
 */
export const errorTimingInterceptor = (error: any) => {
  if (error.config) {
    const requestId = error.config.headers['X-Request-ID'] as string;
    
    if (requestId && requestTimings[requestId]) {
      const duration = performance.now() - requestTimings[requestId];
      
      // Log the timing for failed requests in development mode
      if (import.meta.env.DEV) {
        console.error(`Failed request timing: ${error.config.method?.toUpperCase()} ${error.config.url} - ${duration.toFixed(2)}ms`);
      }
      
      // Clean up the timing entry
      delete requestTimings[requestId];
    }
  }
  
  return Promise.reject(error);
}; 
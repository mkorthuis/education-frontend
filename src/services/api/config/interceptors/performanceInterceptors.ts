import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// The start time travels on the request config (not a header): a custom header such as
// X-Request-ID makes the browser send a CORS preflight before every cross-origin GET.

/**
 * Request timing interceptor - records when a request starts
 */
export const requestTimingInterceptor = (config: InternalAxiosRequestConfig) => {
  config.requestStartTime = performance.now();
  return config;
};

/**
 * Response timing interceptor - calculates and logs request duration
 */
export const responseTimingInterceptor = (response: AxiosResponse) => {
  const startTime = response.config.requestStartTime;

  if (startTime !== undefined) {
    const duration = performance.now() - startTime;

    // Log the timing in development mode
    if (import.meta.env.DEV) {
      console.log(`Request timing: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration.toFixed(2)}ms`);
    }
  }

  return response;
};

/**
 * Error timing interceptor - logs timing for failed requests
 */
export const errorTimingInterceptor = (error: any) => {
  const startTime = error.config?.requestStartTime;

  if (startTime !== undefined) {
    const duration = performance.now() - startTime;

    // Log the timing for failed requests in development mode
    if (import.meta.env.DEV) {
      console.error(`Failed request timing: ${error.config.method?.toUpperCase()} ${error.config.url} - ${duration.toFixed(2)}ms`);
    }
  }

  return Promise.reject(error);
};

import axios, { AxiosResponse } from 'axios';
import { logout } from '@features/auth/services/auth';
import { cache } from './requestInterceptors';
import { API_BASE_URL, IS_DEV } from '@/utils/environment';
import { BASE_API_URL } from '../constants';

/**
 * Success response interceptor - handles caching successful responses
 */
export const responseSuccessInterceptor = (response: AxiosResponse) => {
  // Cache successful GET responses if not skipped
  if (response.config.method?.toLowerCase() === 'get' && !response.config.skipCache) {
    const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
  }
  
  // Log response in development
  if (IS_DEV) {
    console.log(`Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      data: response.data
    });
  }
  
  return response;
};

/**
 * Error response interceptor - handles different error scenarios
 */
export const responseErrorInterceptor = async (error: any) => {
  // Return cached response if this is our special cache case
  if (error.__CACHED__) {
    return error.response;
  }
  
  // Log error in development
  if (IS_DEV) {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
  }

  const originalRequest = error.config;
  
  // If status is 401 (Unauthorized) and we haven't tried to refresh yet
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      // Try to refresh the token
      const response = await axios.post(
        `${API_BASE_URL}${BASE_API_URL}user/login/refresh-token`,
        {},
        { withCredentials: true }
      );
      
      const { access_token } = response.data;

      // Save the new token
      localStorage.setItem('access_token', access_token);

      // Update the failed request with the new token and retry
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return axios(originalRequest);
    } catch (refreshError) {
      // If refresh token fails, log the user out
      logout();
      return Promise.reject(refreshError);
    }
  }

  // If it's still a 401 after refresh attempt, log out
  if (error.response?.status === 401) {
    logout();
  }

  // Handle other common error codes
  switch (error.response?.status) {
    case 403:
      console.error('Forbidden: You do not have permission to access this resource.');
      break;
    case 404:
      console.error('Not Found: The requested resource does not exist.');
      break;
    case 500:
      console.error('Server Error: Something went wrong on the server.');
      break;
    default:
      // Don't do anything special for other error codes
      break;
  }

  return Promise.reject(error);
}; 
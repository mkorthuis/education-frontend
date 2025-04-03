import { 
  clearCache as clearApiCache, 
  clearCacheEntry as clearApiCacheEntry 
} from '../services/api/config/interceptors/cacheUtils';

/**
 * Utility functions for managing API request caching
 */

/**
 * Clears all cached API responses.
 * Use this when doing a major state reset, like after logout.
 */
export const clearAllCache = clearApiCache;

/**
 * Clears cached API responses for a specific endpoint.
 * Use this after a mutation that affects the data from this endpoint.
 * 
 * @param url - The endpoint URL to clear from cache
 * @param params - Any params that were used with the request (optional)
 */
export const invalidateCache = clearApiCacheEntry;

/**
 * Creates a configuration object for Axios requests that should skip the cache
 * Use this for data that needs to be fresh every time
 * 
 * @returns Axios config object with skipCache set to true
 */
export const skipCache = () => ({
  skipCache: true
});

/**
 * Cache control utilities to use with API calls
 * 
 * Examples:
 * 
 * // Skip cache for a specific call:
 * await axiosInstance.get(url, skipCache());
 * 
 * // Invalidate cache after mutation:
 * await axiosInstance.post(createUrl, newData);
 * invalidateCache(getUrl);
 */ 
import { cache } from './requestInterceptors';

/**
 * Clears all cached API responses.
 * Use this when doing a major state reset, like after logout.
 */
export const clearCache = () => {
  Object.keys(cache).forEach(key => delete cache[key]);
};

/**
 * Clears cached API responses for a specific endpoint.
 * Use this after a mutation that affects the data from this endpoint.
 * 
 * @param url - The endpoint URL to clear from cache
 * @param params - Any params that were used with the request (optional)
 */
export const clearCacheEntry = (url: string, params?: any) => {
  const cacheKey = `${url}${JSON.stringify(params || {})}`;
  delete cache[cacheKey];
};

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
 * Clears all cache entries that match a URL pattern
 * Useful for invalidating multiple related endpoints at once
 * 
 * @param urlPattern - A string or regular expression to match against cache keys
 */
export const clearCachePattern = (urlPattern: string | RegExp) => {
  const pattern = typeof urlPattern === 'string' 
    ? new RegExp(urlPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    : urlPattern;
    
  Object.keys(cache).forEach(key => {
    if (pattern.test(key)) {
      delete cache[key];
    }
  });
}; 
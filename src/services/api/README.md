# API Service

This directory contains the API service for the education frontend application.

## Structure

- `config/` - API configuration files
  - `axios.ts` - Main Axios instance configuration
  - `constants.ts` - API constants
  - `interceptors/` - Axios interceptors for request/response handling
    - `requestInterceptors.ts` - Interceptors for outgoing requests
    - `responseInterceptors.ts` - Interceptors for incoming responses
    - `performanceInterceptors.ts` - Interceptors for performance monitoring
    - `cacheUtils.ts` - Utilities for cache management
- `endpoints/` - API endpoint definitions
  - `locations.ts`, `enrollments.ts`, etc. - Specific API endpoints

## Interceptors

### Request Interceptors

Request interceptors run before a request is sent. They are executed in the order they are added.

1. **Timing Interceptor**: Adds a unique request ID and records the start time
2. **Logger Interceptor**: Logs request details in development mode
3. **Auth Interceptor**: Adds authentication token to request headers
4. **Content Type Interceptor**: Ensures proper content-type headers
5. **Cache Interceptor**: Handles caching for GET requests

### Response Interceptors

Response interceptors run after a response is received. They are executed in the order they are added.

1. **Timing Interceptor**: Records and logs the request duration
2. **Success Interceptor**: Handles successful responses and caching
3. **Error Interceptor**: Handles error responses, token refresh, and error logging

## Cache System

The API service includes a caching system for GET requests to improve performance and reduce server load.

### Key features:

- **Automatic caching**: GET requests are automatically cached for 5 minutes
- **Cache invalidation**: Helper functions to clear specific cache entries
- **Cache skipping**: Option to bypass cache for specific requests
- **Pattern-based invalidation**: Clear cache entries matching a pattern

### Usage:

```typescript
// Skip cache for a specific request
await axiosInstance.get(url, { skipCache: true });

// Or use the utility function:
import { skipCache } from '@utils/cacheUtils';
await axiosInstance.get(url, skipCache());

// Clear cache after mutations
import { invalidateCache } from '@utils/cacheUtils';
await axiosInstance.post('/api/data', newData);
invalidateCache('/api/data');
```

## Performance Monitoring

The interceptors include performance monitoring features:

- Request timing (measures duration of each request)
- Timing logs in development mode
- Request IDs for tracking specific requests

## Error Handling

The interceptors provide comprehensive error handling:

- Automatic token refresh on 401 errors
- Logout on persistent authentication failures
- Error logging with detailed information
- Standard error handling for common HTTP status codes (403, 404, 500) 
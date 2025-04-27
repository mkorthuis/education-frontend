import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'education-freedom-account/';

// Define base interface for EFA options
interface BaseEfaOptions {
    year?: number | null;
}

interface EfaEntryOptions extends BaseEfaOptions {
    district_id?: number | null;
    town_id?: number | null;
}

interface EfaStateEntryOptions extends BaseEfaOptions {
    entry_type_id?: number | null;
}

// Helper function specific to education freedom account endpoints
const buildEfaUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const efaApi = {
    // Type endpoints
    getEfaEntryTypes: (options: BaseEfaOptions = {}, forceRefresh = false) => 
        fetchData(buildEfaUrl('entry-type', options), forceRefresh),
    
    // Data endpoints with filters
    getEfaEntries: (options: EfaEntryOptions = {}, forceRefresh = false) => 
        fetchData(buildEfaUrl('entry', options), forceRefresh),
        
    // State-level data endpoints
    getEfaStateEntries: (options: EfaStateEntryOptions = {}, forceRefresh = false) => 
        fetchData(buildEfaUrl('state-entry', options), forceRefresh)
};

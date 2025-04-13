import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'finance/';

// Define base interface for finance options
interface BaseFinanceOptions {
    year?: string;
}

interface DistrictFinanceOptions extends BaseFinanceOptions {
    district_id: number;
}

interface RevenueOptions extends BaseFinanceOptions {
    revenue_entry_type_id?: string;
}

interface ExpenditureOptions extends BaseFinanceOptions {
    expenditure_entry_type_id?: string;
}

// Helper function specific to finance endpoints
const buildFinanceUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const financeApi = {
    // Type endpoints
    getEntryTypes: (forceRefresh = false) => 
        fetchData(buildFinanceUrl('entry-types'), forceRefresh),
    
    getFundTypes: (forceRefresh = false) => 
        fetchData(buildFinanceUrl('fund-types'), forceRefresh),
    
    // Data endpoints
    getFinanceData: (options: DistrictFinanceOptions, forceRefresh = false) => 
        fetchData(buildFinanceUrl('report', options), forceRefresh),
    
    getPerPupilExpendituresForDistrict: (options: DistrictFinanceOptions, forceRefresh = false) => 
        fetchData(buildFinanceUrl('per-pupil/district', options), forceRefresh),
    
    getPerPupilExpendituresForState: (options: BaseFinanceOptions = {}, forceRefresh = false) => 
        fetchData(buildFinanceUrl('per-pupil/state', options), forceRefresh),
    
    getStateExpenditureRollups: (options: BaseFinanceOptions = {}, forceRefresh = false) => 
        fetchData(buildFinanceUrl('state-expenditure-rollup', options), forceRefresh),
    
    getStateRevenue: (options: RevenueOptions = {}, forceRefresh = false) => 
        fetchData(buildFinanceUrl('state-revenue', options), forceRefresh),
    
    getStateExpenditure: (options: ExpenditureOptions = {}, forceRefresh = false) => 
        fetchData(buildFinanceUrl('state-expenditure', options), forceRefresh)
};  
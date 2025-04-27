import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'enrollment/';

// Define base interface for enrollment options
interface BaseEnrollmentOptions {
    year?: number | null;
}

// Define town enrollment options interfaces
interface TownEnrollmentOptions extends BaseEnrollmentOptions {
    town_id?: number | null;
    district_id?: number | null;
}

interface StateTownEnrollmentOptions extends BaseEnrollmentOptions {
    grade_id?: number | null;
}

// Define enrollment data interfaces
export interface GradeData {
    id: number;
    name: string;
}

export interface SchoolEnrollmentData {
    id: number;
    school_id: number;
    grade_id: number;
    year: number;
    enrollment: number;
    grade: GradeData;
}

export interface StateEnrollmentData {
    id: number;
    year: number;
    elementary: number;
    middle: number;
    high: number;
    total: number;
    date_created: string;
    date_updated: string;
}

export interface TownEnrollmentData {
    id: number;
    town_id: number;
    grade_id: number;
    year: number;
    enrollment: number;
    grade: GradeData;
}

export interface StateTownEnrollmentData {
    year: number;
    grade_id: number;
    total_enrollment: number;
    grade: GradeData;
}

// Helper function specific to enrollment endpoints
const buildEnrollmentUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const enrollmentApi = {
    // School enrollment endpoint
    getLatestSchoolEnrollment: (schoolId: number, forceRefresh = false) => 
        fetchData(buildUrl(BASE_ENDPOINT_URL, `school/${schoolId}/latest`), forceRefresh),
    
    // State enrollment endpoint
    getStateEnrollment: (options: BaseEnrollmentOptions = {}, forceRefresh = false) => 
        fetchData(buildEnrollmentUrl('state', options), forceRefresh),
        
    // Town enrollment endpoints
    getTownEnrollment: (options: TownEnrollmentOptions = {}, forceRefresh = false) => 
        fetchData(buildEnrollmentUrl('town', options), forceRefresh),
        
    getStateTownEnrollment: (options: StateTownEnrollmentOptions = {}, forceRefresh = false) => 
        fetchData(buildEnrollmentUrl('town/state', options), forceRefresh)
};
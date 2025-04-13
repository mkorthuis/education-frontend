import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'assessment/';

// Define base interface for assessment options
interface BaseAssessmentOptions {
    year?: string;
    assessment_subgroup_id?: number;
    assessment_subject_id?: number;
    grade_id?: number;
}

interface DistrictAssessmentOptions extends BaseAssessmentOptions {
    district_id?: number;
}

interface SchoolAssessmentOptions extends BaseAssessmentOptions {
    school_id?: string;
}

// Helper function specific to assessment endpoints
const buildAssessmentUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const assessmentsApi = {
    // Type endpoints
    getAssessmentSubgroups: (forceRefresh = false) => 
        fetchData(buildAssessmentUrl('subgroup'), forceRefresh),
    
    getAssessmentSubjects: (forceRefresh = false) => 
        fetchData(buildAssessmentUrl('subject'), forceRefresh),
    
    // Data endpoints with filters
    getAssessmentStateData: (options: BaseAssessmentOptions = {}, forceRefresh = false) => 
        fetchData(buildAssessmentUrl('state', options), forceRefresh),
    
    getAssessmentDistrictData: (options: DistrictAssessmentOptions = {}, forceRefresh = false) => 
        fetchData(buildAssessmentUrl('district', options), forceRefresh),
    
    getAssessmentSchoolData: (options: SchoolAssessmentOptions = {}, forceRefresh = false) => 
        fetchData(buildAssessmentUrl('school', options), forceRefresh),
    
    getLatestSchoolEnrollment: (schoolId: string, forceRefresh = false) => 
        fetchData(buildAssessmentUrl(`school/${schoolId}/latest`), forceRefresh),
    
    getStateEnrollment: (forceRefresh = false) => 
        fetchData(buildAssessmentUrl('state'), forceRefresh)
};
import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'safety/';

// Define the base interface
interface BaseSafetyOptions {
    year?: string;
    school_id?: number;
    district_id?: number;
}

interface SchoolSafetyIncidentOptions extends BaseSafetyOptions {
    safety_type_id?: number;
}

interface DisciplineIncidentOptions extends BaseSafetyOptions {
    discipline_incident_type_id?: number;
}

interface DisciplineCountOptions extends BaseSafetyOptions {
    discipline_count_type_id?: number;
}

interface BullyingOptions extends BaseSafetyOptions {
    bullying_type_id?: number;
}

interface BullyingClassificationOptions extends BaseSafetyOptions {
    bullying_classification_type_id?: number;
}

interface BullyingImpactOptions extends BaseSafetyOptions {
    bullying_impact_type_id?: number;
}

interface HarassmentOptions extends BaseSafetyOptions {
    harassment_classification_id?: number;
}

// Helper function specific to safety endpoints
const buildSafetyUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const safetyApi = {
    // Type endpoints - simple getters
    getSchoolSafetyTypes: (forceRefresh = false) => 
        fetchData(buildSafetyUrl('school-safety-type'), forceRefresh),
    
    getDisciplineIncidentTypes: (forceRefresh = false) => 
        fetchData(buildSafetyUrl('discipline-incident-type'), forceRefresh),
    
    getDisciplineCountTypes: (forceRefresh = false) => 
        fetchData(buildSafetyUrl('discipline-count-type'), forceRefresh),
    
    getBullyingTypes: (forceRefresh = false) => 
        fetchData(buildSafetyUrl('bullying-type'), forceRefresh),
    
    getBullyingClassificationTypes: (forceRefresh = false) => 
        fetchData(buildSafetyUrl('bullying-classification-type'), forceRefresh),
    
    getBullyingImpactTypes: (forceRefresh = false) => 
        fetchData(buildSafetyUrl('bullying-impact-type'), forceRefresh),
    
    getHarassmentClassifications: (forceRefresh = false) => 
        fetchData(buildSafetyUrl('harassment-classification'), forceRefresh),
    
    // Data endpoints with filters
    getSchoolSafetyIncidents: (options: SchoolSafetyIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school-safety', options), forceRefresh),
    
    getTruancies: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('truancy', options), forceRefresh),
    
    getDisciplineIncidents: (options: DisciplineIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('discipline/incident', options), forceRefresh),
    
    getDisciplineCounts: (options: DisciplineCountOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('discipline/count', options), forceRefresh),
    
    getBullyingIncidents: (options: BullyingOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('bullying/incident', options), forceRefresh),
    
    getBullyingClassifications: (options: BullyingClassificationOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('bullying/classification', options), forceRefresh),
    
    getBullyingImpacts: (options: BullyingImpactOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('bullying/impact', options), forceRefresh),
    
    getHarassmentIncidents: (options: HarassmentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('harassment/incident', options), forceRefresh),
    
    getRestraints: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('restraint', options), forceRefresh),
    
    getSeclusions: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('seclusion', options), forceRefresh)
};
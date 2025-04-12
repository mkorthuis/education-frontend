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
    
    // School Level Data endpoints
    getSchoolSafetyIncidents: (options: SchoolSafetyIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/safety', options), forceRefresh),
    
    getSchoolTruancies: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/truancy', options), forceRefresh),
    
    getSchoolDisciplineIncidents: (options: DisciplineIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/discipline/incident', options), forceRefresh),
    
    getSchoolDisciplineCounts: (options: DisciplineCountOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/discipline/count', options), forceRefresh),
    
    getSchoolBullyingIncidents: (options: BullyingOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/bullying', options), forceRefresh),
    
    getSchoolBullyingClassifications: (options: BullyingClassificationOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/bullying/classification', options), forceRefresh),
    
    getSchoolBullyingImpacts: (options: BullyingImpactOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/bullying/impact', options), forceRefresh),
    
    getSchoolHarassmentIncidents: (options: HarassmentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/harassment', options), forceRefresh),
    
    getSchoolRestraints: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/restraint', options), forceRefresh),
    
    getSchoolSeclusions: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/seclusion', options), forceRefresh),
    
    // District Level Data endpoints
    getDistrictSafetyIncidents: (options: SchoolSafetyIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/safety', options), forceRefresh),
    
    getDistrictTruancies: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/truancy', options), forceRefresh),
    
    getDistrictDisciplineIncidents: (options: DisciplineIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/discipline/incident', options), forceRefresh),
    
    getDistrictDisciplineCounts: (options: DisciplineCountOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/discipline/count', options), forceRefresh),
    
    getDistrictBullyingIncidents: (options: BullyingOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/bullying', options), forceRefresh),
    
    getDistrictBullyingClassifications: (options: BullyingClassificationOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/bullying/classification', options), forceRefresh),
    
    getDistrictBullyingImpacts: (options: BullyingImpactOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/bullying/impact', options), forceRefresh),
    
    getDistrictHarassmentIncidents: (options: HarassmentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/harassment', options), forceRefresh),
    
    getDistrictRestraints: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/restraint', options), forceRefresh),
    
    getDistrictSeclusions: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/seclusion', options), forceRefresh),
    
    // State Level Data endpoints
    getStateSafetyIncidents: (options: SchoolSafetyIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/safety', options), forceRefresh),
    
    getStateTruancies: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/truancy', options), forceRefresh),
    
    getStateDisciplineIncidents: (options: DisciplineIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/discipline/incident', options), forceRefresh),
    
    getStateDisciplineCounts: (options: DisciplineCountOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/discipline/count', options), forceRefresh),
    
    getStateBullyingIncidents: (options: BullyingOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/bullying', options), forceRefresh),
    
    getStateBullyingClassifications: (options: BullyingClassificationOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/bullying/classification', options), forceRefresh),
    
    getStateBullyingImpacts: (options: BullyingImpactOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/bullying/impact', options), forceRefresh),
    
    getStateHarassmentIncidents: (options: HarassmentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/harassment', options), forceRefresh),
    
    getStateRestraints: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/restraint', options), forceRefresh),
    
    getStateSeclusions: (options: BaseSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/seclusion', options), forceRefresh)
};
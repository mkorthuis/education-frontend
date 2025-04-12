import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

const BASE_ENDPOINT_URL = BASE_API_URL + 'safety/';

// Define the base interface
interface BaseSchoolSafetyOptions {
    year?: string;
    school_id?: number;
    district_id?: number;
}

interface BaseDistrictSafetyOptions extends BaseSchoolSafetyOptions {
    year?: string
    district_id?: number;
}

interface BaseStateSafetyOptions extends BaseSchoolSafetyOptions {
    year?: string;
}

interface SchoolSafetyIncidentOptions extends BaseSchoolSafetyOptions {
    safety_type_id?: number;
}

interface SchoolDisciplineIncidentOptions extends BaseSchoolSafetyOptions {
    discipline_incident_type_id?: number;
}

interface SchoolDisciplineCountOptions extends BaseSchoolSafetyOptions {
    discipline_count_type_id?: number;
}

interface SchoolBullyingOptions extends BaseSchoolSafetyOptions {
    bullying_type_id?: number;
}

interface SchoolBullyingClassificationOptions extends BaseSchoolSafetyOptions {
    bullying_classification_type_id?: number;
}

interface SchoolBullyingImpactOptions extends BaseSchoolSafetyOptions {
    bullying_impact_type_id?: number;
}

interface SchoolHarassmentOptions extends BaseSchoolSafetyOptions {
    harassment_classification_id?: number;
}

interface DistrictSafetyIncidentOptions extends BaseDistrictSafetyOptions {
    safety_type_id?: number;
}

interface DistrictDisciplineIncidentOptions extends BaseDistrictSafetyOptions {
    discipline_incident_type_id?: number;
}

interface DistrictDisciplineCountOptions extends BaseDistrictSafetyOptions {
    discipline_count_type_id?: number;
}

interface DistrictBullyingOptions extends BaseDistrictSafetyOptions {
    bullying_type_id?: number;
}

interface DistrictBullyingClassificationOptions extends BaseDistrictSafetyOptions {
    bullying_classification_type_id?: number;
}

interface DistrictBullyingImpactOptions extends BaseDistrictSafetyOptions {
    bullying_impact_type_id?: number;
}

interface DistrictHarassmentOptions extends BaseDistrictSafetyOptions {
    harassment_classification_id?: number;
}

interface StateSafetyIncidentOptions extends BaseStateSafetyOptions {
    safety_type_id?: number;
}

interface StateDisciplineIncidentOptions extends BaseStateSafetyOptions {
    discipline_incident_type_id?: number;
}

interface StateDisciplineCountOptions extends BaseStateSafetyOptions {
    discipline_count_type_id?: number;
}

interface StateBullyingOptions extends BaseStateSafetyOptions {
    bullying_type_id?: number;
}

interface StateBullyingClassificationOptions extends BaseStateSafetyOptions {
    bullying_classification_type_id?: number;
}

interface StateBullyingImpactOptions extends BaseStateSafetyOptions {
    bullying_impact_type_id?: number;
}

interface StateHarassmentOptions extends BaseStateSafetyOptions {
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
    
    getSchoolTruancies: (options: BaseSchoolSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/truancy', options), forceRefresh),
    
    getSchoolDisciplineIncidents: (options: SchoolDisciplineIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/discipline/incident', options), forceRefresh),
    
    getSchoolDisciplineCounts: (options: SchoolDisciplineCountOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/discipline/count', options), forceRefresh),
    
    getSchoolBullyingIncidents: (options: SchoolBullyingOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/bullying', options), forceRefresh),
    
    getSchoolBullyingClassifications: (options: SchoolBullyingClassificationOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/bullying/classification', options), forceRefresh),
    
    getSchoolBullyingImpacts: (options: SchoolBullyingImpactOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/bullying/impact', options), forceRefresh),
    
    getSchoolHarassmentIncidents: (options: SchoolHarassmentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/harassment', options), forceRefresh),
    
    getSchoolRestraints: (options: BaseSchoolSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/restraint', options), forceRefresh),
    
    getSchoolSeclusions: (options: BaseSchoolSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/seclusion', options), forceRefresh),

    getSchoolEnrollment: (options: BaseSchoolSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('school/enrollment', options), forceRefresh),
    
    // District Level Data endpoints
    getDistrictSafetyIncidents: (options: DistrictSafetyIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/safety', options), forceRefresh),
    
    getDistrictTruancies: (options: BaseDistrictSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/truancy', options), forceRefresh),
    
    getDistrictDisciplineIncidents: (options: DistrictDisciplineIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/discipline/incident', options), forceRefresh),
    
    getDistrictDisciplineCounts: (options: DistrictDisciplineCountOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/discipline/count', options), forceRefresh),
    
    getDistrictBullyingIncidents: (options: DistrictBullyingOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/bullying', options), forceRefresh),
    
    getDistrictBullyingClassifications: (options: DistrictBullyingClassificationOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/bullying/classification', options), forceRefresh),
    
    getDistrictBullyingImpacts: (options: DistrictBullyingImpactOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/bullying/impact', options), forceRefresh),
    
    getDistrictHarassmentIncidents: (options: DistrictHarassmentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/harassment', options), forceRefresh),
    
    getDistrictRestraints: (options: BaseDistrictSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/restraint', options), forceRefresh),
    
    getDistrictSeclusions: (options: BaseDistrictSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/seclusion', options), forceRefresh),

    getDistrictEnrollment: (options: BaseDistrictSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('district/enrollment', options), forceRefresh),
    
    // State Level Data endpoints
    getStateSafetyIncidents: (options: SchoolSafetyIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/safety', options), forceRefresh),
    
    getStateTruancies: (options: BaseStateSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/truancy', options), forceRefresh),
    
    getStateDisciplineIncidents: (options: StateDisciplineIncidentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/discipline/incident', options), forceRefresh),
    
    getStateDisciplineCounts: (options: StateDisciplineCountOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/discipline/count', options), forceRefresh),
    
    getStateBullyingIncidents: (options: StateBullyingOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/bullying', options), forceRefresh),
    
    getStateBullyingClassifications: (options: StateBullyingClassificationOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/bullying/classification', options), forceRefresh),
    
    getStateBullyingImpacts: (options: StateBullyingImpactOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/bullying/impact', options), forceRefresh),
    
    getStateHarassmentIncidents: (options: StateHarassmentOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/harassment', options), forceRefresh),
    
    getStateRestraints: (options: BaseStateSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/restraint', options), forceRefresh),
    
    getStateSeclusions: (options: BaseStateSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/seclusion', options), forceRefresh),

    getStateEnrollment: (options: BaseStateSafetyOptions = {}, forceRefresh = false) => 
        fetchData(buildSafetyUrl('state/enrollment', options), forceRefresh)
};
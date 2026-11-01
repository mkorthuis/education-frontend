export interface BaseSchoolParams {
    year?: string;
    forceRefresh?: boolean;
    school_id?: number;
    district_id?: number;
}
export interface SchoolSafetyParams extends BaseSchoolParams { safety_type_id?: number; }
export interface SchoolBullyingParams extends BaseSchoolParams { bullying_type_id?: number; }
export interface SchoolBullyingClassificationParams extends BaseSchoolParams { bullying_classification_type_id?: number; }
export interface SchoolBullyingImpactParams extends BaseSchoolParams { bullying_impact_type_id?: number; }
export interface SchoolDisciplineIncidentParams extends BaseSchoolParams { discipline_incident_type_id?: number; }
export interface SchoolDisciplineCountParams extends BaseSchoolParams { discipline_count_type_id?: number; }
export interface SchoolHarassmentParams extends BaseSchoolParams { harassment_classification_id?: number; }

export interface BaseDistrictParams {
    year?: string;
    forceRefresh?: boolean;
    district_id?: number;
}
export interface DistrictSafetyParams extends BaseDistrictParams { safety_type_id?: number; }
export interface DistrictBullyingParams extends BaseDistrictParams { bullying_type_id?: number; }
export interface DistrictBullyingClassificationParams extends BaseDistrictParams { bullying_classification_type_id?: number; }
export interface DistrictBullyingImpactParams extends BaseDistrictParams { bullying_impact_type_id?: number; }
export interface DistrictDisciplineIncidentParams extends BaseDistrictParams { discipline_incident_type_id?: number; }
export interface DistrictDisciplineCountParams extends BaseDistrictParams { discipline_count_type_id?: number; }
export interface DistrictHarassmentParams extends BaseDistrictParams { harassment_classification_id?: number; }

export interface BaseStateParams {
    year?: string;
    forceRefresh?: boolean;
}
export interface StateSafetyParams extends BaseStateParams { safety_type_id?: number; }
export interface StateBullyingParams extends BaseStateParams { bullying_type_id?: number; }
export interface StateBullyingClassificationParams extends BaseStateParams { bullying_classification_type_id?: number; }
export interface StateBullyingImpactParams extends BaseStateParams { bullying_impact_type_id?: number; }
export interface StateDisciplineIncidentParams extends BaseStateParams { discipline_incident_type_id?: number; }
export interface StateDisciplineCountParams extends BaseStateParams { discipline_count_type_id?: number; }
export interface StateHarassmentParams extends BaseStateParams { harassment_classification_id?: number; }

export interface SchoolSafetyType {
    id: number;
    name: string;
}

export interface BaseTruancyData {
    id: number;
    year: number;
    count: number;
}
export interface SchoolTruancyData extends BaseTruancyData { school_id: number; }
export interface DistrictTruancyData extends BaseTruancyData { district_id: number; }
export interface StateTruancyData extends BaseTruancyData {}

export interface SafetyTypeData {
    id: number;
    name: string;
}

export interface BaseSafetyData {
    id: number;
    year: number;
    count: number;
    safety_type: SafetyTypeData;
}
export interface SchoolSafetyData extends BaseSafetyData { school_id: number; }
export interface DistrictSafetyData extends BaseSafetyData { district_id: number; }
export interface StateSafetyData extends BaseSafetyData {}

export interface BaseHarassmentData {
    id: number;
    year: number;
    incident_count: number;
    student_impact_count: number;
    student_engaged_count: number;
    classification: HarassmentClassificationData;
}
export interface SchoolHarassmentData extends BaseHarassmentData { school_id: number; }
export interface DistrictHarassmentData extends BaseHarassmentData { district_id: number; }
export interface StateHarassmentData extends BaseHarassmentData {}

export interface HarassmentClassificationData {
    id: number;
    name: string;
}
export interface BaseSeclusionData {
    id: number;
    year: number;
    generated: number;
    active_investigation: number;
    closed_investigation: number;
}
export interface SchoolSeclusionData extends BaseSeclusionData { school_id: number; }
export interface DistrictSeclusionData extends BaseSeclusionData { district_id: number; }
export interface StateSeclusionData extends BaseSeclusionData {}

export interface BaseRestraintData {
    id: number;
    school_id: number;
    year: number;
    generated: number;
    active_investigation: number;
    closed_investigation: number;
    bodily_injury: number;
    serious_injury: number;
}
export interface SchoolRestraintData extends BaseRestraintData { school_id: number; }
export interface DistrictRestraintData extends BaseRestraintData { district_id: number; }
export interface StateRestraintData extends BaseRestraintData {}

export interface BaseBullyingData {
    id: number;
    school_id: number;
    year: number;
    reported: number;
    investigated_actual: number;
    bullying_type: {
        id: number;
        name: string;
    };
}
export interface SchoolBullyingData extends BaseBullyingData { school_id: number; }
export interface DistrictBullyingData extends BaseBullyingData { district_id: number; }
export interface StateBullyingData extends BaseBullyingData {}

export interface BaseBullyingClassificationData {
    id: number;
    school_id: number;
    year: number;
    count: number;
    classification_type: {
        id: number;
        name: string;
    };
}
export interface SchoolBullyingClassificationData extends BaseBullyingClassificationData { school_id: number; }
export interface DistrictBullyingClassificationData extends BaseBullyingClassificationData { district_id: number; }
export interface StateBullyingClassificationData extends BaseBullyingClassificationData {}

export interface BaseBullyingImpactData {
    id: number;
    school_id: number;
    year: number;
    count: number;
    impact_type: {
        id: number;
        name: string;
    };
}
export interface SchoolBullyingImpactData extends BaseBullyingImpactData { school_id: number; }
export interface DistrictBullyingImpactData extends BaseBullyingImpactData { district_id: number; }
export interface StateBullyingImpactData extends BaseBullyingImpactData {}

export interface BaseDisciplineCountData {
    id: number;
    school_id: number;
    year: number;
    count: number;
    count_type: {
        id: number;
        name: string;
    };
}
export interface SchoolDisciplineCountData extends BaseDisciplineCountData { school_id: number; }
export interface DistrictDisciplineCountData extends BaseDisciplineCountData { district_id: number; }
export interface StateDisciplineCountData extends BaseDisciplineCountData {}

export interface BaseDisciplineIncidentData {
    id: number;
    school_id: number;
    year: number;
    count: number;
    incident_type: {
        id: number;
        name: string;
    };
}
export interface SchoolDisciplineIncidentData extends BaseDisciplineIncidentData { school_id: number; }
export interface DistrictDisciplineIncidentData extends BaseDisciplineIncidentData { district_id: number; }
export interface StateDisciplineIncidentData extends BaseDisciplineIncidentData {}

export interface BaseEnrollmentData {
    year: number;
    total_enrollment: number;
}
export interface SchoolEnrollmentData extends BaseEnrollmentData { school_id: number; }
export interface DistrictEnrollmentData extends BaseEnrollmentData { district_id: number; }
export interface StateEnrollmentData extends BaseEnrollmentData {}

export interface BullyingTypeData {
    id: number;
    name: string;
}

export interface BullyingClassificationTypeData {
    id: number;
    name: string;
}

export interface BullyingImpactTypeData {
    id: number;
    name: string;
}

export interface DisciplineCountTypeData {
    id: number;
    name: string;
}

export interface DisciplineIncidentTypeData {
    id: number;
    name: string;
}

export type SafetyPage = 'truancy' | 'schoolSafetyIncidents' | 'harassment' | 'bullying' | 'restraint' | 'seclusion' | 'serious' | 'suspension';
export type SafetyCategory = 'truancy' | 'safetyIncidents' | 'harassment' | 'bullying' | 'restraint' | 'seclusion' | 'bullyingClassification' | 'bullyingImpact' | 'disciplineCount' | 'disciplineIncident' | 'enrollment';

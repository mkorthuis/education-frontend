import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

// Base URL for all outcome related requests
const BASE_ENDPOINT_URL = BASE_API_URL + 'outcome/';

// =======================
//  Query Param Interfaces
// =======================

// Post-Graduation outcome ------------------------
interface BasePostGraduationOptions {
    year?: string;
    post_graduation_type_id?: number;
}

interface SchoolPostGraduationOptions extends BasePostGraduationOptions {
    school_id?: number;
    district_id?: number;
}

interface DistrictPostGraduationOptions extends BasePostGraduationOptions {
    district_id?: number;
}

interface StatePostGraduationOptions extends BasePostGraduationOptions {}

// Early-Exit outcome -----------------------------
interface BaseEarlyExitOptions {
    year?: string;
}

interface SchoolEarlyExitOptions extends BaseEarlyExitOptions {
    school_id?: number;
    district_id?: number;
}

interface DistrictEarlyExitOptions extends BaseEarlyExitOptions {
    district_id?: number;
}

interface StateEarlyExitOptions extends BaseEarlyExitOptions {}

// Graduation Cohort interfaces -----------------------------
interface BaseGraduationCohortOptions {
    year?: string;
}

interface SchoolGraduationCohortOptions extends BaseGraduationCohortOptions {
    school_id?: number;
    district_id?: number;
}

interface DistrictGraduationCohortOptions extends BaseGraduationCohortOptions {
    district_id?: number;
}

interface StateGraduationCohortOptions extends BaseGraduationCohortOptions {}

// Helper to build URLs for outcome endpoints
const buildOutcomeUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const outcomesApi = {
    // ===== Post-Graduation Outcome Types =====
    getPostGraduationTypes: (forceRefresh = false) =>
        fetchData(buildOutcomeUrl('outcome/post-graduation-type'), forceRefresh),

    // ===== Post-Graduation Outcomes =====
    getSchoolPostGraduationOutcomes: (
        options: SchoolPostGraduationOptions = {},
        forceRefresh = false
    ) => fetchData(buildOutcomeUrl('outcome/post-graduation/school', options), forceRefresh),

    getDistrictPostGraduationOutcomes: (
        options: DistrictPostGraduationOptions = {},
        forceRefresh = false
    ) => fetchData(buildOutcomeUrl('outcome/post-graduation/district', options), forceRefresh),

    getStatePostGraduationOutcomes: (
        options: StatePostGraduationOptions = {},
        forceRefresh = false
    ) => fetchData(buildOutcomeUrl('outcome/post-graduation/state', options), forceRefresh),

    // ===== Early-Exit Outcomes =====
    getSchoolEarlyExitData: (
        options: SchoolEarlyExitOptions = {},
        forceRefresh = false
    ) => fetchData(buildOutcomeUrl('outcome/early-exit/school', options), forceRefresh),

    getDistrictEarlyExitData: (
        options: DistrictEarlyExitOptions = {},
        forceRefresh = false
    ) => fetchData(buildOutcomeUrl('outcome/early-exit/district', options), forceRefresh),

    getStateEarlyExitData: (
        options: StateEarlyExitOptions = {},
        forceRefresh = false
    ) => fetchData(buildOutcomeUrl('outcome/early-exit/state', options), forceRefresh),

    // ===== Graduation Cohort Outcomes =====
    getSchoolGraduationCohortData: (
        options: SchoolGraduationCohortOptions = {},
        forceRefresh = false
    ) => fetchData(buildOutcomeUrl('outcome/graduation-cohort/school', options), forceRefresh),

    getDistrictGraduationCohortData: (
        options: DistrictGraduationCohortOptions = {},
        forceRefresh = false
    ) => fetchData(buildOutcomeUrl('outcome/graduation-cohort/district', options), forceRefresh),

    getStateGraduationCohortData: (
        options: StateGraduationCohortOptions = {},
        forceRefresh = false
    ) => fetchData(buildOutcomeUrl('outcome/graduation-cohort/state', options), forceRefresh)
}; 
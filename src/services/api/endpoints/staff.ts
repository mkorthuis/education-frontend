import { BASE_API_URL } from '../config/constants';
import { buildUrl, fetchData } from '../utils/apiUtils';

// Base URL for all staff related requests
const BASE_ENDPOINT_URL = BASE_API_URL + 'staff/';

// =======================
//  Query Param Interfaces
// =======================

// Staff data interfaces -----------------------------
interface BaseStaffOptions {
    year?: number;
    staff_type_id?: number;
}

interface DistrictStaffOptions extends BaseStaffOptions {
    district_id?: number;
}

interface StateStaffOptions extends BaseStaffOptions {}

// Teacher Education interfaces -----------------------------
interface BaseTeacherEducationOptions {
    year?: number;
    teacher_type_id?: number;
}

interface DistrictTeacherEducationOptions extends BaseTeacherEducationOptions {
    district_id?: number;
}

interface StateTeacherEducationOptions extends BaseTeacherEducationOptions {}

// Teacher Salary Band interfaces -----------------------------
interface BaseTeacherSalaryBandOptions {
    year?: number;
    salary_band_type_id?: number;
}

interface DistrictTeacherSalaryBandOptions extends BaseTeacherSalaryBandOptions {
    district_id?: number;
}

interface StateTeacherSalaryBandOptions extends BaseTeacherSalaryBandOptions {}

// Helper to build URLs for staff endpoints
const buildStaffUrl = (endpoint: string, options: Record<string, any> = {}): string => {
    return buildUrl(BASE_ENDPOINT_URL, endpoint, options);
};

export const staffApi = {
    // ===== Staff Types =====
    getStaffTypes: (forceRefresh = false) =>
        fetchData(buildStaffUrl('staff-type'), forceRefresh),

    // ===== Teacher Education Types =====
    getTeacherEducationTypes: (forceRefresh = false) =>
        fetchData(buildStaffUrl('teacher-education-type'), forceRefresh),

    // ===== Teacher Salary Band Types =====
    getTeacherSalaryBandTypes: (forceRefresh = false) =>
        fetchData(buildStaffUrl('teacher-salary-band-type'), forceRefresh),

    // ===== Staff Data =====
    getDistrictStaffData: (
        options: DistrictStaffOptions = {},
        forceRefresh = false
    ) => fetchData(buildStaffUrl('district/staff', options), forceRefresh),

    getStateStaffData: (
        options: StateStaffOptions = {},
        forceRefresh = false
    ) => fetchData(buildStaffUrl('state/staff', options), forceRefresh),

    // ===== Teacher Education Data =====
    getDistrictTeacherEducationData: (
        options: DistrictTeacherEducationOptions = {},
        forceRefresh = false
    ) => fetchData(buildStaffUrl('district/teacher-education', options), forceRefresh),

    getStateTeacherEducationData: (
        options: StateTeacherEducationOptions = {},
        forceRefresh = false
    ) => fetchData(buildStaffUrl('state/teacher-education', options), forceRefresh),

    // ===== Teacher Average Salary Data =====
    getDistrictTeacherAverageSalary: (
        options: { year?: number; district_id?: number } = {},
        forceRefresh = false
    ) => fetchData(buildStaffUrl('district/teacher-average-salary', options), forceRefresh),

    getStateTeacherAverageSalary: (
        options: { year?: number } = {},
        forceRefresh = false
    ) => fetchData(buildStaffUrl('state/teacher-average-salary', options), forceRefresh),

    // ===== Teacher Salary Band Data =====
    getDistrictTeacherSalaryBandData: (
        options: DistrictTeacherSalaryBandOptions = {},
        forceRefresh = false
    ) => fetchData(buildStaffUrl('district/teacher-salary-band', options), forceRefresh),

    getStateTeacherSalaryBandData: (
        options: StateTeacherSalaryBandOptions = {},
        forceRefresh = false
    ) => fetchData(buildStaffUrl('state/teacher-salary-band', options), forceRefresh)
}; 
import * as outcomeSlice from '@/store/slices/outcomeSlice';

// Outcome selectors and thunks per entity kind. The keys match the
// postGraduation / earlyExit / graduationCohort categories in outcomeSlice.
export const OUTCOME = {
  school: {
    params: (id: number | undefined) => ({ school_id: id }),
    select: {
      postGraduation: outcomeSlice.selectSchoolPostGraduationData,
      earlyExit: outcomeSlice.selectSchoolEarlyExitData,
      graduationCohort: outcomeSlice.selectSchoolGraduationCohortData
    },
    loading: {
      postGraduation: outcomeSlice.selectSchoolPostGraduationLoadingStatus,
      earlyExit: outcomeSlice.selectSchoolEarlyExitLoadingStatus,
      graduationCohort: outcomeSlice.selectSchoolGraduationCohortLoadingStatus
    },
    fetch: {
      postGraduation: outcomeSlice.fetchSchoolPostGraduationOutcomes,
      earlyExit: outcomeSlice.fetchSchoolEarlyExitData,
      graduationCohort: outcomeSlice.fetchSchoolGraduationCohortData
    }
  },
  district: {
    params: (id: number | undefined) => ({ district_id: id }),
    select: {
      postGraduation: outcomeSlice.selectDistrictPostGraduationData,
      earlyExit: outcomeSlice.selectDistrictEarlyExitData,
      graduationCohort: outcomeSlice.selectDistrictGraduationCohortData
    },
    loading: {
      postGraduation: outcomeSlice.selectDistrictPostGraduationLoadingStatus,
      earlyExit: outcomeSlice.selectDistrictEarlyExitLoadingStatus,
      graduationCohort: outcomeSlice.selectDistrictGraduationCohortLoadingStatus
    },
    fetch: {
      postGraduation: outcomeSlice.fetchDistrictPostGraduationOutcomes,
      earlyExit: outcomeSlice.fetchDistrictEarlyExitData,
      graduationCohort: outcomeSlice.fetchDistrictGraduationCohortData
    }
  }
} as const;

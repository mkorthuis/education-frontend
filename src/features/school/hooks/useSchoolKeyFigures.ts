import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PageLoadStatus } from '@/store/utils/loadingState';
import * as enrollmentSlice from '@/store/slices/enrollmentSlice';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import * as assessmentSlice from '@/store/slices/assessmentSlice';
import { StateLoad, useStateLoads } from '@/features/state/hooks/useStateLoads';
import { ALL_STUDENTS_SUBGROUP_ID, StoredAssessmentRow } from '@/features/state/utils/stateMetrics';
import { SchoolKeyFigures, schoolKeyFigures } from '../utils/keyFigures';

export type { SchoolKeyFigures } from '../utils/keyFigures';

// The figures on a school's overview, each with its district's and the state's for comparison
// (calculated in utils/keyFigures, which the pages written at build time share). Only
// what the tiles need is requested: test scores for all students, nothing on graduation for a school
// without a grade 12, the district's test scores only when it has other schools, and its graduation
// only when it has another high school (otherwise they'd be this school's own figures again).

const ALL_STUDENTS = { assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID };
const STATE_PARAMS = {};

export const useSchoolKeyFigures = (
  schoolId: number,
  districtId: number | null,
  { hasGraduation, compareDistrict, compareDistrictGraduation }: { hasGraduation: boolean; compareDistrict: boolean; compareDistrictGraduation: boolean }
): { status: PageLoadStatus; retry: () => void; figures: SchoolKeyFigures } => {
  const dispatch = useAppDispatch();
  const enrollmentParams = { schoolId };
  const school = { school_id: schoolId };
  // The assessment slice keys school results by the school's id as text
  const schoolTests = { school_id: String(schoolId), ...ALL_STUDENTS };
  const district = { district_id: districtId ?? undefined };
  const districtTests = { ...district, ...ALL_STUDENTS };
  const withDistrict = compareDistrict && districtId !== null;

  const enrollment = useAppSelector(state => enrollmentSlice.selectSchoolEnrollment(state, enrollmentParams));
  const tests = useAppSelector(state => assessmentSlice.selectAssessmentSchoolData(state, schoolTests));
  const cohorts = useAppSelector(state => outcomeSlice.selectSchoolGraduationCohortData(state, school));
  const plans = useAppSelector(state => outcomeSlice.selectSchoolPostGraduationData(state, school));
  const districtTestRows = useAppSelector(state => assessmentSlice.selectAssessmentDistrictData(state, districtTests));
  const districtCohorts = useAppSelector(state => outcomeSlice.selectDistrictGraduationCohortData(state, district));
  const districtPlans = useAppSelector(state => outcomeSlice.selectDistrictPostGraduationData(state, district));
  const stateTests = useAppSelector(state => assessmentSlice.selectAssessmentStateData(state, ALL_STUDENTS));
  const stateCohorts = useAppSelector(state => outcomeSlice.selectStateGraduationCohortData(state, STATE_PARAMS));
  const statePlans = useAppSelector(state => outcomeSlice.selectStatePostGraduationData(state, STATE_PARAMS));

  const statuses = {
    enrollment: useAppSelector(state => enrollmentSlice.selectSchoolEnrollmentLoadingStatus(state, enrollmentParams)),
    tests: useAppSelector(state => assessmentSlice.selectAssessmentSchoolLoadingStatus(state, schoolTests)),
    cohorts: useAppSelector(state => outcomeSlice.selectSchoolGraduationCohortLoadingStatus(state, school)),
    plans: useAppSelector(state => outcomeSlice.selectSchoolPostGraduationLoadingStatus(state, school)),
    districtTests: useAppSelector(state => assessmentSlice.selectAssessmentDistrictLoadingStatus(state, districtTests)),
    districtCohorts: useAppSelector(state => outcomeSlice.selectDistrictGraduationCohortLoadingStatus(state, district)),
    districtPlans: useAppSelector(state => outcomeSlice.selectDistrictPostGraduationLoadingStatus(state, district)),
    stateTests: useAppSelector(state => assessmentSlice.selectAssessmentStateLoadingStatus(state, ALL_STUDENTS)),
    stateCohorts: useAppSelector(state => outcomeSlice.selectStateGraduationCohortLoadingStatus(state, STATE_PARAMS)),
    statePlans: useAppSelector(state => outcomeSlice.selectStatePostGraduationLoadingStatus(state, STATE_PARAMS)),
  };

  const loads: StateLoad[] = [
    { status: statuses.enrollment, load: () => dispatch(enrollmentSlice.fetchSchoolEnrollments(enrollmentParams)) },
    { status: statuses.tests, load: () => dispatch(assessmentSlice.fetchAssessmentSchoolData(schoolTests)) },
    { status: statuses.stateTests, load: () => dispatch(assessmentSlice.fetchAssessmentStateData(ALL_STUDENTS)) },
    ...(withDistrict ? [{ status: statuses.districtTests, load: () => dispatch(assessmentSlice.fetchAssessmentDistrictData(districtTests)) }] : []),
    ...(hasGraduation ? [
      { status: statuses.cohorts, load: () => dispatch(outcomeSlice.fetchSchoolGraduationCohortData(school)) },
      { status: statuses.plans, load: () => dispatch(outcomeSlice.fetchSchoolPostGraduationOutcomes(school)) },
      { status: statuses.stateCohorts, load: () => dispatch(outcomeSlice.fetchStateGraduationCohortData(STATE_PARAMS)) },
      { status: statuses.statePlans, load: () => dispatch(outcomeSlice.fetchStatePostGraduationOutcomes(STATE_PARAMS)) },
    ] : []),
    ...(hasGraduation && compareDistrictGraduation && districtId !== null ? [
      { status: statuses.districtCohorts, load: () => dispatch(outcomeSlice.fetchDistrictGraduationCohortData(district)) },
      { status: statuses.districtPlans, load: () => dispatch(outcomeSlice.fetchDistrictPostGraduationOutcomes(district)) },
    ] : []),
  ];
  const { status, retry } = useStateLoads(loads);

  const figures = useMemo((): SchoolKeyFigures => schoolKeyFigures({
    enrollment,
    tests: tests as unknown as StoredAssessmentRow[],
    cohorts,
    plans,
    district: { tests: districtTestRows as unknown as StoredAssessmentRow[], cohorts: districtCohorts, plans: districtPlans },
    state: { tests: stateTests as unknown as StoredAssessmentRow[], cohorts: stateCohorts, plans: statePlans },
  }), [enrollment, tests, cohorts, plans, districtTestRows, districtCohorts, districtPlans, stateTests, stateCohorts, statePlans]);

  return { status, retry, figures };
};

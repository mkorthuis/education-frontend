import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PageLoadStatus } from '@/store/utils/loadingState';
import * as enrollmentSlice from '@/store/slices/enrollmentSlice';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import * as assessmentSlice from '@/store/slices/assessmentSlice';
import { StateLoad, useStateLoads } from '@/features/state/hooks/useStateLoads';
import {
  ALL_STUDENTS_SUBGROUP_ID,
  graduationRates,
  normalizeAssessmentRows,
  postGraduationShares,
  proficiencyBySubject,
  StoredAssessmentRow,
  SubjectFigures,
  subjectFigures,
  toSeries,
  totalsByYear,
  YearValue,
} from '@/features/state/utils/stateMetrics';

// The figures on a school's overview, each with its district's and the state's for comparison. Only
// what the tiles need is requested: test scores for all students, nothing on graduation for a school
// without a grade 12, the district's test scores only when it has other schools, and its graduation
// only when it has another high school (otherwise they'd be this school's own figures again).

const ALL_STUDENTS = { assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID };
const STATE_PARAMS = {};

interface Results {
  math: YearValue[];
  reading: YearValue[];
  science: YearValue[];
  graduation: YearValue[];
  college: YearValue[];
}

export interface SchoolKeyFigures {
  /** Students enrolled in the school, all grades (October 1) */
  students: YearValue[];
  math: SubjectFigures;
  reading: SubjectFigures;
  science: SubjectFigures;
  graduation: YearValue[];
  college: YearValue[];
  /** Graduates whose plans the school didn't report, as a share of all its graduates */
  plansUnknown: YearValue[];
  district: Results;
  state: Results;
}

const results = (tests: unknown[], cohorts: Parameters<typeof graduationRates>[0], plans: Parameters<typeof postGraduationShares>[0]): Results => {
  const shares = proficiencyBySubject(normalizeAssessmentRows(tests as StoredAssessmentRow[]));
  return {
    math: toSeries(shares, row => row.math),
    reading: toSeries(shares, row => row.reading),
    science: toSeries(shares, row => row.science),
    graduation: toSeries(graduationRates(cohorts), row => row.graduated),
    college: toSeries(postGraduationShares(plans), row => row.college),
  };
};

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

  const figures = useMemo((): SchoolKeyFigures => {
    const schoolTestRows = normalizeAssessmentRows(tests as unknown as StoredAssessmentRow[]);
    const planShares = postGraduationShares(plans);
    return {
      students: totalsByYear(enrollment, row => row.enrollment),
      math: subjectFigures(schoolTestRows, 'math'),
      reading: subjectFigures(schoolTestRows, 'reading'),
      science: subjectFigures(schoolTestRows, 'science'),
      graduation: toSeries(graduationRates(cohorts), row => row.graduated),
      college: toSeries(planShares, row => row.college),
      plansUnknown: toSeries(planShares, row => row.Unknown ?? 0),
      district: results(districtTestRows, districtCohorts, districtPlans),
      state: results(stateTests, stateCohorts, statePlans),
    };
  }, [enrollment, tests, cohorts, plans, districtTestRows, districtCohorts, districtPlans, stateTests, stateCohorts, statePlans]);

  return { status, retry, figures };
};

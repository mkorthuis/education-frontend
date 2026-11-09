import { useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store/store';
import { LoadingState, PageLoadStatus } from '@/store/utils/loadingState';
import * as financeSlice from '@/store/slices/financeSlice';
import * as staffSlice from '@/store/slices/staffSlice';
import * as enrollmentSlice from '@/store/slices/enrollmentSlice';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import * as assessmentSlice from '@/store/slices/assessmentSlice';
import * as efaSlice from '@/store/slices/efaSlice';
import { StateLoad, useStateLoads } from '@/features/state/hooks/useStateLoads';
import {
  ALL_STUDENTS_SUBGROUP_ID,
  efaTotals,
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

// The figures on a district's overview, each with the state's for comparison. Only what the tiles
// need is requested: test scores for all students (a district's full results run to megabytes), and
// nothing on schools, tests or graduation for a district that has none.

const ALL_STUDENTS = { assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID };
const STATE_PARAMS = {};

export interface DistrictKeyFigures {
  /** Public school students living in the district's towns (October 1) */
  students: YearValue[];
  perPupil: YearValue[];
  salary: YearValue[];
  efaStudents: YearValue[];
  math: SubjectFigures;
  reading: SubjectFigures;
  graduation: YearValue[];
  college: YearValue[];
  /** Graduates whose plans the district didn't report, as a share of all its graduates */
  plansUnknown: YearValue[];
  state: {
    perPupil: YearValue[];
    salary: YearValue[];
    math: YearValue[];
    reading: YearValue[];
    graduation: YearValue[];
    college: YearValue[];
  };
}

export const useDistrictKeyFigures = (
  districtId: number,
  { hasSchools, hasGraduation }: { hasSchools: boolean; hasGraduation: boolean }
): { status: PageLoadStatus; retry: () => void; figures: DistrictKeyFigures } => {
  const dispatch = useAppDispatch();
  const district = { district_id: districtId };
  const districtAllStudents = { ...district, ...ALL_STUDENTS };

  // Cost per pupil keeps one district at a time, so only this district's rows count, and it's
  // requested again after another district's were loaded
  const perPupilFor = useRef<number | null>(null);
  const perPupilAll = useAppSelector(financeSlice.selectPerPupilExpenditureAllData);
  const perPupilRows = useMemo(() => perPupilAll.filter(row => row.district_id === districtId), [perPupilAll, districtId]);
  const perPupilStatus = useAppSelector((state: RootState) => state.finance.loadingStates.perPupilExpenditure);
  const statePerPupil = useAppSelector(financeSlice.selectStatePerPupilExpenditureAllData);

  const townEnrollment = useAppSelector(state => enrollmentSlice.selectTownEnrollment(state, district));
  const efaEntries = useAppSelector(state => efaSlice.selectEfaEntries(state, district));
  const efaEntryTypes = useAppSelector(efaSlice.selectEfaEntryTypes);
  const salary = useAppSelector(state => staffSlice.selectDistrictTeacherAverageSalaryData(state, district));
  const stateSalary = useAppSelector(state => staffSlice.selectStateTeacherAverageSalaryData(state, STATE_PARAMS));
  const assessments = useAppSelector(state => assessmentSlice.selectAssessmentDistrictData(state, districtAllStudents));
  const stateAssessments = useAppSelector(state => assessmentSlice.selectAssessmentStateData(state, ALL_STUDENTS));
  const cohorts = useAppSelector(state => outcomeSlice.selectDistrictGraduationCohortData(state, district));
  const stateCohorts = useAppSelector(state => outcomeSlice.selectStateGraduationCohortData(state, STATE_PARAMS));
  const plans = useAppSelector(state => outcomeSlice.selectDistrictPostGraduationData(state, district));
  const statePlans = useAppSelector(state => outcomeSlice.selectStatePostGraduationData(state, STATE_PARAMS));

  const statuses = {
    statePerPupil: useAppSelector((state: RootState) => state.finance.loadingStates.statePerPupilExpenditure),
    townEnrollment: useAppSelector(state => enrollmentSlice.selectTownEnrollmentLoadingStatus(state, district)),
    efaEntries: useAppSelector(state => efaSlice.selectEfaEntriesLoadingStatus(state, district)),
    efaEntryTypes: useAppSelector(efaSlice.selectEfaEntryTypesLoadingStatus),
    salary: useAppSelector(state => staffSlice.selectDistrictTeacherAverageSalaryLoadingStatus(state, district)),
    stateSalary: useAppSelector(state => staffSlice.selectStateTeacherAverageSalaryLoadingStatus(state, STATE_PARAMS)),
    assessments: useAppSelector(state => assessmentSlice.selectAssessmentDistrictLoadingStatus(state, districtAllStudents)),
    stateAssessments: useAppSelector(state => assessmentSlice.selectAssessmentStateLoadingStatus(state, ALL_STUDENTS)),
    cohorts: useAppSelector(state => outcomeSlice.selectDistrictGraduationCohortLoadingStatus(state, district)),
    stateCohorts: useAppSelector(state => outcomeSlice.selectStateGraduationCohortLoadingStatus(state, STATE_PARAMS)),
    plans: useAppSelector(state => outcomeSlice.selectDistrictPostGraduationLoadingStatus(state, district)),
    statePlans: useAppSelector(state => outcomeSlice.selectStatePostGraduationLoadingStatus(state, STATE_PARAMS)),
  };

  const loads: StateLoad[] = [
    {
      status: perPupilRows.length > 0 ? LoadingState.SUCCEEDED : perPupilFor.current === districtId ? perPupilStatus : LoadingState.IDLE,
      load: () => {
        perPupilFor.current = districtId;
        dispatch(financeSlice.fetchPerPupilExpenditure({ districtId }));
      },
    },
    { status: statuses.statePerPupil, load: () => dispatch(financeSlice.fetchStatePerPupilExpenditure({})) },
    { status: statuses.townEnrollment, load: () => dispatch(enrollmentSlice.fetchTownEnrollment(district)) },
    { status: statuses.efaEntries, load: () => dispatch(efaSlice.fetchEfaEntries(district)) },
    { status: statuses.efaEntryTypes, load: () => dispatch(efaSlice.fetchEfaEntryTypes({})) },
    ...(hasSchools ? [
      { status: statuses.salary, load: () => dispatch(staffSlice.fetchDistrictTeacherAverageSalary(district)) },
      { status: statuses.stateSalary, load: () => dispatch(staffSlice.fetchStateTeacherAverageSalary(STATE_PARAMS)) },
      { status: statuses.assessments, load: () => dispatch(assessmentSlice.fetchAssessmentDistrictData(districtAllStudents)) },
      { status: statuses.stateAssessments, load: () => dispatch(assessmentSlice.fetchAssessmentStateData(ALL_STUDENTS)) },
    ] : []),
    ...(hasGraduation ? [
      { status: statuses.cohorts, load: () => dispatch(outcomeSlice.fetchDistrictGraduationCohortData(district)) },
      { status: statuses.stateCohorts, load: () => dispatch(outcomeSlice.fetchStateGraduationCohortData(STATE_PARAMS)) },
      { status: statuses.plans, load: () => dispatch(outcomeSlice.fetchDistrictPostGraduationOutcomes(district)) },
      { status: statuses.statePlans, load: () => dispatch(outcomeSlice.fetchStatePostGraduationOutcomes(STATE_PARAMS)) },
    ] : []),
  ];
  const { status, retry } = useStateLoads(loads);

  const figures = useMemo((): DistrictKeyFigures => {
    const districtTests = normalizeAssessmentRows(assessments as unknown as StoredAssessmentRow[]);
    const stateTests = proficiencyBySubject(normalizeAssessmentRows(stateAssessments as unknown as StoredAssessmentRow[]));
    const planShares = postGraduationShares(plans);
    return {
      students: totalsByYear(townEnrollment, row => row.enrollment),
      perPupil: toSeries(perPupilRows, row => row.total),
      salary: toSeries(salary, row => row.salary),
      efaStudents: toSeries(efaTotals(efaEntries, efaEntryTypes), row => row.students),
      math: subjectFigures(districtTests, 'math'),
      reading: subjectFigures(districtTests, 'reading'),
      graduation: toSeries(graduationRates(cohorts), row => row.graduated),
      college: toSeries(planShares, row => row.college),
      plansUnknown: toSeries(planShares, row => row.Unknown ?? 0),
      state: {
        perPupil: toSeries(statePerPupil, row => row.total),
        salary: toSeries(stateSalary, row => row.salary),
        math: toSeries(stateTests, row => row.math),
        reading: toSeries(stateTests, row => row.reading),
        graduation: toSeries(graduationRates(stateCohorts), row => row.graduated),
        college: toSeries(postGraduationShares(statePlans), row => row.college),
      },
    };
  }, [townEnrollment, perPupilRows, salary, efaEntries, efaEntryTypes, assessments, cohorts, plans, statePerPupil, stateSalary, stateAssessments, stateCohorts, statePlans]);

  return { status, retry, figures };
};

import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store/store';
import * as financeSlice from '@/store/slices/financeSlice';
import * as staffSlice from '@/store/slices/staffSlice';
import * as classSizeSlice from '@/store/slices/classSizeSlice';
import * as enrollmentSlice from '@/store/slices/enrollmentSlice';
import * as outcomeSlice from '@/store/slices/outcomeSlice';
import * as assessmentSlice from '@/store/slices/assessmentSlice';
import * as safetySlice from '@/store/slices/safetySlice';
import * as efaSlice from '@/store/slices/efaSlice';
import { StateLoad } from './useStateLoads';
import { normalizeAssessmentRows, StoredAssessmentRow } from '../utils/stateMetrics';

// One hook per subject area: the statewide rows from the store plus the loads that fill them.
// The overview combines several; each State page uses its own. Every request is the same
// unfiltered statewide request the district pages make, so the two share cached data.

// Stable parameter objects, so the memoized selectors keep their results between renders
const STATE_PARAMS = {};

const financeStatus = (key: keyof financeSlice.FinanceState['loadingStates']) =>
  (state: RootState) => state.finance.loadingStates[key];

export const useStateEnrollmentData = () => {
  const dispatch = useAppDispatch();
  const adm = useAppSelector(state => state.finance.stateADMData);
  const byGrade = useAppSelector(state => enrollmentSlice.selectStateTownEnrollment(state, STATE_PARAMS));
  const loads: StateLoad[] = [
    { status: useAppSelector(financeStatus('stateADM')), load: () => dispatch(financeSlice.fetchStateADM({})) },
    {
      status: useAppSelector(state => enrollmentSlice.selectStateTownEnrollmentLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(enrollmentSlice.fetchStateTownEnrollment(STATE_PARAMS)),
    },
  ];
  return { loads, adm, byGrade };
};

// October 1 enrollment by type of school and grade: the current public school student count
export const useStateEnrollmentByTypeData = () => {
  const dispatch = useAppDispatch();
  const byType = useAppSelector(state => enrollmentSlice.selectStateEnrollmentByType(state, STATE_PARAMS));
  const loads: StateLoad[] = [{
    status: useAppSelector(state => enrollmentSlice.selectStateEnrollmentByTypeLoadingStatus(state, STATE_PARAMS)),
    load: () => dispatch(enrollmentSlice.fetchStateEnrollmentByType(STATE_PARAMS)),
  }];
  return { loads, byType };
};

export const useStateFinanceData = () => {
  const dispatch = useAppDispatch();
  const perPupil = useAppSelector(financeSlice.selectStatePerPupilExpenditureAllData);
  const rollups = useAppSelector(state => state.finance.stateExpenditureRollupData);
  const revenue = useAppSelector(financeSlice.selectStateRevenueAllData);
  const revenueEntryTypes = useAppSelector(financeSlice.selectRevenueEntryTypes);
  const loads: StateLoad[] = [
    { status: useAppSelector(financeStatus('statePerPupilExpenditure')), load: () => dispatch(financeSlice.fetchStatePerPupilExpenditure({})) },
    { status: useAppSelector(financeStatus('stateExpenditureRollups')), load: () => dispatch(financeSlice.fetchStateExpenditureRollups({})) },
  ];
  // Revenue needs the entry types to group lines by source
  const revenueLoads: StateLoad[] = [
    { status: useAppSelector(financeStatus('stateRevenue')), load: () => dispatch(financeSlice.fetchStateRevenue({})) },
    { status: useAppSelector(financeStatus('entryTypes')), load: () => dispatch(financeSlice.fetchEntryTypes()) },
  ];
  // Spending by DOE-25 line, every year (the same request as the district Financials page); its
  // entry types come with revenue's
  const expenditure = useAppSelector(state => state.finance.stateExpenditureAllData);
  const expenditureEntryTypes = useAppSelector(financeSlice.selectExpenditureEntryTypes);
  const expenditureLoads: StateLoad[] = [
    { status: useAppSelector(financeStatus('stateExpenditure')), load: () => dispatch(financeSlice.fetchStateExpenditure({})) },
  ];
  return { loads, revenueLoads, expenditureLoads, perPupil, rollups, revenue, revenueEntryTypes, expenditure, expenditureEntryTypes };
};

export const useStateStaffData = () => {
  const dispatch = useAppDispatch();
  const staff = useAppSelector(state => staffSlice.selectStateStaffData(state, STATE_PARAMS));
  const salary = useAppSelector(state => staffSlice.selectStateTeacherAverageSalaryData(state, STATE_PARAMS));
  const education = useAppSelector(state => staffSlice.selectStateTeacherEducationData(state, STATE_PARAMS));
  const classSize = useAppSelector(state => classSizeSlice.selectStateClassSizeData(state, STATE_PARAMS));
  const loads: StateLoad[] = [
    {
      status: useAppSelector(state => staffSlice.selectStateStaffLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(staffSlice.fetchStateStaffData(STATE_PARAMS)),
    },
    {
      status: useAppSelector(state => staffSlice.selectStateTeacherAverageSalaryLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(staffSlice.fetchStateTeacherAverageSalary(STATE_PARAMS)),
    },
  ];
  const detailLoads: StateLoad[] = [
    {
      status: useAppSelector(state => staffSlice.selectStateTeacherEducationLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(staffSlice.fetchStateTeacherEducationData(STATE_PARAMS)),
    },
    {
      status: useAppSelector(state => classSizeSlice.selectStateClassSizeLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(classSizeSlice.fetchStateClassSizeData(STATE_PARAMS)),
    },
  ];
  return { loads, detailLoads, staff, salary, education, classSize };
};

export const useStateOutcomeData = () => {
  const dispatch = useAppDispatch();
  const cohorts = useAppSelector(state => outcomeSlice.selectStateGraduationCohortData(state, STATE_PARAMS));
  const postGraduation = useAppSelector(state => outcomeSlice.selectStatePostGraduationData(state, STATE_PARAMS));
  const earlyExit = useAppSelector(state => outcomeSlice.selectStateEarlyExitData(state, STATE_PARAMS));
  const loads: StateLoad[] = [
    {
      status: useAppSelector(state => outcomeSlice.selectStateGraduationCohortLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(outcomeSlice.fetchStateGraduationCohortData(STATE_PARAMS)),
    },
    {
      status: useAppSelector(state => outcomeSlice.selectStatePostGraduationLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(outcomeSlice.fetchStatePostGraduationOutcomes(STATE_PARAMS)),
    },
  ];
  const detailLoads: StateLoad[] = [
    {
      status: useAppSelector(state => outcomeSlice.selectStateEarlyExitLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(outcomeSlice.fetchStateEarlyExitData(STATE_PARAMS)),
    },
  ];
  return { loads, detailLoads, cohorts, postGraduation, earlyExit };
};

export const useStateAssessmentData = () => {
  const dispatch = useAppDispatch();
  const stored = useAppSelector(state => assessmentSlice.selectAssessmentStateData(state, STATE_PARAMS));
  const assessments = useMemo(() => normalizeAssessmentRows(stored as unknown as StoredAssessmentRow[]), [stored]);
  const subgroups = useAppSelector(assessmentSlice.selectAssessmentSubgroups);
  const loads: StateLoad[] = [
    {
      status: useAppSelector(state => assessmentSlice.selectAssessmentStateLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(assessmentSlice.fetchAssessmentStateData(STATE_PARAMS)),
    },
  ];
  return { loads, assessments, subgroups };
};

export const useStateSafetyData = () => {
  const dispatch = useAppDispatch();
  const truancy = useAppSelector(state => safetySlice.selectStateTruancyData(state, STATE_PARAMS));
  const bullying = useAppSelector(state => safetySlice.selectStateBullyingData(state, STATE_PARAMS));
  const incidents = useAppSelector(state => safetySlice.selectStateSafetyData(state, STATE_PARAMS));
  const restraints = useAppSelector(state => safetySlice.selectStateRestraintData(state, STATE_PARAMS));
  const seclusions = useAppSelector(state => safetySlice.selectStateSeclusionData(state, STATE_PARAMS));
  // Fall enrollment the safety reports use for rates per 100 students
  const enrollment = useAppSelector(state => safetySlice.selectStateEnrollmentData(state, STATE_PARAMS));
  const loads: StateLoad[] = [
    {
      status: useAppSelector(state => safetySlice.selectStateTruancyLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(safetySlice.fetchStateTruancyData(STATE_PARAMS)),
    },
    {
      status: useAppSelector(state => safetySlice.selectStateBullyingIncidentsLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(safetySlice.fetchStateBullyingIncidents(STATE_PARAMS)),
    },
    {
      status: useAppSelector(state => safetySlice.selectStateSafetyIncidentsLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(safetySlice.fetchStateSafetyIncidents(STATE_PARAMS)),
    },
    {
      status: useAppSelector(state => safetySlice.selectStateRestraintLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(safetySlice.fetchStateRestraints(STATE_PARAMS)),
    },
    {
      status: useAppSelector(state => safetySlice.selectStateSeclusionLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(safetySlice.fetchStateSeclusions(STATE_PARAMS)),
    },
    {
      status: useAppSelector(state => safetySlice.selectStateEnrollmentLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(safetySlice.fetchStateEnrollmentData(STATE_PARAMS)),
    },
  ];
  // Truancy and the enrollment it's divided by, for pages that only need the truancy rate
  const truancyLoads = [loads[0], loads[loads.length - 1]];
  return { loads, truancyLoads, truancy, bullying, incidents, restraints, seclusions, enrollment };
};

export const useStateEfaData = () => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(state => efaSlice.selectEfaStateEntries(state, STATE_PARAMS));
  const entryTypes = useAppSelector(efaSlice.selectEfaEntryTypes);
  const loads: StateLoad[] = [
    { status: useAppSelector(efaSlice.selectEfaEntryTypesLoadingStatus), load: () => dispatch(efaSlice.fetchEfaEntryTypes({})) },
    {
      status: useAppSelector(state => efaSlice.selectEfaStateEntriesLoadingStatus(state, STATE_PARAMS)),
      load: () => dispatch(efaSlice.fetchEfaStateEntries(STATE_PARAMS)),
    },
  ];
  return { loads, entries, entryTypes };
};

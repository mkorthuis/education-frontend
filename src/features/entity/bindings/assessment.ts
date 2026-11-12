import * as assessmentSlice from '@/store/slices/assessmentSlice';
import { FISCAL_YEAR, ASSESSMENT_YEAR } from '@/utils/environment';
import { getSchoolRankInfo, getDistrictRankInfo } from '@/features/district/utils/assessmentDataProcessing';
import type { AppDispatch } from '@/store/store';
import { EntityKind } from '@/features/entity/entity';

// Assessment selectors, actions and thunks per entity kind.
export const ASSESSMENT = {
  school: {
    // `school?.id.toString() || ''`: the school assessment API takes a string id.
    initialParams: (id: number | undefined) => ({ school_id: id?.toString() || '' }),
    selectData: assessmentSlice.selectAssessmentSchoolData,
    selectCurrentData: assessmentSlice.selectCurrentAssessmentSchoolData,
    selectLoading: assessmentSlice.selectAssessmentSchoolLoadingStatus,
    setCurrentKey: assessmentSlice.setCurrentSchoolDataKey,
    fetch: assessmentSlice.fetchAssessmentSchoolData,
    resetCategory: 'school',
    idField: 'school_id',
    nameField: 'school_name',
    rankInfo: getSchoolRankInfo,
    // Charter schools take the same tests, and rank with the districts' schools
    rankNoun: 'public schools, including charter schools',
    // Year that filters the subject card list; differs from the district page.
    cardListYear: FISCAL_YEAR
  },
  district: {
    initialParams: (id: number | undefined) => ({ district_id: id }),
    selectData: assessmentSlice.selectAssessmentDistrictData,
    selectCurrentData: assessmentSlice.selectCurrentAssessmentDistrictData,
    selectLoading: assessmentSlice.selectAssessmentDistrictLoadingStatus,
    setCurrentKey: assessmentSlice.setCurrentDistrictDataKey,
    fetch: assessmentSlice.fetchAssessmentDistrictData,
    resetCategory: 'district',
    idField: 'district_id',
    nameField: 'district_name',
    rankInfo: getDistrictRankInfo,
    // School districts only: the API leaves out charter schools' boards
    rankNoun: 'districts',
    cardListYear: ASSESSMENT_YEAR
  }
} as const;

// A row of either kind's assessment data.
export type EntityAssessmentData = assessmentSlice.AssessmentSchoolData | assessmentSlice.AssessmentDistrictData;

// Params accepted by either kind's selectors and thunk; each kind's
// initialParams sets only its own id field.
export type EntityAssessmentParams =
  assessmentSlice.FetchAssessmentSchoolDataParams & assessmentSlice.FetchAssessmentDistrictDataParams;

// TS cannot dispatch the union of the two thunks, so each kind gets its own branch.
export const dispatchEntityAssessmentFetch = (dispatch: AppDispatch, kind: EntityKind, params: EntityAssessmentParams) =>
  kind === 'school'
    ? dispatch(ASSESSMENT.school.fetch(params))
    : dispatch(ASSESSMENT.district.fetch(params));

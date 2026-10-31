import * as assessmentSlice from '@/store/slices/assessmentSlice';
import { FISCAL_YEAR, ASSESSMENT_YEAR } from '@/utils/environment';

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
    cardListYear: ASSESSMENT_YEAR
  }
} as const;

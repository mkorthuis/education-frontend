import { useAppSelector } from '@/store/hooks';
import { isCharterSchool, selectCurrentDistrict, selectCurrentSchool, selectCurrentSchools } from '@/store/slices/locationSlice';
import { isPageAvailable, PAGE_REGISTRY } from '@/routes/pageRegistry';
import { AskPlace } from '@/services/api/endpoints/ask';
import { districtExamples, schoolExamples } from './placeExamples';

/** A district's or school's example questions once its page's data has loaded, as its tabs decide what it has; none before */
export const usePlaceExamples = (place: AskPlace | null): string[] => {
  const district = useAppSelector(selectCurrentDistrict);
  const school = useAppSelector(selectCurrentSchool);
  const schools = useAppSelector(selectCurrentSchools);
  if (place?.kind === 'district' && district?.id === place.id) {
    return districtExamples({
      name: district.name,
      schoolCount: schools.length,
      hasGraduation: isPageAvailable(PAGE_REGISTRY.district.outcomes, { ...district, schools }),
    });
  }
  if (place?.kind === 'school' && school?.id === place.id) {
    return schoolExamples({
      name: school.name,
      district: !isCharterSchool(school) && district ? district.name : null,
      hasTestScores: isPageAvailable(PAGE_REGISTRY.school.academic, school),
      hasEnrollment: isPageAvailable(PAGE_REGISTRY.school.enrollment, school),
      hasGraduation: isPageAvailable(PAGE_REGISTRY.school.outcomes, school),
      hasSafety: isPageAvailable(PAGE_REGISTRY.school.safety, school),
    });
  }
  return [];
};

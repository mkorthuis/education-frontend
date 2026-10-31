import React from 'react';
import SafetyLayout from '@/features/entity/components/SafetyLayout';
import { useSafetyCategory } from '@/features/entity/components/useSafetyCategory';
import { useSchoolSafetyPage } from './safety/useSchoolSafetyPage';
import SeriousSafetyCategoryDetails from './safety/category/SeriousSafetyCategoryDetails';

const Safety: React.FC = () => {
  const category = useSafetyCategory();
  const page = useSchoolSafetyPage();

  return (
    <SafetyLayout
      kind="school"
      {...category}
      {...page}
      SeriousCategoryDetails={SeriousSafetyCategoryDetails}
    />
  );
};

export default Safety;

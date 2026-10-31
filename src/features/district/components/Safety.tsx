import React from 'react';
import SafetyLayout from '@/features/entity/components/SafetyLayout';
import { useSafetyCategory } from '@/features/entity/components/useSafetyCategory';
import { useDistrictSafetyPage } from './safety/useDistrictSafetyPage';
import SeriousSafetyCategoryDetails from './safety/category/SeriousSafetyCategoryDetails';

const Safety: React.FC = () => {
  const category = useSafetyCategory();
  const page = useDistrictSafetyPage();

  return (
    <SafetyLayout
      kind="district"
      {...category}
      {...page}
      SeriousCategoryDetails={SeriousSafetyCategoryDetails}
    />
  );
};

export default Safety;

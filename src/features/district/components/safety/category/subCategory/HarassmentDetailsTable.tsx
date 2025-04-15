import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectDistrictHarassmentData,
  selectHarassmentClassification
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import SharedHarassmentDetailsTable from '@/components/ui/safety/HarassmentDetailsTable';

const HarassmentDetailsTable: React.FC = () => {
  // Get data from store using selectors
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id };
  
  const districtHarassmentData = useAppSelector(state => 
    selectDistrictHarassmentData(state, districtParams));
  const harassmentClassifications = useAppSelector(selectHarassmentClassification);
  
  // Use the shared component with district-specific data
  return (
    <SharedHarassmentDetailsTable
      harassmentData={districtHarassmentData}
      harassmentClassifications={harassmentClassifications}
      entityName={district?.name}
      entityType="district"
    />
  );
};

export default HarassmentDetailsTable; 
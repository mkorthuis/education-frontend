import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectDistrictHarassmentData,
  selectStateHarassmentData,
  selectHarassmentClassification,
  selectDistrictEnrollmentData,
  selectStateEnrollmentData 
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import SharedHarassmentTrendChart from '@/components/ui/safety/HarassmentTrendChart';

const HarassmentTrendChart: React.FC = () => {
  // Get data from store using selectors
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id };
  
  const districtHarassmentData = useAppSelector(state => 
    selectDistrictHarassmentData(state, districtParams));
  const stateHarassmentData = useAppSelector(state => 
    selectStateHarassmentData(state, {}));
  const harassmentClassifications = useAppSelector(selectHarassmentClassification);
  
  const districtEnrollmentData = useAppSelector(state => 
    selectDistrictEnrollmentData(state, districtParams));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, {}));
  
  // Use the shared component with district-specific data
  return (
    <SharedHarassmentTrendChart
      entityData={districtHarassmentData}
      stateData={stateHarassmentData}
      harassmentClassifications={harassmentClassifications}
      entityEnrollmentData={districtEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      entityName={district?.name}
      isDistrict={true}
    />
  );
};

export default HarassmentTrendChart; 
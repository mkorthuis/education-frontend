import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectDistrictBullyingData,
  selectStateBullyingData,
  selectBullyingTypes,
  selectDistrictEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import SharedBullyTrendChart from '@/components/ui/safety/BullyTrendChart';

interface BullyTrendChartProps {
  className?: string;
}

const BullyTrendChart: React.FC<BullyTrendChartProps> = ({ className }) => {
  // Get the data from the store
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id };
  const stateParams = {};

  const districtBullyingData = useAppSelector(state => 
    selectDistrictBullyingData(state, districtParams));
  const stateBullyingData = useAppSelector(state => 
    selectStateBullyingData(state, stateParams));
  const bullyingTypes = useAppSelector(selectBullyingTypes);
  const districtEnrollmentData = useAppSelector(state => 
    selectDistrictEnrollmentData(state, districtParams));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, stateParams));
  
  // Use the shared component with district-specific data
  return (
    <SharedBullyTrendChart
      className={className}
      entityData={districtBullyingData}
      stateData={stateBullyingData}
      bullyingTypes={bullyingTypes}
      entityEnrollmentData={districtEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      entityName={district?.name}
      isDistrict={true}
    />
  );
};

export default BullyTrendChart; 
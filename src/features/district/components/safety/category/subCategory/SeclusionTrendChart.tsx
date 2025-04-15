import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectDistrictSeclusionData,
  selectStateSeclusionData,
  selectDistrictEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedSeclusionTrendChart from '@/components/ui/safety/SeclusionTrendChart';

interface SeclusionTrendChartProps {
  className?: string;
}

const SeclusionTrendChart: React.FC<SeclusionTrendChartProps> = ({ className }) => {
  // Get the current district
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id || 0 };
  const stateParams = {};
  
  // Get the district and state seclusion data
  const districtSeclusionData = useAppSelector(state => selectDistrictSeclusionData(state, districtParams));
  const stateSeclusionData = useAppSelector(state => selectStateSeclusionData(state, stateParams));
  
  // Get enrollment data for rate calculations
  const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, districtParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  return (
    <SharedSeclusionTrendChart
      entityName={district?.name || ''}
      isDistrict={true}
      entitySeclusionData={districtSeclusionData}
      stateSeclusionData={stateSeclusionData}
      entityEnrollmentData={districtEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      className={className}
    />
  );
};

export default SeclusionTrendChart; 
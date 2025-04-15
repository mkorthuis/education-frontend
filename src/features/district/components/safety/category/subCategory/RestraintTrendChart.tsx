import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectDistrictRestraintData,
  selectStateRestraintData,
  selectDistrictEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedRestraintTrendChart from '@/components/ui/safety/RestraintTrendChart';

interface RestraintTrendChartProps {
  className?: string;
}

const RestraintTrendChart: React.FC<RestraintTrendChartProps> = ({ className }) => {
  // Get the current district
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id || 0 };
  const stateParams = {};
  
  // Get the district and state restraint data
  const districtRestraintData = useAppSelector(state => selectDistrictRestraintData(state, districtParams));
  const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, stateParams));
  
  // Get enrollment data for rate calculations
  const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, districtParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  return (
    <SharedRestraintTrendChart
      entityName={district?.name || ''}
      isDistrict={true}
      entityRestraintData={districtRestraintData}
      stateRestraintData={stateRestraintData}
      entityEnrollmentData={districtEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      className={className}
    />
  );
};

export default RestraintTrendChart; 
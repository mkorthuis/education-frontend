import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectSchoolSeclusionData,
  selectStateSeclusionData,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedSeclusionTrendChart from '@/components/ui/safety/SeclusionTrendChart';

interface SeclusionTrendChartProps {
  className?: string;
}

const SeclusionTrendChart: React.FC<SeclusionTrendChartProps> = ({ className }) => {
  // Get the current school
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  const stateParams = {};
  
  // Get the school and state seclusion data
  const schoolSeclusionData = useAppSelector(state => selectSchoolSeclusionData(state, schoolParams));
  const stateSeclusionData = useAppSelector(state => selectStateSeclusionData(state, stateParams));
  
  // Get enrollment data for rate calculations
  const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  return (
    <SharedSeclusionTrendChart
      entityName={school?.name || ''}
      isDistrict={false}
      entitySeclusionData={schoolSeclusionData}
      stateSeclusionData={stateSeclusionData}
      entityEnrollmentData={schoolEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      className={className}
    />
  );
};

export default SeclusionTrendChart; 
import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectSchoolRestraintData,
  selectStateRestraintData,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedRestraintTrendChart from '@/components/ui/safety/RestraintTrendChart';

interface RestraintTrendChartProps {
  className?: string;
}

const RestraintTrendChart: React.FC<RestraintTrendChartProps> = ({ className }) => {
  // Get the current school
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  const stateParams = {};
  
  // Get the school and state restraint data
  const schoolRestraintData = useAppSelector(state => selectSchoolRestraintData(state, schoolParams));
  const stateRestraintData = useAppSelector(state => selectStateRestraintData(state, stateParams));
  
  // Get enrollment data for rate calculations
  const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, stateParams));

  return (
    <SharedRestraintTrendChart
      entityName={school?.name || ''}
      isDistrict={false}
      entityRestraintData={schoolRestraintData}
      stateRestraintData={stateRestraintData}
      entityEnrollmentData={schoolEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      className={className}
    />
  );
};

export default RestraintTrendChart; 
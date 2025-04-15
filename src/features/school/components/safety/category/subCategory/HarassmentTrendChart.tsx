import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectSchoolHarassmentData,
  selectStateHarassmentData,
  selectHarassmentClassification,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import SharedHarassmentTrendChart from '@/components/ui/safety/HarassmentTrendChart';

interface HarassmentTrendChartProps {
  className?: string;
}

const HarassmentTrendChart: React.FC<HarassmentTrendChartProps> = ({ className }) => {
  // Get the data from the store
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  const stateParams = {};

  const schoolHarassmentData = useAppSelector(state => 
    selectSchoolHarassmentData(state, schoolParams));
  const stateHarassmentData = useAppSelector(state => 
    selectStateHarassmentData(state, stateParams));
  const harassmentClassifications = useAppSelector(selectHarassmentClassification);
  const schoolEnrollmentData = useAppSelector(state => 
    selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, stateParams));
  
  // Use the shared component with school-specific data
  return (
    <SharedHarassmentTrendChart
      className={className}
      entityData={schoolHarassmentData}
      stateData={stateHarassmentData}
      harassmentClassifications={harassmentClassifications}
      entityEnrollmentData={schoolEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      entityName={school?.name}
      isDistrict={false}
    />
  );
};

export default HarassmentTrendChart; 
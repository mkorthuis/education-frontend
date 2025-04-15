import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectSchoolBullyingData,
  selectStateBullyingData,
  selectBullyingTypes,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import SharedBullyTrendChart from '@/components/ui/safety/BullyTrendChart';

interface BullyTrendChartProps {
  className?: string;
}

const BullyTrendChart: React.FC<BullyTrendChartProps> = ({ className }) => {
  // Get the data from the store
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  const stateParams = {};

  const schoolBullyingData = useAppSelector(state => 
    selectSchoolBullyingData(state, schoolParams));
  const stateBullyingData = useAppSelector(state => 
    selectStateBullyingData(state, stateParams));
  const bullyingTypes = useAppSelector(selectBullyingTypes);
  const schoolEnrollmentData = useAppSelector(state => 
    selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, stateParams));
  
  // Use the shared component with school-specific data
  return (
    <SharedBullyTrendChart
      className={className}
      entityData={schoolBullyingData}
      stateData={stateBullyingData}
      bullyingTypes={bullyingTypes}
      entityEnrollmentData={schoolEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      entityName={school?.name}
      isDistrict={false}
    />
  );
};

export default BullyTrendChart; 
import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectSchoolTruancyData,
  selectStateTruancyData,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedTruancyHistoryChart from '@/components/ui/safety/TruancyHistoryChart';

interface TruancyHistoryChartProps {
  className?: string;
}

const TruancyHistoryChart: React.FC<TruancyHistoryChartProps> = ({ className }) => {
  // Get the current school
  const school = useAppSelector(selectCurrentSchool);
  
  // Get the school and state truancy data
  const schoolTruancyData = useAppSelector(state => selectSchoolTruancyData(state, {school_id: school?.id}));
  const stateTruancyData = useAppSelector(state => selectStateTruancyData(state, {}));
  
  // Get enrollment data for percentage calculations
  const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, {school_id: school?.id}));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

  return (
    <SharedTruancyHistoryChart
      entityName={school?.name || ''}
      entityTruancyData={schoolTruancyData}
      stateTruancyData={stateTruancyData}
      entityEnrollmentData={schoolEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      entityLabel="School"
      className={className}
    />
  );
};

export default TruancyHistoryChart; 
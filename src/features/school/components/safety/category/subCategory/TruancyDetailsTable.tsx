import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectSchoolTruancyData,
  selectStateTruancyData,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { calculatePer100Students, EARLIEST_YEAR } from '@/utils/safetyCalculations';
import SharedTruancyDetailsTable from '@/components/ui/safety/TruancyDetailsTable';

interface TruancyDetailsTableProps {
  className?: string;
}

const TruancyDetailsTable: React.FC<TruancyDetailsTableProps> = ({ className }) => {
  // Get the current school
  const school = useAppSelector(selectCurrentSchool);
  
  // Get the school and state truancy data
  const schoolTruancyData = useAppSelector(state => selectSchoolTruancyData(state, {school_id: school?.id}));
  const stateTruancyData = useAppSelector(state => selectStateTruancyData(state, {}));
  
  // Get enrollment data for percentage calculations
  const schoolEnrollmentData = useAppSelector(state => selectSchoolEnrollmentData(state, {school_id: school?.id}));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

  return (
    <SharedTruancyDetailsTable
      entityName={school?.name || ''}
      entityTruancyData={schoolTruancyData}
      stateTruancyData={stateTruancyData}
      entityEnrollmentData={schoolEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      earliestYear={EARLIEST_YEAR}
      entityLabel="School"
      className={className}
    />
  );
};

export default TruancyDetailsTable; 
import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectDistrictTruancyData, 
  selectStateTruancyData, 
  selectDistrictEnrollmentData, 
  selectStateEnrollmentData 
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { calculatePer100Students, EARLIEST_YEAR } from '@/utils/safetyCalculations';
import SharedTruancyDetailsTable from '@/components/ui/safety/TruancyDetailsTable';

interface TruancyDetailsTableProps {
  className?: string;
}

const TruancyDetailsTable: React.FC<TruancyDetailsTableProps> = ({ className }) => {
  // Get the current district
  const district = useAppSelector(selectCurrentDistrict);
  
  // Get the district and state truancy data
  const districtTruancyData = useAppSelector(state => selectDistrictTruancyData(state, {district_id: district?.id}));
  const stateTruancyData = useAppSelector(state => selectStateTruancyData(state, {}));
  
  // Get enrollment data for percentage calculations
  const districtEnrollmentData = useAppSelector(state => selectDistrictEnrollmentData(state, {district_id: district?.id}));
  const stateEnrollmentData = useAppSelector(state => selectStateEnrollmentData(state, {}));

  return (
    <SharedTruancyDetailsTable
      entityName={district?.name || ''}
      entityTruancyData={districtTruancyData}
      stateTruancyData={stateTruancyData}
      entityEnrollmentData={districtEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      earliestYear={EARLIEST_YEAR}
      entityLabel="District"
      className={className}
    />
  );
};

export default TruancyDetailsTable; 
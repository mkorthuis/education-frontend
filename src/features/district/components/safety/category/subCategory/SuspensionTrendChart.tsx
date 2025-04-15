import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectDistrictDisciplineCountData,
  selectStateDisciplineCountData,
  selectDisciplineCountTypes,
  selectDistrictEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { 
  calculatePer100Students, 
  IN_SCHOOL_SUSPENSION_TYPE,
  OUT_OF_SCHOOL_SUSPENSION_TYPE 
} from '@/utils/safetyCalculations';
import SharedSuspensionTrendChart from '@/components/ui/safety/SuspensionTrendChart';

interface SuspensionTrendChartProps {
  className?: string;
}

const SuspensionTrendChart: React.FC<SuspensionTrendChartProps> = ({ className }) => {
  // Get the data from the store
  const district = useAppSelector(selectCurrentDistrict);
  const districtDisciplineCountData = useAppSelector(state => 
    selectDistrictDisciplineCountData(state, {district_id: district?.id}));
  const stateDisciplineCountData = useAppSelector(state => 
    selectStateDisciplineCountData(state, {}));
  const disciplineCountTypes = useAppSelector(selectDisciplineCountTypes);
  const districtEnrollmentData = useAppSelector(state => 
    selectDistrictEnrollmentData(state, {district_id: district?.id}));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, {}));

  return (
    <SharedSuspensionTrendChart
      entityName="District"
      entityDisciplineCountData={districtDisciplineCountData}
      stateDisciplineCountData={stateDisciplineCountData}
      disciplineCountTypes={disciplineCountTypes}
      entityEnrollmentData={districtEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      inSchoolSuspensionType={IN_SCHOOL_SUSPENSION_TYPE}
      outOfSchoolSuspensionType={OUT_OF_SCHOOL_SUSPENSION_TYPE}
      className={className}
    />
  );
};

export default SuspensionTrendChart; 
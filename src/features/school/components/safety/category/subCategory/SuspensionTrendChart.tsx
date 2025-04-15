import React from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectSchoolDisciplineCountData,
  selectStateDisciplineCountData,
  selectDisciplineCountTypes,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
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
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  const stateParams = {};
  
  const schoolDisciplineCountData = useAppSelector(state => 
    selectSchoolDisciplineCountData(state, schoolParams));
  const stateDisciplineCountData = useAppSelector(state => 
    selectStateDisciplineCountData(state, stateParams));
  const disciplineCountTypes = useAppSelector(selectDisciplineCountTypes);
  const schoolEnrollmentData = useAppSelector(state => 
    selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, stateParams));

  return (
    <SharedSuspensionTrendChart
      entityName="School"
      entityDisciplineCountData={schoolDisciplineCountData}
      stateDisciplineCountData={stateDisciplineCountData}
      disciplineCountTypes={disciplineCountTypes}
      entityEnrollmentData={schoolEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      inSchoolSuspensionType={IN_SCHOOL_SUSPENSION_TYPE}
      outOfSchoolSuspensionType={OUT_OF_SCHOOL_SUSPENSION_TYPE}
      className={className}
    />
  );
};

export default SuspensionTrendChart; 
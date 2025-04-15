import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
import { 
  selectDistrictDisciplineIncidentData, 
  selectStateDisciplineIncidentData, 
  selectDisciplineIncidentTypes,
  selectDistrictEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedDisciplineIncidentTable from '@/components/ui/safety/DisciplineIncidentTable';

// Types
interface DisciplineIncidentTableProps {
  fiscalYear: number;
}

const DisciplineIncidentTable: React.FC<DisciplineIncidentTableProps> = ({ fiscalYear }) => {
  // Get data from store using selectors
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id || 0 };
  const stateParams = {};

  const districtData = useAppSelector(state => 
    selectDistrictDisciplineIncidentData(state, districtParams));
  const stateData = useAppSelector(state => 
    selectStateDisciplineIncidentData(state, stateParams));
  const disciplineIncidentTypes = useAppSelector(selectDisciplineIncidentTypes);
  
  // Get enrollment data for calculating per 100 student rates
  const districtEnrollmentData = useAppSelector(state => 
    selectDistrictEnrollmentData(state, districtParams));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, stateParams));

  return (
    <SharedDisciplineIncidentTable
      fiscalYear={fiscalYear}
      entityName={district?.name || ''}
      entityType="district"
      disciplineData={districtData}
      stateData={stateData}
      incidentTypes={disciplineIncidentTypes}
      entityEnrollmentData={districtEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      entityLabel="this district"
    />
  );
};

export default DisciplineIncidentTable; 
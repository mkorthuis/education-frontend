import React from 'react';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { 
  selectSchoolDisciplineIncidentData, 
  selectStateDisciplineIncidentData, 
  selectDisciplineIncidentTypes,
  selectSchoolEnrollmentData,
  selectStateEnrollmentData
} from '@/store/slices/safetySlice';
import { calculatePer100Students } from '@/utils/safetyCalculations';
import SharedDisciplineIncidentTable from '@/components/ui/safety/DisciplineIncidentTable';

// Types
interface DisciplineIncidentTableProps {
  fiscalYear: number;
}

const DisciplineIncidentTable: React.FC<DisciplineIncidentTableProps> = ({ fiscalYear: defaultFiscalYear }) => {
  // Get data from store using selectors
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  const stateParams = {};

  const schoolData = useAppSelector(state => 
    selectSchoolDisciplineIncidentData(state, schoolParams));
  const stateData = useAppSelector(state => 
    selectStateDisciplineIncidentData(state, stateParams));
  const disciplineIncidentTypes = useAppSelector(selectDisciplineIncidentTypes);
  
  // Get enrollment data for calculating per 100 student rates
  const schoolEnrollmentData = useAppSelector(state => 
    selectSchoolEnrollmentData(state, schoolParams));
  const stateEnrollmentData = useAppSelector(state => 
    selectStateEnrollmentData(state, stateParams));

  return (
    <SharedDisciplineIncidentTable
      fiscalYear={defaultFiscalYear}
      entityName={school?.name || ''}
      entityType="school"
      disciplineData={schoolData}
      stateData={stateData}
      incidentTypes={disciplineIncidentTypes}
      entityEnrollmentData={schoolEnrollmentData}
      stateEnrollmentData={stateEnrollmentData}
      calculatePer100Students={calculatePer100Students}
      entityLabel="this school"
    />
  );
};

export default DisciplineIncidentTable; 
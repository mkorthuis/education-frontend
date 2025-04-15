import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectSchoolHarassmentData,
  selectHarassmentClassification
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import SharedHarassmentDetailsTable from '@/components/ui/safety/HarassmentDetailsTable';

const HarassmentDetailsTable: React.FC = () => {
  // Get data from store using selectors
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  
  const schoolHarassmentData = useAppSelector(state => 
    selectSchoolHarassmentData(state, schoolParams));
  const harassmentClassifications = useAppSelector(selectHarassmentClassification);
  
  // Use the shared component with school-specific data
  return (
    <SharedHarassmentDetailsTable
      harassmentData={schoolHarassmentData}
      harassmentClassifications={harassmentClassifications}
      entityName={school?.name}
      entityType="school"
    />
  );
};

export default HarassmentDetailsTable; 
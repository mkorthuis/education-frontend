import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectSchoolBullyingClassificationData,
  selectBullyingClassificationTypes
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import SharedBullyClassificationTable from '@/components/ui/safety/BullyClassificationTable';

interface BullyClassificationTableProps {
  selectedYear: string | number;
  onYearChange: (year: string | number) => void;
}

const BullyClassificationTable: React.FC<BullyClassificationTableProps> = ({ 
  selectedYear, 
  onYearChange 
}) => {
  // Get data from store using selectors
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  
  const schoolBullyClassificationData = useAppSelector(state => 
    selectSchoolBullyingClassificationData(state, schoolParams));
  const bullyingClassificationTypes = useAppSelector(selectBullyingClassificationTypes);
  
  // Use the shared component with school-specific data
  return (
    <SharedBullyClassificationTable
      selectedYear={selectedYear}
      onYearChange={onYearChange}
      classificationData={schoolBullyClassificationData}
      classificationTypes={bullyingClassificationTypes}
      entityName={school?.name}
      entityType="school"
    />
  );
};

export default BullyClassificationTable; 
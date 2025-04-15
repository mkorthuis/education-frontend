import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectSchoolBullyingImpactData,
  selectBullyingImpactTypes
} from '@/store/slices/safetySlice';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import SharedBullyImpactTable from '@/components/ui/safety/BullyImpactTable';

interface BullyImpactTableProps {
  selectedYear: string | number;
  onYearChange: (year: string | number) => void;
}

const BullyImpactTable: React.FC<BullyImpactTableProps> = ({ 
  selectedYear, 
  onYearChange 
}) => {
  // Get data from store using selectors
  const school = useAppSelector(selectCurrentSchool);
  const schoolParams = { school_id: school?.id || 0 };
  
  const schoolBullyImpactData = useAppSelector(state => 
    selectSchoolBullyingImpactData(state, schoolParams));
  const bullyingImpactTypes = useAppSelector(selectBullyingImpactTypes);
  
  // Use the shared component with school-specific data
  return (
    <SharedBullyImpactTable
      selectedYear={selectedYear}
      onYearChange={onYearChange}
      impactData={schoolBullyImpactData}
      impactTypes={bullyingImpactTypes}
      entityName={school?.name}
      entityType="school"
    />
  );
};

export default BullyImpactTable; 
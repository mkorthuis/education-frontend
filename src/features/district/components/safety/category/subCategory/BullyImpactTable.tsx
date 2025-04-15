import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectDistrictBullyingImpactData,
  selectBullyingImpactTypes
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
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
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id };
  
  const districtBullyImpactData = useAppSelector(state => 
    selectDistrictBullyingImpactData(state, districtParams));
  const bullyingImpactTypes = useAppSelector(selectBullyingImpactTypes);
  
  // Use the shared component with district-specific data
  return (
    <SharedBullyImpactTable
      selectedYear={selectedYear}
      onYearChange={onYearChange}
      impactData={districtBullyImpactData}
      impactTypes={bullyingImpactTypes}
      entityName={district?.name}
      entityType="district"
    />
  );
};

export default BullyImpactTable; 
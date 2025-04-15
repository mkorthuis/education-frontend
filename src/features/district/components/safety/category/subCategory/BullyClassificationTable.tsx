import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectDistrictBullyingClassificationData,
  selectBullyingClassificationTypes
} from '@/store/slices/safetySlice';
import { selectCurrentDistrict } from '@/store/slices/locationSlice';
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
  const district = useAppSelector(selectCurrentDistrict);
  const districtParams = { district_id: district?.id };
  
  const districtBullyClassificationData = useAppSelector(state => 
    selectDistrictBullyingClassificationData(state, districtParams));
  const bullyingClassificationTypes = useAppSelector(selectBullyingClassificationTypes);
  
  // Use the shared component with district-specific data
  return (
    <SharedBullyClassificationTable
      selectedYear={selectedYear}
      onYearChange={onYearChange}
      classificationData={districtBullyClassificationData}
      classificationTypes={bullyingClassificationTypes}
      entityName={district?.name}
      entityType="district"
    />
  );
};

export default BullyClassificationTable; 
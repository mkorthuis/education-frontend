import React, { useMemo } from 'react';
import { FISCAL_YEAR } from '@/utils/environment';
import SafetyDataTable, { ColumnDefinition, TotalDefinition, EntityType } from './SafetyDataTable';

// Define data types
interface ClassificationType {
  id: number;
  name: string;
}

interface ClassificationDataItem {
  year: number;
  classification_type: ClassificationType;
  count: number;
}

interface BullyClassificationTableProps {
  selectedYear: string | number;
  onYearChange: (year: string | number) => void;
  classificationData: ClassificationDataItem[];
  classificationTypes: ClassificationType[];
  entityName?: string;
  entityType?: EntityType;
}

const BullyClassificationTable: React.FC<BullyClassificationTableProps> = ({ 
  selectedYear, 
  onYearChange,
  classificationData,
  classificationTypes,
  entityName,
  entityType = 'school'
}) => {
  // Define columns for the table
  const columns: ColumnDefinition[] = [
    {
      id: 'name',
      label: 'Classification',
      align: 'left',
      getValue: (data) => data.name || ''
    },
    {
      id: 'count',
      label: 'Count',
      align: 'right',
      getValue: (data) => data.count || 0
    }
  ];
  
  // Calculate totals
  const totals = useMemo<TotalDefinition[]>(() => {
    if (!classificationData || !selectedYear) return [];
    
    const filteredData = selectedYear === 'all' 
      ? classificationData 
      : classificationData.filter(item => item.year === Number(selectedYear));
    
    const countTotal = filteredData.reduce((total, item) => total + item.count, 0);
    
    return [
      { label: 'name', value: 'Total' },
      { label: 'count', value: countTotal, align: 'right' }
    ];
  }, [classificationData, selectedYear]);
  
  // Define function to get data for each classification type
  const getClassificationData = (classificationTypeId: number, filteredData: ClassificationDataItem[]) => {
    const items = filteredData.filter(item => 
      item.classification_type?.id === classificationTypeId
    );
    
    const count = items.reduce((sum, item) => sum + item.count, 0);
    
    return { count };
  };
  
  return (
    <SafetyDataTable
      data={classificationData}
      itemTypes={classificationTypes}
      title="Bullying Incidents Based On:"
      columns={columns}
      totals={totals}
      typeIdField="id"
      entityName={entityName}
      entityType={entityType}
      externalSelectedYear={selectedYear}
      onYearChange={onYearChange}
      hideEmptyRows={true}
      getItemData={getClassificationData}
      missingDataMessage={`There were no bullying classification incidents reported for the ${entityName || entityType} in the selected time period.`}
    />
  );
};

export default BullyClassificationTable; 
import React, { useMemo } from 'react';
import { FISCAL_YEAR } from '@/utils/environment';
import SafetyDataTable, { ColumnDefinition, TotalDefinition, EntityType } from './SafetyDataTable';

// Define data types
interface ImpactType {
  id: number;
  name: string;
}

interface ImpactDataItem {
  year: number;
  impact_type: ImpactType;
  count: number;
}

interface BullyImpactTableProps {
  selectedYear: string | number;
  onYearChange: (year: string | number) => void;
  impactData: ImpactDataItem[];
  impactTypes: ImpactType[];
  entityName?: string;
  entityType?: EntityType;
}

const BullyImpactTable: React.FC<BullyImpactTableProps> = ({ 
  selectedYear, 
  onYearChange,
  impactData,
  impactTypes,
  entityName,
  entityType = 'school'
}) => {
  // Define columns for the table
  const columns: ColumnDefinition[] = [
    {
      id: 'name',
      label: 'Impact Type',
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
    if (!impactData || !selectedYear) return [];
    
    const filteredData = selectedYear === 'all' 
      ? impactData 
      : impactData.filter(item => item.year === Number(selectedYear));
    
    const countTotal = filteredData.reduce((total, item) => total + item.count, 0);
    
    return [
      { label: 'name', value: 'Total' },
      { label: 'count', value: countTotal, align: 'right' }
    ];
  }, [impactData, selectedYear]);
  
  // Define function to get data for each impact type
  const getImpactData = (impactTypeId: number, filteredData: ImpactDataItem[]) => {
    const items = filteredData.filter(item => 
      item.impact_type?.id === impactTypeId
    );
    
    const count = items.reduce((sum, item) => sum + item.count, 0);
    
    return { count };
  };
  
  return (
    <SafetyDataTable
      data={impactData}
      itemTypes={impactTypes}
      title="Bullying Incidents That:"
      columns={columns}
      totals={totals}
      typeIdField="id"
      entityName={entityName}
      entityType={entityType}
      externalSelectedYear={selectedYear}
      onYearChange={onYearChange}
      hideEmptyRows={true}
      getItemData={getImpactData}
      missingDataMessage={`There were no bullying impact incidents reported for the ${entityName || entityType} in the selected time period.`}
    />
  );
};

export default BullyImpactTable; 
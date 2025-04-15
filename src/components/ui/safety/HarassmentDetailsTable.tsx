import React, { useMemo, useState } from 'react';
import { FISCAL_YEAR } from '@/utils/environment';
import SafetyDataTable, { ColumnDefinition, TotalDefinition, EntityType } from './SafetyDataTable';

// Define data types
interface HarassmentClassification {
  id: number;
  name: string;
}

interface HarassmentDataItem {
  year: number;
  classification: HarassmentClassification;
  incident_count: number;
  student_impact_count: number;
  student_engaged_count: number;
}

interface HarassmentDetailsTableProps {
  harassmentData: HarassmentDataItem[];
  harassmentClassifications: HarassmentClassification[];
  entityName?: string;
  entityType?: EntityType;
}

const HarassmentDetailsTable: React.FC<HarassmentDetailsTableProps> = ({
  harassmentData,
  harassmentClassifications,
  entityName,
  entityType = 'school'
}) => {
  // Get default fiscal year from environment
  const defaultFiscalYear = parseInt(FISCAL_YEAR);
  
  // Add state to track the selected year
  const [selectedYear, setSelectedYear] = useState<string | number>(defaultFiscalYear);
  
  // Define columns for the table
  const columns: ColumnDefinition[] = [
    {
      id: 'name',
      label: 'Harassment Type',
      align: 'left',
      mobileVisible: true, // Always visible on mobile
      getValue: (data) => data.name || ''
    },
    {
      id: 'incidentCount',
      label: 'Incidents',
      align: 'right',
      mobileVisible: true, // Always visible on mobile
      getValue: (data) => data.incidentCount || 0
    },
    {
      id: 'studentImpactCount',
      label: 'Students Impacted',
      align: 'right',
      mobileVisible: false, // Hide on mobile
      getValue: (data) => data.studentImpactCount || 0
    },
    {
      id: 'studentEngagedCount',
      label: 'Students Disciplined',
      align: 'right',
      mobileVisible: false, // Hide on mobile
      getValue: (data) => data.studentEngagedCount || 0
    }
  ];

  // Filter data based on the selected year
  const filteredData = useMemo(() => {
    return selectedYear === 'all'
      ? harassmentData
      : harassmentData.filter(item => item.year === Number(selectedYear));
  }, [harassmentData, selectedYear]);

  // Define function to calculate totals based on filtered data
  const calculateTotals = (data: HarassmentDataItem[]): TotalDefinition[] => {
    const incidentTotal = data.reduce((total, item) => total + item.incident_count, 0);
    const studentImpactTotal = data.reduce((total, item) => total + item.student_impact_count, 0);
    const studentEngagedTotal = data.reduce((total, item) => total + item.student_engaged_count, 0);
    
    return [
      { label: 'name', value: 'Total' },
      { label: 'incidentCount', value: incidentTotal, align: 'right' },
      { label: 'studentImpactCount', value: studentImpactTotal, align: 'right' },
      { label: 'studentEngagedCount', value: studentEngagedTotal, align: 'right' }
    ];
  };
  
  // Calculate totals based on filtered data
  const currentTotals = useMemo(() => {
    return calculateTotals(filteredData);
  }, [filteredData]);
  
  // Function to get data for a specific classification
  const getClassificationData = (classificationId: number, currentFilteredData: HarassmentDataItem[]) => {
    const items = currentFilteredData.filter(item => 
      item.classification?.id === classificationId
    );
    
    const incidentCount = items.reduce((sum, item) => sum + item.incident_count, 0);
    const studentImpactCount = items.reduce((sum, item) => sum + item.student_impact_count, 0);
    const studentEngagedCount = items.reduce((sum, item) => sum + item.student_engaged_count, 0);
    
    return {
      incidentCount,
      studentImpactCount,
      studentEngagedCount
    };
  };
  
  // Handle year change
  const handleYearChange = (year: string | number) => {
    setSelectedYear(year);
  };
  
  return (
    <SafetyDataTable
      data={harassmentData}
      itemTypes={harassmentClassifications}
      title="Harassment Incidents:"
      columns={columns}
      totals={currentTotals}
      typeIdField="id"
      entityName={entityName}
      entityType={entityType}
      getItemData={getClassificationData}
      externalSelectedYear={selectedYear}
      onYearChange={handleYearChange}
      missingDataMessage={`There were no harassment incidents reported in the ${entityName || entityType} in the selected time period.`}
    />
  );
};

export default HarassmentDetailsTable; 
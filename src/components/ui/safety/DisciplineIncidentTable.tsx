import React, { useMemo, useState } from 'react';
import { formatFiscalYear } from '@/features/district/utils/financialDataProcessing';
import { Typography, Box } from '@mui/material';
import SafetyDataTable, { ColumnDefinition, TotalDefinition, ItemType, EntityType } from '@/components/ui/safety/SafetyDataTable';

// Types
export interface DisciplineIncidentData {
  year: number;
  count: number;
  incident_type: {
    id: number;
    name: string;
  };
}

export interface DisciplineIncidentType {
  id: number;
  name: string;
}

export interface EnrollmentData {
  year: number;
  total_enrollment: number;
}

export interface GroupedType extends ItemType {
  displayName: string;
  typeIds: number[];
  minTypeId: number; // Used for sorting
}

export interface DisciplineIncidentTableProps {
  fiscalYear: number;
  entityName: string;
  entityType: EntityType;
  disciplineData: DisciplineIncidentData[];
  stateData: DisciplineIncidentData[];
  incidentTypes: DisciplineIncidentType[];
  entityEnrollmentData: EnrollmentData[];
  stateEnrollmentData: EnrollmentData[];
  calculatePer100Students: (count: number, enrollment: number) => number;
  entityLabel: string;
}

// Constants for incident type mapping
const INCIDENT_TYPE_MAPPING: Record<string, string> = {
  "drug": "Others Related to Drug, Alcohol, Violence, Weapons",
  "alcohol": "Others Related to Drug, Alcohol, Violence, Weapons",
  "weapon": "Others Related to Drug, Alcohol, Violence, Weapons",
  "harass": "Violent Incidents, incl. Harassment + Bullying (No Injury)",
  "bully": "Violent Incidents, incl. Harassment + Bullying (No Injury)",
  "medical": "Violent Incidents Requiring Medical Attention",
  "injury": "Violent Incidents Requiring Medical Attention"
};

// Helper functions
export const getDisplayName = (originalName: string): string => {
  for (const [key, value] of Object.entries(INCIDENT_TYPE_MAPPING)) {
    if (originalName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return originalName;
};

export const getEnrollment = (
  data: EnrollmentData[], 
  year: string | number
): number => {
  if (year === 'all') {
    const sortedYears = data.map(item => item.year).sort((a, b) => b - a);
    const mostRecentYear = sortedYears[0];
    return data.find(item => item.year === mostRecentYear)?.total_enrollment || 0;
  }
  return data.find(item => item.year === Number(year))?.total_enrollment || 0;
};

const DisciplineIncidentTable: React.FC<DisciplineIncidentTableProps> = ({ 
  fiscalYear,
  entityName,
  entityType,
  disciplineData,
  stateData,
  incidentTypes,
  entityEnrollmentData,
  stateEnrollmentData,
  calculatePer100Students,
  entityLabel
}) => {
  // Add state to track the selected year
  const [selectedYear, setSelectedYear] = useState<string | number>(fiscalYear);

  // Get all available years from the data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    
    // Extract years from discipline data
    disciplineData.forEach(item => yearsSet.add(item.year));
    stateData.forEach(item => yearsSet.add(item.year));
    
    // Convert to array and sort descending
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [disciplineData, stateData]);

  // Group and sort incident types
  const sortedGroupedTypes = useMemo<GroupedType[]>(() => {
    // Group incident types by display name to combine similar categories
    const groupedTypesMap = incidentTypes.reduce<Record<string, GroupedType>>((acc, type) => {
      const displayName = getDisplayName(type.name);
      if (!acc[displayName]) {
        acc[displayName] = {
          id: type.id,
          name: displayName,
          displayName,
          typeIds: [type.id],
          minTypeId: type.id
        };
      } else {
        acc[displayName].typeIds.push(type.id);
        if (type.id < acc[displayName].minTypeId) {
          acc[displayName].minTypeId = type.id;
          acc[displayName].id = type.id; // Ensure id matches minTypeId for ItemType compatibility
        }
      }
      return acc;
    }, {});
    
    // Convert to array and sort by minTypeId
    return Object.values(groupedTypesMap).sort((a, b) => a.minTypeId - b.minTypeId);
  }, [incidentTypes]);

  // Prepare the data for SafetyDataTable
  const tableData = useMemo(() => {
    // Create data entries for all years to ensure year selection works correctly
    const result: any[] = [];
    
    availableYears.forEach(year => {
      sortedGroupedTypes.forEach(group => {
        result.push({
          id: group.minTypeId,
          name: group.displayName,
          typeIds: group.typeIds,
          year
        });
      });
    });
    
    return result;
  }, [sortedGroupedTypes, availableYears]);

  // Define column ID to use based on whether this is district or school view
  const entityColumnId = entityType === 'district' ? 'districtPer100' : 'schoolPer100';

  // Define columns for the table
  const columns: ColumnDefinition[] = [
    {
      id: 'name',
      label: 'Incident Type',
      align: 'left',
      mobileVisible: true, // Always visible on mobile
      getValue: (data) => data.name || ''
    },
    {
      id: 'count',
      label: 'Number',
      align: 'right',
      mobileVisible: true, // Always visible on mobile
      getValue: (data) => data.count || 0
    },
    {
      id: entityColumnId,
      label: `${entityType === 'district' ? 'District' : 'School'} Per 100`,
      align: 'right',
      mobileVisible: false, // Hide on mobile
      getValue: (data) => data[entityColumnId] || '0.00'
    },
    {
      id: 'statePer100',
      label: 'State Per 100',
      align: 'right',
      mobileVisible: false, // Hide on mobile
      getValue: (data) => data.statePer100 || '0.00'
    }
  ];

  // Function to get data for each incident group
  const getGroupData = (groupId: number, filteredData: any[]) => {
    // Find the group by id
    const group = sortedGroupedTypes.find(g => g.id === groupId);
    
    if (!group) return { count: 0, [entityColumnId]: '0.00', statePer100: '0.00' };
    
    // Get year from filtered data or use selected year
    const dataYear = filteredData.length > 0 ? filteredData[0].year : selectedYear;
    
    // Calculate metrics
    const entityCount = group.typeIds.reduce((total, typeId) => {
      return total + disciplineData
        .filter(item => item.year === Number(dataYear) && item.incident_type.id === typeId)
        .reduce((sum, item) => sum + item.count, 0);
    }, 0);
    
    const stateCount = group.typeIds.reduce((total, typeId) => {
      return total + stateData
        .filter(item => item.year === Number(dataYear) && item.incident_type.id === typeId)
        .reduce((sum, item) => sum + item.count, 0);
    }, 0);
    
    // Get enrollments
    const entityEnrollment = getEnrollment(entityEnrollmentData, dataYear);
    const stateEnrollment = getEnrollment(stateEnrollmentData, dataYear);
    
    // Format the per100 values
    const entityPer100 = calculatePer100Students(entityCount, entityEnrollment).toFixed(2);
    const statePer100 = calculatePer100Students(stateCount, stateEnrollment).toFixed(2);
    
    return {
      count: entityCount,
      [entityColumnId]: entityPer100,
      statePer100: statePer100
    };
  };

  // Filter data based on the selected year for totals calculation
  const filteredData = useMemo(() => {
    return selectedYear === 'all'
      ? disciplineData
      : disciplineData.filter(item => item.year === Number(selectedYear));
  }, [disciplineData, selectedYear]);

  const filteredStateData = useMemo(() => {
    return selectedYear === 'all'
      ? stateData
      : stateData.filter(item => item.year === Number(selectedYear));
  }, [stateData, selectedYear]);

  // Calculate totals
  const calculateTotals = useMemo<TotalDefinition[]>(() => {
    const entityTotal = filteredData.reduce((total, item) => total + item.count, 0);
    const stateTotal = filteredStateData.reduce((total, item) => total + item.count, 0);
    
    const entityEnrollment = getEnrollment(entityEnrollmentData, selectedYear);
    const stateEnrollment = getEnrollment(stateEnrollmentData, selectedYear);
    
    return [
      { label: 'name', value: 'Total' },
      { label: 'count', value: entityTotal, align: 'right' },
      { 
        label: entityColumnId, 
        value: calculatePer100Students(entityTotal, entityEnrollment).toFixed(2),
        align: 'right' 
      },
      { 
        label: 'statePer100', 
        value: calculatePer100Students(stateTotal, stateEnrollment).toFixed(2),
        align: 'right' 
      }
    ];
  }, [filteredData, filteredStateData, selectedYear, entityEnrollmentData, stateEnrollmentData, calculatePer100Students, entityColumnId]);

  // Handle year change
  const handleYearChange = (year: string | number) => {
    setSelectedYear(year);
  };

  // Construct proper year message for missing data
  const yearMessage = selectedYear === 'all' 
    ? 'the selected years' 
    : formatFiscalYear(selectedYear);

  return (
    <SafetyDataTable
      data={tableData}
      itemTypes={sortedGroupedTypes}
      title="Incidents Resulting in Suspension:"
      columns={columns}
      totals={calculateTotals}
      typeIdField="id"
      entityName={entityName}
      entityType={entityType}
      externalSelectedYear={selectedYear}
      onYearChange={handleYearChange}
      hideEmptyRows={false}
      getItemData={getGroupData}
      missingDataMessage={`No discipline incident data available for ${entityName || entityLabel} in ${yearMessage}.`}
      shouldRenderTable={(types, items) => 
        incidentTypes.length > 0 && 
        (disciplineData.length > 0 || stateData.length > 0)
      }
    />
  );
};

export default DisciplineIncidentTable; 
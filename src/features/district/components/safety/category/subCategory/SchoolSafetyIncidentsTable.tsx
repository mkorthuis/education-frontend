import React from 'react';
import SchoolSafetyIncidentsTable from '@/components/ui/safety/SchoolSafetyIncidentsTable';
import { SafetyIncident, SchoolSafetyIncidentsTableProps } from '@/components/ui/safety/SchoolSafetyIncidentsTable';

// Re-export the shared component with divider enabled by default
const DistrictSchoolSafetyIncidentsTable: React.FC<SchoolSafetyIncidentsTableProps> = (props) => {
  return <SchoolSafetyIncidentsTable {...props} showDivider={true} />;
};

export default DistrictSchoolSafetyIncidentsTable; 
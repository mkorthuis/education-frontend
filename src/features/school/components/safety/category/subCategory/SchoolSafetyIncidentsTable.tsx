import React from 'react';
import SchoolSafetyIncidentsTable from '@/components/ui/safety/SchoolSafetyIncidentsTable';
import { SafetyIncident, SchoolSafetyIncidentsTableProps } from '@/components/ui/safety/SchoolSafetyIncidentsTable';

// Re-export the shared component
const SchoolSafetyIncidentsTableWrapper: React.FC<SchoolSafetyIncidentsTableProps> = (props) => {
  return <SchoolSafetyIncidentsTable {...props} />;
};

export default SchoolSafetyIncidentsTableWrapper; 
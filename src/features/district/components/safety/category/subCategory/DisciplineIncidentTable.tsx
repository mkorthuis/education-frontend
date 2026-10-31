import React from 'react';
import EntityDisciplineIncidentTable from '@/features/entity/components/safety/category/subCategory/EntityDisciplineIncidentTable';

const DisciplineIncidentTable: React.FC<{ fiscalYear: number }> = ({ fiscalYear }) =>
  <EntityDisciplineIncidentTable kind="district" fiscalYear={fiscalYear} />;

export default DisciplineIncidentTable;

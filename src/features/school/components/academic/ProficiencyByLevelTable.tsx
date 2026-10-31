import React from 'react';
import EntityProficiencyByLevelTable from '@/features/entity/components/academic/EntityProficiencyByLevelTable';

const ProficiencyByLevelTable: React.FC<{ schoolName?: string }> = ({ schoolName }) =>
  <EntityProficiencyByLevelTable kind="school" entityName={schoolName} />;

export default ProficiencyByLevelTable;

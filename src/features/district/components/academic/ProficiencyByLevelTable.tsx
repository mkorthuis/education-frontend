import React from 'react';
import EntityProficiencyByLevelTable from '@/features/entity/components/academic/EntityProficiencyByLevelTable';

const ProficiencyByLevelTable: React.FC<{ districtName?: string }> = ({ districtName }) =>
  <EntityProficiencyByLevelTable kind="district" entityName={districtName} />;

export default ProficiencyByLevelTable;

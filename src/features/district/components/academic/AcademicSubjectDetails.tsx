import React from 'react';
import EntityAcademicSubjectDetails, { EntityAcademicSubjectDetailsProps } from '@/features/entity/components/academic/EntityAcademicSubjectDetails';

const AcademicSubjectDetails: React.FC<Omit<EntityAcademicSubjectDetailsProps, 'kind'>> = props =>
  <EntityAcademicSubjectDetails kind="district" {...props} />;

export default AcademicSubjectDetails;

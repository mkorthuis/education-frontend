import React from 'react';
import EntityMeasurementCard, { EntityMeasurementCardProps } from '@/features/entity/components/academic/EntityMeasurementCard';

const MeasurementCard: React.FC<Omit<EntityMeasurementCardProps, 'kind'>> = props =>
  <EntityMeasurementCard kind="school" {...props} />;

export default MeasurementCard;

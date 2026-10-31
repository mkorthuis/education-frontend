import React from 'react';
import EntityMeasurementCard, { EntityMeasurementCardProps } from '@/features/entity/components/academic/EntityMeasurementCard';

const MeasurementCard: React.FC<Omit<EntityMeasurementCardProps, 'kind'>> = props =>
  <EntityMeasurementCard kind="district" {...props} />;

export default MeasurementCard;

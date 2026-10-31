import React from 'react';
import EntityGraduationRateChart from '@/features/entity/components/outcome/EntityGraduationRateChart';

const GraduationRateChart: React.FC<{ className?: string }> = ({ className }) =>
  <EntityGraduationRateChart kind="school" className={className} />;

export default GraduationRateChart;

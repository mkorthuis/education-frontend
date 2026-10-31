import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectCurrentAssessmentStateData,
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
  selectAssessmentSubgroups
} from '@/store/slices/assessmentSlice';
import { ALL_STUDENTS_SUBGROUP_ID } from '@/features/district/utils/assessmentDataProcessing';
import AcademicHistoryChartUI from '@/components/ui/academic/AcademicHistoryChart';
import { EntityKind } from '@/features/entity/entity';
import { ASSESSMENT, EntityAssessmentData } from '@/features/entity/bindings/assessment';

const EntityAcademicHistoryChart: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  // Get assessment data and filter selections
  const assessmentData: EntityAssessmentData[] = useAppSelector(state => ASSESSMENT[kind].selectCurrentData(state));
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  const subgroups = useAppSelector(selectAssessmentSubgroups);
  
  // Determine subgroup name for display
  const selectedSubgroupName = useMemo(() => {
    if (!selectedSubgroupId || selectedSubgroupId === ALL_STUDENTS_SUBGROUP_ID) return null;
    return subgroups.find(sg => sg.id === selectedSubgroupId)?.name || null;
  }, [selectedSubgroupId, subgroups]);
  
  return (
    <AcademicHistoryChartUI
      assessmentData={assessmentData}
      stateAssessmentData={stateAssessmentData}
      selectedSubjectId={selectedSubjectId}
      selectedGradeId={selectedGradeId}
      selectedSubgroupId={selectedSubgroupId}
      selectedSubgroupName={selectedSubgroupName}
      entityType={kind}
    />
  );
};

export default EntityAcademicHistoryChart;

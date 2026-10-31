import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useParams } from 'react-router-dom';
import {
  fetchAssessmentStateData,
  selectCurrentAssessmentStateData,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
  selectSelectedSubjectId,
  selectAssessmentStateLoadingStatus,
} from '@/store/slices/assessmentSlice';
import { ASSESSMENT_YEAR } from '@/utils/environment';
import { filterAssessmentResults, getProficiencyRangeIndex } from '@/features/district/utils/assessmentDataProcessing';
import { LoadingState } from '@/store/slices/safetySlice';
import EntityAcademicPerformance from '@/components/ui/academic/EntityAcademicPerformance';
import { EntityKind } from '@/features/entity/entity';
import { ASSESSMENT, dispatchEntityAssessmentFetch } from '@/features/entity/bindings/assessment';

// Function to calculate state average proficiency percentage
const calculateStateAverage = (stateData: any[]) => {
  if (!stateData || stateData.length === 0) return null;

  const stateItem = stateData[0];

  if (stateItem.above_proficient_percentage_exception === 'SCORE_UNDER_10') return 9;
  if (stateItem.above_proficient_percentage_exception === 'SCORE_OVER_90') return 91;
  if (stateItem.above_proficient_percentage !== null) return Math.round(stateItem.above_proficient_percentage);

  return null;
};

// Function to process entity data into 1% increment bars.
// idField is 'school_id' or 'district_id'.
const processEntityData = (entityData: any[], currentEntityId: number | null, idField: string) => {
  // Initialize bars (0% to 100%)
  const percentageBars = Array.from({ length: 101 }, (_, i) => ({
    percentage: i,
    count: 0,
    isCurrentEntity: false
  }));

  // Find current entity percentage
  let currentEntityPercentage = -1;
  if (currentEntityId) {
    const currentEntity = entityData.find(e => e[idField] === currentEntityId);
    if (currentEntity) {
      currentEntityPercentage = getProficiencyRangeIndex(
        currentEntity.above_proficient_percentage,
        currentEntity.above_proficient_percentage_exception
      );
    }
  }

  // Count entities at each percentage
  entityData.forEach(entity => {
    const index = getProficiencyRangeIndex(
      entity.above_proficient_percentage,
      entity.above_proficient_percentage_exception
    );

    if (index >= 0 && index <= 100) {
      percentageBars[index].count++;
    }
  });

  // Mark current entity
  if (currentEntityPercentage >= 0 && currentEntityPercentage <= 100) {
    percentageBars[currentEntityPercentage].isCurrentEntity = true;
  }

  return percentageBars;
};

const EntityAcademicPerformanceContainer: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const { id } = useParams<{ id: string }>();
  const currentEntityId = id ? parseInt(id) : null;
  const dispatch = useAppDispatch();
  const assessment = ASSESSMENT[kind];

  // Get selected filters from Redux store
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);

  // Create query params
  const queryParams = useMemo(() => ({
    year: ASSESSMENT_YEAR,
    assessment_subgroup_id: selectedSubgroupId || undefined,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined
  }), [selectedSubjectId, selectedSubgroupId, selectedGradeId]);

  // Get assessment data
  const entityAssessmentData = useAppSelector(state => assessment.selectData(state, queryParams));
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);

  // Loading statuses
  const isEntityDataLoading = useAppSelector(state => assessment.selectLoading(state, queryParams));
  const isStateDataLoading = useAppSelector(state => selectAssessmentStateLoadingStatus(state, {}));

  // Fetch data if needed
  useEffect(() => {
    if (selectedSubjectId && selectedSubgroupId && selectedGradeId) {
      // Fetch entity data if not available
      if (entityAssessmentData.length === 0 && isEntityDataLoading === LoadingState.IDLE) {
        dispatchEntityAssessmentFetch(dispatch, kind, queryParams);
      }

      // Fetch state data if not available
      if (stateAssessmentData.length === 0 && isStateDataLoading === LoadingState.IDLE) {
        dispatch(fetchAssessmentStateData(queryParams));
      }
    }
  }, [
    dispatch, kind, entityAssessmentData, stateAssessmentData, queryParams,
    isEntityDataLoading, isStateDataLoading,
    selectedSubjectId, selectedSubgroupId, selectedGradeId
  ]);

  // Process chart data
  const chartData = useMemo(() =>
    processEntityData(entityAssessmentData, currentEntityId, assessment.idField),
  [entityAssessmentData, currentEntityId, assessment]);

  // Calculate state average
  const stateAverage = useMemo(() => {
    const filteredStateData = filterAssessmentResults(stateAssessmentData, queryParams);
    return calculateStateAverage(filteredStateData);
  }, [stateAssessmentData, queryParams]);

  // Calculate entity rank
  const { rank, total } = useMemo(() =>
    assessment.rankInfo(entityAssessmentData, currentEntityId),
  [assessment, entityAssessmentData, currentEntityId]);

  return (
    <EntityAcademicPerformance
      chartData={chartData}
      entityType={kind}
      stateAverage={stateAverage}
      rank={rank}
      total={total}
      hasData={entityAssessmentData.length > 0}
    />
  );
};

export default EntityAcademicPerformanceContainer;

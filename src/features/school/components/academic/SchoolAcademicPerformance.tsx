import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useParams } from 'react-router-dom';
import { 
  fetchAssessmentSchoolData, 
  fetchAssessmentStateData,
  selectAssessmentSchoolLoadingStatus,
  selectAssessmentSchoolData,
  selectCurrentAssessmentStateData,
  selectSelectedGradeId, 
  selectSelectedSubgroupId, 
  selectSelectedSubjectId,
  selectAssessmentStateLoadingStatus,
} from '@/store/slices/assessmentSlice';
import { ASSESSMENT_YEAR } from '@/utils/environment';
import { filterAssessmentResults, getProficiencyRangeIndex, getSchoolRankInfo } from '@/features/district/utils/assessmentDataProcessing';
import { LoadingState } from '@/store/slices/safetySlice';
import EntityAcademicPerformance from '@/components/ui/academic/EntityAcademicPerformance';

// Function to calculate state average proficiency percentage
const calculateStateAverage = (stateData: any[]) => {
  if (!stateData || stateData.length === 0) return null;
  
  const stateItem = stateData[0];
  
  if (stateItem.above_proficient_percentage_exception === 'SCORE_UNDER_10') return 9;
  if (stateItem.above_proficient_percentage_exception === 'SCORE_OVER_90') return 91;
  if (stateItem.above_proficient_percentage !== null) return Math.round(stateItem.above_proficient_percentage);
  
  return null;
};

// Function to process school data into 1% increment bars
const processSchoolData = (schoolData: any[], currentSchoolId: number | null) => {
  // Initialize bars (0% to 100%)
  const percentageBars = Array.from({ length: 101 }, (_, i) => ({
    percentage: i,
    count: 0,
    isCurrentEntity: false
  }));

  // Find current school percentage
  let currentSchoolPercentage = -1;
  if (currentSchoolId) {
    const currentSchool = schoolData.find(s => s.school_id === currentSchoolId);
    if (currentSchool) {
      currentSchoolPercentage = getProficiencyRangeIndex(
        currentSchool.above_proficient_percentage, 
        currentSchool.above_proficient_percentage_exception
      );
    }
  }

  // Count schools at each percentage
  schoolData.forEach(school => {
    const index = getProficiencyRangeIndex(
      school.above_proficient_percentage,
      school.above_proficient_percentage_exception
    );
    
    if (index >= 0 && index <= 100) {
      percentageBars[index].count++;
    }
  });

  // Mark current school
  if (currentSchoolPercentage >= 0 && currentSchoolPercentage <= 100) {
    percentageBars[currentSchoolPercentage].isCurrentEntity = true;
  }

  return percentageBars;
};

const SchoolAcademicPerformance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const currentSchoolId = id ? parseInt(id) : null;
  const dispatch = useAppDispatch();
  
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
  const schoolAssessmentData = useAppSelector(state => selectAssessmentSchoolData(state, queryParams));
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);
  
  // Loading statuses
  const isSchoolDataLoading = useAppSelector(state => selectAssessmentSchoolLoadingStatus(state, queryParams));
  const isStateDataLoading = useAppSelector(state => selectAssessmentStateLoadingStatus(state, {}));

  // Fetch data if needed
  useEffect(() => {
    if (selectedSubjectId && selectedSubgroupId && selectedGradeId) {
      // Fetch school data if not available
      if (schoolAssessmentData.length === 0 && isSchoolDataLoading === LoadingState.IDLE) {
        dispatch(fetchAssessmentSchoolData(queryParams));
      }
      
      // Fetch state data if not available
      if (stateAssessmentData.length === 0 && isStateDataLoading === LoadingState.IDLE) {
        dispatch(fetchAssessmentStateData(queryParams));
      }
    }
  }, [
    dispatch, schoolAssessmentData, stateAssessmentData, queryParams, 
    isSchoolDataLoading, isStateDataLoading, 
    selectedSubjectId, selectedSubgroupId, selectedGradeId
  ]);
  
  // Process chart data
  const chartData = useMemo(() => 
    processSchoolData(schoolAssessmentData, currentSchoolId),
  [schoolAssessmentData, currentSchoolId]);
  
  // Calculate state average
  const stateAverage = useMemo(() => {
    const filteredStateData = filterAssessmentResults(stateAssessmentData, queryParams);
    return calculateStateAverage(filteredStateData);
  }, [stateAssessmentData, queryParams]);
  
  // Calculate school rank
  const { rank, total } = useMemo(() => 
    getSchoolRankInfo(schoolAssessmentData, currentSchoolId),
  [schoolAssessmentData, currentSchoolId]);

  return (
    <EntityAcademicPerformance
      chartData={chartData}
      entityType="school"
      stateAverage={stateAverage}
      rank={rank}
      total={total}
      hasData={schoolAssessmentData.length > 0}
    />
  );
};

export default SchoolAcademicPerformance; 
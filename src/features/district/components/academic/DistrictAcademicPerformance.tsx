import React, { useEffect, useMemo } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { 
  fetchAssessmentDistrictData, 
  fetchAssessmentStateData,
  selectAssessmentDistrictLoadingStatus,
  selectAssessmentDistrictData,
  selectCurrentAssessmentStateData,
  selectSelectedGradeId, 
  selectSelectedSubgroupId, 
  selectSelectedSubjectId,
  selectAssessmentStateLoadingStatus,
} from '@/store/slices/assessmentSlice';
import { FISCAL_YEAR } from '@/utils/environment';
import { filterAssessmentResults, getProficiencyRangeIndex, getDistrictRankInfo } from '@/features/district/utils/assessmentDataProcessing';
import { LoadingState } from '@/store/slices/safetySlice';
import EntityAcademicPerformance from '@/components/ui/academic/EntityAcademicPerformance';

// Function to calculate state average proficiency percentage
const calculateStateAverage = (stateData: any[]) => {
  if (!stateData || stateData.length === 0) return null;
  
  // Handle special cases first
  const stateItem = stateData[0]; // Assuming we're using the first state record
  
  if (stateItem.above_proficient_percentage_exception === 'SCORE_UNDER_10') {
    return 9; // Treat as 9%
  } else if (stateItem.above_proficient_percentage_exception === 'SCORE_OVER_90') {
    return 91; // Treat as 91%
  } else if (stateItem.above_proficient_percentage !== null) {
    return Math.round(stateItem.above_proficient_percentage);
  }
  
  return null;
};

// Function to process district data into 1% increment bars
const processDistrictData = (districtData: any[], currentDistrictId: number | null) => {
  // Initialize 100 bars (0% to 100%)
  const percentageBars = Array.from({ length: 101 }, (_, i) => ({
    percentage: i,
    count: 0,
    isCurrentEntity: false
  }));

  // Find the current district and its proficiency percentage
  let currentDistrictPercentage = -1;
  if (currentDistrictId) {
    const currentDistrict = districtData.find(d => d.district_id === currentDistrictId);
    if (currentDistrict) {
      currentDistrictPercentage = getProficiencyRangeIndex(
        currentDistrict.above_proficient_percentage, 
        currentDistrict.above_proficient_percentage_exception
      );
    }
  }

  // Count districts at each percentage level
  districtData.forEach(district => {
    const percentageIndex = getProficiencyRangeIndex(
      district.above_proficient_percentage,
      district.above_proficient_percentage_exception
    );
    
    if (percentageIndex >= 0 && percentageIndex <= 100) {
      percentageBars[percentageIndex].count++;
    }
  });

  // Mark the bar that contains the current district
  if (currentDistrictPercentage >= 0 && currentDistrictPercentage <= 100) {
    percentageBars[currentDistrictPercentage].isCurrentEntity = true;
  }

  // Return all bars including zeros to show the complete spectrum
  return percentageBars;
};

const DistrictAcademicPerformance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const currentDistrictId = id ? parseInt(id) : null;
  
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const dispatch = useAppDispatch();
  
  // Create params object for the selected filters
  const queryParams = useMemo(() => ({
    year: FISCAL_YEAR,
    assessment_subgroup_id: selectedSubgroupId || undefined,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined
  }), [selectedSubjectId, selectedSubgroupId, selectedGradeId]);
  
  const districtAssessmentData = useAppSelector(state => selectAssessmentDistrictData(state, queryParams));
  
  const stateAssessmentData = useAppSelector(selectCurrentAssessmentStateData);
  
  // Add loading state selectors
  const isDistrictDataLoading = useAppSelector(state => selectAssessmentDistrictLoadingStatus(state, queryParams));
  const isStateDataLoading = useAppSelector(state => selectAssessmentStateLoadingStatus(state, {}));

  useEffect(() => {
    if(selectedSubgroupId && selectedSubjectId && selectedGradeId) {
        if(districtAssessmentData.length === 0 && isDistrictDataLoading === LoadingState.IDLE) {
          dispatch(fetchAssessmentDistrictData(queryParams));
        }
        
        if(stateAssessmentData.length === 0 && isStateDataLoading === LoadingState.IDLE) {
          dispatch(fetchAssessmentStateData({
            year: FISCAL_YEAR,
            assessment_subgroup_id: selectedSubgroupId,
            assessment_subject_id: selectedSubjectId,
            grade_id: selectedGradeId
          }));
        }
    }
  }, [dispatch, districtAssessmentData, queryParams, stateAssessmentData, isDistrictDataLoading, isStateDataLoading, selectedSubjectId, selectedSubgroupId, selectedGradeId]);
  
  // Process the district data into ranges for the chart
  const chartData = useMemo(() => {
    return processDistrictData(districtAssessmentData, currentDistrictId);
  }, [districtAssessmentData, currentDistrictId]);
  
  // Calculate state average
  const stateAverage = useMemo(() => {
    // Filter state data using the utility function
    const filteredStateData = filterAssessmentResults(stateAssessmentData, {
      year: FISCAL_YEAR,
      assessment_subgroup_id: selectedSubgroupId || undefined,
      assessment_subject_id: selectedSubjectId || undefined,
      grade_id: selectedGradeId || undefined
    });
    
    return calculateStateAverage(filteredStateData);
  }, [stateAssessmentData, selectedSubjectId, selectedSubgroupId, selectedGradeId]);
  
  // Calculate district rank
  const { rank, total } = useMemo(() => {
    return getDistrictRankInfo(districtAssessmentData, currentDistrictId);
  }, [districtAssessmentData, currentDistrictId]);

  return (
    <EntityAcademicPerformance
      chartData={chartData}
      entityType="district"
      stateAverage={stateAverage}
      rank={rank}
      total={total}
      hasData={districtAssessmentData.length > 0}
    />
  );
};

export default DistrictAcademicPerformance; 
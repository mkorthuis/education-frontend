import { 
  BaseAssessmentParams,
  AssessmentDistrictData,
  AssessmentStateData,
  AssessmentSchoolData,
  AssessmentSubgroup
} from '@/store/slices/assessmentSlice';
import { Grade } from '@/store/slices/locationSlice';

// Assessment-specific constants
export const ALL_GRADES_ID = 999;
export const ALL_GRADES_NAME = 'All Grades';
export const ALL_STUDENTS_SUBGROUP_ID = 1;
export const ALL_STUDENTS_SUBGROUP_NAME = 'All students';
export const EARLIEST_YEAR = 2019;

// Extend the Grade interface to include the disabled property
export interface ExtendedGrade extends Grade {
  disabled?: boolean;
}

// Extend the AssessmentSubgroup interface to include the disabled property
export interface ExtendedSubgroup extends AssessmentSubgroup {
  disabled?: boolean;
}

/**
 * Filters assessment data based on provided parameters
 * @param assessmentData Array of assessment data objects to filter
 * @param params Parameters to filter by (year, subject_id, subgroup_id, grade_id)
 * @returns Filtered array of assessment data
 */
export const filterAssessmentResults = <T extends AssessmentDistrictData | AssessmentStateData | AssessmentSchoolData>(
  assessmentData: T[],
  params: Partial<BaseAssessmentParams>
): T[] => {
  return assessmentData.filter(item => {
    // Filter by year if provided
    if (params.year !== undefined) {
      const yearNum = parseInt(params.year);
      if (item.year !== yearNum) return false;
    }

    // Filter by assessment_subject_id if provided
    if (params.assessment_subject_id !== undefined && 
        item.assessment_subject?.id !== params.assessment_subject_id) {
      return false;
    }

    // Filter by assessment_subgroup_id if provided
    if (params.assessment_subgroup_id !== undefined && 
        item.assessment_subgroup?.id !== params.assessment_subgroup_id) {
      return false;
    }

    // Filter by grade_id if provided
    if (params.grade_id !== undefined) {
      // Special case: If grade_id is ALL_GRADES_ID, match items with null grade_id
      if (params.grade_id === ALL_GRADES_ID) {
        if (item.grade !== null) return false;
      } else {
        // Normal case: Match with the provided grade_id
        if (item.grade?.id !== params.grade_id) return false;
      }
    }

    return true;
  });
};

/**
 * Extracts unique grade objects from assessment data based on grade.id
 * @param assessmentData Array of assessment data objects to process
 * @returns Array of unique ExtendedGrade objects with disabled property for TOO_FEW_SAMPLES grades
 */
export const getUniqueGrades = <T extends AssessmentDistrictData | AssessmentStateData | AssessmentSchoolData>(
  assessmentData: T[]
): ExtendedGrade[] => {
  // Create a map to store unique grades by id
  const gradesMap = new Map<number, ExtendedGrade>();
  
  // Create a Set to track grade IDs that appear only with TOO_FEW_SAMPLES
  const onlyTooFewSamplesGrades = new Set<number>();
  const normalGrades = new Set<number>();
  
  // Process each assessment data item
  assessmentData.forEach(item => {
    // Skip items with null grade
    if (item.grade === null) {
      if (!gradesMap.has(ALL_GRADES_ID)) {
        gradesMap.set(ALL_GRADES_ID, { id: ALL_GRADES_ID, name: ALL_GRADES_NAME });
      }
      return;
    }
    
    if (item.grade && item.grade.id) {
      // Add grade to map if not already present
      if (!gradesMap.has(item.grade.id)) {
        gradesMap.set(item.grade.id, { ...item.grade });
      }
      
      // Track grades that have TOO_FEW_SAMPLES vs normal data
      if (item.level_1_percentage_exception === "TOO_FEW_SAMPLES") {
        onlyTooFewSamplesGrades.add(item.grade.id);
      } else {
        normalGrades.add(item.grade.id);
      }
    }
  });
  
  // Mark grades that only appear with TOO_FEW_SAMPLES as disabled
  onlyTooFewSamplesGrades.forEach(gradeId => {
    if (!normalGrades.has(gradeId) && gradesMap.has(gradeId)) {
      const grade = gradesMap.get(gradeId);
      if (grade) {
        grade.disabled = true;
      }
    }
  });
  
  // Convert map values to array and sort by id
  return Array.from(gradesMap.values()).sort((a, b) => {
    // Place "All Grades" (id ALL_GRADES_ID) first
    if (a.id === ALL_GRADES_ID) return -1;
    if (b.id === ALL_GRADES_ID) return 1;
    // Sort the rest by id descending
    return b.id - a.id;
  });
};

/**
 * Extracts unique subgroup objects from assessment data based on assessment_subgroup.id
 * @param assessmentData Array of assessment data objects to process
 * @returns Array of unique ExtendedSubgroup objects with disabled property for TOO_FEW_SAMPLES subgroups
 */
export const getUniqueSubgroups = <T extends AssessmentDistrictData | AssessmentStateData | AssessmentSchoolData>(
  assessmentData: T[]
): ExtendedSubgroup[] => {
  // Create a map to store unique subgroups by id
  const subgroupsMap = new Map<number, ExtendedSubgroup>();
  
  // Create a Set to track subgroup IDs that appear only with TOO_FEW_SAMPLES
  const onlyTooFewSamplesSubgroups = new Set<number>();
  const normalSubgroups = new Set<number>();
  
  // Process each assessment data item
  assessmentData.forEach(item => {
    if (item.assessment_subgroup && item.assessment_subgroup.id) {
      // Add subgroup to map if not already present
      if (!subgroupsMap.has(item.assessment_subgroup.id)) {
        subgroupsMap.set(item.assessment_subgroup.id, { ...item.assessment_subgroup });
      }
      
      // Track subgroups that have TOO_FEW_SAMPLES vs normal data
      if (item.level_1_percentage_exception === "TOO_FEW_SAMPLES") {
        onlyTooFewSamplesSubgroups.add(item.assessment_subgroup.id);
      } else {
        normalSubgroups.add(item.assessment_subgroup.id);
      }
    }
  });
  
  // Mark subgroups that only appear with TOO_FEW_SAMPLES as disabled
  onlyTooFewSamplesSubgroups.forEach(subgroupId => {
    if (!normalSubgroups.has(subgroupId) && subgroupsMap.has(subgroupId)) {
      const subgroup = subgroupsMap.get(subgroupId);
      if (subgroup) {
        subgroup.disabled = true;
      }
    }
  });
  
  // Convert map values to array and sort by id
  return Array.from(subgroupsMap.values()).sort((a, b) => a.id - b.id);
};

// Function to get the proficiency range index for a percentage value
export const getProficiencyRangeIndex = (percentage: number | null, exception: string | null) => {
    if (exception === 'SCORE_UNDER_10') {
      return 9; // Treat as 9%
    } else if (exception === 'SCORE_OVER_90') {
      return 91; // Treat as 91%
    } else if (percentage !== null) {
      // Round to the nearest integer (1% increment)
      return Math.round(percentage);
    }
    return -1; // Invalid or missing data
  };


// Function to get district rank information
export const getDistrictRankInfo = (districtData: any[], currentDistrictId: number | null) => {
    if (!districtData || districtData.length === 0 || !currentDistrictId) {
      return { rank: null, total: 0 };
    }
    
    // Only count districts with valid proficiency data
    const districtsWithData = districtData.filter(d => 
      d.above_proficient_percentage !== null || 
      d.above_proficient_percentage_exception === 'SCORE_UNDER_10' || 
      d.above_proficient_percentage_exception === 'SCORE_OVER_90'
    );
    
    const total = districtsWithData.length;
    
    // Find current district
    const currentDistrict = districtsWithData.find(d => d.district_id === currentDistrictId);
    if (!currentDistrict) {
      return { rank: null, total };
    }
    
    // Get normalized proficiency percentage for current district
    const currentProficiency = getProficiencyRangeIndex(
      currentDistrict.above_proficient_percentage,
      currentDistrict.above_proficient_percentage_exception
    );
    
    if (currentProficiency === -1) {
      return { rank: null, total };
    }
    
    // Count districts with higher proficiency
    // (rank 1 is the highest proficiency)
    const districtsWithHigherProficiency = districtsWithData.filter(d => {
      const proficiency = getProficiencyRangeIndex(
        d.above_proficient_percentage,
        d.above_proficient_percentage_exception
      );
      return proficiency > currentProficiency;
    }).length;
    
    // Calculate rank (1 is best - highest proficiency)
    const rank = districtsWithHigherProficiency + 1;
    
    return { rank, total };
  };
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

// Common assessment data type - represents all assessment data types
export type AssessmentDataType = AssessmentDistrictData | AssessmentStateData | AssessmentSchoolData;

// Extended interfaces with common disabled property
export interface ExtendedGrade extends Grade {
  disabled?: boolean;
}

export interface ExtendedSubgroup extends AssessmentSubgroup {
  disabled?: boolean;
}

/**
 * Filters assessment data based on provided parameters
 * @param assessmentData Array of assessment data objects to filter
 * @param params Parameters to filter by (year, subject_id, subgroup_id, grade_id)
 * @returns Filtered array of assessment data
 */
export const filterAssessmentResults = <T extends AssessmentDataType>(
  assessmentData: T[],
  params: Partial<BaseAssessmentParams>
): T[] => {
  return assessmentData.filter(item => {
    // Filter by year if provided
    if (params.year !== undefined && item.year !== parseInt(params.year)) {
      return false;
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
        return item.grade === null;
      } 
      // Normal case: Match with the provided grade_id
      return item.grade?.id === params.grade_id;
    }

    return true;
  });
};

/**
 * Generic function to extract unique items from assessment data
 * @param assessmentData Assessment data array
 * @param getItem Function to get the item from assessment data
 * @param checkException Function to check if the item has an exception
 * @param createDefaultItem Function to create a default "All" item
 * @param sortItems Function to sort the items
 * @returns Array of unique items with disabled property set for TOO_FEW_SAMPLES
 */
const getUniqueItems = <T extends AssessmentDataType, R extends { id: number, disabled?: boolean }>(
  assessmentData: T[],
  getItem: (item: T) => R | null | undefined,
  checkException: (item: T) => boolean,
  createDefaultItem: () => R,
  sortItems: (a: R, b: R) => number
): R[] => {
  // Create a map to store unique items by id
  const itemsMap = new Map<number, R>();
  
  // Track items that appear with and without TOO_FEW_SAMPLES
  const onlyTooFewSamplesItems = new Set<number>();
  const normalItems = new Set<number>();
  
  // Check if we need to add a default "All" item
  let hasDefaultItem = false;
  
  // Process each assessment data item
  assessmentData.forEach(item => {
    const currentItem = getItem(item);
    
    // Skip null or undefined items
    if (!currentItem) {
      if (!hasDefaultItem) {
        const defaultItem = createDefaultItem();
        itemsMap.set(defaultItem.id, defaultItem);
        hasDefaultItem = true;
      }
      return;
    }
    
    // Add item to map if not already present
    if (!itemsMap.has(currentItem.id)) {
      itemsMap.set(currentItem.id, { ...currentItem });
    }
    
    // Track TOO_FEW_SAMPLES vs normal data
    if (checkException(item)) {
      onlyTooFewSamplesItems.add(currentItem.id);
    } else {
      normalItems.add(currentItem.id);
    }
  });
  
  // Mark items that only appear with TOO_FEW_SAMPLES as disabled
  onlyTooFewSamplesItems.forEach(itemId => {
    if (!normalItems.has(itemId) && itemsMap.has(itemId)) {
      const item = itemsMap.get(itemId);
      if (item) {
        item.disabled = true;
      }
    }
  });
  
  // Convert map values to array and sort
  return Array.from(itemsMap.values()).sort(sortItems);
};

/**
 * Extracts unique grade objects from assessment data
 * @param assessmentData Array of assessment data objects
 * @returns Array of unique ExtendedGrade objects
 */
export const getUniqueGrades = <T extends AssessmentDataType>(
  assessmentData: T[]
): ExtendedGrade[] => {
  return getUniqueItems<T, ExtendedGrade>(
    assessmentData,
    // Get grade from assessment data
    (item) => item.grade,
    // Check for TOO_FEW_SAMPLES exception
    (item) => item.level_1_percentage_exception === "TOO_FEW_SAMPLES",
    // Create "All Grades" item
    () => ({ id: ALL_GRADES_ID, name: ALL_GRADES_NAME }),
    // Sort grades: "All Grades" first, then descending by id
    (a, b) => {
      if (a.id === ALL_GRADES_ID) return -1;
      if (b.id === ALL_GRADES_ID) return 1;
      return b.id - a.id;
    }
  );
};

/**
 * Extracts unique subgroup objects from assessment data
 * @param assessmentData Array of assessment data objects
 * @returns Array of unique ExtendedSubgroup objects
 */
export const getUniqueSubgroups = <T extends AssessmentDataType>(
  assessmentData: T[]
): ExtendedSubgroup[] => {
  return getUniqueItems<T, ExtendedSubgroup>(
    assessmentData,
    // Get subgroup from assessment data
    (item) => item.assessment_subgroup,
    // Check for TOO_FEW_SAMPLES exception
    (item) => item.level_1_percentage_exception === "TOO_FEW_SAMPLES",
    // No default "All" item for subgroups as they're already included in the data
    () => ({ id: -1, name: "", description: null }),
    // Sort subgroups by id ascending
    (a, b) => a.id - b.id
  );
};

/**
 * Handles special score cases and normalizes proficiency percentages
 * @param percentage The raw percentage value
 * @param exception Exception string (e.g., SCORE_UNDER_10)
 * @returns Normalized percentage value for comparison
 */
export const getProficiencyRangeIndex = (percentage: number | null, exception: string | null): number => {
  if (exception === 'SCORE_UNDER_10') {
    return 9; // Treat as 9%
  } else if (exception === 'SCORE_OVER_90') {
    return 91; // Treat as 91%
  } else if (percentage !== null) {
    return Math.round(percentage); // Round to nearest integer
  }
  return -1; // Invalid or missing data
};

/**
 * Generic function to calculate entity rank based on proficiency
 * @param data Array of assessment data
 * @param entityId ID of the current entity
 * @param getEntityId Function to get entity ID from data
 * @returns Object with rank and total count
 */
const getEntityRankInfo = <T extends { 
  above_proficient_percentage: number | null, 
  above_proficient_percentage_exception: string | null 
}>(
  data: T[],
  entityId: number | null,
  getEntityId: (item: T) => number | string
): { rank: number | null, total: number } => {
  if (!data || data.length === 0 || !entityId) {
    return { rank: null, total: 0 };
  }
  
  // Only count entities with valid proficiency data
  const entitiesWithData = data.filter(entity => 
    entity.above_proficient_percentage !== null || 
    entity.above_proficient_percentage_exception === 'SCORE_UNDER_10' || 
    entity.above_proficient_percentage_exception === 'SCORE_OVER_90'
  );
  
  const total = entitiesWithData.length;
  
  // Find current entity
  const currentEntity = entitiesWithData.find(entity => getEntityId(entity) === entityId);
  if (!currentEntity) {
    return { rank: null, total };
  }
  
  // Get proficiency for current entity
  const currentProficiency = getProficiencyRangeIndex(
    currentEntity.above_proficient_percentage,
    currentEntity.above_proficient_percentage_exception
  );
  
  if (currentProficiency === -1) {
    return { rank: null, total };
  }
  
  // Count entities with higher proficiency (rank 1 is highest)
  const entitiesWithHigherProficiency = entitiesWithData.filter(entity => {
    const proficiency = getProficiencyRangeIndex(
      entity.above_proficient_percentage,
      entity.above_proficient_percentage_exception
    );
    return proficiency > currentProficiency;
  }).length;
  
  return { rank: entitiesWithHigherProficiency + 1, total };
};

/**
 * Gets district rank information
 * @param districtData Array of district assessment data
 * @param currentDistrictId ID of the current district
 * @returns Object with rank and total count
 */
export const getDistrictRankInfo = (
  districtData: any[], 
  currentDistrictId: number | null
): { rank: number | null, total: number } => {
  return getEntityRankInfo(
    districtData,
    currentDistrictId,
    (district) => district.district_id
  );
};

/**
 * Gets school rank information
 * @param schoolData Array of school assessment data
 * @param currentSchoolId ID of the current school
 * @returns Object with rank and total count
 */
export const getSchoolRankInfo = (
  schoolData: any[], 
  currentSchoolId: number | null
): { rank: number | null, total: number } => {
  return getEntityRankInfo(
    schoolData,
    currentSchoolId,
    (school) => school.school_id
  );
};
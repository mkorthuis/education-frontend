import {
  AssessmentDistrictData,
  AssessmentStateData,
  AssessmentSchoolData
} from '@/store/slices/assessmentSlice';

// Common assessment data type
export type AssessmentDataType = AssessmentDistrictData | AssessmentStateData | AssessmentSchoolData;

// Entity type definition
export type EntityType = 'school' | 'district' | 'state';

/**
 * Get the capitalized entity label based on entity type
 */
export const getEntityLabel = (entityType: EntityType): string => {
  switch (entityType) {
    case 'school':
      return "School";
    case 'district':
      return "District";
    case 'state':
      return "State";
    default:
      return "Entity";
  }
};

/**
 * Get the plural form of an entity type
 */
export const getEntityPlural = (entityType: EntityType): string => {
  switch (entityType) {
    case 'school':
      return "Schools";
    case 'district':
      return "Districts";
    case 'state':
      return "States";
    default:
      return "Entities";
  }
};

/**
 * Format percentage values with special handling for exceptions
 */
export const formatPercentage = (
  percentage: number | null,
  exception: string | null
): string => {
  if (percentage !== null) {
    return `${percentage.toFixed(1)}%`;
  }
  
  if (exception === 'SCORE_UNDER_10') {
    return '<10%';
  } else if (exception === 'SCORE_OVER_90') {
    return '>90%';
  } else if (exception) {
    return exception;
  }
  
  return 'N/A';
};

/**
 * Process exception values for charts
 */
export const processExceptionValue = (
  percentage: number | null,
  exception: string | null
): number | null => {
  if (percentage !== null) return percentage;
  
  if (exception === 'SCORE_UNDER_10') return 10;
  if (exception === 'SCORE_OVER_90') return 90;
  
  return null;
};

// Chart color constants
export const CHART_COLORS = {
  CURRENT_ENTITY: '#1976d2', // Blue for current entity
  STATE_AVERAGE: '#4CAF50', // Green for state average
  OTHER_ENTITIES: '#9e9e9e', // Grey for other entities
  SUBGROUP: '#1976d2', // Primary blue for subgroup
  ALL_STUDENTS: '#9e9e9e', // Grey for all students when subgroup is selected
};

// Proficiency level definitions
export const PROFICIENCY_LEVELS = [
  { 
    key: 'level_1_percentage', 
    exception: 'level_1_percentage_exception', 
    label: 'Below Proficient', 
    bgColor: '#ffcdd2',
    description: 'The student generally performs significantly below the standard for the grade level/course, is likely able to partially access grade-level content and engages with higher order thinking skills with extensive support.'
  },
  { 
    key: 'level_2_percentage', 
    exception: 'level_2_percentage_exception', 
    label: 'Near Proficient', 
    bgColor: '#ffebee',
    description: 'The student generally performs slightly below the standard for the grade level/course, is able to access grade-level content, and engages in higher order thinking skills with some independence and support.'
  },
  { 
    key: 'level_3_percentage', 
    exception: 'level_3_percentage_exception', 
    label: 'Proficient', 
    bgColor: '#e8f5e9',
    description: 'The student generally performs at the standard for the grade level/course, is able to access grade-level content, and engages in higher order thinking skills with some independence and minimal support.'
  },
  { 
    key: 'level_4_percentage', 
    exception: 'level_4_percentage_exception', 
    label: 'Above Proficient', 
    bgColor: '#c8e6c9',
    description: 'The student generally performs significantly above the standard for the grade level/course, is able to access above grade-level content, and engages in higher order thinking skills independently.'
  }
];

// Interface for proficiency level data
export interface ProficiencyLevelData {
  level_1_percentage: number | null;
  level_1_percentage_exception: string | null;
  level_2_percentage: number | null;
  level_2_percentage_exception: string | null;
  level_3_percentage: number | null;
  level_3_percentage_exception: string | null;
  level_4_percentage: number | null;
  level_4_percentage_exception: string | null;
} 
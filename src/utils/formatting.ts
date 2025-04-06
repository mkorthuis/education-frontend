import { School, Staff } from '@/store/slices/locationSlice';

/**
 * Formats a number to a compact representation (e.g., 1.25M, 250K)
 * 
 * @param value - The number to format
 * @returns A string with the compact representation including dollar sign
 */
export const formatCompactNumber = (value: number): string => {
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (absValue >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (absValue >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
};

/**
 * Formats the grades for display with proper ranges and abbreviations
 */
export const formatGradesDisplay = (school: School): string => {
  if (!school.grades || school.grades.length === 0) return '';
  
  const gradeNames = school.grades.map(g => g.name.replace('Grade ', '').trim());
  
  // Define grade order for determining consecutive grades
  const gradeOrder: Record<string, number> = {
    'Preschool': 0,
    'Kindergarten': 1,
    '1': 2, '2': 3, '3': 4, '4': 5, '5': 6, '6': 7,
    '7': 8, '8': 9, '9': 10, '10': 11, '11': 12, '12': 13,
    'Post Graduate': 14
  };
  
  // Group consecutive grades with dashes
  let currentGroup = [gradeNames[0]];
  const groups = [];
  
  for (let i = 1; i < gradeNames.length; i++) {
    const current = gradeNames[i];
    const prev = gradeNames[i-1];
    
    // Check if grades are consecutive based on defined order
    if (current in gradeOrder && prev in gradeOrder && gradeOrder[current] === gradeOrder[prev] + 1) {
      currentGroup.push(current);
    } else {
      // Start a new group
      groups.push([...currentGroup]);
      currentGroup = [current];
    }
  }
  
  // Add the last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  // Format each group with dashes for ranges
  let gradesDisplay = groups.map(group => {
    if (group.length === 1) return group[0];
    return `${group[0]}-${group[group.length-1]}`;
  }).join(', ');
  
  // Handle special grade abbreviations
  return gradesDisplay
    .replace('Kindergarten', 'K')
    .replace('Preschool', 'PK')
    .replace('Post Graduate', 'PG');
};

// --- Staff Sorting Logic ---

// Define the desired sort order for admin_type
const adminTypeOrder: { [key: string]: number } = {
  SUP: 0, // Superintendent
  SDE: 1, // Special Ed Director 
  ASU: 2, // Assistant Superintendent
  BUS: 3, // Business Admin
  PRI: 4, // Principal (Likely - though might belong to school level)
};

/**
 * Sorts an array of staff members based on admin_type priority and then last name.
 * 
 * @param staff - The array of Staff objects to sort.
 * @returns A new array with staff members sorted.
 */
export const sortStaffByTypeAndName = (staff: Staff[]): Staff[] => {
  if (!staff) {
    return [];
  }

  // Create a shallow copy to avoid mutating the original array
  return [...staff].sort((a, b) => {
    const priorityA = adminTypeOrder[a.admin_type] ?? Infinity; // Assign lowest priority if type is not in the defined order
    const priorityB = adminTypeOrder[b.admin_type] ?? Infinity;

    // Compare priorities
    if (priorityA !== priorityB) {
      return priorityA - priorityB; // Sort by admin_type priority
    }

    // If admin_type priority is the same, sort by last name alphabetically
    return a.last_name.localeCompare(b.last_name);
  });
}; 
export const STAFF_TYPES = {
  TEACHER: 'Teacher',
  INSTRUCTION_SUPPORT: 'Instruction Support',
  SPECIALIST: 'Specialist',
  LIBRARIAN: 'Librarian',
  ADMIN_SUPPORT: 'Admin Support',
  ALL_OTHER_SUPPORT: 'All Other Support'
} as const;

export const STAFF_TYPE_ORDER = [
  STAFF_TYPES.TEACHER,
  STAFF_TYPES.INSTRUCTION_SUPPORT,
  STAFF_TYPES.SPECIALIST,
  STAFF_TYPES.LIBRARIAN,
  STAFF_TYPES.ADMIN_SUPPORT,
  STAFF_TYPES.ALL_OTHER_SUPPORT
] as const;

export const STAFF_TYPES_WITH_TOOLTIP = [
  STAFF_TYPES.INSTRUCTION_SUPPORT,
  STAFF_TYPES.SPECIALIST,
  STAFF_TYPES.ALL_OTHER_SUPPORT
] as const;

export const STAFF_TYPE_MOBILE_NAMES: Record<typeof STAFF_TYPES[keyof typeof STAFF_TYPES], string> = {
  [STAFF_TYPES.TEACHER]: 'Teacher',
  [STAFF_TYPES.INSTRUCTION_SUPPORT]: 'Instr. Sup.',
  [STAFF_TYPES.SPECIALIST]: 'Specialist',
  [STAFF_TYPES.LIBRARIAN]: 'Librarian',
  [STAFF_TYPES.ADMIN_SUPPORT]: 'Admin',
  [STAFF_TYPES.ALL_OTHER_SUPPORT]: 'Other'
} as const;

export const STAFF_TYPE_TOOLTIPS: Record<typeof STAFF_TYPES[keyof typeof STAFF_TYPES], string> = {
  [STAFF_TYPES.TEACHER]: '',
  [STAFF_TYPES.INSTRUCTION_SUPPORT]: 'Staff who support classroom instruction but are not classroom teachers',
  [STAFF_TYPES.SPECIALIST]: 'Staff who provide specialized services such as speech therapy, occupational therapy, or counseling',
  [STAFF_TYPES.LIBRARIAN]: '',
  [STAFF_TYPES.ADMIN_SUPPORT]: '',
  [STAFF_TYPES.ALL_OTHER_SUPPORT]: 'Staff who provide other support services not included in other categories'
} as const;

export const TEACHER_EDUCATION_TYPES = {
  BACHELORS: 'Bachelors',
  MASTERS: 'Masters',
  BEYOND_MASTERS: 'Beyond Masters',
  NONE: 'None'
} as const;

export const TEACHER_EDUCATION_ORDER = [
  TEACHER_EDUCATION_TYPES.BACHELORS,
  TEACHER_EDUCATION_TYPES.MASTERS,
  TEACHER_EDUCATION_TYPES.BEYOND_MASTERS,
  TEACHER_EDUCATION_TYPES.NONE
] as const;

export interface ClassSizeData {
  year: number;
  all_grades: number | null;
  grades_1_2?: number | null;
  grades_3_4?: number | null;
  grades_5_8?: number | null;
}

export interface EnrollmentData {
  year: number;
  grade_1?: number | null;
  grade_2?: number | null;
  grade_3?: number | null;
  grade_4?: number | null;
  grade_5?: number | null;
  grade_6?: number | null;
  grade_7?: number | null;
  grade_8?: number | null;
}

export const calculateAverageClassSize = (data: ClassSizeData, enrollmentData?: EnrollmentData): number => {
  // If all_grades exists and is not zero, use it
  if (data.all_grades && data.all_grades > 0) {
    return data.all_grades;
  }

  // If we have enrollment data, use it for weights
  if (enrollmentData) {
    const gradeRanges = [
      { 
        value: data.grades_1_2, 
        weight: (enrollmentData.grade_1 || 0) + (enrollmentData.grade_2 || 0)
      },
      { 
        value: data.grades_3_4, 
        weight: (enrollmentData.grade_3 || 0) + (enrollmentData.grade_4 || 0)
      },
      { 
        value: data.grades_5_8, 
        weight: (enrollmentData.grade_5 || 0) + (enrollmentData.grade_6 || 0) + 
                (enrollmentData.grade_7 || 0) + (enrollmentData.grade_8 || 0)
      }
    ];

    let totalWeight = 0;
    let weightedSum = 0;

    gradeRanges.forEach(range => {
      if (range.value && range.value > 0 && range.weight > 0) {
        weightedSum += range.value * range.weight;
        totalWeight += range.weight;
      }
    });
    // Return the weighted average if we have any valid data
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Fallback to default weights if no enrollment data
  const fallbackGradeRanges = [
    { value: data.grades_1_2, weight: 2 }, // Grades 1-2
    { value: data.grades_3_4, weight: 2 }, // Grades 3-4
    { value: data.grades_5_8, weight: 4 }  // Grades 5-8
  ];

  let totalWeight = 0;
  let weightedSum = 0;

  fallbackGradeRanges.forEach(range => {
    if (range.value && range.value > 0) {
      weightedSum += range.value * range.weight;
      totalWeight += range.weight;
    }
  });
  // Return the weighted average if we have any valid data
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}; 
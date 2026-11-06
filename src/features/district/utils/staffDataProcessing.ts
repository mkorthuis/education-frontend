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

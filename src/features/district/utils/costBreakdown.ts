import { EntryType, ProcessedReport, StateADM } from '@/store/slices/financeSlice';
import { SCHOOL_LEVEL_SUPER_CATEGORY_IDS } from './financialDataProcessing';

// The Overall tab's breakdown of district costs: each category's share of spending, or its cost per
// student, beside the state's. Shared by the table and the page's Excel download.

/** A row of the breakdown: a category, or a subcategory under its parent */
export interface CostCategory {
  name: string;
  isSubcategory?: boolean;
  district: number; // A percentage, or dollars per student
  state: number;
  parent?: string; // Parent category name for subcategories
}

/** Shares of spending (percentages), or cost per student (dollars per average daily membership) */
export type CostBreakdownMode = 'percentage' | 'admCost';

export interface CostBreakdownInput {
  /** The state's DOE-25 spending lines for the year */
  stateItems: { entry_type_id: number; value: number }[];
  entryTypes: EntryType[];
  /** The district's processed report for the year */
  districtReport?: ProcessedReport;
  stateADM: StateADM | null;
}

// Category total structure for data accumulation
interface CategoryTotals {
  instruction: {
    total: number;
    regular: number;
    special: number;
    vocational: number;
    otherPrograms: number;
  };
  supportServices: {
    total: number;
    student: number;
    building: number;
    administration: number;
    transportation: number;
    instructionalStaff: number;
    other: number;
    foodService: number;
  };
  other: {
    total: number;
    facilities: number;
    debtService: number;
    miscellaneous: number;
  };
}

const emptyTotals = (): CategoryTotals => ({
  instruction: { total: 0, regular: 0, special: 0, vocational: 0, otherPrograms: 0 },
  supportServices: {
    total: 0, student: 0, building: 0, administration: 0,
    transportation: 0, instructionalStaff: 0, other: 0, foodService: 0
  },
  other: { total: 0, facilities: 0, debtService: 0, miscellaneous: 0 }
});

// Adds an expenditure's share or per-student cost to its category and subcategory
const processExpenditureItem = (
  categoryName: string,
  entryTypeName: string,
  value: number,
  totals: CategoryTotals
): void => {
  if (categoryName === 'Instruction') {
    totals.instruction.total += value;

    if (entryTypeName === 'Regular Programs') {
      totals.instruction.regular += value;
    } else if (entryTypeName === 'Special Programs') {
      totals.instruction.special += value;
    } else if (entryTypeName === 'Vocational Programs') {
      totals.instruction.vocational += value;
    } else {
      // Other instructional programs, and any other instruction-related programs
      totals.instruction.otherPrograms += value;
    }
  } else if (categoryName === 'Support Services') {
    totals.supportServices.total += value;

    if (entryTypeName === 'Student') {
      totals.supportServices.student += value;
    } else if (entryTypeName === 'Operation/Maintenance of Plant') {
      totals.supportServices.building += value;
    } else if (
      entryTypeName === 'General Administration' ||
      entryTypeName === 'School Administration' ||
      entryTypeName === 'Business' ||
      entryTypeName === 'Central'
    ) {
      totals.supportServices.administration += value;
    } else if (entryTypeName === 'Student Transportation') {
      totals.supportServices.transportation += value;
    } else if (entryTypeName === 'Instructional Staff') {
      totals.supportServices.instructionalStaff += value;
    } else {
      // Any other support service
      totals.supportServices.other += value;
    }
  } else if (categoryName === 'Operations') {
    if (
      entryTypeName === 'Elementary' ||
      entryTypeName === 'Middle/Junior High' ||
      entryTypeName === 'High'
    ) {
      totals.supportServices.total += value;
      totals.supportServices.foodService += value;
    } else {
      totals.other.total += value;
      totals.other.miscellaneous += value;
    }
  } else {
    totals.other.total += value;

    if (entryTypeName === 'Facilities Acquisition & Construction') {
      totals.other.facilities += value;
    } else if (categoryName === 'Debt Service') {
      totals.other.debtService += value;
    } else {
      totals.other.miscellaneous += value;
    }
  }
};

/**
 * The breakdown's rows, each category followed by its subcategories. Without a district report the
 * district's column repeats the state's. Per student, the district leaves out spending for school
 * levels it has no students in.
 */
export const costBreakdown = (mode: CostBreakdownMode, { stateItems, entryTypes, districtReport, stateADM }: CostBreakdownInput): CostCategory[] => {
  const categoryTotals = { district: emptyTotals(), state: emptyTotals() };

  // Calculate state total for percentage calculations
  const stateTotal = stateItems.reduce((sum, item) => sum + (item.value || 0), 0);

  const districtExpenditures = districtReport?.expenditures;
  const districtADM = districtReport?.adm;
  const districtTotal = (districtExpenditures ?? []).reduce((sum, item) => sum + item.value, 0);

  // Process state data
  stateItems.forEach(item => {
    if (!item.entry_type_id) return;

    const entryType = entryTypes.find(type => type.id === item.entry_type_id);
    if (!entryType) return; // Skip if entry type not found

    const categoryName = entryType.category?.name || '';
    const entryTypeName = entryType.name || '';
    const value = item.value || 0;

    // Per pupil costs use the state's average daily membership
    const valueToProcess = mode === 'percentage'
      ? (value / stateTotal) * 100
      : value / (stateADM?.total || 1); // Prevent division by zero

    processExpenditureItem(categoryName, entryTypeName, valueToProcess, categoryTotals.state);
  });

  // Process district data
  if (districtExpenditures && districtExpenditures.length > 0) {
    districtExpenditures.forEach(item => {
      if (!item.entry_type.id) return;

      const entryType = item.entry_type;
      const categoryName = entryType?.category?.name || '';
      const entryTypeName = entryType?.name || '';
      const value = item.value || 0;
      const superCategoryId = entryType?.category?.super_category?.id ?? -1;

      // Per pupil, skip spending for a school level with no students
      if (mode === 'admCost') {
        if (SCHOOL_LEVEL_SUPER_CATEGORY_IDS.ELEMENTARY.includes(superCategoryId) && districtADM?.elementary === 0) return;
        if (SCHOOL_LEVEL_SUPER_CATEGORY_IDS.MIDDLE.includes(superCategoryId) && districtADM?.middle === 0) return;
        if (SCHOOL_LEVEL_SUPER_CATEGORY_IDS.HIGH.includes(superCategoryId) && districtADM?.high === 0) return;
      }

      const valueToProcess = mode === 'percentage'
        ? (value / districtTotal) * 100
        : value / (districtADM?.total || 1); // Prevent division by zero

      processExpenditureItem(categoryName, entryTypeName, valueToProcess, categoryTotals.district);
    });
  } else {
    // If no district data, use state data as placeholder
    categoryTotals.district = { ...categoryTotals.state };
  }

  const { district, state } = categoryTotals;
  const row = (name: string, pick: (totals: CategoryTotals) => number, parent?: string): CostCategory => ({
    name,
    ...(parent ? { isSubcategory: true } : {}),
    district: pick(district),
    state: pick(state),
    ...(parent ? { parent } : {}),
  });
  return [
    row('Instruction', totals => totals.instruction.total),
    row('Regular', totals => totals.instruction.regular, 'Instruction'),
    row('Special Ed.', totals => totals.instruction.special, 'Instruction'),
    row('Vocational', totals => totals.instruction.vocational, 'Instruction'),
    row('Other Programs', totals => totals.instruction.otherPrograms, 'Instruction'),

    row('Support Services', totals => totals.supportServices.total),
    row('Student', totals => totals.supportServices.student, 'Support Services'),
    row('Instructional Staff', totals => totals.supportServices.instructionalStaff, 'Support Services'),
    row('Facilities Mgmt', totals => totals.supportServices.building, 'Support Services'),
    row('Administration', totals => totals.supportServices.administration, 'Support Services'),
    row('Transportation', totals => totals.supportServices.transportation, 'Support Services'),
    row('Food Service', totals => totals.supportServices.foodService, 'Support Services'),
    row('Other', totals => totals.supportServices.other, 'Support Services'),

    row('Other', totals => totals.other.total),
    row('New Facilities', totals => totals.other.facilities, 'Other'),
    row('Debt Service', totals => totals.other.debtService, 'Other'),
    row('Miscellaneous', totals => totals.other.miscellaneous, 'Other'),
  ];
};

import { ProcessedReport, Expenditure, Revenue, BalanceSheet, FinancialItem } from '@/store/slices/financeSlice';
import { FinancialComparisonItem } from '@/components/ui/tables';
import { EXPENDITURE_CATEGORY_ORDER, REVENUE_CATEGORY_ORDER } from '@/utils/categoryOrdering';
import { FISCAL_YEAR, FISCAL_START_YEAR } from '@/utils/environment';
import { calculateInflationAdjustedAmount } from '@/utils/calculations';

/**
 * Normalizes category names based on specified rules for expenditure categories
 * 
 * @param categoryName - Raw category name to normalize
 * @returns Normalized category name
 */
export const normalizeExpenditureCategory = (categoryName: string): string => {
  // Normalize Elementary Expenditures categories
  if (categoryName.startsWith("General Fund - Elementary Expenditures") || 
      categoryName.startsWith("Special Revenue Fund - Elementary Expenditures")) {
    return "Elementary Expenditures";
  }
  
  // Normalize High School categories
  if (categoryName.endsWith("High School Expenditures")) {
    return "High School Expenditures";
  }
  
  // Normalize Middle/Junior High categories
  if (categoryName.endsWith("Middle/Junior High Expenditures")) {
    return "Middle/Junior High Expenditures";
  }
  
  // Normalize Other Financing Uses
  if (categoryName.endsWith("Other Financing Uses")) {
    return "Other Financing Uses";
  }
  
  // No normalization needed
  return categoryName;
};

// Define constants for the school level super category IDs.  Not ideal... but it works for now.
export const SCHOOL_LEVEL_SUPER_CATEGORY_IDS = {
  ELEMENTARY: [1, 6],
  MIDDLE: [2, 7],
  HIGH: [3, 8]
};


/**
 * Normalizes category names for revenue categories
 * 
 * @param categoryName - Raw category name to normalize
 * @returns Normalized category name
 */
const normalizeRevenueCategory = (categoryName: string): string => {
  // Revenue normalization rules can be added here as needed
  return categoryName || "Uncategorized";
};

/** Where a table lists a line: its category, sub category and name */
export type Line = { category: string; subCategory: string; name: string };

/**
 * A comparison table's rows: every line in either year, under the category, sub category and name the
 * table lists it by, with its total in each year ($0 in a year without it). Lines are matched by where
 * they're listed rather than by entry type, so a line renamed on the form (catastrophic aid became special
 * education aid) still meets its earlier years. With Adjust For Inflation, the comparison year's values are
 * restated in the current year's dollars.
 */
const comparisonRows = <T extends FinancialItem>(
  current: T[],
  comparison: T[],
  lineOf: (item: T) => Line | null,
  inflation: { adjustForInflation: boolean; currentYear: number; comparisonYear: number }
): FinancialComparisonItem[] => {
  const rows = new Map<string, Line & { currentValue: number; previousValue: number }>();
  const add = (items: T[], field: 'currentValue' | 'previousValue') => items.forEach(item => {
    const line = lineOf(item);
    if (!line) return;
    const key = `${line.category}|${line.subCategory}|${line.name}`;
    const row = rows.get(key) ?? { ...line, currentValue: 0, previousValue: 0 };
    row[field] += item.value;
    rows.set(key, row);
  });
  add(current, 'currentValue');
  add(comparison, 'previousValue');

  return [...rows.values()].map(row => {
    const previousValue = inflation.adjustForInflation && row.previousValue > 0
      ? calculateInflationAdjustedAmount(row.previousValue, inflation.comparisonYear, inflation.currentYear)
      : row.previousValue;
    const difference = row.currentValue - previousValue;
    return {
      name: row.name,
      subCategory: row.subCategory,
      category: row.category,
      currentValue: row.currentValue,
      previousValue,
      difference,
      percentChange: previousValue > 0 ? (difference / previousValue) * 100 : 0,
    };
  });
};

/**
 * The category, sub category and name an expenditure is listed under in the expenditure table:
 * categories normalized across funds, and food service under each school level's support services
 */
export const expenditureLine = (expenditure: Expenditure): Line => {
  let subCategory = expenditure.entry_type.category?.name || "Uncategorized";
  
  // Get the raw category and normalize it
  const rawCategory = expenditure.entry_type.category?.super_category?.name || "Uncategorized";
  let category = normalizeExpenditureCategory(rawCategory);
  let name = expenditure.entry_type.name;
  
  // Special handling for Food Service Operations
  if (rawCategory === "Food Service Operations") {
    // Check for high school food service
    if (name.includes("High")) {
      category = "High School Expenditures";
      name = "Food Service Operations";
      subCategory = "Support Services";
    } 
    // Check for middle/junior high food service
    else if (name.includes("Middle") || name.includes("Junior")) {
      category = "Middle/Junior High Expenditures";
      name = "Food Service Operations";
      subCategory = "Support Services";
    }
    // Check for elementary food service
    else if (name.includes("Elementary")) {
      category = "Elementary Expenditures";
      name = "Food Service Operations";
      subCategory = "Support Services";
    }
  }
  return { category, subCategory, name };
};

/** The category, sub category and name a revenue is listed under in the revenue table */
export const revenueLine = (revenue: Revenue): Line => ({
  category: normalizeRevenueCategory(revenue.entry_type.category?.super_category?.name || "Uncategorized"),
  subCategory: revenue.entry_type.category?.name || "Uncategorized",
  name: revenue.entry_type.name,
});

/** A balance sheet item's line, when it's in one of the super categories (1 and 3: assets; 2: liabilities) */
export const balanceSheetLine = (superCategoryIds: number[]) => (item: BalanceSheet): Line | null => {
  const superCategory = item.entry_type.category?.super_category;
  if (!superCategory || !superCategoryIds.includes(superCategory.id)) return null;
  return { category: superCategory.name || "Uncategorized", subCategory: item.entry_type.category?.name || "Uncategorized", name: item.entry_type.name };
};

/** Balance sheet rows by category, sub category, then the current year's value, largest first */
export const sortBalanceComparisonItems = (items: FinancialComparisonItem[]): FinancialComparisonItem[] => [...items].sort((a, b) =>
  a.category.localeCompare(b.category) || a.subCategory.localeCompare(b.subCategory) || b.currentValue - a.currentValue);

/**
 * A year's spending on instruction and on support services, as the trend chart on the Overall tab
 * counts them: food service counts as support services
 */
export const instructionAndSupport = (report: ProcessedReport): { instruction: number; support: number } => {
  let instruction = 0;
  let support = 0;
  report.expenditures.forEach(expenditure => {
    const subCategory = expenditure.entry_type.category?.name || "Uncategorized";
    const rawCategory = expenditure.entry_type.category?.super_category?.name || "Uncategorized";
    if (subCategory === "Instruction") {
      instruction += expenditure.value;
    } else if (subCategory === "Support Services" || rawCategory === "Food Service Operations") {
      support += expenditure.value;
    }
  });
  return { instruction, support };
};

/**
 * Processes expenditure data to prepare for comparison display
 * 
 * @param processedReport - Current year's processed financial report
 * @param comparisonYearProcessedReport - Comparison year's processed financial report
 * @param adjustForInflation - Whether to adjust previous year values for inflation
 * @param currentYear - The fiscal year of the current report
 * @param comparisonYear - The fiscal year of the comparison report
 * @returns Array of financial comparison items
 */
export const prepareDetailedExpenditureComparisonData = (
  processedReport: ProcessedReport | null,
  comparisonYearProcessedReport: ProcessedReport | null,
  adjustForInflation: boolean = false,
  currentYear: number = parseInt(FISCAL_YEAR),
  comparisonYear: number = parseInt(FISCAL_YEAR) - 1
): FinancialComparisonItem[] => {
  if (!processedReport || !comparisonYearProcessedReport) {
    return [];
  }
  return sortExpenditureComparisonItems(comparisonRows(
    processedReport.expenditures,
    comparisonYearProcessedReport.expenditures,
    expenditureLine,
    { adjustForInflation, currentYear, comparisonYear }
  ));
};

/**
 * Sort expenditure comparison items and mark first items in categories/subcategories
 * 
 * @param comparisonItems - Array of financial comparison items
 * @returns Sorted array with appropriate category/subcategory markers
 */
export const sortExpenditureComparisonItems = (
  comparisonItems: FinancialComparisonItem[]
): FinancialComparisonItem[] => {
  // Sort the rows by category, sub category, and then by current value (descending)
  const sortedRows = [...comparisonItems].sort((a, b) => {
    // Get the order for each category (default to 999 for any other category)
    const orderA = EXPENDITURE_CATEGORY_ORDER[a.category] || 999;
    const orderB = EXPENDITURE_CATEGORY_ORDER[b.category] || 999;
    
    // First sort by category order
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // If categories have the same order (e.g., both are "other" categories), sort alphabetically
    if (orderA === 999 && orderB === 999) {
      return a.category.localeCompare(b.category);
    }
    
    // Then sort by subcategory alphabetically
    if (a.subCategory !== b.subCategory) {
      return a.subCategory.localeCompare(b.subCategory);
    }
    
    // Finally sort by current value (cost) in descending order
    return b.currentValue - a.currentValue;
  });

  // Process rows to include category and sub category markers for visual grouping
  let currentSubCategory = '';
  let currentCategory = '';
  
  return sortedRows.map((row) => {
    // Create a new object to avoid mutating the original
    const newRow = { ...row };
    
    // If this is a new category, mark it
    if (row.category !== currentCategory) {
      currentCategory = row.category;
      newRow.isFirstInCategory = true;
      // When changing category, we're also in a new sub category
      currentSubCategory = row.subCategory;
      newRow.isFirstInSubCategory = true;
    } 
    // If just the sub category changed, mark it
    else if (row.subCategory !== currentSubCategory) {
      currentSubCategory = row.subCategory;
      newRow.isFirstInSubCategory = true;
    }
    
    return newRow;
  });
};

/**
 * Processes revenue data to prepare for comparison display
 * 
 * @param processedReport - Current year's processed financial report
 * @param comparisonYearProcessedReport - Comparison year's processed financial report
 * @param adjustForInflation - Whether to adjust previous year values for inflation
 * @param currentYear - The fiscal year of the current report
 * @param comparisonYear - The fiscal year of the comparison report
 * @returns Array of financial comparison items
 */
export const prepareDetailedRevenueComparisonData = (
  processedReport: ProcessedReport | null,
  comparisonYearProcessedReport: ProcessedReport | null,
  adjustForInflation: boolean = false,
  currentYear: number = parseInt(FISCAL_YEAR),
  comparisonYear: number = parseInt(FISCAL_YEAR) - 1
): FinancialComparisonItem[] => {
  if (!processedReport || !comparisonYearProcessedReport) {
    return [];
  }
  return sortRevenueComparisonItems(comparisonRows(
    processedReport.revenues,
    comparisonYearProcessedReport.revenues,
    revenueLine,
    { adjustForInflation, currentYear, comparisonYear }
  ));
};

/**
 * Sort revenue comparison items and calculate subcategory totals
 * 
 * @param comparisonItems - Array of financial comparison items
 * @returns Sorted array with appropriate category/subcategory markers
 */
export const sortRevenueComparisonItems = (
  comparisonItems: FinancialComparisonItem[]
): FinancialComparisonItem[] => {
  // Sort the rows by category, sub category, and then by current value (descending)
  const sortedRows = [...comparisonItems].sort((a, b) => {
    // Get the order for each category (default to 999 for any other category)
    const orderA = REVENUE_CATEGORY_ORDER[a.category] || 999;
    const orderB = REVENUE_CATEGORY_ORDER[b.category] || 999;
    
    // First sort by category order
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // If categories have the same order (e.g., both are "other" categories), sort alphabetically
    if (orderA === 999 && orderB === 999) {
      return a.category.localeCompare(b.category);
    }
    
    // For revenue categories, if same category, sort subcategories by value (descending)
    if (a.category === b.category) {
      // Group items by subcategory to calculate subcategory totals
      const subCategoryTotals = new Map<string, number>();
      
      // We need to calculate the total for each subcategory
      comparisonItems.forEach(item => {
        if (item.category === a.category) {
          const currentTotal = subCategoryTotals.get(item.subCategory) || 0;
          subCategoryTotals.set(item.subCategory, currentTotal + item.currentValue);
        }
      });
      
      const totalA = subCategoryTotals.get(a.subCategory) || 0;
      const totalB = subCategoryTotals.get(b.subCategory) || 0;
      
      // Sort by subcategory total (descending), then by subcategory name if totals are equal
      if (totalA !== totalB) {
        return totalB - totalA;
      }
      
      // If totals are equal, sort alphabetically
      return a.subCategory.localeCompare(b.subCategory);
    }
    
    // Finally sort by current value (amount) in descending order
    return b.currentValue - a.currentValue;
  });

  // Process rows to include category and sub category markers for visual grouping
  let currentSubCategory = '';
  let currentCategory = '';
  
  return sortedRows.map((row) => {
    // Create a new object to avoid mutating the original
    const newRow = { ...row };
    
    // If this is a new category, mark it
    if (row.category !== currentCategory) {
      currentCategory = row.category;
      newRow.isFirstInCategory = true;
      // When changing category, we're also in a new sub category
      currentSubCategory = row.subCategory;
      newRow.isFirstInSubCategory = true;
    } 
    // If just the sub category changed, mark it
    else if (row.subCategory !== currentSubCategory) {
      currentSubCategory = row.subCategory;
      newRow.isFirstInSubCategory = true;
    }
    
    return newRow;
  });
};

/**
 * Processes balance sheet asset data to prepare for comparison display (Super Categories 1 & 3)
 * 
 * @param processedReport - Current year's processed financial report
 * @param comparisonYearProcessedReport - Comparison year's processed financial report
 * @param adjustForInflation - Whether to adjust previous year values for inflation
 * @param currentYear - The fiscal year of the current report
 * @param comparisonYear - The fiscal year of the comparison report
 * @returns Array of financial comparison items
 */
export const prepareDetailedAssetsComparisonData = (
  processedReport: ProcessedReport | null,
  comparisonYearProcessedReport: ProcessedReport | null,
  adjustForInflation: boolean = false,
  currentYear: number = parseInt(FISCAL_YEAR),
  comparisonYear: number = parseInt(FISCAL_YEAR) - 1
): FinancialComparisonItem[] => {
  if (!processedReport) {
    return [];
  }

  return sortBalanceComparisonItems(comparisonRows(
    processedReport.balance_sheets,
    comparisonYearProcessedReport?.balance_sheets ?? [],
    balanceSheetLine([1, 3]),
    { adjustForInflation, currentYear, comparisonYear }
  ));
};

/**
 * Processes balance sheet liability data to prepare for comparison display (Super Category 2)
 * 
 * @param processedReport - Current year's processed financial report
 * @param comparisonYearProcessedReport - Comparison year's processed financial report
 * @param adjustForInflation - Whether to adjust previous year values for inflation
 * @param currentYear - The fiscal year of the current report
 * @param comparisonYear - The fiscal year of the comparison report
 * @returns Array of financial comparison items
 */
export const prepareDetailedLiabilitiesComparisonData = (
  processedReport: ProcessedReport | null,
  comparisonYearProcessedReport: ProcessedReport | null,
  adjustForInflation: boolean = false,
  currentYear: number = parseInt(FISCAL_YEAR),
  comparisonYear: number = parseInt(FISCAL_YEAR) - 1
): FinancialComparisonItem[] => {
  if (!processedReport) {
    return [];
  }

  return sortBalanceComparisonItems(comparisonRows(
    processedReport.balance_sheets,
    comparisonYearProcessedReport?.balance_sheets ?? [],
    balanceSheetLine([2]),
    { adjustForInflation, currentYear, comparisonYear }
  ));
}; 

export const formatFiscalYear = (year: string | number | null): string | null => {
  if (!year) return null;
  const numYear = typeof year === 'string' ? parseInt(year) : year;
  return `${(numYear - 1).toString().slice(-2)}/${numYear.toString().slice(-2)}`;
};

export const availableComparisonYears = () : string[] => {
  const years = [];    
  for (let year = parseInt(FISCAL_YEAR); year >= parseInt(FISCAL_START_YEAR); year--) {
    years.push(year.toString());
  }
  return years;
}
import { ProcessedReport, Expenditure, Revenue, BalanceSheet } from '@/store/slices/financeSlice';
import { FinancialComparisonItem } from '@/components/ui/tables';
import { EXPENDITURE_CATEGORY_ORDER, REVENUE_CATEGORY_ORDER } from '@/utils/categoryOrdering';
import { FISCAL_YEAR, FISCAL_START_YEAR } from '@/utils/environment';

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

/**
 * Normalizes category names for revenue categories
 * 
 * @param categoryName - Raw category name to normalize
 * @returns Normalized category name
 */
export const normalizeRevenueCategory = (categoryName: string): string => {
  // Revenue normalization rules can be added here as needed
  return categoryName || "Uncategorized";
};

/**
 * Helper interface for grouped financial items
 */
interface GroupedFinancialItem {
  name: string;
  subCategory: string;
  category: string;
  currentValue: number;
  previousValue: number;
  entries: Expenditure[] | Revenue[] | BalanceSheet[];
}

/**
 * Creates a map of comparison year items by entry type ID
 * 
 * @param comparisonYearProcessedReport - The processed comparison year report
 * @param itemType - The type of items to map ('expenditures' or 'revenues')
 * @returns A map of entry type IDs to arrays of items
 */
export const createComparisonYearItemsMap = <T extends Expenditure | Revenue | BalanceSheet>(
  comparisonYearProcessedReport: ProcessedReport | null,
  itemType: 'expenditures' | 'revenues' | 'balance_sheets'
): Map<number, T[]> => {
  if (!comparisonYearProcessedReport) {
    return new Map<number, T[]>();
  }

  const comparisonYearItemsMap = new Map<number, T[]>();
  comparisonYearProcessedReport[itemType].forEach(item => {
    const entryTypeId = item.entry_type.id;
    if (!comparisonYearItemsMap.has(entryTypeId)) {
      comparisonYearItemsMap.set(entryTypeId, []);
    }
    comparisonYearItemsMap.get(entryTypeId)?.push(item as T);
  });

  return comparisonYearItemsMap;
};

/**
 * Processes expenditure data to prepare for comparison display
 * 
 * @param processedReport - Current year's processed financial report
 * @param comparisonYearProcessedReport - Comparison year's processed financial report
 * @returns Array of financial comparison items
 */
export const prepareDetailedExpenditureComparisonData = (
  processedReport: ProcessedReport | null,
  comparisonYearProcessedReport: ProcessedReport | null
): FinancialComparisonItem[] => {
  if (!processedReport || !comparisonYearProcessedReport) {
    return [];
  }

  // Create a lookup map for comparison year expenditures by entry type ID
  const comparisonYearExpendituresMap = createComparisonYearItemsMap<Expenditure>(
    comparisonYearProcessedReport,
    'expenditures'
  );

  // Group expenditures by a unique key composed of category, subCategory, and name
  const expenditureGroups = new Map<string, GroupedFinancialItem>();

  // Process and group current year expenditures
  processedReport.expenditures.forEach(expenditure => {
    let subCategory = expenditure.entry_type.category?.name || "Uncategorized";
    
    // Get the raw category and normalize it
    let rawCategory = expenditure.entry_type.category?.super_category?.name || "Uncategorized";
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
    
    // Create a unique key for this combination
    const groupKey = `${category}|${subCategory}|${name}`;
    
    if (!expenditureGroups.has(groupKey)) {
      expenditureGroups.set(groupKey, {
        name,
        subCategory,
        category,
        currentValue: 0,
        previousValue: 0,
        entries: []
      });
    }
    
    const group = expenditureGroups.get(groupKey)!;
    group.currentValue += expenditure.value;
    group.entries.push(expenditure);
  });
  
  // Calculate comparison year values for each group
  for (const group of expenditureGroups.values()) {
    // Get the entry type IDs that are part of this group
    const entryTypeIds = new Set(group.entries.map(entry => entry.entry_type.id));
    
    // Sum the comparison year values for these entry types
    for (const entryTypeId of entryTypeIds) {
      const comparisonYearExpenditures = comparisonYearExpendituresMap.get(entryTypeId) || [];
      group.previousValue += comparisonYearExpenditures.reduce((sum, exp) => sum + exp.value, 0);
    }
  }
  
  // Convert grouped data to comparison items
  const comparisonItems: FinancialComparisonItem[] = Array.from(expenditureGroups.values()).map(group => {
    const difference = group.currentValue - group.previousValue;
    const percentChange = group.previousValue > 0 ? (difference / group.previousValue) * 100 : 0;
    
    return {
      name: group.name,
      subCategory: group.subCategory,
      category: group.category,
      currentValue: group.currentValue,
      previousValue: group.previousValue,
      difference,
      percentChange
    };
  });

  return sortExpenditureComparisonItems(comparisonItems);
};

/**
 * Sort expenditure comparison items and mark first items in categories/subcategories
 * 
 * @param comparisonItems - Array of financial comparison items
 * @returns Sorted array with appropriate category/subcategory markers
 */
const sortExpenditureComparisonItems = (
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
 * @returns Array of financial comparison items
 */
export const prepareDetailedRevenueComparisonData = (
  processedReport: ProcessedReport | null,
  comparisonYearProcessedReport: ProcessedReport | null
): FinancialComparisonItem[] => {
  if (!processedReport || !comparisonYearProcessedReport) {
    return [];
  }

  // Create a lookup map for comparison year revenues by entry type ID
  const comparisonYearRevenuesMap = createComparisonYearItemsMap<Revenue>(
    comparisonYearProcessedReport,
    'revenues'
  );

  // Group revenues by a unique key composed of category, subCategory, and name
  const revenueGroups = new Map<string, GroupedFinancialItem>();

  // Process and group current year revenues
  processedReport.revenues.forEach(revenue => {
    const subCategory = revenue.entry_type.category?.name || "Uncategorized";
    
    // Get the category and normalize it
    const rawCategory = revenue.entry_type.category?.super_category?.name || "Uncategorized";
    const category = normalizeRevenueCategory(rawCategory);
    const name = revenue.entry_type.name;
    
    // Create a unique key for this combination
    const groupKey = `${category}|${subCategory}|${name}`;
    
    if (!revenueGroups.has(groupKey)) {
      revenueGroups.set(groupKey, {
        name,
        subCategory,
        category,
        currentValue: 0,
        previousValue: 0,
        entries: []
      });
    }
    
    const group = revenueGroups.get(groupKey)!;
    group.currentValue += revenue.value;
    group.entries.push(revenue);
  });
  
  // Calculate comparison year values for each group
  for (const group of revenueGroups.values()) {
    // Get the entry type IDs that are part of this group
    const entryTypeIds = new Set(group.entries.map(entry => entry.entry_type.id));
    
    // Sum the comparison year values for these entry types
    for (const entryTypeId of entryTypeIds) {
      const comparisonYearRevenues = comparisonYearRevenuesMap.get(entryTypeId) || [];
      group.previousValue += comparisonYearRevenues.reduce((sum, rev) => sum + rev.value, 0);
    }
  }
  
  // Convert grouped data to comparison items
  const comparisonItems: FinancialComparisonItem[] = Array.from(revenueGroups.values()).map(group => {
    const difference = group.currentValue - group.previousValue;
    const percentChange = group.previousValue > 0 ? (difference / group.previousValue) * 100 : 0;
    
    return {
      name: group.name,
      subCategory: group.subCategory,
      category: group.category,
      currentValue: group.currentValue,
      previousValue: group.previousValue,
      difference,
      percentChange
    };
  });

  return sortRevenueComparisonItems(comparisonItems);
};

/**
 * Sort revenue comparison items and calculate subcategory totals
 * 
 * @param comparisonItems - Array of financial comparison items
 * @returns Sorted array with appropriate category/subcategory markers
 */
const sortRevenueComparisonItems = (
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
 * @returns Array of financial comparison items
 */
export const prepareDetailedAssetsComparisonData = (
  processedReport: ProcessedReport | null,
  comparisonYearProcessedReport: ProcessedReport | null
): FinancialComparisonItem[] => {
  if (!processedReport) {
    return [];
  }

  // Create a map to hold processed asset items
  const assetGroups = new Map<string, GroupedFinancialItem>();

  // Process current year assets (super categories 1 & 3)
  processedReport.balance_sheets.forEach(asset => {
    // Only include items from super categories 1 & 3 (Assets)
    const superCategoryId = asset.entry_type.category?.super_category?.id;
    if (superCategoryId !== 1 && superCategoryId !== 3) {
      return;
    }

    const subCategory = asset.entry_type.category?.name || "Uncategorized";
    const rawCategory = asset.entry_type.category?.super_category?.name || "Uncategorized";
    const category = rawCategory; // No normalization needed yet
    const name = asset.entry_type.name;
    
    // Create a unique key for this combination
    const groupKey = `${category}|${subCategory}|${name}`;
    
    if (!assetGroups.has(groupKey)) {
      assetGroups.set(groupKey, {
        name,
        subCategory,
        category,
        currentValue: 0,
        previousValue: 0,
        entries: []
      });
    }
    
    const group = assetGroups.get(groupKey)!;
    group.currentValue += asset.value;
    group.entries.push(asset);
  });

  // If we have a comparison year processed report, use it
  if (comparisonYearProcessedReport) {
    // Create a lookup map for comparison year balance sheet items by entry type ID
    const comparisonYearBalanceSheetMap = createComparisonYearItemsMap<BalanceSheet>(
      comparisonYearProcessedReport,
      'balance_sheets'
    );
    
    // Calculate comparison year values for each group
    for (const group of assetGroups.values()) {
      // Get the entry type IDs that are part of this group
      const entryTypeIds = new Set(group.entries.map(entry => entry.entry_type.id));
      
      // Sum the comparison year values for these entry types
      for (const entryTypeId of entryTypeIds) {
        const comparisonYearAssets = comparisonYearBalanceSheetMap.get(entryTypeId) || [];
        group.previousValue += comparisonYearAssets.reduce((sum, asset) => sum + asset.value, 0);
      }
    }
  }
  
  // Convert grouped data to comparison items
  const comparisonItems: FinancialComparisonItem[] = Array.from(assetGroups.values()).map(group => {
    const difference = group.currentValue - group.previousValue;
    const percentChange = group.previousValue > 0 ? (difference / group.previousValue) * 100 : 0;
    
    return {
      name: group.name,
      subCategory: group.subCategory,
      category: group.category,
      currentValue: group.currentValue,
      previousValue: group.previousValue,
      difference,
      percentChange
    };
  });

  return comparisonItems.sort((a, b) => {
    // First sort by category
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    
    // Then by subcategory
    if (a.subCategory !== b.subCategory) {
      return a.subCategory.localeCompare(b.subCategory);
    }
    
    // Finally by current value (descending)
    return b.currentValue - a.currentValue;
  });
};

/**
 * Processes balance sheet liability data to prepare for comparison display (Super Category 2)
 * 
 * @param processedReport - Current year's processed financial report
 * @param comparisonYearProcessedReport - Comparison year's processed financial report
 * @returns Array of financial comparison items
 */
export const prepareDetailedLiabilitiesComparisonData = (
  processedReport: ProcessedReport | null,
  comparisonYearProcessedReport: ProcessedReport | null
): FinancialComparisonItem[] => {
  if (!processedReport) {
    return [];
  }

  // Group balance sheet items by a unique key composed of category, subCategory, and name
  const liabilityGroups = new Map<string, GroupedFinancialItem>();

  // Process and group current year liabilities (super category 2)
  processedReport.balance_sheets.forEach(liability => {
    // Only include items from super category 2 (Liabilities)
    const superCategoryId = liability.entry_type.category?.super_category?.id;
    if (superCategoryId !== 2) {
      return;
    }

    const subCategory = liability.entry_type.category?.name || "Uncategorized";
    const rawCategory = liability.entry_type.category?.super_category?.name || "Uncategorized";
    const category = rawCategory; // No normalization needed yet
    const name = liability.entry_type.name;
    
    // Create a unique key for this combination
    const groupKey = `${category}|${subCategory}|${name}`;
    
    if (!liabilityGroups.has(groupKey)) {
      liabilityGroups.set(groupKey, {
        name,
        subCategory,
        category,
        currentValue: 0,
        previousValue: 0,
        entries: []
      });
    }
    
    const group = liabilityGroups.get(groupKey)!;
    group.currentValue += liability.value;
    group.entries.push(liability);
  });
  
  // If we have a comparison year processed report, use it
  if (comparisonYearProcessedReport) {
    // Create a lookup map for comparison year balance sheet items by entry type ID
    const comparisonYearBalanceSheetMap = createComparisonYearItemsMap<BalanceSheet>(
      comparisonYearProcessedReport,
      'balance_sheets'
    );
    
    // Calculate comparison year values for each group
    for (const group of liabilityGroups.values()) {
      // Get the entry type IDs that are part of this group
      const entryTypeIds = new Set(group.entries.map(entry => entry.entry_type.id));
      
      // Sum the comparison year values for these entry types
      for (const entryTypeId of entryTypeIds) {
        const comparisonYearLiabilities = comparisonYearBalanceSheetMap.get(entryTypeId) || [];
        group.previousValue += comparisonYearLiabilities.reduce((sum, liability) => sum + liability.value, 0);
      }
    }
  }
  
  // Convert grouped data to comparison items
  const comparisonItems: FinancialComparisonItem[] = Array.from(liabilityGroups.values()).map(group => {
    const difference = group.currentValue - group.previousValue;
    const percentChange = group.previousValue > 0 ? (difference / group.previousValue) * 100 : 0;
    
    return {
      name: group.name,
      subCategory: group.subCategory,
      category: group.category,
      currentValue: group.currentValue,
      previousValue: group.previousValue,
      difference,
      percentChange
    };
  });

  return comparisonItems.sort((a, b) => {
    // First sort by category
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    
    // Then by subcategory
    if (a.subCategory !== b.subCategory) {
      return a.subCategory.localeCompare(b.subCategory);
    }
    
    // Finally by current value (descending)
    return b.currentValue - a.currentValue;
  });
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
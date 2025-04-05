/**
 * Utility functions for consistent category ordering across the application
 */

/**
 * Interface for category ordering maps
 */
export interface CategoryOrderMap {
  [category: string]: number;
}

/**
 * Category ordering for revenue data
 */
export const REVENUE_CATEGORY_ORDER: CategoryOrderMap = {
  "Revenue from Federal Sources": 1,
  "Revenue from State Sources": 2,
  "Revenue from Local Sources": 3,
  "Other Financing Sources": 4
};

/**
 * Category ordering for expenditure data
 */
export const EXPENDITURE_CATEGORY_ORDER: CategoryOrderMap = {
  "High School Expenditures": 1,
  "Middle/Junior High Expenditures": 2,
  "Elementary Expenditures": 3,
  "Other Financing Uses": 4
};

/**
 * Constants for category detection and prioritization
 */
const REVENUE_KEYWORDS = ["Revenue", "Financing Sources"];
const EXPENDITURE_KEYWORDS = ["Expenditures", "Financing Uses"];

/**
 * Default priority for categories not explicitly mapped
 */
const DEFAULT_CATEGORY_PRIORITY = 999;

/**
 * Determines if a category is a revenue category
 * @param category - The category string to check
 * @returns True if the category is a revenue category
 */
export const isRevenueCategory = (category: string): boolean => {
  return REVENUE_KEYWORDS.some(keyword => category.includes(keyword));
};

/**
 * Determines if a category is an expenditure category
 * @param category - The category string to check
 * @returns True if the category is an expenditure category
 */
export const isExpenditureCategory = (category: string): boolean => {
  return EXPENDITURE_KEYWORDS.some(keyword => category.includes(keyword));
};

/**
 * Gets the appropriate category order object based on category type
 * @param category - The category string
 * @returns The appropriate category order map
 */
export const getCategoryOrder = (category: string): CategoryOrderMap => {
  return isRevenueCategory(category) ? REVENUE_CATEGORY_ORDER : EXPENDITURE_CATEGORY_ORDER;
};

/**
 * Gets the priority value for a category
 * @param category - The category string
 * @param orderMap - The order map to use
 * @returns The priority value (lower = higher priority)
 */
export const getCategoryPriority = (
  category: string, 
  orderMap: CategoryOrderMap = getCategoryOrder(category)
): number => {
  return orderMap[category] || DEFAULT_CATEGORY_PRIORITY;
};

/**
 * Compare function for sorting categories in the correct order
 * @param a - First category string
 * @param b - Second category string
 * @returns Comparison result for sorting
 */
export const compareCategoryOrder = (a: string, b: string): number => {
  // Determine if we're dealing with revenue categories
  const isRevenue = isRevenueCategory(a) || isRevenueCategory(b);
  
  // Choose the appropriate category order
  const categoryOrder = isRevenue ? REVENUE_CATEGORY_ORDER : EXPENDITURE_CATEGORY_ORDER;
  
  const orderA = getCategoryPriority(a, categoryOrder);
  const orderB = getCategoryPriority(b, categoryOrder);
  
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  
  // If categories have the same order (e.g., both are "other" categories), sort alphabetically
  if (orderA === DEFAULT_CATEGORY_PRIORITY && orderB === DEFAULT_CATEGORY_PRIORITY) {
    return a.localeCompare(b);
  }
  
  return 0;
}; 
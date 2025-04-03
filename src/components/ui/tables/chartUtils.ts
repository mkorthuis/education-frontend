import { ChartItem } from './GenericChart';

/**
 * Converts raw numeric data into ChartItem array with calculated percentages
 * @param data Object with names as keys and values as numeric values
 * @returns Array of ChartItem objects with calculated percentages
 */
export const prepareChartData = (data: Record<string, number>): ChartItem[] => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  return Object.entries(data)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending
};

/**
 * Formats a value as currency
 * @param value Numeric value to format
 * @param currency Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Formats a value as a percentage
 * @param value Numeric value to format (0-100)
 * @param fractionDigits Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, fractionDigits = 1): string => {
  return `${value.toFixed(fractionDigits)}%`;
};

/**
 * Groups smaller items into an "Other" category
 * @param items Array of ChartItems
 * @param threshold Minimum percentage to keep as a separate item
 * @returns New array with small items grouped into "Other"
 */
export const groupSmallItems = (items: ChartItem[], threshold = 3): ChartItem[] => {
  const mainItems = items.filter(item => item.percentage >= threshold);
  const smallItems = items.filter(item => item.percentage < threshold);
  
  if (smallItems.length === 0) return items;
  
  const otherValue = smallItems.reduce((sum, item) => sum + item.value, 0);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  
  return [
    ...mainItems,
    {
      name: 'Other',
      value: otherValue,
      percentage: (otherValue / total) * 100
    }
  ].sort((a, b) => b.value - a.value);
};

/**
 * Applies custom colors to chart items
 * @param items Array of ChartItems
 * @param colorMap Object mapping item names to hex color codes
 * @returns New array with color property set on matching items
 */
export const applyCustomColors = (
  items: ChartItem[], 
  colorMap: Record<string, string>
): ChartItem[] => {
  return items.map(item => ({
    ...item,
    color: colorMap[item.name] || undefined
  }));
};

/**
 * Calculates the total value from an array of ChartItems
 * @param items Array of ChartItems
 * @returns Total numeric value
 */
export const calculateTotal = (items: ChartItem[]): number => {
  return items.reduce((sum, item) => sum + item.value, 0);
}; 
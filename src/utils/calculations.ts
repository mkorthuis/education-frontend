import { School } from '@/store/slices/locationSlice';

/**
 * Calculates the total enrollment for a school
 */
export const calculateTotalEnrollment = (school: School): number => {
  if (!school.enrollment) return 0;
  
  return Object.values(school.enrollment).reduce(
    (sum: number, count: any) => sum + Number(count), 0
  );
}; 

export const calculateInflationAdjustedAmount = (
  amount: number, 
  fromYear: number, 
  toYear: number = 2025
): number => {
  // Validate inputs
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  
  if (!Number.isInteger(fromYear) || fromYear < 2000 || fromYear > 2025) {
    throw new Error('fromYear must be an integer between 2000 and 2025');
  }
  
  if (!Number.isInteger(toYear) || toYear < 2000 || toYear > 2025) {
    throw new Error('toYear must be an integer between 2000 and 2025');
  }
  
  // Define the type for our CPI data object
  type CPIDataType = {
    [year: number]: number;
  };
  
  // CPI data (1982-84 = 100) based on annual averages
  const cpiData: CPIDataType = {
    2000: 172.2,
    2001: 177.1,
    2002: 179.9,
    2003: 184.0,
    2004: 188.9,
    2005: 195.3,
    2006: 201.6,
    2007: 207.3,
    2008: 215.3,
    2009: 214.5,
    2010: 218.1,
    2011: 224.9,
    2012: 229.6,
    2013: 233.0,
    2014: 236.7,
    2015: 237.0,
    2016: 240.0,
    2017: 245.1,
    2018: 251.1,
    2019: 255.7,
    2020: 258.8,
    2021: 271.0,
    2022: 292.7,
    2023: 304.7,
    2024: 314.4,
    2025: 319.8  // March 2025 CPI value (most recent)
  };
  
  // If the years are the same, return the original amount
  if (fromYear === toYear) {
    return amount;
  }
  
  // Calculate the inflation-adjusted amount
  // Formula: originalAmount * (targetCPI / originalCPI)
  const adjustedAmount: number = amount * (cpiData[toYear] / cpiData[fromYear]);
  
  // Round to 2 decimal places for currency
  return Math.round(adjustedAmount * 100) / 100;
}
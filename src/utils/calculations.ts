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

// CPI data (1982-84 = 100) based on annual averages: BLS CPI-U, U.S. city average,
// all items, not seasonally adjusted (series CUUR0000SA0), rounded to one decimal.
// Add each new year when BLS publishes its annual average (mid-January of the following
// year); years outside the table use the nearest year's CPI.
const CPI_BY_YEAR: Readonly<Record<number, number>> = {
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
  2024: 313.7,
  2025: 321.9, // BLS annual average from 11 months (October 2025 was not collected)
  2026: 333.5  // ESTIMATE from Jan-Sep 2026; replace with the BLS annual average in January 2027
};

const CPI_YEARS = Object.keys(CPI_BY_YEAR).map(Number);
const FIRST_CPI_YEAR = Math.min(...CPI_YEARS);
const LAST_CPI_YEAR = Math.max(...CPI_YEARS);

// Years already reported as missing from the CPI table, so each is warned about once
const warnedCpiYears = new Set<number>();

/**
 * CPI for a year, using the nearest year in the table when the year is outside it
 * (e.g. data for a year whose CPI hasn't been added yet) instead of failing.
 */
const getCpiForYear = (year: number): number => {
  const nearestYear = Math.min(Math.max(year, FIRST_CPI_YEAR), LAST_CPI_YEAR);
  if (nearestYear !== year && !warnedCpiYears.has(year)) {
    warnedCpiYears.add(year);
    console.warn(`No CPI value for ${year}; using ${nearestYear}. Add ${year} to CPI_BY_YEAR in src/utils/calculations.ts.`);
  }
  return CPI_BY_YEAR[nearestYear];
};

export const calculateInflationAdjustedAmount = (
  amount: number,
  fromYear: number,
  toYear: number = LAST_CPI_YEAR
): number => {
  // Validate inputs
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }

  if (!Number.isInteger(fromYear)) {
    throw new Error('fromYear must be an integer');
  }

  if (!Number.isInteger(toYear)) {
    throw new Error('toYear must be an integer');
  }

  // If the years are the same, return the original amount
  if (fromYear === toYear) {
    return amount;
  }

  // Calculate the inflation-adjusted amount
  // Formula: originalAmount * (targetCPI / originalCPI)
  const adjustedAmount: number = amount * (getCpiForYear(toYear) / getCpiForYear(fromYear));

  // Round to 2 decimal places for currency
  return Math.round(adjustedAmount * 100) / 100;
}
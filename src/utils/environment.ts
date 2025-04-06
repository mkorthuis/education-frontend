/**
 * Environment variables and configuration
 * 
 * This file centralizes access to environment variables for better TypeScript support
 * and easier management across the application.
 */

/**
 * Current fiscal year from environment configuration
 * Used for default financial report fetching
 */
export const FISCAL_YEAR = import.meta.env.VITE_FISCAL_YEAR || '2024';

/**
 * Starting fiscal year for historical data
 * Used for comparison year ranges
 */
export const FISCAL_START_YEAR = import.meta.env.VITE_FISCAL_START_YEAR || '2010';

/**
 * API base URL from environment configuration
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

/**
 * Whether the application is running in development mode
 */
export const IS_DEV = import.meta.env.DEV; 
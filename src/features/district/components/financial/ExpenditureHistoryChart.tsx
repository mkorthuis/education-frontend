import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { 
  selectProcessedComparisonReportByYear,
  selectProcessedReport
} from '@/store/slices/financeSlice';
import { Typography, Paper, Box, CircularProgress } from '@mui/material';
import { normalizeExpenditureCategory } from '../../utils/financialDataProcessing';
import { formatCompactNumber } from '@/utils/formatting';
import { EXPENDITURE_CATEGORY_ORDER } from '@/utils/categoryOrdering';
// Import Recharts components instead of MUI X Charts
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

interface ExpenditureChartProps {
  isLoading?: boolean;
}

// Define new category structure
type SchoolLevel = 'High School' | 'Middle/Junior High' | 'Elementary';
type Category = 'Instructional' | 'Support Services';

// Define types for expenditure data
interface ExpenditureEntry {
  entry_type: { 
    name: string; 
    category?: { 
      name?: string; 
      super_category?: { 
        name?: string; 
        id?: string | number;
      }; 
    }; 
  }; 
  value: number;
}

interface YearReport {
  expenditures: ExpenditureEntry[];
}

/**
 * ExpenditureHistoryChart displays cumulative expenditure changes
 * for the last 5 years, grouped by major categories.
 */
const ExpenditureHistoryChart: React.FC<ExpenditureChartProps> = ({ isLoading = false }) => {
  // Hardcoded years for consistency
  const yearsList = ['2019', '2020', '2021', '2022', '2023'];
  const previousYearValue = '2018';
  
  // Get current year data once
  const currentYearReport = useAppSelector(selectProcessedReport);
  
  // Get all state data at once at the component level
  const state = useAppSelector(state => state);
  
  // Fetch all the necessary year reports at once
  const yearReports: YearReport[] = useMemo(() => {
    // Return empty array if we can't determine the current year
    if (!currentYearReport?.expenditures[0]?.entry_type?.category?.super_category?.id) {
      return [];
    }
    
    // Create allYears inside the useMemo to avoid dependency issues
    const allYearsForReports = [previousYearValue, ...yearsList];
    
    // Process all data at once using the state we already got
    return allYearsForReports.map(year => 
      selectProcessedComparisonReportByYear(state, year)
    ).filter(Boolean) as YearReport[]; // Filter out any nulls
  }, [state, currentYearReport, previousYearValue, yearsList]);
  
  // Check if we have enough data
  const hasData = yearReports.length > 0;
  
  // If no data, return early
  if (!hasData) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Expenditures</Typography>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Typography>Not enough historical data available to display this chart.</Typography>
        )}
      </Paper>
    );
  }

  // Process and aggregate expenditure data by category and subcategory for each year
  const chartData = useMemo(() => {
    // First group by year, then by category, then by school level, then by subcategory
    const groupedData: Record<string, Record<Category | 'Other', Record<SchoolLevel | 'Other', number>>> = {};
    
    // Initialize the structure for each year including previous year
    const allYearsForChart = [previousYearValue, ...yearsList];
    allYearsForChart.forEach(year => {
      groupedData[year] = {
        'Instructional': {
          'High School': 0,
          'Middle/Junior High': 0,
          'Elementary': 0,
          'Other': 0
        },
        'Support Services': {
          'High School': 0,
          'Middle/Junior High': 0,
          'Elementary': 0,
          'Other': 0
        },
        'Other': {
          'High School': 0,
          'Middle/Junior High': 0,
          'Elementary': 0,
          'Other': 0
        }
      };
    });
    
    // Process each year's data
    yearReports.forEach((report, index) => {
      const year = allYearsForChart[index];
      
      if (!report) return;
      
      // Process expenditures and map them to the new category structure
      report.expenditures.forEach((expenditure: ExpenditureEntry) => {
        let subCategory = expenditure.entry_type.category?.name || "Uncategorized";
        let name = expenditure.entry_type.name;
        let rawCategory = expenditure.entry_type.category?.super_category?.name || "Uncategorized";
        
        // Map to main category (Instructional, Support Services, Other)
        let mainCategory: Category | 'Other' = 'Other';
        let schoolLevel: SchoolLevel | 'Other' = 'Other';
        
        // Determine the main category
        if (subCategory.includes('Instruction') || name.includes('Instruction') || 
            rawCategory.includes('Instruction') || subCategory.includes('Teacher') || 
            name.includes('Teacher') || subCategory.includes('Teaching')) {
          mainCategory = 'Instructional';
        } else if (subCategory.includes('Support') || name.includes('Support') || 
                  rawCategory.includes('Support') || subCategory.includes('Services') || 
                  name.includes('Services') || rawCategory.includes('Services')) {
          mainCategory = 'Support Services';
        }
        
        // Determine school level
        if (name.includes('High School') || rawCategory.includes('High School') || 
            name.includes('High') || subCategory.includes('High School')) {
          schoolLevel = 'High School';
        } else if (name.includes('Middle') || name.includes('Junior High') || 
                  rawCategory.includes('Middle') || rawCategory.includes('Junior High') ||
                  subCategory.includes('Middle') || subCategory.includes('Junior High')) {
          schoolLevel = 'Middle/Junior High';
        } else if (name.includes('Elementary') || rawCategory.includes('Elementary') ||
                  subCategory.includes('Elementary')) {
          schoolLevel = 'Elementary';
        }
        
        // Add the expenditure value to the appropriate category and school level
        groupedData[year][mainCategory][schoolLevel] += expenditure.value;
      });
    });
    
    // Combine all years in order, with previous year first
    const orderedYears = allYearsForChart;
    
    // Calculate absolute values for each category, school level, and year
    const absoluteValues: Record<Category | 'Other', Record<SchoolLevel | 'Other', Record<string, number>>> = {
      'Instructional': {
        'High School': {},
        'Middle/Junior High': {},
        'Elementary': {},
        'Other': {}
      },
      'Support Services': {
        'High School': {},
        'Middle/Junior High': {},
        'Elementary': {},
        'Other': {}
      },
      'Other': {
        'High School': {},
        'Middle/Junior High': {},
        'Elementary': {},
        'Other': {}
      }
    };
    
    // Initialize all years to 0
    orderedYears.forEach(year => {
      Object.keys(absoluteValues).forEach(category => {
        Object.keys(absoluteValues[category as Category | 'Other']).forEach(schoolLevel => {
          absoluteValues[category as Category | 'Other'][schoolLevel as SchoolLevel | 'Other'][year] = 0;
        });
      });
    });
    
    // Fill in absolute values from grouped data
    orderedYears.forEach(year => {
      Object.keys(groupedData[year]).forEach(category => {
        Object.keys(groupedData[year][category as Category | 'Other']).forEach(schoolLevel => {
          const value = groupedData[year][category as Category | 'Other'][schoolLevel as SchoolLevel | 'Other'];
          absoluteValues[category as Category | 'Other'][schoolLevel as SchoolLevel | 'Other'][year] = value;
        });
      });
    });
    
    // Format year labels as fiscal years (YY/YY)
    const formattedYears = yearsList.map(year => {
      const currentYearPart = year.slice(-2);
      const nextYearPart = (parseInt(year) + 1).toString().slice(-2);
      return `${currentYearPart}/${nextYearPart}`;
    });
    
    // Calculate year-over-year changes
    const yearlyData: any[] = [];
    
    // For each display year (excluding the previous year), create a data point for stacked bar chart
    formattedYears.forEach((fiscalYear, index) => {
      const yearData: any = { fiscalYear };
      const currentYear = yearsList[index];
      
      // Calculate changes for each main category
      const mainCategories: (Category | 'Other')[] = ['Instructional', 'Support Services', 'Other'];
      
      mainCategories.forEach(category => {
        // Create a category object to hold stacked school level data
        const categoryData: any = {};
        let categoryTotal = 0;
        
        // Process each school level within this category
        const schoolLevels: SchoolLevel[] = ['High School', 'Middle/Junior High', 'Elementary'];
        
        // Process the main school levels first
        schoolLevels.forEach(schoolLevel => {
          // Get the baseline value (previous year - 2018)
          const baselineValue = absoluteValues[category][schoolLevel][previousYearValue];
          let cumulativeChange = 0;
          
          // For the first display year (2019), calculate change from baseline (2018)
          if (index === 0) {
            const yearValue = absoluteValues[category][schoolLevel][currentYear];
            cumulativeChange = yearValue - baselineValue;
          } else {
            // For subsequent years, first get change from baseline to first year
            const firstYearValue = absoluteValues[category][schoolLevel][yearsList[0]];
            const firstYearChange = firstYearValue - baselineValue;
            
            // Then add changes for all years up to the current year
            cumulativeChange = firstYearChange;
            for (let i = 1; i <= index; i++) {
              const currentYearValue = absoluteValues[category][schoolLevel][yearsList[i]];
              const previousYearValue = absoluteValues[category][schoolLevel][yearsList[i - 1]];
              cumulativeChange += (currentYearValue - previousYearValue);
            }
          }
          
          // Create a key for this school level within the category
          const key = schoolLevel.replace(/\s+/g, '_');
          
          // Convert to millions for better display
          categoryData[key] = cumulativeChange / 1000000;
          
          // Store the raw value for tooltip use
          categoryData[`${key}_raw`] = absoluteValues[category][schoolLevel][currentYear];
          
          // Add to category total
          categoryTotal += cumulativeChange;
        });
        
        // Store the total for this category
        categoryData.total = categoryTotal / 1000000;
        
        // Add this category data to the year data
        const categoryKey = category.replace(/\s+/g, '_');
        yearData[categoryKey] = categoryData;
      });
      
      yearlyData.push(yearData);
    });
    
    return {
      data: yearlyData,
      mainCategories: ['Instructional', 'Support Services', 'Other'],
      schoolLevels: ['High School', 'Middle/Junior High', 'Elementary']
    };
  }, [yearReports, yearsList, previousYearValue]);

  if (isLoading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Expenditures</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // If we don't have enough data, show a message
  if (chartData.data.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Expenditures</Typography>
        <Typography>Not enough historical data available to display this chart.</Typography>
      </Paper>
    );
  }

  // Color map with shades for school levels
  const schoolLevelColors = {
    'High_School': '#1a73e8',       // Dark blue
    'Middle/Junior_High': '#4285f4', // Medium blue
    'Elementary': '#8ab4f8',         // Light blue
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => {
            // Get category and school level from the entry name
            const nameParts = entry.name.split('_');
            if (nameParts.length < 2) return null;
            
            const category = entry.dataKey.startsWith('Instructional') ? 'Instructional' : 
                            entry.dataKey.startsWith('Support_Services') ? 'Support Services' : 'Other';
            const schoolLevel = nameParts[nameParts.length - 1].replace(/_/g, ' ');
            
            // Skip items with value 0
            if (entry.value === 0) return null;
            
            // Format the value
            const formattedValue = entry.value >= 0 
              ? `+${formatCompactNumber(entry.value * 1000000)}`
              : formatCompactNumber(entry.value * 1000000);
              
            return (
              <p key={`item-${index}`} style={{ margin: '5px 0', color: entry.color }}>
                {`${category} - ${schoolLevel}`}: {formattedValue}
              </p>
            );
          })}
        </div>
      );
    }
    
    return null;
  };
  
  // Convert nested data structure for Recharts
  const flattenedData = chartData.data.map(yearData => {
    const flatYear: any = { fiscalYear: yearData.fiscalYear };
    
    // Process each main category
    chartData.mainCategories.forEach((category) => {
      const categoryKey = category.replace(/\s+/g, '_');
      const categoryData = yearData[categoryKey];
      
      if (categoryData) {
        // For each school level in this category, create a separate data key
        chartData.schoolLevels.forEach((schoolLevel) => {
          const schoolLevelKey = schoolLevel.replace(/\s+/g, '_');
          const key = `${categoryKey}_${schoolLevelKey}`;
          
          // Get value from nested structure
          flatYear[key] = categoryData[schoolLevelKey] || 0;
        });
      }
    });
    
    return flatYear;
  });

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>Change in Expenditure</Typography>
      
      <Box sx={{ height: 400, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={flattenedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barGap={0}
            barCategoryGap={20}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fiscalYear" />
            <YAxis 
              tickFormatter={(value) => {
                if (value >= 1) {
                  return `+${value}M`;
                } else if (value <= -1) {
                  return `${value}M`;
                } else if (value * 1000 >= 1) {
                  return `+${(value * 1000).toFixed(0)}K`;
                } else if (value * 1000 <= -1) {
                  return `${(value * 1000).toFixed(0)}K`;
                }
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              payload={[
                { value: 'Instructional', type: 'circle', color: '#4285f4' },
                { value: 'Support Services', type: 'circle', color: '#34a853' },
                { value: 'Other', type: 'circle', color: '#9b59b6' },
                { value: 'High School', type: 'rect', color: '#1a73e8' },
                { value: 'Middle/Junior High', type: 'rect', color: '#4285f4' },
                { value: 'Elementary', type: 'rect', color: '#8ab4f8' }
              ]}
              wrapperStyle={{ paddingTop: 20 }}
            />
            <ReferenceLine y={0} stroke="#000" strokeWidth={2} /> {/* This draws the x-axis at y=0 */}
            
            {/* Instructional Bars */}
            <Bar dataKey="Instructional_High_School" name="Instructional_High_School" stackId="Instructional" fill="#1a73e8" />
            <Bar dataKey="Instructional_Middle/Junior_High" name="Instructional_Middle/Junior_High" stackId="Instructional" fill="#4285f4" />
            <Bar dataKey="Instructional_Elementary" name="Instructional_Elementary" stackId="Instructional" fill="#8ab4f8" />
            
            {/* Support Services Bars */}
            <Bar dataKey="Support_Services_High_School" name="Support_Services_High_School" stackId="Support_Services" fill="#0d652d" />
            <Bar dataKey="Support_Services_Middle/Junior_High" name="Support_Services_Middle/Junior_High" stackId="Support_Services" fill="#34a853" />
            <Bar dataKey="Support_Services_Elementary" name="Support_Services_Elementary" stackId="Support_Services" fill="#81c995" />
            
            {/* Other Bar */}
            <Bar dataKey="Other_High_School" name="Other_High_School" stackId="Other" fill="#9b59b6" opacity={0.8} />
            <Bar dataKey="Other_Middle/Junior_High" name="Other_Middle/Junior_High" stackId="Other" fill="#9b59b6" opacity={0.6} />
            <Bar dataKey="Other_Elementary" name="Other_Elementary" stackId="Other" fill="#9b59b6" opacity={0.4} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Cumulative change in expenditures by category and school level since fiscal year 18/19, relative to fiscal years 19/20 through 23/24. Each bar represents a category with school levels stacked within.
      </Typography>
    </Paper>
  );
};

export default ExpenditureHistoryChart; 
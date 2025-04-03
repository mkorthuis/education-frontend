import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, CircularProgress, Divider, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCurrentDistrict,
  selectLocationLoading,
  fetchAllDistrictData 
} from '@/store/slices/locationSlice';
import {
  fetchFinancialReport,
  selectExpendituresByEntryType,
  selectExpendituresByFundType,
  selectTotalExpenditures,
  selectRevenuesByEntryType,
  selectRevenuesByFundType,
  selectTotalRevenues,
  selectFinanceLoading,
  selectFinanceError,
  selectTotalAssets,
  selectFinancialReport,
  selectComparisonYearTotalExpenditures,
  selectComparisonYearTotalRevenues,
  selectComparisonYearTotalAssets,
  selectComparisonYearFinancialReport,
  selectComparisonYearProcessedReport,
  type FundType,
  type EntryType,
  type ProcessedReport,
  type Expenditure
} from '@/store/slices/financeSlice';
import SectionTitle from '@/components/ui/SectionTitle';
import GenericChart from '@/components/ui/tables/GenericChart';
import { ChartItem } from '@/components/ui/tables/GenericChart';
import { FinancialComparisonTable, FinancialComparisonItem } from '@/components/ui/tables';
import { formatCurrency } from '@/components/ui/tables/chartUtils';
import { formatCompactNumber } from '@/utils/formatting';

// Chart component for summary and detailed views
interface FinancialChartSectionProps {
  title: string;
  totalAmount: number;
  summaryCharts: {
    fundTypeData: ChartItem[];
    entryTypeData: ChartItem[];
    fundTypeTitle: string;
    entryTypeTitle: string;
  };
  detailedView: {
    tabValue: number;
    handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    tabs: string[];
  };
}

const FinancialChartSection: React.FC<FinancialChartSectionProps> = ({
  title,
  totalAmount,
  summaryCharts,
  detailedView,
}) => {
  const { fundTypeData, entryTypeData, fundTypeTitle, entryTypeTitle } = summaryCharts;
  const { tabValue, handleTabChange, tabs } = detailedView;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Total {title}: {formatCompactNumber(totalAmount)}
      </Typography>

      {/* Fund Type Chart */}
      <GenericChart 
        items={fundTypeData}
        title={fundTypeTitle}
        showDetailedBars={true}
        showLegend={true}
        showSegmentedBar={true}
        formatValue={formatCompactNumber}
      />

      {/* Entry Type Chart */}
      <GenericChart 
        items={entryTypeData}
        title={entryTypeTitle}
        showDetailedBars={false}
        maxItems={6}
        formatValue={formatCompactNumber}
      />

    </Box>
  );
};

// Helper function to prepare expenditure data for the comparison table using raw entries
const prepareDetailedExpenditureComparisonData = (
  processedReport: ProcessedReport | null,
  comparisonYearProcessedReport: ProcessedReport | null
): FinancialComparisonItem[] => {
  if (!processedReport || !comparisonYearProcessedReport) {
    return [];
  }

  // Function to normalize category names based on specified rules
  const normalizeCategory = (categoryName: string): string => {
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

  // Create a lookup map for comparison year expenditures by entry type ID
  const comparisonYearExpendituresMap = new Map<number, Expenditure[]>();
  comparisonYearProcessedReport.expenditures.forEach(exp => {
    const entryTypeId = exp.entry_type.id;
    if (!comparisonYearExpendituresMap.has(entryTypeId)) {
      comparisonYearExpendituresMap.set(entryTypeId, []);
    }
    comparisonYearExpendituresMap.get(entryTypeId)?.push(exp);
  });

  // Group expenditures by a unique key composed of category, subCategory, and name
  const expenditureGroups = new Map<string, {
    name: string;
    subCategory: string;
    category: string;
    currentValue: number;
    previousValue: number;
    entries: Expenditure[];
  }>();

  // Process and group current year expenditures
  processedReport.expenditures.forEach(expenditure => {
    let subCategory = expenditure.entry_type.category?.name || "Uncategorized";
    
    // Get the raw category and normalize it
    let rawCategory = expenditure.entry_type.category?.super_category?.name || "Uncategorized";
    let category = normalizeCategory(rawCategory);
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

  // Sort the rows by category, sub category, and then by current value (descending)
  const sortedRows = [...comparisonItems].sort((a, b) => {
    // Custom category order
    const categoryOrder: Record<string, number> = {
      "High School Expenditures": 1,
      "Middle/Junior High Expenditures": 2,
      "Elementary Expenditures": 3,
      "Other Financing Uses": 4
    };
    
    // Get the order for each category (default to 999 for any other category)
    const orderA = categoryOrder[a.category] || 999;
    const orderB = categoryOrder[b.category] || 999;
    
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
  
  return sortedRows.map((row, index) => {
    // If this is a new category, mark it
    if (row.category !== currentCategory) {
      currentCategory = row.category;
      row.isFirstInCategory = true;
      // When changing category, we're also in a new sub category
      currentSubCategory = row.subCategory;
      row.isFirstInSubCategory = true;
    } 
    // If just the sub category changed, mark it
    else if (row.subCategory !== currentSubCategory) {
      currentSubCategory = row.subCategory;
      row.isFirstInSubCategory = true;
    }
    return row;
  });
};

const Financials: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const district = useAppSelector(selectCurrentDistrict);
  const districtLoading = useAppSelector(selectLocationLoading);
  const dispatch = useAppDispatch();
  
  // Tab state
  const [mainTabValue, setMainTabValue] = useState(0);
  const [expenditureTabValue, setExpenditureTabValue] = useState(0);
  const [revenueTabValue, setRevenueTabValue] = useState(0);
  
  // Comparison year selection state
  const [comparisonYear, setComparisonYear] = useState<string>('2023');
  
  // Current year financial data selectors
  const expendituresByEntryType = useAppSelector(selectExpendituresByEntryType);
  const expendituresByFundType = useAppSelector(selectExpendituresByFundType);
  const totalExpenditures = useAppSelector(selectTotalExpenditures);
  const revenuesByEntryType = useAppSelector(selectRevenuesByEntryType);
  const revenuesByFundType = useAppSelector(selectRevenuesByFundType);
  const totalRevenues = useAppSelector(selectTotalRevenues);
  const totalAssets = useAppSelector(selectTotalAssets);
  const financeLoading = useAppSelector(selectFinanceLoading);
  const financeError = useAppSelector(selectFinanceError);
  const financialReport = useAppSelector(selectFinancialReport);
  
  // Comparison year financial data selectors
  const comparisonYearTotalExpenditures = useAppSelector(selectComparisonYearTotalExpenditures);
  const comparisonYearTotalRevenues = useAppSelector(selectComparisonYearTotalRevenues);
  const comparisonYearTotalAssets = useAppSelector(selectComparisonYearTotalAssets);
  const comparisonYearFinancialReport = useAppSelector(selectComparisonYearFinancialReport);
  
  // Additional selector for comparison year data
  const comparisonYearProcessedReport = useAppSelector(selectComparisonYearProcessedReport);
  const processedReport = useAppSelector(state => state.finance.processedReport);
  
  // Get the year from the financial reports
  const currentYear = financialReport?.doe_form?.year || null;
  const comparisonYearValue = comparisonYearFinancialReport?.doe_form?.year || null;
  
  // Format the current year as fiscal year (YY/YY)
  const formattedCurrentYear = currentYear ? 
    `${(currentYear - 1).toString().slice(-2)}/${currentYear.toString().slice(-2)}` : 
    null;
    
  // Format the comparison year as fiscal year (YY/YY)
  const formattedComparisonYear = comparisonYearValue ? 
    `${(comparisonYearValue - 1).toString().slice(-2)}/${comparisonYearValue.toString().slice(-2)}` : 
    null;

  // Generate an array of available years (from 2010 to current year - 1)
  const availableComparisonYears = useMemo(() => {
    const years = [];
    const endYear = currentYear ? currentYear - 1 : 2023;
    const startYear = 2010;
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year.toString());
    }
    
    return years;
  }, [currentYear]);

  // Handle comparison year change
  const handleComparisonYearChange = (event: SelectChangeEvent<string>) => {
    setComparisonYear(event.target.value);
  };

  // Data loading
  useEffect(() => {
    if (id) {
      if (!district && !districtLoading) {
        dispatch(fetchAllDistrictData(id));
      }
      
      // Fetch current and comparison year data
      dispatch(fetchFinancialReport({ 
        districtId: id,
        includeComparisonYear: true,
        comparisonYear: comparisonYear
      }));
    }
  }, [dispatch, id, district, districtLoading, comparisonYear]);

  // Tab change handlers
  const handleMainTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue);
  };

  const handleExpenditureTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setExpenditureTabValue(newValue);
  };

  const handleRevenueTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setRevenueTabValue(newValue);
  };

  const isLoading = districtLoading || financeLoading;
  const hasNoData = expendituresByEntryType.length === 0 && revenuesByEntryType.length === 0;

  // Define chart section props
  const expenditureChartProps = {
    title: "Expenditures",
    totalAmount: totalExpenditures,
    summaryCharts: {
      fundTypeData: expendituresByFundType,
      entryTypeData: expendituresByEntryType,
      fundTypeTitle: "Expenditure By Fund Type",
      entryTypeTitle: "Expenditure By Program"
    },
    detailedView: {
      tabValue: expenditureTabValue,
      handleTabChange: handleExpenditureTabChange,
      tabs: ["By Program", "By Expenditure Type"]
    }
  };

  const revenueChartProps = {
    title: "Revenues",
    totalAmount: totalRevenues,
    summaryCharts: {
      fundTypeData: revenuesByFundType,
      entryTypeData: revenuesByEntryType,
      fundTypeTitle: "Revenue By Fund Type",
      entryTypeTitle: "Revenue By Source"
    },
    detailedView: {
      tabValue: revenueTabValue,
      handleTabChange: handleRevenueTabChange,
      tabs: ["By Source", "By Revenue Type"]
    }
  };

  // Define a helper component for showing financial change
  const FinancialChange: React.FC<{ 
    current: number; 
    previous: number; 
    iconSize?: 'small' | 'inherit' | 'medium' | 'large';
  }> = ({ current, previous, iconSize = 'small' }) => {
    if (previous <= 0) return null;
    
    const difference = current - previous;
    const percentChange = (difference / previous) * 100;
    const isIncrease = difference > 0;
    
    return (
      <>
        {' '}
        ({isIncrease ? <ArrowUpwardIcon fontSize={iconSize} color="success" /> : <ArrowDownwardIcon fontSize={iconSize} color="error" />}
        {formatCompactNumber(Math.abs(difference))} ({Math.abs(percentChange).toFixed(1)}%))
      </>
    );
  };

  // Prepare expenditure comparison data using the detailed approach
  const expenditureComparisonItems = prepareDetailedExpenditureComparisonData(
    processedReport,
    comparisonYearProcessedReport
  );

  return (
    <>
      <SectionTitle>
        {district?.name || 'District'} School District
      </SectionTitle>

      <Typography variant="body1" gutterBottom>
        {formattedCurrentYear ? `${formattedCurrentYear} ` : ''}Expenditures: {formatCompactNumber(totalExpenditures)}
        <FinancialChange current={totalExpenditures} previous={comparisonYearTotalExpenditures} />
      </Typography>
      <Typography variant="body1" gutterBottom>
        {formattedCurrentYear ? `${formattedCurrentYear} ` : ''}Revenues: {formatCompactNumber(totalRevenues)}
        <FinancialChange current={totalRevenues} previous={comparisonYearTotalRevenues} />
      </Typography>
      <Typography variant="body1" gutterBottom>
        {formattedCurrentYear ? `${formattedCurrentYear} ` : ''}Assets: {formatCompactNumber(totalAssets)}
        <FinancialChange current={totalAssets} previous={comparisonYearTotalAssets} />
      </Typography>
      
      <Box sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200, mr: 2 }}>
          <InputLabel id="comparison-year-label">Comparison Year</InputLabel>
          <Select
            labelId="comparison-year-label"
            id="comparison-year-select"
            value={comparisonYear}
            label="Comparison Year"
            onChange={handleComparisonYearChange}
          >
            {availableComparisonYears.map((year) => (
              <MenuItem key={year} value={year}>
                {(parseInt(year) - 1).toString().slice(-2)}/{year.slice(-2)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {financeLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      </Box>
      
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : financeError ? (
          <Typography color="error">{financeError}</Typography>
        ) : hasNoData ? (
          <Typography>No financial data available for this district.</Typography>
        ) : (
          <>
            {/* <Tabs value={mainTabValue} onChange={handleMainTabChange} sx={{ mb: 3 }}>
              <Tab label="Expenditures" />
              <Tab label="Revenues" />
            </Tabs>

            {mainTabValue === 0 && <FinancialChartSection {...expenditureChartProps} />}
            {mainTabValue === 1 && <FinancialChartSection {...revenueChartProps} />}
             */}
            {/* Add the expenditure comparison table outside the tabs */}
            {mainTabValue === 0 && (
              <FinancialComparisonTable 
                items={expenditureComparisonItems}
                currentYear={formattedCurrentYear}
                previousYear={formattedComparisonYear}
                headers={{
                  category: 'Category',
                  subCategory: 'Sub Category',
                  itemName: 'Expenditure Type'
                }}
                title={`Expenditure Breakdown: ${formattedCurrentYear} vs ${formattedComparisonYear}`}
                formatValue={formatCompactNumber}
              />
            )}
          </>
        )}
    </>
  );
};

export default Financials; 
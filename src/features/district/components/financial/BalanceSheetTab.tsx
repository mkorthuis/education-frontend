import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { FinancialComparisonTable } from '@/components/ui/tables';
import { formatCompactNumber } from '@/utils/formatting';
import { 
  prepareDetailedAssetsComparisonData,
  prepareDetailedLiabilitiesComparisonData
} from '../../utils/financialDataProcessing';
import { selectFinancialReports } from '@/store/slices/financeSlice';
import { FISCAL_YEAR } from '@/utils/environment';

interface BalanceSheetTabProps {
  districtId?: string;
}

const BalanceSheetTab: React.FC<BalanceSheetTabProps> = ({
  districtId
}) => {
  // Get financial reports from Redux
  const financialReports = useAppSelector(state => selectFinancialReports(state));
  
  // Set current year from environment variable
  const currentYear = FISCAL_YEAR;
  
  // Generate available comparison years from financial reports, excluding current year
  const availableComparisonYears = useMemo(() => {
    return Object.keys(financialReports)
      .filter(year => year !== currentYear && financialReports[year] !== null)
      .sort((a, b) => parseInt(b) - parseInt(a)); // Sort in descending order (most recent first)
  }, [financialReports, currentYear]);
  
  // Pre-process comparison data for tables
  const assetsComparisonItems = useMemo(() => 
    prepareDetailedAssetsComparisonData(
      financialReports[currentYear], 
      financialReports[parseInt(currentYear)-1]
    ),
    [financialReports, currentYear]
  );
  
  const liabilitiesComparisonItems = useMemo(() => 
    prepareDetailedLiabilitiesComparisonData(
      financialReports[currentYear], 
      financialReports[parseInt(currentYear)-1]
    ),
    [financialReports, currentYear]
  );

  return (
    <>
      {/* Assets Table */}
      <FinancialComparisonTable 
        items={assetsComparisonItems}
        currentYear={currentYear}
        headers={{
          category: 'Category',
          subCategory: 'Type',
          itemName: 'Asset'
        }}
        title="Assets Breakdown"
        formatValue={formatCompactNumber}
        initialViewMode="comparison"
        availableComparisonYears={availableComparisonYears}
        onComparisonYearChange={() => {}}
        valueType="Assets"
        totalRowLabel="Total Assets"
      />
      
      {/* Liabilities Table */}
      <Box sx={{ mt: 4 }}>
        <FinancialComparisonTable 
          items={liabilitiesComparisonItems}
          currentYear={currentYear}
          headers={{
            category: 'Category',
            subCategory: 'Type',
            itemName: 'Liability'
          }}
          title="Liabilities Breakdown"
          formatValue={formatCompactNumber}
          initialViewMode="comparison"
          availableComparisonYears={availableComparisonYears}
          onComparisonYearChange={() => {}}
          valueType="Debts"
          totalRowLabel="Total Liabilities"
        />
      </Box>
    </>
  );
};

export default BalanceSheetTab; 
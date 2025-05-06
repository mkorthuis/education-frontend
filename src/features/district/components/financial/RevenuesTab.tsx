import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { FinancialComparisonTable } from '@/components/ui/tables';
import { formatCompactNumber } from '@/utils/formatting';
import { 
  prepareDetailedRevenueComparisonData 
} from '../../utils/financialDataProcessing';
import { selectFinancialReports, selectAdjustForInflation } from '@/store/slices/financeSlice';
import { FISCAL_YEAR } from '@/utils/environment';

interface RevenuesTabProps {
  districtId?: string;
}

const RevenuesTab: React.FC<RevenuesTabProps> = ({
  districtId
}) => {
  // Get financial reports from Redux
  const financialReports = useAppSelector(state => selectFinancialReports(state));
  
  // Get inflation adjustment state from Redux
  const adjustForInflation = useAppSelector(selectAdjustForInflation);
  
  // Set current year from environment variable
  const currentYear = FISCAL_YEAR;
  
  // Generate available comparison years from financial reports, excluding current year
  const availableComparisonYears = useMemo(() => {
    return Object.keys(financialReports)
      .filter(year => year !== currentYear && financialReports[year] !== null)
      .sort((a, b) => parseInt(b) - parseInt(a)); // Sort in descending order (most recent first)
  }, [financialReports, currentYear]);
  
  // Pre-process comparison data for tables - dynamically based on selected years
  const revenueComparisonItems = useMemo(() => 
    prepareDetailedRevenueComparisonData(
      financialReports[currentYear], 
      financialReports[parseInt(currentYear)-1],
      adjustForInflation,
      parseInt(currentYear),
      parseInt(currentYear)-1
    ),
    [financialReports, currentYear, adjustForInflation]
  );

  return (
    <FinancialComparisonTable 
      items={revenueComparisonItems}
      currentYear={currentYear}
      headers={{
        category: 'Category',
        subCategory: 'Sub Category',
        itemName: 'Revenue Source'
      }}
      title="Revenue Breakdown"
      formatValue={formatCompactNumber}
      initialViewMode="comparison"
      availableComparisonYears={availableComparisonYears}
      onComparisonYearChange={() => {}}
      valueType="Revenue"
      adjustForInflation={adjustForInflation}
    />
  );
};

export default RevenuesTab; 
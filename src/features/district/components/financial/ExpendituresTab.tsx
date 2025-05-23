import React, { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { FinancialComparisonTable } from '@/components/ui/tables';
import { formatCompactNumber } from '@/utils/formatting';
import { 
  prepareDetailedExpenditureComparisonData 
} from '../../utils/financialDataProcessing';
import { selectFinancialReports, selectAdjustForInflation } from '@/store/slices/financeSlice';
import { FISCAL_YEAR } from '@/utils/environment';

interface ExpendituresTabProps {
  districtId?: string;
}

const ExpendituresTab: React.FC<ExpendituresTabProps> = ({
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
  const expenditureComparisonItems = useMemo(() => 
    prepareDetailedExpenditureComparisonData(
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
      items={expenditureComparisonItems}
      currentYear={currentYear}
      headers={{
        category: 'Category',
        subCategory: 'Sub Category',
        itemName: 'Expenditure Type'
      }}
      title="Expenditure Breakdown"
      formatValue={formatCompactNumber}
      initialViewMode="comparison"
      availableComparisonYears={availableComparisonYears}
      onComparisonYearChange={() => {}}
      valueType="Spend"
      adjustForInflation={adjustForInflation}
    />
  );
};

export default ExpendituresTab; 
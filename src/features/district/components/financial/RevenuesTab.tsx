import React, { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Link } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { FinancialComparisonTable } from '@/components/ui/tables';
import { formatCompactNumber } from '@/utils/formatting';
import { 
  prepareDetailedRevenueComparisonData 
} from '../../utils/financialDataProcessing';
import { selectFinancialReports, selectAdjustForInflation } from '@/store/slices/financeSlice';
import { FISCAL_YEAR } from '@/utils/environment';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { NAMED_STATE_LINE_NAMES } from '../../utils/stateAid';

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

  // The State Aid tab, for the year shown: from the state lines here, and on phones, where it has no tab, below the table
  const stateAidPath = districtId
    ? `${PAGE_REGISTRY.district.financials.urlPatterns[0].replace(':id', districtId).replace(':tab?', 'state-aid')}?year=${currentYear}`
    : null;

  return (
    <>
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
        itemNote={item => stateAidPath && NAMED_STATE_LINE_NAMES.has(item.name) ? (
          <Link component={RouterLink} to={stateAidPath} variant="caption" sx={{ display: 'block' }}>
            How It's Calculated
          </Link>
        ) : null}
      />
      {stateAidPath && (
        <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 2 }}>
          {/* Filled blue, as the home page's Ask button */}
          <Button component={RouterLink} to={stateAidPath} variant="contained" disableElevation fullWidth sx={{ textTransform: 'none', minHeight: 44 }}>
            See How State Aid Is Calculated
          </Button>
        </Box>
      )}
      </>
  );
};

export default RevenuesTab; 
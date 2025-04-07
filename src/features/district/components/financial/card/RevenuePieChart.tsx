import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Typography, Box, useMediaQuery } from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  TooltipProps as RechartsTooltipProps
} from 'recharts';
import { useAppSelector } from '@/store/hooks';
import { selectFinancialReports, Revenue } from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { FISCAL_YEAR } from '@/utils/environment';

interface RevenuePieChartProps {
  className?: string;
}

// Chart data structure for revenue categories
interface RevenueChartData {
  name: string;
  value: number;
  percentage: number;
  originalName: string;
}

// Category names for revenue sources
const REVENUE_CATEGORIES = {
  LOCAL: 'Local',
  STATE: 'State',
  FEDERAL: 'Federal',
  OTHER: 'Other'
};

// Custom tooltip props
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RevenueChartData;
    color: string;
    dataKey: string;
    value: number;
  }>;
}

const RevenuePieChart: React.FC<RevenuePieChartProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isXL = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Get current year's financial report
  const financialReports = useAppSelector(selectFinancialReports);
  const currentYearReport = financialReports[FISCAL_YEAR];

  // Define colors for the pie chart segments
  const COLORS = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main
  ], [theme.palette]);

  // Process revenue data for the pie chart
  const chartData = useMemo(() => {
    if (!currentYearReport?.revenues) return [];
    
    const categoryMap = new Map<string, { value: number, originalName: string }>();
    let totalRevenue = 0;
    
    // Group by category and sum values
    currentYearReport.revenues.forEach((rev: Revenue) => {
      const originalName = rev.entry_type.category?.super_category?.name || "Uncategorized";
      
      // Map the original category name to a simplified name
      let categoryName = REVENUE_CATEGORIES.OTHER;
      if (originalName.includes("Local")) {
        categoryName = REVENUE_CATEGORIES.LOCAL;
      } else if (originalName.includes("State")) {
        categoryName = REVENUE_CATEGORIES.STATE;
      } else if (originalName.includes("Federal")) {
        categoryName = REVENUE_CATEGORIES.FEDERAL;
      }
      
      const currentData = categoryMap.get(categoryName) || { value: 0, originalName };
      categoryMap.set(categoryName, { 
        value: currentData.value + rev.value, 
        originalName: currentData.originalName
      });
      totalRevenue += rev.value;
    });
    
    // Convert Map to array and calculate percentages
    return Array.from(categoryMap.entries())
      .map(([name, { value, originalName }]) => ({
        name,
        value,
        originalName,
        percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentYearReport]);

  // Custom tooltip component for the pie chart
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {data.name} ({data.originalName})
          </Typography>
          <Typography variant="body2">
            {formatCompactNumber(data.value)} ({data.percentage.toFixed(1)}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Custom renderer for the legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'center',
        flexWrap: 'wrap',
        mt: 0.25,
        gap: 0.75
      }}>
        {payload.map((entry: any, index: number) => (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mr: 0.5,
            }}
          >
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                backgroundColor: entry.color,
                mr: 0.5,
                borderRadius: '50%'
              }}
            />
            <Typography variant="body2">
              {entry.value}: {formatCompactNumber(chartData[index]?.value || 0)} ({(chartData[index]?.percentage || 0).toFixed(1)}%)
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // If no data is available
  if (chartData.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No revenue data available
        </Typography>
      </Box>
    );
  }

  // Chart dimensions based on screen size
  const chartHeight = isXL ? 320 : (isMobile ? 320 : 380);
  const outerRadius = isMobile ? 90 : 115;

  return (
    <>
      <Typography 
        variant="body1" 
        sx={{ 
          textAlign: "center",
          width: "100%"
        }} 
        gutterBottom
      >
        Funding Sources Breakdown
      </Typography>
      
      <Box sx={{ height: chartHeight, width: '100%', pt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              labelLine={false}
              outerRadius={outerRadius}
              fill={theme.palette.primary.main}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              content={renderLegend}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </>
  );
};

export default RevenuePieChart; 
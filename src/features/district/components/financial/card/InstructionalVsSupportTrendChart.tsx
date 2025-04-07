import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Typography, Box, useMediaQuery } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '@/store/hooks';
import { selectFinancialReports } from '@/store/slices/financeSlice';
import { formatCompactNumber } from '@/utils/formatting';
import { formatFiscalYear } from '../../../utils/financialDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';

interface InstructionalVsSupportTrendChartProps {
  className?: string;
}

// Define the chart data type for type safety
interface ChartDataPoint {
  year: string;
  formattedYear: string;
  instructional: number;
  support: number;
}

const InstructionalVsSupportTrendChart: React.FC<InstructionalVsSupportTrendChartProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get all financial reports from Redux
  const financialReports = useAppSelector(selectFinancialReports);
  
  // Prepare chart data for the last 10 years
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!financialReports || Object.keys(financialReports).length === 0) return [];
    
    // Get the current fiscal year and calculate 10 years ago
    const currentYear = parseInt(FISCAL_YEAR);
    const startYear = currentYear - 10;
    
    // Create an array to store all years we want to process
    const yearsToProcess = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearsToProcess.push(year.toString());
    }
    
    // Process each year's data
    return yearsToProcess
      .filter(year => financialReports[year]) // Only include years that have data
      .map(year => {
        const report = financialReports[year];
        
        // Initialize sums for instructional and support services
        let instructionalTotal = 0;
        let supportTotal = 0;
        
        // Process all expenditures to categorize and sum them
        report.expenditures.forEach(expenditure => {
          // Get the subcategory name, defaulting to "Uncategorized" if not found
          const subCategory = expenditure.entry_type.category?.name || "Uncategorized";
          
          // Special handling for Food Service Operations, which should be counted as Support Services
          // as seen in the financialDataProcessing.ts file
          const rawCategory = expenditure.entry_type.category?.super_category?.name || "Uncategorized";
          const name = expenditure.entry_type.name;
          
          let isSupport = false;
          
          // Check if it's a Food Service Operation (should be Support Services)
          if (rawCategory === "Food Service Operations") {
            isSupport = true;
          }
          
          // Sum values by subcategory
          if (subCategory === "Instruction") {
            instructionalTotal += expenditure.value;
          } else if (subCategory === "Support Services" || isSupport) {
            supportTotal += expenditure.value;
          }
        });
        
        return {
          year,
          formattedYear: formatFiscalYear(parseInt(year)) || year,
          instructional: instructionalTotal,
          support: supportTotal
        };
      })
      .sort((a, b) => parseInt(a.year) - parseInt(b.year)); // Ensure ascending order by year
  }, [financialReports]);
  
  // Find min values to set the Y-axis domain
  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    
    // Find the minimum values for both data series
    const minInstructional = Math.min(...chartData.map(d => d.instructional));
    const minSupport = Math.min(...chartData.map(d => d.support));
    
    // Get the overall minimum
    const minOverall = Math.min(minInstructional, minSupport);
    
    // Subtract ~5% to create some padding
    return Math.floor(minOverall * 0.95);
  }, [chartData]);
  
  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return `$${value.toLocaleString()}`;
  };
  
  // Customize tooltip appearance
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
            Fiscal Year {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={`tooltip-${index}`}
              variant="body2"
              sx={{ color: entry.color, mb: 0.5 }}
            >
              {`${entry.name}: ${formatTooltipValue(entry.value)}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };
  
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
            Instructional & Support Services Spend 
        </Typography>
        
        <Box sx={{ height: isMobile ? 300 : 400, width: '100%' }}>
            {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                data={chartData}
                margin={{
                    top: 5,
                    right: 20,
                    left: 10,
                    bottom: 5,
                }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="formattedYear"
                    tick={{ fontSize: theme.typography.body2.fontSize }}
                />
                <YAxis
                    domain={[minValue, 'auto']}
                    tickFormatter={(value) => formatCompactNumber(value)}
                    tick={{ fontSize: theme.typography.body2.fontSize }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: theme.typography.body2.fontSize 
                  }} 
                />
                <Line
                    type="monotone"
                    dataKey="instructional"
                    name="Instructional"
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="support"
                    name="Support Services"
                    stroke={theme.palette.warning.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
                </LineChart>
            </ResponsiveContainer>
            ) : (
            <Box
                sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                }}
            >
                <Typography variant="body1" color="text.secondary">
                No data available
                </Typography>
            </Box>
            )}
        </Box>
    </>
  );
};

export default InstructionalVsSupportTrendChart; 
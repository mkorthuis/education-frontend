import React from 'react';
import { Typography, Box, Tooltip } from '@mui/material';

// Chart item type used for rendering
export type ChartItem = {
  name: string;
  value: number;
  percentage: number;
  color?: string;
};

type GenericChartProps = {
  items: ChartItem[];
  title?: string;
  showSegmentedBar?: boolean;
  showLegend?: boolean;
  showDetailedBars?: boolean;
  height?: number;
  maxItems?: number;
  colorPalette?: string[];
  formatValue?: (value: number) => string;
};

const defaultColors = [
  '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', 
  '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b',
  '#27ae60', '#8e44ad', '#f1c40f', '#e67e22', '#95a5a6'
];

const GenericChart: React.FC<GenericChartProps> = ({
  items,
  title,
  showSegmentedBar = true,
  showLegend = true,
  showDetailedBars = true,
  height = 40,
  maxItems = 6,
  colorPalette = defaultColors,
  formatValue = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}) => {
  // Process data with "Other" rollup if needed
  const processedItems = React.useMemo(() => {
    if (items.length <= maxItems) return items;
    
    // Take top N items based on maxItems
    const topItems = items.slice(0, maxItems - 1);
    
    // Combine the rest into "Other"
    const otherItems = items.slice(maxItems - 1);
    const otherValue = otherItems.reduce((sum, item) => sum + item.value, 0);
    const total = items.reduce((sum, item) => sum + item.value, 0);
    
    // Add "Other" item to the result
    return [
      ...topItems,
      {
        name: "Other",
        value: otherValue,
        percentage: (otherValue / total) * 100
      }
    ];
  }, [items, maxItems]);

  // Get color for an item
  const getColor = (item: ChartItem, index: number) => {
    // Use item's color if provided
    if (item.color) return item.color;
    // Otherwise use from palette
    return colorPalette[index % colorPalette.length];
  };

  // Render segmented bar
  const renderSegmentedBar = () => {
    return (
      <Box sx={{ display: 'flex', width: '100%', height: height, overflow: 'hidden', mb: 2 }}>
        {processedItems.map((item, index) => (
          <Tooltip
            key={item.name}
            title={`${item.name}: ${formatValue(item.value)} (${item.percentage.toFixed(1)}%)`}
          >
            <Box
              sx={{
                width: `${item.percentage}%`,
                height: '100%',
                bgcolor: getColor(item, index),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                '&:hover': {
                  opacity: 0.9,
                  cursor: 'pointer'
                }
              }}
            >
              {item.percentage > 5 ? `${item.percentage.toFixed(0)}%` : ''}
            </Box>
          </Tooltip>
        ))}
      </Box>
    );
  };

  // Render color legend
  const renderLegend = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
      {processedItems.map((item, index) => (
        <Box key={item.name} sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              bgcolor: getColor(item, index), 
              mr: 1, 
              borderRadius: '2px' 
            }} 
          />
          <Typography variant="body2">
            {item.name}: {formatValue(item.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  // Render detailed item bars
  const renderDetailedBars = () => (
    <Box sx={{ mt: 2, mb: 4 }}>
      {items.map((item, index) => (
        <Box key={item.name} sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" sx={{ width: '35%', pr: 2 }}>
              {item.name}
            </Typography>
            <Typography variant="body2" sx={{ width: '15%', textAlign: 'right', pr: 2 }}>
              {formatValue(item.value)}
            </Typography>
            <Typography variant="body2" sx={{ width: '10%', textAlign: 'right', pr: 2 }}>
              {item.percentage.toFixed(1)}%
            </Typography>
          </Box>
          <Tooltip title={`${item.name}: ${formatValue(item.value)} (${item.percentage.toFixed(1)}%)`}>
            <Box 
              sx={{ 
                width: `${item.percentage}%`, 
                height: 24, 
                bgcolor: getColor(item, index),
                borderRadius: 1
              }}
            />
          </Tooltip>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ mb: 3 }}>
      {title && (
        <Typography variant="subtitle1" gutterBottom>
          {title}
        </Typography>
      )}
      {showSegmentedBar && renderSegmentedBar()}
      {showLegend && renderLegend()}
      {showDetailedBars && renderDetailedBars()}
    </Box>
  );
};

export default GenericChart; 
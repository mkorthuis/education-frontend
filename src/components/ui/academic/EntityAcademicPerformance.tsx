import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label,
  Legend
} from 'recharts';
import { Typography, Box } from '@mui/material';
import { 
  getEntityLabel, 
  getEntityPlural, 
  EntityType,
  CHART_COLORS 
} from './utils/academicUtils';

// Interface for processed chart data
interface ChartDataPoint {
  percentage: number;
  count: number;
  isCurrentEntity: boolean;
}

export interface EntityAcademicPerformanceProps {
  chartData: ChartDataPoint[];
  entityType: EntityType;
  stateAverage: number | null;
  rank: number | null;
  total: number;
  hasData: boolean;
}

// Custom X-axis tick formatter to show ticks only at 10% intervals
const formatXAxisTick = (value: number) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (value % 10 === 0) {
    // For the value 100, don't add the percentage sign on mobile
    if (value === 100 && isMobile) {
      return '100';
    }
    return `${value}%`;
  }
  return '';
};

function EntityAcademicPerformance({
  chartData,
  entityType,
  stateAverage,
  rank,
  total,
  hasData
}: EntityAcademicPerformanceProps) {
  // Get entity labels
  const entityLabel = getEntityLabel(entityType);
  const entityPlural = getEntityPlural(entityType);
  
  // Custom Legend Component
  const renderLegend = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', fontSize: '12px', marginTop: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: CHART_COLORS.CURRENT_ENTITY, 
            marginRight: '5px' 
          }}></div>
          <span>Your {entityLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: CHART_COLORS.OTHER_ENTITIES, 
            marginRight: '5px' 
          }}></div>
          <span>Other {entityPlural}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Typography variant="h6" sx={{ textAlign: "center", width: "100%" }}>
        % Students Proficient For Each {entityLabel}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, textAlign: "center", width: "100%" }}>
        Your {entityType} is <span style={{ color: CHART_COLORS.CURRENT_ENTITY, fontWeight: 'bold' }}>blue</span>
        {rank !== null && total > 0 ? `. Ranked #${rank} out of ${total} ${entityPlural.toLowerCase()}` : ''}.
      </Typography>
      
      <Box sx={{ width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5, 
              right: 5,
              left: 5,
              bottom: 15,
            }}
            barCategoryGap={0}
            barGap={0}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="percentage" 
              domain={[0, 100]}
              tickFormatter={formatXAxisTick}
              ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
              tick={{ fontSize: 10 }}
              height={20}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fontSize: 10 }}
              width={25}
            />
            <Tooltip 
              formatter={(value) => [value, entityPlural]}
              labelFormatter={(percentage) => `Proficiency: ${percentage}%`}
            />
            {stateAverage !== null && (
              <ReferenceLine 
                x={stateAverage} 
                stroke={CHART_COLORS.STATE_AVERAGE} 
                strokeWidth={2}
                strokeDasharray="5 5"
                isFront={true}
              >
                <Label
                  value={`State Average: ${stateAverage}%`}
                  position="top"
                  fill={CHART_COLORS.STATE_AVERAGE}
                  fontSize={12}
                  fontWeight={600}
                  offset={0}
                  dx={65}
                  dy={20}
                />
              </ReferenceLine>
            )}
            <Bar dataKey="count" name={entityPlural} minPointSize={1}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isCurrentEntity ? CHART_COLORS.CURRENT_ENTITY : CHART_COLORS.OTHER_ENTITIES} 
                />
              ))}
            </Bar>
            <Legend content={renderLegend} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      
      {!hasData && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
          No data available. Please select filters to view {entityType} data.
        </Typography>
      )}
    </>
  );
}

export default EntityAcademicPerformance; 
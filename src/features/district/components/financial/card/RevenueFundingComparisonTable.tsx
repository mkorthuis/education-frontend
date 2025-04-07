import React from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme } from '@mui/material';

// Define funding source types for type safety
type FundingSourceKey = 'local' | 'state' | 'federal' | 'other';

// Interface for revenue data structure
interface RevenueFundingData {
  local: number;
  state: number;
  federal: number;
  other: number;
}

interface RevenueFundingComparisonTableProps {
  districtData: RevenueFundingData | null;
  stateData: RevenueFundingData | null;
  showStateNA?: boolean;
  districtName?: string;
}

// Revenue funding sources to display in table
const FUNDING_SOURCES: { key: FundingSourceKey; label: string }[] = [
  { key: 'local', label: 'Local' },
  { key: 'state', label: 'State' },
  { key: 'federal', label: 'Federal' },
  { key: 'other', label: 'Other' }
];

const RevenueFundingComparisonTable: React.FC<RevenueFundingComparisonTableProps> = ({ 
  districtData, 
  stateData,
  showStateNA = false,
  districtName
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // If district data is not available, don't render the table
  if (!districtData) return null;
  
  // Calculate totals
  const calculateTotal = (data: RevenueFundingData): number => 
    data.local + data.state + data.federal + data.other;
  
  const districtTotal = calculateTotal(districtData);
  const stateTotal = !showStateNA && stateData ? calculateTotal(stateData) : 0;
  
  // Calculate percentage for a specific value
  const calculatePercentage = (value: number, total: number): string => 
    total > 0 ? (value / total * 100).toFixed(1) : '0.0';
  
  // Render state percentage based on data availability
  const renderStatePercentage = (key: FundingSourceKey): React.ReactNode => {
    if (showStateNA || !stateData) {
      return <Typography color="text.secondary">N/A</Typography>;
    }
    return `${calculatePercentage(stateData[key], stateTotal)}%`;
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography 
        variant="body1" 
        sx={{ textAlign: "center", width: "100%", mb: 1 }}
      >
        {districtName} Revenue Sources vs State Average
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
            flex: 1,
            backgroundColor: 'grey.100',
            border: 1,
            borderColor: 'grey.300',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <Table size="small">
            <TableHead sx={{ 
              backgroundColor: 'grey.200',
              '& th': {
                borderBottom: '2px solid',
                borderColor: 'grey.400',
              }
            }}>
              <TableRow>
                <TableCell>Source</TableCell>
                <TableCell align="right">District</TableCell>
                <TableCell align="right">State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {FUNDING_SOURCES.map(({ key, label }, index) => (
                <TableRow 
                  key={key}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    ...(index < FUNDING_SOURCES.length - 1 && {
                      '& td, & th': {
                        borderBottom: '2px solid',
                        borderColor: 'grey.300',
                      }
                    })
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'normal' }}>{label}</TableCell>
                  <TableCell align="right">
                    {calculatePercentage(districtData[key], districtTotal)}%
                  </TableCell>
                  <TableCell align="right">
                    {renderStatePercentage(key)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default RevenueFundingComparisonTable; 
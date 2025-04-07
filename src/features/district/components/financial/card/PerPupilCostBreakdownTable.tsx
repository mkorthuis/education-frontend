import React from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme } from '@mui/material';
import { formatCompactNumber } from '@/utils/formatting';

interface PerPupilCostBreakdownTableProps {
  districtData: {
    elementary: number;
    middle: number;
    high: number;
  } | null;
  stateData: {
    elementary: number;
    middle: number;
    high: number;
  } | null;
}

const PerPupilCostBreakdownTable: React.FC<PerPupilCostBreakdownTableProps> = ({ districtData, stateData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!districtData || !stateData) return null;
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography 
        variant="body1" 
        sx={{ 
          textAlign: "center",
          width: "100%",
          mb: 1
        }}
      >
        Cost Breakdown by School Level
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
                <TableCell></TableCell>
                <TableCell align="right">District</TableCell>
                <TableCell align="right">State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ borderBottom: '2px solid', borderColor: 'grey.300' }}>Elementary</TableCell>
                <TableCell align="right" sx={{ borderBottom: '2px solid', borderColor: 'grey.300' }}>
                  {formatCompactNumber(districtData.elementary)}
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: '2px solid', borderColor: 'grey.300' }}>
                  {formatCompactNumber(stateData.elementary)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row" sx={{ borderBottom: '2px solid', borderColor: 'grey.300' }}>Middle</TableCell>
                <TableCell align="right" sx={{ borderBottom: '2px solid', borderColor: 'grey.300' }}>
                  {formatCompactNumber(districtData.middle)}
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: '2px solid', borderColor: 'grey.300' }}>
                  {formatCompactNumber(stateData.middle)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">High</TableCell>
                <TableCell align="right">
                  {formatCompactNumber(districtData.high)}
                </TableCell>
                <TableCell align="right">
                  {formatCompactNumber(stateData.high)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default PerPupilCostBreakdownTable; 
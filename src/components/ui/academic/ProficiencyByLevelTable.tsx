import React from 'react';
import { Typography, Box, Card, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { 
  AssessmentDataType, 
  EntityType, 
  ProficiencyLevelData, 
  PROFICIENCY_LEVELS, 
  formatPercentage 
} from './utils/academicUtils';
import { AssessmentStateData } from '@/store/slices/assessmentSlice';

export interface ProficiencyByLevelTableProps {
  entityData: AssessmentDataType | null;
  stateData: AssessmentStateData | null;
  entityType: EntityType;
  entityName?: string;
}

function ProficiencyByLevelTable({
  entityData,
  stateData,
  entityType,
  entityName
}: ProficiencyByLevelTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // If no entity data is available, don't render the table
  if (!entityData) return null;
  
  // Render percentage based on data availability
  const renderPercentage = (data: ProficiencyLevelData | null, levelKey: string, exceptionKey: string): React.ReactNode => {
    if (!data) {
      return <Typography color="text.secondary">N/A</Typography>;
    }
    
    const exception = data[exceptionKey as keyof ProficiencyLevelData] as string | null;
    const value = data[levelKey as keyof ProficiencyLevelData] as number | null;
    
    return formatPercentage(value, exception);
  };
  
  return (
    <Box>
      <Card sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
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
                <TableCell>Proficiency Level</TableCell>
                <TableCell align="right">% Students</TableCell>
                {/* Only show State Avg column if not a state view or if we have state data */}
                {(entityType !== 'state' || stateData) && (
                  <TableCell align="right">State Avg.</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {PROFICIENCY_LEVELS.map(({ key, exception, label, bgColor, description }, index) => (
                <TableRow 
                  key={key}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    ...(index < PROFICIENCY_LEVELS.length - 1 && {
                      '& td, & th': {
                        borderBottom: '2px solid',
                        borderColor: 'grey.300',
                      }
                    }),
                    backgroundColor: bgColor
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'normal' }}>
                    <Tooltip title={description} arrow placement="right">
                      <Box component="span" sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'help',
                      }}>
                        {label}
                        <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, width: 16, height: 16, color: 'text.secondary' }} />
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    {renderPercentage(entityData, key, exception)}
                  </TableCell>
                  {/* Only show State Avg column if not a state view or if we have state data */}
                  {(entityType !== 'state' || stateData) && (
                    <TableCell align="right">
                      {renderPercentage(stateData, key, exception)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

export default ProficiencyByLevelTable; 
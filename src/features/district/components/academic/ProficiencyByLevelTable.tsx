import React from 'react';
import { Typography, Box, Card, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, useTheme, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAppSelector } from '@/store/hooks';
import { 
  selectCurrentAssessmentDistrictData,
  selectCurrentAssessmentStateData,
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
} from '@/store/slices/assessmentSlice';
import { filterAssessmentResults } from '@/features/district/utils/assessmentDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';

// Interface for proficiency level data
interface ProficiencyLevelData {
  level_1_percentage: number | null;
  level_1_percentage_exception: string | null;
  level_2_percentage: number | null;
  level_2_percentage_exception: string | null;
  level_3_percentage: number | null;
  level_3_percentage_exception: string | null;
  level_4_percentage: number | null;
  level_4_percentage_exception: string | null;
}

// Define proficiency levels for the table
const PROFICIENCY_LEVELS = [
  { 
    key: 'level_1_percentage', 
    exception: 'level_1_percentage_exception', 
    label: 'Below Proficient', 
    bgColor: '#ffcdd2',
    description: 'The student generally performs significantly below the standard for the grade level/course, is likely able to partially access grade-level content and engages with higher order thinking skills with extensive support.'
  }, // Darker red
  { 
    key: 'level_2_percentage', 
    exception: 'level_2_percentage_exception', 
    label: 'Near Proficient', 
    bgColor: '#ffebee',
    description: 'The student generally performs slightly below the standard for the grade level/course, is able to access grade-level content, and engages in higher order thinking skills with some independence and support.'
  }, // Light red
  { 
    key: 'level_3_percentage', 
    exception: 'level_3_percentage_exception', 
    label: 'Proficient', 
    bgColor: '#e8f5e9',
    description: 'The student generally performs at the standard for the grade level/course, is able to access grade-level content, and engages in higher order thinking skills with some independence and minimal support.'
  }, // Light green
  { 
    key: 'level_4_percentage', 
    exception: 'level_4_percentage_exception', 
    label: 'Above Proficient', 
    bgColor: '#c8e6c9',
    description: 'The student generally performs significantly above the standard for the grade level/course, is able to access above grade-level content, and engages in higher order thinking skills independently.'
  }  // Darker green
];

interface ProficiencyByLevelTableProps {
  districtName?: string;
}

const ProficiencyByLevelTable: React.FC<ProficiencyByLevelTableProps> = ({ 
  districtName = 'District'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get data from Redux store
  const districtData = useAppSelector(selectCurrentAssessmentDistrictData);
  const stateData = useAppSelector(selectCurrentAssessmentStateData);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  
  // Filter both district and state data based on current selections
  const filteredDistrictData = filterAssessmentResults(districtData, {
    year: FISCAL_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  });

  const filteredStateData = filterAssessmentResults(stateData, {
    year: FISCAL_YEAR,
    assessment_subject_id: selectedSubjectId || undefined,
    grade_id: selectedGradeId || undefined,
    assessment_subgroup_id: selectedSubgroupId || undefined
  });

  // Aggregate data - use the first result since we're filtering to specific criteria
  const districtAggregated = filteredDistrictData.length > 0 ? filteredDistrictData[0] : null;
  const stateAggregated = filteredStateData.length > 0 ? filteredStateData[0] : null;
  
  // If no district data is available, don't render the table
  if (!districtAggregated) return null;
  
  // Render percentage based on data availability
  const renderPercentage = (data: ProficiencyLevelData | null, levelKey: string, exceptionKey: string): React.ReactNode => {
    if (!data) {
      return <Typography color="text.secondary">N/A</Typography>;
    }
    
    const exception = data[exceptionKey as keyof ProficiencyLevelData] as string | null;
    if (exception) {
      // Handle special exception cases
      if (exception === "SCORE_UNDER_10") {
        return "<10%";
      }
      if (exception === "SCORE_OVER_90") {
        return ">90%";
      }
      return <Typography color="text.secondary">{exception}</Typography>;
    }
    
    const value = data[levelKey as keyof ProficiencyLevelData] as number | null;
    return value !== null ? `${value.toFixed(1)}%` : 'N/A';
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
                <TableCell align="right">State Avg.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {PROFICIENCY_LEVELS.map(({ key, exception, label, bgColor }, index) => (
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
                    <Tooltip title={PROFICIENCY_LEVELS[index].description} arrow placement="right">
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
                    {renderPercentage(districtAggregated, key, exception)}
                  </TableCell>
                  <TableCell align="right">
                    {renderPercentage(stateAggregated, key, exception)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ProficiencyByLevelTable; 
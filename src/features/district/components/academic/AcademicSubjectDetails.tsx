import React, { useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { 
  AssessmentSubject, 
  selectCurrentAssessmentDistrictData, 
  selectSelectedSubjectId,
  selectSelectedGradeId,
  selectSelectedSubgroupId,
  setSelectedGradeId,
  setSelectedSubgroupId,
  resetFilters
} from '@/store/slices/assessmentSlice';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  getUniqueGrades, 
  getUniqueSubgroups, 
  filterAssessmentResults, 
  ExtendedGrade,
  ExtendedSubgroup,
  ALL_STUDENTS_SUBGROUP_ID
} from '@/features/district/utils/assessmentDataProcessing';
import { FISCAL_YEAR } from '@/utils/environment';
import AcademicHistoryChart from './AcademicHistoryChart';

interface AcademicSubjectDetailsProps {
  subject: AssessmentSubject | null;
}

const AcademicSubjectDetails: React.FC<AcademicSubjectDetailsProps> = ({ subject }) => {
  const dispatch = useAppDispatch();
  
  // Get assessment district data from Redux store
  const assessmentData = useAppSelector(selectCurrentAssessmentDistrictData);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);
  const selectedGradeId = useAppSelector(selectSelectedGradeId);
  const selectedSubgroupId = useAppSelector(selectSelectedSubgroupId);
  
  // Filter assessment data by current fiscal year
  const filteredByYearSubjectData = filterAssessmentResults(assessmentData, {
    year: FISCAL_YEAR,
    assessment_subject_id: selectedSubjectId || undefined
  });

  const filteredByYearAndGradeData = filterAssessmentResults(filteredByYearSubjectData, {
    year: FISCAL_YEAR,
    grade_id: selectedGradeId || undefined
  });

  const filteredByYearAndSubgroupData = filterAssessmentResults(filteredByYearSubjectData, {
    year: FISCAL_YEAR,
    assessment_subgroup_id: selectedSubgroupId || undefined
  });
  
  // Get unique grades and subgroups from filtered assessment data
  const grades: ExtendedGrade[] = getUniqueGrades(filteredByYearAndSubgroupData);
  const subgroups: ExtendedSubgroup[] = getUniqueSubgroups(filteredByYearAndGradeData);
  
  // Apply filters based on the selected subgroup
  let filteredData = [];
  
  // If a non-All Students subgroup is selected, get both All Students and the selected subgroup data
  if (selectedSubgroupId !== null && selectedSubgroupId !== ALL_STUDENTS_SUBGROUP_ID) {
    // Get All Students data with other filters
    const allStudentsData = filterAssessmentResults(assessmentData, {
      year: FISCAL_YEAR,
      assessment_subject_id: selectedSubjectId || undefined,
      grade_id: selectedGradeId || undefined,
      assessment_subgroup_id: ALL_STUDENTS_SUBGROUP_ID
    });
    
    // Get selected subgroup data with other filters
    const selectedSubgroupData = filterAssessmentResults(assessmentData, {
      year: FISCAL_YEAR,
      assessment_subject_id: selectedSubjectId || undefined,
      grade_id: selectedGradeId || undefined,
      assessment_subgroup_id: selectedSubgroupId
    });
    
    // Combine the two datasets
    filteredData = [...allStudentsData, ...selectedSubgroupData];
  } else {
    // Just use the regular filtered data for All Students or when no subgroup is selected
    filteredData = filterAssessmentResults(assessmentData, {
      year: FISCAL_YEAR,
      assessment_subject_id: selectedSubjectId || undefined,
      grade_id: selectedGradeId || undefined,
      assessment_subgroup_id: selectedSubgroupId || undefined
    });
  }
  
  // Handle selection changes
  const handleGradeChange = (value: number | '') => {
    dispatch(setSelectedGradeId(value === '' ? null : value));
  };
  
  const handleSubgroupChange = (value: number | '') => {
    dispatch(setSelectedSubgroupId(value === '' ? null : value));
  };
  
  // Reset filters when subject changes
  useEffect(() => {
    dispatch(resetFilters());
  }, [selectedSubjectId, dispatch]);
  

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom>
        {subject ? subject.description : 'No Subject Selected'} Results
      </Typography>
      
      {/* Filter controls */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="subgroup-select-label">Subgroup</InputLabel>
            <Select
              labelId="subgroup-select-label"
              id="subgroup-select"
              value={selectedSubgroupId !== null ? selectedSubgroupId : ''}
              label="Subgroup"
              onChange={(e) => handleSubgroupChange(e.target.value as number | '')}
            >
              {subgroups.map((subgroup) => (
                <MenuItem key={subgroup.id} value={subgroup.id} disabled={subgroup.disabled}>
                  {subgroup.name}{subgroup.disabled ? ' (Too Few Students)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="grade-select-label">Grade</InputLabel>
            <Select
              labelId="grade-select-label"
              id="grade-select"
              value={selectedGradeId !== null ? selectedGradeId : ''}
              label="Grade"
              onChange={(e) => handleGradeChange(e.target.value as number | '')}
            >
              {grades.map((grade) => (
                <MenuItem key={grade.id} value={grade.id} disabled={grade.disabled}>
                  {grade.name}{grade.disabled ? ' (Too Few Students)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {/* Display the filtered assessment data as a table */}
      {filteredData.length > 0 ? (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="assessment results table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell>Grade</TableCell>
                <TableCell>Subgroup</TableCell>
                <TableCell align="right">Level 1 %</TableCell>
                <TableCell align="right">Level 2 %</TableCell>
                <TableCell align="right">Level 3 %</TableCell>
                <TableCell align="right">Level 4 %</TableCell>
                <TableCell align="right">Above Proficient %</TableCell>
                <TableCell align="right">Participation %</TableCell>
                <TableCell align="right">Student Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{row.grade?.name || 'All Grades'}</TableCell>
                  <TableCell>{row.assessment_subgroup?.name || 'All Students'}</TableCell>
                  <TableCell align="right">
                    {row.level_1_percentage_exception || 
                     (row.level_1_percentage !== null ? `${row.level_1_percentage.toFixed(1)}%` : 'N/A')}
                  </TableCell>
                  <TableCell align="right">
                    {row.level_2_percentage_exception || 
                     (row.level_2_percentage !== null ? `${row.level_2_percentage.toFixed(1)}%` : 'N/A')}
                  </TableCell>
                  <TableCell align="right">
                    {row.level_3_percentage_exception || 
                     (row.level_3_percentage !== null ? `${row.level_3_percentage.toFixed(1)}%` : 'N/A')}
                  </TableCell>
                  <TableCell align="right">
                    {row.level_4_percentage_exception || 
                     (row.level_4_percentage !== null ? `${row.level_4_percentage.toFixed(1)}%` : 'N/A')}
                  </TableCell>
                  <TableCell align="right">
                    {row.above_proficient_percentage_exception || 
                     (row.above_proficient_percentage !== null ? `${row.above_proficient_percentage.toFixed(1)}%` : 'N/A')}
                  </TableCell>
                  <TableCell align="right">
                    {row.participate_percentage !== null ? `${row.participate_percentage.toFixed(1)}%` : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    {row.total_fay_students_low === row.total_fay_students_high
                      ? row.total_fay_students_low
                      : `${row.total_fay_students_low}-${row.total_fay_students_high}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1" color="error" sx={{ mt: 2 }}>
          No assessment data found for the selected filters.
        </Typography>
      )}
      
      {/* Historical trend chart */}
      {selectedSubjectId && <AcademicHistoryChart />}
    </Box>
  );
};

export default AcademicSubjectDetails;
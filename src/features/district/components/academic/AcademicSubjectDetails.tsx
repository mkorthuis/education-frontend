import React, { useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
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
import DistrictAcademicPerformance from './DistrictAcademicPerformance';
import SubjectOverviewCard from './SubjectOverviewCard';
import ProficiencyByLevelTable from './ProficiencyByLevelTable';

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
//   useEffect(() => {
//     dispatch(resetFilters());
//   }, [selectedSubjectId, dispatch]);
  

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" sx={{mb: 3}}>
        {subject ? subject.description : 'No Subject Selected'} State Assessment Results 
      </Typography>
      
      {/* Filter controls */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <FormControl fullWidth >
            <InputLabel id="subgroup-select-label">Filter By Subgroup</InputLabel>
            <Select
              labelId="subgroup-select-label"
              id="subgroup-select"
              value={selectedSubgroupId !== null ? selectedSubgroupId : ''}
              label="Filter By Subgroup"
              onChange={(e) => handleSubgroupChange(e.target.value as number | '')}
            >
              {subgroups.map((subgroup) => (
                <MenuItem key={subgroup.id} value={subgroup.id} disabled={subgroup.disabled}>
                  {subgroup.name}{subgroup.disabled ? ' (Too Few Students)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="grade-select-label">Filter By Grade</InputLabel>
            <Select
              labelId="grade-select-label"
              id="grade-select"
              value={selectedGradeId !== null ? selectedGradeId : ''}
              label="Filter By Grade"
              onChange={(e) => handleGradeChange(e.target.value as number | '')}
            >
              {grades.map((grade) => (
                <MenuItem key={grade.id} value={grade.id} disabled={grade.disabled}>
                  {grade.name}{grade.disabled ? ' (Too Few Students)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* First row: SubjectOverviewCard and ProficiencyByLevelTable side by side using flex */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, mb: 3, gap: 2 }}>
        <Box sx={{ flex: 1, mb: 1 }}>
          {filteredData.length > 0 && <SubjectOverviewCard />}
        </Box>
        <Box sx={{ flex: 1 }}>
          {selectedSubjectId && <ProficiencyByLevelTable districtName={filteredData[0]?.district_name} />}
        </Box>
      </Box>
      
      {/* Second row: AcademicHistoryChart (on left) and DistrictAcademicPerformance side by side using flex */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          {selectedSubjectId && <AcademicHistoryChart />}
        </Box>
        <Box sx={{ flex: 1 }}>
          {selectedSubjectId && <DistrictAcademicPerformance />}
        </Box>
      </Box>
    </Box>
  );
};

export default AcademicSubjectDetails;
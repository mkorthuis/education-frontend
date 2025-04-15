import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { AssessmentStateData } from '@/store/slices/assessmentSlice';
import {
  AssessmentDataType,
  EntityType,
  getEntityLabel,
  formatPercentage
} from './utils/academicUtils';
import {
  ALL_STUDENTS_SUBGROUP_ID,
  ALL_GRADES_ID
} from '@/features/district/utils/assessmentDataProcessing';

export interface SubjectOverviewCardProps {
  assessmentData: AssessmentDataType | null;
  stateAssessmentData: AssessmentStateData | null;
  selectedGradeId: number | null;
  selectedSubgroupId: number | null;
  entityType: EntityType;
}

function SubjectOverviewCard({
  assessmentData,
  stateAssessmentData,
  selectedGradeId,
  selectedSubgroupId,
  entityType
}: SubjectOverviewCardProps) {
  // Return empty if no data is available
  if (!assessmentData) {
    return null;
  }
  
  // Handle potential null values and exceptions
  const proficiencyPercentage = formatPercentage(
    assessmentData.above_proficient_percentage,
    assessmentData.above_proficient_percentage_exception
  );
  
  // Safely handle state percentage in cases where stateAssessmentData might be null
  const statePercentage = stateAssessmentData 
    ? formatPercentage(
        stateAssessmentData.above_proficient_percentage,
        stateAssessmentData.above_proficient_percentage_exception
      )
    : 'N/A';
  
  const participationRate = assessmentData.participate_percentage !== null
    ? `${assessmentData.participate_percentage.toFixed(1)}%`
    : 'N/A';
  
  // Get grade name but don't display if it's All Grades
  const gradeId = assessmentData.grade?.id || selectedGradeId;
  const gradeName = (gradeId === ALL_GRADES_ID || gradeId === null) 
    ? '' 
    : `${assessmentData.grade?.name || ''} `;
  
  // Get subgroup name but don't display if it's All Students
  const subgroupId = assessmentData.assessment_subgroup?.id || selectedSubgroupId;
  const subgroupName = (subgroupId === ALL_STUDENTS_SUBGROUP_ID || subgroupId === null) 
    ? '' 
    : `${assessmentData.assessment_subgroup?.name || ''} `;
  
  const studentCount = assessmentData.total_fay_students_low === assessmentData.total_fay_students_high
    ? assessmentData.total_fay_students_low
    : `${assessmentData.total_fay_students_low}-${assessmentData.total_fay_students_high}`;

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', backgroundColor: 'grey.100' }}>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            {proficiencyPercentage} {gradeName}{subgroupName}Students Meet Grade Level Proficiency.
          </Typography>
          {entityType !== 'state' && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {statePercentage} State Average
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Typography variant="body1">
            {studentCount} {gradeName}{subgroupName}Students Took The Test.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {participationRate} Participation Rate.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default SubjectOverviewCard; 
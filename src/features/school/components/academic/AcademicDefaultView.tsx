import React from 'react';
import { Box, Typography } from '@mui/material';
import { AssessmentSchoolData } from '@/store/slices/assessmentSlice';

interface AcademicDefaultViewProps {
  assessmentData: AssessmentSchoolData[];
  fiscalYear: string;
}

const AcademicDefaultView: React.FC<AcademicDefaultViewProps> = ({ 
  assessmentData, 
  fiscalYear 
}) => {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5">
        Welcome to the School Academic Performance Overview Page
      </Typography>
      <Typography variant="body1" sx={{ mt: 2, }}>
        Please select a subject to view detailed information.
      </Typography>
      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
        More information about College Readiness coming soon.
      </Typography>
    </Box>
  );
};

export default AcademicDefaultView; 
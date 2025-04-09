import React from 'react';
import { Box, Typography } from '@mui/material';
import { AssessmentDistrictData } from '@/store/slices/assessmentSlice';

interface AcademicDefaultViewProps {
  assessmentData: AssessmentDistrictData[];
  fiscalYear: string;
}

const AcademicDefaultView: React.FC<AcademicDefaultViewProps> = ({ 
  assessmentData, 
  fiscalYear 
}) => {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom>
        District Performance Overview
      </Typography>
      <Typography variant="body1">
        {assessmentData.length > 0 
          ? `Loaded ${assessmentData.length} assessment records for year ${fiscalYear}.` 
          : 'No assessment data available.'}
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Please select a subject from the cards on the left to view detailed information.
      </Typography>
    </Box>
  );
};

export default AcademicDefaultView; 
import React from 'react';
import { Card, CardContent, Typography, Paper } from '@mui/material';
import { AssessmentSubject, setSelectedSubjectId } from '@/store/slices/assessmentSlice';
import { useAppDispatch } from '@/store/hooks';

interface MeasurementCardProps {
  assessment_subject?: AssessmentSubject;
  value?: number | null;
}

const MeasurementCard: React.FC<MeasurementCardProps> = ({
  assessment_subject,
  value = null
}) => {
  const dispatch = useAppDispatch();
  
  const handleCardClick = () => {
    if (assessment_subject && assessment_subject.id) {
      dispatch(setSelectedSubjectId(assessment_subject.id));
    }
  };

  return (
    <Card 
      elevation={2}
      sx={{
        minWidth: 200,
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
          cursor: 'pointer'
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Typography variant="h6" component="div" fontWeight="bold" sx={{ mb: 1.5 }}>
          {assessment_subject?.description}
        </Typography>
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: 'primary.light', 
            p: 2, 
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
            {value !== null ? value : 'N/A'}
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default MeasurementCard;

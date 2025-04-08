import React from 'react';
import { Box, Card, CardContent, Typography, Paper } from '@mui/material';
import { Measurement } from '@/store/slices/measurementSlice';

interface MeasurementCardProps {
  title?: string;
  value?: string | number;
  type?: string;
  measurement?: Measurement;
}

const MeasurementCard: React.FC<MeasurementCardProps> = ({
  title = 'Measurement Title',
  value = '75%',
  type = 'Academic',
  measurement
}) => {
  // If a measurement is provided, use its data instead of the defaults
  const displayTitle = measurement?.name || title;
  const displayValue = measurement?.value || value;
  const displayType = measurement?.measurement_type?.name || type;

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
        }
      }}
    >
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {displayType}
        </Typography>
        <Typography variant="h6" component="div" fontWeight="bold" sx={{ mb: 1.5 }}>
          {displayTitle}
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
            {displayValue}
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default MeasurementCard;

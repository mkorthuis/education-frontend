import React from 'react';
import { Box, Divider, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DefaultCategoryDetails from '@/components/ui/safety/DefaultCategoryDetails';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import EntityTruancyHistoryChart from './subCategory/EntityTruancyHistoryChart';
import EntityTruancyDetailsTable from './subCategory/EntityTruancyDetailsTable';
import { EntityKind } from '@/features/entity/entity';

const EntityTruancyCategoryDetails: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  // Subscribed but unused, as in the school copy this replaces (the district copy did not subscribe).
  useAppSelector(state => kind === 'school' ? selectCurrentSchool(state) : undefined);

  return (
    <DefaultCategoryDetails title="Truancy Overview">
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Box sx={{ width: isLargeScreen ? '70%' : '100%', mb: 2 }}>
          <Typography variant="body1">
            Truancy is defined as ten half-days of unexcused absence during a school year.
          </Typography>
        </Box>
        <Box sx={{ width: isLargeScreen ? '70%' : '100%', mb: 3 }}>
          <Typography variant="body1">
            Definition may vary by district, but unexcused absenses generally DON'T include illness, school-sponsored activities, 
            medical appointments, family deaths, religious observances, and court attendance.
          </Typography>
        </Box>
        <Divider sx={{width: isLargeScreen ? '70%' : '100%'}} />
        {/* Display components with responsive width */}
        <Box sx={{ width: isLargeScreen ? '70%' : '100%', mb: 2 }}>
          {/* Display the truancy details table */}
          <EntityTruancyDetailsTable kind={kind} />
        </Box>
        <Divider sx={{width: isLargeScreen ? '70%' : '100%',mt:2, mb:1}} />
        <Box sx={{ width: isLargeScreen ? '70%' : '100%' }}>
          {/* Display the truancy history chart */}
          <EntityTruancyHistoryChart kind={kind} />
        </Box>
      </Box>
    </DefaultCategoryDetails>
  );
};

export default EntityTruancyCategoryDetails;

import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery, Divider } from '@mui/material';
import DefaultCategoryDetails from '@/components/ui/safety/DefaultCategoryDetails';
import EntityBullyTrendChart from './subCategory/EntityBullyTrendChart';
import EntityBullyClassificationTable from './subCategory/EntityBullyClassificationTable';
import EntityBullyImpactTable from './subCategory/EntityBullyImpactTable';
import { FISCAL_YEAR } from '@/utils/environment';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentSchool } from '@/store/slices/locationSlice';
import { EntityKind } from '@/features/entity/entity';

const EntityBullyCategoryDetails: React.FC<{ kind: EntityKind }> = ({ kind }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  // Subscribed but unused, as in the school copy this replaces (the district copy did not subscribe).
  useAppSelector(state => kind === 'school' ? selectCurrentSchool(state) : undefined);

  // Get default fiscal year from environment and initialize shared state
  const defaultFiscalYear = parseInt(FISCAL_YEAR);
  const [selectedYear, setSelectedYear] = useState<string | number>(defaultFiscalYear);

  // Handler to update the selected year from either table
  const handleYearChange = (year: string | number) => {
    setSelectedYear(year);
  };

  return (
    <DefaultCategoryDetails title="Bullying Overview">
      <Box
        sx={{
          display: 'flex',
          flexDirection: isLargeScreen ? 'row' : 'column',
          gap: 2,
          width: '100%'
        }}
      >
        <Box sx={{
          flex: isLargeScreen ? 1 : 'auto',
          width: isMobile ? '100%' : 'auto'
        }}>
          <EntityBullyClassificationTable
            kind={kind}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />
          {isMobile && <Divider sx={{ mt: 3 }} />}
        </Box>
        <Box sx={{
          flex: isLargeScreen ? 1 : 'auto',
          width: isMobile ? '100%' : 'auto'
        }}>
          <EntityBullyImpactTable
            kind={kind}
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
          />
        </Box>
      </Box>

      {isMobile && <Divider sx={{ mt: 3 }} />}

      <Box sx={{ width: '100%' }}>
        <EntityBullyTrendChart kind={kind} />
      </Box>
    </DefaultCategoryDetails>
  );
};

export default EntityBullyCategoryDetails;

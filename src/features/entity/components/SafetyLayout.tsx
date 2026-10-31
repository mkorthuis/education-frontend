import React from 'react';
import { Box, Typography, CircularProgress, Divider } from '@mui/material';
import { SafetyPage } from '@/store/slices/safetySlice';
import { EntityKind } from '@/features/entity/entity';

// Import card components
import EntityBullyCard from './safety/card/EntityBullyCard';
import EntityHarassmentCard from './safety/card/EntityHarassmentCard';
import EntityTruancyCard from './safety/card/EntityTruancyCard';
import EntitySuspensionCard from './safety/card/EntitySuspensionCard';
import EntityRestraintCard from './safety/card/EntityRestraintCard';
import EntitySeriousSafetyCard from './safety/card/EntitySeriousSafetyCard';

// Import category detail components
import EntityBullyCategoryDetails from './safety/category/EntityBullyCategoryDetails';
import EntityHarassmentCategoryDetails from './safety/category/EntityHarassmentCategoryDetails';
import EntityRestraintCategoryDetails from './safety/category/EntityRestraintCategoryDetails';
import EntitySuspensionCategoryDetails from './safety/category/EntitySuspensionCategoryDetails';
import EntityTruancyCategoryDetails from './safety/category/EntityTruancyCategoryDetails';
import DefaultCategoryDetails from '@/components/ui/safety/DefaultCategoryDetails';

// On mobile, the school page adds a divider under its notice only when there is one;
// the district page always adds one.
const MOBILE_NOTICE_DIVIDER: Record<EntityKind, (notice: React.ReactNode) => React.ReactNode> = {
  school: notice => notice && <Divider sx={{mb: 2, mt: 2}}/>,
  district: () => <Divider sx={{mb: 2}}/>
};

interface SafetyLayoutProps {
  kind: EntityKind;
  selectedSafetyPage: SafetyPage | null;
  isMobile: boolean;
  title: React.ReactNode;
  isLoading: boolean;
  desktopNotice: React.ReactNode;
  mobileNotice: React.ReactNode;
  SeriousCategoryDetails: React.ComponentType;
}

const SafetyLayout: React.FC<SafetyLayoutProps> = ({
  kind,
  selectedSafetyPage,
  isMobile,
  title,
  isLoading,
  desktopNotice,
  mobileNotice,
  SeriousCategoryDetails
}) => {
  // Card container styling for responsive layout
  const cardContainerStyles = {
    marginRight: { xs: 0, md: '16px' },
    display: 'flex',
    flexDirection: {
      xs: selectedSafetyPage ? 'column' : 'column',
      md: 'column'
    },
    flexWrap: { xs: 'nowrap', md: 'nowrap' },
    width: { xs: '100%', md: '300px'},
    gap: 0,
    flexShrink: 0,
    mb: selectedSafetyPage ? 2 : 0,
    justifyContent: 'flex-start'
  };

  // Styles for card rows on mobile when safety category is selected
  const firstRowStyles = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    mb: selectedSafetyPage ? 1 : 0
  };

  const secondRowStyles = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  };

  // Function to render the appropriate category details based on selection
  const renderCategoryDetails = () => {
    switch(selectedSafetyPage) {
      case 'bullying':
        return <EntityBullyCategoryDetails kind={kind} />;
      case 'harassment':
        return <EntityHarassmentCategoryDetails kind={kind} />;
      case 'restraint':
        return <EntityRestraintCategoryDetails kind={kind} />;
      case 'serious':
        return <SeriousCategoryDetails />;
      case 'suspension':
        return <EntitySuspensionCategoryDetails kind={kind} />;
      case 'truancy':
        return <EntityTruancyCategoryDetails kind={kind} />;
      default:
        return (
          isMobile ? (<></>) : (
            <DefaultCategoryDetails title="Select A Card For More Information">
              {desktopNotice}
            </DefaultCategoryDetails>
          )
        );
    }
  };

  return (
    <>
      {title}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
          {/* Mobile instruction text - only visible on mobile and when no subject is selected */}
          {!selectedSafetyPage && (
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 1 }}>
              <Typography variant="body1" sx={{mb: 2}}>
                Please Click A Card For More Information
              </Typography>
              <Divider sx={{mb: 2}}/>
              {mobileNotice}
              {MOBILE_NOTICE_DIVIDER[kind](mobileNotice)}
            </Box>
          )}

          <Box sx={cardContainerStyles}>
            {selectedSafetyPage ? (
              // On mobile with safety category selected, show cards in two rows
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Box sx={firstRowStyles}>
                  <EntityBullyCard kind={kind} />
                  <EntityHarassmentCard kind={kind} />
                  <EntitySuspensionCard kind={kind} />
                </Box>
                <Box sx={secondRowStyles}>
                  <EntityRestraintCard kind={kind} />
                  <EntityTruancyCard kind={kind} />
                  <EntitySeriousSafetyCard kind={kind} />
                </Box>
              </Box>
            ) : null}

            {/* Standard display for desktop or mobile with no category selected */}
            <Box sx={{ display: { xs: selectedSafetyPage ? 'none' : 'block', md: 'block' } }}>
              <EntityBullyCard kind={kind} />
              <EntityHarassmentCard kind={kind} />
              <EntitySuspensionCard kind={kind} />
              <EntityRestraintCard kind={kind} />
              <EntityTruancyCard kind={kind} />
              <EntitySeriousSafetyCard kind={kind} />
            </Box>
          </Box>
          {renderCategoryDetails()}
        </Box>
      )}
    </>
  );
};

export default SafetyLayout;

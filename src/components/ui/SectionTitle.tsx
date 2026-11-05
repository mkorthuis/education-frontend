import React from 'react';
import { Typography, Divider, Box, SxProps, Theme, useMediaQuery, useTheme } from '@mui/material';

interface SectionTitleProps {
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
  withDivider?: boolean;
  displayName?: string;
  districtName?: string;
  schoolName?: string;
  // Any other subject, e.g. "New Hampshire" on the State pages
  entityName?: string;
  // Heading element; the look stays the same (pages that use this as their main title pass "h1")
  component?: React.ElementType;
  // Phones show the district, school or other subject on a second line under the title; false leaves it off
  showEntityOnPhone?: boolean;
}

/**
 * A common section title component used across school and district pages
 * to maintain consistent styling for headers.
 */
const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  sx = {},
  displayName = '',
  districtName = '',
  schoolName = '',
  entityName = '',
  withDivider = true,
  component = 'h5',
  showEntityOnPhone = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box>
      <Typography 
        variant="h5" 
        component={component}
        gutterBottom 
        sx={{ 
          fontWeight: 500,
          mt: isMobile ? 0 : 1,
          mb: isMobile ? (showEntityOnPhone ? 0 : 2) : 0.5,
          lineHeight: isMobile ? 1.2 : 1.5,
          ...sx 
        }}
      >
        {isMobile ? displayName : (
          <>
            {displayName} <Box component="span">
              {districtName && `for ${districtName} School District`}
              {schoolName && !districtName && `for ${schoolName}`}
              {entityName && !districtName && !schoolName && `for ${entityName}`}
            </Box>
          </>
        )}
      </Typography>
      {!isMobile && withDivider && <Divider sx={{ mb: 2 }} /> }
      {isMobile && showEntityOnPhone && (
        <Typography 
          variant="subtitle1" 
          sx={{ 
            mb: 2,
            color: 'text.secondary',
            fontStyle: 'italic'
          }}
        >
          {districtName || schoolName || entityName}
        </Typography>
      )}
    </Box>
  );
  };

export default SectionTitle; 
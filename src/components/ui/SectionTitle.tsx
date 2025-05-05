import React from 'react';
import { Typography, Divider, Box, SxProps, Theme, useMediaQuery, useTheme } from '@mui/material';

interface SectionTitleProps {
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
  withDivider?: boolean;
  displayName?: string;
  districtName?: string;
  schoolName?: string;
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
  withDivider = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          fontWeight: 500,
          mt: isMobile ? 0 : 1,
          mb: isMobile ? 0 : 0.5,
          lineHeight: isMobile ? 1.2 : 1.5,
          ...sx 
        }}
      >
        {isMobile ? displayName : (
          <>
            {displayName} <Box component="span">
              {districtName && `for ${districtName} School District`}
              {schoolName && !districtName && `for ${schoolName}`}
            </Box>
          </>
        )}
      </Typography>
      {!isMobile && withDivider && <Divider sx={{ mb: 2 }} /> }
      {isMobile && (
        <Typography 
          variant="subtitle1" 
          sx={{ 
            mb: 2,
            color: 'text.secondary',
            fontStyle: 'italic'
          }}
        >
          {districtName ? districtName : schoolName}
        </Typography>
      )}
    </Box>
  );
  };

export default SectionTitle; 
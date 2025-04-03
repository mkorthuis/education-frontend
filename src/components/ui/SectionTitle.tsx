import React from 'react';
import { Typography, Divider, Box, SxProps, Theme } from '@mui/material';

interface SectionTitleProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  withDivider?: boolean;
}

/**
 * A common section title component used across school and district pages
 * to maintain consistent styling for headers.
 */
const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  sx = {}, 
  withDivider = true 
}) => {
  return (
    <Box>
      {withDivider && <Divider sx={{ mb: 2 }} />}
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          fontWeight: 500,
          mb: 2,
          ...sx 
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

export default SectionTitle; 
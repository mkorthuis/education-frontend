import React from 'react';
import { Box, Divider, SxProps, Theme, Typography } from '@mui/material';
import { type } from '@/theme/tokens';

/** A section's h2 ("Key Statewide Figures"): one step below the page title, with the same rule beneath. */
const SectionHeading: React.FC<{ children: React.ReactNode; id?: string; sx?: SxProps<Theme> }> = ({ children, id, sx }) => (
  <Box sx={[{ mt: { xs: 1, sm: 2 }, mb: 2 }, ...(Array.isArray(sx) ? sx : [sx])]}>
    <Typography id={id} component="h2" sx={{ ...type.sectionTitle, lineHeight: { xs: 1.2, sm: 1.5 }, m: 0, mb: { xs: 0, sm: 0.5 } }}>
      {children}
    </Typography>
    {/* Like the page title, the rule shows from tablets up */}
    <Divider sx={{ display: { xs: 'none', sm: 'block' } }} />
  </Box>
);

export default SectionHeading;

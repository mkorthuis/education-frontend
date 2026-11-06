import React from 'react';
import { Box } from '@mui/material';

/** Charts and tables side by side on desktop, each an equal share of the row; stacked below that. */
const ChartRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, '& > *': { flex: 1, minWidth: 0 } }}>
    {children}
  </Box>
);

export default ChartRow;

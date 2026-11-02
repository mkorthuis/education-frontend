import React from 'react';
import { Alert, Box, Button } from '@mui/material';

interface LoadErrorAlertProps {
  message: string;
  onRetry: () => void;
}

/**
 * Shown in place of a page's content when one of its data requests failed,
 * so a failure doesn't look like a spinner that never ends.
 */
const LoadErrorAlert: React.FC<LoadErrorAlertProps> = ({ message, onRetry }) => (
  <Box sx={{ my: 4 }}>
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      }
    >
      {message}
    </Alert>
  </Box>
);

export default LoadErrorAlert;

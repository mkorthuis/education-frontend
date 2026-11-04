import React from 'react';
import { Link } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import SectionTitle from '@/components/ui/SectionTitle';
import LoadErrorAlert from '@/components/ui/LoadErrorAlert';
import { PageLoadStatus } from '@/store/utils/loadingState';

export const STATE_NAME = 'New Hampshire';

interface StatePageProps {
  displayName: string;
  status: PageLoadStatus;
  onRetry: () => void;
  errorMessage: string;
  /** One or two plain-language sentences on what the page shows */
  intro?: React.ReactNode;
  /** Where the figures come from, shown under the content */
  source: string;
  children: React.ReactNode;
}

/** Title, intro, loading/error handling and source note shared by every State page. */
const StatePage: React.FC<StatePageProps> = ({ displayName, status, onRetry, errorMessage, intro, source, children }) => (
  <>
    <SectionTitle displayName={displayName} entityName={STATE_NAME} />
    {intro && (
      <Typography variant="body1" sx={{ mb: 3, maxWidth: 900 }}>{intro}</Typography>
    )}

    {status === 'failed' ? (
      <LoadErrorAlert message={errorMessage} onRetry={onRetry} />
    ) : status === 'loading' ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    ) : (
      <>
        {children}
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 4 }}>
          Source: {source}. See <Link to="/datasources">Data Sources</Link> for details.
        </Typography>
      </>
    )}
  </>
);

export default StatePage;

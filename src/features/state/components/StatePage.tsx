import React from 'react';
import { Link } from 'react-router-dom';
import { Box, CircularProgress, GlobalStyles, Typography } from '@mui/material';
import SectionTitle from '@/components/ui/SectionTitle';
import LoadErrorAlert from '@/components/ui/LoadErrorAlert';
import { PageLoadStatus } from '@/store/utils/loadingState';
import DistrictPicker from './DistrictPicker';
import { Note } from '@/components/ds';
import { READING_WIDTH } from './chartText';

export const STATE_NAME = 'New Hampshire';

interface StatePageProps {
  displayName: string;
  /** Shown after the title ("for New Hampshire"); the overview's title already says it */
  entityName?: string;
  status: PageLoadStatus;
  onRetry: () => void;
  errorMessage: string;
  /** One or two plain-language sentences on what the page shows */
  intro?: React.ReactNode;
  /** Headline numbers, shown once the data has loaded */
  keyFigures?: React.ReactNode;
  /** The matching district page (e.g. "financials"), for the "see your district" picker */
  districtSection?: string;
  /** What people look for here that the page doesn't have, and where it might be */
  notCovered?: React.ReactNode;
  /** Where the figures come from, shown under the content; the overview leaves it out */
  source?: string;
  children: React.ReactNode;
}

/** Title, intro, key figures, loading/error handling and source note shared by every State page. */
const StatePage: React.FC<StatePageProps> = ({
  displayName,
  entityName = STATE_NAME,
  status,
  onRetry,
  errorMessage,
  intro,
  keyFigures,
  districtSection,
  notCovered,
  source,
  children,
}) => (
  <>
    {/* Keeps keyboard focus and in-page jumps clear of the fixed header and section tabs */}
    <GlobalStyles styles={{ html: { scrollPaddingTop: 128 } }} />
    <SectionTitle displayName={displayName} entityName={entityName} component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />
    {intro && (
      <Typography variant="body1" sx={{ mb: 3, maxWidth: READING_WIDTH }}>{intro}</Typography>
    )}

    {status === 'failed' ? (
      <LoadErrorAlert message={errorMessage} onRetry={onRetry} />
    ) : status === 'loading' ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress aria-label="Loading" />
      </Box>
    ) : (
      <>
        {keyFigures}
        {districtSection && <DistrictPicker section={districtSection} />}
        {children}
        {notCovered && (
          <Box sx={{ mt: 4 }}>
            <Note title="Not on this page">{notCovered}</Note>
          </Box>
        )}
        {source && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 4, maxWidth: READING_WIDTH }}>
            Source: {source}. See <Link to="/datasources">Data Sources</Link> for details.
          </Typography>
        )}
      </>
    )}
  </>
);

export default StatePage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, CircularProgress, Divider, GlobalStyles, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
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
  /** On wide screens, show the key figures to the right of the intro instead of under it */
  keyFiguresBesideIntro?: boolean;
  /** The matching district page (e.g. "financials"), for the "see your district" picker */
  districtSection?: string;
  /** What people look for here that the page doesn't have, and where it might be */
  notCovered?: React.ReactNode;
  /** Saves everything on the page as one Excel file, from a button beside the title (tablets and up) */
  onDownload?: () => Promise<void> | void;
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
  keyFiguresBesideIntro = false,
  districtSection,
  notCovered,
  onDownload,
  source,
  children,
}) => {
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    if (!onDownload) return;
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  };
  const loaded = status !== 'failed' && status !== 'loading';
  const besideIntro = keyFiguresBesideIntro && Boolean(intro) && loaded;
  return (
    <>
      {/* Keeps keyboard focus and in-page jumps clear of the fixed header and section tabs */}
      <GlobalStyles styles={{ html: { scrollPaddingTop: 128 } }} />
      {onDownload ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', columnGap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <SectionTitle displayName={displayName} entityName={entityName} component="h1" showEntityOnPhone={false} withDivider={false} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />
            </Box>
            {/* No download on phones, as with the charts' CSV links */}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={download}
              disabled={downloading || status !== 'ready'}
              sx={{ display: { xs: 'none', sm: 'inline-flex' }, flexShrink: 0, mt: 1.25, textTransform: 'none' }}
            >
              Download Excel
            </Button>
          </Box>
          <Divider sx={{ display: { xs: 'none', sm: 'block' }, mb: 2 }} />
        </>
      ) : (
        <SectionTitle displayName={displayName} entityName={entityName} component="h1" showEntityOnPhone={false} sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />
      )}
      <Box
        sx={besideIntro
          ? {
              display: { lg: 'grid' },
              gridTemplateColumns: { lg: 'minmax(0, 5fr) minmax(0, 7fr)' },
              columnGap: 4,
              alignItems: 'start',
              mb: { lg: 4 },
              // Side by side, the row as a whole keeps the space below, not the text and tiles each
              '& > *': { mb: { lg: 0 } },
            }
          : undefined}
      >
        {intro && (
          <Typography variant="body1" sx={{ mb: 3, maxWidth: READING_WIDTH }}>{intro}</Typography>
        )}
        {besideIntro && keyFigures}
      </Box>

      {status === 'failed' ? (
        <LoadErrorAlert message={errorMessage} onRetry={onRetry} />
      ) : status === 'loading' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress aria-label="Loading" />
        </Box>
      ) : (
        <>
          {!besideIntro && keyFigures}
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
};

export default StatePage;

import React, { useState } from 'react';
import { Box, Button, CircularProgress, Divider, GlobalStyles, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SectionTitle from '@/components/ui/SectionTitle';
import LoadErrorAlert from '@/components/ui/LoadErrorAlert';
import { PageLoadStatus } from '@/store/utils/loadingState';
import { keepYearsTogether, READING_WIDTH } from './chartText';

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
  /** Sentences built from the key figures, shown as the intro's second paragraph */
  takeaway?: string[];
  /** Headline numbers, shown once the data has loaded */
  keyFigures?: React.ReactNode;
  /** On wide screens, show the key figures to the right of the intro instead of under it */
  keyFiguresBesideIntro?: boolean;
  /** Saves everything on the page as one Excel file, from a button beside the title (tablets and up) */
  onDownload?: () => Promise<void> | void;
  children: React.ReactNode;
}

/** Title, intro, key figures and loading/error handling shared by every State page. */
const StatePage: React.FC<StatePageProps> = ({
  displayName,
  entityName = STATE_NAME,
  status,
  onRetry,
  errorMessage,
  intro,
  takeaway = [],
  keyFigures,
  keyFiguresBesideIntro = false,
  onDownload,
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
          <Typography variant="body1" sx={{ mb: 3, maxWidth: READING_WIDTH }}>
            {intro}
            {/* A second paragraph within the intro, so the tiles sit beside both on wide screens */}
            {takeaway.length > 0 && (
              <Box component="span" sx={{ display: 'block', mt: 2 }}>{keepYearsTogether(takeaway.join(' '))}</Box>
            )}
          </Typography>
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
          {children}
        </>
      )}
    </>
  );
};

export default StatePage;

import React, { useState } from 'react';
import { Typography, Divider, Box, Button, SxProps, Theme, useMediaQuery, useTheme } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface SectionTitleProps {
  // Shown at the end of the title (on phones, on a line under the place's name), e.g. a note on what the page's figures are
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
  withDivider?: boolean;
  displayName?: string;
  districtName?: string;
  schoolName?: string;
  // Any other subject, e.g. "New Hampshire" on the State pages
  entityName?: string;
  // Heading element; the look stays the same
  component?: React.ElementType;
  // The page's own title, as on the State, district and school pages: an h1, a size up from section titles
  pageTitle?: boolean;
  // Phones show the district, school or other subject on a second line under the title; false leaves it off
  showEntityOnPhone?: boolean;
  // Saves everything on the page as one Excel file, from a button beside the title (tablets and up)
  onDownload?: () => Promise<void> | void;
  // The button waits for the page's data
  downloadReady?: boolean;
  // A line in grey italics under the title, e.g. that a new school has little data yet
  notice?: string;
}

/** Saves the page's data as one Excel file; hidden on phones, where a spreadsheet is little use */
const DownloadExcelButton: React.FC<{ onDownload: () => Promise<void> | void; ready?: boolean }> = ({ onDownload, ready = true }) => {
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  };
  return (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={download}
      disabled={downloading || !ready}
      sx={{ display: { xs: 'none', sm: 'inline-flex' }, flexShrink: 0, mt: 1.25, textTransform: 'none' }}
    >
      Download Excel
    </Button>
  );
};

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
  component,
  pageTitle = false,
  showEntityOnPhone = true,
  onDownload,
  downloadReady = true,
  notice
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const title = (
    <Typography
      variant="h5"
      component={component ?? (pageTitle ? 'h1' : 'h5')}
      gutterBottom
      sx={{
        fontWeight: 500,
        mt: isMobile ? 0 : 1,
        mb: isMobile ? (showEntityOnPhone ? 0 : 2) : 0.5,
        lineHeight: isMobile ? 1.2 : 1.5,
        ...(pageTitle ? { fontSize: { xs: '1.5rem', sm: '1.75rem' } } : {}),
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
      {(!isMobile || !showEntityOnPhone) && children}
    </Typography>
  );

  return (
    <Box>
      {onDownload ? (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', columnGap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>{title}</Box>
          <DownloadExcelButton onDownload={onDownload} ready={downloadReady} />
        </Box>
      ) : title}
      {!isMobile && withDivider && <Divider sx={{ mb: 2 }} /> }
      {isMobile && showEntityOnPhone && (
        <Typography
          variant="subtitle1"
          // The district or school a page is about; a page title's name reads like the site's other secondary text
          sx={{
            mb: 2,
            color: 'text.secondary',
            fontStyle: pageTitle ? 'normal' : 'italic'
          }}
        >
          {districtName || schoolName || entityName}
          {children && <Box component="span" sx={{ display: 'block' }}>{children}</Box>}
        </Typography>
      )}
      {notice && (
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, fontStyle: 'italic', mb: 2 }}>
          {notice}
        </Typography>
      )}
    </Box>
  );
  };

export default SectionTitle;

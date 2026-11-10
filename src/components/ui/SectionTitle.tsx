import React, { useState } from 'react';
import { Typography, Divider, Box, Button, SxProps, Theme, useMediaQuery, useTheme } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface SectionTitleProps {
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
  withDivider?: boolean;
  displayName?: string;
  districtName?: string;
  schoolName?: string;
  // Any other subject, e.g. "New Hampshire" on the State pages
  entityName?: string;
  // Heading element; the look stays the same (pages that use this as their main title pass "h1")
  component?: React.ElementType;
  // Phones show the district, school or other subject on a second line under the title; false leaves it off
  showEntityOnPhone?: boolean;
  // Saves everything on the page as one Excel file, from a button beside the title (tablets and up)
  onDownload?: () => Promise<void> | void;
  // The button waits for the page's data
  downloadReady?: boolean;
}

/** Saves the page's data as one Excel file; hidden on phones, where a spreadsheet is little use */
export const DownloadExcelButton: React.FC<{ onDownload: () => Promise<void> | void; ready?: boolean }> = ({ onDownload, ready = true }) => {
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
  component = 'h5',
  showEntityOnPhone = true,
  onDownload,
  downloadReady = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const title = (
    <Typography
      variant="h5"
      component={component}
      gutterBottom
      sx={{
        fontWeight: 500,
        mt: isMobile ? 0 : 1,
        mb: isMobile ? (showEntityOnPhone ? 0 : 2) : 0.5,
        lineHeight: isMobile ? 1.2 : 1.5,
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
          sx={{
            mb: 2,
            color: 'text.secondary',
            fontStyle: 'italic'
          }}
        >
          {districtName || schoolName || entityName}
        </Typography>
      )}
    </Box>
  );
  };

export default SectionTitle;

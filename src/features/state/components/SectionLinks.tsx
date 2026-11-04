import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Chip } from '@mui/material';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';

/**
 * The State pages as a row of links, for screens where the section tabs are hidden (below md):
 * otherwise the menu is the only way from one State page to another.
 */
const SectionLinks: React.FC = () => {
  const { pathname } = useLocation();
  const pages = Object.values(PAGE_REGISTRY.state);
  const rowRef = useRef<HTMLElement>(null);

  // Bring the current page's link into view, so later pages don't start off screen
  useEffect(() => {
    const row = rowRef.current;
    const current = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (row && current) row.scrollLeft = Math.max(0, current.offsetLeft - row.clientWidth / 2 + current.clientWidth / 2);
  }, [pathname]);

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'relative', mb: 2, mx: -2 }}>
      <Box
        ref={rowRef}
        component="nav"
        aria-label="Statewide data pages"
        // The extra right padding lets the last link scroll clear of the edge fade
      sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, pl: 2, pr: 6, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
      >
        {pages.map(page => {
          const path = page.urlPatterns[0];
          const current = pathname === path;
          return (
            <Chip
              key={page.id}
              label={page.shortName ?? page.displayName}
              component={Link}
              to={path}
              clickable
              color={current ? 'primary' : 'default'}
              variant={current ? 'filled' : 'outlined'}
              aria-current={current ? 'page' : undefined}
              sx={{ flexShrink: 0, height: 36 }}
            />
          );
        })}
      </Box>
      {/* Fades the right edge to show the row continues */}
      <Box aria-hidden sx={{ position: 'absolute', top: 0, right: 0, bottom: 8, width: 40, pointerEvents: 'none', background: 'linear-gradient(to left, #fff, rgba(255, 255, 255, 0))' }} />
    </Box>
  );
};

export default SectionLinks;

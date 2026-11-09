import React from 'react';
import { Box, GlobalStyles, Skeleton, Typography } from '@mui/material';
import { MetricTile, NavCard, NavCardGrid, SectionHeading, TileGroup, visuallyHidden } from '@/components/ds';
import SectionTitle from '@/components/ui/SectionTitle';
import { PageEntry } from '@/routes/pageRegistry';
import { selectCurrentSchools } from '@/store/slices/locationSlice';
import { radius } from '@/theme/tokens';
import { formatGradesDisplay } from '@/utils/formatting';
import { formatPercent, latestPoint, SubjectFigures, tileChange, valueIn, YearValue } from '@/features/state/utils/stateMetrics';
import { shortYear, tileDelta } from '@/features/state/utils/phrases';

// The pieces the district and school overviews share: a title over a line of facts, cards to the
// place's pages and to schools, sections laid out two across on wide screens, and the key-figure
// tiles' notes, test-score tile and placeholders.

type School = ReturnType<typeof selectCurrentSchools>[number];

// Phones: tighter than the shared components' spacing, so more of the page fits on a screen
export const PHONE_SPACING = {
  heading: { mt: { xs: 0.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } },
  section: { mb: { xs: 2.5, sm: 4 } },
};

// From this share of graduates with unknown plans (6% statewide in 2025), the college tile says so:
// the share planning college counts them among all graduates
const PLANS_UNKNOWN_NOTE = 10;

// ---------------------------------------------------------------- Layout

/** The page title, and under it a line of facts ("SAU 8 · Serves Concord"), in 14px on phones */
export const OverviewTitle: React.FC<{ title: string; facts?: React.ReactNode }> = ({ title, facts }) => (
  <>
    {/* Keeps keyboard focus and in-page jumps clear of the fixed header and section tabs */}
    <GlobalStyles styles={{ html: { scrollPaddingTop: 128 } }} />
    <SectionTitle
      displayName={title}
      entityName=""
      component="h1"
      showEntityOnPhone={false}
      // The facts line sits right under the title, on phones too; without one (a school on a phone),
      // the title keeps the facts line's space below it
      sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: facts ? 0.5 : { xs: 2, sm: 0.5 } }}
    />
    {facts && <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: { xs: 2, sm: 3 } }}>{facts}</Typography>}
  </>
);

/**
 * The page's sections: on wide screens two side by side (the page links and a list of schools),
 * with a wide section (the key figures) across both below. Phones and tablets stack them in order.
 */
export const OverviewGrid: React.FC<{ twoColumns: boolean; children: React.ReactNode }> = ({ twoColumns, children }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: twoColumns ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)' },
      columnGap: 4,
      alignItems: 'start',
    }}
  >
    {children}
  </Box>
);

/** A section of the grid under its heading; a wide one spans both columns */
export const OverviewSection: React.FC<{ id: string; title: string; wide?: boolean; children: React.ReactNode }> = ({ id, title, wide = false, children }) => (
  <Box component="section" aria-labelledby={id} sx={{ minWidth: 0, ...(wide && { gridColumn: '1 / -1' }) }}>
    <SectionHeading sx={PHONE_SPACING.heading} id={id}>{title}</SectionHeading>
    {children}
  </Box>
);

// ---------------------------------------------------------------- Page and school cards

/** A page's address for this place, without its optional parts: /district/111/academic */
export const pagePath = (page: PageEntry, id: number) =>
  page.urlPatterns[0].replace(':id', String(id)).replace(/(\/:[^/]+\?)+$/, '');

/** Whether the place has the page, as its tabs decide */
export const isPageAvailable = (page: PageEntry, place: unknown) =>
  typeof page.enabled === 'function' ? page.enabled(place) : page.enabled;

interface PageCardsProps {
  /** The place's pages, without its overview */
  pages: PageEntry[];
  /** What the registry's enabled and tooltip rules are given: the district with its schools, or the school */
  place: unknown;
  id: number;
  /** A line on each page, by its key in the registry ("academic") */
  descriptions: Record<string, string>;
  /** In place of a greyed-out card's description, so the reason shows without hovering (phones can't) */
  unavailableLine: string;
  label: string;
  wideColumns: 2 | 4;
}

/**
 * Cards to the place's pages, as its tabs show them: a page it has no data for is greyed out in
 * place, saying why, with the tab's reason as its tooltip.
 */
export const PageCards: React.FC<PageCardsProps> = ({ pages, place, id, descriptions, unavailableLine, label, wideColumns }) => (
  <NavCardGrid label={label} wideColumns={wideColumns} sx={PHONE_SPACING.section}>
    {pages.map(page => {
      const available = isPageAvailable(page, place);
      const reason = typeof page.tooltip === 'function' ? page.tooltip(place) : page.tooltip;
      return (
        <NavCard
          key={page.id}
          title={page.displayName}
          description={available ? descriptions[page.id.split('.')[1]] : unavailableLine}
          to={pagePath(page, id)}
          disabled={!available}
          disabledReason={available ? undefined : reason || undefined}
        />
      );
    })}
  </NavCardGrid>
);

/** Lowest grade first, so the schools run from elementary to high school */
const firstGrade = (school: School) => Math.min(...(school.grades ?? []).map(grade => grade.id), Number.MAX_SAFE_INTEGER);

/** Cards to schools the height of the page cards beside them: the name at the left (wrapping if long), its grades at the right */
export const SchoolCards: React.FC<{ schools: School[]; label: string }> = ({ schools, label }) => (
  <NavCardGrid label={label} wideColumns={2} sx={PHONE_SPACING.section}>
    {[...schools]
      .sort((a, b) => firstGrade(a) - firstGrade(b) || a.name.localeCompare(b.name))
      .map(school => {
        const grades = formatGradesDisplay(school);
        return <NavCard key={school.id} inline title={school.name} description={grades || undefined} to={`/school/${school.id}`} />;
      })}
  </NavCardGrid>
);

// ---------------------------------------------------------------- Key figures

/** Another place's figure for the same year, for a tile's note: "Statewide 44%", "District 41%" */
export const comparison = (label: string, series: YearValue[], year: number, format: (value: number) => string) => {
  const value = valueIn(series, year);
  return value === null ? undefined : `${label} ${format(value)}`;
};

/** A tile's note, one fact a line: "District 41%", "Statewide 44%" */
export const noteLines = (...lines: (string | undefined)[]) => {
  const kept = lines.filter((line): line is string => Boolean(line));
  return kept.length ? kept : undefined;
};

/** The college tile's note when many graduates' plans are unknown: "Plans unknown for 37%" (phones: "37% unknown") */
export const plansUnknownNote = (plansUnknown: YearValue[], year: number) => {
  const share = valueIn(plansUnknown, year);
  return share !== null && share >= PLANS_UNKNOWN_NOTE
    ? { full: `Plans unknown for ${formatPercent(share)}`, short: `${formatPercent(share)} unknown` }
    : undefined;
};

/** A place's series to compare a tile with: the district's or the state's */
export interface Comparison {
  label: string;
  series: YearValue[];
}

/**
 * A share-proficient tile, compared with other places for the same year. Where the state reports
 * only "<10%" or ">90%", the tile says so and shows no change.
 */
export const subjectTile = (label: string, subject: SubjectFigures, comparisons: Comparison[], to: string) => {
  const latest = latestPoint(subject.drawn);
  if (!latest) return null;
  const bound = subject.bounds.get(latest.year);
  return (
    <MetricTile
      key={label}
      label={label}
      value={bound ?? formatPercent(latest.value)}
      period={shortYear(latest.year)}
      delta={bound ? undefined : tileDelta(tileChange(subject.exact), { unit: 'points', higherIsBetter: true })}
      detail={noteLines(...comparisons.map(other => comparison(other.label, other.series, latest.year, value => formatPercent(value))))}
      trend={subject.drawn}
      to={to}
      linkLabel="test scores"
    />
  );
};

/** Grey tiles where the figures will be, so the page doesn't jump when they arrive */
export const KeyFiguresLoading: React.FC<{ groups: (string | undefined)[] }> = ({ groups }) => (
  <Box aria-busy="true">
    <Box component="span" sx={visuallyHidden}>Loading key figures</Box>
    {groups.map((group, index) => (
      <TileGroup key={group ?? index} title={group} sx={PHONE_SPACING.section}>
        {[0, 1, 2, 3].map(tile => <Skeleton key={tile} variant="rounded" animation="wave" sx={{ height: { xs: 112, sm: 160 }, borderRadius: radius.card }} />)}
      </TileGroup>
    ))}
  </Box>
);

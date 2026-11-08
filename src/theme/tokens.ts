// NH Education Facts design tokens: the one place the site's colors, type sizes, spacing and
// radii are named. The MUI theme (./index.ts) carries the brand blue; these cover what the
// theme doesn't. Published as a browsable reference in the "NH Education Facts Design
// System" artifact; keep the two in step.

export const color = {
  /** The brand blue: links, focus, hover borders, the latest point on a trend line */
  primary: '#1976d2',
  primaryDark: '#1565c0',
  text: 'rgba(0, 0, 0, 0.87)',
  /** Labels, years, notes, captions */
  textMuted: 'rgba(0, 0, 0, 0.6)',
  surface: '#ffffff',
  /** Navigation cards and notes: a light fill that marks "go here" or "aside" */
  surfaceSubtle: '#f5f5f5',
  surfaceSubtleHover: '#e0e0e0',
  /** Card and table borders */
  border: '#e0e0e0',
  /** Rules under titles, dividers between sections */
  rule: 'rgba(0, 0, 0, 0.12)',
  /** A change that is generally good (more students, higher scores, lower costs) */
  good: '#2e7d32',
  /** A change that is generally bad */
  bad: '#c62828',
  /** No change, or a change that is neither good nor bad */
  neutral: 'rgba(0, 0, 0, 0.6)',
  /** Sparklines: the history in grey, the latest point in primary */
  trend: '#9e9e9e',
} as const;

/** Chart series, in fixed order: never cycled, and an entity keeps its color on every chart */
export const series = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'] as const;

// Type: sizes are { phone, tablet and up } where they differ. Roboto throughout.
export const type = {
  /** The page's h1, with a rule beneath */
  pageTitle: { fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 500 },
  /** A section's h2 ("Key Statewide Figures"), one step below the page title, with a rule beneath */
  sectionTitle: { fontSize: { xs: '1.25rem', sm: '1.375rem' }, fontWeight: 500 },
  /** Chart and table titles */
  chartTitle: { fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.4 },
  /** Small uppercase label over a group of tiles ("SCHOOLS") */
  groupLabel: { fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
  /** A tile's title, in muted text so the figure leads */
  tileLabel: { fontSize: { xs: '0.9375rem', sm: '1rem' }, lineHeight: { xs: '20px', sm: '22px' }, fontWeight: 500 },
  /** A tile's figure and its change */
  figure: { fontSize: { xs: '1.375rem', sm: '1.75rem' }, lineHeight: { xs: '28px', sm: '34px' }, fontWeight: 600, letterSpacing: '-0.3px' },
  /** Years, "Since", notes under a figure */
  caption: { fontSize: '0.8125rem', lineHeight: '18px' },
} as const;

/** MUI spacing units (8px each) */
export const space = {
  tilePadding: { xs: 1.5, sm: 2 },
  tileGap: { xs: 1, sm: 2 },
  /** Between groups and sections */
  section: 4,
} as const;

/** MUI shape units (4px each): 2 = 8px, for tiles, cards and notes */
export const radius = {
  card: 2,
} as const;

/** Running text stops at about 75 characters */
export const READING_WIDTH = 720;

/** Pages laid out in columns (the home and Ask pages) stop here, so neither column sprawls */
export const PAGE_WIDTH = 1200;

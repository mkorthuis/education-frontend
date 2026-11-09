import type { MetricTileProps } from '@/components/ds';
import { formatPercent, latestPoint, SubjectFigures, tileChange, valueIn, YearValue } from '@/features/state/utils/stateMetrics';
import { shortYear, tileDelta } from '@/features/state/utils/phrases';

// Key-figure tiles as plain data. The overviews draw them as MetricTiles; the pages written at build
// time (src/seo) print the same figures as text. No React here, so the build can use it.

/** A tile, naming the page it links to (a page registry key such as "financials") rather than its address */
export type TileModel = Omit<MetricTileProps, 'to'> & { key: string; page: string };

/** A group of tiles, titled ("Students and Spending") where an overview has more than one */
export interface TileGroupModel {
  title?: string;
  tiles: TileModel[];
}

// From this share of graduates with unknown plans (6% statewide in 2025), the college tile says so:
// the share planning college counts them among all graduates
const PLANS_UNKNOWN_NOTE = 10;

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
export const subjectTileModel = (label: string, subject: SubjectFigures, comparisons: Comparison[], page: string): TileModel | null => {
  const latest = latestPoint(subject.drawn);
  if (!latest) return null;
  const bound = subject.bounds.get(latest.year);
  return {
    key: label,
    label,
    value: bound ?? formatPercent(latest.value),
    period: shortYear(latest.year),
    delta: bound ? undefined : tileDelta(tileChange(subject.exact), { unit: 'points', higherIsBetter: true }),
    detail: noteLines(...comparisons.map(other => comparison(other.label, other.series, latest.year, value => formatPercent(value)))),
    trend: subject.drawn,
    page,
    linkLabel: 'test scores',
  };
};

import type { School } from '@/store/slices/locationSlice';

// One line on what each school page shows, for the cards that link to them on the school's
// overview, keyed by the page's id in the page registry. Short enough for one line in a half-width
// column, like the district overview's.
export const SCHOOL_PAGE_DESCRIPTIONS: Record<string, string> = {
  academic: 'Test scores by subject and grade',
  outcomes: 'Graduation and graduates\' plans',
  safety: 'Bullying, truancy and incidents',
  enrollment: 'Students by year and grade',
  contact: 'Principal, address and phone',
};

/** What a public charter school is, in the line under its name */
export const CHARTER_SCHOOL_LABEL = 'Public charter school';

/** New Hampshire's charter school law, RSA 194-B, on the General Court's site */
export const CHARTER_LAW_URL = 'https://gc.nh.gov/rsa/html/XV/194-B/194-B-mrg.htm';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// The topics the API lists in a school's not_yet_reported, by the key of the school page showing each
const PAGE_TOPICS: Record<string, string> = { academic: 'test_scores', outcomes: 'graduation', safety: 'safety', enrollment: 'enrollment' };

type NewSchool = Pick<School, 'open_date' | 'not_yet_reported'>;

/** The school list's open date ("2026-09-01") as "September 1, 2026", read as numbers so no time zone moves it a day */
const openedOn = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
};

/**
 * Whether a school page has no data behind it: the school opened after the latest reports on the
 * page's topic (the API's not_yet_reported). Its tab and card are greyed out.
 */
export const noDataYet = (school: NewSchool | null | undefined, pageKey: string): boolean =>
  Boolean(school?.open_date && PAGE_TOPICS[pageKey] && school.not_yet_reported?.includes(PAGE_TOPICS[pageKey]));

/** Why a greyed-out page has no data, for its tab's and card's tooltip */
export const noDataYetReason = (school: NewSchool | null | undefined, pageKey: string): string | undefined =>
  noDataYet(school, pageKey) ? `School Opened on ${openedOn(school!.open_date!)}. No state data yet.` : undefined;

/**
 * The italic line under a new school's facts, and under the title of its pages that aren't greyed
 * out: when it opened, and that the state's data on it is still minimal. Only for a school the
 * state's latest reports came out too soon to cover.
 */
export const newSchoolNotice = (school: NewSchool | null | undefined): string | undefined =>
  school?.open_date && school.not_yet_reported?.length ? `School Opened on ${openedOn(school.open_date)}. State data currently minimal.` : undefined;

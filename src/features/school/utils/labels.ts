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

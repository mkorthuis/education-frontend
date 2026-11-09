import { formatGradesDisplay } from '@/utils/formatting';

// One line on what each district page shows, for the cards that link to them on the district's
// overview, keyed by the page's id in the page registry. Short enough for one line in a half-width
// column, so the cards stay low and the key figures come into view sooner.
export const DISTRICT_PAGE_DESCRIPTIONS: Record<string, string> = {
  academic: 'Test scores by subject and grade',
  outcomes: 'Graduation and graduates\' plans',
  financials: 'Spending and cost per student',
  safety: 'Bullying, truancy and incidents',
  staff: 'Teacher pay, staffing, class size',
  enrollment: 'Students by year, school and grade',
  efa: 'EFA students and state cost',
  contact: 'SAU office and school contacts',
};

/** The district's full name, as the other district pages title it: "Concord School District" */
export const districtTitle = (name: string): string => `${name} School District`;

/** The title on phones: "Concord (SAU 8)" */
export const districtPhoneTitle = (name: string, sauId: number): string => `${name} (SAU ${sauId})`;

/** "Concord", "Hampton and Hampton Falls", "Brentwood, East Kingston and Exeter" */
export const listNames = (names: string[]): string =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

interface DistrictFacts {
  sauId: number;
  towns: { name: string }[];
  grades?: { id: number; name: string }[];
  schoolCount: number;
  /** Phones: the towns served (and that it runs no schools), as the SAU is in the title */
  phone?: boolean;
}

/** The line under the title: the SAU, the towns served, the grades and how many schools */
export const districtFacts = ({ sauId, towns, grades = [], schoolCount, phone = false }: DistrictFacts): string[] => {
  const facts = phone ? [] : [`SAU ${sauId}`];
  if (towns.length) facts.push(`Serves ${listNames(towns.map(town => town.name))}`);
  if (schoolCount === 0) {
    facts.push('Runs no schools of its own');
    return facts;
  }
  if (phone) return facts;
  const gradeRange = formatGradesDisplay({ grades } as Parameters<typeof formatGradesDisplay>[0]);
  if (gradeRange) facts.push(`Grades ${gradeRange}`);
  facts.push(`${schoolCount} ${schoolCount === 1 ? 'school' : 'schools'}`);
  return facts;
};

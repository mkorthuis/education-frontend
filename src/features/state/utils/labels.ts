// Plain-language names for the codes and report labels the API returns. Charts, tables and
// pickers show these; CSV downloads keep the source label next to them where it matters.

/** The plain name for a source label, or the source label when there isn't one. */
export const plainLabel = (labels: Record<string, string>, name: string): string => labels[name] ?? name;

// Short words left lowercase in Title Case, except as the first word
const MINOR_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

/** "Extra: low-income (free or reduced-price meals)" as "Extra: Low-Income (Free or Reduced-Price Meals)"; acronyms stay as they are. */
export const titleCase = (text: string): string =>
  text.replace(/[A-Za-z]+/g, (word, offset: number) =>
    offset > 0 && text[offset - 1] === ' ' && MINOR_WORDS.has(word.toLowerCase())
      ? word.toLowerCase()
      : word.charAt(0).toUpperCase() + word.slice(1));

// Assessment student groups, in the order the picker and table show them: pairs sit together
export const STUDENT_GROUP_SECTIONS: { section: string; groups: { name: string; label: string }[] }[] = [
  { section: 'All Students', groups: [{ name: 'All students', label: 'All Students' }] },
  {
    section: 'Disability',
    groups: [
      { name: 'IEP/SWD', label: 'Students with Disabilities (IEP)' },
      { name: 'Not IEP/SWD', label: 'Students Without an IEP' },
    ],
  },
  {
    section: 'Family Income',
    groups: [
      { name: 'SES', label: 'Low-Income (Free or Reduced-Price Meals)' },
      { name: 'Not SES', label: 'Not Low-Income' },
    ],
  },
  {
    section: 'English Learner Status',
    groups: [
      { name: 'EL - Current', label: 'English Learners' },
      { name: 'EL - Curr + Monitor Yr1-4', label: 'English Learners, Current and Recently Exited' },
    ],
  },
  {
    section: 'Race and Ethnicity',
    groups: [
      { name: 'Am. Indian', label: 'American Indian or Alaska Native' },
      { name: 'Asian+PI+Hawaiian', label: 'Asian or Pacific Islander' },
      { name: 'Black', label: 'Black' },
      { name: 'Hispanic', label: 'Hispanic' },
      { name: 'Two or More races', label: 'Two or More Races' },
      { name: 'White', label: 'White' },
    ],
  },
  {
    section: 'Gender',
    groups: [
      { name: 'Female', label: 'Female' },
      { name: 'Male', label: 'Male' },
    ],
  },
  {
    section: 'Other Groups',
    groups: [
      { name: 'Foster', label: 'In Foster Care' },
      { name: 'Homeless', label: 'Experiencing Homelessness' },
      { name: 'Migrant', label: 'Migrant Families' },
      { name: 'Military', label: 'Military-Connected Families' },
    ],
  },
];

export const STUDENT_GROUP_LABELS: Record<string, string> = Object.fromEntries(
  STUDENT_GROUP_SECTIONS.flatMap(section => section.groups.map(group => [group.name, group.label]))
);

export interface GroupedSubgroup<T> {
  section: string;
  items: (T & { label: string })[];
}

/**
 * Subgroups sorted into the sections above, with plain labels. A group the list doesn't know
 * goes under "Other Groups" with its source name.
 */
export const groupSubgroups = <T extends { name: string }>(subgroups: T[]): GroupedSubgroup<T>[] => {
  const known = new Set(Object.keys(STUDENT_GROUP_LABELS));
  return STUDENT_GROUP_SECTIONS
    .map(section => {
      const items = section.groups
        .map(group => subgroups.find(subgroup => subgroup.name === group.name))
        .filter((subgroup): subgroup is T => Boolean(subgroup))
        .map(subgroup => ({ ...subgroup, label: STUDENT_GROUP_LABELS[subgroup.name] }));
      if (section.section === 'Other Groups') {
        subgroups
          .filter(subgroup => !known.has(subgroup.name))
          .forEach(subgroup => items.push({ ...subgroup, label: subgroup.name }));
      }
      return { section: section.section, items };
    })
    .filter(section => section.items.length > 0);
};

// Post-graduation plans (by the plan type's name); chart legends and table rows use the same words
export const PLAN_LABELS: Record<string, string> = {
  '4 Year College': 'Four-Year College',
  'Less 4 Year College': 'Two-Year College or Shorter Program',
  'Employed': 'Working',
  'Armed Forces': 'Military',
  'Unemployed': 'Not Working',
  'Unknown': 'Unknown',
  'Addl. High School': 'Postgraduate Year at a High School',
};

// Education Freedom Account aid categories
export const EFA_AID_LABELS: Record<string, string> = {
  'Base Aid': 'Base amount (every EFA student)',
  'Federal Free & Reduced (F&R) Price Meal Eligible': 'Extra: low-income (free or reduced-price meals)',
  'Special Education Aid': 'Extra: special education',
  'English Language Learn Aid': 'Extra: English learner',
  '3rd Grade Reading Aid': 'Extra: grade 3 reading',
};

// Serious incident types from the School Safety Data Collection
export const INCIDENT_LABELS: Record<string, string> = {
  'Aggravated Felonious Sexual Assaults': 'Aggravated Sexual Assault',
  'Arsons': 'Arson',
  'Firearms Incidents Including More Than One Type of Weapon or Firearm': 'Firearms: More Than One Type',
  'Firearms Possessions or Sales': 'Firearm Possession or Sale',
  'First Degree Assaults': 'First-Degree Assault',
  'Handgun Incidents': 'Firearms: Handgun',
  'Homicides': 'Homicide',
  'Other Firearms Incidents': 'Firearms: Other',
  'Rifles/ Shotguns Incidents': 'Firearms: Rifle or Shotgun',
  'Robberies': 'Robbery',
};


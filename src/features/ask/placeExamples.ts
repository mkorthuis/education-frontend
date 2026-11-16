// The example questions on a district's or school's Ask page before anything is asked there, fitted
// to what the place has. They lean to what the Ask tells beyond the place's tabs: where students go
// for grades a district doesn't run, its schools side by side, school tax rates, state aid and child
// care. Each names the place, so the question reads as asked, and the same words each time let one
// saved answer serve every visitor.

export interface DistrictExampleFacts {
  name: string;
  /** How many schools it runs */
  schoolCount: number;
  /** Whether it runs a grade 12 */
  hasGraduation: boolean;
}

export const districtExamples = ({ name, schoolCount, hasGraduation }: DistrictExampleFacts): string[] => {
  const hasSchools = schoolCount > 0;
  return [
    !hasSchools ? `Where do ${name} students go to school?`
      : !hasGraduation ? `Where do ${name} students go to high school?`
      : schoolCount > 1 ? `How do ${name}'s schools compare in math?`
      : `How does ${name} compare with the state in math?`,
    // A district without schools has no cost per pupil
    hasSchools ? `How much does ${name} spend per student compared with the state?` : `How has the number of ${name} students changed?`,
    `What is ${name}'s school tax rate?`,
    `How much state aid does ${name} get?`,
    hasSchools ? `What is the average class size in ${name}?` : `How many ${name} students have Education Freedom Accounts?`,
    `How many licensed child care places are in ${name}?`,
  ];
};

export interface SchoolExampleFacts {
  name: string;
  /** Its district's name; none for a charter school */
  district: string | null;
  hasTestScores: boolean;
  hasEnrollment: boolean;
  hasGraduation: boolean;
  hasSafety: boolean;
}

/** Up to six, leaving out what a school has no figures for (a new school, or one without a grade 12) */
export const schoolExamples = ({ name, district, hasTestScores, hasEnrollment, hasGraduation, hasSafety }: SchoolExampleFacts): string[] => [
  hasTestScores && `How are ${name} students doing in math?`,
  hasTestScores && district && `How does ${name} compare with other schools in ${district}?`,
  hasGraduation ? `What is ${name}'s graduation rate?` : hasEnrollment && `How has enrollment at ${name} changed?`,
  hasGraduation && `What do ${name} graduates do after high school?`,
  hasSafety && `How many bullying incidents did ${name} report?`,
  // Spending is reported for the whole district; a charter school has none on the site
  district ? `How much does ${district} spend per student?` : 'How do charter schools work in New Hampshire?',
].filter((question): question is string => Boolean(question));

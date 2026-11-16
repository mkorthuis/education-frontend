import { describe, expect, it } from 'vitest';
import { districtExamples, schoolExamples } from '../placeExamples';

describe("Example questions on a district's Ask page", () => {
  it("compares a district's schools, and asks what its pages don't show", () => {
    expect(districtExamples({ name: 'Concord', schoolCount: 7, hasGraduation: true })).toEqual([
      "How do Concord's schools compare in math?",
      'How much does Concord spend per student compared with the state?',
      "What is Concord's school tax rate?",
      'How much state aid does Concord get?',
      'What is the average class size in Concord?',
      'How many licensed child care places are in Concord?',
    ]);
    expect(districtExamples({ name: 'Pittsburg', schoolCount: 1, hasGraduation: true })[0]).toBe('How does Pittsburg compare with the state in math?');
  });

  it('asks where students go for the grades a district does not run, and nothing it has no figures for', () => {
    expect(districtExamples({ name: 'Jackson', schoolCount: 1, hasGraduation: false })[0]).toBe('Where do Jackson students go to high school?');
    const albany = districtExamples({ name: 'Albany', schoolCount: 0, hasGraduation: false });
    expect(albany[0]).toBe('Where do Albany students go to school?');
    expect(albany.some(question => /spend per student|class size/.test(question))).toBe(false);
  });
});

describe("Example questions on a school's Ask page", () => {
  const concordHigh = { name: 'Concord High School', district: 'Concord', hasTestScores: true, hasEnrollment: true, hasGraduation: true, hasSafety: true };

  it("asks about the school's results, and its district's spending", () => {
    expect(schoolExamples(concordHigh)).toEqual([
      'How are Concord High School students doing in math?',
      'How does Concord High School compare with other schools in Concord?',
      "What is Concord High School's graduation rate?",
      'What do Concord High School graduates do after high school?',
      'How many bullying incidents did Concord High School report?',
      'How much does Concord spend per student?',
    ]);
    expect(schoolExamples({ ...concordHigh, name: 'Abbot-Downing School', hasGraduation: false })[2]).toBe('How has enrollment at Abbot-Downing School changed?');
  });

  it('asks how charter schools work for one, and skips what a new school has no figures for', () => {
    expect(schoolExamples({ name: 'Breakthrough Academy (H)', district: null, hasTestScores: false, hasEnrollment: false, hasGraduation: false, hasSafety: false }))
      .toEqual(['How do charter schools work in New Hampshire?']);
  });
});

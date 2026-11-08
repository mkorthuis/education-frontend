import { describe, expect, it } from 'vitest';
import { buildPlaceOptions, gradeSpan, searchPlaces } from '../placeOptions';

const grades = (...names: string[]) => names.map((name, index) => ({ id: index + 1, name }));

const districts = [
  { id: 17, name: 'Amherst', grades: grades('Preschool', 'Kindergarten', 'Grade 8') },
  { id: 493, name: 'Souhegan Cooperative', grades: grades('Grade 9', 'Grade 12') },
  { id: 111, name: 'Concord', grades: grades('Kindergarten', 'Grade 12') },
];
const towns = [
  { id: 17, name: 'Amherst', district_ids: [17, 493] },
  { id: 111, name: 'Concord', district_ids: [111] },
  // A town with no public district on the site
  { id: 999, name: 'Nowhere', district_ids: [12345] },
];
const schools = [
  { id: 1, name: 'Souhegan High School', district_id: 493, city: 'AMHERST', grades: grades('Grade 9', 'Grade 12') },
  { id: 2, name: 'Concord High School', district_id: 111, city: 'Concord' },
  { id: 3, name: 'Private Academy', district_id: 777, city: 'Concord' },
];
const options = buildPlaceOptions(districts, towns, schools);

describe('place search', () => {
  it('writes grade spans plainly', () => {
    expect(gradeSpan(grades('Grade 9', 'Grade 12'))).toBe('Grades 9 to 12');
    expect(gradeSpan(grades('Preschool', 'Grade 8'))).toBe('Preschool to Grade 8');
    expect(gradeSpan(grades('Kindergarten'))).toBe('Kindergarten');
    expect(gradeSpan([])).toBe('');
  });

  it("lists a town under the districts it uses that aren't named for it", () => {
    const amherst = options.filter(option => option.kind === 'town' && option.name === 'Amherst');
    expect(amherst).toEqual([expect.objectContaining({ detail: 'Served by Souhegan Cooperative, Grades 9 to 12', path: '/district/493' })]);
    // Concord's only district is named for it, so the district alone is listed
    expect(options.filter(option => option.kind === 'town' && option.name === 'Concord')).toEqual([]);
    expect(options.some(option => option.name === 'Nowhere')).toBe(false);
  });

  it('lists only schools in public districts, with their town', () => {
    expect(options.filter(option => option.kind === 'school').map(option => option.name)).toEqual(['Souhegan High School', 'Concord High School']);
    expect(options.find(option => option.name === 'Souhegan High School')?.detail).toBe('Amherst · Grades 9 to 12');
  });

  it('puts the best matches first, districts before towns and schools among equals', () => {
    expect(searchPlaces(options, 'amherst').map(option => `${option.kind}:${option.name}`)).toEqual([
      'district:Amherst', 'town:Amherst', 'school:Souhegan High School',
    ]);
    expect(searchPlaces(options, 'high').map(option => option.name)).toEqual(['Concord High School', 'Souhegan High School']);
    expect(searchPlaces(options, '  ')).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { buildPlaceOptions, gradeSpan, searchPlaces } from '../placeOptions';

const grades = (...names: string[]) => names.map((name, index) => ({ id: index + 1, name }));

const districts = [
  { id: 17, name: 'Amherst', grades: grades('Preschool', 'Kindergarten', 'Grade 8') },
  { id: 493, name: 'Souhegan Cooperative', grades: grades('Grade 9', 'Grade 12') },
  { id: 111, name: 'Concord', grades: grades('Kindergarten', 'Grade 12') },
];
const schools = [
  { id: 1, name: 'Souhegan High School', district_id: 493, city: 'AMHERST', grades: grades('Grade 9', 'Grade 12') },
  { id: 2, name: 'Concord High School', district_id: 111, city: 'Concord' },
  { id: 3, name: 'Private Academy', district_id: 777, city: 'Concord' },
];
const options = buildPlaceOptions(districts, schools);

describe('place search', () => {
  it('writes grade spans plainly', () => {
    expect(gradeSpan(grades('Grade 9', 'Grade 12'))).toBe('Grades 9 to 12');
    expect(gradeSpan(grades('Preschool', 'Grade 8'))).toBe('Preschool to Grade 8');
    expect(gradeSpan(grades('Kindergarten'))).toBe('Kindergarten');
    expect(gradeSpan([])).toBe('');
  });

  it('lists districts and schools, not towns', () => {
    expect(new Set(options.map(option => option.kind))).toEqual(new Set(['district', 'school']));
    expect(options.find(option => option.name === 'Amherst')).toEqual(expect.objectContaining({ kind: 'district', path: '/district/17' }));
  });

  it('lists only schools in public districts, with their town', () => {
    expect(options.filter(option => option.kind === 'school').map(option => option.name)).toEqual(['Souhegan High School', 'Concord High School']);
    expect(options.find(option => option.name === 'Souhegan High School')?.detail).toBe('Amherst · Grades 9 to 12');
  });

  it('puts the best matches first, districts before schools among equals', () => {
    // A school is also found by its town
    expect(searchPlaces(options, 'amherst').map(option => `${option.kind}:${option.name}`)).toEqual([
      'district:Amherst', 'school:Souhegan High School',
    ]);
    expect(searchPlaces(options, 'high').map(option => option.name)).toEqual(['Concord High School', 'Souhegan High School']);
    expect(searchPlaces(options, '  ')).toEqual([]);
  });
});

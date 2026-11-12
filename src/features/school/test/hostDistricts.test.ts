import { describe, expect, it } from 'vitest';
import type { District, School } from '@/store/slices/locationSlice';
import { hostDistricts, isOnlineSchool } from '../utils/hostDistricts';

// Grade ids as the API numbers them: 1 preschool, 2 kindergarten, 3 to 14 grades 1 to 12
const span = (low: number, high: number) => Array.from({ length: high - low + 1 }, (_, n) => ({ id: low + n, name: `grade ${low + n}` }));

const district = (id: number, name: string, towns: number[], grades: { id: number; name: string }[]): District => ({ id, name, kind: 'district', towns, grades });
const DISTRICTS = [
  district(113, 'Conway', [113], span(2, 14)),
  district(173, 'Exeter', [173], span(1, 7)),
  district(172, 'Exeter Region Cooperative', [173, 50], span(8, 14)),
  district(112, 'Contoocook Valley', [427, 10], span(1, 14)),
  district(525, 'Tamworth', [525], span(2, 10)),
  district(111, 'Concord', [111], span(1, 14)),
  // Not a district any town's students go to
  district(838, 'In-State Facility', [111], []),
];
const charter = (townId: number | undefined, grades: { id: number; name: string }[], districtId = 750): School =>
  ({ id: 1, name: 'A Charter School', kind: 'charter', district_id: districtId, town_id: townId, grades });
const ids = (districts: District[]) => districts.map(d => d.id);

describe('the school districts serving a charter school\'s town', () => {
  it('is the town\'s district, or its regional district', () => {
    expect(ids(hostDistricts(charter(113, span(11, 14)), DISTRICTS))).toEqual([113]);
    expect(ids(hostDistricts(charter(427, span(8, 14)), DISTRICTS))).toEqual([112]);
  });

  it('picks by grade where a town has two districts, youngest grades first, and keeps both for a school spanning them', () => {
    expect(ids(hostDistricts(charter(173, span(11, 14)), DISTRICTS))).toEqual([172]);
    expect(ids(hostDistricts(charter(173, span(2, 10)), DISTRICTS))).toEqual([173, 172]);
  });

  it('falls back to the town\'s district when none teaches the charter\'s grades', () => {
    expect(ids(hostDistricts(charter(525, span(11, 14)), DISTRICTS))).toEqual([525]);
  });

  it('leaves out districts without grades', () => {
    expect(ids(hostDistricts(charter(111, span(8, 14)), DISTRICTS))).toEqual([111]);
  });

  it('is none for an online school, a school without a town, or a district school', () => {
    const vlacs = charter(173, span(11, 14), 727);
    expect(isOnlineSchool(vlacs)).toBe(true);
    expect(hostDistricts(vlacs, DISTRICTS)).toEqual([]);
    expect(hostDistricts(charter(undefined, span(11, 14)), DISTRICTS)).toEqual([]);
    expect(hostDistricts({ ...charter(113, span(11, 14)), kind: 'district' }, DISTRICTS)).toEqual([]);
  });
});

import { District, isCharterSchool, School } from '@/store/slices/locationSlice';

// The Virtual Learning Academy's charter board: an online school, whose address is its office and
// whose students come from all over the state
const ONLINE_CHARTER_BOARDS = new Set([727]);

/** An online charter school: it has no town in the sense of where its students go */
export const isOnlineSchool = (school: Pick<School, 'kind' | 'district_id'> | null | undefined): boolean =>
  isCharterSchool(school) && school?.district_id != null && ONLINE_CHARTER_BOARDS.has(school.district_id);

const lowestGrade = (district: District) => Math.min(...(district.grades ?? []).map(grade => grade.id));

/**
 * The school districts serving the town a charter school is in, which its pages link to (a charter
 * school belongs to none). A town can have two, a K-8 district and a cooperative for the older
 * grades: those responsible for any of the charter's grades, youngest grades first, or all of the
 * town's when none is (a charter high school in a K-8 town). Districts without grades serve no
 * town's students (the state's "In-State Facility", listed under Concord) and are left out. None for
 * a school that isn't a charter school, an online one, or one without a town.
 */
export const hostDistricts = (school: School, districts: District[]): District[] => {
  if (!isCharterSchool(school) || isOnlineSchool(school) || school.town_id == null) return [];
  const townId = school.town_id;
  const town = districts.filter(district => district.towns?.includes(townId) && (district.grades?.length ?? 0) > 0);
  const grades = new Set((school.grades ?? []).map(grade => grade.id));
  const teaching = town.filter(district => district.grades!.some(grade => grades.has(grade.id)));
  return [...(teaching.length ? teaching : town)].sort((a, b) => lowestGrade(a) - lowestGrade(b));
};

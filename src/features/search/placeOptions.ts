// One search over the places the site has pages for: public school districts, the towns they
// serve, and public schools. A town is how most visitors know where they live, so a town that sends
// its students to a district with another name (a cooperative's high school, say) is listed with it.

export type PlaceKind = 'district' | 'town' | 'school';

export interface PlaceOption {
  key: string;
  kind: PlaceKind;
  name: string;
  /** The second line: a district's grades, the district a town uses, or a school's town and grades */
  detail: string;
  path: string;
}

interface GradeRow { id: number; name: string }
export interface DistrictRow { id: number; name: string; grades?: GradeRow[] }
export interface TownRow { id: number; name: string; district_ids?: number[] | null }
export interface SchoolRow { id: number; name: string; district_id?: number | null; city?: string | null; grades?: GradeRow[] }

// The home page address that focuses the search, for "Look Up a Place" links elsewhere
export const LOOK_UP_HASH = '#look-up';

// What each result is, shown beside its name
export const PLACE_KINDS: Record<PlaceKind, string> = { district: 'District', town: 'Town', school: 'School' };
const KIND_ORDER: Record<PlaceKind, number> = { district: 0, town: 1, school: 2 };
export const MAX_RESULTS = 15;

/** "Grades 9 to 12", "Preschool to Grade 8", "Kindergarten" */
export const gradeSpan = (grades?: GradeRow[] | null): string => {
  if (!grades?.length) return '';
  const sorted = [...grades].sort((a, b) => a.id - b.id);
  const first = sorted[0].name;
  const last = sorted[sorted.length - 1].name;
  if (first === last) return first;
  if (first.startsWith('Grade ') && last.startsWith('Grade ')) return `Grades ${first.slice(6)} to ${last.slice(6)}`;
  return `${first} to ${last}`;
};

// Some school towns arrive in capitals
const townName = (city?: string | null) =>
  !city ? '' : city === city.toUpperCase() ? city.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()) : city;

/** Every place the search can find. Schools and towns count only with a public district. */
export const buildPlaceOptions = (districts: DistrictRow[], towns: TownRow[], schools: SchoolRow[]): PlaceOption[] => {
  const byId = new Map(districts.map(district => [district.id, district]));
  const options: PlaceOption[] = districts.map(district => ({
    key: `district-${district.id}`,
    kind: 'district',
    name: district.name,
    detail: gradeSpan(district.grades),
    path: `/district/${district.id}`,
  }));
  towns.forEach(town => {
    (town.district_ids ?? []).forEach(id => {
      const district = byId.get(id);
      // A town's own district, named for it, is already listed
      if (!district || district.name.toLowerCase().startsWith(town.name.toLowerCase())) return;
      const span = gradeSpan(district.grades);
      options.push({
        key: `town-${town.id}-${district.id}`,
        kind: 'town',
        name: town.name,
        detail: `Served by ${district.name}${span ? `, ${span}` : ''}`,
        path: `/district/${district.id}`,
      });
    });
  });
  schools.forEach(school => {
    if (school.district_id == null || !byId.has(school.district_id)) return;
    options.push({
      key: `school-${school.id}`,
      kind: 'school',
      name: school.name,
      detail: [townName(school.city), gradeSpan(school.grades)].filter(Boolean).join(' · '),
      path: `/school/${school.id}`,
    });
  });
  return options;
};

const normalize = (text: string) => text.toLowerCase().replace(/[.'’]/g, '').replace(/\s+/g, ' ').trim();

/** How well a place matches: 0 is exact, higher is weaker, null is no match. */
const matchScore = (option: PlaceOption, query: string): number | null => {
  const name = normalize(option.name);
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.split(/[\s-]+/).some(word => word.startsWith(query))) return 2;
  if (name.includes(query)) return 3;
  // A school also matches on its town, so "Hampton" finds Marston School
  if (option.kind === 'school' && normalize(option.detail).startsWith(query)) return 4;
  return null;
};

/**
 * The best matches for what's typed, best first. Among equal matches districts come before towns and
 * schools, so "Hampton" lists the Hampton district, then the town with the district that runs its
 * high school, then Hampton Falls.
 */
export const searchPlaces = (options: PlaceOption[], text: string, limit = MAX_RESULTS): PlaceOption[] => {
  const query = normalize(text);
  if (!query) return [];
  return options
    .flatMap(option => {
      const score = matchScore(option, query);
      return score === null ? [] : [{ option, score }];
    })
    .sort((a, b) => a.score - b.score || KIND_ORDER[a.option.kind] - KIND_ORDER[b.option.kind] || a.option.name.localeCompare(b.option.name))
    .slice(0, limit)
    .map(match => match.option);
};

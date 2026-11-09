import type { TileGroupModel, TileModel } from '@/features/entity/overview/tileModels';
import { districtTitle, listNames } from '@/features/district/utils/labels';
import { PAGE_REGISTRY, PageEntry } from '@/routes/pageRegistry';

/**
 * The HTML written for every address on the site at build time (scripts/prerender.ts), so search
 * engines, link previews and visitors without JavaScript get each page's own title, description and
 * links. The app replaces the page's content when it starts.
 */

export const SITE_NAME = 'NH Education Facts';
export const SITE_URL = 'https://www.nhfacts.com';

const SOURCE = 'from New Hampshire Department of Education data';

// -------------------- Names and titles --------------------

/** A school with its town, which tells apart schools that share a name */
export const schoolName = (school: { name: string }, town?: string): string => (town ? `${school.name}, ${town}` : school.name);

const pageKey = (page: PageEntry): string => page.id.split('.')[1];

/**
 * The browser title for a page, e.g. "Financials – Concord School District | NH Education Facts".
 * `subject` is the district or school a page is about; statewide pages say they cover New Hampshire.
 */
export const pageTitle = (page: PageEntry, subject?: string): string => {
  if (page.id === PAGE_REGISTRY.general.home.id) return SITE_NAME;
  if (page.id.startsWith('state.')) {
    return `${page.displayName}${/New Hampshire|Statewide/.test(page.displayName) ? '' : ' – New Hampshire'} | ${SITE_NAME}`;
  }
  if (subject) return `${pageKey(page) === 'overview' ? subject : `${page.displayName} – ${subject}`} | ${SITE_NAME}`;
  return `${page.displayName} | ${SITE_NAME}`;
};

// -------------------- What each page shows --------------------

// From the About page's list of the data the site delivers
const SHOWS: Record<string, string> = {
  academic: 'Test results in math, reading and science, by grade and student group',
  outcomes: "Graduation rates, dropouts and graduates' plans after high school",
  financials: 'Cost per pupil, spending and revenue, and assets and liabilities',
  safety: 'Bullying, harassment, suspensions and expulsions, restraints and seclusions, and truancy',
  staff: "Teacher salaries, staff by role, teachers' education and average class size",
  enrollment: 'Enrollment by grade and year, English learners and low-income students, and projections',
  efa: 'Education Freedom Account students by year and town, and their estimated state cost',
  contact: 'Address, phone, website and key staff',
};

// English learners are reported by district only
const SCHOOL_SHOWS: Record<string, string> = { ...SHOWS, enrollment: 'Enrollment by grade and year, and projections' };

const STATE_SHOWS: Record<string, string> = {
  overview: "Statewide figures for New Hampshire's public schools: enrollment, test results, graduation, spending, staff, safety and Education Freedom Accounts",
  academic: "New Hampshire's statewide test results in math, reading and science, by grade and student group",
  outcomes: "New Hampshire's statewide graduation rates, dropouts and graduates' plans after high school",
  financials: "New Hampshire's statewide cost per pupil and total school spending over time",
  safety: 'Bullying, harassment, suspensions and expulsions, restraints and seclusions, and truancy in New Hampshire schools statewide',
  staff: "New Hampshire's statewide teacher salaries, staff by role, teachers' education and average class size",
  enrollment: "New Hampshire's statewide enrollment by grade and year, with English learners and low-income students",
  efa: 'Education Freedom Account students in New Hampshire and their estimated state cost, statewide and by town',
};

const GENERAL_DESCRIPTIONS: Record<string, string> = {
  home: `Facts about New Hampshire's public schools: enrollment, test results, graduation, spending, staff and safety for every district and school, ${SOURCE}. Or ask a question in your own words.`,
  about: 'Who runs NH Education Facts, why it was started, what data it covers and how it keeps the data accurate and fact-based.',
  districts: "All of New Hampshire's public school districts, with each one's enrollment, test results, graduation, spending, staff and safety.",
  schools: "All of New Hampshire's public schools, with each one's enrollment, test results, graduation and safety.",
  ask: "Ask a question about New Hampshire's public schools in your own words. Answers use this site's data, with charts and links to the sources.",
  datasources: 'Where every figure on NH Education Facts comes from: New Hampshire Department of Education reports and federal sources.',
  privacy: 'How NH Education Facts collects and uses information about visitors.',
  terms: 'The terms for using NH Education Facts.',
  contact: 'How to reach NH Education Facts with questions, corrections or suggestions.',
  faq: 'Answers to common questions about NH Education Facts and New Hampshire school data.',
};

// What an overview sums up, from the other pages the district or school has
const TOPICS: Record<string, string> = {
  enrollment: 'enrollment',
  academic: 'test results',
  outcomes: 'graduation',
  financials: 'spending',
  staff: 'staff',
  safety: 'safety',
  efa: 'Education Freedom Accounts',
};

const capitalized = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

// -------------------- The site's pages --------------------

export interface SiteDistrict {
  id: number;
  name: string;
  sau_id: number;
  towns: number[];
  grades: { name: string }[];
}

export interface SiteSchool {
  id: number;
  name: string;
  district_id: number;
  town_id: number;
  grades: { name: string }[];
}

export interface SiteTown {
  id: number;
  name: string;
}

/** The current public districts, schools (of every kind) and towns, as the API lists them */
export interface SiteIndex {
  districts: SiteDistrict[];
  schools: SiteSchool[];
  towns: SiteTown[];
}

export interface PageLink {
  href: string;
  text: string;
}

export interface StaticPage {
  path: string;
  title: string;
  heading: string;
  description: string;
  /** Lists of links, each under a heading */
  sections: { heading: string; links: PageLink[] }[];
  /** Home to this page, e.g. Home › All Districts › Concord School District › Financials */
  breadcrumbs: PageLink[];
  /** The key figures the page's tiles show, as on the overview: all of them there, a topic page's own on it */
  figures: TileGroupModel[];
  /** Whether search engines should index it */
  index: boolean;
}

/** A page's address without its optional parts, e.g. /district/:id/financials/:tab? → /district/12/financials */
export const basePath = (pattern: string, id?: number): string =>
  pattern.replace(/\/:[A-Za-z]+\?/g, '').replace(':id', String(id ?? ''));

const isEnabled = (page: PageEntry, entity: unknown): boolean =>
  typeof page.enabled === 'function' ? Boolean(page.enabled(entity)) : page.enabled;

const byName = <T extends { name: string }>(a: T, b: T): number => a.name.localeCompare(b.name);

/** Key figures written into the pages, by district id (from districtTileGroups) and school id (schoolTileGroups) */
export interface PageFigures {
  districts?: Map<number, TileGroupModel[]>;
  schools?: Map<number, TileGroupModel[]>;
}

/** A topic page's own tiles from the overview's: the financials page's spending, the academics page's test results */
const figuresFor = (groups: TileGroupModel[], key: string): TileGroupModel[] =>
  key === 'overview'
    ? groups
    : groups.map(group => ({ ...group, tiles: group.tiles.filter(tile => tile.page === key) })).filter(group => group.tiles.length > 0);

/**
 * What a district's overview loads, as the app decides it: test results and salaries for a district
 * that runs schools, graduation for one with a graduation page
 */
export const districtFigureScope = (index: SiteIndex): { id: number; hasSchools: boolean; hasGraduation: boolean }[] => {
  const publicIds = new Set(index.districts.map(district => district.id));
  const schools = index.schools.filter(school => publicIds.has(school.district_id));
  return index.districts.map(district => {
    const own = schools.filter(school => school.district_id === district.id);
    return { id: district.id, hasSchools: own.length > 0, hasGraduation: isEnabled(PAGE_REGISTRY.district.outcomes, { ...district, schools: own }) };
  });
};

/**
 * What a school's overview loads and compares, as the app decides it: graduation for a school with
 * a graduation page; its district's test scores when the district has other schools, and its
 * district's graduation when the district has another high school
 */
export const schoolFigureScope = (index: SiteIndex) => {
  const publicIds = new Set(index.districts.map(district => district.id));
  const schools = index.schools.filter(school => publicIds.has(school.district_id));
  const hasGraduation = (school: SiteSchool) => isEnabled(PAGE_REGISTRY.school.outcomes, school);
  return schools.map(school => {
    const others = schools.filter(other => other.district_id === school.district_id && other.id !== school.id);
    return {
      id: school.id,
      districtId: school.district_id,
      hasGraduation: hasGraduation(school),
      compareDistrict: others.length > 0,
      compareDistrictGraduation: others.some(hasGraduation),
    };
  });
};

export const staticPages = (index: SiteIndex, figures: PageFigures = {}): StaticPage[] => {
  const townName = new Map(index.towns.map(town => [town.id, town.name]));
  const districts = [...index.districts].sort(byName);
  const districtById = new Map(districts.map(district => [district.id, district]));
  // Public schools only, like the schools page: schools in a public school district
  const schools = index.schools
    .filter(school => districtById.has(school.district_id))
    .sort((a, b) => byName(a, b) || (townName.get(a.town_id) ?? '').localeCompare(townName.get(b.town_id) ?? ''));
  const schoolsOf = (districtId: number) => schools.filter(school => school.district_id === districtId);

  const districtLink = (district: SiteDistrict): PageLink => ({ href: basePath(PAGE_REGISTRY.district.overview.urlPatterns[0], district.id), text: districtTitle(district.name) });
  const schoolLink = (school: SiteSchool): PageLink => ({ href: basePath(PAGE_REGISTRY.school.overview.urlPatterns[0], school.id), text: schoolName(school, townName.get(school.town_id)) });
  const pageLink = (page: PageEntry, id?: number): PageLink => ({ href: basePath(page.urlPatterns[0], id), text: page.shortName ?? page.displayName });
  const general = PAGE_REGISTRY.general;
  const mainLinks = [general.home, PAGE_REGISTRY.state.overview, general.districts, general.schools, general.ask, general.about, general.datasources].map(page => pageLink(page));
  const home: PageLink = { href: general.home.urlPatterns[0], text: SITE_NAME };
  const crumb = (page: PageEntry, id?: number): PageLink => ({ href: basePath(page.urlPatterns[0], id), text: page.displayName });

  const pages: StaticPage[] = [];

  for (const page of Object.values(general)) {
    const key = pageKey(page);
    const sections = [{ heading: 'On this site', links: mainLinks.filter(link => link.href !== page.urlPatterns[0]) }];
    if (key === 'districts') sections.unshift({ heading: 'Districts', links: districts.map(districtLink) });
    if (key === 'schools') sections.unshift({ heading: 'Schools', links: schools.map(schoolLink) });
    pages.push({
      path: page.urlPatterns[0],
      title: pageTitle(page),
      heading: page.displayName,
      description: GENERAL_DESCRIPTIONS[key] ?? `${page.displayName}, ${SITE_NAME}.`,
      sections,
      breadcrumbs: page === general.home ? [home] : [home, crumb(page)],
      figures: [],
      index: true,
    });
  }

  const statePages = Object.values(PAGE_REGISTRY.state);
  const statewide: PageLink = { href: PAGE_REGISTRY.state.overview.urlPatterns[0], text: 'Statewide Data' };
  for (const page of statePages) {
    const overview = pageKey(page) === 'overview';
    pages.push({
      path: page.urlPatterns[0],
      title: pageTitle(page),
      heading: overview ? 'New Hampshire Statewide Data' : `New Hampshire: ${page.displayName}`,
      description: `${STATE_SHOWS[pageKey(page)] ?? page.displayName}, ${SOURCE}.`,
      sections: [
        { heading: 'Statewide', links: statePages.map(statePage => pageLink(statePage)) },
        { heading: 'On this site', links: mainLinks },
      ],
      breadcrumbs: overview ? [home, statewide] : [home, statewide, crumb(page)],
      figures: [],
      index: true,
    });
  }

  for (const district of districts) {
    const ownSchools = schoolsOf(district.id);
    const entity = { ...district, schools: ownSchools };
    const name = districtTitle(district.name);
    const towns = district.towns.map(id => townName.get(id)).filter((town): town is string => Boolean(town));
    const where = !towns.length || (towns.length === 1 && towns[0] === district.name) ? '' : ` (${listNames(towns)})`;
    const enabled = Object.values(PAGE_REGISTRY.district).filter(page => isEnabled(page, entity));
    const topics = enabled.map(page => TOPICS[pageKey(page)]).filter(Boolean);
    const sections = [
      { heading: name, links: enabled.map(page => pageLink(page, district.id)) },
      ...(ownSchools.length ? [{ heading: 'Schools', links: ownSchools.map(schoolLink) }] : []),
      { heading: 'On this site', links: mainLinks },
    ];
    for (const page of enabled) {
      const key = pageKey(page);
      const overview = ownSchools.length
        ? `${capitalized(listNames(topics))} for ${name}${where}, ${SOURCE}.`
        : `${name}${where} doesn't run its own schools. See its ${listNames(topics)}, ${SOURCE}.`;
      const trail = [home, crumb(general.districts), districtLink(district)];
      pages.push({
        path: basePath(page.urlPatterns[0], district.id),
        title: pageTitle(page, name),
        heading: key === 'overview' ? name : `${name}: ${page.displayName}`,
        description: key === 'overview' ? overview : `${SHOWS[key] ?? page.displayName} for ${name}${where}, ${SOURCE}.`,
        sections,
        breadcrumbs: key === 'overview' ? trail : [...trail, crumb(page, district.id)],
        figures: figuresFor(figures.districts?.get(district.id) ?? [], key),
        index: true,
      });
    }
  }

  for (const school of schools) {
    const district = districtById.get(school.district_id);
    const town = townName.get(school.town_id);
    const name = schoolName(school, town);
    const enabled = Object.values(PAGE_REGISTRY.school).filter(page => isEnabled(page, school));
    const topics = enabled.map(page => TOPICS[pageKey(page)]).filter(Boolean);
    const inDistrict = district ? ` (${districtTitle(district.name)})` : '';
    const sections = [
      { heading: name, links: enabled.map(page => pageLink(page, school.id)) },
      ...(district ? [{ heading: 'District', links: [districtLink(district)] }] : []),
      { heading: 'On this site', links: mainLinks },
    ];
    const trail = [home, ...(district ? [districtLink(district)] : [crumb(general.schools)]), schoolLink(school)];
    for (const page of enabled) {
      const key = pageKey(page);
      pages.push({
        path: basePath(page.urlPatterns[0], school.id),
        title: pageTitle(page, name),
        heading: key === 'overview' ? name : `${name}: ${page.displayName}`,
        description: key === 'overview'
          ? `${capitalized(listNames(topics))} for ${name}${inDistrict}, ${SOURCE}.`
          : `${SCHOOL_SHOWS[key] ?? page.displayName} for ${name}${inDistrict}, ${SOURCE}.`,
        sections,
        breadcrumbs: key === 'overview' ? trail : [...trail, crumb(page, school.id)],
        figures: figuresFor(figures.schools?.get(school.id) ?? [], key),
        index: true,
      });
    }
  }

  // Signed-in pages: the app alone, kept out of search results
  for (const page of Object.values(PAGE_REGISTRY.admin)) {
    pages.push({ path: page.urlPatterns[0], title: pageTitle(page), heading: page.displayName, description: '', sections: [], breadcrumbs: [], figures: [], index: false });
  }

  return pages;
};

/** Served, with a 404 status, for any address the site doesn't have; the app shows its not-found page */
export const notFoundPage = (): StaticPage => ({
  path: '/404',
  title: `Page not found | ${SITE_NAME}`,
  heading: 'Page not found',
  description: "We couldn't find that page.",
  sections: [{ heading: 'On this site', links: [PAGE_REGISTRY.general.home, PAGE_REGISTRY.general.districts, PAGE_REGISTRY.general.schools].map(page => ({ href: page.urlPatterns[0], text: page.displayName })) }],
  breadcrumbs: [],
  figures: [],
  index: false,
});

/**
 * The server's rewrites for addresses with optional parts, e.g. /district/12/financials/revenue is
 * served the page written for /district/12/financials. An id the site doesn't have finds no file, so
 * it gets the 404 page.
 */
export const paramRewrites = (): { source: string; destination: string }[] =>
  Object.values(PAGE_REGISTRY)
    .flatMap(category => Object.values(category))
    .flatMap(page => page.urlPatterns)
    .map(pattern => pattern.replace(/\?$/, ''))
    .filter(pattern => /\/:(?!id$)[A-Za-z]+$/.test(pattern))
    .map(pattern => ({ source: pattern, destination: `${pattern.replace(/\/:[A-Za-z]+$/, '')}/index.html` }));

// -------------------- HTML --------------------

const escaped = (text: string): string =>
  text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/**
 * schema.org data for search results: the home page names the site (shown as the site's name in
 * Google's results), and every other page gives its breadcrumb trail
 */
export const structuredData = (page: StaticPage): object | null => {
  if (!page.index) return null;
  if (page.path === PAGE_REGISTRY.general.home.urlPatterns[0]) {
    return { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, alternateName: 'NHFacts.com', url: `${SITE_URL}/` };
  }
  if (page.breadcrumbs.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: page.breadcrumbs.map((link, i) => ({ '@type': 'ListItem', position: i + 1, name: link.text, item: `${SITE_URL}${link.href}` })),
  };
};

// JSON in a <script>: "<" escaped so no name can end the script early
const scriptJson = (data: object): string => JSON.stringify(data).replace(/</g, '\\u003c');

const headTags = (page: StaticPage): string[] => {
  if (!page.index) return ['<meta name="robots" content="noindex" />'];
  const url = `${SITE_URL}${page.path}`;
  const data = structuredData(page);
  return [
    `<meta name="description" content="${escaped(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escaped(page.heading)}" />`,
    `<meta property="og:description" content="${escaped(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    '<meta property="og:locale" content="en_US" />',
    '<meta name="twitter:card" content="summary" />',
    ...(data ? [`<script type="application/ld+json">${scriptJson(data)}</script>`] : []),
  ];
};

// For visitors and crawlers without JavaScript. Browsers that run it never draw it (the head marks
// the page as running scripts before the body is drawn), so it doesn't flash before the app starts
const BODY_STYLE = "max-width:960px;margin:0 auto;padding:16px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.5";
const HIDE_WITH_SCRIPTS = [
  "<script>document.documentElement.classList.add('scripts-run')</script>",
  '<style>.scripts-run .static-page{display:none}</style>',
];

/** A tile as a sentence: "Cost per Student: $24,412 (24/25). Up 52% since 2014-15. Statewide $22,699." */
export const tileText = (tile: TileModel): string => {
  const details = typeof tile.detail === 'string' ? [tile.detail] : tile.detail ?? [];
  return [`${tile.label}: ${tile.value} (${tile.period})`, tile.delta?.spoken, ...details]
    .filter(Boolean)
    .map(part => part!.replace(/\.$/, ''))
    .join('. ') + '.';
};

// An overview with one untitled group (a school's) gets a plain heading
const figuresHtml = (groups: TileGroupModel[]): string =>
  groups.map(group => `<h2>${escaped(group.title ?? 'Key Figures')}</h2><ul>${group.tiles.map(tile => `<li>${escaped(tileText(tile))}</li>`).join('')}</ul>`).join('');

const bodyHtml = (page: StaticPage): string => {
  if (!page.index && !page.sections.length) return '';
  const sections = page.sections.map(section =>
    `<h2>${escaped(section.heading)}</h2><ul>${section.links.map(link => `<li><a href="${escaped(link.href)}">${escaped(link.text)}</a></li>`).join('')}</ul>`
  ).join('');
  return `<div class="static-page" style="${BODY_STYLE}"><p><a href="/">${SITE_NAME}</a></p><h1>${escaped(page.heading)}</h1><p>${escaped(page.description)}</p>${figuresHtml(page.figures)}${sections ? `<nav>${sections}</nav>` : ''}</div>`;
};

/** sitemap.xml: every page search engines should index */
export const sitemap = (pages: StaticPage[]): string => [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.filter(page => page.index).map(page => `  <url><loc>${escaped(`${SITE_URL}${page.path}`)}</loc></url>`),
  '</urlset>',
  '',
].join('\n');

/** The built index.html with a page's title, head tags and content */
export const renderPage = (template: string, page: StaticPage): string => {
  if (!/<title>[^<]*<\/title>/.test(template) || !template.includes('<div id="root"></div>')) {
    throw new Error('index.html needs a <title> and an empty <div id="root"></div>');
  }
  return template
    .replace(/<title>[^<]*<\/title>/, () => [`<title>${escaped(page.title)}</title>`, ...headTags(page), ...HIDE_WITH_SCRIPTS].join('\n    '))
    .replace('<div id="root"></div>', () => `<div id="root">${bodyHtml(page)}</div>`);
};

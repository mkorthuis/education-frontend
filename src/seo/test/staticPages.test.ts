import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import type { TileGroupModel, TileModel } from '@/features/entity/overview/tileModels';
import {
  districtFigureScope, notFoundPage, pageTitle, paramRewrites, renderPage, schoolFigureScope, SiteIndex, sitemap, staticPages, structuredData, tileText,
} from '../staticPages';

const grades = (...names: string[]) => names.map(name => ({ name }));

const INDEX: SiteIndex = {
  districts: [
    { id: 8, name: 'Concord', sau_id: 8, towns: [1], grades: grades('Kindergarten', 'Grade 12') },
    { id: 2, name: "Hale's Location", sau_id: 97, towns: [2, 3], grades: [] },
  ],
  schools: [
    { id: 80, name: 'Concord High School', district_id: 8, town_id: 1, grades: grades('Grade 9', 'Grade 12') },
    { id: 81, name: 'Abbot-Downing School', district_id: 8, town_id: 1, grades: grades('Kindergarten', 'Grade 5') },
    // Private: its district isn't a public one
    { id: 99, name: "St. Paul's School", district_id: 500, town_id: 1, grades: grades('Grade 9', 'Grade 12') },
  ],
  towns: [
    { id: 1, name: 'Concord' },
    { id: 2, name: "Hale's Location" },
    { id: 3, name: 'Bartlett' },
  ],
};

const TEMPLATE = '<!doctype html><html><head><title>New Hampshire Education Facts</title><script src="/assets/index.js"></script></head><body><div id="root"></div></body></html>';

describe('static pages', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GRADUATION_GRADE', 'Grade 12');
  });

  const pages = () => staticPages(INDEX);
  const page = (path: string) => pages().find(p => p.path === path);

  it('writes every general and statewide page, and the pages each district and public school has', () => {
    const paths = pages().map(p => p.path);
    expect(paths).toEqual(expect.arrayContaining(['/', '/about', '/districts', '/schools', '/ask', '/state', '/state/academic', '/state/efa']));
    expect(paths).toEqual(expect.arrayContaining(['/district/8', '/district/8/academic', '/district/8/outcomes', '/district/8/financials', '/district/8/contact']));
    expect(paths).toEqual(expect.arrayContaining(['/school/80', '/school/80/outcomes', '/school/81', '/school/81/academic']));
    // A district without schools has no academics; an elementary school has no graduation page
    expect(paths).toContain('/district/2');
    expect(paths).not.toContain('/district/2/academic');
    expect(paths).not.toContain('/school/81/outcomes');
    // Private schools aren't on the site
    expect(paths.some(path => path.startsWith('/school/99'))).toBe(false);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('names the district or school in titles, headings and descriptions', () => {
    expect(page('/district/8')?.title).toBe('Concord School District | NH Education Facts');
    expect(page('/district/8/financials')?.title).toBe('Financials – Concord School District | NH Education Facts');
    expect(page('/district/8/financials')?.description).toBe(
      'Cost per pupil, spending and revenue, and assets and liabilities for Concord School District, from New Hampshire Department of Education data.'
    );
    expect(page('/district/8')?.description).toMatch(/^Test results, graduation, spending, safety, staff, enrollment and Education Freedom Accounts for Concord School District, from/);
    expect(page('/school/81/academic')?.heading).toBe('Abbot-Downing School, Concord: Academic Performance');
    expect(page('/school/81')?.description).toBe(
      'Test results, safety and enrollment for Abbot-Downing School, Concord (Concord School District), from New Hampshire Department of Education data.'
    );
    expect(page('/district/2')?.description).toBe(
      "Hale's Location School District (Hale's Location and Bartlett) doesn't run its own schools. See its spending, enrollment and Education Freedom Accounts, from New Hampshire Department of Education data."
    );
  });

  it('keeps the titles the app gives general and statewide pages', () => {
    expect(page('/')?.title).toBe('NH Education Facts');
    expect(page('/about')?.title).toBe('About Us | NH Education Facts');
    expect(page('/state')?.title).toBe('Explore Statewide Data | NH Education Facts');
    expect(page('/state/financials')?.title).toBe('Financials – New Hampshire | NH Education Facts');
    expect(pageTitle(PAGE_REGISTRY.school.safety, 'Concord High School, Concord')).toBe('Safety – Concord High School, Concord | NH Education Facts');
  });

  it('links each page to its sections and neighbors, and lists every district and school', () => {
    const district = page('/district/8/staff')!;
    expect(district.sections[0].links.map(link => link.href)).toContain('/district/8/financials');
    expect(district.sections[1]).toEqual({ heading: 'Schools', links: [
      { href: '/school/81', text: 'Abbot-Downing School, Concord' },
      { href: '/school/80', text: 'Concord High School, Concord' },
    ] });
    expect(page('/school/80')?.sections[1].links).toEqual([{ href: '/district/8', text: 'Concord School District' }]);
    expect(page('/districts')?.sections[0].links.map(link => link.href)).toEqual(['/district/8', '/district/2']);
    expect(page('/schools')?.sections[0].links).toHaveLength(2);
  });

  it('keeps signed-in pages out of search results', () => {
    expect(page('/admin')?.index).toBe(false);
    expect(renderPage(TEMPLATE, page('/admin')!)).toContain('<meta name="robots" content="noindex" />');
  });
});

describe('rendering a page', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GRADUATION_GRADE', 'Grade 12');
  });

  it('adds the title, description, canonical address, share tags and content, escaped', () => {
    const html = renderPage(TEMPLATE, staticPages(INDEX).find(p => p.path === '/district/2')!);
    expect(html).toContain("<title>Hale&#39;s Location School District | NH Education Facts</title>");
    expect(html).toContain('<link rel="canonical" href="https://www.nhfacts.com/district/2" />');
    expect(html).toContain('<meta property="og:title" content="Hale&#39;s Location School District" />');
    expect(html).toContain('<meta name="description" content="Hale&#39;s Location School District (Hale&#39;s Location and Bartlett) doesn&#39;t run');
    expect(html).toContain('<h1>Hale&#39;s Location School District</h1>');
    expect(html).toContain('<li><a href="/district/2/financials">Financials</a></li>');
    expect(html).toContain('<script src="/assets/index.js"></script>');
    expect(html).not.toContain('New Hampshire Education Facts</title>');
  });

  it('hides the content from browsers that run scripts, before the body is drawn', () => {
    const html = renderPage(TEMPLATE, staticPages(INDEX).find(p => p.path === '/district/8')!);
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toContain("<script>document.documentElement.classList.add('scripts-run')</script>");
    expect(head).toContain('<style>.scripts-run .static-page{display:none}</style>');
    expect(html).toMatch(/<div id="root"><div class="static-page" style="/);
  });

  it('gives the 404 page links home and keeps it out of search results', () => {
    const html = renderPage(TEMPLATE, notFoundPage());
    expect(html).toContain('<title>Page not found | NH Education Facts</title>');
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toContain('<a href="/districts">All Districts</a>');
  });

  it('refuses a template it can’t fill', () => {
    expect(() => renderPage('<html><body><div id="app"></div></body></html>', notFoundPage())).toThrow(/root/);
  });
});

describe('key figures', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GRADUATION_GRADE', 'Grade 12');
  });

  const tile = (key: string, page: string, extra: Partial<TileModel> = {}): TileModel =>
    ({ key, page, label: key, value: '1', period: '24/25', linkLabel: key, ...extra });
  const groups: TileGroupModel[] = [
    { title: 'Students and Spending', tiles: [tile('Students', 'enrollment'), tile('Cost per Student', 'financials')] },
    { title: 'Results', tiles: [tile('Proficient in Math', 'academic'), tile('Four-Year Graduation Rate', 'outcomes')] },
  ];
  const pages = () => staticPages(INDEX, { districts: new Map([[8, groups]]) });
  const page = (path: string) => pages().find(p => p.path === path)!;

  it('shows all of a district’s tiles on its overview, and each topic page its own', () => {
    expect(page('/district/8').figures).toEqual(groups);
    expect(page('/district/8/financials').figures).toEqual([{ title: 'Students and Spending', tiles: [groups[0].tiles[1]] }]);
    expect(page('/district/8/academic').figures).toEqual([{ title: 'Results', tiles: [groups[1].tiles[0]] }]);
    expect(page('/district/8/contact').figures).toEqual([]);
    expect(page('/district/2').figures).toEqual([]);
  });

  it('writes each tile as a sentence, under its group', () => {
    expect(tileText(tile('Cost per Student', 'financials', {
      value: '$24,351',
      delta: { direction: 'up', tone: 'bad', amount: '78%', since: '14/15', spoken: 'Up 78% since 2014-15' },
      detail: ['Statewide $22,699', 'Up 31% after inflation'],
    }))).toBe('Cost per Student: $24,351 (24/25). Up 78% since 2014-15. Statewide $22,699. Up 31% after inflation.');
    expect(tileText(tile('Students', 'enrollment', { value: '3,701', detail: 'Public school students living in Concord' })))
      .toBe('Students: 3,701 (24/25). Public school students living in Concord.');
    const html = renderPage(TEMPLATE, page('/district/8/financials'));
    expect(html).toContain('<h2>Students and Spending</h2><ul><li>Cost per Student: 1 (24/25).</li></ul>');
  });

  it('loads test results only for districts that run schools, and graduation only where there’s a graduation page', () => {
    expect(districtFigureScope(INDEX)).toEqual([
      { id: 8, hasSchools: true, hasGraduation: true },
      { id: 2, hasSchools: false, hasGraduation: false },
    ]);
  });

  it('shows a school’s tiles under a plain heading, its overview all of them and each topic page its own', () => {
    const schoolGroups: TileGroupModel[] = [{ tiles: [tile('Students', 'enrollment'), tile('Proficient in Math', 'academic')] }];
    const schoolPages = staticPages(INDEX, { schools: new Map([[81, schoolGroups]]) });
    const at = (path: string) => schoolPages.find(p => p.path === path)!;
    expect(at('/school/81').figures).toEqual(schoolGroups);
    expect(at('/school/81/academic').figures).toEqual([{ tiles: [schoolGroups[0].tiles[1]] }]);
    expect(renderPage(TEMPLATE, at('/school/81'))).toContain('<h2>Key Figures</h2><ul><li>Students: 1 (24/25).</li>');
  });

  it('compares a school with its district only where the district’s figures aren’t just the school’s', () => {
    expect(schoolFigureScope(INDEX)).toEqual([
      // Concord High is the district's one high school: its test scores are compared, its graduation isn't
      { id: 80, districtId: 8, hasGraduation: true, compareDistrict: true, compareDistrictGraduation: false },
      { id: 81, districtId: 8, hasGraduation: false, compareDistrict: true, compareDistrictGraduation: true },
    ]);
  });
});

describe('structured data', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GRADUATION_GRADE', 'Grade 12');
  });

  const page = (path: string) => staticPages(INDEX).find(p => p.path === path)!;

  it('names the site on the home page', () => {
    expect(structuredData(page('/'))).toEqual({
      '@context': 'https://schema.org', '@type': 'WebSite', name: 'NH Education Facts', alternateName: 'NHFacts.com', url: 'https://www.nhfacts.com/',
    });
  });

  it('gives each page its breadcrumb trail', () => {
    const trail = (path: string) => (structuredData(page(path)) as { itemListElement: { name: string; item: string; position: number }[] })
      .itemListElement.map(item => `${item.position} ${item.name} ${item.item.replace('https://www.nhfacts.com', '')}`);
    expect(trail('/district/8/financials')).toEqual([
      '1 NH Education Facts /', '2 All Districts /districts', '3 Concord School District /district/8', '4 Financials /district/8/financials',
    ]);
    expect(trail('/school/80')).toEqual(['1 NH Education Facts /', '2 Concord School District /district/8', '3 Concord High School, Concord /school/80']);
    expect(trail('/state/efa')).toEqual(['1 NH Education Facts /', '2 Statewide Data /state', '3 Education Freedom Accounts /state/efa']);
    expect(trail('/about')).toEqual(['1 NH Education Facts /', '2 About Us /about']);
    expect(structuredData(page('/admin'))).toBeNull();
  });

  it('is written into the page so a name can’t end the script early', () => {
    const html = renderPage(TEMPLATE, { ...page('/district/2'), breadcrumbs: [{ href: '/', text: 'Home' }, { href: '/x', text: '</script><b>' }] });
    expect(html).toContain('<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList"');
    expect(html).toContain('"name":"\\u003c/script>\\u003cb>"');
    expect(html).not.toContain('</script><b>');
  });
});

describe('the sitemap', () => {
  it('lists every page search engines should index, and not the others', () => {
    vi.stubEnv('VITE_GRADUATION_GRADE', 'Grade 12');
    const pages = staticPages(INDEX);
    const xml = sitemap(pages);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
    expect(xml).toContain('  <url><loc>https://www.nhfacts.com/</loc></url>');
    expect(xml).toContain('  <url><loc>https://www.nhfacts.com/district/2/financials</loc></url>');
    expect(xml).not.toContain('/admin');
    expect(xml.match(/<url>/g)).toHaveLength(pages.filter(page => page.index).length);
  });
});

describe('rewrites', () => {
  it('serves an address with an optional part the page written for the address without it', () => {
    const rewrites = paramRewrites();
    expect(rewrites).toEqual(expect.arrayContaining([
      { source: '/state/academic/:subjectName', destination: '/state/academic/index.html' },
      { source: '/district/:id/academic/:subjectName', destination: '/district/:id/academic/index.html' },
      { source: '/district/:id/financials/:tab', destination: '/district/:id/financials/index.html' },
      { source: '/school/:id/safety/:category', destination: '/school/:id/safety/index.html' },
    ]));
    // Plain pages are files, not rewrites
    expect(rewrites.some(rewrite => rewrite.source === '/district/:id' || rewrite.source === '/')).toBe(false);
  });
});

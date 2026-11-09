import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { notFoundPage, pageTitle, paramRewrites, renderPage, SiteIndex, sitemap, staticPages } from '../staticPages';

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

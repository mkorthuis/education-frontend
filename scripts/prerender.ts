/**
 * After `vite build`: writes dist/<address>/index.html for every page on the site, the 404 page,
 * dist/sitemap.xml, and dist/serve.json with the rewrites that serve them (see src/seo/staticPages.ts).
 *
 * Run with `vite-node --mode production scripts/prerender.ts`, so it reads the production API's
 * district, school and town lists. If the API can't be reached the build fails, and Heroku keeps
 * the release that's running.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { notFoundPage, paramRewrites, renderPage, SiteIndex, sitemap, staticPages } from '@/seo/staticPages';

const DIST = path.resolve(process.cwd(), 'dist');
const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/location`;

const fetchList = async <T>(url: string): Promise<T[]> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const list = await response.json();
  if (!Array.isArray(list) || !list.length) throw new Error(`${url}: no items`);
  return list;
};

const main = async () => {
  const [districts, schools, towns] = await Promise.all([
    fetchList<SiteIndex['districts'][number]>(`${API}/district?is_public=true`),
    fetchList<SiteIndex['schools'][number]>(`${API}/school`),
    fetchList<SiteIndex['towns'][number]>(`${API}/town`),
  ]);

  const template = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const pages = staticPages({ districts, schools, towns });
  for (const page of pages) {
    const file = path.join(DIST, page.path, 'index.html');
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, renderPage(template, page));
  }
  await writeFile(path.join(DIST, '404.html'), renderPage(template, notFoundPage()));
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap(pages));

  // public/serve.json holds the headers; the rewrites come from the page registry
  const serveConfig = JSON.parse(await readFile(path.join(DIST, 'serve.json'), 'utf8'));
  await writeFile(path.join(DIST, 'serve.json'), JSON.stringify({ ...serveConfig, rewrites: paramRewrites() }, null, 2));

  console.log(`Prerendered ${pages.length} pages (${districts.length} districts, ${schools.length} schools listed) and the 404 page`);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});

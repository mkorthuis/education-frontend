/**
 * After `vite build`: writes dist/<address>/index.html for every page on the site, the 404 page,
 * dist/sitemap.xml, and dist/serve.json with the rewrites that serve them (see src/seo/staticPages.ts).
 *
 * Run with `vite-node --mode production scripts/prerender.ts`, so it reads the production API: the
 * district, school and town lists, and each district's key figures (about 1,300 requests, a few at a
 * time). If the lists can't be read, or more than a tenth of the districts' figures can't, the build
 * fails and Heroku keeps the release that's running. A district whose figures can't be read gets its
 * pages without them.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DistrictFigureRows, districtKeyFigures, districtTileGroups } from '@/features/district/utils/keyFigures';
import type { TileGroupModel } from '@/features/entity/overview/tileModels';
import { districtFigureScope, notFoundPage, paramRewrites, renderPage, SiteIndex, sitemap, staticPages } from '@/seo/staticPages';

const DIST = path.resolve(process.cwd(), 'dist');
const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
// Requests at once, so the build doesn't crowd out the site's visitors
const AT_ONCE = 6;

const getJson = async <T>(url: string, { emptyIfMissing = false } = {}): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      // The API answers 404 for a place with no rows of a kind ("No education freedom account entries found")
      if (emptyIfMissing && response.status === 404) return [] as T;
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
};

const fetchList = async <T>(url: string): Promise<T[]> => {
  const list = await getJson<T[]>(url);
  if (!Array.isArray(list) || !list.length) throw new Error(`${url}: no items`);
  return list;
};

/** Runs the tasks AT_ONCE at a time */
const inTurn = async <T>(tasks: (() => Promise<T>)[]): Promise<T[]> => {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  await Promise.all(Array.from({ length: AT_ONCE }, async () => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }));
  return results;
};

/** Each district's overview tiles, by the same requests and calculation as the app's overview */
const districtFigures = async (index: SiteIndex): Promise<Map<number, TileGroupModel[]>> => {
  const allStudents = 'assessment_subgroup_id=1';
  const [perPupil, salary, assessments, cohorts, plans, efaEntryTypes] = await Promise.all([
    getJson<DistrictFigureRows['state']['perPupil']>(`${API}/finance/per-pupil/state`),
    getJson<DistrictFigureRows['state']['salary']>(`${API}/staff/state/teacher-average-salary`),
    getJson<DistrictFigureRows['state']['assessments']>(`${API}/assessment/state?${allStudents}`),
    getJson<DistrictFigureRows['state']['cohorts']>(`${API}/outcome/outcome/graduation-cohort/state`),
    getJson<DistrictFigureRows['state']['plans']>(`${API}/outcome/outcome/post-graduation/state`),
    getJson<DistrictFigureRows['efaEntryTypes']>(`${API}/education-freedom-account/entry-type`),
  ]);
  const state = { perPupil, salary, assessments, cohorts, plans };
  const townName = new Map(index.towns.map(town => [town.id, town.name]));
  const districtById = new Map(index.districts.map(district => [district.id, district]));
  const none = Promise.resolve([]);
  const missing = { emptyIfMissing: true };

  const figures = new Map<number, TileGroupModel[]>();
  const failed: number[] = [];
  await inTurn(districtFigureScope(index).map(({ id, hasSchools, hasGraduation }) => async () => {
    const district = `district_id=${id}`;
    try {
      const [townEnrollment, perPupil, salary, efaEntries, assessments, cohorts, plans] = await Promise.all([
        getJson<DistrictFigureRows['townEnrollment']>(`${API}/enrollment/town?${district}`, missing),
        getJson<DistrictFigureRows['perPupil']>(`${API}/finance/per-pupil/district?${district}`, missing),
        hasSchools ? getJson<DistrictFigureRows['salary']>(`${API}/staff/district/teacher-average-salary?${district}`, missing) : none,
        getJson<DistrictFigureRows['efaEntries']>(`${API}/education-freedom-account/entry?${district}`, missing),
        hasSchools ? getJson<DistrictFigureRows['assessments']>(`${API}/assessment/district?${district}&${allStudents}`, missing) : none,
        hasGraduation ? getJson<DistrictFigureRows['cohorts']>(`${API}/outcome/outcome/graduation-cohort/district?${district}`, missing) : none,
        hasGraduation ? getJson<DistrictFigureRows['plans']>(`${API}/outcome/outcome/post-graduation/district?${district}`, missing) : none,
      ]);
      const rows = { townEnrollment, perPupil, salary, efaEntries, efaEntryTypes, assessments, cohorts, plans, state } as DistrictFigureRows;
      const towns = districtById.get(id)!.towns.map(town => ({ name: townName.get(town) ?? '' }));
      figures.set(id, districtTileGroups(districtKeyFigures(rows), towns));
    } catch (error) {
      console.warn(`District ${id}: no key figures (${error instanceof Error ? error.message : error})`);
      failed.push(id);
    }
  }));
  if (failed.length > index.districts.length / 10) {
    throw new Error(`Key figures failed for ${failed.length} of ${index.districts.length} districts`);
  }
  return figures;
};

const main = async () => {
  const [districts, schools, towns] = await Promise.all([
    fetchList<SiteIndex['districts'][number]>(`${API}/location/district?is_public=true`),
    fetchList<SiteIndex['schools'][number]>(`${API}/location/school`),
    fetchList<SiteIndex['towns'][number]>(`${API}/location/town`),
  ]);
  const index = { districts, schools, towns };
  const started = Date.now();
  const figures = { districts: await districtFigures(index) };
  console.log(`Read key figures for ${figures.districts.size} districts in ${Math.round((Date.now() - started) / 1000)} s`);

  const template = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const pages = staticPages(index, figures);
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

#!/usr/bin/env node
/**
 * Load test: simulated visitors browse the live site, each visit loading a page and the API calls
 * the app makes for it (recorded from the app on 2026-11-09), in stages of more and more visitors
 * at once. It stops early when a stage's errors or slowness pass the limits, so it can't keep
 * pressing on a struggling site.
 *
 * Ask a Question isn't tested: every new question costs money.
 *
 *   node scripts/load-test.mjs                      # stages of 5, 15, 30 and 60 visitors, 45 s each
 *   node scripts/load-test.mjs --stages 5,10 --seconds 20
 *   node scripts/load-test.mjs --site http://localhost:3000 --api https://localhost:8000
 *
 * Options: --stages (visitors at once, per stage), --seconds (per stage), --think (ms a visitor
 * waits between pages, default 2000), --max-errors (share of failed requests that stops the test,
 * default 0.02), --max-p95 (ms; the 95th-percentile time that stops the test, default 4000).
 */

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith('--') ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), [])
);
const SITE = args.site ?? 'https://www.nhfacts.com';
const API = `${args.api ?? 'https://api.nhfacts.com'}/api/v1`;
const STAGES = (args.stages ?? '5,15,30,60').split(',').map(Number);
const SECONDS = Number(args.seconds ?? 45);
const THINK = Number(args.think ?? 2000);
const MAX_ERRORS = Number(args['max-errors'] ?? 0.02);
const MAX_P95 = Number(args['max-p95'] ?? 4000);
// A browser makes at most 6 requests to a host at once
const PER_VISIT = 6;
const HEADERS = { 'user-agent': 'nhfacts-load-test', origin: 'https://www.nhfacts.com' };

// The API calls each kind of page makes on a first visit; {d} is the district, {s} the school
const VISITS = [
  { weight: 20, page: '/', api: [] },
  {
    weight: 35, page: '/district/{d}', api: [
      'location/district/{d}', 'location/grade', 'location/sau?district_id={d}', 'location/school?district_id={d}', 'location/town?district_id={d}',
      'assessment/district?district_id={d}&assessment_subgroup_id=1', 'assessment/state?assessment_subgroup_id=1', 'assessment/subgroup', 'assessment/subject',
      'education-freedom-account/entry-type', 'education-freedom-account/entry?district_id={d}', 'enrollment/town?district_id={d}',
      'finance/per-pupil/district?district_id={d}', 'finance/per-pupil/state', 'outcome/outcome/graduation-cohort/district?district_id={d}',
      'outcome/outcome/graduation-cohort/state', 'outcome/outcome/post-graduation/district?district_id={d}', 'outcome/outcome/post-graduation/state',
      'staff/district/teacher-average-salary?district_id={d}', 'staff/state/teacher-average-salary',
    ],
  },
  {
    weight: 15, page: '/district/{d}/financials', api: [
      'location/district/{d}', 'location/sau?district_id={d}', 'location/school?district_id={d}', 'location/town?district_id={d}',
      'finance/entry-types', 'finance/fund-types', 'finance/per-pupil/district?district_id={d}', 'finance/per-pupil/state', 'finance/report?district_id={d}',
      'finance/state-adm', 'finance/state-expenditure', 'finance/state-expenditure-rollup', 'finance/state-revenue',
    ],
  },
  {
    weight: 20, page: '/school/{s}', api: [
      'location/school/{s}', 'location/district?school_id={s}', 'location/grade', 'location/sau?district_id={d}', 'location/school?district_id={d}',
      'location/town?district_id={d}', 'assessment/district?district_id={d}&assessment_subgroup_id=1', 'assessment/school?school_id={s}&assessment_subgroup_id=1',
      'assessment/state?assessment_subgroup_id=1', 'assessment/subgroup', 'assessment/subject', 'enrollment/school/{s}',
    ],
  },
  {
    weight: 10, page: '/state', api: [
      'assessment/state', 'assessment/subgroup', 'assessment/subject', 'education-freedom-account/entry-type', 'education-freedom-account/state-entry',
      'enrollment/school-counts/state', 'enrollment/town/state', 'enrollment/type/state', 'finance/per-pupil/state', 'finance/state-adm',
      'finance/state-expenditure-rollup', 'location/grade', 'outcome/outcome/graduation-cohort/state', 'outcome/outcome/post-graduation/state',
      'staff/state/staff', 'staff/state/teacher-average-salary',
    ],
  },
];

const pick = list => list[Math.floor(Math.random() * list.length)];
const pickVisit = () => {
  let roll = Math.random() * VISITS.reduce((sum, visit) => sum + visit.weight, 0);
  return VISITS.find(visit => (roll -= visit.weight) < 0) ?? VISITS[0];
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const timed = async (kind, url, results) => {
  const start = performance.now();
  let status = 'no response';
  try {
    // Heroku's router gives up on a request at 30 seconds too
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) });
    await response.arrayBuffer();
    status = response.status;
  } catch (error) {
    status = error.name === 'TimeoutError' ? 'timed out' : 'no response';
  }
  results.push({ kind, ms: performance.now() - start, ok: typeof status === 'number' && status < 400, status, url });
};

/** The most common failures: "503 /api/v1/finance/report?district_id={id}" */
const failures = results => {
  const counts = new Map();
  for (const { ok, status, url } of results) {
    if (ok) continue;
    const key = `${status} ${new URL(url).pathname}${new URL(url).search.replace(/=\d+/g, '={id}')}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, count]) => `    ${count} × ${key}`);
};

const visit = async (places, results) => {
  const { page, api } = pickVisit();
  const school = pick(places.schools);
  const district = page.includes('{s}') ? school.district_id : pick(places.districts).id;
  const fill = path => path.replaceAll('{d}', district).replaceAll('{s}', school.id);
  await timed('page', `${SITE}${fill(page)}`, results);
  const queue = api.map(fill);
  await Promise.all(Array.from({ length: PER_VISIT }, async () => {
    while (queue.length) await timed('api', `${API}/${queue.shift()}`, results);
  }));
};

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

const summary = results => {
  const ms = results.map(result => result.ms);
  const errors = results.filter(result => !result.ok).length;
  return { requests: results.length, errors, errorRate: results.length ? errors / results.length : 0, p50: percentile(ms, 50), p95: percentile(ms, 95), p99: percentile(ms, 99) };
};

const main = async () => {
  const [districts, allSchools] = await Promise.all([
    fetch(`${API}/location/district?is_public=true`, { headers: HEADERS }).then(r => r.json()),
    fetch(`${API}/location/school`, { headers: HEADERS }).then(r => r.json()),
  ]);
  const publicIds = new Set(districts.map(district => district.id));
  const places = { districts, schools: allSchools.filter(school => publicIds.has(school.district_id)) };
  console.log(`${SITE} and ${API}: ${places.districts.length} districts, ${places.schools.length} schools`);
  console.log(`Stages of ${STAGES.join(', ')} visitors at once, ${SECONDS} s each, ${THINK} ms between pages; stops past ${MAX_ERRORS * 100}% errors or a ${MAX_P95} ms p95\n`);
  console.log('visitors  visits  requests  req/s  errors  page p50/p95 ms   api p50/p95/p99 ms');

  for (const users of STAGES) {
    const results = [];
    let visits = 0;
    const end = Date.now() + SECONDS * 1000;
    await Promise.all(Array.from({ length: users }, async (_, i) => {
      // Visitors arrive spread over the first think time, not all in the same instant
      await sleep((i / users) * THINK);
      while (Date.now() < end) {
        await visit(places, results);
        visits += 1;
        await sleep(THINK * (0.5 + Math.random()));
      }
    }));
    const all = summary(results);
    const pages = summary(results.filter(result => result.kind === 'page'));
    const api = summary(results.filter(result => result.kind === 'api'));
    console.log([
      String(users).padStart(8), String(visits).padStart(7), String(all.requests).padStart(9), (all.requests / SECONDS).toFixed(1).padStart(6),
      `${all.errors} (${(all.errorRate * 100).toFixed(1)}%)`.padStart(10),
      `${pages.p50.toFixed(0)}/${pages.p95.toFixed(0)}`.padStart(16),
      `${api.p50.toFixed(0)}/${api.p95.toFixed(0)}/${api.p99.toFixed(0)}`.padStart(20),
    ].join(''));
    for (const line of failures(results)) console.log(line);
    if (all.errorRate > MAX_ERRORS || all.p95 > MAX_P95) {
      console.log(`\nStopped: ${all.errorRate > MAX_ERRORS ? `${(all.errorRate * 100).toFixed(1)}% of requests failed` : `p95 of ${all.p95.toFixed(0)} ms`} at ${users} visitors at once.`);
      return;
    }
  }
  console.log('\nEvery stage passed.');
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});

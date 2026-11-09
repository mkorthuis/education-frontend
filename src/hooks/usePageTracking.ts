import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { districtTitle } from '@/features/district/utils/labels';
import { PageEntry, extractIdsFromUrl, getAllPages } from '@/routes/pageRegistry';
import { pageTitle, schoolName, SITE_NAME } from '@/seo/staticPages';
import { useAppSelector } from '@/store/hooks';
import type { District, School, Town } from '@/store/slices/locationSlice';
import { trackOutboundClick } from '@/utils/analytics';
import { GA_MEASUREMENT_ID, IS_DEV } from '@/utils/environment';
import { schoolTown } from '@/utils/formatting';

declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: {
        page_path?: string;
        page_title?: string;
        [key: string]: any;
      }
    ) => void;
    dataLayer: any[];
  }
}

const pageAt = (pathname: string): PageEntry | undefined =>
  getAllPages().find(page => page.urlPatterns.some(pattern => matchPath({ path: pattern, end: true }, pathname)));

/**
 * The district or school a page is about, once it has loaded ("Concord School District",
 * "Rundlett Middle School, Concord"), the same names the pages written at build time use
 */
export const subjectOf = (pathname: string, district: District | null, school: School | null, towns: Town[]): string | undefined => {
  const { districtId, schoolId } = extractIdsFromUrl(pathname);
  if (schoolId) return school?.id === schoolId ? schoolName(school, schoolTown(school, towns)) : undefined;
  if (districtId) return district?.id === districtId ? districtTitle(district.name) : undefined;
  return undefined;
};

/** "Financials – Concord School District | NH Education Facts"; statewide pages say they cover New Hampshire */
export const documentTitle = (pathname: string, subject?: string): string => {
  const page = pageAt(pathname);
  return page ? pageTitle(page, subject) : SITE_NAME;
};

/**
 * Hook to track page views in a single page application
 * This sends a pageview event to Google Analytics when the route changes
 */
const usePageTracking = (): void => {
  const location = useLocation();
  
  // Load Google Analytics script only once in production
  useEffect(() => {
    if (IS_DEV) return; // Skip in development
    if (!GA_MEASUREMENT_ID) return; // Measurement ID missing

    // If gtag is already initialized, skip
    if (typeof window.gtag === 'function') return;

    // Inject gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments as any);
    }
    // @ts-ignore
    window.gtag = gtag;
    window.gtag('js', new Date() as any);
    window.gtag('config', GA_MEASUREMENT_ID);
  }, []);

  // The page's name alone, so analytics groups each kind of page together
  const getPageTitle = (pathname: string): string => pageAt(pathname)?.displayName ?? SITE_NAME;

  // Read from the state rather than locationSlice's selectors: the layouts import this hook, and
  // importing locationSlice from here would load it before the store, which it imports back (through
  // the API client's auth service), and the app wouldn't start
  const district = useAppSelector(state => state.location.currentDistrict);
  const school = useAppSelector(state => state.location.currentSchool);
  const towns = useAppSelector(state => state.location.currentTowns);
  const subject = subjectOf(location.pathname, district, school, towns);

  // Update <title> for every route (browser tabs, history, screen readers, search engines), whether or
  // not analytics runs; a district's or school's pages add its name once it has loaded
  useEffect(() => {
    document.title = documentTitle(location.pathname, subject);
  }, [location.pathname, subject]);

  // Links to other sites, such as sources, from any page
  useEffect(() => {
    document.addEventListener('click', trackOutboundClick);
    return () => document.removeEventListener('click', trackOutboundClick);
  }, []);

  useEffect(() => {
    if (IS_DEV) return; // Don't send in dev
    if (typeof window.gtag !== 'function') return;
    if (!GA_MEASUREMENT_ID) return;

    const pagePath = location.pathname + location.search;
    const title = getPageTitle(location.pathname);
    
    // Send pageview event (GA4)
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: title,
      send_to: GA_MEASUREMENT_ID
    });
  }, [location]);
};

export default usePageTracking; 
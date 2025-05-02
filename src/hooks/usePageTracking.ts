import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import { GA_MEASUREMENT_ID, IS_DEV } from '@/utils/environment';

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

  const getPageTitle = (pathname: string): string => {
    const allPublicRoutes = Object.values(PATHS.PUBLIC) as Array<{ path: string; title: string }>;

    for (const route of allPublicRoutes) {
      if (matchPath({ path: route.path, end: true }, pathname)) {
        return route.title;
      }
    }

    // Fallback title
    return 'NH Education Facts';
  };

  useEffect(() => {
    if (IS_DEV) return; // Don't send in dev
    if (typeof window.gtag !== 'function') return;
    if (!GA_MEASUREMENT_ID) return;
    
    const pagePath = location.pathname + location.search;
    const title = getPageTitle(location.pathname);

    // Update <title> element for UX & SEO
    document.title = title;
    
    // Send pageview event (GA4)
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: title,
      send_to: GA_MEASUREMENT_ID
    });
  }, [location]);
};

export default usePageTracking; 
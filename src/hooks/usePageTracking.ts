import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { PATHS } from '@/routes/paths';

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
    if (typeof window.gtag !== 'function') return;
    
    const pagePath = location.pathname + location.search;
    const title = getPageTitle(location.pathname);

    // Update <title> element for UX & SEO
    document.title = title;
    
    // Send pageview event (GA4)
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: title,
      send_to: 'G-445FEZPXWE'
    });
  }, [location]);
};

export default usePageTracking; 
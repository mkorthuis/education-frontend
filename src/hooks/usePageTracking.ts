import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
  
  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    
    const pagePath = location.pathname + location.search;
    
    // Send pageview event (GA4)
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: document.title,
      send_to: 'G-445FEZPXWE'
    });
  }, [location]);
};

export default usePageTracking; 
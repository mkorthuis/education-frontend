/**
 * Google Analytics events for the site's key actions, beside the page views usePageTracking sends:
 * - search: a district or school picked from search
 * - ask_question, ask_answer, ask_failed: Ask a Question's use and outcomes. Never what was asked:
 *   questions stay out of analytics, as they stay out of the address bar
 * - file_download: a chart's or page's data saved as CSV or Excel
 * - outbound_click: a link to another site, such as a source
 *
 * Sent only once usePageTracking has loaded Google Analytics, which it does in production alone.
 */

type EventParams = Record<string, string | number | boolean>;

export const trackEvent = (name: string, params: EventParams = {}): void => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
};

/** Tracks a click on a link to another site (not mailto: or tel:), for a document click listener */
export const trackOutboundClick = (event: MouseEvent): void => {
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!(link instanceof HTMLAnchorElement)) return;
  if (!/^https?:$/.test(link.protocol) || link.host === window.location.host) return;
  trackEvent('outbound_click', { link_domain: link.hostname, link_url: link.href, page_path: window.location.pathname });
};

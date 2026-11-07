import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Component that scrolls to the top of the page when the route changes. A change within a page
 * stays where it is: a link that passes `state: { keepScroll: true }` (e.g. a tile choosing what a
 * chart shows), and the back and forward buttons between a page and one of its own addresses
 * (/state/academic and /state/academic/math).
 */
const ScrollToTop = () => {
  const { pathname, state } = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef(pathname);

  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    const keepScroll = (state as { keepScroll?: boolean } | null)?.keepScroll;
    const withinPage = navigationType === 'POP' && (from.startsWith(`${pathname}/`) || pathname.startsWith(`${from}/`));
    if (keepScroll || withinPage) return;
    window.scrollTo(0, 0);
  }, [pathname, state, navigationType]);

  return null;
};

export default ScrollToTop;

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * BrowserRouter keeps the scroll position across navigations, which lands a
 * judge halfway down the next page. Reset to the top unless the link targets an
 * in-page anchor.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

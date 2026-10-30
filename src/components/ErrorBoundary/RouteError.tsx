import React, { useEffect, useState } from "react";
import { useRouteError } from "react-router-dom";
import ErrorFallback from "./ErrorFallback";

// Messages browsers give when a lazily loaded page's file can't be loaded. After a
// deploy, a tab opened earlier still asks for the old file names, which no longer exist.
const STALE_CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

const RELOAD_KEY = 'nhfacts:stale-chunk-reload-at';
const RELOAD_WINDOW_MS = 10_000;

/**
 * Reloads the page to pick up the current deploy, unless it already did so in the last
 * few seconds (the file is really missing, so reloading again would loop).
 * Returns whether a reload was started.
 */
const reloadForNewDeploy = (): boolean => {
  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - lastReload < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Without storage there is no loop guard, so don't reload
    return false;
  }
  window.location.reload();
  return true;
};

/**
 * Router error element: replaces React Router's built-in developer error screen with
 * the app's own error screen, and reloads once when a page's file is from an old deploy.
 */
const RouteError: React.FC = () => {
  const error = useRouteError();
  const isStaleChunk = STALE_CHUNK_ERROR.test(error instanceof Error ? error.message : String(error));
  const [showFallback, setShowFallback] = useState(!isStaleChunk);

  useEffect(() => {
    if (isStaleChunk && reloadForNewDeploy()) return;
    console.error('Route error:', error);
    setShowFallback(true);
  }, [error, isStaleChunk]);

  // Render nothing while the page reloads
  return showFallback ? <ErrorFallback /> : null;
};

export default RouteError;

import { useEffect, useState } from 'react';

/**
 * The rendered width of an element, updated as it resizes (0 until measured). The ref is a callback,
 * so an element that unmounts and mounts again (a chart switched to its table and back) is measured
 * afresh rather than left at the width it had when it was removed.
 */
export const useElementWidth = <T extends HTMLElement>() => {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => {
      const next = entries[0]?.contentRect.width;
      if (next !== undefined) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return { ref: setElement, width };
};

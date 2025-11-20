import { useState, useEffect, useRef } from 'react';

export const useInViewport = (options = {}) => {
  const [isInViewport, setIsInViewport] = useState(false);
  const [hasBeenInViewport, setHasBeenInViewport] = useState(false);
  const [shouldPreload, setShouldPreload] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      const nowInViewport = entry.isIntersecting;
      setIsInViewport(nowInViewport);

      if (nowInViewport && !hasBeenInViewport) {
        setHasBeenInViewport(true);
      }
    }, {
      threshold: 0.7,
      rootMargin: "100px",
      ...options
    });

    const preloadObserver = new IntersectionObserver(([entry]) => {
      setShouldPreload(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: "200px",
    });

    if (ref.current) {
      observer.observe(ref.current);
      preloadObserver.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
        preloadObserver.unobserve(ref.current);
      }
    };
  }, [options, hasBeenInViewport]);

  return { ref, isInViewport, hasBeenInViewport, shouldPreload };
};
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInViewportOptions {
  threshold?: number;
  rootMargin?: string;
  debounceMs?: number; // Delay before considering element "in viewport" for playback
}

export const useInViewport = (options: UseInViewportOptions = {}) => {
  const { debounceMs = 300, ...observerOptions } = options;

  const [isInViewport, setIsInViewport] = useState(false);
  const [hasBeenInViewport, setHasBeenInViewport] = useState(false);
  const [shouldPreload, setShouldPreload] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawInViewport = useRef<boolean>(false);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced setter for isInViewport - only triggers after element stays in viewport
  const setIsInViewportDebounced = useCallback((value: boolean) => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    rawInViewport.current = value;

    if (value) {
      // Delay setting true to handle fast scrolling
      debounceTimerRef.current = setTimeout(() => {
        // Only set to true if still in viewport after delay
        if (rawInViewport.current) {
          setIsInViewport(true);
        }
      }, debounceMs);
    } else {
      // Immediately set to false when leaving viewport
      setIsInViewport(false);
    }
  }, [debounceMs]);

  useEffect(() => {
    const currentRef = ref.current;

    if (!currentRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      const nowInViewport = entry.isIntersecting;
      setIsInViewportDebounced(nowInViewport);

      if (nowInViewport && !hasBeenInViewport) {
        setHasBeenInViewport(true);
      }
    }, {
      threshold: 0.7,
      rootMargin: "100px",
      ...observerOptions
    });

    const preloadObserver = new IntersectionObserver(([entry]) => {
      setShouldPreload(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: "200px",
    });

    observer.observe(currentRef);
    preloadObserver.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
      preloadObserver.unobserve(currentRef);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [observerOptions, hasBeenInViewport, setIsInViewportDebounced]);

  return { ref, isInViewport, hasBeenInViewport, shouldPreload };
};
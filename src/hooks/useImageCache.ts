import { useState, useEffect } from 'react';

const CACHE_NAME = 'crinz-profile-images-v1';

export const useImageCache = (src?: string) => {
    const [cachedSrc, setCachedSrc] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) {
            setCachedSrc(undefined);
            return;
        }

        let isMounted = true;

        const loadImage = async () => {
            setIsLoading(true);
            setError(false);

            try {
                const sessionKey = `crinz_img_checked_${src}`;
                const isSessionChecked = sessionStorage.getItem(sessionKey);

                // 1. Try to get from Cache API first
                if ('caches' in window) {
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(src);

                    if (cachedResponse) {
                        // If we have it in cache AND we've already checked it this session, use it immediately.
                        if (isSessionChecked) {
                            if (isMounted) {
                                const blob = await cachedResponse.blob();
                                const objectUrl = URL.createObjectURL(blob);
                                setCachedSrc(objectUrl);
                                setIsLoading(false);
                                console.log(`[Image Cache HIT] (Session Validated) ${src}`);
                            }
                            return;
                        }
                        // If in cache but NOT checked this session, we technically should re-fetch to ensure freshness.
                        // However, we can optimistically use the cached version while we re-validate?
                        // User requested: "if there and is on same sesson use it,.elese if its expred fetch again freshly"
                        // "Not there in image cache get it and store"

                        // Let's stick to the strict "Validate Once Per Session" rule to ensure updates are caught.
                        // But to avoid a flash, we could show cached first? 
                        // For now, let's keep it simple: New Session = New Fetch (to catch profile pic updates).
                        // This ensures "freshly" fetched.
                    }
                }

                // 2. Fetch from network (New Session or Cache Miss)
                console.log(`[Image Cache REFRESH] Fetching from network: ${src}`);
                const response = await fetch(src, { mode: 'cors' });

                if (!response.ok) {
                    throw new Error(`Failed to load image: ${response.statusText}`);
                }

                const blob = await response.blob();

                // 3. Update Cache API
                if ('caches' in window) {
                    try {
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(src, new Response(blob, {
                            headers: response.headers
                        }));

                        // Mark as checked for this session
                        sessionStorage.setItem(sessionKey, 'true');
                        console.log(`[Image Cache UPDATED] ${src}`);
                    } catch (err) {
                        console.warn('Failed to cache image:', err);
                    }
                }

                if (isMounted) {
                    const objectUrl = URL.createObjectURL(blob);
                    setCachedSrc(objectUrl);
                }
            } catch (err) {
                console.error(`Error loading image ${src}:`, err);

                // Fallback: If network fails, try to use STALE cache if available
                if ('caches' in window) {
                    try {
                        const cache = await caches.open(CACHE_NAME);
                        const cachedResponse = await cache.match(src);
                        if (cachedResponse && isMounted) {
                            console.log(`[Image Cache FALLBACK] Using stale cache for ${src}`);
                            const blob = await cachedResponse.blob();
                            const objectUrl = URL.createObjectURL(blob);
                            setCachedSrc(objectUrl);
                            setError(false); // It's not an error from user perspective, just stale
                            setIsLoading(false);
                            return;
                        }
                    } catch (e) { /* ignore */ }
                }

                if (isMounted) {
                    setError(true);
                    setCachedSrc(src); // Final fallback to browser handling
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [src]);

    return { cachedSrc, isLoading, error };
};

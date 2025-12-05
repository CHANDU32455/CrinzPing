import { useRef, useCallback, useMemo } from 'react';

// Audio player hook
export const useAudioPlayer = () => {
  const audioInstances = useRef<Map<string, HTMLAudioElement>>(new Map());

  const playAudio = useCallback((id: string, audioUrl: string) => {
    audioInstances.current.forEach((audio, audioId) => {
      if (audioId !== id) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    let audio = audioInstances.current.get(id);
    if (!audio) {
      audio = new Audio(audioUrl);
      audio.volume = 0.7;
      audio.preload = "auto";
      audioInstances.current.set(id, audio);
    }

    audio.play().catch((e) => console.warn("Audio play failed:", e));
  }, []);

  const stopAudio = useCallback((id: string) => {
    const audio = audioInstances.current.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    audioInstances.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  return { playAudio, stopAudio, stopAllAudio };
};

// Video player hook
export const useVideoPlayer = () => {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const mutedStates = useRef<Map<string, boolean>>(new Map());
  const playStates = useRef<Map<string, boolean>>(new Map());
  const preloadedVideos = useRef<Map<string, boolean>>(new Map());
  const globalMutePreference = useRef<boolean | null>(null);
  const globalPrefInitialized = useRef<boolean>(false);

  // Initialize global mute preference from localStorage once (per hook instance)
  const ensureGlobalPrefInitialized = useCallback(() => {
    if (globalPrefInitialized.current) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('crinz_global_mute');
        if (saved !== null) {
          globalMutePreference.current = saved === 'true';
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      globalPrefInitialized.current = true;
    }
  }, []);

  const registerVideo = useCallback((id: string, video: HTMLVideoElement | null) => {
    if (video) {
      // Make sure we have up-to-date global preference before registering
      ensureGlobalPrefInitialized();
      videoRefs.current.set(id, video);
      const shouldMute = globalMutePreference.current !== null ? globalMutePreference.current : true;
      mutedStates.current.set(id, shouldMute);
      video.muted = shouldMute;
      if (!playStates.current.has(id)) {
        playStates.current.set(id, false);
      }
    } else {
      videoRefs.current.delete(id);
    }
  }, [ensureGlobalPrefInitialized]);

  const preloadVideo = useCallback((id: string, videoUrl: string) => {
    if (preloadedVideos.current.get(id)) return;
    const video = document.createElement('video');
    video.src = videoUrl;
    video.preload = "metadata";
    video.load();
    preloadedVideos.current.set(id, true);
  }, []);

  const playVideo = useCallback((id: string) => {
    // First, pause ALL other videos to ensure only one plays at a time
    videoRefs.current.forEach((video, videoId) => {
      if (videoId !== id) {
        video.pause();
        playStates.current.set(videoId, false);
      }
    });

    // Now play the requested video
    const video = videoRefs.current.get(id);
    if (video) {
      const isMuted = mutedStates.current.get(id) ?? true;
      video.muted = isMuted;
      video.play().catch((e) => {
        if (e.name !== 'AbortError') {
          console.warn("Video play failed:", e);
        }
      });
      playStates.current.set(id, true);
    }
  }, []);

  const pauseVideo = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (video) {
      video.pause();
      playStates.current.set(id, false);
    }
  }, []);

  const toggleMute = useCallback((id: string) => {
    const video = videoRefs.current.get(id);
    if (video) {
      const currentlyMuted = mutedStates.current.get(id) ?? true;
      const newMutedState = !currentlyMuted;
      video.muted = newMutedState;
      mutedStates.current.set(id, newMutedState);
      globalMutePreference.current = newMutedState;
      // Persist globally so upcoming videos inherit the preference
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('crinz_global_mute', String(newMutedState));
        }
      } catch {
        // ignore storage errors
      }
      videoRefs.current.forEach((vid, vidId) => {
        if (vidId !== id) {
          vid.muted = newMutedState;
          mutedStates.current.set(vidId, newMutedState);
        }
      });
      return newMutedState;
    }
    return true;
  }, []);

  const isMuted = useCallback((id: string) => {
    // Ensure we read any persisted preference before answering
    if (mutedStates.current.get(id) === undefined) {
      // Attempt to initialize global preference once if not set
      try {
        if (globalMutePreference.current === null && typeof window !== 'undefined' && window.localStorage) {
          const saved = window.localStorage.getItem('crinz_global_mute');
          if (saved !== null) {
            globalMutePreference.current = saved === 'true';
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return mutedStates.current.get(id) ?? (globalMutePreference.current ?? true);
  }, []);

  const isPlaying = useCallback((id: string) => {
    return playStates.current.get(id) ?? false;
  }, []);

  return useMemo(() => ({
    registerVideo,
    preloadVideo,
    playVideo,
    pauseVideo,
    toggleMute,
    isMuted,
    isPlaying
  }), [registerVideo, preloadVideo, playVideo, pauseVideo, toggleMute, isMuted, isPlaying]);
};

// Global media manager
export const useMediaManager = () => {
  const { stopAllAudio } = useAudioPlayer();
  const { pauseVideo } = useVideoPlayer();
  const activeMedia = useRef<Set<string>>(new Set());

  const activateMedia = useCallback((id: string) => {
    activeMedia.current.add(id);
  }, []);

  const deactivateMedia = useCallback((id: string) => {
    activeMedia.current.delete(id);
    pauseVideo(id);
    stopAllAudio();
  }, [pauseVideo, stopAllAudio]);

  const stopAllMedia = useCallback(() => {
    stopAllAudio();
    activeMedia.current.forEach(id => pauseVideo(id));
    activeMedia.current.clear();
  }, [pauseVideo, stopAllAudio]);

  return {
    activateMedia,
    deactivateMedia,
    stopAllMedia
  };
};
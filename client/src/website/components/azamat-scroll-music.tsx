import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

interface AzamatScrollMusicProps {
  musicUrl: string;
  targetVolume?: number;
  fadeInDurationMs?: number;
  enableFadeIn?: boolean;
}

export interface AzamatScrollMusicHandle {
  startPlayback: () => void;
}

function normalizeMusicUrl(raw: string): string {
  // Stored value may be an absolute filesystem path from a server-side bug.
  // Convert it to a browser-accessible /uploads/<filename> URL.
  if (raw.startsWith('/') && !raw.startsWith('/uploads/') && !raw.startsWith('//')) {
    const filename = raw.split('/').pop();
    const normalized = `/uploads/${filename}`;
    console.warn(
      `Azamat background music: filesystem path detected, normalized to web URL`,
      { original: raw, normalized },
    );
    return normalized;
  }
  return raw;
}

export const AzamatScrollMusic = forwardRef<AzamatScrollMusicHandle, AzamatScrollMusicProps>(function AzamatScrollMusic({
  musicUrl: rawMusicUrl,
  targetVolume = 0.35,
  fadeInDurationMs = 1800,
  enableFadeIn = true,
}: AzamatScrollMusicProps, ref) {
  const musicUrl = normalizeMusicUrl(rawMusicUrl);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasUserInteractedRef = useRef(false);
  const hasScrolledRef = useRef(false);
  const hasStartedRef = useRef(false);
  const isPlayInFlightRef = useRef(false);
  const pendingStartRef = useRef(false);
  const fadeIntervalRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const clearFadeInterval = useCallback(() => {
    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const startFadeIn = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    clearFadeInterval();

    if (!enableFadeIn) {
      audio.volume = targetVolume;
      return;
    }

    const safeDuration = Math.max(200, fadeInDurationMs);
    const stepMs = 100;
    const steps = Math.max(1, Math.floor(safeDuration / stepMs));
    const increment = targetVolume / steps;

    audio.volume = 0;
    fadeIntervalRef.current = window.setInterval(() => {
      const next = Math.min(targetVolume, audio.volume + increment);
      audio.volume = next;

      if (next >= targetVolume) {
        clearFadeInterval();
      }
    }, stepMs);
  }, [clearFadeInterval, enableFadeIn, fadeInDurationMs, targetVolume]);

  const tryStartPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || hasStartedRef.current || isPlayInFlightRef.current) {
      return;
    }

    audio.loop = true;
    audio.volume = enableFadeIn ? 0 : targetVolume;

    console.log('Azamat background music: play requested', {
      musicUrl,
      readyState: audio.readyState,
      networkState: audio.networkState,
    });

    // readyState 0 = HAVE_NOTHING — calling play() immediately after load()
    // in the same tick causes an AbortError. Instead, kick off loading and
    // let the canplay handler retry once audio is ready.
    if (audio.readyState === 0) {
      console.log('Azamat background music: audio not ready yet, loading and waiting for canplay…');
      pendingStartRef.current = true;
      audio.load();
      return;
    }

    isPlayInFlightRef.current = true;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          hasStartedRef.current = true;
          pendingStartRef.current = false;
          isPlayInFlightRef.current = false;
          setIsPlaying(true);
          console.log('Azamat background music: playback started ✓', { musicUrl });
          startFadeIn();
        })
        .catch((error: DOMException) => {
          isPlayInFlightRef.current = false;
          console.error(
            `Azamat background music: playback failed — ${error.name}: ${error.message}`,
            { musicUrl, readyState: audio.readyState, networkState: audio.networkState },
          );
        });
    } else {
      hasStartedRef.current = true;
      pendingStartRef.current = false;
      isPlayInFlightRef.current = false;
      setIsPlaying(true);
      console.log('Azamat background music: playback started ✓ (no promise)', { musicUrl });
      startFadeIn();
    }
  }, [enableFadeIn, musicUrl, startFadeIn, targetVolume]);

  useImperativeHandle(ref, () => ({
    startPlayback: () => {
      hasUserInteractedRef.current = true;
      pendingStartRef.current = true;
      console.log('Azamat background music: startPlayback called', { musicUrl });
      tryStartPlayback();
    },
  }), [musicUrl, tryStartPlayback]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicUrl) {
      return;
    }

    const handleAudioCanPlay = () => {
      console.log('Azamat background music: audio can play', { musicUrl });
      if (pendingStartRef.current && !hasStartedRef.current) {
        tryStartPlayback();
      }
    };

    const tryStartPlaybackAfterScroll = () => {
      if (!hasUserInteractedRef.current || !hasScrolledRef.current) {
        return;
      }

      pendingStartRef.current = true;
      tryStartPlayback();
    };

    const handleFirstInteraction = () => {
      if (hasUserInteractedRef.current) {
        return;
      }

      hasUserInteractedRef.current = true;
      console.log('Azamat background music: first user interaction detected');
      removeInteractionListeners();
      tryStartPlaybackAfterScroll();
    };

    const handleFirstScroll = () => {
      if (hasScrolledRef.current) {
        return;
      }

      hasScrolledRef.current = true;
      console.log('Azamat background music: first scroll detected');
      window.removeEventListener('scroll', handleFirstScroll);
      tryStartPlaybackAfterScroll();
    };

    const interactionEvents: Array<keyof DocumentEventMap> = ['click', 'touchstart', 'keydown'];

    const removeInteractionListeners = () => {
      interactionEvents.forEach((eventName) => {
        document.removeEventListener(eventName, handleFirstInteraction);
      });
    };

    interactionEvents.forEach((eventName) => {
      document.addEventListener(eventName, handleFirstInteraction, { passive: true });
    });
    window.addEventListener('scroll', handleFirstScroll, { passive: true });
    audio.addEventListener('loadedmetadata', handleAudioCanPlay);
    audio.addEventListener('canplay', handleAudioCanPlay);
    audio.addEventListener('canplaythrough', handleAudioCanPlay);

    return () => {
      removeInteractionListeners();
      window.removeEventListener('scroll', handleFirstScroll);
      audio.removeEventListener('loadedmetadata', handleAudioCanPlay);
      audio.removeEventListener('canplay', handleAudioCanPlay);
      audio.removeEventListener('canplaythrough', handleAudioCanPlay);
      clearFadeInterval();
    };
  }, [clearFadeInterval, musicUrl, tryStartPlayback]);

  const handleToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Treat manual press as user interaction so scroll guard is satisfied
      hasUserInteractedRef.current = true;
      pendingStartRef.current = true;

      if (!hasStartedRef.current) {
        // First play — use full start logic
        tryStartPlayback();
      } else {
        // Already started before, just resume
        audio.play()
          .then(() => setIsPlaying(true))
          .catch((err: DOMException) =>
            console.error(`Azamat background music: resume failed — ${err.name}: ${err.message}`),
          );
      }
    }
  };

  return (
    <>
      {musicUrl && (
        <audio
          ref={audioRef}
          src={musicUrl}
          preload="auto"
          loop
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Floating player — fixed bottom-right, z-[130] sits above the envelope overlay (z-[120]) */}
      <div className="fixed bottom-20 right-4 z-[130] flex items-center gap-2 select-none">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isPlaying ? 'Musiqani to\'xtatish' : 'Musiqani boshlash'}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-90 focus:outline-none"
          style={{
            background: 'linear-gradient(135deg, #c9a96e 0%, #a07840 100%)',
            boxShadow: '0 2px 12px rgba(201,169,110,0.45)',
          }}
        >
          {isPlaying ? (
            /* Pause icon */
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="4" height="14" rx="1.5" fill="#1a0e00" />
              <rect x="9" y="1" width="4" height="14" rx="1.5" fill="#1a0e00" />
            </svg>
          ) : (
            /* Play icon */
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 1.5L12.5 8L2 14.5V1.5Z" fill="#1a0e00" />
            </svg>
          )}
        </button>

        {/* Animated equaliser bars — visible only while playing */}
        {isPlaying && (
          <div className="flex items-end gap-[3px] h-5" aria-hidden>
            {[0.6, 1, 0.75, 1, 0.5].map((h, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full"
                style={{
                  height: `${h * 100}%`,
                  background: 'linear-gradient(to top, #c9a96e, #f5e0a0)',
                  animation: `azamatBar ${0.55 + i * 0.1}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        )}

        <style>{`
          @keyframes azamatBar {
            from { transform: scaleY(0.35); }
            to   { transform: scaleY(1); }
          }
        `}</style>
      </div>
    </>
  );
});

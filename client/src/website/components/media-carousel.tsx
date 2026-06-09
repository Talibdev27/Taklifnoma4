import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface MediaCarouselSlide {
  url: string;
  alt?: string;
  caption?: string;
}

export interface MediaCarouselProps {
  slides: MediaCarouselSlide[];
  /** Visual transition style. */
  transition?: 'fade' | 'slide';
  /** Auto-advance ms; pass 0 to disable. Default: 5000. */
  autoplayMs?: number;
  /** Pause autoplay while pointer is over the carousel. */
  pauseOnHover?: boolean;
  /** Show prev/next arrows. */
  showArrows?: boolean;
  /** Show dot indicators. */
  showDots?: boolean;
  /** Tailwind aspect ratio class, e.g. "aspect-[16/9]". */
  aspectClass?: string;
  /** Custom class on the outer container. */
  className?: string;
  /** Custom class on each image. Default: object-cover. */
  imageClassName?: string;
  /** Theme tokens — adapts dot/arrow colour to template. */
  theme?: {
    /** Active dot + arrow tint. */
    accent?: string;
    /** Dot/arrow background fill behind icons. */
    surface?: string;
    /** Icon colour inside arrow buttons. */
    iconColor?: string;
  };
  /** Optional: full-bleed/background mode (no rounding/borders). */
  bleed?: boolean;
}

/**
 * Self-contained carousel — no external plugins needed.
 * Supports: fade/slide transitions, autoplay with pause-on-hover,
 * dot navigation, arrow navigation, and touch/mouse swipe.
 *
 * If only one slide is supplied it renders as a static image
 * (no controls, no auto-rotation), so it's safe to feed any list.
 */
export function MediaCarousel({
  slides,
  transition = 'fade',
  autoplayMs = 5000,
  pauseOnHover = true,
  showArrows = true,
  showDots = true,
  aspectClass = '',
  className = '',
  imageClassName = 'object-cover',
  theme,
  bleed = false,
}: MediaCarouselProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const deltaXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const accent = theme?.accent ?? '#ffffff';
  const surface = theme?.surface ?? 'rgba(0,0,0,0.45)';
  const iconColor = theme?.iconColor ?? '#ffffff';

  const total = slides.length;
  const isStatic = total <= 1;

  const goTo = useCallback((next: number) => {
    if (total === 0) return;
    setIndex(((next % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  /* Autoplay loop */
  useEffect(() => {
    if (isStatic || autoplayMs <= 0 || isPaused) return;
    timeoutRef.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % total);
    }, autoplayMs);
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [index, total, autoplayMs, isPaused, isStatic]);

  /* Keyboard navigation when focused */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isStatic) return;
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement !== el && !el.contains(document.activeElement)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isStatic]);

  /* Touch/Pointer swipe */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isStatic) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    deltaXRef.current = 0;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || startXRef.current === null) return;
    deltaXRef.current = e.clientX - startXRef.current;
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const dx = deltaXRef.current;
    startXRef.current = null;
    deltaXRef.current = 0;
    const SWIPE_THRESHOLD = 50;
    if (dx > SWIPE_THRESHOLD) prev();
    else if (dx < -SWIPE_THRESHOLD) next();
  };

  if (total === 0) {
    return null;
  }

  // Static (1 image) — render plainly, skip all interactivity.
  if (isStatic) {
    const slide = slides[0];
    return (
      <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
        <img
          src={slide.url}
          alt={slide.alt ?? ''}
          className={`absolute inset-0 w-full h-full ${imageClassName}`}
          loading="lazy"
        />
        {slide.caption && (
          <p className="absolute bottom-3 left-3 right-3 text-xs uppercase tracking-[0.3em] text-white/80">
            {slide.caption}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('carousel.imageCarousel')}
      className={`relative overflow-hidden focus:outline-none ${bleed ? '' : ''} ${aspectClass} ${className}`}
      onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Slides — fade or slide */}
      {transition === 'slide' ? (
        <div
          className="absolute inset-0 flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div key={i} className="relative shrink-0 w-full h-full">
              <img
                src={s.url}
                alt={s.alt ?? ''}
                className={`absolute inset-0 w-full h-full ${imageClassName}`}
                draggable={false}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>
      ) : (
        slides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000 ease-out"
            style={{ opacity: i === index ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <img
              src={s.url}
              alt={s.alt ?? ''}
              className={`absolute inset-0 w-full h-full ${imageClassName}`}
              draggable={false}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))
      )}

      {/* Active slide caption */}
      {slides[index]?.caption && (
        <p className="absolute bottom-4 left-4 right-4 text-xs uppercase tracking-[0.3em] text-white/85 z-10 pointer-events-none">
          {slides[index].caption}
        </p>
      )}

      {/* Arrow controls */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 backdrop-blur-md z-10 opacity-80 hover:opacity-100"
            style={{ background: surface, color: iconColor }}
            aria-label={t('carousel.previousSlide')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 backdrop-blur-md z-10 opacity-80 hover:opacity-100"
            style={{ background: surface, color: iconColor }}
            aria-label={t('carousel.nextSlide')}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showDots && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === index ? 22 : 7,
                height: 7,
                background: i === index ? accent : 'rgba(255,255,255,0.55)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

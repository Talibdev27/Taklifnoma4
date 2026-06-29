// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { EpicRSVPForm } from '@/website/components/epic-rsvp-form';
import { OrderInvitationCTA } from '@/website/components/order-invitation-cta';
import { GuestBookForm } from '@/website/components/guest-book-form';
import { AzamatScrollMusic, type AzamatScrollMusicHandle } from '@/website/components/azamat-scroll-music';
import { MediaCarousel } from '@/website/components/media-carousel';
import {
  MapPin, Heart, MessageSquare, Calendar, Users, ChevronDown,
} from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, GuestBookEntry } from '@shared/schema';

/* ─── Pre-computed gold dust particles (stable across renders) ──────── */
const DUST = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  size: 1 + (i * 3 % 3),
  left: (i * 13 + 5) % 100,
  duration: 14 + (i * 5 % 12),
  delay: (i * 1.7) % 12,
}));

/** Tasteful default shown in the Our Story carousel when a wedding has no
 *  uploaded photos at all, so the section never renders empty. */
const STORY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80';

interface VelvetTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

export function VelvetTemplate({ wedding, photos = [] }: VelvetTemplateProps) {
  const { t, i18n } = useTranslation();

  // Per-section visibility (admin toggles). Shown unless explicitly turned off.
  const show = (key: string) => ((wedding?.sections as any) || {})[key] !== false;

  const couplePhotos = photos.filter((p: any) => p.photoType === 'couple');
  const memoryPhotos = photos.filter((p: any) => p.photoType === 'memory');
  const heroDesignated = photos.filter((p: any) => p.photoType === 'hero' || p.isHero);

  /** Hero carousel slides — prefer designated hero photos, fall back to couple photos
   *  plus the saved couplePhotoUrl. If nothing exists, the section uses video. */
  const heroSlides = (() => {
    const list: { url: string; alt?: string }[] = [];
    if (heroDesignated.length > 0) {
      heroDesignated.forEach((p: any) => list.push({ url: p.url, alt: p.caption ?? '' }));
    } else {
      if (wedding.couplePhotoUrl) list.push({ url: wedding.couplePhotoUrl, alt: '' });
      couplePhotos.forEach((p: any) => list.push({ url: p.url, alt: p.caption ?? '' }));
    }
    /** Dedupe by URL while preserving order. */
    const seen = new Set<string>();
    return list.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
  })();

  /** Story-section portrait — the couple's hero/couple photo. Memory photos get
   *  their own "Our Memories" gallery below, so the story stays a portrait:
   *  couple photo → hero photo → saved couple photo URL → any memory photo →
   *  a tasteful default, so the section always shows imagery. */
  const storySlides = (() => {
    const list: { url: string; alt?: string }[] = [];
    couplePhotos.forEach((p: any) => list.push({ url: p.url, alt: p.caption ?? '' }));
    if (list.length === 0) heroDesignated.forEach((p: any) => list.push({ url: p.url, alt: p.caption ?? '' }));
    if (list.length === 0 && wedding.couplePhotoUrl) list.push({ url: wedding.couplePhotoUrl, alt: '' });
    if (list.length === 0) memoryPhotos.forEach((p: any) => list.push({ url: p.url, alt: p.caption ?? '' }));
    if (list.length === 0) list.push({ url: STORY_FALLBACK_IMAGE, alt: '' });
    const seen = new Set<string>();
    return list.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
  })();

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeNav, setActiveNav] = useState('home');
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const musicRef = useRef<AzamatScrollMusicHandle | null>(null);

  /* sync wedding default language */
  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      i18n.changeLanguage(wedding.defaultLanguage);
    }
  }, [wedding?.defaultLanguage, i18n]);

  const handleOpenEnvelope = () => {
    if (opening) return;
    musicRef.current?.startPlayback();
    setOpening(true);
    setTimeout(() => setOpened(true), 700);
    setTimeout(() => setShowEnvelope(false), 1500);
  };

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'uz': return uz;
      case 'ru': return ru;
      default: return enUS;
    }
  };

  const { data: guestBookEntries = [] } = useQuery<GuestBookEntry[]>({
    queryKey: ['/api/guest-book/wedding', wedding?.id],
    queryFn: () => fetch(`/api/guest-book/wedding/${wedding?.id}`).then(r => r.json()),
    enabled: !!wedding?.id,
  });

  /* live countdown */
  useEffect(() => {
    if (!wedding?.weddingDate) return;
    const tick = () =>
      setTimeLeft(
        calculateWeddingCountdown(
          wedding.weddingDate,
          wedding.weddingTime || '16:00',
          wedding.timezone || 'Asia/Tashkent',
        ),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [wedding?.weddingDate, wedding?.weddingTime, wedding?.timezone]);

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a060f] text-white">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openMap = () => {
    const target = wedding.mapPinUrl || wedding.venueAddress;
    if (!target) return;
    const url = target.startsWith('http')
      ? target
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = wedding.weddingDate
    ? format(new Date(wedding.weddingDate), 'd MMMM yyyy', { locale: getDateLocale() })
    : t('details.dateTBD');

  const navItems = [
    { id: 'home', label: t('nav.home'), Icon: Heart },
    { id: 'details', label: t('nav.details'), Icon: Calendar },
    { id: 'rsvp', label: t('nav.rsvp'), Icon: Users },
    { id: 'guestbook', label: t('nav.guestbook'), Icon: MessageSquare },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.85, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as any },
    }),
  };

  return (
    <div className="min-h-screen bg-[#1a060f] text-[#f5e6d3] overflow-x-hidden" style={{ fontFamily: '"Lato", sans-serif' }}>
      <style>{`
        /* ── Velvet rich background ───────────────────────────────── */
        .velvet-stage {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
          background:
            radial-gradient(circle at 25% 20%, #4a0f24 0%, transparent 55%),
            radial-gradient(circle at 80% 75%, #5a1432 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #2a0810 0%, #150509 70%, #0a0307 100%);
        }
        .velvet-stage::before {
          content: ''; position: absolute; inset: 0;
          background-image:
            repeating-linear-gradient(45deg, rgba(194,133,110,0.025) 0 2px, transparent 2px 6px),
            repeating-linear-gradient(-45deg, rgba(194,133,110,0.018) 0 2px, transparent 2px 6px);
          mix-blend-mode: overlay;
        }
        .velvet-stage::after {
          content: ''; position: absolute; inset: -10%;
          background:
            radial-gradient(circle at 70% 18%, rgba(212,168,124,0.10), transparent 35%),
            radial-gradient(circle at 28% 82%, rgba(184,89,58,0.08), transparent 40%);
          animation: velvet-breathe 14s ease-in-out infinite;
        }
        @keyframes velvet-breathe {
          0%, 100% { transform: scale(1) translate3d(0,0,0); }
          50%      { transform: scale(1.05) translate3d(-1%,-0.5%,0); }
        }

        /* ── Gold filigree ornament ──────────────────── */
        .gold-divider {
          display: flex; align-items: center; justify-content: center;
          gap: 18px; color: #d4a87c;
        }
        .gold-divider .line {
          flex: 0 1 100px; height: 1px;
          background: linear-gradient(90deg, transparent, #d4a87c 50%, transparent);
        }
        .gold-divider .ornament {
          width: 14px; height: 14px; border: 1px solid #d4a87c; transform: rotate(45deg);
          position: relative;
        }
        .gold-divider .ornament::before {
          content: ''; position: absolute; inset: 3px; background: #d4a87c; opacity: 0.4;
        }

        /* ── Animated gold text gradient ──────────────────────────── */
        @keyframes gold-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .gold-text {
          background: linear-gradient(120deg, #b88858 0%, #f3d9a8 25%, #d4a87c 45%, #f8e3b6 60%, #b88858 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gold-shimmer 6s ease infinite;
        }

        /* ── Glass card with gold border ──────────────────────────── */
        .velvet-card {
          background: linear-gradient(160deg, rgba(60,15,32,0.55), rgba(30,8,18,0.65));
          backdrop-filter: blur(14px);
          border: 1px solid rgba(212,168,124,0.18);
          box-shadow:
            0 1px 0 rgba(212,168,124,0.18) inset,
            0 -1px 0 rgba(212,168,124,0.05) inset,
            0 24px 60px rgba(0,0,0,0.45);
        }

        /* ── Corner ornament for cards ────────────────────────────── */
        .corner {
          position: absolute; width: 22px; height: 22px;
          border-color: #d4a87c; opacity: 0.7;
        }
        .corner.tl { top: 8px; left: 8px; border-top: 1px solid; border-left: 1px solid; }
        .corner.tr { top: 8px; right: 8px; border-top: 1px solid; border-right: 1px solid; }
        .corner.bl { bottom: 8px; left: 8px; border-bottom: 1px solid; border-left: 1px solid; }
        .corner.br { bottom: 8px; right: 8px; border-bottom: 1px solid; border-right: 1px solid; }

        /* ── Floating gold dust ───────────────────────────────────── */
        @keyframes dust-rise {
          0%   { transform: translateY(100vh) scale(0.5); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-5vh) scale(1.2); opacity: 0; }
        }
        .gold-dust {
          position: fixed; border-radius: 50%;
          background: radial-gradient(circle, rgba(243,217,168,0.9) 0%, rgba(212,168,124,0.05) 100%);
          box-shadow: 0 0 6px rgba(243,217,168,0.6);
          pointer-events: none; animation: dust-rise linear infinite;
        }

        /* ── Pulsing countdown card ───────────────────────────────── */
        @keyframes velvet-pulse {
          0%, 100% { box-shadow: 0 0 22px rgba(212,168,124,0.18), inset 0 0 20px rgba(212,168,124,0.06); }
          50%      { box-shadow: 0 0 44px rgba(212,168,124,0.32), inset 0 0 32px rgba(212,168,124,0.12); }
        }
        .velvet-glow { animation: velvet-pulse 4s ease-in-out infinite; }

        /* ── Crown SVG accent stroke ──────────────────────────────── */
        .crown-icon path { stroke-dasharray: 200; stroke-dashoffset: 200; animation: draw 2.5s ease forwards; }
        @keyframes draw { to { stroke-dashoffset: 0; } }

        /* ── Photo frame baroque ──────────────────────────────────── */
        .baroque-frame {
          position: relative;
          padding: 14px;
          background: linear-gradient(135deg, #d4a87c 0%, #8a5a3a 50%, #d4a87c 100%);
          background-size: 200% 200%;
          animation: gold-shimmer 9s ease infinite;
        }
        .baroque-frame::before, .baroque-frame::after {
          content: ''; position: absolute; width: 28px; height: 28px;
          border: 2px solid #f3d9a8; pointer-events: none;
        }
        .baroque-frame::before { top: -4px; left: -4px; border-right: none; border-bottom: none; }
        .baroque-frame::after  { bottom: -4px; right: -4px; border-left: none; border-top: none; }

        /* ── Hero photo backdrop — heavily blurred & dimmed ────── */
        .velvet-hero-photo {
          position: absolute;
          inset: 0;
          opacity: 0.32;
          overflow: hidden;
        }
        .velvet-hero-photo img {
          filter: blur(8px) saturate(0.7) brightness(0.65);
          transform: scale(1.1);
        }

        /* ── Accessibility: respect reduced-motion preferences ──── */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .gold-dust { display: none !important; }
        }
      `}</style>

      {/* ── Background music ──────────────────────────────────────── */}
      <AzamatScrollMusic
        ref={musicRef}
        musicUrl={wedding.backgroundMusicUrl ?? ''}
        theme={{ primary: '#d4a87c', accent: '#8a5a3a', iconColor: '#1a060f', glow: 'rgba(212,168,124,0.45)' }}
      />

      {/* ── Velvet stage backdrop ─────────────────────────────────── */}
      <div className="velvet-stage" aria-hidden />

      {/* ── Envelope intro ────────────────────────────────────────── */}
      {showEnvelope && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0a0307]/55 backdrop-blur-2xl px-4"
          onClick={handleOpenEnvelope}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(212,168,124,0.18),transparent_60%)]" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleOpenEnvelope(); }}
            className="relative w-[min(92vw,460px)] h-[300px] cursor-pointer focus:outline-none"
            aria-label={t('welcome.openInvitation')}
          >
            <div className="absolute inset-x-6 bottom-[-22px] h-12 rounded-full bg-black/55 blur-2xl" />
            <div
              className="absolute inset-0 rounded-sm overflow-hidden border-2 shadow-[0_25px_70px_rgba(0,0,0,0.6)]"
              style={{ borderImage: 'linear-gradient(135deg, #d4a87c, #8a5a3a, #f3d9a8) 1' }}
            >
              <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(circle at 30% 30%, #5a1432 0%, #3d0a1f 50%, #1a060f 100%)' }}
              />
              {/* damask pattern */}
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15 Z' fill='%23d4a87c' opacity='0.3'/%3E%3C/svg%3E\")",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <svg viewBox="0 0 64 28" className="w-14 h-7 mb-4 crown-icon" fill="none">
                  <path d="M2 26 L8 8 L16 18 L24 4 L32 18 L40 4 L48 18 L56 8 L62 26 Z" stroke="#f3d9a8" strokeWidth="1.2" strokeLinejoin="round" />
                  <circle cx="32" cy="4" r="1.6" fill="#f3d9a8" />
                </svg>
                <p className="text-[10px] uppercase tracking-[0.5em] text-[#d4a87c]/80 mb-3">
                  {t('welcome.weddingTitle', { bride: wedding.groom, groom: wedding.bride })}
                </p>
                <p
                  className="gold-text text-3xl sm:text-4xl leading-tight"
                  style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", serif', fontWeight: 500 }}
                >
                  {wedding.groom} &amp; {wedding.bride}
                </p>
                <div className="gold-divider mt-5 w-32"><span className="line" /><span className="ornament" /><span className="line" /></div>
              </div>
              {/* Envelope flap */}
              <div
                className="absolute top-0 left-0 right-0 h-[58%] origin-top transition-transform duration-700 ease-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: opening ? 'perspective(1000px) rotateX(-178deg)' : 'perspective(1000px) rotateX(0deg)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    background: 'linear-gradient(180deg, #5a1432 0%, #3d0a1f 100%)',
                    borderTop: '2px solid #d4a87c',
                  }}
                />
                <div
                  className="absolute left-1/2 top-[36%] -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, #f3d9a8 0%, #b88858 80%)',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.5), inset 0 -3px 6px rgba(0,0,0,0.25)',
                  }}
                >
                  <span className="text-[#3d0a1f] text-base" style={{ fontFamily: '"Cormorant Garamond",serif' }}>♛</span>
                </div>
              </div>
            </div>
            <p className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.3em] uppercase text-[#d4a87c]/85 whitespace-nowrap">
              {opening ? t('welcome.opening') : t('welcome.clickToOpen')}
            </p>
          </button>
        </div>
      )}

      {/* ── Gold dust ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        {DUST.map(p => (
          <div
            key={p.id}
            className="gold-dust"
            style={{ width: p.size, height: p.size, left: `${p.left}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
          />
        ))}
      </div>

      {/* ── Desktop top nav ───────────────────────────────────────── */}
      <nav className="hidden sm:flex fixed top-0 inset-x-0 z-50 bg-[#1a060f]/70 backdrop-blur-2xl border-b border-[#d4a87c]/15">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-8 py-3.5">
          <span
            className="gold-text text-xl select-none"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, letterSpacing: '0.04em' }}
          >
            {wedding.groom} &amp; {wedding.bride}
          </span>
          <div className="flex gap-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`px-4 py-1.5 rounded-sm transition-all duration-300 ${
                  activeNav === id
                    ? 'bg-[#d4a87c]/12 text-[#f3d9a8] border border-[#d4a87c]/30'
                    : 'text-[#f5e6d3]/45 hover:text-[#f3d9a8]/85 border border-transparent'
                }`}
                style={{ letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '11px' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom nav ─────────────────────────────────────── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0a0307]/85 backdrop-blur-2xl border-t border-[#d4a87c]/15">
        <div className="flex justify-around py-2 px-1">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex flex-col items-center gap-0.5 min-w-[48px] py-1 transition-colors ${
                activeNav === id ? 'text-[#f3d9a8]' : 'text-[#f5e6d3]/35'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-[0.2em]">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section id="home" className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden z-10">
        {/* Atmospheric photo backdrop — heavily blurred & dimmed so names take centre stage */}
        {heroSlides.length > 0 ? (
          <div className="velvet-hero-photo">
            <MediaCarousel
              slides={heroSlides}
              transition="fade"
              autoplayMs={6500}
              pauseOnHover={false}
              showArrows={false}
              showDots={false}
              className="w-full h-full"
            />
          </div>
        ) : (
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover scale-105 opacity-30" style={{ filter: 'blur(8px) saturate(0.7) brightness(0.65)' }} preload="metadata">
            <source src="/hero-video-BkP1eoiB.mp4" type="video/mp4" />
          </video>
        )}
        {/* Stronger gradient + radial vignette so the typography reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0307]/70 via-[#1a060f]/75 to-[#0a0307] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_45%,rgba(212,168,124,0.16),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_50%,transparent,rgba(10,3,7,0.55))] pointer-events-none" />

        <svg viewBox="0 0 100 100" className="absolute top-6 left-6 w-12 h-12 sm:w-16 sm:h-16 opacity-70" fill="none">
          <path d="M2 50 L2 2 L50 2" stroke="#d4a87c" strokeWidth="1.2" />
          <circle cx="2" cy="2" r="3" fill="#d4a87c" />
        </svg>
        <svg viewBox="0 0 100 100" className="absolute top-6 right-6 w-12 h-12 sm:w-16 sm:h-16 opacity-70" fill="none">
          <path d="M50 2 L98 2 L98 50" stroke="#d4a87c" strokeWidth="1.2" />
          <circle cx="98" cy="2" r="3" fill="#d4a87c" />
        </svg>

        <div className="relative z-10 flex flex-col items-center max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="text-[10px] sm:text-[11px] uppercase tracking-[0.55em] text-[#d4a87c]/85 mb-8"
          >
            {t('modern.tagline')}
          </motion.p>

          <motion.svg
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewBox="0 0 80 36" className="w-16 sm:w-20 mb-6" fill="none"
          >
            <path d="M3 33 L11 8 L22 24 L32 4 L42 24 L52 4 L62 24 L73 8 L77 33 Z" stroke="#d4a87c" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="42" cy="4" r="2" fill="#f3d9a8" />
            <circle cx="11" cy="8" r="1.5" fill="#f3d9a8" />
            <circle cx="73" cy="8" r="1.5" fill="#f3d9a8" />
          </motion.svg>

          <motion.h1
            initial={{ opacity: 0, y: 44, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.35, ease: [0.22, 1, 0.36, 1] as any }}
            className="gold-text text-[clamp(3rem,11vw,7rem)] leading-[0.95] mb-1"
            style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", serif', fontWeight: 400, fontStyle: 'italic' }}
          >
            {wedding.groom}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="text-[#d4a87c]/70 text-sm tracking-[0.4em] my-2 uppercase"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            ❦ &nbsp; {t('wedding.and')} &nbsp; ❦
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 44, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.65, ease: [0.22, 1, 0.36, 1] as any }}
            className="gold-text text-[clamp(3rem,11vw,7rem)] leading-[0.95] mb-8"
            style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", serif', fontWeight: 400, fontStyle: 'italic' }}
          >
            {wedding.bride}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.1 }}
            className="gold-divider w-72"
          >
            <span className="line" /><span className="ornament" /><span className="line" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.3 }}
            className="text-[#f5e6d3]/70 text-base sm:text-lg mt-6 uppercase tracking-[0.32em]"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}
          >
            {formattedDate}
          </motion.p>
          {wedding.venue && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 1.45 }}
              className="text-[#d4a87c]/60 text-xs sm:text-sm mt-2 tracking-[0.25em] uppercase"
            >
              {wedding.venue}
            </motion.p>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.7 }}
            onClick={() => scrollTo('details')}
            className="mt-12 flex flex-col items-center gap-2 opacity-50 hover:opacity-90 transition-opacity"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#d4a87c]">
              {t('details.when') || 'Discover'}
            </span>
            <ChevronDown className="w-5 h-5 text-[#d4a87c] animate-bounce" />
          </motion.button>
        </div>
      </section>

      {/* ════════════ DEAR GUESTS ════════════ */}
      <section className={`relative z-10 py-24 sm:py-32 px-6 ${show('dearGuests') ? '' : 'hidden'}`}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#d4a87c]/75 mb-5">{t('sections.dearGuests')}</p>
            <h2
              className="gold-text text-4xl sm:text-5xl mb-6"
              style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, fontStyle: 'italic' }}
            >
              {t('wedding.dearGuests')}
            </h2>
            <div className="gold-divider w-44 mx-auto mb-12">
              <span className="line" /><span className="ornament" /><span className="line" />
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="velvet-card relative rounded-sm p-10 sm:p-14 text-left"
          >
            <span className="corner tl" /><span className="corner tr" />
            <span className="corner bl" /><span className="corner br" />

            {wedding.dearGuestMessage ? (
              <p className="text-base sm:text-lg leading-loose text-[#f5e6d3]/85 whitespace-pre-wrap text-center"
                 style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                {wedding.dearGuestMessage}
              </p>
            ) : (
              <div className="text-base sm:text-lg leading-loose text-[#f5e6d3]/80 space-y-4 text-center"
                   style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                <p>{t('wedding.foundEachOther')}</p>
                <p>{t('wedding.filledWithWarmth')}</p>
                <p>{t('wedding.inviteToCelebrate')}</p>
              </div>
            )}
            <div className="mt-10 pt-8 border-t border-[#d4a87c]/20 text-center space-y-2">
              <p className="text-xs sm:text-sm text-[#d4a87c]/70 uppercase tracking-[0.3em]">{t('wedding.withRespect')}</p>
              <p
                className="gold-text text-2xl sm:text-3xl"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, fontStyle: 'italic' }}
              >
                {wedding.groom} {t('wedding.and')} {wedding.bride}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ COUNTDOWN ════════════ */}
      <section className={`relative z-10 py-24 px-6 ${show('countdown') ? '' : 'hidden'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(212,168,124,0.06),transparent)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.p
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-[10px] uppercase tracking-[0.55em] text-[#d4a87c]/75 mb-3"
          >
            {t('countdown.timeRemaining')}
          </motion.p>
          <motion.h3
            variants={fadeUp} custom={0.5} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="gold-text text-2xl sm:text-3xl mb-12"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400 }}
          >
            {t('details.when')}
          </motion.h3>

          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-4 gap-2 sm:gap-5"
          >
            {[
              { label: t('wedding.countdown.days'),    value: timeLeft.days },
              { label: t('wedding.countdown.hours'),   value: timeLeft.hours },
              { label: t('wedding.countdown.minutes'), value: timeLeft.minutes },
              { label: t('wedding.countdown.seconds'), value: timeLeft.seconds },
            ].map(({ label, value }, i) => (
              <motion.div
                key={label}
                variants={fadeUp} custom={i + 2} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="velvet-card velvet-glow relative rounded-sm p-3 sm:p-7"
              >
                <span className="corner tl" /><span className="corner tr" />
                <span className="corner bl" /><span className="corner br" />
                <motion.span
                  key={value}
                  initial={{ opacity: 0.4, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="gold-text text-3xl sm:text-5xl tabular-nums block"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}
                >
                  {String(value).padStart(2, '0')}
                </motion.span>
                <span className="block text-[8px] sm:text-[10px] uppercase tracking-[0.35em] text-[#d4a87c]/60 mt-2 sm:mt-3">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════ OUR MEMORIES ════════════ */}
      {memoryPhotos.length > 0 && (
        <section id="memories" className={`relative z-10 py-24 px-6 border-t border-[#d4a87c]/10 ${show('gallery') ? '' : 'hidden'}`}>
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-[10px] uppercase tracking-[0.55em] text-[#d4a87c]/75 mb-3">
                {t('wedding.photos') || 'Our Memories'}
              </p>
              <h3 className="gold-text text-3xl sm:text-4xl"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400 }}>
                {t('wedding.memoryPhotos') || 'Memory Gallery'}
              </h3>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {memoryPhotos.map((photo: any, i: number) => (
                <motion.div
                  key={i}
                  variants={fadeUp} custom={i % 3} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="aspect-square overflow-hidden rounded-sm border border-[#d4a87c]/20 bg-[#1a060f]"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════ EVENT DETAILS ════════════ */}
      <section id="details" className={`relative z-10 py-24 px-6 border-t border-[#d4a87c]/10 ${show('details') ? '' : 'hidden'}`}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[10px] uppercase tracking-[0.55em] text-[#d4a87c]/75 mb-3">{t('sections.weddingDetails')}</p>
            <h2 className="gold-text text-4xl sm:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, fontStyle: 'italic' }}>
              {t('details.when')} &amp; {t('details.where')}
            </h2>
            <div className="gold-divider w-44 mx-auto mt-5">
              <span className="line" /><span className="ornament" /><span className="line" />
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            <motion.div
              variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="velvet-card relative rounded-sm p-10 text-center"
            >
              <span className="corner tl" /><span className="corner tr" />
              <span className="corner bl" /><span className="corner br" />
              <div className="w-14 h-14 rounded-full bg-[#d4a87c]/10 border border-[#d4a87c]/30 flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-6 h-6 text-[#f3d9a8]" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4a87c]/70 mb-3">{t('details.when')}</p>
              <p className="gold-text text-xl sm:text-2xl"
                 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}>
                {formattedDate}
              </p>
              <p className="text-[#f5e6d3]/55 text-sm mt-2">
                {t('details.ceremonyBegins')} {wedding.weddingTime || '16:00'}
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="velvet-card relative rounded-sm p-10 text-center"
            >
              <span className="corner tl" /><span className="corner tr" />
              <span className="corner bl" /><span className="corner br" />
              <div className="w-14 h-14 rounded-full bg-[#d4a87c]/10 border border-[#d4a87c]/30 flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-6 h-6 text-[#f3d9a8]" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4a87c]/70 mb-3">{t('details.where')}</p>
              <p className="gold-text text-xl sm:text-2xl"
                 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}>
                {wedding.venue || t('details.venueTBD')}
              </p>
              {(wedding.mapPinUrl || wedding.venueAddress) && (
                <button
                  onClick={openMap}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2 border border-[#d4a87c]/40 text-[#d4a87c] hover:bg-[#d4a87c]/10 hover:text-[#f3d9a8] transition-all text-xs uppercase tracking-[0.3em]"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {t('details.viewMap')}
                </button>
              )}
            </motion.div>
          </div>

          {wedding.story && (
            <motion.div
              variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mt-20 max-w-5xl mx-auto"
            >
              <div className="text-center mb-10">
                <p className="text-[10px] uppercase tracking-[0.55em] text-[#d4a87c]/75 mb-3">{t('sections.ourStory') || 'Our Story'}</p>
                <h3 className="gold-text text-3xl sm:text-4xl"
                    style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400 }}>
                  {t('wedding.ourJourney') || t('sections.ourStory') || 'Our Journey'}
                </h3>
                <div className="gold-divider w-32 mx-auto mt-4">
                  <span className="line" /><span className="ornament" /><span className="line" />
                </div>
              </div>

              <div className={`grid gap-8 sm:gap-12 items-center ${storySlides.length > 0 ? 'lg:grid-cols-5' : ''}`}>
                {storySlides.length > 0 && (
                  <div className="lg:col-span-2">
                    <div className="baroque-frame">
                      <MediaCarousel
                        slides={storySlides}
                        transition="fade"
                        autoplayMs={5000}
                        pauseOnHover
                        showArrows={storySlides.length > 1}
                        showDots={storySlides.length > 1}
                        aspectClass="aspect-[3/4]"
                        imageClassName="object-contain"
                        className="bg-[#1a060f]"
                        theme={{ accent: '#f3d9a8', surface: 'rgba(26,6,15,0.6)', iconColor: '#f3d9a8' }}
                      />
                    </div>
                  </div>
                )}
                <div className={storySlides.length > 0 ? 'lg:col-span-3' : ''}>
                  <p className="text-[#f5e6d3]/80 text-base sm:text-lg leading-loose whitespace-pre-wrap"
                     style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic' }}>
                    "{wedding.story}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ════════════ RSVP ════════════ */}
      <section id="rsvp" className={`relative z-10 py-24 px-6 border-t border-[#d4a87c]/10 ${show('rsvp') ? '' : 'hidden'}`}>
        <div className="max-w-2xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.55em] text-[#d4a87c]/75 mb-3">{t('sections.rsvp')}</p>
            <h2 className="gold-text text-4xl sm:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400 }}>
              {t('rsvp.title')}
            </h2>
            <div className="gold-divider w-44 mx-auto mt-5">
              <span className="line" /><span className="ornament" /><span className="line" />
            </div>
          </motion.div>
          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="velvet-card relative rounded-sm p-6 sm:p-10"
          >
            <span className="corner tl" /><span className="corner tr" />
            <span className="corner bl" /><span className="corner br" />
            <EpicRSVPForm wedding={wedding} primaryColor="#d4a87c" accentColor="#8a5a3a" labelColor="text-[#f5e6d3]" />
          </motion.div>
        </div>
      </section>

      {/* ════════════ GUEST BOOK ════════════ */}
      <section id="guestbook" className={`relative z-10 py-24 px-6 border-t border-[#d4a87c]/10 ${show('guestbook') ? '' : 'hidden'}`}>
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.55em] text-[#d4a87c]/75 mb-3">{t('sections.guestbook')}</p>
            <h2 className="gold-text text-4xl sm:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400 }}>
              {t('guestbook.title')}
            </h2>
            <div className="gold-divider w-44 mx-auto mt-5">
              <span className="line" /><span className="ornament" /><span className="line" />
            </div>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <GuestBookForm weddingId={wedding.id} primaryColor="#d4a87c" accentColor="#8a5a3a" />
          </motion.div>

          {guestBookEntries.length > 0 && (
            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mt-10 space-y-4"
            >
              {guestBookEntries.slice(0, 6).map((entry: any) => (
                <div key={entry.id} className="velvet-card relative rounded-sm p-6">
                  <span className="corner tl" /><span className="corner tr" />
                  <span className="corner bl" /><span className="corner br" />
                  <p className="text-[#f5e6d3]/85 italic"
                     style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                    "{entry.message}"
                  </p>
                  <p className="gold-text text-sm mt-3 uppercase tracking-[0.3em]">— {entry.guestName}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="relative z-10 py-14 px-6 border-t border-[#d4a87c]/15 text-center">
        <OrderInvitationCTA accent="#d4a87c" surface="dark" className="mb-12" />
        <div className="gold-divider w-32 mx-auto mb-5">
          <span className="line" /><span className="ornament" /><span className="line" />
        </div>
        <p className="gold-text text-2xl mb-2"
           style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 500 }}>
          {wedding.groom} &amp; {wedding.bride}
        </p>
        <p className="text-[#f5e6d3]/40 text-xs uppercase tracking-[0.4em]">{t('footer.withLove')}</p>
        <p className="text-[#d4a87c]/55 text-[11px] mt-3">{t('footer.thanksForCelebrating')}</p>
        <p className="text-[#d4a87c]/30 text-[10px] mt-6 tracking-[0.3em] uppercase">— Velvet —</p>
      </footer>

      <div className="sm:hidden h-16" aria-hidden />
    </div>
  );
}

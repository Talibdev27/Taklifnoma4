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
  MapPin, Heart, MessageSquare, Calendar, Users, ChevronDown, Sparkles,
} from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, GuestBookEntry } from '@shared/schema';

/* Pre-computed sparkles */
const SPARKLES = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  size: 1.5 + (i * 7 % 4),
  left: (i * 11 + 7) % 100,
  top: (i * 17 + 5) % 100,
  duration: 3 + (i * 0.7 % 5),
  delay: (i * 0.4) % 6,
}));

interface AuroraTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

export function AuroraTemplate({ wedding, photos = [] }: AuroraTemplateProps) {
  const { t, i18n } = useTranslation();

  const couplePhotos = photos.filter((p: any) => p.photoType === 'couple');
  const memoryPhotos = photos.filter((p: any) => p.photoType === 'memory');
  const heroDesignated = photos.filter((p: any) => p.photoType === 'hero' || p.isHero);

  const heroSlides = (() => {
    const list: { url: string; alt?: string }[] = [];
    if (heroDesignated.length > 0) {
      heroDesignated.forEach((p: any) => list.push({ url: p.url, alt: p.caption ?? '' }));
    } else {
      if (wedding.couplePhotoUrl) list.push({ url: wedding.couplePhotoUrl, alt: '' });
      couplePhotos.forEach((p: any) => list.push({ url: p.url, alt: p.caption ?? '' }));
    }
    const seen = new Set<string>();
    return list.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
  })();

  const storySlides = (() => {
    const list: { url: string; alt?: string }[] = [];
    memoryPhotos.forEach((p: any) => list.push({ url: p.url, alt: p.caption ?? '' }));
    if (list.length === 0) {
      couplePhotos.forEach((p: any) => list.push({ url: p.url, alt: p.caption ?? '' }));
      if (list.length === 0 && wedding.couplePhotoUrl) {
        list.push({ url: wedding.couplePhotoUrl, alt: '' });
      }
    }
    const seen = new Set<string>();
    return list.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
  })();

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeNav, setActiveNav] = useState('home');
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [opening, setOpening] = useState(false);
  const musicRef = useRef<AzamatScrollMusicHandle | null>(null);

  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      i18n.changeLanguage(wedding.defaultLanguage);
    }
  }, [wedding?.defaultLanguage, i18n]);

  const handleOpenEnvelope = () => {
    if (opening) return;
    musicRef.current?.startPlayback();
    setOpening(true);
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
      <div className="min-h-screen flex items-center justify-center bg-[#1a1530] text-white">
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
    <div className="min-h-screen bg-[#1a1530] text-white overflow-x-hidden" style={{ fontFamily: '"Lato", sans-serif' }}>
      <style>{`
        /* ── Aurora moving gradient backdrop (the star of the show) ─ */
        @keyframes aurora-1 {
          0%, 100% { transform: translate(-30%, -20%) rotate(0deg) scale(1); }
          33%      { transform: translate(20%, -30%) rotate(120deg) scale(1.2); }
          66%      { transform: translate(-10%, 20%) rotate(240deg) scale(0.9); }
        }
        @keyframes aurora-2 {
          0%, 100% { transform: translate(20%, -30%) rotate(0deg) scale(1.1); }
          50%      { transform: translate(-30%, 30%) rotate(180deg) scale(1.3); }
        }
        @keyframes aurora-3 {
          0%, 100% { transform: translate(-20%, 30%) rotate(0deg) scale(1); }
          50%      { transform: translate(30%, -10%) rotate(180deg) scale(1.15); }
        }
        @keyframes aurora-4 {
          0%, 100% { transform: translate(40%, 40%) rotate(0deg) scale(0.95); }
          50%      { transform: translate(-20%, -30%) rotate(180deg) scale(1.25); }
        }
        .aurora-stage {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
          background: linear-gradient(160deg, #1a1530 0%, #2a1f4a 30%, #1d1640 60%, #0f0a25 100%);
        }
        .aurora-blob {
          position: absolute; width: 70vw; height: 70vw;
          border-radius: 50%; filter: blur(90px); mix-blend-mode: screen; opacity: 0.55;
        }
        .aurora-blob.b1 {
          top: -10%; left: -15%;
          background: radial-gradient(circle, #ff9ec0 0%, rgba(255,158,192,0) 60%);
          animation: aurora-1 22s ease-in-out infinite;
        }
        .aurora-blob.b2 {
          top: 10%; right: -20%;
          background: radial-gradient(circle, #b8a3ff 0%, rgba(184,163,255,0) 60%);
          animation: aurora-2 28s ease-in-out infinite;
        }
        .aurora-blob.b3 {
          bottom: -10%; left: 10%;
          background: radial-gradient(circle, #88e5d3 0%, rgba(136,229,211,0) 60%);
          animation: aurora-3 26s ease-in-out infinite;
        }
        .aurora-blob.b4 {
          bottom: 5%; right: 0%;
          background: radial-gradient(circle, #d4ecff 0%, rgba(212,236,255,0) 60%);
          animation: aurora-4 30s ease-in-out infinite;
        }

        /* ── Aurora gradient text ─────────────────────────────────── */
        @keyframes aurora-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .aurora-text {
          background: linear-gradient(120deg,
            #ffd6e1 0%, #e8d4f5 18%, #d4ecff 32%,
            #c9b6e3 50%, #a8d0e6 65%, #bde4c8 80%, #ffd6e1 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: aurora-shimmer 7s ease infinite;
        }

        /* ── Glassmorphism card ───────────────────────────────────── */
        .aurora-glass {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.16) inset,
            0 -1px 0 rgba(255,255,255,0.04) inset,
            0 24px 60px rgba(15,10,40,0.45);
        }
        .aurora-glass-strong {
          background: linear-gradient(135deg, rgba(255,214,225,0.10), rgba(184,163,255,0.10), rgba(168,208,230,0.10));
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.18);
        }

        /* ── Sparkles ─────────────────────────────────────────────── */
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50%      { opacity: 1; transform: scale(1); }
        }
        .aurora-sparkle {
          position: absolute; pointer-events: none;
          background: radial-gradient(circle, #fff 0%, transparent 60%);
          border-radius: 50%;
          animation: twinkle ease-in-out infinite;
          box-shadow: 0 0 12px rgba(255,255,255,0.95), 0 0 22px rgba(201,182,227,0.7);
        }

        /* ── Glowing aurora ring (countdown) ──────────────────────── */
        @keyframes ring-glow {
          0%, 100% {
            box-shadow:
              0 0 18px rgba(255,182,210,0.25),
              0 0 36px rgba(184,163,255,0.18),
              inset 0 0 18px rgba(255,255,255,0.08);
          }
          50% {
            box-shadow:
              0 0 36px rgba(255,182,210,0.45),
              0 0 56px rgba(184,163,255,0.32),
              inset 0 0 28px rgba(255,255,255,0.14);
          }
        }
        .aurora-glow { animation: ring-glow 4.5s ease-in-out infinite; }

        /* ── Aurora CTA shimmer ───────────────────────────────────── */
        @keyframes cta-rainbow {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .aurora-cta {
          background: linear-gradient(90deg, #ffb6d2 0%, #c9b6e3 25%, #a8d0e6 50%, #bde4c8 75%, #ffb6d2 100%);
          background-size: 200% auto;
          animation: cta-rainbow 4s linear infinite;
          color: #1a1530;
        }

        /* ── Photo dreamy frame ───────────────────────────────────── */
        .dream-frame {
          position: relative;
          padding: 4px;
          background: linear-gradient(135deg, #ffb6d2, #c9b6e3, #a8d0e6, #bde4c8, #e8d4f5);
          background-size: 300% 300%;
          animation: aurora-shimmer 8s ease infinite;
          border-radius: 28px;
          box-shadow: 0 24px 60px rgba(15,10,40,0.45), 0 0 30px rgba(184,163,255,0.25);
        }

        /* ── Slow drifting halo behind hero ───────────────────────── */
        @keyframes halo-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .hero-halo {
          position: absolute; inset: 50% auto auto 50%;
          width: 110vmin; height: 110vmin;
          transform: translate(-50%, -50%);
          background: conic-gradient(from 0deg,
            rgba(255,182,210,0.25),
            rgba(184,163,255,0.20),
            rgba(168,208,230,0.20),
            rgba(189,228,200,0.20),
            rgba(255,199,138,0.22),
            rgba(255,182,210,0.25));
          border-radius: 50%; filter: blur(60px);
          animation: halo-rotate 60s linear infinite;
        }

        /* ── Wavy aurora ribbon (decorative SVG path) ─────────────── */
        .aurora-ribbon path { stroke: url(#auroraGrad); stroke-width: 1.5; fill: none; }

        /* ── Accessibility: respect reduced-motion preferences ──── */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .aurora-blob, .hero-halo { animation: none !important; }
        }

        /* ── Hero photo backdrop — softly blurred behind aurora ──── */
        .aurora-hero-photo {
          position: absolute;
          inset: 0;
          opacity: 0.25;
          overflow: hidden;
        }
        .aurora-hero-photo img {
          filter: blur(2px) saturate(0.8);
        }
      `}</style>

      <AzamatScrollMusic
        ref={musicRef}
        musicUrl={wedding.backgroundMusicUrl ?? ''}
        theme={{ primary: '#c9b6e3', accent: '#a8d0e6', iconColor: '#1a1530', glow: 'rgba(201,182,227,0.55)' }}
      />

      {/* ── Aurora backdrop ───────────────────────────────────────── */}
      <div className="aurora-stage" aria-hidden>
        <div className="aurora-blob b1" />
        <div className="aurora-blob b2" />
        <div className="aurora-blob b3" />
        <div className="aurora-blob b4" />
      </div>

      {/* ── Sparkles (fixed, behind everything) ──────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        {SPARKLES.map(p => (
          <div
            key={p.id}
            className="aurora-sparkle"
            style={{
              width: p.size, height: p.size,
              left: `${p.left}%`, top: `${p.top}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* SVG defs for ribbon gradient */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="auroraGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffb6d2" />
            <stop offset="35%" stopColor="#c9b6e3" />
            <stop offset="65%" stopColor="#a8d0e6" />
            <stop offset="100%" stopColor="#bde4c8" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Envelope intro ────────────────────────────────────────── */}
      {showEnvelope && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0a0820]/45 backdrop-blur-2xl px-4"
          onClick={handleOpenEnvelope}
        >
          {/* aurora glow behind envelope */}
          <div className="absolute w-[90vw] h-[90vw] max-w-[700px] max-h-[700px]" style={{
            background: 'radial-gradient(circle, rgba(255,182,210,0.22) 0%, rgba(184,163,255,0.18) 35%, rgba(168,208,230,0.10) 60%, transparent 80%)',
            filter: 'blur(40px)',
          }} />

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleOpenEnvelope(); }}
            className="relative w-[min(92vw,440px)] h-[300px] cursor-pointer focus:outline-none"
            aria-label={t('welcome.openInvitation')}
          >
            <div className="absolute inset-x-6 bottom-[-22px] h-12 rounded-full bg-black/40 blur-2xl" />
            <div className="dream-frame">
              <div
                className="relative h-[290px] rounded-[24px] overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a1530 0%, #2a1f4a 50%, #0f0a25 100%)' }}
              >
                <div className="hero-halo opacity-50" />

                {/* sparkles inside envelope */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aurora-sparkle"
                       style={{
                         width: 2 + i % 2, height: 2 + i % 2,
                         left: `${(i * 13 + 5) % 90}%`,
                         top: `${(i * 17 + 8) % 80}%`,
                         animationDuration: `${2 + i * 0.3}s`,
                         animationDelay: `${i * 0.2}s`,
                       }} />
                ))}

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <Sparkles className="w-6 h-6 mb-3 text-white/85" />
                  <p className="text-[10px] uppercase tracking-[0.5em] text-white/65 mb-3">
                    {t('welcome.weddingTitle', { bride: wedding.groom, groom: wedding.bride })}
                  </p>
                  <p
                    className="aurora-text text-3xl sm:text-4xl leading-tight"
                    style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", serif', fontWeight: 500, fontStyle: 'italic' }}
                  >
                    {wedding.groom} &amp; {wedding.bride}
                  </p>
                  <div className="mt-5 h-px w-32"
                       style={{ background: 'linear-gradient(90deg, transparent, #c9b6e3 50%, transparent)' }} />
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
                      background: 'linear-gradient(180deg, rgba(184,163,255,0.85) 0%, rgba(255,182,210,0.85) 50%, rgba(168,208,230,0.85) 100%)',
                      borderTop: '1px solid rgba(255,255,255,0.4)',
                    }}
                  />
                  <div
                    className="absolute left-1/2 top-[36%] -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle, #fff 0%, #ffd6e1 60%, #c9b6e3 100%)',
                      boxShadow: '0 4px 18px rgba(184,163,255,0.6), inset 0 -3px 6px rgba(0,0,0,0.10)',
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-[#7a5cb0]" />
                  </div>
                </div>
              </div>
            </div>
            <p className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.3em] uppercase text-white/75 whitespace-nowrap">
              {opening ? t('welcome.opening') : t('welcome.clickToOpen')}
            </p>
          </button>
        </div>
      )}

      {/* ── Top desktop nav ───────────────────────────────────────── */}
      <nav className="hidden sm:flex fixed top-0 inset-x-0 z-50 bg-[#1a1530]/40 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-8 py-3.5">
          <span
            className="aurora-text text-xl select-none"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, fontStyle: 'italic', letterSpacing: '0.04em' }}
          >
            {wedding.groom} &amp; {wedding.bride}
          </span>
          <div className="flex gap-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                  activeNav === id
                    ? 'bg-white/15 text-white border border-white/25'
                    : 'text-white/45 hover:text-white/85 border border-transparent'
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
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0a0820]/85 backdrop-blur-2xl border-t border-white/10">
        <div className="flex justify-around py-2 px-1">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex flex-col items-center gap-0.5 min-w-[48px] py-1 transition-colors ${
                activeNav === id ? 'text-white' : 'text-white/40'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-[0.2em]">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden z-10">
        {/* spinning halo */}
        <div className="hero-halo" />

        {/* couple photos softly behind — carousel */}
        {heroSlides.length > 0 && (
          <div className="aurora-hero-photo">
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
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1530]/30 to-[#1a1530]" />

        {/* aurora wavy ribbon */}
        <svg
          viewBox="0 0 600 80" preserveAspectRatio="none"
          className="aurora-ribbon absolute top-1/4 left-0 right-0 w-full h-20 opacity-40 pointer-events-none"
        >
          <path d="M0 40 Q150 0 300 40 T600 40" />
          <path d="M0 50 Q150 80 300 50 T600 50" opacity="0.6" />
        </svg>

        <div className="relative z-10 flex flex-col items-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="mb-4 flex items-center gap-2"
          >
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#ffb6d2]" />
            <Sparkles className="w-4 h-4 text-[#ffb6d2]" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#ffb6d2]" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-[10px] sm:text-[11px] uppercase tracking-[0.55em] text-white/75 mb-7"
          >
            {t('modern.tagline')}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 44, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.35, ease: [0.22, 1, 0.36, 1] as any }}
            className="aurora-text text-[clamp(3rem,12vw,7.5rem)] leading-[0.92] mb-1"
            style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", serif', fontWeight: 400, fontStyle: 'italic' }}
          >
            {wedding.groom}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="text-white/55 text-base sm:text-lg my-3"
            style={{ fontFamily: '"My Soul", "Cormorant Garamond", cursive' }}
          >
            and
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 44, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.65, ease: [0.22, 1, 0.36, 1] as any }}
            className="aurora-text text-[clamp(3rem,12vw,7.5rem)] leading-[0.92] mb-8"
            style={{ fontFamily: '"Cormorant Garamond", "Playfair Display", serif', fontWeight: 400, fontStyle: 'italic' }}
          >
            {wedding.bride}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 1 }}
            className="h-px w-64"
            style={{ background: 'linear-gradient(90deg, transparent, #ffb6d2 30%, #c9b6e3 50%, #a8d0e6 70%, transparent)' }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.2 }}
            className="text-white/85 text-base sm:text-lg mt-6 uppercase tracking-[0.32em]"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400 }}
          >
            {formattedDate}
          </motion.p>
          {wedding.venue && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 1.4 }}
              className="text-white/55 text-xs sm:text-sm mt-2 tracking-[0.25em] uppercase"
            >
              {wedding.venue}
            </motion.p>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.7 }}
            onClick={() => scrollTo('details')}
            className="mt-12 flex flex-col items-center gap-2 text-white/55 hover:text-white transition-colors"
          >
            <span className="text-[10px] uppercase tracking-[0.4em]">{t('aurora.discover')}</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </motion.button>
        </div>
      </section>

      {/* ════════════ DEAR GUESTS ════════════ */}
      <section className="relative z-10 py-24 sm:py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="flex items-center justify-center gap-3 mb-5">
              <Sparkles className="w-4 h-4 text-[#ffb6d2]" />
              <p className="text-[10px] uppercase tracking-[0.5em] text-white/70">{t('sections.dearGuests')}</p>
              <Sparkles className="w-4 h-4 text-[#a8d0e6]" />
            </div>
            <h2
              className="aurora-text text-4xl sm:text-5xl mb-6"
              style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, fontStyle: 'italic' }}
            >
              {t('wedding.dearGuests')}
            </h2>
            <div className="h-px w-32 mx-auto mb-12"
                 style={{ background: 'linear-gradient(90deg, transparent, #c9b6e3 50%, transparent)' }} />
          </motion.div>

          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="aurora-glass-strong rounded-[28px] p-10 sm:p-14 text-left"
          >
            {wedding.dearGuestMessage ? (
              <p className="text-base sm:text-lg leading-loose text-white/85 whitespace-pre-wrap text-center"
                 style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                {wedding.dearGuestMessage}
              </p>
            ) : (
              <div className="text-base sm:text-lg leading-loose text-white/80 space-y-4 text-center"
                   style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                <p>{t('wedding.foundEachOther')}</p>
                <p>{t('wedding.filledWithWarmth')}</p>
                <p>{t('wedding.inviteToCelebrate')}</p>
              </div>
            )}
            <div className="mt-10 pt-8 border-t border-white/15 text-center space-y-2">
              <p className="text-xs sm:text-sm text-white/55 uppercase tracking-[0.3em]">{t('wedding.withRespect')}</p>
              <p
                className="aurora-text text-2xl sm:text-3xl"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, fontStyle: 'italic' }}
              >
                {wedding.groom} {t('wedding.and')} {wedding.bride}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ COUNTDOWN — glowing aurora rings ════════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-[10px] uppercase tracking-[0.55em] text-white/70 mb-3">
              {t('countdown.timeRemaining')}
            </p>
            <h3 className="aurora-text text-2xl sm:text-3xl mb-12"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400 }}>
              {t('details.when')}
            </h3>
          </motion.div>

          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-4 gap-3 sm:gap-5"
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
                className="aurora-glass aurora-glow rounded-2xl p-3 sm:p-7"
              >
                <motion.span
                  key={value}
                  initial={{ opacity: 0.4, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="aurora-text text-3xl sm:text-5xl tabular-nums block"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}
                >
                  {String(value).padStart(2, '0')}
                </motion.span>
                <span className="block text-[8px] sm:text-[10px] uppercase tracking-[0.35em] text-white/55 mt-2 sm:mt-3">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════ EVENT DETAILS ════════════ */}
      <section id="details" className="relative z-10 py-24 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[10px] uppercase tracking-[0.55em] text-white/70 mb-3">{t('sections.weddingDetails')}</p>
            <h2 className="aurora-text text-4xl sm:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, fontStyle: 'italic' }}>
              {t('details.when')} &amp; {t('details.where')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            <motion.div
              variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="aurora-glass rounded-2xl p-10 text-center"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
                   style={{ background: 'linear-gradient(135deg, rgba(255,182,210,0.25), rgba(184,163,255,0.25))', border: '1px solid rgba(255,255,255,0.25)' }}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/65 mb-3">{t('details.when')}</p>
              <p className="aurora-text text-xl sm:text-2xl"
                 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}>
                {formattedDate}
              </p>
              <p className="text-white/60 text-sm mt-2">
                {t('details.ceremonyBegins')} {wedding.weddingTime || '16:00'}
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="aurora-glass rounded-2xl p-10 text-center"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
                   style={{ background: 'linear-gradient(135deg, rgba(168,208,230,0.25), rgba(189,228,200,0.25))', border: '1px solid rgba(255,255,255,0.25)' }}>
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/65 mb-3">{t('details.where')}</p>
              <p className="aurora-text text-xl sm:text-2xl"
                 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}>
                {wedding.venue || t('details.venueTBD')}
              </p>
              {(wedding.mapPinUrl || wedding.venueAddress) && (
                <button
                  onClick={openMap}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full aurora-cta hover:scale-105 transition-transform text-xs uppercase font-semibold"
                  style={{ letterSpacing: '0.3em' }}
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
                <p className="text-[10px] uppercase tracking-[0.55em] text-white/70 mb-3">{t('sections.ourStory') || 'Our Story'}</p>
                <h3 className="aurora-text text-3xl sm:text-4xl"
                    style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400 }}>
                  {t('wedding.ourJourney') || t('sections.ourStory') || 'Our Journey'}
                </h3>
              </div>

              <div className={`grid gap-8 sm:gap-12 items-center ${storySlides.length > 0 ? 'lg:grid-cols-5' : ''}`}>
                {storySlides.length > 0 && (
                  <div className="lg:col-span-2">
                    <div className="dream-frame">
                      <div className="rounded-3xl overflow-hidden">
                        <MediaCarousel
                          slides={storySlides}
                          transition="fade"
                          autoplayMs={5500}
                          pauseOnHover
                          showArrows={storySlides.length > 1}
                          showDots={storySlides.length > 1}
                          aspectClass="aspect-[3/4]"
                          imageClassName="object-contain"
                          className="bg-[#1a1530]"
                          theme={{ accent: '#ffd6e1', surface: 'rgba(26,21,48,0.55)', iconColor: '#ffffff' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className={storySlides.length > 0 ? 'lg:col-span-3' : ''}>
                  <p className="text-white/80 text-base sm:text-lg leading-loose whitespace-pre-wrap"
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
      <section id="rsvp" className="relative z-10 py-24 px-6 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.55em] text-white/70 mb-3">{t('sections.rsvp')}</p>
            <h2 className="aurora-text text-4xl sm:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400 }}>
              {t('rsvp.title')}
            </h2>
            <div className="h-px w-32 mx-auto mt-5"
                 style={{ background: 'linear-gradient(90deg, transparent, #c9b6e3 50%, transparent)' }} />
          </motion.div>
          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="aurora-glass-strong rounded-[28px] p-6 sm:p-10"
          >
            <EpicRSVPForm wedding={wedding} primaryColor="#c9b6e3" accentColor="#ffb6d2" labelColor="text-white" />
          </motion.div>
        </div>
      </section>

      {/* ════════════ GUEST BOOK ════════════ */}
      <section id="guestbook" className="relative z-10 py-24 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.55em] text-white/70 mb-3">{t('sections.guestbook')}</p>
            <h2 className="aurora-text text-4xl sm:text-5xl"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400 }}>
              {t('guestbook.title')}
            </h2>
            <div className="h-px w-32 mx-auto mt-5"
                 style={{ background: 'linear-gradient(90deg, transparent, #c9b6e3 50%, transparent)' }} />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <GuestBookForm weddingId={wedding.id} primaryColor="#c9b6e3" accentColor="#ffb6d2" />
          </motion.div>

          {guestBookEntries.length > 0 && (
            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mt-10 grid sm:grid-cols-2 gap-4"
            >
              {guestBookEntries.slice(0, 6).map((entry: any) => (
                <div key={entry.id} className="aurora-glass rounded-2xl p-6 relative">
                  <Sparkles className="absolute top-3 right-3 w-3.5 h-3.5 text-white/40" />
                  <p className="text-white/85 italic"
                     style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                    "{entry.message}"
                  </p>
                  <p className="aurora-text text-sm mt-3 uppercase tracking-[0.3em]" style={{ fontFamily: '"Lato", sans-serif' }}>
                    — {entry.guestName}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="relative z-10 py-14 px-6 border-t border-white/10 text-center">
        <OrderInvitationCTA accent="#c9b6e3" surface="dark" className="mb-12" />
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, #ffb6d2)' }} />
          <Sparkles className="w-4 h-4 text-[#c9b6e3]" />
          <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, #a8d0e6, transparent)' }} />
        </div>
        <p className="aurora-text text-2xl mb-2"
           style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 500 }}>
          {wedding.groom} &amp; {wedding.bride}
        </p>
        <p className="text-white/45 text-xs uppercase tracking-[0.4em]">{t('footer.withLove')}</p>
        <p className="text-white/55 text-[11px] mt-3">{t('footer.thanksForCelebrating')}</p>
        <p className="text-white/30 text-[10px] mt-6 tracking-[0.3em] uppercase">— Aurora —</p>
      </footer>

      <div className="sm:hidden h-16" aria-hidden />
    </div>
  );
}

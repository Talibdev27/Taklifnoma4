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
  MapPin, Heart, MessageSquare, Calendar, Users, ArrowDown,
} from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, GuestBookEntry } from '@shared/schema';
import { isTwinWedding, coupleNames, weddingTitleParams } from '@/lib/couples';

/** Tasteful default shown in the Our Story carousel when a wedding has no
 *  uploaded photos at all, so the section never renders empty. */
const STORY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80';

interface PearlTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

export function PearlTemplate({ wedding, photos = [] }: PearlTemplateProps) {
  const { t, i18n } = useTranslation();

  // Per-section visibility (admin toggles). Shown unless explicitly turned off.
  const show = (key: string) => ((wedding?.sections as any) || {})[key] !== false;

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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5f0] text-[#1a1a1a]">
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

  // Issue style date pieces (e.g., 12 · 08 · 2025)
  const dateParts = wedding.weddingDate ? (() => {
    const d = new Date(wedding.weddingDate);
    return {
      day: String(d.getDate()).padStart(2, '0'),
      month: String(d.getMonth() + 1).padStart(2, '0'),
      year: String(d.getFullYear()),
    };
  })() : null;

  // Twin / double-wedding: two couples celebrating together (only names differ).
  const twin = isTwinWedding(wedding);

  const navItems = [
    { id: 'home', label: t('nav.home'), Icon: Heart },
    { id: 'details', label: t('nav.details'), Icon: Calendar },
    { id: 'rsvp', label: t('nav.rsvp'), Icon: Users },
    { id: 'guestbook', label: t('nav.guestbook'), Icon: MessageSquare },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.95, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as any },
    }),
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0] text-[#1a1a1a] overflow-x-hidden" style={{ fontFamily: '"Lato", sans-serif' }}>
      <style>{`
        /* ── Pearl iridescent shimmer for accents ─────────────────── */
        @keyframes pearl-shift {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .pearl-text {
          background: linear-gradient(120deg, #1a1a1a 0%, #4a4a4a 30%, #8a8a8a 50%, #4a4a4a 70%, #1a1a1a 100%);
          background-size: 250% 250%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: pearl-shift 9s ease infinite;
        }
        .pearl-iridescent {
          background: linear-gradient(120deg,
            #f8f5f0 0%, #e8e0d0 18%, #f0e8df 32%,
            #e0d8c8 48%, #f5edd8 62%, #e8e0d0 78%, #f8f5f0 100%);
          background-size: 300% 300%;
          animation: pearl-shift 12s ease infinite;
        }

        /* ── Subtle film grain overlay (gives editorial feel) ─────── */
        .pearl-grain::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          opacity: 0.06; mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E");
        }

        /* ── Vertical text utility (rotated) ──────────────────────── */
        .vertical-text {
          writing-mode: vertical-rl; transform: rotate(180deg);
          letter-spacing: 0.4em; text-transform: uppercase;
        }

        /* ── Hairline horizontal divider ──────────────────────────── */
        .hair-line {
          height: 1px; background: linear-gradient(90deg, transparent, #1a1a1a 50%, transparent);
          opacity: 0.5;
        }

        /* ── Pearl card (cream/off-white block) ───────────────────── */
        .pearl-card {
          background: #ffffff;
          border: 1px solid #1a1a1a14;
          box-shadow:
            0 1px 3px rgba(26,26,26,0.04),
            0 22px 50px rgba(26,26,26,0.06);
        }
        .pearl-card-dark {
          background: #1a1a1a;
          color: #f8f5f0;
          border: 1px solid #1a1a1a;
        }

        /* ── Marquee-style scrolling tagline ──────────────────────── */
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .pearl-marquee {
          display: flex; white-space: nowrap; animation: marquee 38s linear infinite;
        }

        /* ── Slow pearl orb floats ────────────────────────────────── */
        @keyframes float-orb {
          0%, 100% { transform: translateY(0) translateX(0); }
          33%      { transform: translateY(-20px) translateX(15px); }
          66%      { transform: translateY(15px) translateX(-12px); }
        }
        .pearl-orb {
          position: absolute; border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffffff 0%, #ede2d0 40%, #c8b89e 80%);
          opacity: 0.4; filter: blur(0.5px);
          animation: float-orb 14s ease-in-out infinite;
        }

        /* ── Issue-style underline for emphasized words ───────────── */
        .editorial-mark {
          position: relative; display: inline-block;
        }
        .editorial-mark::after {
          content: ''; position: absolute; left: -2%; right: -2%; bottom: -2px;
          height: 4px; background: #1a1a1a; opacity: 0.85;
        }

        /* ── CTA underline animation ──────────────────────────────── */
        .pearl-cta {
          position: relative; padding-bottom: 4px;
        }
        .pearl-cta::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
          background: currentColor; transform-origin: right;
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
        }
        .pearl-cta:hover::after { transform-origin: left; transform: scaleX(1.06); }

        /* ── Accessibility: respect reduced-motion preferences ──── */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .pearl-marquee { animation: none !important; }
        }

        /* ── Hero photo with editorial grayscale tone ──────────── */
        .pearl-hero-photo {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .pearl-hero-photo img {
          filter: grayscale(0.85) contrast(1.05);
        }
        /* ── Story carousel grayscale (also editorial) ─────────── */
        .pearl-story-photo img {
          filter: grayscale(0.85) contrast(1.05);
        }
      `}</style>

      <AzamatScrollMusic
        ref={musicRef}
        musicUrl={wedding.backgroundMusicUrl ?? ''}
        theme={{ primary: '#1a1a1a', accent: '#5a5a5a', iconColor: '#f8f5f0', glow: 'rgba(26,26,26,0.35)' }}
      />

      {/* ── Envelope intro ────────────────────────────────────────── */}
      {showEnvelope && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#f8f5f0] px-4"
          onClick={handleOpenEnvelope}
        >
          {/* large pearl orb behind */}
          <div className="absolute w-[80vw] h-[80vw] max-w-[700px] max-h-[700px] rounded-full pearl-iridescent opacity-50 blur-2xl" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleOpenEnvelope(); }}
            className="relative w-[min(92vw,440px)] h-[300px] cursor-pointer focus:outline-none"
            aria-label={t('welcome.openInvitation')}
          >
            <div className="absolute inset-x-6 bottom-[-20px] h-10 rounded-full bg-black/8 blur-2xl" />
            <div className="absolute inset-0 bg-white border border-[#1a1a1a] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[8px] bg-[#1a1a1a]" />
              <div className="absolute bottom-0 left-0 right-0 h-[8px] bg-[#1a1a1a]" />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pt-2">
                <p className="text-[10px] uppercase tracking-[0.55em] text-[#1a1a1a]/60 mb-5">
                  N° 01 &nbsp; · &nbsp; {dateParts ? dateParts.year : ''}
                </p>
                <p
                  className="text-[#1a1a1a] text-3xl sm:text-4xl leading-tight"
                  style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", serif', fontWeight: 500 }}
                >
                  {wedding.groom}
                </p>
                <p className="text-[#1a1a1a]/45 text-xs my-2 tracking-[0.5em] uppercase">&amp;</p>
                <p
                  className="text-[#1a1a1a] text-3xl sm:text-4xl leading-tight"
                  style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", serif', fontWeight: 500, fontStyle: 'italic' }}
                >
                  {wedding.bride}
                </p>
                {twin && (
                  <>
                    <p className="text-[#1a1a1a]/35 text-xs my-2 tracking-[0.5em]">◆</p>
                    <p
                      className="text-[#1a1a1a] text-3xl sm:text-4xl leading-tight"
                      style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", serif', fontWeight: 500 }}
                    >
                      {wedding.groom2}
                    </p>
                    <p className="text-[#1a1a1a]/45 text-xs my-2 tracking-[0.5em] uppercase">&amp;</p>
                    <p
                      className="text-[#1a1a1a] text-3xl sm:text-4xl leading-tight"
                      style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", serif', fontWeight: 500, fontStyle: 'italic' }}
                    >
                      {wedding.bride2}
                    </p>
                  </>
                )}
                <div className="hair-line w-32 mt-5" />
                <p className="text-[10px] uppercase tracking-[0.55em] text-[#1a1a1a]/55 mt-5">
                  {t('welcome.weddingTitle', weddingTitleParams(wedding))}
                </p>
              </div>

              {/* "fold" line that splits horizontally on open */}
              <div
                className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#1a1a1a] origin-center transition-transform duration-700 ease-out"
                style={{
                  transform: opening ? 'scaleX(0)' : 'scaleX(1)',
                }}
              />
              {/* white wash that sweeps across on open */}
              <div
                className="absolute inset-0 bg-white transition-transform duration-700 ease-out origin-left"
                style={{ transform: opening ? 'scaleX(0)' : 'scaleX(0)' }}
              />
            </div>
            <p className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.45em] uppercase text-[#1a1a1a]/65 whitespace-nowrap">
              {opening ? t('welcome.opening') : t('welcome.clickToOpen')}
            </p>
          </button>
        </div>
      )}

      {/* ── Floating pearl orbs (decorative) ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div className="pearl-orb" style={{ width: 280, height: 280, top: '12%', left: '-6%', animationDelay: '0s' }} />
        <div className="pearl-orb" style={{ width: 200, height: 200, top: '55%', right: '-4%', animationDelay: '4s' }} />
        <div className="pearl-orb" style={{ width: 140, height: 140, bottom: '8%', left: '15%', animationDelay: '8s' }} />
      </div>

      {/* ── Top desktop nav ───────────────────────────────────────── */}
      <nav className="hidden sm:flex fixed top-0 inset-x-0 z-50 bg-[#f8f5f0]/80 backdrop-blur-xl border-b border-[#1a1a1a]/8">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-8 py-4">
          <span
            className="text-base select-none tracking-[0.32em] uppercase"
            style={{ fontFamily: '"Lato", sans-serif', fontWeight: 600 }}
          >
            {wedding.groom.charAt(0)} <span className="opacity-30">·</span> {wedding.bride.charAt(0)}{twin && (<> <span className="opacity-30">·</span> {(wedding.groom2 || '').charAt(0)} <span className="opacity-30">·</span> {(wedding.bride2 || '').charAt(0)}</>)}
          </span>
          <div className="flex gap-8">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`pearl-cta uppercase transition-colors duration-300 ${
                  activeNav === id ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/45 hover:text-[#1a1a1a]'
                }`}
                style={{ letterSpacing: '0.32em', fontSize: '11px', fontWeight: 500 }}
              >
                {label}
              </button>
            ))}
          </div>
          <span
            className="text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/45 select-none"
          >
            {dateParts ? `${dateParts.day}.${dateParts.month}.${dateParts.year.slice(-2)}` : ''}
          </span>
        </div>
      </nav>

      {/* ── Mobile bottom nav ─────────────────────────────────────── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#f8f5f0]/95 backdrop-blur-xl border-t border-[#1a1a1a]/12">
        <div className="flex justify-around py-2 px-1">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex flex-col items-center gap-0.5 min-w-[48px] py-1 transition-colors ${
                activeNav === id ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/35'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-[0.25em] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ════════════ HERO — editorial cover ════════════ */}
      <section id="home" className="relative min-h-screen flex flex-col px-6 sm:px-12 pt-24 pb-12 z-10">
        {/* Magazine-style header strip */}
        <div className="hidden sm:flex justify-between items-center text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/55 mb-12 border-b border-[#1a1a1a]/15 pb-4">
          <span>{t('pearl.volumeIssue')}</span>
          <span>{dateParts ? `${dateParts.day}.${dateParts.month}.${dateParts.year}` : ''}</span>
          <span>{t('pearl.edition')}</span>
        </div>

        {/* Asymmetric grid */}
        <div className="grid sm:grid-cols-12 gap-6 sm:gap-10 flex-1 items-center">
          {/* Left vertical text spine */}
          <div className="hidden sm:flex sm:col-span-1 items-start justify-center pt-6">
            <p className="vertical-text text-[10px] tracking-[0.45em] text-[#1a1a1a]/60 font-medium">
              {t('modern.tagline')}
            </p>
          </div>

          {/* Names — large editorial */}
          <div className="sm:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="text-[10px] uppercase tracking-[0.5em] text-[#1a1a1a]/55 mb-6"
            >
              {t('welcome.weddingTitle', weddingTitleParams(wedding))}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] as any }}
              className="text-[clamp(3.5rem,12vw,9rem)] leading-[0.85] mb-2 text-[#1a1a1a]"
              style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, letterSpacing: '-0.02em' }}
            >
              {wedding.groom}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="text-2xl sm:text-3xl text-[#1a1a1a]/40 my-3"
              style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 400 }}
            >
              &amp;
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.45, ease: [0.22, 1, 0.36, 1] as any }}
              className="text-[clamp(3.5rem,12vw,9rem)] leading-[0.85] text-[#1a1a1a]"
              style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.02em' }}
            >
              {wedding.bride}
            </motion.h1>

            {twin && (
              <>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.65 }}
                  className="text-lg text-[#1a1a1a]/35 my-4 tracking-[0.5em]"
                >
                  ◆
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.1, delay: 0.75, ease: [0.22, 1, 0.36, 1] as any }}
                  className="text-[clamp(3.5rem,12vw,9rem)] leading-[0.85] mb-2 text-[#1a1a1a]"
                  style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, letterSpacing: '-0.02em' }}
                >
                  {wedding.groom2}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.95 }}
                  className="text-2xl sm:text-3xl text-[#1a1a1a]/40 my-3"
                  style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 400 }}
                >
                  &amp;
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.1, delay: 1, ease: [0.22, 1, 0.36, 1] as any }}
                  className="text-[clamp(3.5rem,12vw,9rem)] leading-[0.85] text-[#1a1a1a]"
                  style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.02em' }}
                >
                  {wedding.bride2}
                </motion.h1>
              </>
            )}

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 1, ease: 'easeOut' }}
              className="hair-line origin-left mt-10 max-w-md"
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mt-6 flex items-baseline gap-6"
            >
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/55">{t('details.when')}</span>
              {dateParts && (
                <span className="text-2xl sm:text-3xl tabular-nums tracking-[0.04em]"
                      style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}>
                  {dateParts.day} <span className="text-[#1a1a1a]/30">·</span> {dateParts.month} <span className="text-[#1a1a1a]/30">·</span> {dateParts.year}
                </span>
              )}
            </motion.div>
          </div>

          {/* Right photo column */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            className="sm:col-span-4"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-[#1a1a1a]">
              {heroSlides.length > 0 ? (
                <div className="pearl-hero-photo">
                  <MediaCarousel
                    slides={heroSlides}
                    transition="fade"
                    autoplayMs={6000}
                    pauseOnHover
                    showArrows={heroSlides.length > 1}
                    showDots={heroSlides.length > 1}
                    className="w-full h-full"
                    theme={{ accent: '#f8f5f0', surface: 'rgba(26,26,26,0.55)', iconColor: '#f8f5f0' }}
                  />
                </div>
              ) : (
                <img
                  src="/new3.jpg"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'grayscale(0.85) contrast(1.05)' }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 right-3 text-[#f8f5f0] text-[9px] uppercase tracking-[0.4em] font-medium pointer-events-none z-10">
                Plate I
              </div>
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/55 text-right">
              Photographed for the occasion
            </p>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.6 }}
          onClick={() => scrollTo('details')}
          className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors"
        >
          <span className="text-[10px] uppercase tracking-[0.45em]">{t('pearl.continueReading')}</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.button>
      </section>

      {/* ── Marquee divider ───────────────────────────────────────── */}
      <div className="relative z-10 border-y border-[#1a1a1a]/15 py-4 overflow-hidden bg-[#f0e8df]">
        <div className="pearl-marquee">
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="flex items-center gap-10 pr-10 shrink-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="flex items-center gap-10 text-[11px] uppercase tracking-[0.5em] text-[#1a1a1a]/65 font-medium whitespace-nowrap">
                  {coupleNames(wedding)}
                  <span className="text-[#1a1a1a]/35">◆</span>
                  {formattedDate}
                  <span className="text-[#1a1a1a]/35">◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ════════════ DEAR GUESTS — editorial article style ════════════ */}
      <section className={`relative z-10 py-20 sm:py-28 px-6 sm:px-12 pearl-grain ${show('dearGuests') ? '' : 'hidden'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-12 gap-8">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="sm:col-span-3"
            >
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#1a1a1a]/55 mb-2">{t('pearl.chapter1')}</p>
              <h2 className="text-3xl sm:text-4xl leading-tight"
                  style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, fontStyle: 'italic' }}>
                {t('wedding.dearGuests')}
              </h2>
              <div className="hair-line w-16 mt-4" />
            </motion.div>

            <motion.div
              variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="sm:col-span-9"
            >
              {wedding.dearGuestMessage ? (
                <p className="text-lg sm:text-xl leading-[1.85] text-[#1a1a1a]/85 whitespace-pre-wrap"
                   style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
                  {wedding.dearGuestMessage}
                </p>
              ) : (
                <div className="text-lg sm:text-xl leading-[1.85] text-[#1a1a1a]/85 space-y-5"
                     style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
                  <p className="first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-[0.85] first-letter:mt-1">
                    {t('wedding.foundEachOther')}
                  </p>
                  <p>{t('wedding.filledWithWarmth')}</p>
                  <p className="italic text-[#1a1a1a]/70">{t('wedding.inviteToCelebrate')}</p>
                </div>
              )}

              <div className="mt-12 flex items-center gap-5">
                <div className="hair-line flex-1" />
                <p className="text-[10px] uppercase tracking-[0.5em] text-[#1a1a1a]/60 whitespace-nowrap">
                  {t('wedding.withRespect')}
                </p>
                <div className="hair-line flex-1" />
              </div>
              <p className="mt-6 text-2xl sm:text-3xl text-center"
                 style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, fontStyle: 'italic' }}>
                {wedding.groom} <span className="opacity-40">&amp;</span> {wedding.bride}{twin && (<> <span className="opacity-30">·</span> {wedding.groom2} <span className="opacity-40">&amp;</span> {wedding.bride2}</>)}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════ COUNTDOWN — minimalist ticker ════════════ */}
      <section className={`relative z-10 bg-[#1a1a1a] text-[#f8f5f0] py-20 px-6 sm:px-12 ${show('countdown') ? '' : 'hidden'}`}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[10px] uppercase tracking-[0.55em] text-[#f8f5f0]/55 mb-2">{t('pearl.countingDown')}</p>
            <h3 className="text-3xl sm:text-4xl"
                style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, fontStyle: 'italic' }}>
              {t('countdown.timeRemaining')}
            </h3>
          </motion.div>

          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-4 gap-px bg-[#f8f5f0]/15"
          >
            {[
              { label: t('wedding.countdown.days'),    value: timeLeft.days },
              { label: t('wedding.countdown.hours'),   value: timeLeft.hours },
              { label: t('wedding.countdown.minutes'), value: timeLeft.minutes },
              { label: t('wedding.countdown.seconds'), value: timeLeft.seconds },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#1a1a1a] py-8 sm:py-12 px-4 text-center">
                <motion.span
                  key={value}
                  initial={{ opacity: 0.3, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="block text-[clamp(2.5rem,7vw,5rem)] tabular-nums leading-none"
                  style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}
                >
                  {String(value).padStart(2, '0')}
                </motion.span>
                <span className="block text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-[#f8f5f0]/55 mt-3 sm:mt-4">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════ OUR MEMORIES — editorial plates ════════════ */}
      {memoryPhotos.length > 0 && (
        <section id="memories" className={`relative z-10 py-20 sm:py-28 px-6 sm:px-12 pearl-grain ${show('gallery') ? '' : 'hidden'}`}>
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mb-10 sm:mb-14"
            >
              <p className="text-[10px] uppercase tracking-[0.55em] text-[#1a1a1a]/55 mb-4">
                {t('wedding.photos') || 'Our Memories'}
              </p>
              <h3 className="text-3xl sm:text-5xl text-[#1a1a1a]"
                  style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}>
                {t('wedding.memoryPhotos') || 'Memory Gallery'}
              </h3>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {memoryPhotos.map((photo: any, i: number) => (
                <motion.div
                  key={i}
                  variants={fadeUp} custom={i % 3} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="aspect-[4/5] overflow-hidden bg-[#1a1a1a]/5 ring-1 ring-[#1a1a1a]/10"
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

      {/* ════════════ EVENT DETAILS — split layout ════════════ */}
      <section id="details" className={`relative z-10 py-20 sm:py-28 px-6 sm:px-12 ${show('details') ? '' : 'hidden'}`}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[10px] uppercase tracking-[0.55em] text-[#1a1a1a]/55 mb-3">{t('pearl.chapter2')}</p>
            <h2 className="text-4xl sm:text-5xl"
                style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, fontStyle: 'italic' }}>
              {t('details.when')} &amp; {t('details.where')}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-px bg-[#1a1a1a]/15">
            {/* WHEN */}
            <motion.div
              variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="pearl-card p-10 sm:p-14 text-center"
            >
              <Calendar className="w-7 h-7 mx-auto mb-6 text-[#1a1a1a]/70" />
              <p className="text-[10px] uppercase tracking-[0.45em] text-[#1a1a1a]/55 mb-4">{t('details.when')}</p>
              {dateParts && (
                <p className="text-5xl sm:text-6xl tabular-nums leading-none mb-4"
                   style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}>
                  {dateParts.day}
                </p>
              )}
              <p className="pearl-text text-lg sm:text-xl"
                 style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}>
                {formattedDate}
              </p>
              <div className="hair-line w-16 mx-auto my-5" />
              <p className="text-sm text-[#1a1a1a]/65">
                {t('details.ceremonyBegins')} {wedding.weddingTime || '16:00'}
              </p>
            </motion.div>

            {/* WHERE */}
            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="pearl-card-dark p-10 sm:p-14 text-center"
            >
              <MapPin className="w-7 h-7 mx-auto mb-6 text-[#f8f5f0]/80" />
              <p className="text-[10px] uppercase tracking-[0.45em] text-[#f8f5f0]/55 mb-4">{t('details.where')}</p>
              <p className="text-2xl sm:text-3xl mb-4"
                 style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500, fontStyle: 'italic' }}>
                {wedding.venue || t('details.venueTBD')}
              </p>
              {wedding.venueAddress && (
                <p className="text-sm text-[#f8f5f0]/65 max-w-xs mx-auto leading-relaxed">
                  {wedding.venueAddress}
                </p>
              )}
              {(wedding.mapPinUrl || wedding.venueAddress) && (
                <button
                  onClick={openMap}
                  className="mt-6 inline-flex items-center gap-2 pearl-cta text-[#f8f5f0] uppercase"
                  style={{ letterSpacing: '0.32em', fontSize: '11px' }}
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
              className="mt-20 max-w-6xl mx-auto"
            >
              <div className={`grid gap-8 sm:gap-12 items-center ${storySlides.length > 0 ? 'lg:grid-cols-12' : ''}`}>
                {storySlides.length > 0 && (
                  <div className="lg:col-span-5">
                    <MediaCarousel
                      slides={storySlides}
                      transition="fade"
                      autoplayMs={5500}
                      pauseOnHover
                      showArrows={storySlides.length > 1}
                      showDots={storySlides.length > 1}
                      aspectClass="aspect-[4/5]"
                      imageClassName="object-contain"
                      className="pearl-story-photo bg-[#1a1a1a] ring-1 ring-[#1a1a1a]/15"
                      theme={{ accent: '#f8f5f0', surface: 'rgba(26,26,26,0.55)', iconColor: '#f8f5f0' }}
                    />
                    <p className="mt-3 text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/55">
                      Plate II — A moment captured
                    </p>
                  </div>
                )}
                <div className={storySlides.length > 0 ? 'lg:col-span-7' : ''}>
                  <p className="text-[10px] uppercase tracking-[0.55em] text-[#1a1a1a]/55 mb-5">
                    {t('sections.ourStory') || 'Our Story'}
                  </p>
                  <p className="text-xl sm:text-2xl leading-[1.7] text-[#1a1a1a]/85 whitespace-pre-wrap"
                     style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 400 }}>
                    "{wedding.story}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ════════════ RSVP ════════════ */}
      <section id="rsvp" className={`relative z-10 py-20 sm:py-28 px-6 sm:px-12 ${show('rsvp') ? '' : 'hidden'}`}>
        <div className="max-w-2xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.55em] text-[#1a1a1a]/55 mb-3">{t('pearl.chapter3')}</p>
            <h2 className="text-4xl sm:text-5xl"
                style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 500 }}>
              {t('rsvp.title')}
            </h2>
            <div className="hair-line w-32 mx-auto mt-5" />
          </motion.div>
          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="pearl-card p-6 sm:p-10"
          >
            <EpicRSVPForm wedding={wedding} primaryColor="#1a1a1a" accentColor="#4a4a4a" labelColor="text-[#1a1a1a]" />
          </motion.div>
        </div>
      </section>

      {/* ════════════ GUEST BOOK ════════════ */}
      <section id="guestbook" className={`relative z-10 py-20 sm:py-28 px-6 sm:px-12 bg-[#f0e8df] ${show('guestbook') ? '' : 'hidden'}`}>
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.55em] text-[#1a1a1a]/55 mb-3">{t('pearl.chapter4')}</p>
            <h2 className="text-4xl sm:text-5xl"
                style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 500 }}>
              {t('guestbook.title')}
            </h2>
            <div className="hair-line w-32 mx-auto mt-5" />
          </motion.div>
          <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <GuestBookForm surface="light" weddingId={wedding.id} primaryColor="#1a1a1a" accentColor="#4a4a4a" />
          </motion.div>

          {guestBookEntries.length > 0 && (
            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mt-10 grid sm:grid-cols-2 gap-4"
            >
              {guestBookEntries.slice(0, 6).map((entry: any, i: number) => (
                <div key={entry.id} className="pearl-card p-6 relative">
                  <span className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.35em] text-[#1a1a1a]/40">
                    №&nbsp;{String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-[#1a1a1a]/85 leading-relaxed"
                     style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
                    "{entry.message}"
                  </p>
                  <div className="hair-line w-12 my-3" />
                  <p className="text-[10px] uppercase tracking-[0.4em] text-[#1a1a1a]/65">— {entry.guestName}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="relative z-10 bg-[#1a1a1a] text-[#f8f5f0] py-16 px-6 sm:px-12">
        <div className="max-w-5xl mx-auto text-center">
          {show('orderCta') && <OrderInvitationCTA accent="#c9a96e" surface="dark" className="mb-12" />}
          <p className="text-2xl sm:text-3xl mb-4"
             style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 500 }}>
            {wedding.groom} <span className="opacity-50">&amp;</span> {wedding.bride}{twin && (<> <span className="opacity-40">·</span> {wedding.groom2} <span className="opacity-50">&amp;</span> {wedding.bride2}</>)}
          </p>
          <div className="hair-line w-32 mx-auto opacity-50 mb-5" style={{ background: 'linear-gradient(90deg, transparent, #f8f5f0 50%, transparent)' }} />
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#f8f5f0]/55">{t('footer.withLove')}</p>
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#f8f5f0]/40 mt-2">{t('footer.thanksForCelebrating')}</p>
          <p className="text-[10px] tracking-[0.4em] text-[#f8f5f0]/30 mt-8 uppercase">{t('pearl.footerLine')}</p>
        </div>
      </footer>

      <div className="sm:hidden h-16" aria-hidden />
    </div>
  );
}

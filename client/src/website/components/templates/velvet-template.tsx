// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { EpicRSVPForm } from '@/website/components/epic-rsvp-form';
import { GuestBookForm } from '@/website/components/guest-book-form';
import { EnhancedSocialShare } from '@/website/components/enhanced-social-share';
import { AzamatScrollMusic, type AzamatScrollMusicHandle } from '@/website/components/azamat-scroll-music';
import {
  MapPin, Heart, MessageSquare, Calendar, Users, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, GuestBookEntry } from '@shared/schema';

// ── Pre-computed particles (stable across renders) ──────────────────────────
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  size: 2 + (i * 7 % 5),
  left: (i * 17 + 3) % 100,
  duration: 12 + (i * 3 % 10),
  delay: (i * 2.3) % 10,
}));

interface VelvetTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

export function VelvetTemplate({ wedding, photos = [] }: VelvetTemplateProps) {
  const { t, i18n } = useTranslation();
  
  // Filter couple photos
  const couplePhotos = photos.filter((photo: any) => photo.photoType === 'couple');

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeNav, setActiveNav] = useState('home');
  const [showEnvelopeIntro, setShowEnvelopeIntro] = useState(false);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  const [envelopeFullyOpened, setEnvelopeFullyOpened] = useState(false);
  const musicRef = useRef<AzamatScrollMusicHandle | null>(null);

  // Set language based on wedding's default language
  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      i18n.changeLanguage(wedding.defaultLanguage);
    }
  }, [wedding?.defaultLanguage, i18n]);

  useEffect(() => {
    setShowEnvelopeIntro(true);
  }, []);

  useEffect(() => {
    if (wedding?.backgroundMusicUrl) {
      console.log('Velvet template: background music URL found', {
        backgroundMusicUrl: wedding.backgroundMusicUrl,
      });
      return;
    }

    console.warn('Velvet template: no background music URL configured');
  }, [wedding?.backgroundMusicUrl]);

  const handleOpenEnvelope = () => {
    if (envelopeOpening) return;
    console.log('Velvet template: envelope open started');

    if (!wedding?.backgroundMusicUrl) {
      console.warn('Velvet template: music not started because backgroundMusicUrl is empty');
    } else if (!musicRef.current) {
      console.warn('Velvet template: music not started because player ref is not mounted');
    }

    musicRef.current?.startPlayback();
    setEnvelopeOpening(true);
    setTimeout(() => {
      console.log('Velvet template: envelope fully opened');
      setEnvelopeFullyOpened(true);
    }, 650);
    setTimeout(() => {
      console.log('Velvet template: intro overlay hidden');
      setShowEnvelopeIntro(false);
    }, 1500);
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

  // Live countdown
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
      <div className="min-h-screen flex items-center justify-center bg-[#1a0f2e] text-white">
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
    { id: 'home',      label: t('nav.home'),      Icon: Heart },
    { id: 'details',   label: t('nav.details'),   Icon: Calendar },
    { id: 'rsvp',      label: t('nav.rsvp'),      Icon: Users },
    { id: 'guestbook', label: t('nav.guestbook'), Icon: MessageSquare },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as any },
    }),
  };

  return (
    <div className="min-h-screen bg-[#1a0f2e] text-white overflow-x-hidden">
      <style>{`
        @keyframes velvetBgShift {
          0%, 100% { transform: scale(1.04) translate3d(0,0,0); }
          50%       { transform: scale(1.08) translate3d(-1.5%,-1%,0); }
        }
        @keyframes ringDrift {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50%       { transform: translate3d(0,-16px,0) rotate(4deg); }
        }
        @keyframes ringDriftAlt {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50%       { transform: translate3d(0,14px,0) rotate(-3deg); }
        }
        @keyframes purpleSweep {
          0%   { transform: translateX(-130%); }
          100% { transform: translateX(230%); }
        }
        .velvet-bg {
          position: fixed; inset: 0; z-index: 0;
          pointer-events: none; overflow: hidden;
          background: radial-gradient(circle at 35% 35%, #3d2d5c 0%, #2a1f3d 45%, #1a0f2e 100%);
        }
        .velvet-bg::before {
          content: ''; position: absolute; inset: -10%;
          background:
            radial-gradient(circle at 70% 18%, rgba(168,100,200,0.2), transparent 33%),
            radial-gradient(circle at 28% 82%, rgba(138,60,180,0.16), transparent 38%),
            linear-gradient(160deg, rgba(255,255,255,0.02), rgba(0,0,0,0.15));
          animation: velvetBgShift 12s ease-in-out infinite;
        }
        .velvet-ring {
          position: absolute; border-radius: 9999px;
          border: 10px solid rgba(200,120,240,0.85);
          box-shadow: inset 0 0 16px rgba(220,150,255,0.3), 0 0 26px rgba(180,80,220,0.25);
        }
        .velvet-ring-left  { width:min(66vw,420px); height:min(66vw,420px); left:-9%;  bottom:9%;  animation:ringDriftAlt 8s ease-in-out infinite; }
        .velvet-ring-right { width:min(72vw,470px); height:min(72vw,470px); right:-12%; bottom:16%; animation:ringDrift 9s ease-in-out infinite; }
        .velvet-sheen {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(220,150,255,0.2) 49%, transparent 60%);
          opacity: 0.55; animation: purpleSweep 5.8s linear infinite;
        }
        @keyframes float-particle {
          0%   { transform: translateY(100vh) scale(0.5); opacity: 0; }
          8%   { opacity: 0.7; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-5vh) scale(1.2); opacity: 0; }
        }
        @keyframes purple-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes btn-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 18px rgba(200,120,240,0.25), inset 0 0 18px rgba(200,120,240,0.05); }
          50%       { box-shadow: 0 0 40px rgba(200,120,240,0.45), inset 0 0 30px rgba(200,120,240,0.10); }
        }
        @keyframes shimmer-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .purple-gradient-text {
          background: linear-gradient(120deg, #b878d8 0%, #d8b0ff 40%, #c890e8 60%, #8b4fb0 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: purple-shimmer 5s ease infinite;
        }
        .shimmer-cta {
          background: linear-gradient(90deg, #8b4fb0 0%, #d8b0ff 40%, #b878d8 60%, #8b4fb0 100%);
          background-size: 250% auto;
          animation: btn-shimmer 2.2s linear infinite;
          color: #1a0f2e;
        }
        .countdown-card { animation: glow-pulse 3s ease-in-out infinite; }
        .particle {
          position: fixed; border-radius: 50%;
          background: radial-gradient(circle, rgba(200,120,240,0.8) 0%, rgba(200,120,240,0.1) 100%);
          pointer-events: none; animation: float-particle linear infinite;
        }
        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .shimmer-line::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: shimmer-slide 2.5s ease 1.2s forwards;
        }
      `}</style>

      {/* ── Background music ── */}
      <AzamatScrollMusic ref={musicRef} musicUrl={wedding.backgroundMusicUrl ?? ''} />

      {/* ── Velvet background ── */}
      <div className="velvet-bg" aria-hidden>
        <div className="velvet-ring velvet-ring-left"><div className="velvet-sheen" /></div>
        <div className="velvet-ring velvet-ring-right"><div className="velvet-sheen" /></div>
      </div>

      {/* ── Envelope intro with hero video ── */}
      {showEnvelopeIntro && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f0a18]/95 px-4"
          onClick={() => {
            console.log('Velvet template: intro container clicked');
            handleOpenEnvelope();
          }}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(200,120,240,0.16),transparent_60%)]" />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              console.log('Velvet template: envelope button clicked');
              handleOpenEnvelope();
            }}
            className="relative w-[min(92vw,430px)] h-[280px] cursor-pointer focus:outline-none"
            aria-label={t('welcome.openInvitation')}
          >
            <div className="absolute inset-x-5 bottom-[-18px] h-9 rounded-full bg-black/40 blur-xl" />
            <div className="absolute inset-0 rounded-xl overflow-hidden border border-[#d8b0ff]/40 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              {/* Background video from envelope */}
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
                preload="metadata"
              >
                <source src="/hero-video-BkP1eoiB.mp4" type="video/mp4" />
              </video>
              
              {/* Overlay for envelope card effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a1f3d]/85 via-[#3d2d5c]/75 to-[#1a0f2e]/90" />
              
              <div
                className="absolute inset-x-8 top-10 rounded-md border border-[#c890e8]/45 bg-[#3d2d5c]/85 text-center transition-all duration-700 backdrop-blur-sm"
                style={{
                  padding: '20px 16px',
                  transform: envelopeFullyOpened ? 'translateY(-120px) scale(1.02)' : 'translateY(52px)',
                  opacity: envelopeFullyOpened ? 1 : 0.86,
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.32em] text-[#d8b0ff]/70 mb-3">
                  {t('welcome.weddingTitle', { bride: wedding.groom, groom: wedding.bride })}
                </p>
                <p
                  className="text-2xl sm:text-3xl leading-tight purple-gradient-text"
                  style={{ fontFamily: '"Playfair Display","Georgia",serif' }}
                >
                  {wedding.groom} &amp; {wedding.bride}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[65%]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#8b4fb0]/40 to-transparent" />
                <div className="absolute left-0 right-0 top-0 h-px bg-[#b878d8]/35" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-[#b878d8]/25" />
              </div>
              <div
                className="absolute top-0 left-0 right-0 h-[56%] origin-top transition-transform duration-700 ease-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: envelopeOpening ? 'perspective(1000px) rotateX(-172deg)' : 'perspective(1000px) rotateX(0deg)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    background: 'linear-gradient(180deg, #c890e8 0%, #a060c8 100%)',
                    borderTop: '1px solid rgba(216,176,255,0.45)',
                  }}
                />
                <div className="absolute left-1/2 top-[38%] -translate-x-1/2 w-8 h-8 rounded-full bg-[#b878d8] border border-[#d8b0ff]/60 shadow-inner flex items-center justify-center text-white/90 text-[11px]">
                  ♥
                </div>
              </div>
            </div>
            <p className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-center text-[11px] tracking-[0.24em] uppercase text-[#d8b0ff]/75 whitespace-nowrap">
              {envelopeOpening ? t('welcome.opening') : t('welcome.clickToOpen')}
            </p>
          </button>
        </div>
      )}

      {/* ── Floating particles ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{ width: p.size, height: p.size, left: `${p.left}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
          />
        ))}
      </div>

      {/* ════════════ DESKTOP TOP NAV ════════════ */}
      <nav className="hidden sm:flex fixed top-0 inset-x-0 z-50 bg-black/50 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-8 py-3.5">
          <span className="purple-gradient-text text-xl font-light select-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {wedding.groom} &amp; {wedding.bride}
          </span>
          <div className="flex gap-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                  activeNav === id
                    ? 'bg-[#b878d8]/15 text-[#d8b0ff] border border-[#b878d8]/30'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ════════════ MOBILE BOTTOM NAV ════════════ */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-black/75 backdrop-blur-2xl border-t border-white/[0.07]">
        <div className="flex justify-around py-2 px-1">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex flex-col items-center gap-0.5 min-w-[48px] py-1 transition-colors ${
                activeNav === id ? 'text-[#d8b0ff]' : 'text-white/30'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section id="home" className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover scale-105" preload="metadata">
          <source src="/hero-video-BkP1eoiB.mp4" type="video/mp4" />
        </video>
        {/* Fallback/overlay using couple photo */}
        {wedding.couplePhotoUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${wedding.couplePhotoUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-[#1a0f2e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(200,120,240,0.06),transparent)]" />

        <div className="relative z-10 flex flex-col items-center">
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.p
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="text-[10px] uppercase tracking-[0.5em] text-[#d8b0ff]/80 mb-8"
          >
            {t('modern.tagline')}
          </motion.p>

          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.h1
            initial={{ opacity: 0, y: 44, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.25, ease: [0.22, 1, 0.36, 1] as any }}
            className="purple-gradient-text text-[clamp(3rem,12vw,7.5rem)] font-extralight leading-none mb-2"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {wedding.groom}
          </motion.h1>

          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/50 text-lg font-light tracking-[0.3em] mb-2"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {t('wedding.and')}
          </motion.p>

          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.h1
            initial={{ opacity: 0, y: 44, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.55, ease: [0.22, 1, 0.36, 1] as any }}
            className="purple-gradient-text text-[clamp(3rem,12vw,7.5rem)] font-extralight leading-none mb-6"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {wedding.bride}
          </motion.h1>

          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.9 }}
            className="relative overflow-hidden h-px w-56 shimmer-line"
            style={{ background: 'linear-gradient(90deg, transparent, #b878d8, transparent)' }}
          />

          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.2 }}
            className="text-white/40 text-sm font-light tracking-[0.3em] mt-6 mb-10 uppercase"
          >
            {formattedDate}{wedding.venue ? ` · ${wedding.venue}` : ''}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 1.5 }}
          >
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 opacity-40 hover:opacity-70 transition-opacity group"
              aria-label="Scroll to top"
            >
              <ChevronUp className="w-6 h-6 animate-bounce" style={{ animationDirection: 'reverse' }} />
              <div className="w-px h-8 bg-gradient-to-b from-[#b878d8]/60 to-transparent" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ════════════ INVITATION / DEAR GUESTS ════════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#d8b0ff]/70 mb-6">{t('sections.dearGuests')}</p>
            <h2
              className="purple-gradient-text text-4xl font-extralight mb-10"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {t('wedding.dearGuests')}
            </h2>
          </motion.div>

          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 sm:p-10 text-left"
          >
            {wedding.dearGuestMessage ? (
              <p className="text-base sm:text-lg leading-relaxed text-white/70 whitespace-pre-wrap text-center">
                {wedding.dearGuestMessage}
              </p>
            ) : (
              <div className="text-base sm:text-lg leading-relaxed text-white/60 space-y-3 text-center">
                <p>{t('wedding.foundEachOther')}</p>
                <p>{t('wedding.filledWithWarmth')}</p>
                <p>{t('wedding.inviteToCelebrate')}</p>
              </div>
            )}
            <div className="mt-8 pt-8 border-t border-white/10 text-center space-y-1">
              <p className="text-sm text-white/30">{t('wedding.withRespect')}</p>
              <p
                className="purple-gradient-text text-2xl sm:text-3xl font-extralight"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {wedding.groom} {t('wedding.and')} {wedding.bride}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ COUNTDOWN ════════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(200,120,240,0.04),transparent)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.p
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-[10px] uppercase tracking-[0.5em] text-[#d8b0ff]/70 mb-4"
          >
            {t('countdown.timeRemaining')}
          </motion.p>
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-4 gap-3 md:gap-5"
          >
            {[
              { label: t('wedding.countdown.days'),    value: timeLeft.days },
              { label: t('wedding.countdown.hours'),   value: timeLeft.hours },
              { label: t('wedding.countdown.minutes'), value: timeLeft.minutes },
              { label: t('wedding.countdown.seconds'), value: timeLeft.seconds },
            ].map(({ label, value }, i) => (
              // @ts-ignore Framer Motion className typing issue
              <motion.div
                key={label}
                variants={fadeUp} custom={i + 2} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="countdown-card glass-card rounded-2xl p-4 md:p-7"
              >
                {/* @ts-ignore Framer Motion className typing issue */}
                <motion.span
                  key={value}
                  initial={{ opacity: 0.4, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="purple-gradient-text text-4xl md:text-6xl font-extralight tabular-nums block"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {String(value).padStart(2, '0')}
                </motion.span>
                <span className="block text-[9px] uppercase tracking-[0.3em] text-white/25 mt-2">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════ EVENT DETAILS ════════════ */}
      <section id="details" ref={null} className="relative z-10 py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#d8b0ff]/70 mb-3">{t('sections.weddingDetails')}</p>
            <h2 className="purple-gradient-text text-3xl font-extralight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {t('details.when')} &amp; {t('details.where')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* When */}
            {/* @ts-ignore Framer Motion className typing issue */}
            <motion.div
              variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[#b878d8]/8 border border-[#b878d8]/20 flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-5 h-5 text-[#d8b0ff]" />
              </div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-2">{t('details.when')}</p>
              <p className="text-white text-base font-light">{formattedDate}</p>
              <p className="text-white/35 text-sm mt-1">{t('details.ceremonyBegins')} {wedding.weddingTime || '16:00'}</p>
            </motion.div>

            {/* Where */}
            {/* @ts-ignore Framer Motion className typing issue */}
            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[#b878d8]/8 border border-[#b878d8]/20 flex items-center justify-center mx-auto mb-5">
                <MapPin className="w-5 h-5 text-[#d8b0ff]" />
              </div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-2">{t('details.where')}</p>
              <p className="text-white text-base font-light">{wedding.venue || t('details.venueTBD')}</p>
              {(wedding.mapPinUrl || wedding.venueAddress) && (
                <button
                  onClick={openMap}
                  className="text-[#d8b0ff] text-sm mt-2 hover:text-[#e8c8ff] transition-colors underline"
                >
                  {t('details.viewMap')}
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════ RSVP ════════════ */}
      <section id="rsvp" className="relative z-10 py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#d8b0ff]/70 mb-3">{t('sections.rsvp')}</p>
            <h2 className="purple-gradient-text text-3xl font-extralight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {t('rsvp.title')}
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <EpicRSVPForm weddingId={wedding.id} />
          </motion.div>
        </div>
      </section>

      {/* ════════════ GUEST BOOK ════════════ */}
      <section id="guestbook" className="relative z-10 py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#d8b0ff]/70 mb-3">{t('sections.guestbook')}</p>
            <h2 className="purple-gradient-text text-3xl font-extralight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {t('guestbook.title')}
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <GuestBookForm weddingId={wedding.id} />
          </motion.div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/[0.04] text-center">
        <p className="text-white/30 text-sm">{t('footer.withLove')}</p>
        <p className="text-[#d8b0ff]/60 text-xs mt-2">{t('footer.thanksForCelebrating')}</p>
      </footer>
    </div>
  );
}

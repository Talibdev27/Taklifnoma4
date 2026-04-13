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

interface AzamatTemplateProps {
  wedding: Wedding;
}

export function AzamatTemplate({ wedding }: AzamatTemplateProps) {
  const { t, i18n } = useTranslation();

  // Set language immediately (synchronous) to avoid flash
  if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
    i18n.changeLanguage(wedding.defaultLanguage);
  }

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeNav, setActiveNav] = useState('home');
  const [showEnvelopeIntro, setShowEnvelopeIntro] = useState(false);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  const [envelopeFullyOpened, setEnvelopeFullyOpened] = useState(false);
  const musicRef = useRef<AzamatScrollMusicHandle | null>(null);

  useEffect(() => {
    setShowEnvelopeIntro(true);
  }, []);

  useEffect(() => {
    if (wedding?.backgroundMusicUrl) {
      console.log('Azamat template: background music URL found', {
        backgroundMusicUrl: wedding.backgroundMusicUrl,
      });
      return;
    }

    console.warn('Azamat template: no background music URL configured');
  }, [wedding?.backgroundMusicUrl]);

  const handleOpenEnvelope = () => {
    if (envelopeOpening) return;
    console.log('Azamat template: envelope open started');

    if (!wedding?.backgroundMusicUrl) {
      console.warn('Azamat template: music not started because backgroundMusicUrl is empty');
    } else if (!musicRef.current) {
      console.warn('Azamat template: music not started because player ref is not mounted');
    }

    musicRef.current?.startPlayback();
    setEnvelopeOpening(true);
    setTimeout(() => {
      console.log('Azamat template: envelope fully opened');
      setEnvelopeFullyOpened(true);
    }, 650);
    setTimeout(() => {
      console.log('Azamat template: intro overlay hidden');
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
      <div className="min-h-screen flex items-center justify-center bg-[#070707] text-white">
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
    <div className="min-h-screen bg-[#070707] text-white overflow-x-hidden">
      <style>{`
        @keyframes luxuryBgShift {
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
        @keyframes goldSweep {
          0%   { transform: translateX(-130%); }
          100% { transform: translateX(230%); }
        }
        .lux-bg {
          position: fixed; inset: 0; z-index: 0;
          pointer-events: none; overflow: hidden;
          background: radial-gradient(circle at 35% 35%, #45463f 0%, #30322d 45%, #21231f 100%);
        }
        .lux-bg::before {
          content: ''; position: absolute; inset: -10%;
          background:
            radial-gradient(circle at 70% 18%, rgba(231,188,104,0.18), transparent 33%),
            radial-gradient(circle at 28% 82%, rgba(206,160,78,0.14), transparent 38%),
            linear-gradient(160deg, rgba(255,255,255,0.02), rgba(0,0,0,0.15));
          animation: luxuryBgShift 12s ease-in-out infinite;
        }
        .lux-ring {
          position: absolute; border-radius: 9999px;
          border: 10px solid rgba(227,182,95,0.92);
          box-shadow: inset 0 0 16px rgba(255,228,160,0.28), 0 0 26px rgba(207,160,77,0.3);
        }
        .lux-ring-left  { width:min(66vw,420px); height:min(66vw,420px); left:-9%;  bottom:9%;  animation:ringDriftAlt 8s ease-in-out infinite; }
        .lux-ring-right { width:min(72vw,470px); height:min(72vw,470px); right:-12%; bottom:16%; animation:ringDrift 9s ease-in-out infinite; }
        .lux-sheen {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,242,197,0.22) 49%, transparent 60%);
          opacity: 0.55; animation: goldSweep 5.8s linear infinite;
        }
        @keyframes float-particle {
          0%   { transform: translateY(100vh) scale(0.5); opacity: 0; }
          8%   { opacity: 0.7; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-5vh) scale(1.2); opacity: 0; }
        }
        @keyframes gold-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes btn-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 18px rgba(201,169,110,0.25), inset 0 0 18px rgba(201,169,110,0.05); }
          50%       { box-shadow: 0 0 40px rgba(201,169,110,0.45), inset 0 0 30px rgba(201,169,110,0.10); }
        }
        @keyframes shimmer-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .gold-gradient-text {
          background: linear-gradient(120deg, #c9a96e 0%, #f5e0a0 40%, #e8c97e 60%, #a07840 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: gold-shimmer 5s ease infinite;
        }
        .shimmer-cta {
          background: linear-gradient(90deg, #a07840 0%, #f5e0a0 40%, #c9a96e 60%, #a07840 100%);
          background-size: 250% auto;
          animation: btn-shimmer 2.2s linear infinite;
          color: #1a0e00;
        }
        .countdown-card { animation: glow-pulse 3s ease-in-out infinite; }
        .particle {
          position: fixed; border-radius: 50%;
          background: radial-gradient(circle, rgba(201,169,110,0.8) 0%, rgba(201,169,110,0.1) 100%);
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

      {/* ── Luxury background ── */}
      <div className="lux-bg" aria-hidden>
        <div className="lux-ring lux-ring-left"><div className="lux-sheen" /></div>
        <div className="lux-ring lux-ring-right"><div className="lux-sheen" /></div>
      </div>

      {/* ── Envelope intro ── */}
      {showEnvelopeIntro && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f0d0a]/95 px-4"
          onClick={() => {
            console.log('Azamat template: intro container clicked');
            handleOpenEnvelope();
          }}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(212,176,140,0.16),transparent_60%)]" />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              console.log('Azamat template: envelope button clicked');
              handleOpenEnvelope();
            }}
            className="relative w-[min(92vw,430px)] h-[280px] cursor-pointer focus:outline-none"
            aria-label="Taklifnomani ochish"
          >
            <div className="absolute inset-x-5 bottom-[-18px] h-9 rounded-full bg-black/40 blur-xl" />
            <div className="absolute inset-0 rounded-xl overflow-hidden border border-[#e8d8bf]/40 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f4ead8] via-[#ead7bb] to-[#d6bb8f]" />
              <div
                className="absolute inset-x-8 top-10 rounded-md border border-[#cfb080]/45 bg-white/85 text-center transition-all duration-700"
                style={{
                  padding: '20px 16px',
                  transform: envelopeFullyOpened ? 'translateY(-120px) scale(1.02)' : 'translateY(52px)',
                  opacity: envelopeFullyOpened ? 1 : 0.86,
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.32em] text-[#8b6045]/70 mb-3">
                  {t('welcome.weddingTitle', { bride: wedding.groom, groom: wedding.bride })}
                </p>
                <p
                  className="text-2xl sm:text-3xl leading-tight"
                  style={{ fontFamily: '"Playfair Display","Georgia",serif', color: '#6f4c33' }}
                >
                  {wedding.groom} &amp; {wedding.bride}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[65%]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#c6a06f]/55 to-transparent" />
                <div className="absolute left-0 right-0 top-0 h-px bg-[#a88455]/35" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-[#a88455]/25" />
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
                    background: 'linear-gradient(180deg, #ead7bb 0%, #d3b183 100%)',
                    borderTop: '1px solid rgba(168,132,85,0.45)',
                  }}
                />
                <div className="absolute left-1/2 top-[38%] -translate-x-1/2 w-8 h-8 rounded-full bg-[#b48a58] border border-[#e2c79e]/60 shadow-inner flex items-center justify-center text-white/90 text-[11px]">
                  ♥
                </div>
              </div>
            </div>
            <p className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-center text-[11px] tracking-[0.24em] uppercase text-[#d4b08c]/75 whitespace-nowrap">
              {envelopeOpening ? 'Ochilmoqda...' : 'Taklifnomani ochish uchun bosing'}
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
          <span className="gold-gradient-text text-xl font-light select-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {wedding.groom} &amp; {wedding.bride}
          </span>
          <div className="flex gap-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                  activeNav === id
                    ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30'
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
                activeNav === id ? 'text-[#c9a96e]' : 'text-white/30'
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
          <source src="/uploads/azamat_temp_bg.mp4" type="video/mp4" />
        </video>
        {/* Fallback/overlay using couple photo */}
        {wedding.couplePhotoUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${wedding.couplePhotoUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-[#070707]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(201,169,110,0.06),transparent)]" />

        <div className="relative z-10 flex flex-col items-center">
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.p
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/80 mb-8"
          >
            {t('modern.tagline')}
          </motion.p>

          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.h1
            initial={{ opacity: 0, y: 44, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.25, ease: [0.22, 1, 0.36, 1] as any }}
            className="gold-gradient-text text-[clamp(3rem,12vw,7.5rem)] font-extralight leading-none mb-2"
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
            className="gold-gradient-text text-[clamp(3rem,12vw,7.5rem)] font-extralight leading-none mb-6"
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
            style={{ background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)' }}
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
              <div className="w-px h-8 bg-gradient-to-b from-[#c9a96e]/60 to-transparent" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ════════════ INVITATION / DEAR GUESTS ════════════ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-6">{t('sections.dearGuests')}</p>
            <h2
              className="gold-gradient-text text-4xl font-extralight mb-10"
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
                className="gold-gradient-text text-2xl sm:text-3xl font-extralight"
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(201,169,110,0.04),transparent)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.p
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-4"
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
                  className="gold-gradient-text text-4xl md:text-6xl font-extralight tabular-nums block"
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
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-3">{t('sections.weddingDetails')}</p>
            <h2 className="gold-gradient-text text-3xl font-extralight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
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
              <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/8 border border-[#c9a96e]/20 flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-5 h-5 text-[#c9a96e]" />
              </div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-2">{t('details.when')}</p>
              <p className="text-white text-base font-light">{formattedDate}</p>
              <p className="text-white/35 text-sm mt-1">{t('details.ceremonyBegins')} {wedding.weddingTime || '16:00'}</p>
            </motion.div>

            {/* Where */}
            {/* @ts-ignore Framer Motion className typing issue */}
            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/8 border border-[#c9a96e]/20 flex items-center justify-center mx-auto mb-5">
                <MapPin className="w-5 h-5 text-[#c9a96e]" />
              </div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-2">{t('details.where')}</p>
              <p className="text-white text-base font-light">{wedding.venue || t('wedding.venue')}</p>
              {wedding.venueAddress && <p className="text-white/35 text-sm mt-1">{wedding.venueAddress}</p>}
              <button
                onClick={openMap}
                disabled={!wedding.mapPinUrl && !wedding.venueAddress}
                className="shimmer-cta mt-5 font-semibold px-6 py-2.5 rounded-full text-xs tracking-[0.2em] uppercase shadow-lg disabled:opacity-40"
              >
                {t('details.showOnMap')}
              </button>
            </motion.div>
          </div>

          {/* Dress code */}
          {wedding.dressCode && (
            // @ts-ignore Framer Motion className typing issue
            <motion.div
              variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="glass-card rounded-2xl p-6 flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-[#c9a96e]/10">
                👗
              </div>
              <div>
                <p className="font-semibold text-white/70 mb-1 text-sm">{t('dressCode')}</p>
                <p className="text-white/40 text-sm leading-relaxed">{wedding.dressCode}</p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ════════════ LOVE STORY ════════════ */}
      {wedding.story && (
        <section className="relative z-10 py-24 px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            {/* @ts-ignore Framer Motion className typing issue */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-[#c9a96e]/15 to-transparent blur-2xl" />
              {couplePhotos[0] ? (
                <img
                  src={couplePhotos[0].url}
                  alt="Juftlik"
                  className="relative w-full rounded-3xl object-cover aspect-[4/5] shadow-2xl"
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
                  alt="Juftlik"
                  className="relative w-full rounded-3xl object-cover aspect-[4/5] shadow-2xl"
                />
              )}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-[#c9a96e]/20" />
            </motion.div>

            {/* @ts-ignore Framer Motion typing issue */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-4">{t('wedding.ourStory')}</p>
              <h3
                className="text-4xl font-extralight leading-tight mb-6"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                <em className="gold-gradient-text not-italic">{wedding.bride}</em>
                {' '}&amp;{' '}
                <em className="gold-gradient-text not-italic">{wedding.groom}</em>
              </h3>
              <p className="text-white/50 leading-relaxed text-sm whitespace-pre-wrap">{wedding.story}</p>
              <div className="flex items-center gap-4 mt-8">
                <div className="h-px flex-1 bg-white/8" />
                <Heart className="w-4 h-4 text-[#c9a96e]/60" />
                <div className="h-px flex-1 bg-white/8" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ════════════ RSVP ════════════ */}
      <section id="rsvp" className="relative z-10 py-24 px-6 pb-28 sm:pb-24">
        <div className="max-w-md mx-auto">
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-3">{t('rsvp.title')}</p>
            <h2 className="gold-gradient-text text-3xl font-extralight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {t('rsvp.subtitle')}
            </h2>
          </motion.div>
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="glass-card rounded-3xl p-7"
          >
            <EpicRSVPForm wedding={wedding} primaryColor="#c9a96e" accentColor="#a07840" labelColor="text-[#e8d5b0]" />
          </motion.div>
        </div>
      </section>

      {/* ════════════ GUEST BOOK ════════════ */}
      <section id="guestbook" className="relative z-10 py-20 px-6 pb-28 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(201,169,110,0.03),transparent)]" />
        <div className="max-w-4xl mx-auto relative z-10">
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-4">{t('sections.guestBook')}</p>
            <h2 className="gold-gradient-text text-4xl font-extralight mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {t('guestBook.subtitle')}
            </h2>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a96e]/40" />
              <MessageSquare className="w-4 h-4 text-[#c9a96e]/60" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a96e]/40" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* @ts-ignore Framer Motion className typing issue */}
            <motion.div
              variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 border border-[#c9a96e]/10 hover:border-[#c9a96e]/20 transition-all duration-500"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a96e]/20 to-[#c9a96e]/5 flex items-center justify-center ring-1 ring-[#c9a96e]/20">
                  <MessageSquare className="w-5 h-5 text-[#c9a96e]" />
                </div>
                <h3 className="text-sm font-semibold text-[#c9a96e] uppercase tracking-[0.25em]">
                  {t('guestBook.leaveMessage')}
                </h3>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-[#c9a96e]/20 via-[#c9a96e]/40 to-[#c9a96e]/20 mb-6" />
              <GuestBookForm weddingId={wedding.id} primaryColor="#c9a96e" accentColor="#a07840" />
            </motion.div>

            {/* @ts-ignore Framer Motion className typing issue */}
            <motion.div
              variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 border border-[#c9a96e]/10 hover:border-[#c9a96e]/20 transition-all duration-500"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a96e]/20 to-[#c9a96e]/5 flex items-center justify-center ring-1 ring-[#c9a96e]/20">
                  <Heart className="w-5 h-5 text-[#c9a96e]" />
                </div>
                <h3 className="text-sm font-semibold text-[#c9a96e] uppercase tracking-[0.25em]">
                  {t('guestBook.messages')}
                </h3>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-[#c9a96e]/20 via-[#c9a96e]/40 to-[#c9a96e]/20 mb-6" />
              {(guestBookEntries as any[]).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c9a96e]/10 to-transparent flex items-center justify-center mx-auto mb-4 ring-1 ring-[#c9a96e]/20">
                    <MessageSquare className="w-7 h-7 text-[#c9a96e]/40" />
                  </div>
                  <p className="text-white/40 text-sm">{t('guestBook.noMessages')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#c9a96e]/30 scrollbar-track-transparent">
                  {(guestBookEntries as any[]).map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group p-5 rounded-2xl bg-gradient-to-br from-[#c9a96e]/[0.08] to-[#c9a96e]/[0.02] border border-[#c9a96e]/10 hover:border-[#c9a96e]/25 hover:shadow-lg hover:shadow-[#c9a96e]/5 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]/60" />
                        <p className="font-semibold text-white/90 text-sm">{entry.guestName}</p>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed pl-3.5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        "{entry.message}"
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Social Share Section */}
          {/* @ts-ignore Framer Motion className typing issue */}
          <motion.div
            variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 sm:p-10 border border-[#c9a96e]/10 hover:border-[#c9a96e]/20 transition-all duration-500"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#c9a96e]/20 to-[#c9a96e]/5 mb-5 ring-1 ring-[#c9a96e]/20">
                <Sparkles className="w-6 h-6 text-[#c9a96e]" />
              </div>
              <h3 className="gold-gradient-text text-2xl sm:text-3xl font-extralight mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {t('social.shareOurWedding')}
              </h3>
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a96e]/40" />
                <Heart className="w-3.5 h-3.5 text-[#c9a96e]/50" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a96e]/40" />
              </div>
              <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
                {t('social.shareDescription')}
              </p>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent mb-8" />
            <EnhancedSocialShare
              weddingUrl={wedding.uniqueUrl}
              coupleName={`${wedding.groom} & ${wedding.bride}`}
              primaryColor="#c9a96e"
              accentColor="#a07840"
            />
          </motion.div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/[0.04] text-center pb-24 sm:pb-20">
        {/* @ts-ignore Framer Motion className typing issue */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="gold-gradient-text text-3xl font-extralight mb-2"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          {wedding.groom} &amp; {wedding.bride}
        </motion.p>
        {wedding.weddingDate && (
          <p className="text-white/25 text-xs tracking-widest uppercase mb-10">
            {formattedDate}{wedding.venue ? ` · ${wedding.venue}` : ''}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 opacity-20 mt-6">
          <div className="h-px w-6 bg-white/60" />
          <p className="text-xs">{t('wedding.createdWith')} ♥ LoveStory</p>
          <div className="h-px w-6 bg-white/60" />
        </div>
      </footer>
    </div>
  );
}

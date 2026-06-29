// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { uz, ru, enUS, kk } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { EpicRSVPForm } from '@/website/components/epic-rsvp-form';
import { OrderInvitationCTA } from '@/website/components/order-invitation-cta';
import { GuestBookForm } from '@/website/components/guest-book-form';
import { AzamatScrollMusic, type AzamatScrollMusicHandle } from '@/website/components/azamat-scroll-music';
import { MapPin, Lock, ArrowRight, Heart } from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, GuestBookEntry } from '@shared/schema';

/* ─────────────────────────────────────────────────────────────────────────
 * IMPERIAL (Noir) — a dark, cinematic, gold-accented wedding invitation.
 *
 * UI/UX direction: a near-black canvas with gold filigree, an "unlock" gate,
 * full-bleed desaturated couple-photo parallax sections that build a sentence
 * as you scroll, ivory countdown + schedule cards, glass venue/location panels
 * with dual maps, and an RSVP. Cormorant Garamond + Inter + Great Vibes + Amiri.
 *
 * Background imagery is sourced from Pexels (verified hot-linkable) and is only
 * used as a fallback — uploaded couple / memory photos take priority.
 * ──────────────────────────────────────────────────────────────────────── */

const px = (id: number, w = 1600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

/** Curated cinematic fallbacks (verified to resolve on images.pexels.com). */
const IMG = {
  hero: px(11215191),       // couple, back view
  introParallax: px(36723085),  // B&W couple walking a garden path
  closingParallax: px(17967331), // moody couple walking away
  venue: [px(8251571), px(16120244)], // banquet hall + ballroom
};

const GOLD = '#c9a96e';
const INK = '#0b0b0b';

interface ImperialTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

/* Parse "18:00" / "6:00 PM" → minutes since midnight (or null). */
function parseTimeToMinutes(value?: string | null): number | null {
  if (!value) return null;
  const ampm = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10) % 12;
    if (/PM/i.test(ampm[3])) h += 12;
    return h * 60 + parseInt(ampm[2], 10);
  }
  const hm = value.match(/(\d{1,2}):(\d{2})/);
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
  return null;
}
const fmtMinutes = (mins: number) => {
  const v = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};

/* ── Thin line-art schedule icons (original, single-stroke) ───────────────── */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as any;
const IconGlass = (p: any) => (<svg viewBox="0 0 24 24" {...p}><path {...stroke} d="M4 4h16l-8 9-8-9zM12 13v6M8 21h8" /></svg>);
const IconRings = (p: any) => (<svg viewBox="0 0 24 24" {...p}><circle {...stroke} cx="9" cy="14" r="5" /><circle {...stroke} cx="15" cy="14" r="5" /><path {...stroke} d="M9 9l1.5-3M15 9l-1.5-3" /></svg>);
const IconCloche = (p: any) => (<svg viewBox="0 0 24 24" {...p}><path {...stroke} d="M3 17h18M4.5 17a7.5 7.5 0 0115 0M12 6.5V4.5M3 21h18" /></svg>);
const IconSpark = (p: any) => (<svg viewBox="0 0 24 24" {...p}><path {...stroke} d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" /><circle {...stroke} cx="12" cy="12" r="1.6" /></svg>);

/* Slide-to-unlock control — drag the lock knob left→right to open the invitation. */
function SlideToUnlock({ label, onUnlock }: { label: string; onUnlock: () => void }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const xRef = useRef(0);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const KNOB = 56, PAD = 5;

  const maxX = () => Math.max(0, (trackRef.current?.offsetWidth || 300) - KNOB - PAD * 2);
  const setFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = Math.max(0, Math.min(clientX - rect.left - PAD - KNOB / 2, maxX()));
    xRef.current = nx; setX(nx);
  };
  const onDown = (e: React.PointerEvent) => {
    if (done) return;
    setDragging(true);
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch {}
  };
  const onMove = (e: React.PointerEvent) => { if (dragging) setFromClientX(e.clientX); };
  const finish = () => {
    if (!dragging) return;
    setDragging(false);
    if (xRef.current >= maxX() * 0.8) { xRef.current = maxX(); setX(maxX()); setDone(true); onUnlock(); }
    else { xRef.current = 0; setX(0); }
  };
  const pct = maxX() ? x / maxX() : 0;

  return (
    <div
      ref={trackRef}
      className="imp-pulse relative w-[min(86vw,320px)] h-16 rounded-full select-none touch-none"
      style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(201,169,110,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', touchAction: 'none' }}
      onPointerMove={onMove}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      {/* gold fill trailing the knob */}
      <div className="absolute inset-y-[5px] left-[5px] rounded-full pointer-events-none"
        style={{ width: x + KNOB, background: 'linear-gradient(100deg,#c9a96e,#e0c172)', opacity: 0.92, transition: dragging ? 'none' : 'width .35s ease' }} />
      {/* hint label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="imp-label text-[11px] font-semibold flex items-center gap-2"
          style={{ color: '#e8d9b5', opacity: Math.max(0, 1 - pct * 1.4) }}>
          {label} <ArrowRight className="w-4 h-4" />
        </span>
      </div>
      {/* draggable lock knob */}
      <div
        onPointerDown={onDown}
        className="absolute top-[5px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ left: 5 + x, width: KNOB, height: 'calc(100% - 10px)', background: 'linear-gradient(135deg,#fff3cf,#c9a96e)', boxShadow: '0 4px 14px rgba(0,0,0,0.45)', transition: dragging ? 'none' : 'left .35s ease', touchAction: 'none' }}
      >
        <Lock className="w-5 h-5 text-[#241a08]" />
      </div>
    </div>
  );
}

export function ImperialTemplate({ wedding, photos = [] }: ImperialTemplateProps) {
  const { t, i18n } = useTranslation();

  const couplePhotos = photos.filter((p: any) => p.photoType === 'couple');
  const memoryPhotos = photos.filter((p: any) => p.photoType === 'memory');
  const heroDesignated = photos.filter((p: any) => p.photoType === 'hero' || p.isHero);

  // Cinematic parallax BACKGROUNDS always come from the curated set — never the
  // admin's uploads. (Admin photos are shown in the venue/location image slots.)
  const heroPhoto = IMG.hero;
  const introPhoto = IMG.introParallax;
  const closingPhoto = IMG.closingParallax;
  // Venue/location image slots show the photos the admin uploaded (memory →
  // hero → couple → couple-photo URL), falling back to curated venue shots.
  const venuePhotos = (() => {
    const uploaded = [
      ...memoryPhotos.map((p: any) => p.url),
      ...heroDesignated.map((p: any) => p.url),
      ...couplePhotos.map((p: any) => p.url),
      ...(wedding.couplePhotoUrl ? [wedding.couplePhotoUrl] : []),
    ].filter(Boolean);
    const list = Array.from(new Set(uploaded)).slice(0, 2);
    while (list.length < 2) list.push(IMG.venue[list.length] || IMG.venue[0]);
    return list;
  })();

  // Per-section visibility (admin toggles). Absent / true = shown; only `false` hides.
  const sectionFlags = (wedding.sections || {}) as Record<string, boolean>;
  const show = (key: string) => sectionFlags[key] !== false;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [locked, setLocked] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const musicRef = useRef<AzamatScrollMusicHandle | null>(null);

  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      i18n.changeLanguage(wedding.defaultLanguage);
    }
  }, []); // run once; the in-page switcher may override afterwards

  const handleUnlock = () => {
    if (unlocking) return;
    musicRef.current?.startPlayback();
    setUnlocking(true);
    setTimeout(() => setLocked(false), 900);
  };

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'uz': return uz;
      case 'ru': return ru;
      case 'kk': return kk;
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
    const tick = () => setTimeLeft(calculateWeddingCountdown(
      wedding.weddingDate, wedding.weddingTime || '18:00', wedding.timezone || 'Asia/Tashkent'));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [wedding?.weddingDate, wedding?.weddingTime, wedding?.timezone]);

  if (!wedding) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b] text-[#c9a96e]"><p>{t('common.loading')}</p></div>;
  }

  const dateObj = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
  const dotsDate = dateObj ? format(dateObj, 'dd • MM • yyyy') : '';
  const bigDate = dateObj ? format(dateObj, 'dd  MM  yyyy') : '';
  const monthLabel = dateObj ? format(dateObj, 'MMMM yyyy', { locale: getDateLocale() }) : '';
  const longDate = dateObj ? format(dateObj, 'd MMMM yyyy', { locale: getDateLocale() }) : t('details.dateTBD');

  /* Month calendar grid (Mon-first) with the wedding day highlighted. */
  const calendar = (() => {
    if (!dateObj) return null;
    const y = dateObj.getFullYear(), m = dateObj.getMonth(), day = dateObj.getDate();
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7; // Mon=0
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    return { cells, day };
  })();

  const baseMin = parseTimeToMinutes(wedding.weddingTime) ?? 18 * 60;
  const schedule = [
    { Icon: IconGlass, key: 'arrival', off: 0 },
    { Icon: IconRings, key: 'ceremony', off: 60 },
    { Icon: IconCloche, key: 'banquet', off: 120 },
    { Icon: IconSpark, key: 'end', off: 300 },
  ].map(s => ({ ...s, time: fmtMinutes(baseMin + s.off), label: t(`imperial.schedule.${s.key}`) }));

  const coords = wedding.venueCoordinates as { lat: number; lng: number } | null;
  const isUrl = (s?: string | null) => !!s && /^https?:\/\//i.test(s.trim());
  // A Google "Embed a map" URL (https://www.google.com/maps/embed?pb=… or any
  // …output=embed) is the ONLY link that can be iframed. A normal share link
  // (maps.app.goo.gl/…) can OPEN a map but cannot be embedded.
  const isGoogleEmbed = (s?: string | null) => isUrl(s) && /(\/maps\/embed\?|[?&]output=embed)/i.test(s!.trim());
  const mapPin = (wedding.mapPinUrl || '').trim();
  // Build a search query only from coords or NON-URL address/venue text.
  const addressText = !isUrl(wedding.venueAddress) ? (wedding.venueAddress || '') : '';
  const venueText = !isUrl(wedding.venue) ? (wedding.venue || '') : '';
  const cleanName = venueText.replace(/[«»""„"]/g, '').trim();
  const placeQuery = coords ? `${coords.lat},${coords.lng}` : (addressText || cleanName || '');
  // The iframe src: a pasted Google embed URL wins; otherwise build a Google
  // embed from coordinates / address text. (A share link is not embeddable.)
  const embedSrc = isGoogleEmbed(mapPin)
    ? mapPin
    : (placeQuery ? `https://www.google.com/maps?q=${encodeURIComponent(placeQuery)}&z=16&output=embed` : '');
  // "Open in Google Maps": use the exact share/pin link if provided, else search.
  const openMap = () => {
    let url = '';
    if (isUrl(mapPin) && !isGoogleEmbed(mapPin)) url = mapPin;
    else if (placeQuery) url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`;
    else if (embedSrc) url = embedSrc;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const hasMap = !!(embedSrc || mapPin || placeQuery);

  /* Language switcher — the wedding's languages, always offering uz/ru/en. */
  const langCodes = Array.from(new Set([...(wedding.availableLanguages || []), 'uz', 'ru', 'en']))
    .filter(c => ['uz', 'ru', 'en', 'kk', 'kaa'].includes(c));
  const langLabel: Record<string, string> = { uz: 'UZ', ru: 'RU', en: 'EN', kk: 'KK', kaa: 'QR' };
  const switchLang = (c: string) => { i18n.changeLanguage(c); try { localStorage.setItem('language', c); } catch {} };

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as any } }),
  };

  const Diamond = ({ className = '' }: { className?: string }) => (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-12 sm:w-16" style={{ background: `linear-gradient(90deg,transparent,${GOLD})` }} />
      <Heart className="w-3.5 h-3.5" style={{ color: GOLD }} strokeWidth={1.2} />
      <span className="h-px w-12 sm:w-16" style={{ background: `linear-gradient(90deg,${GOLD},transparent)` }} />
    </div>
  );

  const serif = '"Cormorant Garamond", serif';
  // Great Vibes is Latin-only; fall back to Cormorant italic so Cyrillic
  // (ru/kk/kaa) script text stays elegant and legible per-glyph.
  const script = '"Great Vibes", "Cormorant Garamond", cursive';
  const sans = '"Inter", sans-serif';

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: INK, fontFamily: sans }}>
      <style>{`
        .imp-gold { color: ${GOLD}; }
        .imp-serif { font-family: ${serif}; }
        .imp-script { font-family: ${script}; }
        .imp-label { font-family: ${sans}; text-transform: uppercase; letter-spacing: 0.32em; }
        .imp-gold-text {
          background: linear-gradient(100deg,#a9842f,#e7cd86 30%,#fff3cf 46%,#c9a96e 60%,#9c7b34 80%,#e0c172 100%);
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
        }
        /* Readable gold for LIGHT backgrounds — no near-white stop that washes text out. */
        .imp-gold-text-d {
          background: linear-gradient(100deg,#7d5f22,#b8923f 50%,#7d5f22);
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
        }
        /* parallax cinematic photo */
        .imp-parallax { position:relative; background-size:cover; background-position:center; background-attachment:fixed; }
        @media (hover:none){ .imp-parallax{ background-attachment:scroll; } }
        .imp-mono { filter: grayscale(1) brightness(0.62) contrast(1.05); }
        /* light card sections */
        .imp-light { background:#f6f6f4; color:#1a1a1a; }
        .imp-card-light { background:#fffefb; border:1px solid rgba(201,169,110,0.25); box-shadow:0 30px 70px rgba(0,0,0,0.10); }
        /* glass dark panel */
        .imp-glass { background:rgba(18,18,20,0.55); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border:1px solid rgba(201,169,110,0.28); }
        .imp-pill { border:1px solid rgba(201,169,110,0.6); color:${GOLD}; transition:all .3s; }
        .imp-pill:hover { background:rgba(201,169,110,0.12); }
        .imp-pill-solid { background:linear-gradient(100deg,${GOLD},#e0c172 50%,#b08f4d); color:#241a08; border:1px solid rgba(255,243,207,0.5); }
        @keyframes imp-shimmer { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .imp-float { animation: imp-shimmer 3.4s ease-in-out infinite; }
        @keyframes imp-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,169,110,0.45)} 50%{box-shadow:0 0 0 12px rgba(201,169,110,0)} }
        .imp-pulse { animation: imp-pulse 2.6s ease-in-out infinite; }
        .imp-cal td { text-align:center; padding:6px 0; font-family:${serif}; color:#3a3a3a; font-size:15px; }
        .imp-cal th { color:#9b9b9b; font-weight:400; font-size:11px; font-family:${sans}; padding-bottom:6px; }
        .imp-cal .on { color:${GOLD}; border:1px solid ${GOLD}; border-radius:999px; display:inline-flex; width:30px; height:30px; align-items:center; justify-content:center; }
        @media (prefers-reduced-motion: reduce){ .imp-parallax{background-attachment:scroll} .imp-float,.imp-pulse{animation:none} }
      `}</style>

      <AzamatScrollMusic ref={musicRef} musicUrl={wedding.backgroundMusicUrl ?? ''}
        theme={{ primary: GOLD, accent: '#1a1a1a', iconColor: '#1a1a1a', glow: 'rgba(201,169,110,0.5)' }} />

      {/* ── Language switcher (top-left) ─────────────────────────────── */}
      <div className="fixed top-4 left-4 z-[80] flex gap-1.5">
        {langCodes.map(c => (
          <button key={c} onClick={() => switchLang(c)}
            className="w-9 h-9 rounded-full text-[11px] tracking-wider transition-all backdrop-blur-md"
            style={i18n.language === c
              ? { background: GOLD, color: '#1a1a1a', fontWeight: 600 }
              : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
            {langLabel[c] || c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ════════════ UNLOCK GATE (hero) ════════════ */}
      {locked && (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center text-center px-6 transition-opacity duration-900 ${unlocking ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 imp-mono" style={{ backgroundImage: `url(${heroPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(11,11,11,0.35), rgba(11,11,11,0.82) 75%)' }} />
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1 }}
            className="relative z-10 max-w-xl flex flex-col items-center">
            <Diamond className="mb-6" />
            <p className="imp-label text-[10px] sm:text-[11px] text-white/70 mb-6">{t('imperial.gate.received')}</p>
            <h1 className="imp-serif text-5xl sm:text-7xl font-medium leading-tight mb-7">
              {wedding.groom} <span className="imp-gold">&amp;</span> {wedding.bride}
            </h1>
            <p className="imp-gold imp-label text-sm sm:text-base mb-6">{dotsDate}</p>
            {show('blessing') && (
              <>
                <p dir="rtl" lang="ar" className="imp-gold-text text-2xl sm:text-3xl mb-3" style={{ fontFamily: '"Amiri", serif' }}>
                  {t('imperial.blessing.arabic')}
                </p>
                <p className="text-white/80 italic text-base sm:text-lg" style={{ fontFamily: serif }}>“{t('imperial.blessing.translation')}”</p>
                <p className="text-white/45 text-xs mt-1 mb-7" style={{ fontFamily: serif }}>{t('imperial.blessing.source')}</p>
              </>
            )}
            <Heart className="w-5 h-5 mb-8 imp-gold imp-float" strokeWidth={1.2} />
            <SlideToUnlock label={t('imperial.gate.unlock')} onUnlock={handleUnlock} />
          </motion.div>
        </div>
      )}

      {/* ════════════ INTRO PARALLAX — building sentence ════════════ */}
      <section className="imp-parallax min-h-screen flex items-center justify-center text-center px-6"
        style={{ backgroundImage: `url(${introPhoto})` }}>
        <div className="absolute inset-0 imp-mono" style={{ backgroundImage: `url(${introPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 max-w-2xl">
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="imp-label text-[11px] sm:text-xs text-white/70 mb-6">{t('imperial.intro.dearOnes')}</motion.p>
          <motion.p variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="imp-script text-7xl sm:text-8xl imp-gold-text leading-none mb-6">{t('imperial.intro.we')}</motion.p>
          <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="imp-label text-xs sm:text-sm text-white/85 leading-loose">{t('imperial.intro.delighted')}</motion.p>
          <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-8 flex justify-center">
            <Heart className="w-5 h-5 imp-gold" strokeWidth={1.2} />
          </motion.div>
        </div>
      </section>

      {/* ════════════ DATE + COUNTDOWN + CALENDAR (light) ════════════ */}
      {show('countdown') && (
      <section id="details" className="imp-light py-20 sm:py-28 px-6">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="imp-card-light max-w-2xl mx-auto rounded-[22px] px-7 sm:px-12 py-12 text-center">
          <p className="imp-label text-[11px] text-[#9b8347] mb-5">{t('imperial.date.label')}</p>
          <p className="imp-serif imp-gold-text-d text-5xl sm:text-7xl font-medium tracking-wide">{bigDate}</p>
          <Diamond className="my-6" />
          <p className="imp-label text-[10px] sm:text-[11px] text-[#6f6f6f] mb-6">{t('countdown.timeRemaining')}</p>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
            {[['days', timeLeft.days], ['hours', timeLeft.hours], ['minutes', timeLeft.minutes], ['seconds', timeLeft.seconds]].map(([k, v]) => (
              <div key={k as string} className="rounded-2xl py-4 sm:py-5" style={{ background: '#fff', boxShadow: '0 12px 28px rgba(0,0,0,0.07)' }}>
                <div className="imp-serif text-3xl sm:text-4xl text-[#1a1a1a] tabular-nums">{String(v).padStart(2, '0')}</div>
                <div className="imp-label text-[8px] sm:text-[9px] text-[#9b9b9b] mt-1.5">{t(`wedding.countdown.${k}`)}</div>
              </div>
            ))}
          </div>

          {calendar && (
            <div className="mt-12">
              <div className="imp-gold text-lg mb-3">✦</div>
              <p className="imp-label text-xs text-[#3a3a3a] mb-5">{monthLabel}</p>
              <table className="imp-cal w-full max-w-sm mx-auto">
                <thead><tr>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <th key={d}>{d}</th>)}</tr></thead>
                <tbody>
                  {Array.from({ length: calendar.cells.length / 7 }).map((_, r) => (
                    <tr key={r}>{calendar.cells.slice(r * 7, r * 7 + 7).map((d, i) => (
                      <td key={i}>{d ? (d === calendar.day ? <span className="on">{d}</span> : d) : ''}</td>
                    ))}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="imp-label text-[11px] text-[#9b8347] mt-10 pt-6 border-t border-[#e6ddc8]">
            {t('imperial.date.startAt')} {wedding.weddingTime || '18:00'}
          </p>
        </motion.div>
      </section>
      )}

      {/* ════════════ SCHEDULE (light) ════════════ */}
      {show('schedule') && (
      <section className="imp-light px-6 pb-24">
        <div className="max-w-md mx-auto">
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="imp-label text-xs text-[#6f6f6f] text-center mb-12">{t('imperial.schedule.title')}</motion.p>
          {schedule.map(({ Icon, key, time, label }, i) => (
            <motion.div key={key} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="flex items-center gap-5 mb-9">
              <Icon className="w-9 h-9 shrink-0 text-[#2a2a2a]" />
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GOLD }} />
              <div>
                <p className="imp-serif text-2xl text-[#1a1a1a] leading-none">{time}</p>
                <p className="imp-label text-[10px] text-[#8a8a8a] mt-1.5">{label}</p>
              </div>
            </motion.div>
          ))}
          <div className="flex justify-center mt-6"><Heart className="w-5 h-5" style={{ color: GOLD }} strokeWidth={1.2} /></div>
        </div>
      </section>
      )}

      {/* ════════════ VENUE (glass over couple photo) ════════════ */}
      {show('venue') && (
      <section className="imp-parallax py-24 px-6" style={{ backgroundImage: `url(${closingPhoto})` }}>
        <div className="absolute inset-0 imp-mono" style={{ backgroundImage: `url(${closingPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-black/70" />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="imp-glass relative z-10 max-w-3xl mx-auto rounded-[24px] px-6 sm:px-12 py-12 text-center">
          <div className="imp-gold mb-2 tracking-[0.5em] text-sm">✦ &nbsp;❖&nbsp; ✦</div>
          <h2 className="imp-serif text-3xl sm:text-4xl mb-3 tracking-[0.15em]">{t('imperial.venue.heading')}</h2>
          <Diamond className="mb-8" />
          <div className="grid sm:grid-cols-2 gap-4 mb-9">
            {venuePhotos.map((u, i) => (
              <div key={i} className="rounded-2xl overflow-hidden aspect-[4/3] border border-[#c9a96e]/30">
                <img src={u} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            ))}
          </div>
          <p className="imp-script imp-gold-text text-4xl sm:text-5xl mb-5">{wedding.venue || t('details.venueTBD')}</p>
          {addressText && (
            <p className="flex items-center justify-center gap-2 text-white/80 text-sm mb-8">
              <MapPin className="w-4 h-4 imp-gold" /> {addressText}
            </p>
          )}
          {hasMap && (
            <button onClick={openMap} className="imp-pill inline-flex items-center gap-2 px-7 py-3.5 rounded-full imp-label text-xs">
              <MapPin className="w-4 h-4" /> {t('imperial.venue.openMap')} <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <div className="mt-10 pt-8 border-t border-white/15">
            <p className="text-white/75 italic text-base" style={{ fontFamily: serif }}>{t('imperial.venue.seeYou')}</p>
            <div className="flex justify-center mt-3"><Heart className="w-4 h-4 imp-gold" strokeWidth={1.2} /></div>
          </div>
        </motion.div>
      </section>
      )}

      {/* ════════════ LOCATION (glass + map + routes) ════════════ */}
      {show('location') && (
      <section className="imp-parallax py-24 px-6" style={{ backgroundImage: `url(${introPhoto})` }}>
        <div className="absolute inset-0 imp-mono" style={{ backgroundImage: `url(${introPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-black/75" />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="imp-glass relative z-10 max-w-4xl mx-auto rounded-[24px] px-6 sm:px-10 py-12">
          <div className="text-center mb-10">
            <span className="imp-gold imp-label text-[11px] px-5 py-1.5 rounded-full border border-[#c9a96e]/50 tracking-[0.5em]">✦ ❖ ✦</span>
            <h2 className="imp-serif text-4xl sm:text-5xl mt-6 tracking-[0.18em]">{t('imperial.location.label')}</h2>
            <p className="imp-label text-[10px] text-white/55 mt-3">{t('imperial.location.subtitle')}</p>
            <Diamond className="mt-5" />
          </div>
          <div className="grid lg:grid-cols-2 gap-5 items-stretch">
            <div className="rounded-2xl overflow-hidden border border-[#c9a96e]/30 min-h-[300px] bg-black/40 flex flex-col">
              {embedSrc ? (
                <iframe title="map" src={embedSrc} className="w-full flex-1 min-h-[250px]"
                  style={{ border: 0, filter: 'grayscale(0.12) contrast(1.04)' }}
                  loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
              ) : (
                <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center gap-3 text-white/50">
                  <MapPin className="w-8 h-8 imp-gold" />
                  <span className="text-sm">{wedding.venue || t('details.venueTBD')}</span>
                </div>
              )}
              {hasMap && (
                <button onClick={openMap} className="flex items-center justify-center gap-2 py-3.5 imp-gold imp-label text-[11px] hover:bg-white/5 transition-colors">
                  <MapPin className="w-4 h-4" /> {t('imperial.location.googleMaps')}
                </button>
              )}
            </div>
            <div className="imp-glass rounded-2xl p-8 flex flex-col text-center">
              <p className="imp-script imp-gold-text text-3xl sm:text-4xl mb-6 leading-tight">{wedding.venue || t('details.venueTBD')}</p>
              {addressText && (
                <p className="flex items-start justify-center gap-2 text-white/80 text-sm mb-7 pb-7 border-b border-white/15">
                  <MapPin className="w-4 h-4 imp-gold mt-0.5 shrink-0" /> {addressText}
                </p>
              )}
              {hasMap && (
                <button onClick={openMap} className="imp-pill inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full imp-label text-xs">
                  <MapPin className="w-4 h-4" /> {t('imperial.location.googleRoute')}
                </button>
              )}
              <p className="imp-gold text-sm mt-7 tracking-[0.3em]">♡ {t('imperial.location.welcome')} ♡</p>
            </div>
          </div>
        </motion.div>
      </section>
      )}

      {/* ════════════ RSVP (light) ════════════ */}
      {show('rsvp') && (
      <section id="rsvp" className="imp-light py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <span className="imp-label text-[11px] text-[#9b8347]">✦ {t('imperial.rsvp.label')} ✦</span>
            <h2 className="imp-serif imp-gold-text-d text-4xl sm:text-5xl mt-4">{t('imperial.rsvp.title')}</h2>
            <p className="imp-label text-[10px] text-[#8a8a8a] mt-3">{t('imperial.rsvp.beWithUs')}</p>
            <div className="flex justify-center mt-5"><Heart className="w-5 h-5" style={{ color: GOLD }} strokeWidth={1.2} /></div>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="imp-card-light rounded-[22px] p-6 sm:p-10">
            <EpicRSVPForm wedding={wedding} primaryColor="#b08f4d" accentColor={GOLD} labelColor="text-[#3a3a3a]" />
          </motion.div>
        </div>
      </section>
      )}

      {/* ════════════ GUEST BOOK (light, optional) ════════════ */}
      {show('guestBook') && (
      <section id="guestbook" className="imp-light px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
            <span className="imp-label text-[11px] text-[#9b8347]">✦ {t('sections.guestbook')} ✦</span>
            <h2 className="imp-serif imp-gold-text-d text-3xl sm:text-4xl mt-3">{t('guestbook.title')}</h2>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="imp-card-light rounded-[22px] p-6 sm:p-9">
            <GuestBookForm weddingId={wedding.id} primaryColor="#b08f4d" accentColor={GOLD} surface="light" />
          </motion.div>
          {guestBookEntries.length > 0 && (
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {guestBookEntries.slice(0, 6).map((e: any) => (
                <div key={e.id} className="imp-card-light rounded-2xl p-6">
                  <p className="text-[#3a3a3a] italic" style={{ fontFamily: serif }}>“{e.message}”</p>
                  <p className="imp-label text-[11px] text-[#9b8347] mt-3">— {e.guestName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* ════════════ CLOSING PARALLAX ════════════ */}
      <section className="imp-parallax min-h-screen flex items-center justify-center text-center px-6"
        style={{ backgroundImage: `url(${closingPhoto})` }}>
        <div className="absolute inset-0 imp-mono" style={{ backgroundImage: `url(${closingPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 max-w-2xl">
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="imp-label text-[11px] sm:text-xs text-white/70 mb-6">{t('imperial.closing.presence')}</motion.p>
          <motion.p variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="imp-script text-6xl sm:text-7xl imp-gold-text leading-tight mb-6">{t('imperial.closing.gift')}</motion.p>
          <motion.p variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="imp-label text-xs sm:text-sm text-white/85">{t('imperial.closing.forUs')}</motion.p>
          <motion.div variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-7 flex justify-center">
            <Heart className="w-5 h-5 imp-gold imp-float" strokeWidth={1.2} />
          </motion.div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="py-14 px-6 text-center" style={{ background: INK }}>
        <OrderInvitationCTA accent={GOLD} surface="dark" className="mb-12" />
        <Diamond className="mb-5" />
        <p className="imp-script imp-gold-text text-4xl mb-2">{wedding.groom} &amp; {wedding.bride}</p>
        <p className="imp-label text-[10px] text-white/45">{t('footer.withLove')}</p>
        <p className="text-white/40 text-[10px] mt-5 tracking-[0.3em] uppercase">— Imperial —</p>
      </footer>
    </div>
  );
}

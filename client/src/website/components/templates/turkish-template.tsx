// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { tr as trLocale } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { EpicRSVPForm } from '@/website/components/epic-rsvp-form';
import { OrderInvitationCTA } from '@/website/components/order-invitation-cta';
import { GuestBookForm } from '@/website/components/guest-book-form';
import { AzamatScrollMusic, type AzamatScrollMusicHandle } from '@/website/components/azamat-scroll-music';
import { MapPin, ArrowRight } from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, GuestBookEntry } from '@shared/schema';

/* ─────────────────────────────────────────────────────────────────────────
 * KINA GECESİ (Turkish henna night) — "Ahıska Türkleri" ceremonial invitation.
 *
 * UI/UX direction: an Ottoman/Anatolian aesthetic — a deep burgundy "carpet"
 * canvas framed by hand-drawn kilim borders and antique-gold filigree, with an
 * ivory mihrab niche holding the celebrant's name in flowing script. Hanging
 * lanterns, a def (tambourine) and saz (bağlama), candles, facing birds and
 * Ottoman tulips decorate the page. Every visual is inline SVG/CSS — no remote
 * imagery — so it renders anywhere and stays crisp. All copy is Turkish; the
 * shared RSVP / guest-book forms are switched to the `tr` locale on mount.
 * ──────────────────────────────────────────────────────────────────────── */

const WINE = '#6d1a2e';
const WINE_D = '#521021';
const GOLD = '#b0894a';
const GOLD_L = '#e0c07f';
const IVORY = '#f6efdb';

interface TurkishTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

/* Turkish genitive suffix so "Farida" → "Farida'nın", "Selin" → "Selin'in". */
function turkishPossessive(name?: string | null): string {
  if (!name) return '';
  const n = name.trim();
  if (!n) return '';
  const vowels = 'aeıioöuüAEIİOÖUÜ';
  let last = '';
  for (let i = n.length - 1; i >= 0; i--) {
    if (vowels.includes(n[i])) { last = n[i].toLowerCase(); break; }
  }
  // İ (dotted capital) lowercases to 'i' in Turkish; I → 'ı'.
  if (last === 'i̇') last = 'i';
  const harmony = 'ae'.includes(last) ? { a: 'ı', e: 'i' }[last]
    : 'ıi'.includes(last) ? last
    : 'ou'.includes(last) ? 'u'
    : 'öü'.includes(last) ? 'ü'
    : 'ı';
  const endsVowel = vowels.includes(n[n.length - 1]);
  const suffix = (endsVowel ? 'n' : '') + harmony + 'n';
  return `${n}'${suffix}`;
}

/* Parse "18:00" / "6:00 PM" → "HH:MM" (24h) for the "Saat …" line. */
function normalizeTime(value?: string | null): string {
  if (!value) return '';
  const ampm = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10) % 12;
    if (/PM/i.test(ampm[3])) h += 12;
    return `${String(h).padStart(2, '0')}:${ampm[2]}`;
  }
  const hm = value.match(/(\d{1,2}):(\d{2})/);
  if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}`;
  return value;
}

/* ── Decorative inline SVGs (single-stroke antique gold) ───────────────────── */
const g = (extra = {}) => ({ fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', ...extra });

/** A hooked-diamond kilim band as a repeating background (data URI). */
const kilimTile = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='34' viewBox='0 0 48 34'>
    <g fill='none' stroke='${GOLD_L}' stroke-width='1.2'>
      <path d='M24 3 L45 17 L24 31 L3 17 Z'/>
      <path d='M0 17 H3 M45 17 H48'/>
      <path d='M24 10 L31 17 L24 24 L17 17 Z' fill='${GOLD}' fill-opacity='0.55' stroke='none'/>
      <path d='M11 8 L7 4 M37 8 L41 4 M11 26 L7 30 M37 26 L41 30'/>
    </g>
  </svg>`.replace(/\n\s*/g, ''),
);
const carpetTile = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
    <g fill='none' stroke='${GOLD_L}' stroke-width='1'>
      <path d='M32 8 L36 28 L56 32 L36 36 L32 56 L28 36 L8 32 L28 28 Z'/>
      <circle cx='32' cy='32' r='3'/>
    </g>
  </svg>`.replace(/\n\s*/g, ''),
);

/** Hanging Ottoman lantern with chain. */
const Lantern = ({ className = '', style }) => (
  <svg viewBox="0 0 40 96" className={className} style={{ color: GOLD_L, ...style }} aria-hidden>
    <g {...g()}>
      <path d="M20 0 v14 M14 6 l6 4 6-4" />
      <path d="M12 18 h16 M14 18 c-2 4 -2 6 0 8 h12 c2-2 2-4 0-8" />
      <path d="M11 26 h18 l-2 30 c0 6 -5 10 -7 10 s-7-4-7-10 z" />
      <path d="M20 26 v50 M13 40 h14 M13 52 h14" />
      <path d="M15 76 q5 8 10 0" />
      <circle cx="20" cy="84" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="20" cy="52" r="4" />
    </g>
  </svg>
);

/** Def / tambourine. */
const Def = ({ className = '', style }) => (
  <svg viewBox="0 0 80 80" className={className} style={{ color: GOLD_L, ...style }} aria-hidden>
    <g {...g()}>
      <circle cx="40" cy="40" r="30" />
      <circle cx="40" cy="40" r="24" />
      <circle cx="40" cy="40" r="7" strokeWidth="1.1" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <circle key={i} cx={40 + 27 * Math.cos(a)} cy={40 + 27 * Math.sin(a)} r="2.4" />;
      })}
      <path d="M40 22 q6 18 0 36 M22 40 q18 -6 36 0" strokeWidth="1" opacity="0.8" />
    </g>
  </svg>
);

/** Saz / bağlama (long-necked lute). */
const Saz = ({ className = '', style }) => (
  <svg viewBox="0 0 44 120" className={className} style={{ color: GOLD_L, ...style }} aria-hidden>
    <g {...g()}>
      <ellipse cx="22" cy="92" rx="18" ry="24" />
      <circle cx="22" cy="92" r="6" />
      <path d="M18 68 h8 v-52 h-8 z" />
      <path d="M16 16 q6 -10 12 0" />
      <path d="M15 20 h-4 M15 26 h-4 M29 20 h4 M29 26 h4" />
      <path d="M20 68 v-52 M22 68 v-52 M24 68 v-52" strokeWidth="0.8" opacity="0.8" />
    </g>
  </svg>
);

/** Ottoman tulip (lale). */
const Tulip = ({ className = '', style }) => (
  <svg viewBox="0 0 40 60" className={className} style={{ color: GOLD_L, ...style }} aria-hidden>
    <g {...g()}>
      <path d="M20 58 v-24" />
      <path d="M20 34 c-10 -2 -13 -12 -10 -22 c4 6 6 6 10 6 c4 0 6 0 10 -6 c3 10 0 20 -10 22 z" />
      <path d="M20 12 v16 M12 18 q8 6 16 0" strokeWidth="0.9" opacity="0.85" />
      <path d="M20 46 q-9 -2 -12 4 M20 50 q9 -2 12 4" />
    </g>
  </svg>
);

/** Two facing birds (Ottoman miniature style). */
const Birds = ({ className = '', style }) => (
  <svg viewBox="0 0 120 44" className={className} style={{ color: GOLD_L, ...style }} aria-hidden>
    <g {...g()}>
      {[0, 1].map((s) => (
        <g key={s} transform={s ? 'translate(120,0) scale(-1,1)' : ''}>
          <path d="M18 30 q10 -14 26 -12 q-6 4 -8 10 q10 -4 18 -1 q-8 4 -12 10 q-9 4 -18 1 q-8 -3 -6 -8 z" />
          <circle cx="41" cy="19" r="1.3" fill="currentColor" stroke="none" />
          <path d="M44 18 l5 -2" />
          <path d="M24 33 q4 6 10 6" />
        </g>
      ))}
      <path d="M56 14 q4 -6 8 0" />
    </g>
  </svg>
);

/** Candle with flame. */
const Candle = ({ className = '', style }) => (
  <svg viewBox="0 0 24 60" className={className} style={{ color: GOLD_L, ...style }} aria-hidden>
    <g {...g()}>
      <path d="M12 12 c3 3 3 7 0 9 c-3 -2 -3 -6 0 -9 z" fill={GOLD} fillOpacity="0.5" stroke="none" />
      <path d="M12 12 c3 3 3 7 0 9 c-3 -2 -3 -6 0 -9 z" />
      <path d="M12 22 v3" />
      <rect x="7" y="25" width="10" height="30" rx="2" />
      <path d="M7 31 h10" opacity="0.7" />
    </g>
  </svg>
);

/** Small rosette / star divider ornament. */
const Rosette = ({ className = '', style }) => (
  <svg viewBox="0 0 120 24" className={className} style={{ color: GOLD, ...style }} aria-hidden>
    <g {...g({ strokeWidth: 1.1 })}>
      <path d="M0 12 H44 M76 12 H120" />
      <path d="M60 3 l3 6 6.5 -1 -4 5 4 5 -6.5 -1 -3 6 -3 -6 -6.5 1 4 -5 -4 -5 6.5 1 z" />
      <circle cx="50" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="70" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </g>
  </svg>
);

/** Gold tassel (püskül). */
const Tassel = ({ className = '', style }) => (
  <svg viewBox="0 0 24 60" className={className} style={{ color: GOLD_L, ...style }} aria-hidden>
    <g {...g()}>
      <path d="M12 0 v10" />
      <circle cx="12" cy="13" r="4" />
      <path d="M6 18 q6 4 12 0 l-1 6 h-10 z" />
      <path d="M8 24 v28 M10 24 v30 M12 24 v31 M14 24 v30 M16 24 v28" strokeWidth="1" />
    </g>
  </svg>
);

/** Alem — a finial that crowns the mihrab niche. */
const Alem = ({ className = '', style }) => (
  <svg viewBox="0 0 28 56" className={className} style={{ color: GOLD, ...style }} aria-hidden>
    <g {...g()}>
      <path d="M14 0 c4 8 4 12 0 16 c-4 -4 -4 -8 0 -16 z" fill={GOLD} fillOpacity="0.35" stroke="none" />
      <path d="M14 0 c4 8 4 12 0 16 c-4 -4 -4 -8 0 -16 z" />
      <path d="M14 16 v10" />
      <path d="M6 26 q8 6 16 0" />
      <path d="M14 26 v30" />
    </g>
  </svg>
);

export function TurkishTemplate({ wedding, photos = [] }: TurkishTemplateProps) {
  const { i18n } = useTranslation();

  const memoryPhotos = photos.filter((p: any) => p.photoType === 'memory');

  // Per-section visibility (admin toggles). Absent / true = shown; only `false` hides.
  const sectionFlags = (wedding?.sections || {}) as Record<string, boolean>;
  const show = (key: string) => sectionFlags[key] !== false;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const musicRef = useRef<AzamatScrollMusicHandle | null>(null);

  // This template is Turkish-only — force the `tr` locale so the shared RSVP /
  // guest-book forms speak Turkish too. (Missing keys fall back to uz.)
  useEffect(() => {
    if (i18n.language !== 'tr') i18n.changeLanguage('tr');
  }, []); // once

  const { data: guestBookEntries = [] } = useQuery<GuestBookEntry[]>({
    queryKey: ['/api/guest-book/wedding', wedding?.id],
    queryFn: () => fetch(`/api/guest-book/wedding/${wedding?.id}`).then((r) => r.json()),
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
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: WINE, color: GOLD_L }}>
        <p>Yükleniyor…</p>
      </div>
    );
  }

  const name = (wedding.bride || wedding.groom || '').trim();
  const possessive = turkishPossessive(name);
  const timeText = normalizeTime(wedding.weddingTime) || '11:00';

  const dateObj = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
  const dottedDate = dateObj ? format(dateObj, 'dd.MM.yyyy') : '';
  const monthLabel = dateObj ? format(dateObj, 'LLLL yyyy', { locale: trLocale }) : '';

  /* Month calendar grid (Mon-first) with the ceremony day highlighted. */
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

  /* ── Map (venue / location) — same embed logic used across templates ──── */
  const isUrl = (s?: string | null) => !!s && /^https?:\/\//i.test(s.trim());
  const isGoogleEmbed = (s?: string | null) => isUrl(s) && /(\/maps\/embed\?|[?&]output=embed)/i.test(s!.trim());
  const mapPin = (wedding.mapPinUrl || '').trim();
  const addressText = !isUrl(wedding.venueAddress) ? (wedding.venueAddress || '') : '';
  const venueText = !isUrl(wedding.venue) ? (wedding.venue || '') : '';
  const coords = wedding.venueCoordinates as { lat: number; lng: number } | null;
  const cleanName = venueText.replace(/[«»""„"]/g, '').trim();
  const placeQuery = coords ? `${coords.lat},${coords.lng}` : (addressText || cleanName || '');
  const embedSrc = isGoogleEmbed(mapPin)
    ? mapPin
    : (placeQuery ? `https://www.google.com/maps?q=${encodeURIComponent(placeQuery)}&z=16&output=embed` : '');
  const openMap = () => {
    let url = '';
    if (isUrl(mapPin) && !isGoogleEmbed(mapPin)) url = mapPin;
    else if (placeQuery) url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`;
    else if (embedSrc) url = embedSrc;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const hasMap = !!(embedSrc || mapPin || placeQuery);

  const fadeUp = {
    hidden: { opacity: 0, y: 26 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.85, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as any } }),
  };

  const KilimBand = ({ className = '', style }) => (
    <div
      className={className}
      style={{
        height: 26,
        backgroundImage: `url("data:image/svg+xml,${kilimTile}")`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center',
        backgroundSize: 'auto 100%',
      }}
    />
  );

  return (
    <div className="tk min-h-screen overflow-x-hidden" style={{ background: WINE_D }}>
      <style>{`
        .tk { font-family: 'Cormorant Garamond','Playfair Display',serif; color: ${IVORY}; }
        .tk-script { font-family: 'Dancing Script','Ephesis','Great Vibes',cursive; }
        .tk-display { font-family: 'Playfair Display','Cormorant Garamond',serif; }
        .tk-label { font-family: 'Marcellus','Cormorant Garamond',serif; text-transform: uppercase; letter-spacing: 0.34em; }
        .tk-gold { color: ${GOLD}; }
        .tk-gold-l { color: ${GOLD_L}; }
        .tk-gold-text {
          background: linear-gradient(100deg,#8a6a34,#e0c07f 34%,#fff3d4 50%,#d8b978 66%,#8a6a34);
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
        }
        .tk-carpet { position: relative; background: ${WINE}; }
        .tk-carpet::before {
          content:''; position:absolute; inset:0; pointer-events:none; opacity:0.16;
          background-image:url("data:image/svg+xml,${carpetTile}");
          background-size:64px 64px;
        }
        .tk-vignette::after {
          content:''; position:absolute; inset:0; pointer-events:none;
          background: radial-gradient(circle at 50% 30%, transparent 55%, rgba(0,0,0,0.45));
        }
        .tk-ivory { background: ${IVORY}; color: #3a241a; }
        .tk-frame { border: 1px solid rgba(224,192,127,0.55); box-shadow: inset 0 0 0 4px rgba(122,31,43,0.06), inset 0 0 0 5px rgba(224,192,127,0.35); }
        .tk-niche {
          background: linear-gradient(180deg,#fbf6e6,#f1e6c6);
          border: 2px solid ${GOLD};
          box-shadow: 0 30px 70px rgba(0,0,0,0.4), inset 0 0 0 6px rgba(176,137,74,0.18);
          border-radius: 48% 48% 14px 14px / 34% 34% 14px 14px;
        }
        .tk-tile { background:#fff9ec; border:1px solid rgba(176,137,74,0.4); box-shadow:0 12px 26px rgba(82,16,33,0.10); }
        .tk-btn { border:1px solid ${GOLD}; color:${GOLD}; transition:all .3s; }
        .tk-btn:hover { background:${GOLD}; color:${IVORY}; }
        .tk-cal td { text-align:center; padding:6px 0; font-family:'Cormorant Garamond',serif; color:#5a3b28; font-size:15px; }
        .tk-cal th { color:#a98; font-weight:400; font-size:11px; font-family:'Marcellus',serif; letter-spacing:.08em; padding-bottom:6px; }
        .tk-cal .on { color:${WINE}; border:1.5px solid ${GOLD}; background:rgba(176,137,74,0.14); border-radius:999px; display:inline-flex; width:30px; height:30px; align-items:center; justify-content:center; font-weight:600; }
        @keyframes tk-sway { 0%,100%{ transform: rotate(-3deg) } 50%{ transform: rotate(3deg) } }
        .tk-sway { transform-origin: top center; animation: tk-sway 5s ease-in-out infinite; }
        @keyframes tk-glow { 0%,100%{ opacity:.75 } 50%{ opacity:1 } }
        .tk-flicker { animation: tk-glow 2.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .tk-sway,.tk-flicker{ animation:none } }
      `}</style>

      <AzamatScrollMusic
        ref={musicRef}
        musicUrl={wedding.backgroundMusicUrl ?? ''}
        theme={{ primary: GOLD, accent: WINE, iconColor: IVORY, glow: 'rgba(176,137,74,0.5)' }}
      />

      {/* ════════════ HERO — mihrab niche on the carpet ════════════ */}
      <header className="tk-carpet tk-vignette relative overflow-hidden px-5 pt-0 pb-16">
        <KilimBand />

        {/* hanging lanterns */}
        <Lantern className="tk-sway absolute left-3 sm:left-10 top-8 w-9 sm:w-12 h-auto opacity-90" />
        <Lantern className="tk-sway absolute right-3 sm:right-10 top-8 w-9 sm:w-12 h-auto opacity-90" style={{ animationDelay: '1.2s' }} />

        <div className="relative z-10 max-w-xl mx-auto text-center pt-14 sm:pt-16">
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
            className="tk-label tk-gold-l text-[11px] sm:text-xs mb-4">Ahıska Türkleri</motion.p>
          <Birds className="w-24 sm:w-28 h-auto mx-auto mb-3 opacity-90" />

          {/* the ivory niche */}
          <div className="relative inline-block w-full max-w-md mx-auto">
            <Alem className="absolute left-1/2 -translate-x-1/2 -top-9 w-6 h-auto z-20" />
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible"
              className="tk-niche relative px-6 sm:px-10 pt-16 pb-12 mt-4">
              <p className="tk-label text-[10px] tracking-[0.4em] text-[#9a6a2f] mb-4">Kına Gecesi</p>
              <h1 className="tk-script text-6xl sm:text-7xl leading-[0.95] mb-1" style={{ color: WINE }}>{possessive || name}</h1>
              <p className="tk-display text-xl sm:text-2xl tracking-[0.3em] text-[#7a1f2b] mt-3">KINA GECESİ</p>

              <div className="my-6"><Rosette className="w-40 h-auto mx-auto" /></div>

              <p className="tk-display text-3xl sm:text-4xl tracking-[0.12em]" style={{ color: '#3a241a' }}>{dottedDate}</p>
              <p className="tk-label text-[11px] text-[#9a6a2f] mt-3">Saat {timeText}</p>

              {/* instruments + candles at the niche base */}
              <div className="flex items-end justify-center gap-4 mt-8">
                <Saz className="w-8 sm:w-9 h-auto tk-gold" style={{ color: GOLD }} />
                <Candle className="tk-flicker w-4 h-auto" style={{ color: GOLD }} />
                <Def className="w-14 sm:w-16 h-auto" style={{ color: GOLD }} />
                <Candle className="tk-flicker w-4 h-auto" style={{ color: GOLD, animationDelay: '.8s' }} />
                <Tulip className="w-7 sm:w-8 h-auto" style={{ color: GOLD }} />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ════════════ DAVET / DEĞERLİ MİSAFİRLERİMİZ ════════════ */}
      {show('dearGuests') && (
        <section className="tk-carpet relative px-5 py-16 sm:py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="tk-ivory tk-frame relative max-w-2xl mx-auto rounded-[18px] px-7 sm:px-12 py-12 text-center">
            <Tulip className="w-8 h-auto mx-auto mb-4" style={{ color: GOLD }} />
            <p className="tk-label text-[11px] text-[#9a6a2f] mb-6">Değerli Misafirlerimiz</p>
            {wedding.dearGuestMessage ? (
              <p className="text-lg sm:text-xl leading-relaxed whitespace-pre-wrap" style={{ color: '#4a3222' }}>
                {wedding.dearGuestMessage}
              </p>
            ) : (
              <div className="text-lg sm:text-xl leading-relaxed space-y-4" style={{ color: '#4a3222' }}>
                <p>Karadeniz’in havasını ve neşesini taşıyan bu kına gecemizde, sevincimize ortak olmanızı ve kınamızı yakarken sizleri de aramızda görmeyi yürekten dileriz.</p>
                <p>Teşrifleriniz bizleri onurlandıracaktır.</p>
              </div>
            )}
            {wedding.dressCode && (
              <p className="mt-6 text-base italic" style={{ color: '#7a1f2b' }}>{wedding.dressCode}</p>
            )}
            <div className="mt-8"><Rosette className="w-40 h-auto mx-auto" /></div>
            <p className="tk-script text-4xl sm:text-5xl mt-4" style={{ color: WINE }}>{name}</p>
          </motion.div>
        </section>
      )}

      {/* ════════════ GERİ SAYIM ════════════ */}
      {show('countdown') && (
        <section className="tk-carpet tk-vignette relative px-5 py-16 sm:py-20">
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <p className="tk-label tk-gold-l text-[11px] mb-2">Kınamıza Kalan</p>
            <Rosette className="w-40 h-auto mx-auto mb-8" style={{ color: GOLD_L }} />
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md mx-auto">
              {[['Gün', timeLeft.days], ['Saat', timeLeft.hours], ['Dakika', timeLeft.minutes], ['Saniye', timeLeft.seconds]].map(([label, v]) => (
                <div key={label as string} className="tk-ivory tk-frame rounded-2xl py-4 sm:py-5">
                  <div className="tk-display text-3xl sm:text-4xl tabular-nums" style={{ color: WINE }}>{String(v).padStart(2, '0')}</div>
                  <div className="tk-label text-[8px] sm:text-[9px] text-[#9a6a2f] mt-1.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════ TARİH & SAAT (+ takvim) ════════════ */}
      {show('details') && (
        <section className="tk-carpet relative px-5 py-16 sm:py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="tk-ivory tk-frame max-w-xl mx-auto rounded-[18px] px-7 sm:px-12 py-12 text-center">
            <p className="tk-label text-[11px] text-[#9a6a2f] mb-5">Tarih &amp; Saat</p>
            <p className="tk-display text-4xl sm:text-5xl tracking-[0.1em]" style={{ color: WINE }}>{dottedDate}</p>
            <p className="tk-label text-xs text-[#9a6a2f] mt-3">Saat {timeText}</p>

            {calendar && (
              <div className="mt-10">
                <p className="tk-label text-xs text-[#5a3b28] mb-4">{monthLabel}</p>
                <table className="tk-cal w-full max-w-sm mx-auto">
                  <thead><tr>{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => <th key={d}>{d}</th>)}</tr></thead>
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
            <div className="mt-8"><Rosette className="w-40 h-auto mx-auto" /></div>
          </motion.div>
        </section>
      )}

      {/* ════════════ FOTOĞRAFLAR ════════════ */}
      {memoryPhotos.length > 0 && show('gallery') && (
        <section className="tk-carpet tk-vignette relative px-5 py-16 sm:py-20">
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="tk-label tk-gold-l text-[11px] mb-2">Anılarımız</p>
              <h2 className="tk-script tk-gold-text text-5xl sm:text-6xl">Fotoğraflar</h2>
              <Rosette className="w-40 h-auto mx-auto mt-4" style={{ color: GOLD_L }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {memoryPhotos.map((photo: any, i: number) => (
                <motion.div key={photo.id ?? i} variants={fadeUp} custom={i % 3} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="aspect-square overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(224,192,127,0.4)' }}>
                  <img src={photo.url} alt={photo.caption || ''} loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════ KONUM ════════════ */}
      {show('location') && (
        <section className="tk-carpet relative px-5 py-16 sm:py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="tk-ivory tk-frame max-w-3xl mx-auto rounded-[18px] px-6 sm:px-10 py-12">
            <div className="text-center mb-8">
              <p className="tk-label text-[11px] text-[#9a6a2f] mb-2">Konum</p>
              <h2 className="tk-script text-4xl sm:text-5xl" style={{ color: WINE }}>{wedding.venue || 'Mekan'}</h2>
              {addressText && (
                <p className="flex items-start justify-center gap-2 text-sm sm:text-base mt-4" style={{ color: '#5a3b28' }}>
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOLD }} /> {addressText}
                </p>
              )}
              <Rosette className="w-40 h-auto mx-auto mt-5" />
            </div>
            {embedSrc && (
              <div className="rounded-2xl overflow-hidden border mb-6" style={{ borderColor: 'rgba(176,137,74,0.4)' }}>
                <iframe title="Harita" src={embedSrc} className="w-full min-h-[280px]"
                  style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
            {hasMap && (
              <div className="text-center">
                <button onClick={openMap} className="tk-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-full tk-label text-xs">
                  <MapPin className="w-4 h-4" /> Haritada Aç <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* ════════════ KATILIM (LCV) ════════════ */}
      {show('rsvp') && (
        <section id="rsvp" className="tk-carpet tk-vignette relative px-5 py-16 sm:py-20">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="tk-label tk-gold-l text-[11px] mb-2">L.C.V.</p>
              <h2 className="tk-script tk-gold-text text-5xl sm:text-6xl">Katılım</h2>
              <p className="text-sm mt-3" style={{ color: 'rgba(246,239,219,0.75)' }}>Lütfen katılımınızı bize bildiriniz</p>
            </div>
            <div className="tk-ivory tk-frame rounded-[18px] p-6 sm:p-10">
              <EpicRSVPForm wedding={wedding} primaryColor={WINE} accentColor={GOLD} labelColor="text-[#4a3222]" />
            </div>
          </div>
        </section>
      )}

      {/* ════════════ DİLEK DEFTERİ ════════════ */}
      {show('guestbook') && (
        <section id="guestbook" className="tk-carpet relative px-5 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <p className="tk-label tk-gold-l text-[11px] mb-2">Dilekleriniz</p>
              <h2 className="tk-script tk-gold-text text-4xl sm:text-5xl">Dilek Defteri</h2>
            </div>
            <div className="tk-ivory tk-frame rounded-[18px] p-6 sm:p-9">
              <GuestBookForm weddingId={wedding.id} primaryColor={WINE} accentColor={GOLD} surface="light" />
            </div>
            {guestBookEntries.length > 0 && (
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {guestBookEntries.slice(0, 6).map((e: any) => (
                  <div key={e.id} className="tk-ivory tk-frame rounded-2xl p-6">
                    <p className="italic" style={{ color: '#4a3222' }}>“{e.message}”</p>
                    <p className="tk-label text-[11px] text-[#9a6a2f] mt-3">— {e.guestName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════════════ FOOTER ════════════ */}
      <footer className="tk-carpet tk-vignette relative px-5 pt-16 pb-10 text-center">
        <div className="relative z-10 max-w-md mx-auto">
          {show('orderCta') && <OrderInvitationCTA accent={GOLD} surface="dark" className="mb-12" />}
          <div className="flex items-end justify-center gap-5 mb-6">
            <Tassel className="w-5 h-auto opacity-90" />
            <Def className="w-16 h-auto" style={{ color: GOLD_L }} />
            <Tassel className="w-5 h-auto opacity-90" />
          </div>
          <p className="tk-script tk-gold-text text-5xl mb-2">{name}</p>
          <p className="tk-label text-[11px] tk-gold-l">Sizleri aramızda görmekten mutluluk duyarız</p>
          <Rosette className="w-40 h-auto mx-auto mt-6" style={{ color: GOLD_L }} />
          <p className="tk-label text-[10px] mt-4" style={{ color: 'rgba(246,239,219,0.45)' }}>— Kına Gecesi —</p>
        </div>
        <KilimBand className="mt-10" />
      </footer>
    </div>
  );
}

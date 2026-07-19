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
import { ToyonaCard } from '@/website/components/toyona-card';
import { MapPin, ArrowRight } from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, GuestBookEntry } from '@shared/schema';
import { isTwinWedding } from '@/lib/couples';

/* ─────────────────────────────────────────────────────────────────────────
 * ROYAL ("Royal 💌") — a navy-and-gold, wax-seal envelope invitation.
 *
 * UI/UX direction (after the InviteStudio "royal envelope"): a deep-navy
 * envelope cover with gold flap lines and a gold wax seal you press to open,
 * an ornate navy cartouche hero over ivory, a script welcome, a month-grid
 * calendar with the wedding day as a gold heart, a palace line-art venue with
 * Yandex / Google map buttons, a countdown, RSVP, and a ring-crest footer.
 * Everything is self-contained (CSS + inline SVG) — no external images.
 * ──────────────────────────────────────────────────────────────────────── */

const NAVY = '#22385c';
const NAVY_DEEP = '#16273f';
const GOLD = '#c9a45f';
const GOLD_SOFT = '#e0c98a';
const CREAM = '#f6f0e2';

interface RoyalTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

/* ── Line-art SVGs (navy engravings) ─────────────────────────────────────── */
const PalaceArt = ({ className = '' }: any) => (
  <svg viewBox="0 0 300 150" className={className} fill="none" stroke={NAVY} strokeWidth="1.3"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {/* dome + pediment */}
    <path d="M150 12 C 138 20 138 34 150 40 C 162 34 162 20 150 12 Z" />
    <path d="M118 52 L150 34 L182 52 Z" />
    {/* cornice */}
    <path d="M40 62 H260 M46 70 H254" />
    {/* columns */}
    {[58, 82, 106, 130, 170, 194, 218, 242].map(x => (
      <path key={x} d={`M${x} 74 V128 M${x - 6} 74 H${x + 6} M${x - 6} 128 H${x + 6}`} />
    ))}
    {/* central portico */}
    <path d="M138 128 V86 a12 12 0 0 1 24 0 V128" />
    {/* base steps */}
    <path d="M30 128 H270 M22 136 H278 M14 144 H286" />
  </svg>
);
const RingsArt = ({ className = '' }: any) => (
  <svg viewBox="0 0 200 120" className={className} fill="none" stroke={NAVY} strokeWidth="1.4"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <ellipse cx="80" cy="72" rx="34" ry="36" />
    <ellipse cx="80" cy="72" rx="27" ry="29" />
    <ellipse cx="124" cy="72" rx="34" ry="36" />
    <ellipse cx="124" cy="72" rx="27" ry="29" />
    {/* solitaire diamond on the left ring */}
    <path d="M70 26 L90 26 L96 36 L80 50 L64 36 Z M70 26 L80 36 L90 26 M64 36 H96 M80 36 V50" />
  </svg>
);
/* An ornate vertical cartouche frame (navy fill, gold outline). Symmetric by
   construction: every right-side anchor mirrors to 300 − x on the left. */
const CARTOUCHE_D =
  'M150 8 C205 8 240 32 248 54 C262 92 240 118 240 150 C242 198 268 236 250 285 ' +
  'C238 332 206 362 192 400 C176 428 162 450 150 450 C138 450 124 428 108 400 ' +
  'C94 362 62 332 50 285 C32 236 58 198 60 150 C60 118 38 92 52 54 C60 32 95 8 150 8 Z';

export function RoyalTemplate({ wedding, photos = [] }: RoyalTemplateProps) {
  const { t, i18n } = useTranslation();
  const twin = isTwinWedding(wedding);

  const couplePhotos = photos.filter((p: any) => p.photoType === 'couple');
  const memoryPhotos = photos.filter((p: any) => p.photoType === 'memory');
  const heroDesignated = photos.filter((p: any) => p.photoType === 'hero' || p.isHero);
  const toyxonaPhotos = photos.filter((p: any) => p.photoType === 'toyxona');
  const uploadedHero =
    wedding.couplePhotoUrl || couplePhotos[0]?.url || heroDesignated[0]?.url || null;
  const albumPhotos = Array.from(new Set([
    uploadedHero, ...memoryPhotos.map((p: any) => p.url), ...toyxonaPhotos.map((p: any) => p.url),
  ].filter(Boolean))).slice(0, 6);

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
  }, []);

  const handleUnlock = () => {
    if (unlocking) return;
    musicRef.current?.startPlayback();
    setUnlocking(true);
    setTimeout(() => setLocked(false), 850);
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
    return <div className="min-h-screen flex items-center justify-center" style={{ background: NAVY, color: GOLD }}><p>{t('common.loading')}</p></div>;
  }

  const dateObj = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
  const dd = dateObj ? format(dateObj, 'dd') : '';
  const mm = dateObj ? format(dateObj, 'MM') : '';
  const yy = dateObj ? format(dateObj, 'yy') : '';
  const monthLabel = dateObj ? format(dateObj, 'LLLL, yyyy', { locale: getDateLocale() }) : '';

  const calendar = (() => {
    if (!dateObj) return null;
    const y = dateObj.getFullYear(), m = dateObj.getMonth(), day = dateObj.getDate();
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    return { cells, day };
  })();

  const coords = wedding.venueCoordinates as { lat: number; lng: number } | null;
  const isUrl = (s?: string | null) => !!s && /^https?:\/\//i.test(s.trim());
  const isGoogleEmbed = (s?: string | null) => isUrl(s) && /(\/maps\/embed\?|[?&]output=embed)/i.test(s!.trim());
  const mapPin = (wedding.mapPinUrl || '').trim();
  const addressText = !isUrl(wedding.venueAddress) ? (wedding.venueAddress || '') : '';
  const venueText = !isUrl(wedding.venue) ? (wedding.venue || '') : '';
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
  const openYandex = () => {
    const url = (isUrl(mapPin) && /yandex\./i.test(mapPin))
      ? mapPin
      : (placeQuery ? `https://yandex.com/maps/?text=${encodeURIComponent(placeQuery)}` : '');
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const hasMap = !!(embedSrc || mapPin || placeQuery);

  const langCodes = Array.from(new Set([...(wedding.availableLanguages || []), 'uz', 'ru', 'en']))
    .filter(c => ['uz', 'ru', 'en', 'kk', 'kaa'].includes(c));
  const langLabel: Record<string, string> = { uz: 'UZ', ru: 'RU', en: 'EN', kk: 'KK', kaa: 'QR' };
  const switchLang = (c: string) => { i18n.changeLanguage(c); try { localStorage.setItem('language', c); } catch {} };

  const fadeUp = {
    hidden: { opacity: 0, y: 26 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as any } }),
  };

  // Great Vibes is Latin-only; Dancing Script carries Cyrillic (ru/kk) so the
  // script names/headings stay elegant across all languages.
  const script = '"Great Vibes", "Dancing Script", cursive';
  const serif = '"Cormorant Garamond", serif';
  const caps = '"Cinzel", "Cormorant Garamond", serif';

  const ScriptAmp = () => <span style={{ fontFamily: script, color: GOLD, fontSize: '0.7em' }}> &amp; </span>;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: CREAM, color: NAVY, fontFamily: serif }}>
      <style>{`
        .ryl-caps { font-family: ${caps}; text-transform: uppercase; letter-spacing: 0.22em; }
        .ryl-script { font-family: ${script}; }
        .ryl-divider { height:1px; background:linear-gradient(90deg,transparent,${GOLD},transparent); }
        .ryl-btn-solid { background:${NAVY}; color:${CREAM}; letter-spacing:0.18em; box-shadow:0 12px 26px rgba(34,56,92,0.3); }
        .ryl-btn-solid:hover { background:${NAVY_DEEP}; }
        .ryl-btn-outline { border:1.5px solid ${NAVY}; color:${NAVY}; letter-spacing:0.18em; transition:all .3s; }
        .ryl-btn-outline:hover { background:rgba(34,56,92,0.06); }
        .ryl-cal td { text-align:center; padding:9px 0; font-family:${serif}; color:${NAVY}; font-size:17px; position:relative; }
        .ryl-cal th { color:${GOLD}; font-weight:600; font-size:11px; letter-spacing:.1em; padding-bottom:10px; font-family:${caps}; }
        .ryl-heart { position:relative; display:inline-flex; align-items:center; justify-content:center; width:44px; height:40px; color:${CREAM}; font-weight:600; }
        .ryl-heart svg { position:absolute; inset:0; width:44px; height:40px; z-index:0; }
        .ryl-heart span { position:relative; z-index:1; }
        .ryl-lang-active { background:${GOLD}; color:${NAVY}; }
        @keyframes ryl-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        .ryl-seal { animation: ryl-pulse 2.6s ease-in-out infinite; }
      `}</style>

      <AzamatScrollMusic ref={musicRef} musicUrl={wedding.backgroundMusicUrl ?? ''}
        theme={{ primary: NAVY, accent: GOLD, iconColor: CREAM, glow: 'rgba(201,164,95,0.5)' }} />

      {/* ── Language switcher (top-right, like the reference) ──────────────── */}
      <div className="fixed top-4 right-4 z-[80] flex gap-1 p-1 rounded-full"
        style={{ background: 'rgba(246,240,226,0.85)', border: `1px solid ${GOLD}` }}>
        {langCodes.map(c => (
          <button key={c} onClick={() => switchLang(c)}
            className={`w-9 h-8 rounded-full text-[11px] font-semibold transition-all ${i18n.language === c ? 'ryl-lang-active' : ''}`}
            style={i18n.language === c ? {} : { color: NAVY }}>
            {langLabel[c] || c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ════════════ ENVELOPE GATE ════════════ */}
      {locked && (
        <button onClick={handleUnlock} aria-label={t('royal.gate.press')}
          className={`fixed inset-0 z-[70] w-full text-center transition-opacity duration-800 ${unlocking ? 'opacity-0' : 'opacity-100'}`}
          style={{ background: `radial-gradient(120% 90% at 50% 40%, ${NAVY} 0%, ${NAVY_DEEP} 100%)` }}>
          {/* gold envelope flap lines from the four corners to the seal */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 430 860" preserveAspectRatio="none" aria-hidden>
            <defs><linearGradient id="rylgold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD_SOFT} /><stop offset="1" stopColor={GOLD} />
            </linearGradient></defs>
            {[[0, 0], [430, 0], [0, 860], [430, 860]].map(([x, y], i) => (
              <line key={i} x1={x} y1={y} x2="215" y2="470" stroke="url(#rylgold)" strokeWidth="1.5" opacity="0.85" />
            ))}
          </svg>

          <div className="relative z-10 h-full flex flex-col items-center justify-between py-16 px-6">
            <div>
              <p className="ryl-caps text-2xl sm:text-3xl" style={{ color: CREAM }}>{t('royal.gate.invited')}</p>
              <p className="ryl-script text-4xl sm:text-5xl mt-1" style={{ color: GOLD_SOFT }}>{t('royal.gate.toWedding')}</p>
            </div>

            {/* wax seal */}
            <div className="ryl-seal relative w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 38% 32%, ${GOLD_SOFT}, ${GOLD} 55%, #a07d3c 100%)`,
                boxShadow: '0 14px 34px rgba(0,0,0,0.45), inset 0 3px 8px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(0,0,0,0.35)',
              }}>
              <div className="absolute inset-2 rounded-full" style={{ border: '1.5px solid rgba(90,66,25,0.5)' }} />
              <span className="ryl-caps text-[11px]" style={{ color: '#5a4219' }}>{t('royal.gate.press')}</span>
            </div>

            <div>
              <p className="text-sm italic mb-1" style={{ color: GOLD_SOFT, fontFamily: serif }}>{t('royal.gate.withLove')}</p>
              <p className="ryl-caps text-lg sm:text-xl" style={{ color: CREAM }}>
                {wedding.groom} &amp; {wedding.bride}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* ════════════ CONTENT ════════════ */}
      <div>
        {/* ── HERO CARTOUCHE ── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="relative w-[min(88vw,340px)]">
            <svg viewBox="0 0 300 456" className="w-full drop-shadow-xl" aria-hidden>
              <path d={CARTOUCHE_D} fill={NAVY} stroke={GOLD} strokeWidth="2.5" />
              <path d={CARTOUCHE_D} fill="none" stroke={GOLD_SOFT} strokeWidth="1" transform="translate(150 228) scale(0.93) translate(-150 -228)" opacity="0.7" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
              <p className="ryl-script text-4xl sm:text-5xl leading-tight" style={{ color: CREAM }}>{wedding.groom}</p>
              <span className="ryl-script text-xl" style={{ color: GOLD }}>&amp;</span>
              <p className="ryl-script text-4xl sm:text-5xl leading-tight" style={{ color: CREAM }}>{wedding.bride}</p>
              <p className="text-[11px] sm:text-xs leading-snug mt-5 px-2" style={{ color: GOLD_SOFT, fontFamily: serif }}>
                {t('imperial.blessing.translation')}
              </p>
              <div className="mt-5 flex flex-col items-center gap-1" style={{ color: CREAM, fontFamily: script }}>
                <span className="text-3xl">{dd}</span>
                <span style={{ color: GOLD }}>•</span>
                <span className="text-3xl">{mm}</span>
                <span style={{ color: GOLD }}>•</span>
                <span className="text-3xl">{yy}</span>
              </div>
            </div>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }}
            className="ryl-caps text-[11px] mt-10" style={{ color: NAVY }}>{t('royal.scrollDown')} ↓</motion.p>
        </section>

        {/* ── WELCOME ── */}
        <section className="px-6 py-14">
          <div className="ryl-divider max-w-xs mx-auto mb-10" />
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-xl mx-auto text-center">
            <h2 className="ryl-script text-5xl sm:text-6xl leading-tight mb-8" style={{ color: NAVY }}>{t('royal.welcome.title')}</h2>
            {wedding.dearGuestMessage ? (
              <p className="text-lg leading-relaxed whitespace-pre-wrap" style={{ fontFamily: serif, color: NAVY }}>{wedding.dearGuestMessage}</p>
            ) : (
              <div className="text-lg leading-relaxed space-y-4" style={{ fontFamily: serif, color: NAVY }}>
                <p>{t('wedding.foundEachOther')} {t('wedding.filledWithWarmth')}</p>
                <p className="font-semibold">{t('wedding.inviteToCelebrate')}</p>
              </div>
            )}
          </motion.div>
        </section>

        {/* ── CALENDAR ── */}
        {calendar && (
        <section className="px-6 py-14">
          <div className="ryl-divider max-w-xs mx-auto mb-10" />
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-md mx-auto text-center">
            <h2 className="ryl-script text-4xl sm:text-5xl mb-8" style={{ color: NAVY }}>{monthLabel}</h2>
            <table className="ryl-cal w-full">
              <thead><tr>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <th key={d}>{d}</th>)}</tr></thead>
              <tbody>
                {Array.from({ length: calendar.cells.length / 7 }).map((_, r) => (
                  <tr key={r}>{calendar.cells.slice(r * 7, r * 7 + 7).map((d, i) => (
                    <td key={i}>
                      {d ? (d === calendar.day
                        ? <span className="ryl-heart">
                            <svg viewBox="0 0 32 29" aria-hidden><path d="M16 28C16 28 2 19 2 9.5C2 4.8 5.8 2 9.5 2C12.5 2 15 3.8 16 6C17 3.8 19.5 2 22.5 2C26.2 2 30 4.8 30 9.5C30 19 16 28 16 28Z" fill={GOLD} /></svg>
                            <span>{d}</span>
                          </span>
                        : d) : ''}
                    </td>
                  ))}</tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </section>
        )}

        {/* ── COUNTDOWN ── */}
        {show('countdown') && (
        <section id="details" className="px-6 py-14">
          <div className="ryl-divider max-w-xs mx-auto mb-10" />
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-lg mx-auto text-center">
            <h2 className="ryl-script text-4xl sm:text-5xl mb-9" style={{ color: NAVY }}>{t('royal.countdown.title')}</h2>
            <div className="flex items-start justify-center gap-2 sm:gap-4">
              {[['days', timeLeft.days], ['hours', timeLeft.hours], ['minutes', timeLeft.minutes], ['seconds', timeLeft.seconds]].map(([k, v], idx) => (
                <React.Fragment key={k as string}>
                  {idx > 0 && <span className="text-3xl sm:text-4xl" style={{ color: GOLD, fontFamily: serif }}>:</span>}
                  <div className="min-w-[54px]">
                    <div className="text-4xl sm:text-5xl tabular-nums" style={{ fontFamily: caps, color: GOLD }}>{String(v).padStart(2, '0')}</div>
                    <div className="text-[10px] sm:text-xs mt-1" style={{ color: NAVY, fontFamily: serif }}>{t(`wedding.countdown.${k}`)}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p className="text-base italic mt-8" style={{ fontFamily: serif, color: NAVY }}>{t('royal.countdown.tagline')}</p>
          </motion.div>
        </section>
        )}

        {/* ── VENUE ── */}
        {show('location') && (
        <section id="location" className="px-6 py-14">
          <div className="ryl-divider max-w-xs mx-auto mb-10" />
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-xl mx-auto text-center">
            <PalaceArt className="w-56 mx-auto mb-6 opacity-90" />
            <h2 className="ryl-script text-4xl sm:text-5xl mb-3" style={{ color: NAVY }}>{t('royal.venue.label')}</h2>
            <p className="ryl-caps text-base leading-relaxed" style={{ color: NAVY }}>{wedding.venue || t('details.venueTBD')}</p>
            {addressText && <p className="text-base mt-3" style={{ fontFamily: serif, color: NAVY }}>{addressText}</p>}
            {embedSrc && (
              <div className="rounded-xl overflow-hidden mt-7 border" style={{ borderColor: GOLD }}>
                <iframe title="map" src={embedSrc} className="w-full" style={{ border: 0, height: 260 }}
                  loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
            {hasMap && (
              <div className="mt-7 space-y-3">
                <button onClick={openYandex} className="ryl-btn-solid ryl-caps w-full text-xs py-4 rounded-lg">{t('royal.venue.yandex')}</button>
                <button onClick={openMap} className="ryl-btn-outline ryl-caps w-full text-xs py-4 rounded-lg">{t('royal.venue.google')}</button>
              </div>
            )}
          </motion.div>
        </section>
        )}

        {/* ── ALBUM (if photos) ── */}
        {albumPhotos.length > 0 && show('gallery') && (
        <section id="memories" className="px-6 py-14">
          <div className="ryl-divider max-w-xs mx-auto mb-10" />
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <h2 className="ryl-script text-4xl sm:text-5xl mb-8" style={{ color: NAVY }}>{t('garden.album')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {albumPhotos.map((url: string, i: number) => (
                <div key={i} className="aspect-square overflow-hidden rounded-xl border" style={{ borderColor: GOLD }}>
                  <img src={url} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </motion.div>
        </section>
        )}

        {/* ── RSVP ── */}
        {show('rsvp') && (
        <section id="rsvp" className="px-6 py-14">
          <div className="ryl-divider max-w-xs mx-auto mb-10" />
          <div className="max-w-xl mx-auto">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="ryl-script text-4xl sm:text-5xl mb-8 text-center" style={{ color: NAVY }}>{t('imperial.rsvp.title')}</motion.h2>
            <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="rounded-2xl p-6 sm:p-9" style={{ background: '#fff', border: `1px solid ${GOLD}`, boxShadow: '0 20px 50px rgba(34,56,92,0.1)' }}>
              <EpicRSVPForm wedding={wedding} primaryColor={NAVY} accentColor={GOLD} labelColor={`text-[${NAVY}]`} />
            </motion.div>
          </div>
        </section>
        )}

        {/* ── TO'YONA ── */}
        {show('toyona') && !!wedding.cardNumber && (
        <section id="toyona" className="px-6 py-14">
          <div className="ryl-divider max-w-xs mx-auto mb-10" />
          <div className="max-w-xl mx-auto text-center">
            <h2 className="ryl-script text-4xl sm:text-5xl mb-3" style={{ color: NAVY }}>{t('toyona.title')}</h2>
            <p className="text-sm mb-7 max-w-md mx-auto" style={{ fontFamily: serif, color: NAVY }}>{t('toyona.message')}</p>
            <div className="rounded-2xl p-6 sm:p-9" style={{ background: '#fff', border: `1px solid ${GOLD}` }}>
              <ToyonaCard cardHolderName={wedding.cardHolderName} cardNumber={wedding.cardNumber} accent={NAVY} surface="light" />
            </div>
          </div>
        </section>
        )}

        {/* ── GUEST BOOK ── */}
        {show('guestBook') && (
        <section id="guestbook" className="px-6 py-14">
          <div className="ryl-divider max-w-xs mx-auto mb-10" />
          <div className="max-w-2xl mx-auto">
            <h2 className="ryl-script text-4xl sm:text-5xl mb-8 text-center" style={{ color: NAVY }}>{t('guestbook.title')}</h2>
            <div className="rounded-2xl p-6 sm:p-9" style={{ background: '#fff', border: `1px solid ${GOLD}` }}>
              <GuestBookForm weddingId={wedding.id} primaryColor={NAVY} accentColor={GOLD} surface="light" />
            </div>
            {guestBookEntries.length > 0 && (
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {guestBookEntries.slice(0, 6).map((e: any) => (
                  <div key={e.id} className="rounded-xl p-6" style={{ background: '#fff', border: `1px solid ${GOLD}` }}>
                    <p className="italic" style={{ fontFamily: serif, color: NAVY }}>“{e.message}”</p>
                    <p className="ryl-caps text-[11px] mt-3" style={{ color: GOLD }}>— {e.guestName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        )}

        {/* ── FOOTER ── */}
        <footer className="px-6 pt-6 pb-16 text-center" style={{ background: NAVY, color: CREAM }}>
          {show('orderCta') && <OrderInvitationCTA accent={GOLD} surface="dark" className="mb-12 max-w-xl mx-auto" />}
          <RingsArt className="w-32 mx-auto mb-6" style={{ stroke: GOLD_SOFT }} />
          <p className="ryl-script text-4xl mb-2" style={{ color: GOLD_SOFT }}>
            {wedding.groom} &amp; {wedding.bride}
          </p>
          <p className="text-base italic" style={{ fontFamily: serif, color: CREAM }}>{t('royal.footer.await')}</p>
          <p className="ryl-caps text-[10px] mt-6 opacity-70" style={{ color: GOLD_SOFT }}>— Royal —</p>
        </footer>
      </div>
    </div>
  );
}

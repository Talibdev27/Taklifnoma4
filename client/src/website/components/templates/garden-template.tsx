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
import { MapPin, Heart, ArrowRight } from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, GuestBookEntry } from '@shared/schema';
import { isTwinWedding } from '@/lib/couples';

/* ─────────────────────────────────────────────────────────────────────────
 * GARDEN ("Floral 💐") — a soft, botanical, watercolour-garden invitation.
 *
 * UI/UX direction (after chungdoi "glass garden green"): a lush watercolour
 * floral canvas, frosted-glass cards, forest-green serif typography with a
 * script ampersand, a heart "open" gate, an "about the ceremony" card with a
 * day │ number │ month date block, a wedding album, venue with map, RSVP, and
 * guest book. The floral canvas is fully self-contained (CSS + inline SVG) so
 * there is no external-image dependency to break.
 * ──────────────────────────────────────────────────────────────────────── */

const GREEN_DEEP = '#3f5233';   // headings
const GREEN = '#54683c';        // body / labels
const GREEN_SOFT = '#7d9160';   // leaves / soft accents
const GOLD_LEAF = '#e6d9a8';    // flower centres

interface GardenTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

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

/* ── Watercolour floral SVG primitives (self-contained decoration) ───────── */
const Flower = ({ x, y, s = 1, petal = '#ffffff' }: any) => (
  <g opacity="0.97">
    {[0, 72, 144, 216, 288].map(a => (
      <ellipse key={a} cx={x} cy={y - 13 * s} rx={6.5 * s} ry={12 * s} fill={petal}
        transform={`rotate(${a} ${x} ${y})`} />
    ))}
    <circle cx={x} cy={y} r={4.6 * s} fill={GOLD_LEAF} />
    <circle cx={x} cy={y} r={2.2 * s} fill="#cbb972" />
  </g>
);
const Leaf = ({ x, y, s = 1, rot = 0, fill = GREEN_SOFT }: any) => (
  <path d={`M${x} ${y} q ${9 * s} ${-17 * s} 0 ${-34 * s} q ${-9 * s} ${17 * s} 0 ${34 * s} z`}
    fill={fill} opacity="0.9" transform={`rotate(${rot} ${x} ${y})`} />
);
const Dots = ({ x, y, s = 1 }: any) => (
  <g fill="#ffffff" opacity="0.9">
    {[[0, 0], [10, -8], [-9, -6], [4, -16], [-6, -18], [14, 2]].map(([dx, dy], i) => (
      <circle key={i} cx={x + dx * s} cy={y + dy * s} r={2.1 * s} />
    ))}
  </g>
);
/* A horizontal bouquet ~360×150, used (mirrored/scaled) around cards. */
const Bouquet = ({ className = '', style = {}, flip = false }: any) => (
  <svg viewBox="0 0 360 150" className={className}
    style={{ transform: flip ? 'scaleX(-1)' : undefined, ...style }} aria-hidden>
    <Leaf x={120} y={95} s={1.5} rot={-35} fill={GREEN} />
    <Leaf x={150} y={100} s={1.7} rot={20} fill={GREEN_SOFT} />
    <Leaf x={210} y={92} s={1.5} rot={40} fill={GREEN} />
    <Leaf x={95} y={80} s={1.2} rot={-70} fill={GREEN_SOFT} />
    <Leaf x={250} y={80} s={1.3} rot={75} fill={GREEN_SOFT} />
    <Leaf x={180} y={110} s={1.4} rot={0} fill={GREEN_DEEP} />
    <Dots x={80} y={70} s={1.2} />
    <Dots x={270} y={70} s={1.2} />
    <Flower x={140} y={78} s={1.5} />
    <Flower x={205} y={82} s={1.7} />
    <Flower x={175} y={62} s={2.1} />
    <Flower x={110} y={92} s={1.1} />
    <Flower x={238} y={94} s={1.2} />
  </svg>
);

export function GardenTemplate({ wedding, photos = [] }: GardenTemplateProps) {
  const { t, i18n } = useTranslation();
  const twin = isTwinWedding(wedding);

  const couplePhotos = photos.filter((p: any) => p.photoType === 'couple');
  const memoryPhotos = photos.filter((p: any) => p.photoType === 'memory');
  const heroDesignated = photos.filter((p: any) => p.photoType === 'hero' || p.isHero);
  const toyxonaPhotos = photos.filter((p: any) => p.photoType === 'toyxona');

  const uploadedHero =
    wedding.couplePhotoUrl || couplePhotos[0]?.url || heroDesignated[0]?.url || null;
  const albumPhotos = (() => {
    const list = Array.from(new Set([
      uploadedHero,
      ...memoryPhotos.map((p: any) => p.url),
      ...toyxonaPhotos.map((p: any) => p.url),
    ].filter(Boolean)));
    return list.slice(0, 6);
  })();

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
    setTimeout(() => setLocked(false), 800);
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
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#eef2e6', color: GREEN_DEEP }}><p>{t('common.loading')}</p></div>;
  }

  const dateObj = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
  const dotsDate = dateObj ? format(dateObj, 'd MMMM yyyy', { locale: getDateLocale() }) : '';
  const dayNum = dateObj ? format(dateObj, 'dd') : '';
  const weekday = dateObj ? format(dateObj, 'EEEE', { locale: getDateLocale() }) : '';
  const monthName = dateObj ? format(dateObj, 'MMMM', { locale: getDateLocale() }) : '';
  const yearNum = dateObj ? format(dateObj, 'yyyy') : '';
  const monthLabel = dateObj ? format(dateObj, 'LLLL yyyy', { locale: getDateLocale() }) : '';

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
  const hasMap = !!(embedSrc || mapPin || placeQuery);

  const langCodes = Array.from(new Set([...(wedding.availableLanguages || []), 'uz', 'ru', 'en']))
    .filter(c => ['uz', 'ru', 'en', 'kk', 'kaa'].includes(c));
  const langLabel: Record<string, string> = { uz: 'UZ', ru: 'RU', en: 'EN', kk: 'KK', kaa: 'QR' };
  const switchLang = (c: string) => { i18n.changeLanguage(c); try { localStorage.setItem('language', c); } catch {} };

  const fadeUp = {
    hidden: { opacity: 0, y: 26 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as any } }),
  };

  const display = '"Playfair Display", "Cormorant Garamond", serif';
  const serif = '"Cormorant Garamond", serif';
  const script = '"Great Vibes", "Cormorant Garamond", cursive';

  const Names = ({ size = 'text-4xl sm:text-6xl', color = GREEN_DEEP }: any) => (
    <div className="flex flex-col items-center leading-none" style={{ color }}>
      <span className={`${size}`} style={{ fontFamily: display }}>{wedding.groom}</span>
      <span className="text-2xl sm:text-3xl my-1" style={{ fontFamily: script, color: GREEN_SOFT }}>&amp;</span>
      <span className={`${size}`} style={{ fontFamily: display }}>{wedding.bride}</span>
      {twin && (
        <>
          <span className="text-lg my-2" style={{ color: GREEN_SOFT }}>✿</span>
          <span className={`${size}`} style={{ fontFamily: display }}>{wedding.groom2}</span>
          <span className="text-2xl sm:text-3xl my-1" style={{ fontFamily: script, color: GREEN_SOFT }}>&amp;</span>
          <span className={`${size}`} style={{ fontFamily: display }}>{wedding.bride2}</span>
        </>
      )}
    </div>
  );

  const Divider = ({ className = '' }: any) => (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-10 sm:w-14" style={{ background: `linear-gradient(90deg,transparent,${GREEN_SOFT})` }} />
      <span style={{ color: GREEN_SOFT }}>❦</span>
      <span className="h-px w-10 sm:w-14" style={{ background: `linear-gradient(90deg,${GREEN_SOFT},transparent)` }} />
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden gdn-root" style={{ color: GREEN }}>
      <style>{`
        .gdn-root { font-family: ${serif}; }
        .gdn-canvas {
          position: fixed; inset: 0; z-index: 0;
          background:
            radial-gradient(60% 45% at 18% 12%, rgba(238,224,222,0.55), transparent 60%),
            radial-gradient(55% 40% at 85% 20%, rgba(233,240,224,0.6), transparent 60%),
            radial-gradient(70% 55% at 50% 95%, rgba(214,228,198,0.7), transparent 65%),
            linear-gradient(160deg, #e9efdf 0%, #dbe6c9 45%, #cfe0ba 78%, #e3ecd6 100%);
        }
        /* faint botanical speckle so the empty canvas never looks flat */
        .gdn-speckle {
          position: fixed; inset: 0; z-index: 0; opacity: 0.5; pointer-events: none;
          background-image: radial-gradient(rgba(125,145,96,0.18) 1.2px, transparent 1.4px);
          background-size: 26px 26px;
        }
        .gdn-label { font-family: ${serif}; text-transform: uppercase; letter-spacing: 0.34em; font-weight: 600; }
        .gdn-card {
          background: rgba(246,249,240,0.62);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(124,145,96,0.32);
          box-shadow: 0 24px 60px rgba(63,82,51,0.14);
        }
        .gdn-btn {
          background: linear-gradient(135deg, ${GREEN}, ${GREEN_DEEP});
          color: #f4f6ef; letter-spacing: 0.22em;
          box-shadow: 0 12px 26px rgba(63,82,51,0.32);
        }
        .gdn-pill { border: 1px solid rgba(84,104,60,0.6); color: ${GREEN_DEEP}; transition: all .3s; }
        .gdn-pill:hover { background: rgba(84,104,60,0.1); }
        .gdn-cal td { text-align:center; padding:7px 0; font-family:${serif}; color:${GREEN}; font-size:16px; }
        .gdn-cal th { color:${GREEN_SOFT}; font-weight:600; font-size:11px; letter-spacing:.12em; padding-bottom:8px; text-transform:uppercase; }
        .gdn-cal .on { color:#f4f6ef; background:${GREEN}; border-radius:999px; display:inline-flex; width:32px; height:32px; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(63,82,51,0.3); }
        @keyframes gdn-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .gdn-float { animation: gdn-float 3.6s ease-in-out infinite; }
      `}</style>

      <div className="gdn-canvas" />
      <div className="gdn-speckle" />

      <AzamatScrollMusic ref={musicRef} musicUrl={wedding.backgroundMusicUrl ?? ''}
        theme={{ primary: GREEN, accent: GREEN_SOFT, iconColor: '#f4f6ef', glow: 'rgba(84,104,60,0.5)' }} />

      {/* ── Language switcher ─────────────────────────────────────────────── */}
      <div className="fixed top-4 left-4 z-[80] flex gap-1.5">
        {langCodes.map(c => (
          <button key={c} onClick={() => switchLang(c)}
            className="w-9 h-9 rounded-full text-[11px] tracking-wider transition-all backdrop-blur-md"
            style={i18n.language === c
              ? { background: GREEN, color: '#f4f6ef', fontWeight: 600 }
              : { background: 'rgba(255,255,255,0.55)', color: GREEN_DEEP, border: '1px solid rgba(84,104,60,0.3)' }}>
            {langLabel[c] || c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ════════════ OPEN GATE (cover) ════════════ */}
      {locked && (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center px-5 transition-opacity duration-700 ${unlocking ? 'opacity-0' : 'opacity-100'}`}>
          <div className="gdn-canvas" />
          <div className="gdn-speckle" />
          <div className="relative w-[min(92vw,430px)]">
            <Bouquet className="absolute -top-16 -left-10 w-56 rotate-[8deg]" />
            <Bouquet className="absolute -top-16 -right-10 w-56" flip />
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
              className="gdn-card rounded-[26px] px-7 sm:px-10 pt-16 pb-14 text-center relative">
              <div className="w-14 h-14 rounded-full mx-auto mb-7 flex items-center justify-center"
                style={{ background: GREEN_DEEP, boxShadow: '0 10px 24px rgba(63,82,51,0.35)' }}>
                <Heart className="w-6 h-6" style={{ color: '#f4f6ef' }} fill="#f4f6ef" strokeWidth={0} />
              </div>
              <Names size="text-4xl sm:text-5xl" />
              <Divider className="my-6" />
              <p className="text-lg sm:text-xl" style={{ fontFamily: serif, color: GREEN }}>{dotsDate}</p>
              <p className="gdn-label text-[10px] sm:text-[11px] leading-relaxed mt-7" style={{ color: GREEN }}>
                {t('garden.gate.invite')}
              </p>
              <button onClick={handleUnlock}
                className="gdn-btn gdn-label text-xs mt-9 px-10 py-4 rounded-full inline-flex items-center gap-2">
                {t('garden.gate.open')} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
            <Bouquet className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-64" />
          </div>
        </div>
      )}

      {/* ════════════ CONTENT ════════════ */}
      <div className="relative z-10">

        {/* ── HERO / CEREMONY ── */}
        <section className="min-h-screen flex items-center justify-center px-5 py-20">
          <div className="relative w-[min(92vw,460px)]">
            <Bouquet className="absolute -top-14 -left-8 w-52 rotate-[6deg]" />
            <Bouquet className="absolute -top-14 -right-8 w-52" flip />
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="gdn-card rounded-[26px] px-7 sm:px-11 pt-16 pb-12 text-center relative">
              <p className="gdn-label text-[11px] mb-6" style={{ color: GREEN_SOFT }}>{t('garden.ceremony.label')}</p>
              <p className="gdn-label text-[11px] leading-relaxed mb-9" style={{ color: GREEN }}>
                {t('garden.ceremony.invite')}
              </p>
              <Names size="text-5xl sm:text-6xl" />
              <Divider className="my-9" />
              <p className="gdn-label text-[11px] leading-relaxed" style={{ color: GREEN }}>{t('garden.ceremony.willHold')}</p>
              <p className="text-2xl sm:text-3xl mt-4" style={{ fontFamily: display, color: GREEN_DEEP }}>
                {wedding.venue || t('details.venueTBD')}
              </p>
              {addressText && <p className="text-sm mt-3" style={{ color: GREEN }}>{addressText}</p>}

              {/* day │ number │ month date block */}
              <div className="mt-10 flex items-center justify-center gap-4 sm:gap-6" style={{ color: GREEN_DEEP }}>
                <span className="gdn-label text-[10px] sm:text-xs w-20 text-right" style={{ color: GREEN }}>{weekday}</span>
                <span className="w-px h-12" style={{ background: GREEN_SOFT }} />
                <span className="text-5xl sm:text-6xl" style={{ fontFamily: display }}>{dayNum}</span>
                <span className="w-px h-12" style={{ background: GREEN_SOFT }} />
                <span className="gdn-label text-[10px] sm:text-xs w-20 text-left" style={{ color: GREEN }}>{monthName}</span>
              </div>
              <p className="text-lg mt-3" style={{ fontFamily: serif, color: GREEN }}>{yearNum}</p>
              <p className="gdn-label text-[11px] mt-6" style={{ color: GREEN_SOFT }}>
                {t('garden.ceremony.at')} {wedding.weddingTime || '18:00'}
              </p>
            </motion.div>
            <Bouquet className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-60" />
          </div>
        </section>

        {/* ── DEAR GUESTS ── */}
        {show('dearGuests') && (wedding.dearGuestMessage || true) && (
        <section className="px-5 py-14">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="gdn-card rounded-[24px] max-w-xl mx-auto px-7 sm:px-11 py-12 text-center">
            <p className="gdn-label text-[11px] mb-6" style={{ color: GREEN_SOFT }}>{t('wedding.dearGuests')}</p>
            {wedding.dearGuestMessage ? (
              <p className="text-lg sm:text-xl leading-relaxed whitespace-pre-wrap" style={{ fontFamily: serif, color: GREEN }}>
                {wedding.dearGuestMessage}
              </p>
            ) : (
              <div className="text-lg sm:text-xl leading-relaxed space-y-1" style={{ fontFamily: serif, color: GREEN }}>
                <p>{t('wedding.foundEachOther')}</p>
                <p>{t('wedding.filledWithWarmth')}</p>
                <p>{t('wedding.inviteToCelebrate')}</p>
              </div>
            )}
            <Divider className="my-8" />
            <p className="gdn-label text-[10px] mb-3" style={{ color: GREEN_SOFT }}>{t('wedding.withRespect')}</p>
            <p className="text-4xl sm:text-5xl leading-tight" style={{ fontFamily: display, color: GREEN_DEEP }}>
              {wedding.groom} <span style={{ fontFamily: script, color: GREEN_SOFT }}>&amp;</span> {wedding.bride}
            </p>
          </motion.div>
        </section>
        )}

        {/* ── COUNTDOWN + CALENDAR ── */}
        {show('countdown') && (
        <section id="details" className="px-5 py-14">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="gdn-card rounded-[24px] max-w-xl mx-auto px-7 sm:px-11 py-12 text-center">
            <p className="gdn-label text-[11px] mb-6" style={{ color: GREEN_SOFT }}>{t('countdown.timeRemaining')}</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
              {[['days', timeLeft.days], ['hours', timeLeft.hours], ['minutes', timeLeft.minutes], ['seconds', timeLeft.seconds]].map(([k, v]) => (
                <div key={k as string} className="rounded-2xl py-4 sm:py-5" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(124,145,96,0.25)' }}>
                  <div className="text-3xl sm:text-4xl tabular-nums" style={{ fontFamily: display, color: GREEN_DEEP }}>{String(v).padStart(2, '0')}</div>
                  <div className="gdn-label text-[8px] sm:text-[9px] mt-1.5" style={{ color: GREEN_SOFT }}>{t(`wedding.countdown.${k}`)}</div>
                </div>
              ))}
            </div>
            {calendar && (
              <div className="mt-12">
                <p className="gdn-label text-xs mb-5" style={{ color: GREEN }}>{monthLabel}</p>
                <table className="gdn-cal w-full max-w-sm mx-auto">
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
          </motion.div>
        </section>
        )}

        {/* ── WEDDING ALBUM ── */}
        {albumPhotos.length > 0 && show('gallery') && (
        <section id="memories" className="px-5 py-14">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-9">
              <p className="gdn-label text-[11px] mb-3" style={{ color: GREEN_SOFT }}>{t('wedding.photos')}</p>
              <h2 className="text-4xl sm:text-5xl" style={{ fontFamily: display, color: GREEN_DEEP }}>{t('garden.album')}</h2>
              <Divider className="mt-5" />
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {albumPhotos.map((url: string, i: number) => (
                <motion.div key={i} variants={fadeUp} custom={i % 3} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="aspect-square overflow-hidden rounded-2xl gdn-card">
                  <img src={url} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── VENUE / LOCATION + MAP ── */}
        {show('location') && (
        <section id="location" className="px-5 py-14">
          <div className="max-w-2xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
              <p className="gdn-label text-[11px] mb-3" style={{ color: GREEN_SOFT }}>{t('garden.location.label')}</p>
              <h2 className="text-4xl sm:text-5xl" style={{ fontFamily: display, color: GREEN_DEEP }}>{wedding.venue || t('details.venueTBD')}</h2>
              {addressText && (
                <p className="flex items-center justify-center gap-2 text-sm mt-4" style={{ color: GREEN }}>
                  <MapPin className="w-4 h-4" style={{ color: GREEN_SOFT }} /> {addressText}
                </p>
              )}
              <Divider className="mt-6" />
            </motion.div>
            {embedSrc && (
              <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="gdn-card rounded-[24px] overflow-hidden mb-5">
                <iframe title="map" src={embedSrc} className="w-full" style={{ border: 0, height: 280, filter: 'grayscale(0.1) contrast(1.02)' }}
                  loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
              </motion.div>
            )}
            {hasMap && (
              <div className="text-center">
                <button onClick={openMap} className="gdn-pill inline-flex items-center gap-2 px-8 py-3.5 rounded-full gdn-label text-xs">
                  <MapPin className="w-4 h-4" /> {t('garden.location.openMap')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
        )}

        {/* ── RSVP ── */}
        {show('rsvp') && (
        <section id="rsvp" className="px-5 py-14">
          <div className="max-w-xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
              <p className="gdn-label text-[11px] mb-3" style={{ color: GREEN_SOFT }}>{t('imperial.rsvp.label')}</p>
              <h2 className="text-4xl sm:text-5xl" style={{ fontFamily: display, color: GREEN_DEEP }}>{t('imperial.rsvp.title')}</h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="gdn-card rounded-[24px] p-6 sm:p-9">
              <EpicRSVPForm wedding={wedding} primaryColor={GREEN} accentColor={GREEN_SOFT} labelColor={`text-[${GREEN_DEEP}]`} />
            </motion.div>
          </div>
        </section>
        )}

        {/* ── TO'YONA ── */}
        {show('toyona') && !!wedding.cardNumber && (
        <section id="toyona" className="px-5 py-14">
          <div className="max-w-xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
              <p className="gdn-label text-[11px] mb-3" style={{ color: GREEN_SOFT }}>{t('sections.toyona')}</p>
              <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: display, color: GREEN_DEEP }}>{t('toyona.title')}</h2>
              <p className="text-sm mt-3 max-w-md mx-auto leading-relaxed" style={{ color: GREEN }}>{t('toyona.message')}</p>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="gdn-card rounded-[24px] p-6 sm:p-9 text-center">
              <ToyonaCard cardHolderName={wedding.cardHolderName} cardNumber={wedding.cardNumber} accent={GREEN} surface="light" />
            </motion.div>
          </div>
        </section>
        )}

        {/* ── GUEST BOOK ── */}
        {show('guestBook') && (
        <section id="guestbook" className="px-5 py-14">
          <div className="max-w-2xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
              <p className="gdn-label text-[11px] mb-3" style={{ color: GREEN_SOFT }}>{t('sections.guestbook')}</p>
              <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: display, color: GREEN_DEEP }}>{t('guestbook.title')}</h2>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="gdn-card rounded-[24px] p-6 sm:p-9">
              <GuestBookForm weddingId={wedding.id} primaryColor={GREEN} accentColor={GREEN_SOFT} surface="light" />
            </motion.div>
            {guestBookEntries.length > 0 && (
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {guestBookEntries.slice(0, 6).map((e: any) => (
                  <div key={e.id} className="gdn-card rounded-2xl p-6">
                    <p className="italic" style={{ fontFamily: serif, color: GREEN }}>“{e.message}”</p>
                    <p className="gdn-label text-[11px] mt-3" style={{ color: GREEN_SOFT }}>— {e.guestName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        )}

        {/* ── CLOSING ── */}
        <section className="px-5 py-20">
          <div className="relative w-[min(92vw,440px)] mx-auto">
            <Bouquet className="absolute -top-14 left-1/2 -translate-x-1/2 w-60" />
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="gdn-card rounded-[26px] px-7 pt-16 pb-12 text-center">
              <p className="gdn-label text-[11px] mb-5" style={{ color: GREEN_SOFT }}>{t('garden.closing.label')}</p>
              <p className="text-5xl sm:text-6xl leading-tight" style={{ fontFamily: script, color: GREEN_DEEP }}>{t('garden.closing.seeYou')}</p>
              <div className="flex justify-center mt-7"><Heart className="w-6 h-6 gdn-float" style={{ color: GREEN_SOFT }} fill={GREEN_SOFT} strokeWidth={0} /></div>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="px-6 pb-16 pt-6 text-center relative z-10">
          {show('orderCta') && <OrderInvitationCTA accent={GREEN} surface="light" className="mb-12 max-w-xl mx-auto" />}
          <Divider className="mb-5" />
          <p className="text-4xl mb-2" style={{ fontFamily: display, color: GREEN_DEEP }}>
            {wedding.groom} <span style={{ fontFamily: script, color: GREEN_SOFT }}>&amp;</span> {wedding.bride}
          </p>
          <p className="gdn-label text-[10px]" style={{ color: GREEN_SOFT }}>{t('footer.withLove')}</p>
          <p className="text-[10px] mt-5 tracking-[0.3em] uppercase" style={{ color: GREEN_SOFT }}>— Floral —</p>
        </footer>
      </div>
    </div>
  );
}

// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { uz as uzLocale, ru as ruLocale, enUS as enLocale } from 'date-fns/locale';
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

/* ─────────────────────────────────────────────────────────────────────────
 * BIZ BAZMI — bridal celebration (biz bazmi / qizlar bazmi / fotiha) invitation.
 *
 * UI/UX direction: a botanical "sealed envelope" aesthetic — a soft sage
 * watercolor canvas, a deep olive-green envelope closed with a gold wax seal
 * carrying the celebrant's initial, cream cards framed in antique-gold
 * hairlines, and hand-drawn white calla lilies, orchids and trailing
 * amaranth. Only the bride's name appears. Every visual is inline SVG/CSS —
 * no remote imagery — so it renders anywhere and stays crisp. Same section
 * set as the Kına Gecesi template; copy is Uzbek-first with RU/EN switches.
 * ──────────────────────────────────────────────────────────────────────── */

const SAGE = '#e9ecda';    // page canvas
const SAGE_D = '#cfd9b4';  // deeper watercolor wash
const OLIVE = '#55663a';   // envelope / primary green
const OLIVE_D = '#3d4a29'; // darkest green
const GOLD = '#b3893e';    // antique gold (wax seal)
const GOLD_L = '#dcc283';  // light gold
const CREAM = '#fbf9ef';   // cards
const INK = '#41482f';     // body text on cream

interface BizBazmiTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

/* Parse "18:00" / "6:00 PM" → "HH:MM" (24h). */
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

/* ── Decorative inline SVGs (single-stroke botanicals) ───────────────────── */
const g = (extra = {}) => ({ fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round', ...extra });

/** Faint scattered-leaf tile for the watercolor canvas (data URI). */
const leafTile = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
    <g fill='none' stroke='${OLIVE}' stroke-opacity='0.18' stroke-width='1'>
      <path d='M18 30 q10 -14 24 -10 q-2 14 -16 16 q-6 1 -8 -6 z'/>
      <path d='M22 28 q8 2 16 -2'/>
      <path d='M84 86 q-10 14 -24 10 q2 -14 16 -16 q6 -1 8 6 z'/>
      <path d='M80 88 q-8 -2 -16 2'/>
      <path d='M92 22 q6 8 0 16 M92 22 q-6 8 0 16'/>
      <path d='M30 96 c2 -6 8 -6 10 0 c-2 6 -8 6 -10 0 z'/>
    </g>
  </svg>`.replace(/\n\s*/g, ''),
);

/** White calla lily — spathe, spadix and stem. */
const Calla = ({ className = '', style }) => (
  <svg viewBox="0 0 44 96" className={className} style={{ color: OLIVE, ...style }} aria-hidden>
    <g {...g()}>
      <path d="M22 96 C 20 70 20 52 22 40" />
      <path d="M22 40 C 8 36 6 18 16 6 c 4 8 8 10 12 12 c -2 -8 0 -14 4 -16 c 8 10 8 30 -10 38 z"
        fill={CREAM} fillOpacity="0.9" />
      <path d="M22 40 C 8 36 6 18 16 6 c 4 8 8 10 12 12 c -2 -8 0 -14 4 -16 c 8 10 8 30 -10 38 z" />
      <path d="M22 36 v-14" stroke={GOLD} strokeWidth="2" />
      <path d="M22 62 q-10 -2 -14 6 M22 72 q10 -2 14 6" />
    </g>
  </svg>
);

/** Arching orchid sprig with four blooms. */
const Orchid = ({ className = '', style }) => (
  <svg viewBox="0 0 96 72" className={className} style={{ color: OLIVE, ...style }} aria-hidden>
    <g {...g()}>
      <path d="M4 68 C 30 62 62 44 90 10" />
      {[
        [70, 22], [52, 38], [34, 50], [18, 60],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <path d="M0 0 c -5 -6 -1 -11 3 -8 c 1 -5 7 -5 8 0 c 4 -3 8 2 3 8 c 3 4 -1 8 -5 6 c -1 3 -6 3 -7 0 c -4 2 -8 -2 -2 -6 z"
            fill={CREAM} fillOpacity="0.92" />
          <path d="M0 0 c -5 -6 -1 -11 3 -8 c 1 -5 7 -5 8 0 c 4 -3 8 2 3 8 c 3 4 -1 8 -5 6 c -1 3 -6 3 -7 0 c -4 2 -8 -2 -2 -6 z" />
          <circle cx="5.5" cy="0" r="1.4" fill={GOLD} stroke="none" />
        </g>
      ))}
      <path d="M78 20 q6 -2 10 2 M60 36 q-2 8 4 12" strokeWidth="1" opacity="0.7" />
    </g>
  </svg>
);

/** Anthurium / hosta leaf (the pale-green heart leaves in the bouquet). */
const HeartLeaf = ({ className = '', style }) => (
  <svg viewBox="0 0 56 64" className={className} style={{ color: OLIVE, ...style }} aria-hidden>
    <g {...g()}>
      <path d="M28 64 V 34" />
      <path d="M28 34 C 10 30 4 14 14 6 c 8 -5 14 2 14 10 c 0 -8 6 -15 14 -10 c 10 8 4 24 -14 28 z" fillOpacity="0.25" fill={SAGE_D} />
      <path d="M28 34 C 10 30 4 14 14 6 c 8 -5 14 2 14 10 c 0 -8 6 -15 14 -10 c 10 8 4 24 -14 28 z" />
      <path d="M28 16 v14 M20 18 q8 6 16 0" strokeWidth="0.9" opacity="0.8" />
    </g>
  </svg>
);

/** Eucalyptus branch. */
const Eucalyptus = ({ className = '', style }) => (
  <svg viewBox="0 0 40 110" className={className} style={{ color: OLIVE, ...style }} aria-hidden>
    <g {...g({ strokeWidth: 1.1 })}>
      <path d="M20 110 C 18 76 20 40 22 4" />
      {[10, 26, 42, 58, 74, 90].map((y, i) => (
        <g key={i}>
          <ellipse cx={i % 2 ? 11 : 29} cy={y} rx="7" ry="5" transform={`rotate(${i % 2 ? -24 : 24} ${i % 2 ? 11 : 29} ${y})`} />
        </g>
      ))}
    </g>
  </svg>
);

/** Hanging amaranth strands (the trailing green tassels in the bouquet). */
const Amaranth = ({ className = '', style }) => (
  <svg viewBox="0 0 48 150" className={className} style={{ color: OLIVE, ...style }} aria-hidden>
    <g {...g({ strokeWidth: 1 })}>
      <path d="M12 0 q-3 60 2 118 M24 0 q2 70 -2 140 M38 0 q3 56 -3 108" opacity="0.85" />
      {[18, 40, 62, 84, 106].map((y, i) => (
        <g key={i} opacity="0.8">
          <circle cx={12 + (i % 2)} cy={y} r="2.2" fill="currentColor" stroke="none" fillOpacity="0.5" />
          <circle cx={23 - (i % 2)} cy={y + 12} r="2.2" fill="currentColor" stroke="none" fillOpacity="0.5" />
          <circle cx={37 + (i % 2)} cy={y + 5} r="2.2" fill="currentColor" stroke="none" fillOpacity="0.5" />
        </g>
      ))}
    </g>
  </svg>
);

/** The bouquet from the inspiration image — callas + heart leaves + orchids. */
const Bouquet = ({ className = '', style }) => (
  <svg viewBox="0 0 160 110" className={className} style={style} aria-hidden>
    <g>
      <g transform="translate(18,30) rotate(-18)"><HeartLeafPath /></g>
      <g transform="translate(104,26) rotate(16)"><HeartLeafPath /></g>
      <g transform="translate(52,4)"><CallaPath /></g>
      <g transform="translate(78,10) rotate(10)"><CallaPath /></g>
      <g transform="translate(30,60)"><OrchidClusterPath /></g>
    </g>
  </svg>
);
/* raw path groups reused inside <Bouquet> (SVG-in-SVG keeps strokes crisp) */
const HeartLeafPath = () => (
  <g {...g()} style={{ color: OLIVE }} stroke={OLIVE}>
    <path d="M14 52 V 30" />
    <path d="M14 30 C 2 27 -2 14 5 8 c 6 -4 9 1 9 7 c 0 -6 4 -11 10 -7 c 7 6 3 19 -10 22 z" fill={SAGE_D} fillOpacity="0.5" />
    <path d="M14 30 C 2 27 -2 14 5 8 c 6 -4 9 1 9 7 c 0 -6 4 -11 10 -7 c 7 6 3 19 -10 22 z" />
  </g>
);
const CallaPath = () => (
  <g {...g()} stroke={OLIVE}>
    <path d="M15 62 C 14 46 14 36 15 28" />
    <path d="M15 28 C 5 25 4 12 11 4 c 3 6 6 7 8 8 c -1 -6 0 -10 3 -11 c 6 7 6 21 -7 27 z" fill={CREAM} fillOpacity="0.95" />
    <path d="M15 28 C 5 25 4 12 11 4 c 3 6 6 7 8 8 c -1 -6 0 -10 3 -11 c 6 7 6 21 -7 27 z" />
    <path d="M15 25 v-10" stroke={GOLD} strokeWidth="1.8" />
  </g>
);
const OrchidClusterPath = () => (
  <g {...g()} stroke={OLIVE}>
    <path d="M0 34 C 22 30 52 20 74 4" />
    {[[54, 12], [36, 22], [16, 30]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x},${y})`}>
        <path d="M0 0 c -4 -5 -1 -9 2 -7 c 1 -4 6 -4 7 0 c 3 -2 6 2 2 7 c 2 3 -1 6 -4 5 c -1 2 -5 2 -6 0 c -3 1 -6 -2 -1 -5 z" fill={CREAM} fillOpacity="0.95" />
        <path d="M0 0 c -4 -5 -1 -9 2 -7 c 1 -4 6 -4 7 0 c 3 -2 6 2 2 7 c 2 3 -1 6 -4 5 c -1 2 -5 2 -6 0 c -3 1 -6 -2 -1 -5 z" />
        <circle cx="4.5" cy="0" r="1.2" fill={GOLD} stroke="none" />
      </g>
    ))}
  </g>
);

/** Leafy divider — hairlines meeting a pair of leaves (replaces the rosette). */
const LeafDivider = ({ className = '', style }) => (
  <svg viewBox="0 0 120 24" className={className} style={{ color: GOLD, ...style }} aria-hidden>
    <g {...g({ strokeWidth: 1.1 })}>
      <path d="M0 12 H42 M78 12 H120" />
      <path d="M60 12 c -6 -8 -14 -8 -18 -4 c 6 6 14 6 18 4 z" />
      <path d="M60 12 c 6 -8 14 -8 18 -4 c -6 6 -14 6 -18 4 z" />
      <circle cx="60" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </g>
  </svg>
);

/** Wax seal (scalloped blob + double ring + initial). */
const WaxSeal = ({ initial = 'N', className = '', style }) => (
  <svg viewBox="0 0 96 96" className={className} style={style} aria-hidden>
    <defs>
      <radialGradient id="qz-wax" cx="38%" cy="32%" r="75%">
        <stop offset="0%" stopColor="#e9cf8f" />
        <stop offset="45%" stopColor="#c99d4e" />
        <stop offset="100%" stopColor="#93662a" />
      </radialGradient>
    </defs>
    <path
      d="M48 6 c8 -2 12 4 19 4 c7 0 11 6 10 13 c-1 6 5 9 5 16 c0 7 -6 10 -5 16 c1 7 -3 13 -10 13 c-7 0 -11 6 -19 4 c-8 2 -12 -4 -19 -4 c-7 0 -11 -6 -10 -13 c1 -6 -5 -9 -5 -16 c0 -7 6 -10 5 -16 c-1 -7 3 -13 10 -13 c7 0 11 -6 19 -4 z"
      fill="url(#qz-wax)" stroke="#7d5522" strokeWidth="1" />
    <circle cx="48" cy="48" r="27" fill="none" stroke="#7d5522" strokeOpacity="0.55" strokeWidth="1.4" />
    <circle cx="48" cy="48" r="30.5" fill="none" stroke="#f3e0ae" strokeOpacity="0.5" strokeWidth="1" />
    <text x="48" y="60" textAnchor="middle" fontSize="34" fill="#5d3f17"
      fontFamily="'Great Vibes','Dancing Script',cursive">{initial}</text>
  </svg>
);

/* ── Trilingual copy (Uzbek first, then Russian + English). ─────────────── */
const LANGS = ['uz', 'ru', 'en'] as const;
type Lang = typeof LANGS[number];
const LANG_LABEL: Record<Lang, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };
const DATE_LOCALE: Record<Lang, any> = { uz: uzLocale, ru: ruLocale, en: enLocale };

const COPY: Record<Lang, any> = {
  uz: {
    eventName: 'Biz Bazmi',
    gateReceived: 'Taklifnomangiz tayyor', gateUnlock: 'Ochish uchun muhrga bosing',
    dearGuests: 'Aziz mehmonlar',
    invite: [
      'Shodligimizga sherik boʻlishingizni va ushbu quvonchli kunda sizni davramizda koʻrishni chin dildan tilaymiz.',
      'Tashrifingiz biz uchun katta sharaf boʻladi.',
    ],
    countdownLabel: 'Bazmgacha qoldi',
    units: ['Kun', 'Soat', 'Daqiqa', 'Soniya'],
    details: 'Sana & Vaqt', saat: 'Soat',
    days: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
    galleryLabel: 'Xotiralarimiz', galleryTitle: 'Suratlar',
    konum: 'Manzil', mekan: 'Joy', openMap: 'Xaritada ochish',
    rsvpTitle: 'Ishtirok', rsvpSub: 'Iltimos, ishtirokingizni bildiring',
    gbLabel: 'Tilaklaringiz', gbTitle: 'Tilaklar Daftari',
    toyonaLabel: 'Toʻyona', toyonaTitle: 'Toʻyona',
    toyonaSub: 'Bazm egasini toʻyona bilan qutlamoqchi boʻlsangiz, ushbu kartaga yuborishingiz mumkin',
    toyonaCopy: 'Karta raqamini nusxalash', toyonaCopied: 'Nusxalandi!',
    closing: 'Sizni davramizda koʻrishdan mamnun boʻlamiz',
  },
  ru: {
    eventName: 'Биз базми',
    gateReceived: 'Ваше приглашение готово', gateUnlock: 'Нажмите на печать, чтобы открыть',
    dearGuests: 'Дорогие гости',
    invite: [
      'Мы от всего сердца желаем разделить с вами нашу радость и видеть вас среди нас в этот счастливый день.',
      'Ваш визит станет для нас честью.',
    ],
    countdownLabel: 'До торжества осталось',
    units: ['Дней', 'Часов', 'Минут', 'Секунд'],
    details: 'Дата & Время', saat: 'Время',
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    galleryLabel: 'Наши моменты', galleryTitle: 'Фотографии',
    konum: 'Место', mekan: 'Место проведения', openMap: 'Открыть на карте',
    rsvpTitle: 'Участие', rsvpSub: 'Пожалуйста, подтвердите ваше участие',
    gbLabel: 'Пожелания', gbTitle: 'Книга пожеланий',
    toyonaLabel: 'Туёна', toyonaTitle: 'Подарок',
    toyonaSub: 'Если вы хотите поздравить виновницу торжества денежным подарком, вы можете отправить его на эту карту',
    toyonaCopy: 'Скопировать номер карты', toyonaCopied: 'Скопировано!',
    closing: 'Будем рады видеть вас среди нас',
  },
  en: {
    eventName: 'Biz Bazmi',
    gateReceived: 'Your invitation is ready', gateUnlock: 'Tap the seal to open',
    dearGuests: 'Dear Guests',
    invite: [
      'With all our hearts we wish you to share our joy and to see you among us on this happy day.',
      'Your presence will be an honour for us.',
    ],
    countdownLabel: 'Counting down to the celebration',
    units: ['Days', 'Hours', 'Minutes', 'Seconds'],
    details: 'Date & Time', saat: 'Time',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    galleryLabel: 'Our Memories', galleryTitle: 'Photos',
    konum: 'Location', mekan: 'Venue', openMap: 'Open in Maps',
    rsvpTitle: 'RSVP', rsvpSub: 'Please let us know if you can join',
    gbLabel: 'Your Wishes', gbTitle: 'Wish Book',
    toyonaLabel: "To'yona", toyonaTitle: 'Celebration Gift',
    toyonaSub: 'If you would like to congratulate the celebrant with a monetary gift, you can send it to this card',
    toyonaCopy: 'Copy card number', toyonaCopied: 'Copied!',
    closing: 'We will be delighted to see you among us',
  },
};

export function BizBazmiTemplate({ wedding, photos = [] }: BizBazmiTemplateProps) {
  const { i18n } = useTranslation();

  const memoryPhotos = photos.filter((p: any) => p.photoType === 'memory');

  // Per-section visibility (admin toggles). Absent / true = shown; only `false` hides.
  const sectionFlags = (wedding?.sections || {}) as Record<string, boolean>;
  const show = (key: string) => sectionFlags[key] !== false;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const musicRef = useRef<AzamatScrollMusicHandle | null>(null);

  // Uzbek-first; the switcher also flips the shared RSVP / guest-book forms.
  const initialLang: Lang = (LANGS as readonly string[]).includes(wedding?.defaultLanguage || '')
    ? (wedding!.defaultLanguage as Lang) : 'uz';
  const [lang, setLang] = useState<Lang>(initialLang);
  const c = COPY[lang];
  const switchLang = (code: Lang) => {
    setLang(code);
    i18n.changeLanguage(code);
    try { localStorage.setItem('language', code); } catch {}
  };
  useEffect(() => {
    if (i18n.language !== initialLang) i18n.changeLanguage(initialLang);
  }, []); // once

  // Sealed-envelope opening: tap the wax seal to break it and open the invitation.
  const [locked, setLocked] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const handleUnlock = () => {
    if (unlocking) return;
    musicRef.current?.startPlayback();
    setUnlocking(true);
    setTimeout(() => setLocked(false), 800);
  };

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: SAGE, color: OLIVE }}>
        <p>Yuklanmoqda…</p>
      </div>
    );
  }

  // Only the bride / celebrant is named on this template.
  const name = (wedding.bride || '').trim();
  const initial = (name.charAt(0) || 'N').toUpperCase();
  const timeText = normalizeTime(wedding.weddingTime) || '18:00';

  const dateObj = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
  const dottedDate = dateObj ? format(dateObj, 'dd.MM.yyyy') : '';
  const monthLabel = dateObj ? format(dateObj, 'LLLL yyyy', { locale: DATE_LOCALE[lang] || uzLocale }) : '';

  /* Month calendar grid (Mon-first) with the celebration day highlighted. */
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

  return (
    <div className="qz min-h-screen overflow-x-hidden" style={{ background: SAGE }}>
      <style>{`
        .qz { font-family: 'Cormorant Garamond','Playfair Display',serif; color: ${INK}; }
        .qz-script { font-family: 'Dancing Script','Ephesis','Great Vibes',cursive; }
        .qz-display { font-family: 'Playfair Display','Cormorant Garamond',serif; }
        .qz-label { font-family: 'Marcellus','Cormorant Garamond',serif; text-transform: uppercase; letter-spacing: 0.34em; }
        .qz-gold { color: ${GOLD}; }
        .qz-gold-text {
          background: linear-gradient(100deg,#8a6a34,#cfa95e 34%,#ecd9a4 50%,#c69d52 66%,#8a6a34);
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
        }
        .qz-olive-text {
          background: linear-gradient(115deg,${OLIVE_D},${OLIVE} 45%,#77894e 60%,${OLIVE_D});
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
        }
        /* watercolor sage canvas — soft washes + faint scattered leaves */
        /* NOTE: .qz-canvas sets no 'position' — it would override Tailwind's
           'fixed' on the envelope gate; each element brings relative/fixed. */
        .qz-canvas::before {
          content:''; position:absolute; inset:0; pointer-events:none; opacity:0.5;
          background:
            radial-gradient(42% 30% at 12% 18%, ${SAGE_D}66, transparent 70%),
            radial-gradient(36% 26% at 88% 30%, ${SAGE_D}59, transparent 70%),
            radial-gradient(46% 32% at 30% 82%, ${SAGE_D}4d, transparent 70%),
            radial-gradient(30% 22% at 76% 74%, ${SAGE_D}61, transparent 70%);
        }
        .qz-canvas::after {
          content:''; position:absolute; inset:0; pointer-events:none; opacity:0.55;
          background-image:url("data:image/svg+xml,${leafTile}");
          background-size:120px 120px;
        }
        .qz-cream { background: ${CREAM}; color: ${INK}; }
        .qz-frame { border: 1px solid rgba(179,137,62,0.5); box-shadow: inset 0 0 0 4px rgba(85,102,58,0.05), inset 0 0 0 5px rgba(179,137,62,0.3), 0 18px 44px rgba(61,74,41,0.12); }
        .qz-btn { border:1px solid ${GOLD}; color:#8a6a34; transition:all .3s; }
        .qz-btn:hover { background:${GOLD}; color:${CREAM}; }
        .qz-cal td { text-align:center; padding:6px 0; font-family:'Cormorant Garamond',serif; color:#54603a; font-size:15px; }
        .qz-cal th { color:#9aa377; font-weight:400; font-size:11px; font-family:'Marcellus',serif; letter-spacing:.08em; padding-bottom:6px; }
        .qz-cal .on { color:${OLIVE_D}; border:1.5px solid ${GOLD}; background:rgba(179,137,62,0.14); border-radius:999px; display:inline-flex; width:30px; height:30px; align-items:center; justify-content:center; font-weight:600; }
        @keyframes qz-sway { 0%,100%{ transform: rotate(-2.5deg) } 50%{ transform: rotate(2.5deg) } }
        .qz-sway { transform-origin: top center; animation: qz-sway 6s ease-in-out infinite; }
        @keyframes qz-pulse { 0%,100%{ transform:scale(1); filter:drop-shadow(0 6px 14px rgba(125,85,34,0.45)) } 50%{ transform:scale(1.05); filter:drop-shadow(0 10px 22px rgba(125,85,34,0.6)) } }
        .qz-pulse { animation: qz-pulse 2.4s ease-in-out infinite; }
        @keyframes qz-crack { 0%{ transform:scale(1); opacity:1 } 100%{ transform:scale(1.6); opacity:0 } }
        .qz-crack { animation: qz-crack .7s ease-out forwards; }
        @media (prefers-reduced-motion: reduce){ .qz-sway,.qz-pulse{ animation:none } }
      `}</style>

      <AzamatScrollMusic
        ref={musicRef}
        musicUrl={wedding.backgroundMusicUrl ?? ''}
        theme={{ primary: GOLD, accent: OLIVE, iconColor: CREAM, glow: 'rgba(179,137,62,0.5)' }}
      />

      {/* ── Language switcher (top-right; above the gate so it works while sealed) ── */}
      <div className="fixed top-4 right-4 z-[90] flex gap-1.5">
        {LANGS.map((code) => (
          <button key={code} onClick={() => switchLang(code)}
            className="w-9 h-9 rounded-full text-[11px] tracking-wider transition-all backdrop-blur-md"
            style={lang === code
              ? { background: OLIVE, color: CREAM, fontWeight: 600 }
              : { background: 'rgba(85,102,58,0.14)', color: OLIVE_D }}>
            {LANG_LABEL[code]}
          </button>
        ))}
      </div>

      {/* ════════════ SEALED ENVELOPE GATE — tap the wax seal to open ════════════ */}
      {locked && (
        <div className={`qz-canvas fixed inset-0 z-[70] flex items-center justify-center text-center px-6 transition-opacity duration-700 ${unlocking ? 'opacity-0' : 'opacity-100'}`}
          style={{ background: SAGE }}>
          {/* painted florals in the corners */}
          <Bouquet className="absolute -top-4 -left-6 w-48 sm:w-64 h-auto opacity-80 rotate-[170deg]" />
          <Orchid className="absolute bottom-8 right-2 w-40 sm:w-56 h-auto opacity-70" />
          <Amaranth className="qz-sway absolute top-0 left-6 sm:left-16 w-10 sm:w-12 h-auto opacity-70" />

          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
            className="relative z-10 max-w-md w-full flex flex-col items-center">
            <p className="qz-label text-[10px] sm:text-[11px] mb-6" style={{ color: '#8a6a34' }}>{c.gateReceived}</p>

            {/* the deep-green envelope */}
            <div className="relative w-[min(88vw,340px)]">
              <svg viewBox="0 0 340 230" className="w-full h-auto" style={{ filter: 'drop-shadow(0 22px 40px rgba(61,74,41,0.35))' }} aria-hidden>
                <rect x="6" y="10" width="328" height="212" rx="10" fill={OLIVE} />
                <rect x="6" y="10" width="328" height="212" rx="10" fill="url(#qz-env-tex)" opacity="0.25" />
                <defs>
                  <linearGradient id="qz-env-tex" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7b8c53" />
                    <stop offset="55%" stopColor="transparent" />
                    <stop offset="100%" stopColor="#2e3a1e" />
                  </linearGradient>
                </defs>
                {/* flap */}
                <path d="M6 22 L170 132 L334 22" fill="none" stroke={OLIVE_D} strokeWidth="2.5" opacity="0.85" />
                <path d="M6 216 L128 128 M334 216 L212 128" fill="none" stroke={OLIVE_D} strokeWidth="2" opacity="0.55" />
              </svg>
              {/* wax seal button on the flap point */}
              {!unlocking ? (
                <button type="button" onClick={handleUnlock} aria-label={c.gateUnlock}
                  className="qz-pulse absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88px] h-[88px] rounded-full"
                  style={{ top: '57%', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <WaxSeal initial={initial} className="w-full h-full" />
                </button>
              ) : (
                <div className="qz-crack absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88px] h-[88px]" style={{ top: '57%' }}>
                  <WaxSeal initial={initial} className="w-full h-full" />
                </div>
              )}
            </div>

            <h1 className="qz-script qz-olive-text text-5xl sm:text-6xl leading-[1.05] mt-8">{name}</h1>
            <p className="qz-display text-base sm:text-lg tracking-[0.32em] mt-2" style={{ color: '#8a6a34' }}>
              {c.eventName.toUpperCase()}
            </p>
            <LeafDivider className="w-36 h-auto my-4" />
            <p className="qz-display text-xl sm:text-2xl tracking-[0.12em]" style={{ color: INK }}>{dottedDate}</p>
            <p className="qz-label text-[10px] mt-2 mb-6" style={{ color: '#8a6a34' }}>{c.saat} {timeText}</p>
            <p className="qz-label text-[10px]" style={{ color: OLIVE }}>{c.gateUnlock}</p>
          </motion.div>
        </div>
      )}

      {/* ════════════ HERO — opened invitation card on the sage canvas ════════════ */}
      <header className="qz-canvas relative overflow-hidden px-5 pt-14 pb-16">
        {/* trailing amaranth strands down the edges (like the bouquet) */}
        <Amaranth className="qz-sway absolute top-0 left-3 sm:left-12 w-10 sm:w-12 h-auto opacity-70 z-0" />
        <Amaranth className="qz-sway absolute top-0 right-3 sm:right-12 w-10 sm:w-12 h-auto opacity-70 z-0" style={{ animationDelay: '1.4s' }} />
        <Eucalyptus className="absolute -left-2 bottom-4 w-8 sm:w-10 h-auto opacity-60 z-0" />
        <Eucalyptus className="absolute -right-2 bottom-4 w-8 sm:w-10 h-auto opacity-60 z-0 -scale-x-100" />

        <div className="relative z-10 max-w-xl mx-auto text-center">
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible"
            className="qz-cream qz-frame relative rounded-[20px] px-6 sm:px-10 pt-12 pb-10 max-w-[380px] mx-auto">
            {/* bouquet crowning the card */}
            <Bouquet className="absolute left-1/2 -translate-x-1/2 -top-12 w-40 sm:w-44 h-auto" />
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-8 h-8">
              <WaxSeal initial={initial} className="w-full h-full" />
            </div>

            <p className="qz-label text-[9px] tracking-[0.4em] mt-4 mb-3" style={{ color: '#8a6a34' }}>{c.eventName}</p>
            <h1 className="qz-script text-5xl sm:text-6xl leading-[1.02] mb-1" style={{ color: OLIVE_D }}>{name}</h1>

            <LeafDivider className="w-36 h-auto mx-auto my-4" />

            <p className="qz-display text-2xl sm:text-3xl tracking-[0.12em]" style={{ color: INK }}>{dottedDate}</p>
            <p className="qz-label text-[10px] mt-2" style={{ color: '#8a6a34' }}>{c.saat} {timeText}</p>

            <div className="flex items-end justify-center gap-3 mt-6">
              <Calla className="w-5 h-auto" />
              <Orchid className="w-16 h-auto" />
              <Calla className="w-5 h-auto -scale-x-100" />
            </div>
          </motion.div>
        </div>
      </header>

      {/* ════════════ AZIZ MEHMONLAR ════════════ */}
      {show('dearGuests') && (
        <section className="qz-canvas relative px-5 py-16 sm:py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="qz-cream qz-frame relative max-w-2xl mx-auto rounded-[18px] px-7 sm:px-12 py-12 text-center">
            <Calla className="w-7 h-auto mx-auto mb-4" />
            <p className="qz-label text-[11px] mb-6" style={{ color: '#8a6a34' }}>{c.dearGuests}</p>
            {wedding.dearGuestMessage ? (
              <p className="text-lg sm:text-xl leading-relaxed whitespace-pre-wrap" style={{ color: '#4a5232' }}>
                {wedding.dearGuestMessage}
              </p>
            ) : (
              <div className="text-lg sm:text-xl leading-relaxed space-y-4" style={{ color: '#4a5232' }}>
                <p>{c.invite[0]}</p>
                <p>{c.invite[1]}</p>
              </div>
            )}
            {wedding.dressCode && (
              <p className="mt-6 text-base italic" style={{ color: OLIVE }}>{wedding.dressCode}</p>
            )}
            <div className="mt-8"><LeafDivider className="w-40 h-auto mx-auto" /></div>
            <p className="qz-script text-4xl sm:text-5xl mt-4" style={{ color: OLIVE_D }}>{name}</p>
          </motion.div>
        </section>
      )}

      {/* ════════════ SANOQ ════════════ */}
      {show('countdown') && (
        <section className="qz-canvas relative px-5 py-16 sm:py-20">
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <p className="qz-label text-[11px] mb-2" style={{ color: OLIVE }}>{c.countdownLabel}</p>
            <LeafDivider className="w-40 h-auto mx-auto mb-8" />
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md mx-auto">
              {[timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((v, idx) => (
                <div key={idx} className="qz-cream qz-frame rounded-2xl py-4 sm:py-5">
                  <div className="qz-display text-3xl sm:text-4xl tabular-nums" style={{ color: OLIVE_D }}>{String(v).padStart(2, '0')}</div>
                  <div className="qz-label text-[8px] sm:text-[9px] mt-1.5" style={{ color: '#8a6a34' }}>{c.units[idx]}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════ SANA & VAQT (+ taqvim) ════════════ */}
      {show('details') && (
        <section className="qz-canvas relative px-5 py-16 sm:py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="qz-cream qz-frame max-w-xl mx-auto rounded-[18px] px-7 sm:px-12 py-12 text-center">
            <p className="qz-label text-[11px] mb-5" style={{ color: '#8a6a34' }}>{c.details}</p>
            <p className="qz-display text-4xl sm:text-5xl tracking-[0.1em]" style={{ color: OLIVE_D }}>{dottedDate}</p>
            <p className="qz-label text-xs mt-3" style={{ color: '#8a6a34' }}>{c.saat} {timeText}</p>

            {calendar && (
              <div className="mt-10">
                <p className="qz-label text-xs mb-4" style={{ color: '#54603a' }}>{monthLabel}</p>
                <table className="qz-cal w-full max-w-sm mx-auto">
                  <thead><tr>{c.days.map((d: string, di: number) => <th key={di}>{d}</th>)}</tr></thead>
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
            <div className="mt-8"><LeafDivider className="w-40 h-auto mx-auto" /></div>
          </motion.div>
        </section>
      )}

      {/* ════════════ SURATLAR ════════════ */}
      {memoryPhotos.length > 0 && show('gallery') && (
        <section className="qz-canvas relative px-5 py-16 sm:py-20">
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="qz-label text-[11px] mb-2" style={{ color: OLIVE }}>{c.galleryLabel}</p>
              <h2 className="qz-script qz-olive-text text-5xl sm:text-6xl">{c.galleryTitle}</h2>
              <LeafDivider className="w-40 h-auto mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {memoryPhotos.map((photo: any, i: number) => (
                <motion.div key={photo.id ?? i} variants={fadeUp} custom={i % 3} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="aspect-square overflow-hidden rounded-2xl border bg-white" style={{ borderColor: 'rgba(179,137,62,0.4)' }}>
                  <img src={photo.url} alt={photo.caption || ''} loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════ MANZIL ════════════ */}
      {show('location') && (
        <section className="qz-canvas relative px-5 py-16 sm:py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="qz-cream qz-frame relative max-w-3xl mx-auto rounded-[18px] px-6 sm:px-10 py-12">
            <div className="text-center mb-8">
              <p className="qz-label text-[11px] mb-2" style={{ color: '#8a6a34' }}>{c.konum}</p>
              <h2 className="qz-script text-4xl sm:text-5xl" style={{ color: OLIVE_D }}>{wedding.venue || c.mekan}</h2>
              {addressText && (
                <p className="flex items-start justify-center gap-2 text-sm sm:text-base mt-4" style={{ color: '#54603a' }}>
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GOLD }} /> {addressText}
                </p>
              )}
              <LeafDivider className="w-40 h-auto mx-auto mt-5" />
            </div>
            {embedSrc && (
              <div className="rounded-2xl overflow-hidden border mb-6" style={{ borderColor: 'rgba(179,137,62,0.4)' }}>
                <iframe title="Xarita" src={embedSrc} className="w-full min-h-[280px]"
                  style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
            {hasMap && (
              <div className="text-center">
                <button onClick={openMap} className="qz-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-full qz-label text-xs">
                  <MapPin className="w-4 h-4" /> {c.openMap} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* ════════════ ISHTIROK (RSVP) ════════════ */}
      {show('rsvp') && (
        <section id="rsvp" className="qz-canvas relative px-5 py-16 sm:py-20">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="qz-label text-[11px] mb-2" style={{ color: OLIVE }}>L.C.V.</p>
              <h2 className="qz-script qz-olive-text text-5xl sm:text-6xl">{c.rsvpTitle}</h2>
              <p className="text-sm mt-3" style={{ color: '#54603a' }}>{c.rsvpSub}</p>
            </div>
            <div className="qz-cream qz-frame rounded-[18px] p-6 sm:p-10">
              <EpicRSVPForm wedding={wedding} primaryColor={OLIVE} accentColor={GOLD} labelColor="text-[#4a5232]" />
            </div>
          </div>
        </section>
      )}

      {/* ════════════ TO'YONA ════════════ */}
      {show('toyona') && !!wedding.cardNumber && (
        <section id="toyona" className="qz-canvas relative px-5 py-16 sm:py-20">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="qz-label text-[11px] mb-2" style={{ color: OLIVE }}>{c.toyonaLabel}</p>
              <h2 className="qz-script qz-olive-text text-4xl sm:text-5xl">{c.toyonaTitle}</h2>
              <p className="text-sm mt-3" style={{ color: '#54603a' }}>{c.toyonaSub}</p>
            </div>
            <div className="qz-cream qz-frame rounded-[18px] p-6 sm:p-9 text-center">
              <ToyonaCard
                cardHolderName={wedding.cardHolderName}
                cardNumber={wedding.cardNumber}
                accent={OLIVE}
                surface="light"
                copyLabel={c.toyonaCopy}
                copiedLabel={c.toyonaCopied}
              />
            </div>
          </div>
        </section>
      )}

      {/* ════════════ TILAKLAR DAFTARI ════════════ */}
      {show('guestbook') && (
        <section id="guestbook" className="qz-canvas relative px-5 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <p className="qz-label text-[11px] mb-2" style={{ color: OLIVE }}>{c.gbLabel}</p>
              <h2 className="qz-script qz-olive-text text-4xl sm:text-5xl">{c.gbTitle}</h2>
            </div>
            <div className="qz-cream qz-frame rounded-[18px] p-6 sm:p-9">
              <GuestBookForm weddingId={wedding.id} primaryColor={OLIVE} accentColor={GOLD} surface="light" />
            </div>
            {guestBookEntries.length > 0 && (
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {guestBookEntries.slice(0, 6).map((e: any) => (
                  <div key={e.id} className="qz-cream qz-frame rounded-2xl p-6">
                    <p className="italic" style={{ color: '#4a5232' }}>“{e.message}”</p>
                    <p className="qz-label text-[11px] mt-3" style={{ color: '#8a6a34' }}>— {e.guestName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════════════ FOOTER ════════════ */}
      <footer className="qz-canvas relative px-5 pt-16 pb-10 text-center" style={{ background: `linear-gradient(180deg, ${SAGE}, ${SAGE_D})` }}>
        <div className="relative z-10 max-w-md mx-auto">
          {show('orderCta') && <OrderInvitationCTA accent={OLIVE} surface="light" className="mb-12" />}
          <Bouquet className="w-36 h-auto mx-auto mb-4" />
          <p className="qz-script qz-olive-text text-5xl mb-2">{name}</p>
          <p className="qz-label text-[11px]" style={{ color: OLIVE }}>{c.closing}</p>
          <LeafDivider className="w-40 h-auto mx-auto mt-6" />
          <p className="qz-label text-[10px] mt-4" style={{ color: 'rgba(65,72,47,0.5)' }}>— {c.eventName} —</p>
        </div>
      </footer>
    </div>
  );
}

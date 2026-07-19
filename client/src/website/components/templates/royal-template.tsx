// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { uz, ru, enUS, kk } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EpicRSVPForm } from '@/website/components/epic-rsvp-form';
import { OrderInvitationCTA } from '@/website/components/order-invitation-cta';
import { GuestBookForm } from '@/website/components/guest-book-form';
import { AzamatScrollMusic, type AzamatScrollMusicHandle } from '@/website/components/azamat-scroll-music';
import { ToyonaCard } from '@/website/components/toyona-card';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, GuestBookEntry } from '@shared/schema';
import { isTwinWedding } from '@/lib/couples';
import './royal-template.css';

/* ─────────────────────────────────────────────────────────────────────────
 * ROYAL ("Royal 💌") — a faithful port of the InviteStudio navy-and-gold
 * wax-seal envelope invitation (shukurulla-va-munisaxon.vercel.app).
 *
 * The visual layer is the reference's own stylesheet, scoped under `.rylx`
 * (see royal-template.css), driven here by real wedding data: the couple, the
 * date, the venue + maps, a live countdown, the language switch and the admin
 * section toggles. Decorative art (gold seal, navy cartouche, palace + rings
 * line-art, gold heart) is self-hosted under /public/royal/.
 * ──────────────────────────────────────────────────────────────────────── */

const NAVY = '#112250';
const GOLD = '#cea869';

interface RoyalTemplateProps {
  wedding: Wedding;
  photos?: any[];
}

/* Reference decorative copy, per language (ru/uz mirror the original; en added). */
const COPY: Record<string, any> = {
  ru: {
    top: 'ВЫ', middle: 'ПРИГЛАШЕНЫ', script: 'на свадьбу', withLove: 'с любовью,', open: 'нажмите',
    blessing: 'Аллах объединил их сердца любовью<br/>(сура «Аль-Анфаль», аят 63)',
    welcome: 'Дорогие&nbsp;наши<br/>родные&nbsp;и&nbsp;<span class="no-break">близкие!</span>',
    lead: 'В этот прекрасный день мы соединяем наши сердца и начинаем новую историю - историю нашей любви.<br/><br/>Будем счастливы разделить радость этого особенного момента вместе с вами.<br/><br/><strong>С любовью приглашаем вас на нашу свадьбу.</strong>',
    scroll: 'Листайте вниз', location: 'Место проведения', yandex: 'Яндекс Карты', google: 'Google Maps',
    countdown: 'Считаем каждое мгновение', waiting: 'Мы ждём вас.', today: 'Этот день настал. Мы ждём вас.',
    units: ['Дней', 'Часов', 'Минут', 'Секунд'], weekdays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'], amp: 'и',
  },
  uz: {
    top: 'SIZ', middle: "TO'YIMIZGA", script: 'taklif etilgansiz', withLove: 'muhabbat ila,', open: 'ochish',
    blessing: 'Alloh ularni qalbini sevgi ila birlashtirdi<br/>(Anfol surasi, 63-oyat)',
    welcome: 'Aziz&nbsp;va&nbsp;qadrdon<br/><span class="no-break">insonimiz!</span>',
    lead: "Hayotimizdagi eng baxtli kunlardan biri - nikoh to'yimizni siz bilan birga nishonlashni niyat qildik.<br/><br/>Sizni ushbu kechamizga samimiy taklif etamiz.<br/><br/><strong>Quvonchli kunimizda aziz mehmonimiz bo'lishingizni intizorlik bilan kutamiz.</strong>",
    scroll: 'Pastga suring', location: "To'y manzili", yandex: 'Yandex xaritasi', google: 'Google Maps',
    countdown: 'Har lahzani sanayapmiz', waiting: 'Sizni intiqlik bilan kutamiz.', today: "Bugun aynan o'sha kun. Sizni kutamiz.",
    units: ['Kun', 'Soat', 'Daqiqa', 'Soniya'], weekdays: ['DU', 'SE', 'CHOR', 'PAY', 'JU', 'SHA', 'YA'], amp: 'va',
  },
  en: {
    top: 'YOU ARE', middle: 'INVITED', script: 'to our wedding', withLove: 'with love,', open: 'open',
    blessing: 'And He united their hearts with love<br/>(Surah Al-Anfal, verse 63)',
    welcome: 'Dear&nbsp;family<br/>and&nbsp;<span class="no-break">friends!</span>',
    lead: 'On this beautiful day we join our hearts and begin a new story — the story of our love.<br/><br/>We would be delighted to share the joy of this special moment with you.<br/><br/><strong>With love, we invite you to our wedding.</strong>',
    scroll: 'Scroll down', location: 'Venue', yandex: 'Yandex Maps', google: 'Google Maps',
    countdown: 'Counting every moment', waiting: 'We are waiting for you.', today: 'The day has come. We are waiting for you.',
    units: ['Days', 'Hours', 'Minutes', 'Seconds'], weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], amp: '&',
  },
};

export function RoyalTemplate({ wedding, photos = [] }: RoyalTemplateProps) {
  const { t, i18n } = useTranslation();
  const twin = isTwinWedding(wedding);

  const couplePhotos = photos.filter((p: any) => p.photoType === 'couple');
  const memoryPhotos = photos.filter((p: any) => p.photoType === 'memory');
  const heroDesignated = photos.filter((p: any) => p.photoType === 'hero' || p.isHero);
  const toyxonaPhotos = photos.filter((p: any) => p.photoType === 'toyxona');
  const uploadedHero = wedding.couplePhotoUrl || couplePhotos[0]?.url || heroDesignated[0]?.url || null;
  const albumPhotos = Array.from(new Set([
    uploadedHero, ...memoryPhotos.map((p: any) => p.url), ...toyxonaPhotos.map((p: any) => p.url),
  ].filter(Boolean))).slice(0, 6);

  const sectionFlags = (wedding.sections || {}) as Record<string, boolean>;
  const show = (key: string) => sectionFlags[key] !== false;

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [opened, setOpened] = useState(false);   // seal clicked → flaps animate
  const [visible, setVisible] = useState(false);  // invitation faded in
  const [introGone, setIntroGone] = useState(false);
  const musicRef = useRef<AzamatScrollMusicHandle | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const lang = ['ru', 'uz', 'en'].includes(i18n.language) ? i18n.language : (i18n.language === 'kk' || i18n.language === 'kaa' ? 'uz' : 'en');
  const c = COPY[lang] || COPY.ru;

  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      i18n.changeLanguage(wedding.defaultLanguage);
    }
  }, []);

  // countdown
  useEffect(() => {
    if (!wedding?.weddingDate) return;
    const tick = () => setTimeLeft(calculateWeddingCountdown(
      wedding.weddingDate, wedding.weddingTime || '18:00', wedding.timezone || 'Asia/Tashkent'));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [wedding?.weddingDate, wedding?.weddingTime, wedding?.timezone]);

  // scroll-reveal (ported from the reference's revealVisibleSections)
  useEffect(() => {
    const nodes = rootRef.current?.querySelectorAll('.reveal');
    if (!nodes || !nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(n => n.classList.add('visible'));
      return;
    }
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    nodes.forEach((n, i) => { (n as HTMLElement).style.transitionDelay = `${Math.min(i * 90, 360)}ms`; obs.observe(n); });
    return () => obs.disconnect();
  }, []);

  const { data: guestBookEntries = [] } = useQuery<GuestBookEntry[]>({
    queryKey: ['/api/guest-book/wedding', wedding?.id],
    queryFn: () => fetch(`/api/guest-book/wedding/${wedding?.id}`).then(r => r.json()),
    enabled: !!wedding?.id,
  });

  const openInvitation = () => {
    if (opened) return;
    musicRef.current?.startPlayback();
    setOpened(true);
    setTimeout(() => setVisible(true), 1000);
    setTimeout(() => setIntroGone(true), 1900);
  };

  const getDateLocale = () => (lang === 'uz' ? uz : lang === 'ru' ? ru : lang === 'kk' ? kk : enUS);

  if (!wedding) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fffdf6', color: NAVY }}><p>{t('common.loading')}</p></div>;
  }

  const dateObj = wedding.weddingDate ? new Date(wedding.weddingDate) : null;
  const dd = dateObj ? format(dateObj, 'dd') : '29';
  const mm = dateObj ? format(dateObj, 'MM') : '03';
  const yy = dateObj ? format(dateObj, 'yy') : '26';
  const monthLabel = (() => {
    if (!dateObj) return '';
    const s = format(dateObj, 'LLLL, yyyy', { locale: getDateLocale() });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  // Wedding week (Mon–Sun containing the wedding day), with the day as a gold heart.
  const week = (() => {
    if (!dateObj) return null;
    const wd = (dateObj.getDay() + 6) % 7; // Mon=0
    const monday = new Date(dateObj); monday.setDate(dateObj.getDate() - wd);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i); return d.getDate();
    });
    return { days, weddingDay: dateObj.getDate() };
  })();

  // map links
  const isUrl = (s?: string | null) => !!s && /^https?:\/\//i.test(s.trim());
  const mapPin = (wedding.mapPinUrl || '').trim();
  const coords = wedding.venueCoordinates as { lat: number; lng: number } | null;
  const addressText = !isUrl(wedding.venueAddress) ? (wedding.venueAddress || '') : '';
  const venueText = !isUrl(wedding.venue) ? (wedding.venue || '') : '';
  const cleanName = venueText.replace(/[«»""„"]/g, '').trim();
  const placeQuery = coords ? `${coords.lat},${coords.lng}` : (addressText || cleanName || '');
  const googleHref = (isUrl(mapPin) && !/yandex\./i.test(mapPin))
    ? mapPin
    : (placeQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}` : '');
  const yandexHref = (isUrl(mapPin) && /yandex\./i.test(mapPin))
    ? mapPin
    : (placeQuery ? `https://yandex.com/maps/?text=${encodeURIComponent(placeQuery)}` : '');
  const hasMap = !!(googleHref || yandexHref);

  const langCodes = Array.from(new Set([...(wedding.availableLanguages || []), 'ru', 'uz']))
    .filter(x => ['uz', 'ru', 'en', 'kk', 'kaa'].includes(x));
  const langLabel: Record<string, string> = { uz: 'UZ', ru: 'RU', en: 'EN', kk: 'KK', kaa: 'QR' };
  const switchLang = (x: string) => { i18n.changeLanguage(x); try { localStorage.setItem('language', x); } catch {} };

  const names = { first: wedding.groom || '', second: wedding.bride || '' };

  return (
    <div ref={rootRef} className={`rylx ${visible ? 'invitation-visible' : ''}`}>
      <AzamatScrollMusic ref={musicRef} musicUrl={wedding.backgroundMusicUrl ?? ''}
        theme={{ primary: NAVY, accent: GOLD, iconColor: '#fffdf6', glow: 'rgba(206,168,105,0.5)' }} />

      {/* language switcher */}
      <nav className="language-switcher" aria-label="Language">
        {langCodes.map(x => (
          <button key={x} type="button" onClick={() => switchLang(x)}
            className={`language-option ${i18n.language === x ? 'is-active' : ''}`}
            aria-pressed={i18n.language === x}>{langLabel[x] || x.toUpperCase()}</button>
        ))}
      </nav>

      {/* ════════ ENVELOPE COVER ════════ */}
      {!introGone && (
        <section className={`intro ${opened ? 'opened' : ''} ${visible ? 'fade-out' : ''}`} id="intro">
          <div className="envelope-stage">
            <div className="flap flap-top">
              <p className="flap-note">
                <span className="flap-note-top">{c.top}</span>
                <span className="flap-note-middle">{c.middle}</span>
                <span className="flap-note-script">{c.script}</span>
              </p>
            </div>
            <div className="flap flap-left" />
            <div className="flap flap-right" />
            <div className="flap flap-bottom">
              <p className="flap-signature">
                <span>{c.withLove}</span><br />
                <strong>{names.first}&nbsp;{c.amp}&nbsp;{names.second}</strong>
              </p>
            </div>
            <button className="seal-button" type="button" onClick={openInvitation} aria-label={c.open}>
              <span>{c.open}</span>
            </button>
          </div>
        </section>
      )}

      {/* ════════ INVITATION ════════ */}
      <main className="invitation">
        {/* hero cartouche */}
        <section className="letter-hero reveal" id="letterHero">
          <article className="ornament-hero" role="img" aria-label={`${names.first} & ${names.second}`}>
            <div className="ornament-content">
              <p className="ornament-names">
                <span className="ornament-name-line">{names.first}</span>
                <span className="ornament-name-amp">{c.amp}</span>
                <span className="ornament-name-line">{names.second}</span>
              </p>
              <p className="ornament-message" dangerouslySetInnerHTML={{ __html: c.blessing }} />
              <div className="ornament-date" aria-hidden="true">
                <span>{dd}</span><i></i><span>{mm}</span><i></i><span>{yy}</span>
              </div>
            </div>
          </article>
          <div className="scroll-indicator" aria-hidden="true">
            <span className="scroll-indicator__text">{c.scroll}</span>
            <span className="scroll-indicator__arrow">↓</span>
          </div>
        </section>

        {/* welcome */}
        <section className="letter-card reveal" id="letterCard">
          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: c.welcome }} />
          {wedding.dearGuestMessage ? (
            <p className="lead" style={{ whiteSpace: 'pre-wrap' }}>{wedding.dearGuestMessage}</p>
          ) : (
            <p className="lead" dangerouslySetInnerHTML={{ __html: c.lead }} />
          )}
        </section>

        {/* calendar (wedding week, heart on the day) */}
        {week && (
          <section className="calendar-section reveal" aria-label={monthLabel}>
            <div className="calendar" role="img" aria-label={monthLabel}>
              <div className="calendar-head"><span>{monthLabel}</span></div>
              <div className="calendar-grid week-days">
                {c.weekdays.map((w: string, i: number) => <span key={i}>{w}</span>)}
              </div>
              <div className="calendar-grid days">
                {week.days.map((d: number, i: number) => (
                  d === week.weddingDay
                    ? <div key={i} className="heart-cell" aria-label={c.scroll}><span className="heart-day"><span>{d}</span></span></div>
                    : <span key={i}>{d}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* venue (palace line-art via CSS ::before) */}
        {show('location') && (
          <section className="location-section reveal" aria-label={c.location}>
            <h2 className="location-title">{c.location}</h2>
            <p className="venue-name">{wedding.venue || t('details.venueTBD')}</p>
            {addressText && <p className="venue-address">{addressText}</p>}
            {hasMap && (
              <div className="map-links">
                {yandexHref && <a className="map-link" href={yandexHref} target="_blank" rel="noopener noreferrer"><span>{c.yandex}</span></a>}
                {googleHref && <a className="map-link" href={googleHref} target="_blank" rel="noopener noreferrer"><span>{c.google}</span></a>}
              </div>
            )}
          </section>
        )}

        {/* countdown (rings line-art via CSS ::after) */}
        {show('countdown') && (
          <section className="countdown-section reveal" aria-label={c.countdown}>
            <h2>{c.countdown}</h2>
            <div className="countdown" role="timer" aria-live="polite">
              {[timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((v, i) => (
                <div className="time-unit" key={i}>
                  <span>{String(v).padStart(2, '0')}</span>
                  <small>{c.units[i]}</small>
                </div>
              ))}
            </div>
            <p className="countdown-message">{(timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds) <= 0 ? c.today : c.waiting}</p>
          </section>
        )}

        {/* ─── app sections, themed to match (navy + gold on ivory) ─── */}
        {albumPhotos.length > 0 && show('gallery') && (
          <section className="rylx-extra reveal" aria-label="Album">
            <h2 className="rylx-extra-title">{t('wedding.memoryPhotos', 'Album')}</h2>
            {albumPhotos.length === 1 ? (
              /* A single photo is shown large (like the Floral template). */
              <div className="rylx-photo-single"><img src={albumPhotos[0]} alt="" loading="lazy" /></div>
            ) : (
              <div className="rylx-grid">
                {albumPhotos.map((url: string, i: number) => (
                  <div className="rylx-photo" key={i}><img src={url} alt="" loading="lazy" /></div>
                ))}
              </div>
            )}
          </section>
        )}

        {show('rsvp') && (
          <section className="rylx-extra reveal" id="rsvp">
            <h2 className="rylx-extra-title">{t('imperial.rsvp.title', 'RSVP')}</h2>
            <div className="rylx-card"><EpicRSVPForm wedding={wedding} primaryColor={NAVY} accentColor={GOLD} labelColor="text-[#112250]" /></div>
          </section>
        )}

        {show('toyona') && !!wedding.cardNumber && (
          <section className="rylx-extra reveal" id="toyona">
            <h2 className="rylx-extra-title">{t('toyona.title', "To'yona")}</h2>
            <p className="rylx-extra-sub">{t('toyona.message', '')}</p>
            <div className="rylx-card"><ToyonaCard cardHolderName={wedding.cardHolderName} cardNumber={wedding.cardNumber} accent={NAVY} surface="light" /></div>
          </section>
        )}

        {show('guestBook') && (
          <section className="rylx-extra reveal" id="guestbook">
            <h2 className="rylx-extra-title">{t('guestbook.title', 'Guest book')}</h2>
            <div className="rylx-card"><GuestBookForm weddingId={wedding.id} primaryColor={NAVY} accentColor={GOLD} surface="light" /></div>
            {guestBookEntries.length > 0 && (
              <div className="rylx-grid">
                {guestBookEntries.slice(0, 6).map((e: any) => (
                  <div className="rylx-card" key={e.id} style={{ textAlign: 'left' }}>
                    <p style={{ fontStyle: 'italic', color: NAVY, fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem' }}>“{e.message}”</p>
                    <p style={{ color: GOLD, marginTop: 8, fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '0.8rem', letterSpacing: '0.06em' }}>— {e.guestName}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="invite-credit">
          {show('orderCta') && <OrderInvitationCTA accent={GOLD} surface="light" className="rylx-cta" />}
        </footer>
      </main>
    </div>
  );
}

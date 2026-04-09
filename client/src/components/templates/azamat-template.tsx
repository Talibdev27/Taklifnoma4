import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EpicRSVPForm } from '@/components/epic-rsvp-form';
import { GuestBookForm } from '@/components/guest-book-form';
import { PhotoUpload } from '@/components/photo-upload';
import { EnhancedSocialShare } from '@/components/enhanced-social-share';
import { WeddingWelcomeOverlay } from '@/components/wedding-welcome-overlay';
import { BackgroundMusicPlayer } from '@/components/background-music-player';
import {
  MapPin, Heart, MessageSquare, Calendar, Users, Camera, ChevronDown,
} from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, Photo, GuestBookEntry } from '@shared/schema';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

interface AzamatTemplateProps {
  wedding: Wedding;
}

export function AzamatTemplate({ wedding }: AzamatTemplateProps) {
  const { t, i18n } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [triggerMusicPlay, setTriggerMusicPlay] = useState(false);
  const [activeNav, setActiveNav] = useState('home');

  // GSAP Refs
  const heroRef = useRef<HTMLElement>(null);
  const brideNameRef = useRef<HTMLHeadingElement>(null);
  const groomNameRef = useRef<HTMLHeadingElement>(null);
  const heroDetailsRef = useRef<HTMLDivElement>(null);
  const invitationRef = useRef<HTMLElement>(null);
  const countdownRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);
  const photosRef = useRef<HTMLElement>(null);
  const guestbookRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);

  const welcomeStorageKey = `wedding-welcome-${wedding.uniqueUrl}`;

  // Check if welcome overlay has been seen
  useEffect(() => {
    const welcomeSeen = sessionStorage.getItem(welcomeStorageKey);
    if (!welcomeSeen) setShowWelcomeOverlay(true);
  }, [welcomeStorageKey]);

  const handleEnterSite = () => {
    sessionStorage.setItem(welcomeStorageKey, 'true');
    setShowWelcomeOverlay(false);
    setTriggerMusicPlay(true);
    setTimeout(() => setTriggerMusicPlay(false), 1000);
  };

  // Force language to match wedding's default
  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      i18n.changeLanguage(wedding.defaultLanguage);
    }
  }, [wedding?.defaultLanguage, i18n]);

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'uz': return uz;
      case 'ru': return ru;
      case 'kk': return ru;
      case 'kaa': return ru;
      default: return enUS;
    }
  };

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ['/api/photos/wedding', wedding?.id],
    queryFn: () => fetch(`/api/photos/wedding/${wedding?.id}`).then(r => r.json()),
    enabled: !!wedding?.id,
  });

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

  // GSAP Animations
  useLayoutEffect(() => {
    if (!wedding || showWelcomeOverlay) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Hero Section Animations
        if (brideNameRef.current && groomNameRef.current && heroDetailsRef.current) {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          
          tl.fromTo(brideNameRef.current, 
            { opacity: 0, y: 50, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 1.2, delay: 0.3 }
          )
          .fromTo(groomNameRef.current,
            { opacity: 0, y: 50, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 1.2 },
            '-=0.6'
          )
          .fromTo(Array.from(heroDetailsRef.current.children),
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, stagger: 0.15, duration: 0.8 },
            '-=0.4'
          );
        }

        // Scroll-triggered animations for sections
        const sections = wedding.story 
          ? [invitationRef, countdownRef, detailsRef, storyRef, rsvpRef, photosRef, guestbookRef]
          : [invitationRef, countdownRef, detailsRef, rsvpRef, photosRef, guestbookRef];
        
        sections.forEach((ref) => {
          if (ref.current) {
            gsap.fromTo(ref.current,
              { opacity: 0, y: 60 },
              {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: ref.current,
                  start: 'top 80%',
                  toggleActions: 'play none none none',
                },
              }
            );
          }
        });

        // Countdown boxes animation
        if (countdownRef.current) {
          const countdownBoxes = countdownRef.current.querySelectorAll('.countdown-box');
          if (countdownBoxes.length > 0) {
            gsap.fromTo(countdownBoxes,
              { scale: 0.8, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                stagger: 0.15,
                duration: 0.6,
                ease: 'back.out(1.7)',
                scrollTrigger: {
                  trigger: countdownRef.current,
                  start: 'top 70%',
                },
              }
            );
          }
        }

        // Refresh ScrollTrigger after setup
        ScrollTrigger.refresh();
      });

      return () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach(t => t.kill());
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [wedding, showWelcomeOverlay]);

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  const primary = wedding.primaryColor || '#b08968';
  const accent = wedding.accentColor || '#8b6045';

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

  const navItems = [
    { id: 'home',      label: t('nav.home'),       icon: Heart },
    { id: 'details',   label: t('nav.details'),     icon: Calendar },
    { id: 'rsvp',      label: t('nav.rsvp'),        icon: Users },
    { id: 'photos',    label: t('wedding.photos').split(' ')[0], icon: Camera },
    { id: 'guestbook', label: t('nav.guestbook'),   icon: MessageSquare },
  ];

  const couplePhotos  = (photos as any[]).filter(p => p.photoType === 'couple');
  const memoryPhotos  = (photos as any[]).filter(p => p.photoType === 'memory');

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917]">
      {/* ── Welcome overlay ── */}
      {showWelcomeOverlay && (
        <WeddingWelcomeOverlay
          weddingData={{
            bride: wedding.bride,
            groom: wedding.groom,
            template: wedding.template,
            eventType: wedding.eventType,
          }}
          hasMusic={!!wedding.backgroundMusicUrl}
          onEnter={handleEnterSite}
          isVisible={showWelcomeOverlay}
          defaultLanguage={wedding.defaultLanguage}
        />
      )}

      {/* ── Background music ── */}
      {wedding.backgroundMusicUrl && (
        <BackgroundMusicPlayer
          musicUrl={wedding.backgroundMusicUrl}
          triggerPlay={triggerMusicPlay}
        />
      )}

      {/* ════════════════════════════════════════
          DESKTOP TOP NAV  (hidden on mobile)
      ════════════════════════════════════════ */}
      <nav className="hidden sm:flex fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-100 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-6 py-3">
          <span
            className="font-light text-lg tracking-wide select-none"
            style={{ fontFamily: '"Playfair Display","Georgia",serif', color: primary }}
          >
            {wedding.bride} &amp; {wedding.groom}
          </span>

          <div className="flex items-center gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                style={
                  activeNav === id
                    ? { backgroundColor: primary, color: '#fff' }
                    : { color: '#78716c' }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          MOBILE BOTTOM NAV  (hidden on desktop)
      ════════════════════════════════════════ */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-100 shadow-xl">
        <div className="flex items-center justify-around py-2 px-1 safe-area-inset-bottom">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all active:scale-95 min-w-[52px]"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={active ? { backgroundColor: `${primary}20` } : {}}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: active ? primary : '#a8a29e' }}
                  />
                </div>
                <span
                  className="text-[9px] font-medium leading-none"
                  style={{ color: active ? primary : '#a8a29e' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO WITH MOTION VIDEO BACKGROUND
      ════════════════════════════════════════ */}
      <section
        ref={heroRef}
        id="home"
        className="relative h-[80vh] flex flex-col items-center justify-center text-white overflow-hidden"
      >
        {/* Background video - absolute positioning */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
          preload="metadata"
        >
          <source src="/bg_video.mp4" type="video/mp4" />
        </video>

        {/* Fallback gradient background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: wedding.couplePhotoUrl
              ? `url(${wedding.couplePhotoUrl})`
              : `linear-gradient(160deg, ${primary}cc 0%, ${accent}ff 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content container */}
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto w-full flex flex-col items-center justify-center h-full">
          {/* Couple names */}
          <h1
            ref={brideNameRef}
            className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-wide mb-2 leading-tight drop-shadow-lg"
            style={{ fontFamily: '"Playfair Display","Georgia",serif' }}
          >
            {wedding.bride}
          </h1>
          <p
            className="text-xl sm:text-2xl lg:text-3xl mb-2 opacity-90 font-light"
            style={{ fontFamily: '"Playfair Display","Georgia",serif' }}
          >
            {t('wedding.and')}
          </p>
          <h1
            ref={groomNameRef}
            className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-wide mb-6 leading-tight drop-shadow-lg"
            style={{ fontFamily: '"Playfair Display","Georgia",serif' }}
          >
            {wedding.groom}
          </h1>

          {/* Hero details */}
          <div ref={heroDetailsRef}>
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px w-12 sm:w-14 bg-white/50" />
              <Heart className="w-3.5 sm:w-4 h-3.5 sm:h-4 opacity-60" fill="currentColor" />
              <div className="h-px w-12 sm:w-14 bg-white/50" />
            </div>

            {/* Wedding date */}
            <p className="text-sm sm:text-base lg:text-lg mb-2 font-light tracking-[0.18em] uppercase drop-shadow-md">
              {wedding.weddingDate
                ? format(new Date(wedding.weddingDate), 'd MMMM yyyy', { locale: getDateLocale() })
                : t('details.dateTBD')}
            </p>

            {/* Venue */}
            {wedding.venue && (
              <p className="text-xs sm:text-sm opacity-80 font-light mb-6 drop-shadow-md">
                {wedding.venue}
              </p>
            )}

            {/* Tagline */}
            <p className="text-xs sm:text-sm opacity-70 italic font-light mb-10 drop-shadow-md">
              {t('modern.tagline')}
            </p>
          </div>

          {/* Scroll indicator */}
          <button
            onClick={() => scrollTo('invitation')}
            className="flex flex-col items-center gap-1 mx-auto opacity-60 hover:opacity-90 transition-opacity mt-auto"
          >
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase">
              {t('wedding.scrollDown')}
            </span>
            <ChevronDown className="w-4 sm:w-5 h-4 sm:h-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════
          INVITATION / DEAR GUESTS
      ════════════════════════════════════════ */}
      <section ref={invitationRef} id="invitation" className="py-20 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Section ornament */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-10 rounded-full" style={{ backgroundColor: primary }} />
            <Heart className="w-4 h-4 opacity-80" style={{ color: primary }} fill="currentColor" />
            <div className="h-px w-10 rounded-full" style={{ backgroundColor: primary }} />
          </div>

          <h2
            className="text-3xl sm:text-4xl font-light mb-8"
            style={{ fontFamily: '"Playfair Display","Georgia",serif', color: primary }}
          >
            {t('wedding.dearGuests')}
          </h2>

          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-md border border-stone-100 text-left">
            {wedding.dearGuestMessage ? (
              <p className="text-base sm:text-lg leading-relaxed text-stone-700 whitespace-pre-wrap text-center">
                {wedding.dearGuestMessage}
              </p>
            ) : (
              <div className="text-base sm:text-lg leading-relaxed text-stone-600 space-y-3 text-center">
                <p>{t('wedding.foundEachOther')}</p>
                <p>{t('wedding.filledWithWarmth')}</p>
                <p>{t('wedding.inviteToCelebrate')}</p>
              </div>
            )}

            {/* Signature */}
            <div className="mt-8 pt-8 border-t border-stone-100 text-center space-y-1">
              <p
                className="text-base font-light text-stone-500"
              >
                {t('wedding.withRespect')}
              </p>
              <p
                className="text-2xl sm:text-3xl font-light"
                style={{ fontFamily: '"Playfair Display","Georgia",serif', color: accent }}
              >
                {wedding.bride} {t('wedding.and')} {wedding.groom}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          COUNTDOWN
      ════════════════════════════════════════ */}
      <section
        ref={countdownRef}
        className="py-16 px-5"
        style={{ background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)' }}
      >
        <div className="max-w-2xl mx-auto text-center text-white">
          <p className="text-[10px] tracking-[0.3em] uppercase mb-8 opacity-40">
            {t('countdown.timeRemaining')}
          </p>

          <div className="grid grid-cols-4 gap-3 sm:gap-5">
            {[
              { value: timeLeft.days,    label: t('wedding.countdown.days')    },
              { value: timeLeft.hours,   label: t('wedding.countdown.hours')   },
              { value: timeLeft.minutes, label: t('wedding.countdown.minutes') },
              { value: timeLeft.seconds, label: t('wedding.countdown.seconds') },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="countdown-box rounded-2xl p-4 sm:p-6 flex flex-col items-center gap-2"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span
                  className="text-3xl sm:text-5xl font-light tabular-nums leading-none"
                  style={{ fontFamily: '"Playfair Display","Georgia",serif', color: primary }}
                >
                  {String(value).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[11px] tracking-widest uppercase opacity-40">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          EVENT DETAILS
      ════════════════════════════════════════ */}
      <section ref={detailsRef} id="details" className="py-20 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-light"
              style={{ fontFamily: '"Playfair Display","Georgia",serif', color: primary }}
            >
              {t('sections.weddingDetails')}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-px w-14 bg-stone-200 rounded-full" />
              <Heart className="w-3 h-3 text-stone-300" />
              <div className="h-px w-14 bg-stone-200 rounded-full" />
            </div>
          </div>

          {/* When & Where cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* When */}
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-stone-100 flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${primary}18` }}
              >
                <Calendar className="w-7 h-7" style={{ color: primary }} />
              </div>
              <h3 className="text-base font-semibold text-stone-800 mb-3 uppercase tracking-wider">
                {t('details.when')}
              </h3>
              <p className="text-lg text-stone-700 mb-1">
                {wedding.weddingDate
                  ? format(new Date(wedding.weddingDate), 'd MMMM yyyy', { locale: getDateLocale() })
                  : t('details.dateTBD')}
              </p>
              <p className="text-sm text-stone-400">
                {t('details.ceremonyBegins')} {wedding.weddingTime || '4:00 PM'}
              </p>
            </div>

            {/* Where */}
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-stone-100 flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${primary}18` }}
              >
                <MapPin className="w-7 h-7" style={{ color: primary }} />
              </div>
              <h3 className="text-base font-semibold text-stone-800 mb-3 uppercase tracking-wider">
                {t('details.where')}
              </h3>
              <p className="text-lg text-stone-700 mb-1">
                {wedding.venue || t('wedding.venue')}
              </p>
              {wedding.venueAddress && (
                <p className="text-sm text-stone-400 mb-4">{wedding.venueAddress}</p>
              )}
              <button
                onClick={openMap}
                disabled={!wedding.mapPinUrl && !wedding.venueAddress}
                className="mt-auto text-sm font-medium px-5 py-2.5 rounded-full text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: primary }}
              >
                {t('details.showOnMap')}
              </button>
            </div>
          </div>

          {/* Dress code (shown only when filled) */}
          {wedding.dressCode && (
            <div
              className="mt-5 rounded-3xl p-5 flex items-start gap-4"
              style={{ backgroundColor: `${primary}0f`, border: `1px solid ${primary}28` }}
            >
              <div
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${primary}20` }}
              >
                👗
              </div>
              <div>
                <p className="font-semibold text-stone-800 mb-1 text-sm">{t('dressCode')}</p>
                <p className="text-stone-600 text-sm leading-relaxed">{wedding.dressCode}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          LOVE STORY  (shown only when filled)
      ════════════════════════════════════════ */}
      {wedding.story && (
        <section ref={storyRef} className="py-20 px-5 sm:px-8" style={{ backgroundColor: '#f5f0eb' }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="text-3xl sm:text-4xl font-light mb-8"
              style={{ fontFamily: '"Playfair Display","Georgia",serif', color: primary }}
            >
              {t('wedding.ourStory')}
            </h2>
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-stone-100">
              <p className="text-base sm:text-lg leading-relaxed text-stone-600 whitespace-pre-wrap italic">
                &ldquo;{wedding.story}&rdquo;
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          RSVP
      ════════════════════════════════════════ */}
      <section ref={rsvpRef} id="rsvp" className="py-20 px-5 sm:px-8 pb-28 sm:pb-20">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl sm:text-4xl font-light mb-2"
              style={{ fontFamily: '"Playfair Display","Georgia",serif', color: primary }}
            >
              {t('rsvp.title')}
            </h2>
            <p className="text-stone-500 text-sm">{t('rsvp.subtitle')}</p>
          </div>
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-stone-100">
            <EpicRSVPForm
              wedding={wedding}
              primaryColor={primary}
              accentColor={accent}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          PHOTO GALLERY
      ════════════════════════════════════════ */}
      <section
        ref={photosRef}
        id="photos"
        className="py-20 px-5 sm:px-8"
        style={{ backgroundColor: '#f5f0eb' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl sm:text-4xl font-light mb-2"
              style={{ fontFamily: '"Playfair Display","Georgia",serif', color: primary }}
            >
              {t('wedding.photos')}
            </h2>
            <p className="text-stone-500 text-sm">{t('wedding.photoGallerySubtitle')}</p>
          </div>

          <div className="bg-white rounded-3xl p-7 shadow-sm border border-stone-100 space-y-8">
            {/* Couple photos */}
            {couplePhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
                  {t('wedding.couplePhotos')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {couplePhotos.map((photo: any) => (
                    <div key={photo.id} className="rounded-2xl overflow-hidden aspect-square bg-stone-100">
                      <img
                        src={photo.url}
                        alt={photo.caption || ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memory photos */}
            {memoryPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
                  {t('wedding.memoryPhotos')}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {memoryPhotos.map((photo: any) => (
                    <div key={photo.id} className="rounded-xl overflow-hidden aspect-square bg-stone-100">
                      <img
                        src={photo.url}
                        alt={photo.caption || ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest upload */}
            <div className="pt-6 border-t border-stone-100">
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
                {t('wedding.uploadYourPhotos')}
              </h3>
              <PhotoUpload weddingId={wedding.id} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          GUEST BOOK
      ════════════════════════════════════════ */}
      <section ref={guestbookRef} id="guestbook" className="py-20 px-5 sm:px-8 pb-28 sm:pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="text-3xl sm:text-4xl font-light mb-2"
              style={{ fontFamily: '"Playfair Display","Georgia",serif', color: primary }}
            >
              {t('sections.guestBook')}
            </h2>
            <p className="text-stone-500 text-sm">{t('guestBook.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Write message */}
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-stone-100">
              <h3 className="font-semibold text-stone-700 text-sm uppercase tracking-wider mb-5">
                {t('guestBook.leaveMessage')}
              </h3>
              <GuestBookForm
                weddingId={wedding.id}
                primaryColor={primary}
                accentColor={accent}
              />
            </div>

            {/* Messages list */}
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-stone-100">
              <h3 className="font-semibold text-stone-700 text-sm uppercase tracking-wider mb-5">
                {t('guestBook.messages')}
              </h3>
              {(guestBookEntries as any[]).length === 0 ? (
                <p className="text-stone-400 text-sm text-center py-10">
                  {t('guestBook.noMessages')}
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {(guestBookEntries as any[]).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl border border-stone-100"
                      style={{ backgroundColor: `${primary}07` }}
                    >
                      <p className="font-semibold text-stone-800 text-sm mb-1">
                        {entry.guestName}
                      </p>
                      <p className="text-stone-500 text-sm leading-relaxed">
                        {entry.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Share */}
          <div className="mt-8 text-center">
            <EnhancedSocialShare
              weddingUrl={wedding.uniqueUrl}
              coupleName={`${wedding.bride} & ${wedding.groom}`}
              primaryColor={primary}
              accentColor={accent}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer
        className="py-12 px-5 text-center text-white pb-24 sm:pb-12"
        style={{ background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)' }}
      >
        <p
          className="text-2xl sm:text-3xl font-light mb-2"
          style={{ fontFamily: '"Playfair Display","Georgia",serif', color: primary }}
        >
          {wedding.bride} &amp; {wedding.groom}
        </p>
        {wedding.weddingDate && (
          <p className="text-xs tracking-[0.25em] uppercase opacity-40">
            {format(new Date(wedding.weddingDate), 'd MMMM yyyy', { locale: getDateLocale() })}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-6 opacity-30">
          <div className="h-px w-6 bg-white/60" />
          <p className="text-xs">{t('wedding.createdWith')} ♥ LoveStory</p>
          <div className="h-px w-6 bg-white/60" />
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PhotoUpload } from '@/components/photo-upload';
import { EpicRSVPForm } from '@/components/epic-rsvp-form';
import { GuestBookForm } from '@/components/guest-book-form';
import { EnhancedSocialShare } from '@/components/enhanced-social-share';
import { WeddingWelcomeOverlay } from '@/components/wedding-welcome-overlay';
import { BackgroundMusicPlayer } from '@/components/background-music-player';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Heart, MessageSquare, Calendar, Music, Clock, Camera, Users, Gift, Cake, PartyPopper, X } from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, Photo, GuestBookEntry } from '@shared/schema';

interface GulTemplateProps {
  wedding: Wedding & {
    story?: string | null;
  };
}

export function GulTemplate({ wedding }: GulTemplateProps) {
  const { t, i18n } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeSection, setActiveSection] = useState('home');
  
  // Welcome overlay state
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [triggerMusicPlay, setTriggerMusicPlay] = useState(false);
  
  // Photo modal state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Helper functions for photo modal
  const openPhotoModal = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoModal = () => {
    setSelectedPhotoIndex(null);
  };

  // Check if welcome overlay should be shown (only once per session)
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem(`wedding-welcome-${wedding.uniqueUrl}`);
    if (!hasSeenWelcome) {
      setShowWelcomeOverlay(true);
    }
  }, [wedding.uniqueUrl]);

  // Handle user entering the site
  const handleEnterSite = () => {
    // Mark welcome as seen for this wedding
    sessionStorage.setItem(`wedding-welcome-${wedding.uniqueUrl}`, 'true');
    
    // Hide overlay and trigger music
    setShowWelcomeOverlay(false);
    setTriggerMusicPlay(true);
    
    // Reset trigger after a short delay
    setTimeout(() => {
      setTriggerMusicPlay(false);
    }, 1000);
  };

  // Force language based on wedding settings
  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      console.log('Gul template: Setting language to', wedding.defaultLanguage);
      i18n.changeLanguage(wedding.defaultLanguage);
    }
  }, [wedding?.defaultLanguage, i18n]);

  // Get the appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'uz': return uz;
      case 'ru': return ru;
      case 'kk': return ru; // Kazakh uses Russian locale for date formatting
      case 'kaa': return ru; // Karakalpak uses Russian locale for date formatting
      default: return enUS;
    }
  };

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ['/api/photos/wedding', wedding?.id],
    queryFn: () => fetch(`/api/photos/wedding/${wedding?.id}`).then(res => res.json()),
    enabled: !!wedding?.id,
  });

  const { data: guestBookEntries = [] } = useQuery<GuestBookEntry[]>({
    queryKey: ['/api/guest-book/wedding', wedding?.id],
    queryFn: () => fetch(`/api/guest-book/wedding/${wedding?.id}`).then(res => res.json()),
    enabled: !!wedding?.id,
  });

  // Timezone-aware countdown calculation
  useEffect(() => {
    if (!wedding?.weddingDate) return;
    
    const calculateTimeLeft = () => {
      const result = calculateWeddingCountdown(
        wedding.weddingDate,
        wedding.weddingTime || '16:00',
        wedding.timezone || 'Asia/Tashkent'
      );
      
      setTimeLeft(result);
    };

    calculateTimeLeft();
    // Update every second for real-time countdown
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [wedding?.weddingDate, wedding?.weddingTime, wedding?.timezone]);

  if (!wedding) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const primaryColor = '#83487a'; // Purple from Figma
  const accentColor = '#6b3560'; // Darker purple

  // Solid golden-yellow color for couple names matching Figma design
  const coupleNameStyle = {
    color: '#F4D03F', // Light golden-yellow color
    textShadow: '0px 2px 8px rgba(244, 208, 63, 0.5)', // Subtle glow effect
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-[#83487a]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Welcome Overlay */}
      {showWelcomeOverlay && (
        <WeddingWelcomeOverlay
          weddingData={{
            bride: wedding.bride,
            groom: wedding.groom,
            template: wedding.template,
            eventType: wedding.eventType
          }}
          hasMusic={!!wedding.backgroundMusicUrl}
          onEnter={handleEnterSite}
          isVisible={showWelcomeOverlay}
          defaultLanguage={wedding.defaultLanguage}
        />
      )}

      {/* Navigation Bar - Fixed at top */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(131,72,122,0.9)] backdrop-blur-sm border-b border-white/20">
        <div className="max-w-[393px] mx-auto px-4">
          <div className="flex justify-between items-center h-[50px] py-2">
            <button
              onClick={() => scrollToSection('home')}
              className={`text-[14px] text-white px-3 py-2 rounded-[3px] transition-all ${
                activeSection === 'home' ? 'bg-[rgba(155,54,194,0.2)]' : 'bg-transparent hover:bg-white/10'
              }`}
              style={{ fontFamily: 'Namdhinggo, sans-serif' }}
            >
              {t('nav.home') || 'Bosh sahifa'}
            </button>
            <button
              onClick={() => scrollToSection('rsvp')}
              className={`text-[14px] text-white px-3 py-2 rounded-[3px] transition-all ${
                activeSection === 'rsvp' ? 'bg-[rgba(155,54,194,0.2)]' : 'bg-transparent hover:bg-white/10'
              }`}
              style={{ fontFamily: 'Namdhinggo, sans-serif' }}
            >
              {t('nav.rsvp') || 'Rsvp'}
            </button>
            <button
              onClick={() => scrollToSection('details')}
              className={`text-[14px] font-semibold text-white px-3 py-2 rounded-[3px] transition-all ${
                activeSection === 'details' ? 'bg-[rgba(155,54,194,0.2)]' : 'bg-transparent hover:bg-white/10'
              }`}
              style={{ fontFamily: 'Namdhinggo, sans-serif' }}
            >
              {t('nav.details') || 'Tavfsilotlar'}
            </button>
            <button
              onClick={() => scrollToSection('guestbook')}
              className={`text-[14px] font-semibold text-white px-3 py-2 rounded-[3px] transition-all ${
                activeSection === 'guestbook' ? 'bg-[rgba(155,54,194,0.2)]' : 'bg-transparent hover:bg-white/10'
              }`}
              style={{ fontFamily: 'Namdhinggo, sans-serif' }}
            >
              {t('nav.guestbook') || 'Mehomonlar'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        id="home" 
        className="relative min-h-screen flex flex-col items-center justify-center text-white pt-[70px] pb-12 sm:pb-16 px-4 overflow-hidden"
        style={{
          backgroundImage: wedding?.couplePhotoUrl 
            ? `linear-gradient(rgba(131, 72, 122, 0.6), rgba(131, 72, 122, 0.8)), url(${wedding.couplePhotoUrl})`
            : 'linear-gradient(135deg, #83487a, #6b3560)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Decorative Rose Elements - Left */}
        <div 
          className="absolute pointer-events-none z-0"
          style={{
            left: 'calc(-189px + 50%)',
            top: 'calc(539px - 50vh)',
            transform: 'translateX(-50%) rotate(311.578deg)',
            opacity: 0.25,
            width: '285px',
            height: '417px'
          }}
        >
          <svg 
            width="285" 
            height="417" 
            viewBox="0 0 285 417" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Rose petal layers */}
            <path 
              d="M142.5 50C142.5 50 80 80 80 150C80 220 120 250 142.5 300C165 250 205 220 205 150C205 80 142.5 50 142.5 50Z" 
              fill="rgba(255,255,255,0.3)" 
            />
            <path 
              d="M142.5 100C142.5 100 100 120 100 170C100 220 130 240 142.5 280C155 240 185 220 185 170C185 120 142.5 100 142.5 100Z" 
              fill="rgba(255,255,255,0.25)" 
            />
            <path 
              d="M142.5 130C142.5 130 115 145 115 185C115 225 135 245 142.5 265C150 245 170 225 170 185C170 145 142.5 130 142.5 130Z" 
              fill="rgba(255,255,255,0.2)" 
            />
            {/* Rose center */}
            <circle cx="142.5" cy="200" r="25" fill="rgba(255,255,255,0.35)" />
            <circle cx="142.5" cy="200" r="15" fill="rgba(244,208,63,0.4)" />
          </svg>
        </div>

        {/* Decorative Rose Elements - Right */}
        <div 
          className="absolute pointer-events-none z-0"
          style={{
            left: 'calc(-55px + 50%)',
            top: 'calc(475px - 50vh)',
            transform: 'translateX(-50%) rotate(61.443deg) scaleY(-1)',
            opacity: 0.25,
            width: '351px',
            height: '513px'
          }}
        >
          <svg 
            width="351" 
            height="513" 
            viewBox="0 0 351 513" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Rose petal layers */}
            <path 
              d="M175.5 60C175.5 60 100 95 100 185C100 275 145 310 175.5 370C206 310 251 275 251 185C251 95 175.5 60 175.5 60Z" 
              fill="rgba(255,255,255,0.3)" 
            />
            <path 
              d="M175.5 120C175.5 120 130 145 130 210C130 275 160 295 175.5 350C191 295 221 275 221 210C221 145 175.5 120 175.5 120Z" 
              fill="rgba(255,255,255,0.25)" 
            />
            <path 
              d="M175.5 150C175.5 150 145 170 145 220C145 270 165 290 175.5 330C186 290 206 270 206 220C206 170 175.5 150 175.5 150Z" 
              fill="rgba(255,255,255,0.2)" 
            />
            {/* Rose center */}
            <circle cx="175.5" cy="245" r="30" fill="rgba(255,255,255,0.35)" />
            <circle cx="175.5" cy="245" r="18" fill="rgba(244,208,63,0.4)" />
          </svg>
        </div>

        {/* Subtle background flower pattern overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.08'%3E%3Cpath d='M60 15 C60 15 40 35 40 55 C40 75 50 85 60 95 C70 85 80 75 80 55 C80 35 60 15 60 15 Z' fill='white'/%3E%3Ccircle cx='60' cy='55' r='8' fill='%23F4D03F'/%3E%3C/svg%3E")`,
            backgroundSize: '150px 150px',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat'
          }}
        />

        <div className="text-center mb-8 relative z-10">
          {/* Couple Names - matching Figma design with solid golden-yellow color */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <h1 
              className="text-[28px] sm:text-[36px] font-bold mb-2 tracking-[2.8px] sm:tracking-[3.6px]"
              style={{ ...coupleNameStyle, fontFamily: 'Montserrat, sans-serif' }}
            >
              {wedding?.bride || 'Bride'}
            </h1>
            <p 
              className="text-[18px] sm:text-[24px] font-medium mb-2 tracking-[2.4px] sm:tracking-[3.6px]"
              style={{ ...coupleNameStyle, fontFamily: 'Montserrat, sans-serif' }}
            >
              {t('wedding.and') || 'va'}
            </p>
            <h1 
              className="text-[28px] sm:text-[36px] font-bold mb-4 tracking-[2.8px] sm:tracking-[3.6px]"
              style={{ ...coupleNameStyle, fontFamily: 'Montserrat, sans-serif' }}
            >
              {wedding?.groom || 'Groom'}
            </h1>
          </div>

          {/* Couple Photo */}
          {wedding?.couplePhotoUrl && (
            <div className="mb-8 sm:mb-12 max-w-[600px] w-full mx-auto">
              <img 
                src={wedding.couplePhotoUrl} 
                alt={`${wedding.bride} & ${wedding.groom}`}
                className="w-full h-auto rounded-[15px] sm:rounded-[20px] border border-white/30 object-cover shadow-lg"
              />
            </div>
          )}

          {/* Welcome Message for Guests */}
          {wedding?.dearGuestMessage && (
            <div className="max-w-[600px] w-full mx-auto mt-0 mb-8 sm:mb-12 px-0">
              <div className="bg-[rgba(255,255,255,0.32)] border border-[#8b8b8b] rounded-tl-[30px] sm:rounded-tl-[60px] rounded-br-[30px] sm:rounded-br-[60px] p-4 sm:p-8 shadow-[0px_4px_13.5px_0px_inset_#000000]">
                <h3 
                  className="text-[24px] sm:text-[30px] font-semibold text-center mb-4 sm:mb-6 tracking-[2.4px] sm:tracking-[3.6px] text-white"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {t('sections.dearGuests') || 'Aziz Mehmonlar'}
                </h3>
                <div className="text-white/90 leading-relaxed mb-6 sm:mb-8 whitespace-pre-wrap text-center text-[14px] sm:text-[16px] px-3 sm:px-6" style={{ fontFamily: 'Montserrat, sans-serif', lineHeight: '1.8' }}>
                  {wedding.dearGuestMessage}
                </div>
                <div className="text-center pt-4 sm:pt-6 border-t border-white/20">
                  <p 
                    className="text-[16px] sm:text-[18px] font-medium"
                    style={{ ...coupleNameStyle, fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {wedding?.bride} {t('wedding.and') || 'va'} {wedding?.groom}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RSVP Section */}
      <section 
        id="rsvp" 
        className="relative py-12 px-4 bg-[#83487a]"
      >
        <div className="max-w-[600px] mx-auto w-full">
          <div className="bg-[rgba(255,255,255,0.32)] border border-[#8b8b8b] rounded-tl-[30px] sm:rounded-tl-[60px] rounded-br-[30px] sm:rounded-br-[60px] p-4 sm:p-8 shadow-[0px_4px_13.5px_0px_inset_#000000]">
            <h2 
              className="text-[24px] sm:text-[30px] font-semibold text-center mb-4 sm:mb-6 tracking-[2.4px] sm:tracking-[3.6px] text-white"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {t('rsvp.title') || 'RSVP'}
            </h2>
            <p className="text-[14px] sm:text-[15px] text-white text-center mb-6 sm:mb-8 tracking-[1.5px] sm:tracking-[1.8px] px-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t('rsvp.subtitle') || 'Sizni to`yimizda kutib qolamiz'}
            </p>
            
            <div className="bg-white/80 rounded-xl p-4 sm:p-6 overflow-hidden">
              <EpicRSVPForm 
                wedding={wedding}
                primaryColor={primaryColor}
                accentColor={accentColor}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Details Section (TAVSILOT) */}
      <section 
        id="details" 
        className="relative py-12 px-4 bg-[#83487a]"
      >
        <div className="max-w-[600px] mx-auto w-full">
          <div className="bg-[#83487a] rounded-tl-[75px] sm:rounded-tl-[150px] rounded-br-[75px] sm:rounded-br-[150px] p-6 sm:p-8 shadow-[0px_4px_13.5px_0px_inset_#000000]">
            {/* Couple Names */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 
                className="text-[28px] sm:text-[36px] font-bold mb-2 tracking-[2.8px] sm:tracking-[3.6px]"
                style={{ ...coupleNameStyle, fontFamily: 'Montserrat, sans-serif' }}
              >
                {wedding?.bride || 'Bride'}
              </h2>
              <p 
                className="text-[18px] sm:text-[24px] font-medium mb-2 tracking-[2.4px] sm:tracking-[3.6px]"
                style={{ ...coupleNameStyle, fontFamily: 'Montserrat, sans-serif' }}
              >
                {t('wedding.and') || 'va'}
              </p>
              <h2 
                className="text-[28px] sm:text-[36px] font-bold mb-4 sm:mb-6 tracking-[2.8px] sm:tracking-[3.6px]"
                style={{ ...coupleNameStyle, fontFamily: 'Montserrat, sans-serif' }}
              >
                {wedding?.groom || 'Groom'}
              </h2>
            </div>

            {/* Date and Countdown - Enhanced When Section */}
            <div className="bg-[rgba(255,255,255,0.32)] border border-[#8b8b8b] rounded-[15px] sm:rounded-[20px] p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
              {/* Calendar Icon and Title */}
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" style={{ color: '#F4D03F' }} />
                <p className="text-[16px] sm:text-[18px] font-semibold text-white tracking-[1.6px] sm:tracking-[1.92px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t('details.when') || 'Qachon'}
                </p>
              </div>

              {/* Date Display */}
              <div className="mb-3 sm:mb-4 text-center">
                <p className="text-[18px] sm:text-[20px] font-bold text-white mb-2 tracking-[1.8px] sm:tracking-[1.92px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {wedding?.weddingDate ? format(new Date(wedding.weddingDate), 'dd.MM.yyyy', { locale: getDateLocale() }) : t('details.dateTBD')}
                </p>
                {/* Wedding Start Time */}
                {wedding?.weddingTime && (
                  <p className="text-[13px] sm:text-[14px] text-white/90 tracking-[1.3px] sm:tracking-[1.44px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t('details.ceremonyBegins')} {wedding.weddingTime}
                  </p>
                )}
              </div>
              
              {/* Countdown */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-[20px] sm:text-[24px] font-bold text-white mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{timeLeft.days}</p>
                  <p className="text-[11px] sm:text-[12px] font-medium text-white/90 uppercase tracking-[1.32px] sm:tracking-[1.44px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t('countdown.days') || 'kun'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[20px] sm:text-[24px] font-bold text-white mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{timeLeft.hours}</p>
                  <p className="text-[11px] sm:text-[12px] font-medium text-white/90 uppercase tracking-[1.32px] sm:tracking-[1.44px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t('countdown.hours') || 'soat'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[20px] sm:text-[24px] font-bold text-white mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{timeLeft.minutes}</p>
                  <p className="text-[11px] sm:text-[12px] font-medium text-white/90 uppercase tracking-[1.32px] sm:tracking-[1.44px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t('countdown.minutes') || 'daqiqa'}
                  </p>
                </div>
              </div>
            </div>

            {/* Address - Enhanced Where Section (Clickable) */}
            <div 
              onClick={() => {
                const mapUrl = wedding?.mapPinUrl || wedding?.venueAddress;
                if (mapUrl) {
                  if (mapUrl.startsWith('http')) {
                    window.open(mapUrl, '_blank');
                  } else {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapUrl)}`, '_blank');
                  }
                }
              }}
              className={`bg-[rgba(255,255,255,0.32)] rounded-tl-[12px] sm:rounded-tl-[15px] rounded-br-[12px] sm:rounded-br-[15px] p-4 sm:p-6 shadow-lg mb-4 sm:mb-6 transition-all cursor-pointer ${
                (wedding?.mapPinUrl || wedding?.venueAddress) 
                  ? 'hover:bg-[rgba(255,255,255,0.40)] hover:shadow-xl active:scale-[0.98]' 
                  : 'cursor-default'
              }`}
            >
              {/* MapPin Icon and Title */}
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" style={{ color: '#F4D03F' }} />
                <p className="text-[16px] sm:text-[18px] font-semibold text-white tracking-[1.6px] sm:tracking-[1.92px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t('details.where') || 'Qayerda'}
                </p>
                {(wedding?.mapPinUrl || wedding?.venueAddress) && (
                  <span className="ml-2 text-[11px] sm:text-[12px] text-white/70">📍</span>
                )}
              </div>

              {/* Location Details */}
              <div className="space-y-2">
                {wedding?.venue && (
                  <p className="text-[15px] sm:text-[16px] font-semibold text-white tracking-[1.35px] sm:tracking-[1.44px] text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {wedding.venue}
                  </p>
                )}
                {wedding?.venueAddress && (
                  <p className="text-[13px] sm:text-[14px] text-white/90 tracking-[1.3px] sm:tracking-[1.44px] leading-relaxed text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {wedding.venueAddress}
                  </p>
                )}
                {(wedding?.mapPinUrl || wedding?.venueAddress) && (
                  <p className="text-[11px] sm:text-[12px] text-white/70 text-center mt-2 sm:mt-3 italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t('details.showOnMap') || 'Xaritada ko\'rish uchun bosing'}
                  </p>
                )}
              </div>
            </div>

            {/* Home Navigation Button */}
            <button 
              onClick={() => scrollToSection('home')}
              className="bg-[rgba(255,255,255,0.32)] border border-[#8b8b8b] rounded-[10px] sm:rounded-[12px] px-4 sm:px-6 py-2 text-white text-[18px] sm:text-[20px] tracking-[2px] sm:tracking-[2.4px] w-full transition-all hover:bg-white/40"
              style={{ fontFamily: 'Namdhinggo, sans-serif' }}
            >
              {t('nav.home') || 'Bosh sahifa'}
            </button>
          </div>
        </div>
      </section>

      {/* Guest Book Section (MEXMONLAR) */}
      <section 
        id="guestbook" 
        className="relative py-12 px-4 bg-[#83487a]"
      >
        <div className="max-w-[600px] mx-auto w-full">
          <div className="bg-[#83487a] rounded-tl-[60px] sm:rounded-tl-[100px] rounded-br-[60px] sm:rounded-br-[100px] p-6 sm:p-8 shadow-[0px_4px_13.5px_0px_inset_#000000]">
            <h2 
              className="text-[24px] sm:text-[30px] font-semibold text-center mb-4 tracking-[2px] sm:tracking-[3.6px] text-white"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {t('sections.guestBook') || 'Mehmonlar'}
            </h2>
            <p 
              className="text-[16px] sm:text-[20px] text-white text-center mb-6 sm:mb-8 tracking-[1.5px] sm:tracking-[2.4px] leading-relaxed px-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {t('guestBook.subtitle') || 'Bizning kunimizga o`z tilaklaringiz bilan yanada chiroy bering'}
            </p>

            {/* Guest Book Form */}
            <div className="bg-[rgba(255,255,255,0.32)] border border-[#8b8b8b] rounded-[15px] sm:rounded-[20px] p-4 sm:p-6 mb-6 sm:mb-8">
              <GuestBookForm 
                weddingId={wedding.id}
                primaryColor={primaryColor}
                accentColor={accentColor}
              />
            </div>

            {/* Guest Book Messages */}
            <div className="bg-[rgba(255,255,255,0.32)] border border-[#8b8b8b] rounded-[15px] sm:rounded-[20px] p-4 sm:p-6">
              <h3 
                className="text-[22px] sm:text-[30px] font-semibold text-center mb-4 sm:mb-6 tracking-[2px] sm:tracking-[3.6px] text-white"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {t('guestBook.messages') || 'Yaqinilardan Tilaklar'}
              </h3>
              <div className="space-y-3 sm:space-y-4 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-2">
                {guestBookEntries.length > 0 ? (
                  guestBookEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="bg-white/20 rounded-lg p-3 sm:p-4 border border-white/30"
                    >
                      <p className="text-white mb-2 text-[14px] sm:text-sm leading-relaxed">{entry.message}</p>
                      <p className="font-medium text-white/80 text-[12px] sm:text-xs">— {entry.guestName}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-white/60 italic text-center text-sm sm:text-base">
                    {t('guestBook.noMessages') || 'Hozircha xabarlar yo`q'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="relative py-12 px-4 bg-[#83487a]">
        <div className="max-w-[600px] mx-auto w-full">
          <div className="bg-[#83487a] rounded-tl-[75px] sm:rounded-tl-[150px] rounded-br-[75px] sm:rounded-br-[150px] p-6 sm:p-8 shadow-[0px_4px_13.5px_0px_inset_#000000]">
            <h2 
              className="text-[24px] sm:text-[30px] font-semibold text-center mb-6 sm:mb-8 tracking-[2.4px] sm:tracking-[3.6px] text-white"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {t('wedding.photos') || 'Fotolavhalar'}
            </h2>
            
            {(() => {
              // Filter out couple photos - only show memory photos in gallery
              const memoryPhotos = photos.filter((photo: any) => photo.photoType === 'memory');
              
              return memoryPhotos.length > 0 ? (
                <>
                  {/* Photo Gallery Grid - Mobile-friendly 2-column layout */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {memoryPhotos.map((photo, index) => (
                      <div 
                        key={photo.id} 
                        className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openPhotoModal(index)}
                      >
                        <img 
                          src={photo.url} 
                          alt={photo.caption || 'Wedding photo'}
                          className="w-full h-[160px] sm:h-[187px] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                
                  {/* Upload Section */}
                  <div className="bg-[rgba(255,255,255,0.32)] border border-[#8b8b8b] rounded-[15px] sm:rounded-[20px] p-4 sm:p-6">
                    <div className="text-center">
                      <PhotoUpload weddingId={wedding.id} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-[rgba(255,255,255,0.32)] border border-[#8b8b8b] rounded-[15px] sm:rounded-[20px] p-4 sm:p-6 text-center">
                  <p className="text-white/80 mb-4 sm:mb-6 text-base sm:text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {t('wedding.noPhotosYet') || 'Hali fotolar yuklanmagan'}
                  </p>
                  <PhotoUpload weddingId={wedding.id} />
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#83487a] text-white py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: '#fff' }} />
          <h3 className="text-2xl mb-2" style={{ fontFamily: 'My Soul, cursive' }}>
            {wedding?.bride} {t('wedding.and') || 'va'} {wedding?.groom}
          </h3>
          <p className="text-white/80 mb-8">
            {t('wedding.thankYouGuests') || 'Bizning kungimizni baham ko`rganingiz uchun rahmat!'}
          </p>
          
          <div className="mb-8">
            <EnhancedSocialShare
              weddingUrl={wedding.uniqueUrl}
              coupleName={`${wedding.bride} & ${wedding.groom}`}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </div>

          <div className="flex items-center justify-center text-white/60 text-sm">
            <span>{t('footer.poweredBy') || 'Taklif tomonidan yaratilgan'}</span>
            <Heart className="inline h-4 w-4 mx-2" />
            <span className="font-semibold">Taklif</span>
          </div>
        </div>
      </footer>

      {/* Background Music Player */}
      {wedding.backgroundMusicUrl && (
        <BackgroundMusicPlayer
          musicUrl={wedding.backgroundMusicUrl}
          autoPlay={true}
          loop={true}
          triggerPlay={triggerMusicPlay}
        />
      )}

      {/* Photo Modal */}
      <Dialog open={selectedPhotoIndex !== null} onOpenChange={(open) => !open && closePhotoModal()}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-none">
          {selectedPhotoIndex !== null && (() => {
            const memoryPhotos = photos.filter((photo: any) => photo.photoType === 'memory');
            const currentPhoto = memoryPhotos[selectedPhotoIndex];
            
            if (!currentPhoto) return null;
            
            return (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white hover:bg-opacity-20 rounded-full"
                  onClick={closePhotoModal}
                >
                  <X className="h-6 w-6" />
                </Button>

                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.caption || `Wedding photo ${selectedPhotoIndex + 1}`}
                  className="w-full h-auto max-h-[90vh] object-contain"
                />

                {currentPhoto.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4">
                    <p className="text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {currentPhoto.caption}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}


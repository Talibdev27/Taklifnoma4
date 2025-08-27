import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PhotoUpload } from '@/components/photo-upload';
import { EpicRSVPForm } from '@/components/epic-rsvp-form';
import { GuestBookForm } from '@/components/guest-book-form';
import { EnhancedSocialShare } from '@/components/enhanced-social-share';
import { MapPin, Heart, MessageSquare, Calendar, Music, Clock, Camera, Users, Gift, Cake, PartyPopper } from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, Photo, GuestBookEntry } from '@shared/schema';
import { BirthdayAnimations } from '@/components/birthday-animations';
import { BirthdayCountdown } from '@/components/birthday-countdown';
import { BirthdayCake } from '@/components/birthday-cake';

interface BirthdayTemplateProps {
  wedding: Wedding;
}

export function BirthdayTemplate({ wedding }: BirthdayTemplateProps) {
  const { t, i18n } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Calculate age from birthday
  const calculateAge = () => {
    if (!wedding?.weddingDate) return null;
    const birthDate = new Date(wedding.weddingDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = calculateAge();
  const isMilestone = age ? [1, 5, 10, 13, 16, 18, 21, 25, 30, 40, 50, 60, 70, 80, 90, 100].includes(age) : false;

  // Force language based on wedding settings
  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      console.log('Birthday template: Setting language to', wedding.defaultLanguage);
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
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const primaryColor = wedding?.primaryColor || '#FF6B9D'; // Birthday pink
  const accentColor = wedding?.accentColor || '#FFB6C1'; // Light pink

  return (
    <div className="min-h-screen">
      {/* Birthday Animations */}
      <BirthdayAnimations 
        isMilestone={isMilestone}
        age={age || undefined}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />
      
      {/* Navigation - Fixed at top - Mobile Optimized */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg z-50">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex justify-center space-x-2 sm:space-x-4 lg:space-x-8 py-2 sm:py-4">
            {[
              { id: 'home', label: t('nav.home'), icon: Heart },
              { id: 'rsvp', label: t('nav.rsvp'), icon: Users },
              { id: 'details', label: t('nav.details'), icon: Calendar },
              { id: 'guestbook', label: t('nav.guestbook'), icon: MessageSquare }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 px-2 sm:px-4 py-2 rounded-full transition-all duration-300 text-xs sm:text-sm font-medium hover:opacity-80 min-w-[60px] sm:min-w-auto"
                style={{ 
                  color: primaryColor,
                  backgroundColor: `${primaryColor}10`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                }}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="sm:hidden lg:inline text-[10px] sm:text-sm leading-tight">{label}</span>
                <span className="hidden sm:inline lg:hidden text-sm">{label.slice(0, 5)}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section - Birthday template with mobile-optimized card layout */}
      <section 
        id="home" 
        className="min-h-screen flex items-center justify-center px-2 sm:px-4 py-20"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)`
        }}
      >
        <div className="w-full max-w-4xl bg-white rounded-[20px] shadow-2xl overflow-hidden">
          
          {/* Photo Section - Mobile Optimized */}
          <div 
            className="relative flex items-center justify-center overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              // Mobile: taller photo section, Desktop: fixed height
              height: 'clamp(320px, 60vh, 500px)'
            }}
          >
            
            {/* Decorative elements - Responsive */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute top-3 left-3 sm:top-5 sm:left-5 w-10 h-10 sm:w-16 sm:h-16 rounded-full opacity-30 transform rotate-45"
                style={{ background: `linear-gradient(135deg, ${primaryColor}60, ${accentColor}60)` }}
              ></div>
              <div 
                className="absolute top-5 right-5 sm:top-8 sm:right-8 w-8 h-8 sm:w-12 sm:h-12 rounded-full opacity-30 transform -rotate-45"
                style={{ background: `linear-gradient(135deg, ${primaryColor}40, ${accentColor}40)` }}
              ></div>
              <div 
                className="absolute bottom-12 left-5 sm:bottom-20 sm:left-8 w-6 h-6 sm:w-10 sm:h-10 rounded-full opacity-30 transform rotate-90"
                style={{ background: `linear-gradient(135deg, ${accentColor}60, ${primaryColor}60)` }}
              ></div>
            </div>

            {wedding?.couplePhotoUrl ? (
              <img 
                src={wedding.couplePhotoUrl} 
                alt="Birthday Person" 
                className="w-full h-full object-cover object-center"
                style={{
                  filter: 'brightness(0.95) contrast(1.05)',
                  objectPosition: 'center 25%' // Better positioning for birthday person photos
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-white/60 rounded-lg bg-white/15 backdrop-blur-sm mx-3 sm:mx-5 my-3 sm:my-5">
                <div className="text-center text-white">
                  <div className="text-3xl sm:text-5xl mb-2 sm:mb-4">🎂</div>
                  <p className="text-sm sm:text-lg font-light px-4">{t('birthday.beautifulMemories') || 'Beautiful Birthday Memories'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Section - Mobile Optimized */}
          <div className="bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 text-center relative">
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 h-1 rounded-full"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            ></div>
            
            {/* Birthday Person Name - Responsive Typography */}
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-3 sm:mb-4 tracking-wide leading-tight"
              style={{ 
                color: primaryColor,
                background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {wedding?.bride || 'Birthday Person'}
            </h1>
            
            {/* Birthday Cake Animation */}
            {age && (
              <div className="flex justify-center mb-4">
                <BirthdayCake
                  age={age}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                  isAnimated={true}
                />
              </div>
            )}
            
            {/* Birthday Date - Responsive */}
            <p className="text-base sm:text-lg text-gray-600 mb-2 italic font-light">
              {wedding?.weddingDate ? format(new Date(wedding.weddingDate), 'd MMMM yyyy', { locale: getDateLocale() }) : t('details.dateTBD')}
            </p>

            {/* Birthday Time */}
            <div className="flex items-center justify-center mb-6 sm:mb-8 text-gray-600">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">{wedding?.weddingTime || '4:00 PM'}</span>
            </div>

            {/* Festive Birthday Countdown */}
            <div className="mb-6 sm:mb-8">
              <BirthdayCountdown
                weddingDate={typeof wedding.weddingDate === 'string' ? wedding.weddingDate : wedding.weddingDate.toISOString()}
                weddingTime={wedding.weddingTime}
                timezone={wedding.timezone}
                age={age || undefined}
                primaryColor={primaryColor}
                accentColor={accentColor}
              />
            </div>

            {/* Party Venue Button - Centered and Balanced */}
            <div className="flex justify-center">
              <div 
                onClick={() => {
                  const mapUrl = wedding?.mapPinUrl || wedding?.venueAddress;
                  if (mapUrl) {
                    // If it's already a full URL, open it directly
                    if (mapUrl.startsWith('http')) {
                      window.open(mapUrl, '_blank');
                    } else {
                      // Otherwise, create a Google Maps search URL
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapUrl)}`, '_blank');
                    }
                  }
                }}
                className="flex items-center justify-center text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full border-2 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-sm sm:text-base max-w-xs"
                style={{ 
                  backgroundColor: `${primaryColor}10`,
                  borderColor: `${primaryColor}30`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                }}
              >
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">
                  {wedding?.venue || t('birthday.partyVenue') || 'Party Venue'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Party Details Section */}
      <section 
        className="py-12 sm:py-16 lg:py-20"
        style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}08)` }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6 sm:mb-8 text-gray-800">{t('birthday.partyDetails') || 'Party Details'}</h2>
          
          {wedding?.dearGuestMessage && (
            <div className="max-w-3xl mx-auto">
              <div 
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border mx-2 sm:mx-0"
                style={{ borderColor: `${primaryColor}20` }}
              >
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg whitespace-pre-wrap">
                  {wedding.dearGuestMessage}
                </p>
                <div className="mt-4 sm:mt-6 text-right">
                  <p className="font-medium text-sm sm:text-base" style={{ color: primaryColor }}>
                    {wedding?.bride}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* About [Name] Section */}
      {wedding?.story && (
        <section className="py-12 sm:py-16 lg:py-20" style={{ background: `linear-gradient(135deg, ${primaryColor}05, ${accentColor}05)` }}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6 sm:mb-8" style={{ color: primaryColor }}>
              {t('birthday.aboutPerson') || `About ${wedding?.bride || 'Birthday Person'}`}
            </h2>
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border mx-2 sm:mx-0" style={{ borderColor: `${primaryColor}20` }}>
                <p className="text-gray-700 leading-relaxed text-base sm:text-lg lg:text-xl whitespace-pre-wrap">
                  {wedding.story}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dress Code Section - Only shows if dress code is specified */}
      {wedding?.dressCode && (
        <section className="py-12 sm:py-16 lg:py-20" style={{ background: `linear-gradient(135deg, ${accentColor}05, ${primaryColor}05)` }}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6 sm:mb-8" style={{ color: accentColor }}>
              {t('birthday.dressCode') || 'Dress Code'}
            </h2>
            <div className="max-w-2xl mx-auto">
              <div 
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border mx-2 sm:mx-0 relative overflow-hidden"
                style={{ borderColor: `${accentColor}20` }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r" style={{ background: `linear-gradient(to right, ${accentColor}, ${primaryColor})` }}></div>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                    <svg className="w-6 h-6" style={{ color: accentColor }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L13.09 8.26L21.88 9L14.82 16.07L16 23L12 19.65L8 23L9.18 16.07L2.12 9L10.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                  {wedding.dressCode}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RSVP Section */}
      <section 
        id="rsvp" 
        className="py-12 sm:py-16 lg:py-20"
        style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}15)` }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl font-light mb-3 sm:mb-4"
              style={{ 
                color: primaryColor,
                background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t('birthday.rsvp.title') || t('rsvp.title')}
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg px-2">
              {t('birthday.rsvp.subtitle') || t('rsvp.subtitle')}
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div 
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border mx-2 sm:mx-0"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <EpicRSVPForm 
                weddingId={wedding.id} 
                primaryColor={primaryColor}
                accentColor={accentColor}
                isBirthday={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Birthday Details Section */}
      <section id="details" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-light text-center mb-10 sm:mb-12 lg:mb-16"
            style={{ 
              color: primaryColor,
              background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {t('birthday.partyDetails') || 'Birthday Party Details'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto mb-10 sm:mb-12 lg:mb-16">
            {/* When */}
            <div 
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 text-center shadow-lg border mx-2 md:mx-0"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">{t('birthday.when') || 'When'}</h3>
              <p className="text-gray-700 text-sm sm:text-base lg:text-lg mb-2">
                {wedding?.weddingDate ? format(new Date(wedding.weddingDate), 'd MMMM yyyy', { locale: getDateLocale() }) : t('details.dateTBD')}
              </p>
              <p className="text-gray-600 text-sm sm:text-base">
                {t('birthday.partyBegins') || 'Party Begins'} {wedding?.weddingTime || '4:00 PM'}
              </p>
            </div>

            {/* Where */}
            <div 
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 text-center shadow-lg border mx-2 md:mx-0"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <MapPin className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-3 sm:mb-4" style={{ color: primaryColor }} />
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">{t('birthday.where') || 'Where'}</h3>
              <p className="text-gray-700 text-sm sm:text-base lg:text-lg mb-2">{wedding?.venue || t('birthday.partyVenue') || 'Party Venue'}</p>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{wedding?.venueAddress}</p>
              <div className="flex justify-center">
                <button 
                  onClick={() => {
                    const mapUrl = wedding?.mapPinUrl || wedding?.venueAddress;
                    if (mapUrl) {
                      // If it's already a full URL, open it directly
                      if (mapUrl.startsWith('http')) {
                        window.open(mapUrl, '_blank');
                      } else {
                        // Otherwise, create a Google Maps search URL
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapUrl)}`, '_blank');
                      }
                    }
                  }}
                  className="px-4 sm:px-6 py-2 text-white rounded-full transition-colors hover:opacity-90 text-sm sm:text-base"
                  style={{ backgroundColor: primaryColor }}
                  disabled={!wedding?.mapPinUrl && !wedding?.venueAddress}
                >
                  {t('details.showOnMap')}
                </button>
              </div>
            </div>
          </div>

          {/* Social Share */}
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800">
              {t('birthday.share.title')}
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base px-4">
              {t('birthday.share.subtitle')}
            </p>
            <div className="max-w-lg mx-auto px-4">
              <EnhancedSocialShare
                weddingUrl={wedding.uniqueUrl}
                coupleName={`${wedding.bride}'s Birthday`}
                primaryColor={primaryColor}
                accentColor={accentColor}
                isBirthday={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Guest Book Section */}
      <section 
        id="guestbook" 
        className="py-20"
        style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}15)` }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-light mb-4"
              style={{ 
                color: primaryColor,
                background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t('sections.guestBook')}
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto text-lg">
              {t('guestBook.subtitle')}
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div 
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border"
                style={{ borderColor: `${primaryColor}20` }}
              >
                <h3 className="text-xl font-semibold mb-6 text-gray-800">{t('guestBook.leaveMessage')}</h3>
                <GuestBookForm 
                  weddingId={wedding.id}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                />
              </div>
              <div 
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border"
                style={{ borderColor: `${primaryColor}20` }}
              >
                <h3 className="text-xl font-semibold mb-6 text-gray-800">{t('guestBook.messages')}</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {guestBookEntries.length > 0 ? (
                    guestBookEntries.map((entry) => (
                      <div 
                        key={entry.id} 
                        className="p-6 rounded-2xl border"
                        style={{ 
                          backgroundColor: `${primaryColor}10`,
                          borderColor: `${primaryColor}20`
                        }}
                      >
                        <p className="text-gray-700 mb-3">{entry.message}</p>
                        <p className="font-medium" style={{ color: primaryColor }}>— {entry.guestName}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">{t('guestBook.noMessages')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Cake className="w-8 h-8 mx-auto mb-4" style={{ color: primaryColor }} />
          <h3 className="text-2xl font-light mb-2">
            {wedding?.bride}
          </h3>
          <p className="text-gray-300 mb-8">
            {t('birthday.thankYouGuests') || 'Thank you for celebrating with us!'}
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto mb-8">
            <h4 className="text-lg font-medium mb-4">
              {t('birthday.ad.orderInvitation') || t('ad.orderInvitation')}
            </h4>
            <p className="text-gray-300 mb-4 text-sm">
              {t('birthday.ad.createWebsite') || t('ad.createWebsite')}
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="https://t.me/link_taklif" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full transition-colors flex items-center space-x-2 text-white"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span>{t('share.telegram')}</span>
              </a>
              <a 
                href="https://www.instagram.com/taklif_link?igsh=cjRra3cxcHN3Y3U1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded-full transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.40z"/>
                </svg>
                <span>{t('share.instagram')}</span>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center text-gray-400 text-sm">
            <span>{t('footer.poweredBy')}</span>
            <Heart className="inline h-4 w-4 mx-2" style={{ color: primaryColor }} />
            <span className="font-semibold" style={{ color: primaryColor }}>Taklif</span>
          </div>
        </div>
      </footer>
    </div>
  );
} 
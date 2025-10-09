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
import { MapPin, Heart, MessageSquare, Calendar, Music, Clock, Camera, Users, Gift, Cake, PartyPopper } from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';
import type { Wedding, Photo, GuestBookEntry } from '@shared/schema';

interface FlowerTemplateProps {
  wedding: Wedding & {
    story?: string | null;
  };
}

export function FlowerTemplate({ wedding }: FlowerTemplateProps) {
  const { t, i18n } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Welcome overlay state
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [triggerMusicPlay, setTriggerMusicPlay] = useState(false);

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
      console.log('Flower template: Setting language to', wedding.defaultLanguage);
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

  const primaryColor = wedding?.primaryColor || '#dcbfa0'; // Flower template beige
  const accentColor = wedding?.accentColor || '#8b7355'; // Darker beige

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9f1e7', color: '#3b3b3b' }}>
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

      {/* Navigation - Fixed at top */}
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

      {/* Hero Section */}
      <section 
        id="home" 
        className="relative min-h-screen flex flex-col justify-end items-center text-white pb-10"
        style={{
          backgroundImage: wedding?.couplePhotoUrl ? `url(${wedding.couplePhotoUrl})` : 'linear-gradient(135deg, #dcbfa0, #8b7355)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif mb-2" style={{ fontFamily: 'Great Vibes, cursive' }}>
            {wedding?.bride || 'Bride'}
          </h1>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif mb-2" style={{ fontFamily: 'Great Vibes, cursive' }}>
            {t('wedding.and') || 'и'}
          </h2>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif mb-4" style={{ fontFamily: 'Great Vibes, cursive' }}>
            {wedding?.groom || 'Groom'}
          </h1>
          <h3 className="text-2xl sm:text-3xl font-serif mb-6" style={{ fontFamily: 'Great Vibes, cursive' }}>
            {wedding?.weddingDate ? format(new Date(wedding.weddingDate), 'dd.MM.yyyy', { locale: getDateLocale() }) : t('details.dateTBD')}
          </h3>
          
          {/* Photo 1 - In Hero Section */}
          {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_1').length > 0 && (
            <div className="mb-6">
              <img 
                src={photos.filter((photo: any) => photo.photoType === 'flower_photo_1')[0].url} 
                alt="Flower Photo 1"
                className="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-lg object-cover"
              />
            </div>
          )}
          
          <div className="text-2xl sm:text-3xl animate-bounce">
            ↓ {t('wedding.scrollDown') || 'листайте вниз'}
          </div>
        </div>
      </section>

      {/* Invitation Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <p className="text-lg sm:text-xl mb-4">
              <strong>{t('wedding.dearGuests')}</strong>
            </p>
            {wedding?.dearGuestMessage ? (
              <div className="text-lg sm:text-xl leading-relaxed whitespace-pre-wrap">
                {wedding.dearGuestMessage}
              </div>
            ) : (
              <div className="text-lg sm:text-xl leading-relaxed">
                <p>{t('wedding.foundEachOther') || 'Мы нашли друг в друге целый мир —'}</p>
                <p>{t('wedding.filledWithWarmth') || 'наполненный теплом, доверием и любовью.'}</p>
                <p>{t('wedding.inviteToCelebrate') || 'И приглашаем вас отпраздновать этот момент с нами.'}</p>
              </div>
            )}
            
            <p className="text-2xl sm:text-3xl mt-8" style={{ fontFamily: 'Great Vibes, cursive' }}>
              {t('wedding.withRespect') || 'С уважением,'} <br />
              {wedding?.bride} {t('wedding.and') || 'и'} {wedding?.groom}
            </p>
          </div>
          
          {/* Photo 2 - Under the Invitation Text Section */}
          {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_2').length > 0 && (
            <div className="mt-8">
              <img 
                src={photos.filter((photo: any) => photo.photoType === 'flower_photo_2')[0].url} 
                alt="Couple Photo"
                className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      </section>

      {/* Calendar Section */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl sm:text-4xl font-serif mb-4 text-center" style={{ fontFamily: 'Great Vibes, cursive' }}>
              {t('wedding.oneLove') || 'Одна любовь...'}
            </h2>
            <h3 className="text-2xl sm:text-3xl font-serif mb-6 text-center" style={{ fontFamily: 'Great Vibes, cursive' }}>
              {wedding?.weddingDate ? format(new Date(wedding.weddingDate), 'MMMM', { locale: getDateLocale() }) : 'Month'}
            </h3>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((day) => (
                <div key={day} className="text-center font-semibold text-sm sm:text-base">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i + 1;
                const isWeddingDay = wedding?.weddingDate && 
                  format(new Date(wedding.weddingDate), 'd') === day.toString();
                return (
                  <div 
                    key={i}
                    className={`text-center p-2 text-sm sm:text-base ${
                      isWeddingDay 
                        ? 'bg-orange-200 rounded-full font-bold' 
                        : 'text-gray-600'
                    }`}
                  >
                    {day <= 31 ? day : ''}
                  </div>
                );
              })}
            </div>
            
            {/* Countdown */}
            <div className="text-center text-lg sm:text-xl">
              {timeLeft.days} {t('countdown.days')} | {timeLeft.hours} {t('countdown.hours')} | {timeLeft.minutes} {t('countdown.minutes')} | {timeLeft.seconds} {t('countdown.seconds')}
            </div>
          </div>
          
          {/* Photo 3 - Under Calendar Section */}
          {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_3').length > 0 && (
            <div className="mt-8">
              <img 
                src={photos.filter((photo: any) => photo.photoType === 'flower_photo_3')[0].url} 
                alt="Calendar Photo"
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-serif mb-8" style={{ fontFamily: 'Great Vibes, cursive' }}>
            {t('wedding.location') || 'Локация'}
          </h2>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <p className="text-lg sm:text-xl mb-4">
              {wedding?.venueAddress || t('wedding.venueAddress')}
            </p>
            <h3 className="text-2xl sm:text-3xl font-serif mb-6" style={{ fontFamily: 'Great Vibes, cursive' }}>
              "{wedding?.venue || t('wedding.venue')}"
            </h3>
            
            {/* Photo 4 - In Location Section */}
            {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_4').length > 0 && (
              <div className="mb-6">
                <img 
                  src={photos.filter((photo: any) => photo.photoType === 'flower_photo_4')[0].url} 
                  alt="Flower Photo 4"
                  className="w-full max-w-xl mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            
            <button 
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
              className="inline-block px-6 py-3 rounded-full text-white font-medium transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: primaryColor }}
              disabled={!wedding?.mapPinUrl && !wedding?.venueAddress}
            >
              {t('wedding.goToMap') || 'Перейти на карту'}
            </button>
          </div>
        </div>
      </section>

      {/* Additional Photos Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Photo 5 */}
            {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_5').length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-serif mb-4 text-center" style={{ fontFamily: 'Great Vibes, cursive', color: primaryColor }}>
                  {t('wedding.flowerPhoto5') || 'Special Moment'}
                </h3>
                <img 
                  src={photos.filter((photo: any) => photo.photoType === 'flower_photo_5')[0].url} 
                  alt="Flower Photo 5"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            )}
            
            {/* Photo 6 */}
            {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_6').length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-serif mb-4 text-center" style={{ fontFamily: 'Great Vibes, cursive', color: primaryColor }}>
                  {t('wedding.flowerPhoto6') || 'Beautiful Memory'}
                </h3>
                <img 
                  src={photos.filter((photo: any) => photo.photoType === 'flower_photo_6')[0].url} 
                  alt="Flower Photo 6"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="py-16 px-4" style={{ backgroundColor: `${primaryColor}10` }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl sm:text-4xl font-serif mb-4"
              style={{ 
                fontFamily: 'Great Vibes, cursive',
                color: primaryColor
              }}
            >
              {t('wedding.photos') || 'Our Memories'}
            </h2>
            <p className="text-lg sm:text-xl">
              {t('wedding.photoGallerySubtitle') || 'Share your beautiful memories with us'}
            </p>
          </div>
          
          {/* Display photos uploaded through admin dashboard */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            {/* Couple Photos Section */}
            {photos && photos.filter((photo: any) => photo.photoType === 'couple').length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center" style={{ color: primaryColor }}>
                  {t('wedding.couplePhotos') || 'Couple Photos'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {photos.filter((photo: any) => photo.photoType === 'couple').map((photo: any) => (
                    <div key={photo.id} className="rounded-lg overflow-hidden shadow-lg">
                      <img 
                        src={photo.url} 
                        alt={photo.caption || "Couple photo"}
                        className="w-full h-64 object-cover"
                      />
                      {photo.caption && (
                        <div className="p-4 bg-white">
                          <p className="text-sm text-gray-600">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memory Photos Section */}
            {photos && photos.filter((photo: any) => photo.photoType === 'memory').length > 0 && (
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center" style={{ color: primaryColor }}>
                  {t('wedding.memoryPhotos') || 'Memory Gallery'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.filter((photo: any) => photo.photoType === 'memory').map((photo: any) => (
                    <div key={photo.id} className="rounded-lg overflow-hidden shadow-lg">
                      <img 
                        src={photo.url} 
                        alt={photo.caption || "Memory photo"}
                        className="w-full h-32 object-cover"
                      />
                      {photo.caption && (
                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Upload Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-center" style={{ color: primaryColor }}>
                {t('wedding.uploadYourPhotos') || 'Upload Your Photos'}
              </h3>
              <PhotoUpload weddingId={wedding.id} />
            </div>
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section 
        id="rsvp" 
        className="py-16 px-4"
        style={{ backgroundColor: `${primaryColor}10` }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 
              className="text-3xl sm:text-4xl font-serif mb-4"
              style={{ 
                fontFamily: 'Great Vibes, cursive',
                color: primaryColor
              }}
            >
              {t('rsvp.title')}
            </h2>
            <p className="text-lg sm:text-xl">
              {t('rsvp.subtitle')}
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <EpicRSVPForm 
              weddingId={wedding.id} 
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </div>
        </div>
      </section>

      {/* Wedding Details Section */}
      <section id="details" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-3xl sm:text-4xl font-serif text-center mb-12"
            style={{ 
              fontFamily: 'Great Vibes, cursive',
              color: primaryColor
            }}
          >
            {t('sections.weddingDetails')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* When */}
            <div className="bg-gray-50 rounded-2xl p-8 text-center shadow-lg">
              <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
              <h3 className="text-xl sm:text-2xl font-semibold mb-4">{t('details.when')}</h3>
              <p className="text-lg sm:text-xl mb-2">
                {wedding?.weddingDate ? format(new Date(wedding.weddingDate), 'd MMMM yyyy', { locale: getDateLocale() }) : t('details.dateTBD')}
              </p>
              <p className="text-gray-600">
                {t('details.ceremonyBegins')} {wedding?.weddingTime || '4:00 PM'}
              </p>
            </div>

            {/* Where */}
            <div className="bg-gray-50 rounded-2xl p-8 text-center shadow-lg">
              <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: primaryColor }} />
              <h3 className="text-xl sm:text-2xl font-semibold mb-4">{t('details.where')}</h3>
              <p className="text-lg sm:text-xl mb-2">{wedding?.venue || t('wedding.venue')}</p>
              <p className="text-gray-600 mb-4">{wedding?.venueAddress}</p>
              <button 
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
                className="px-6 py-2 text-white rounded-full transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
                disabled={!wedding?.mapPinUrl && !wedding?.venueAddress}
              >
                {t('details.showOnMap')}
              </button>
            </div>
          </div>

          {/* Social Share */}
          <div className="text-center mt-12">
            <h3 className="text-xl sm:text-2xl font-semibold mb-6">{t('share.title')}</h3>
            <p className="text-gray-600 mb-8">
              {t('share.subtitle')}
            </p>
            <div className="max-w-lg mx-auto">
              <EnhancedSocialShare
                weddingUrl={wedding.uniqueUrl}
                coupleName={`${wedding.bride} & ${wedding.groom}`}
                primaryColor={primaryColor}
                accentColor={accentColor}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Guest Book Section */}
      <section 
        id="guestbook" 
        className="py-16 px-4"
        style={{ backgroundColor: `${primaryColor}10` }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl sm:text-4xl font-serif mb-4"
              style={{ 
                fontFamily: 'Great Vibes, cursive',
                color: primaryColor
              }}
            >
              {t('sections.guestBook')}
            </h2>
            <p className="text-lg sm:text-xl">
              {t('guestBook.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-semibold mb-6">{t('guestBook.leaveMessage')}</h3>
              <GuestBookForm 
                weddingId={wedding.id}
                primaryColor={primaryColor}
                accentColor={accentColor}
              />
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-semibold mb-6">{t('guestBook.messages')}</h3>
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
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: primaryColor }} />
          <h3 className="text-2xl font-light mb-2" style={{ fontFamily: 'Great Vibes, cursive' }}>
            {wedding?.bride} {t('wedding.and') || 'и'} {wedding?.groom}
          </h3>
          <p className="text-gray-300 mb-8">
            {t('wedding.thankYouGuests')}
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto mb-8">
            <h4 className="text-lg font-medium mb-4">{t('ad.orderInvitation')}</h4>
            <p className="text-gray-300 mb-4 text-sm">
              {t('ad.createWebsite')}
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

      {/* Background Music Player */}
      {wedding.backgroundMusicUrl && (
        <BackgroundMusicPlayer
          musicUrl={wedding.backgroundMusicUrl}
          autoPlay={true}
          loop={true}
          triggerPlay={triggerMusicPlay}
        />
      )}
    </div>
  );
} 
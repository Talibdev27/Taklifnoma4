import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'wouter';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EnhancedCountdownTimer } from '@/components/enhanced-countdown-timer';
import { PhotoGallery } from '@/components/photo-gallery';
import { PhotoUpload } from '@/components/photo-upload';
import { SmartImageUpload } from '@/components/smart-image-upload';
import { GuestManagementDashboard } from '@/components/guest-management-dashboard';
import { EnhancedRSVPForm } from '@/components/enhanced-rsvp-form';
import { WeddingLanguageSwitcher } from '@/components/wedding-language-switcher';
import { EnhancedSocialShare } from '@/components/enhanced-social-share';
import { WeddingPageLoading } from '@/components/ui/loading';
import { EpicTemplate } from '@/components/epic-template';
import { BirthdayTemplate } from '@/components/birthday-template';
import { Anime1Template } from '@/components/anime-1-template';
import { FlowerTemplate } from '@/components/flower-template';
import { GulTemplate } from '@/components/gul-template';
import { Customer1Template } from '@/components/ccostumer-1-template';
import { BackgroundMusicPlayer } from '@/components/background-music-player';
import { WeddingWelcomeOverlay } from '@/components/wedding-welcome-overlay';
import { formatDate } from '@/lib/utils';
import { MapPin, Heart, MessageSquare, Calendar, Music, Clock, ExternalLink, MessageCircle } from 'lucide-react';
import type { Wedding, GuestBookEntry } from '@shared/schema';

export default function WeddingSite() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const uniqueUrl = params.uniqueUrl as string;
  
  // Welcome overlay state
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [triggerMusicPlay, setTriggerMusicPlay] = useState(false);
  
  // For now, assume user is guest by default - owners can access via special URL
  const isOwner = false;

  // Check if welcome overlay should be shown (only once per session)
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem(`wedding-welcome-${uniqueUrl}`);
    if (!hasSeenWelcome) {
      setShowWelcomeOverlay(true);
    }
  }, [uniqueUrl]);

  // Handle user entering the site
  const handleEnterSite = () => {
    // Mark welcome as seen for this wedding
    sessionStorage.setItem(`wedding-welcome-${uniqueUrl}`, 'true');
    
    // Hide overlay and trigger music
    setShowWelcomeOverlay(false);
    setTriggerMusicPlay(true);
    
    // Reset trigger after a short delay
    setTimeout(() => {
      setTriggerMusicPlay(false);
    }, 1000);
  };

  const { data: wedding, isLoading, error } = useQuery<Wedding>({
    queryKey: [`/api/weddings/url/${uniqueUrl}`],
    queryFn: () => fetch(`/api/weddings/url/${uniqueUrl}`).then(res => res.json()),
    enabled: !!uniqueUrl,
  });

  const { data: guestBookEntries = [] } = useQuery<GuestBookEntry[]>({
    queryKey: ['/api/guest-book/wedding', wedding?.id],
    queryFn: () => fetch(`/api/guest-book/wedding/${wedding?.id}`).then(res => res.json()),
    enabled: !!wedding?.id,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['/api/photos/wedding', wedding?.id],
    queryFn: () => fetch(`/api/photos/wedding/${wedding?.id}`).then(res => res.json()),
    enabled: !!wedding?.id,
  });

  // Set language based on wedding's default language
  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      console.log('Wedding site: Setting language to', wedding.defaultLanguage);
      i18n.changeLanguage(wedding.defaultLanguage);
    }
  }, [wedding?.defaultLanguage, i18n]);

  if (isLoading) {
    return <WeddingPageLoading message={t('common.loading')} />;
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center">
        <Card className="wedding-card max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-xl font-playfair font-semibold text-charcoal mb-2">
              Wedding Not Found
            </h2>
            <p className="text-charcoal opacity-70">
              This wedding website doesn't exist or has been made private.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for Epic template first
  if (wedding?.template === 'epic') {
    console.log('Rendering Epic template for wedding:', wedding);
    return <EpicTemplate wedding={wedding} />;
  }

  // Check for Birthday template
  if (wedding?.template === 'birthday') {
    console.log('Rendering Birthday template for wedding:', wedding);
    return <BirthdayTemplate wedding={wedding} />;
  }

  // Check for Anime1 template
  if (wedding?.template === 'anime_1') {
    console.log('Rendering Anime1 template for wedding:', wedding);
    return <Anime1Template wedding={wedding as any} guests={[]} photos={photos} guestBookEntries={guestBookEntries} />;
  }

  // Check for Flower template
  if (wedding?.template === 'flower') {
    console.log('Rendering Flower template for wedding:', wedding);
    return <FlowerTemplate wedding={wedding} />;
  }

  // Check for Gul template
  if (wedding?.template === 'gul') {
    console.log('Rendering Gul template for wedding:', wedding);
    return <GulTemplate wedding={wedding} />;
  }

  // Check for Customer 1 template
  if (wedding?.template === 'ccostumer_1') {
    console.log('Rendering Customer 1 template for wedding:', wedding);
    return <Customer1Template wedding={wedding} />;
  }

  // Template-specific configurations
  const templateConfigs = {
    gardenRomance: {
      heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      bgGradient: "from-rose-50 to-green-50",
      primaryColor: "#D4B08C",
      accentColor: "#89916B",
      textColor: "text-emerald-900",
      cardBg: "bg-white/90 backdrop-blur-sm",
      overlayBg: "bg-emerald-900/40"
    },
    epic: {
      heroImage: wedding?.couplePhotoUrl || "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      bgGradient: "from-blue-50 to-indigo-100",
      primaryColor: "#1976d2",
      accentColor: "#1565c0",
      textColor: "text-blue-900",
      cardBg: "bg-white/95 backdrop-blur-sm border border-blue-200",
      overlayBg: "bg-blue-900/40"
    },
    modernElegance: {
      heroImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      bgGradient: "from-slate-50 to-gray-100",
      primaryColor: "#2C3338",
      accentColor: "#8B7355",
      textColor: "text-slate-900",
      cardBg: "bg-white shadow-2xl",
      overlayBg: "bg-slate-900/50"
    },
    rusticCharm: {
      heroImage: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      bgGradient: "from-amber-50 to-orange-50",
      primaryColor: "#8B4513",
      accentColor: "#CD853F",
      textColor: "text-amber-900",
      cardBg: "bg-amber-50/95 border border-amber-200",
      overlayBg: "bg-amber-900/40"
    },
    beachBliss: {
      heroImage: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      bgGradient: "from-cyan-50 to-blue-50",
      primaryColor: "#2E86AB",
      accentColor: "#A23B72",
      textColor: "text-cyan-900",
      cardBg: "bg-cyan-50/90 backdrop-blur-sm",
      overlayBg: "bg-cyan-900/40"
    },
    classicTradition: {
      heroImage: "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      bgGradient: "from-gray-50 to-stone-100",
      primaryColor: "#1F2937",
      accentColor: "#6B7280",
      textColor: "text-gray-900",
      cardBg: "bg-white border border-gray-200 shadow-lg",
      overlayBg: "bg-gray-900/50"
    },
    bohoChic: {
      heroImage: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      bgGradient: "from-orange-50 to-yellow-50",
      primaryColor: "#92400E",
      accentColor: "#F59E0B",
      textColor: "text-orange-900",
      cardBg: "bg-orange-50/95 border border-orange-200",
      overlayBg: "bg-orange-900/40"
    },
    standard: {
      heroImage: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      bgGradient: "from-white to-gray-50",
      primaryColor: "#4A5568",
      accentColor: "#68D391",
      textColor: "text-gray-800",
      cardBg: "bg-white shadow-md border border-gray-100",
      overlayBg: "bg-gray-900/30",
      backgroundTemplates: {
        template1: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        template2: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        template3: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        template4: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        template5: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        template6: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080"
      }
    }
  };

  const currentTemplate = wedding.template || 'gardenRomance';
  const config = templateConfigs[currentTemplate as keyof typeof templateConfigs] || templateConfigs.gardenRomance;

  // For Standard template, determine hero image based on user preference
  const getStandardHeroImage = () => {
    // For "standard" template, always prioritize the couple's photo if it exists
    if (currentTemplate === 'standard' && wedding.couplePhotoUrl) {
      return wedding.couplePhotoUrl;
    }
  
    // Fallback for other templates or if no photo is available for standard
    const backgroundTemplates = {
      template1: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      template2: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      template3: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      template4: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      template5: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      template6: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080"
    };
      
    if (wedding.backgroundTemplate && backgroundTemplates[wedding.backgroundTemplate as keyof typeof backgroundTemplates]) {
      return backgroundTemplates[wedding.backgroundTemplate as keyof typeof backgroundTemplates];
    }
    
    // Fall back to template's default hero or a global default
    return config.heroImage || backgroundTemplates.template1;
  };

  // Check if using couple photo for enhanced overlay
  const isUsingCouplePhoto = wedding.couplePhotoUrl && currentTemplate === 'standard';

  const heroImage = getStandardHeroImage();

  const customStyles = {
    '--primary': config.primaryColor,
    '--accent': config.accentColor,
  } as React.CSSProperties;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient}`} style={customStyles}>
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

      {/* Language switcher - Always show with 3 languages */}
      <div className="fixed top-4 right-4 z-50">
        <WeddingLanguageSwitcher 
          availableLanguages={wedding.availableLanguages || ['en', 'ru', 'uz', 'kk']}
          defaultLanguage={wedding.defaultLanguage}
        />
      </div>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <img
          src={heroImage}
          alt="Wedding couple"
          className={`w-full h-full ${currentTemplate === 'standard' ? 'object-cover object-center' : 'object-cover'}`}
          style={currentTemplate === 'standard' ? {
            filter: 'brightness(0.8) contrast(1.1)',
            objectPosition: 'center 30%'
          } : {}}
        />
        <div className={`absolute inset-0 ${currentTemplate === 'standard' ? (isUsingCouplePhoto ? 'bg-gradient-to-b from-black/40 via-black/50 to-black/60' : 'bg-gradient-to-b from-black/20 via-black/30 to-black/50') : config.overlayBg}`}></div>
        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <div className={`max-w-2xl px-4 ${currentTemplate === 'standard' ? (isUsingCouplePhoto ? 'bg-black/60 backdrop-blur-md rounded-2xl py-6 px-6' : 'bg-black/40 backdrop-blur-sm rounded-2xl py-8 px-8') : ''}`}>
            <h1 className={`font-playfair font-bold mb-4 ${currentTemplate === 'standard' ? 'text-white drop-shadow-2xl' : 'text-shadow'} ${isUsingCouplePhoto ? 'text-3xl md:text-5xl' : 'text-4xl md:text-6xl'}`}>
              {wedding.bride} & {wedding.groom}
            </h1>
            <p className={`font-cormorant mb-6 ${currentTemplate === 'standard' ? 'text-white/95 drop-shadow-xl' : 'text-shadow'} ${isUsingCouplePhoto ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`}>
              {formatDate(wedding.weddingDate, i18n.language)}
            </p>
            
            {/* Ceremony Time */}
            <div className={`flex items-center justify-center mb-4 ${currentTemplate === 'standard' ? 'text-white/95' : 'text-white opacity-90'}`}>
              <Clock className={`mr-2 ${isUsingCouplePhoto ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span className={isUsingCouplePhoto ? 'text-base' : 'text-lg'}>{wedding.weddingTime}</span>
            </div>
            
            <EnhancedCountdownTimer 
              targetDate={wedding.weddingDate} 
              weddingTime={wedding.weddingTime}
              timezone={wedding.timezone}
              variant="compact" 
              className={isUsingCouplePhoto ? 'mb-4' : 'mb-6'} 
            />
            
            {/* Location with Dialog */}
            <div className="flex justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <button className={`flex items-center justify-center hover:scale-105 transition-transform cursor-pointer ${currentTemplate === 'standard' ? 'text-white/95 hover:text-white' : 'text-white opacity-90 hover:opacity-100'}`}>
                    <MapPin className={`mr-2 ${isUsingCouplePhoto ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    <span className={isUsingCouplePhoto ? 'text-base' : 'text-lg'}>{wedding.venue}</span>
                  </button>
                </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Wedding Location
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{wedding.venue}</h3>
                    <p className="text-gray-600">{wedding.venueAddress}</p>
                    <p className="text-gray-600 flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4" />
                      Ceremony begins at {wedding.weddingTime}
                    </p>
                  </div>
                  
                  {/* Map iframe */}
                  {wedding.venueCoordinates && (
                    <div className="space-y-3">
                      <div className="w-full h-96 rounded-lg overflow-hidden border">
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${wedding.venueCoordinates.lng-0.01},${wedding.venueCoordinates.lat-0.01},${wedding.venueCoordinates.lng+0.01},${wedding.venueCoordinates.lat+0.01}&layer=mapnik&marker=${wedding.venueCoordinates.lat},${wedding.venueCoordinates.lng}`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          onClick={() => {
                            if (wedding.venueCoordinates) {
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${wedding.venueCoordinates.lat},${wedding.venueCoordinates.lng}`, '_blank');
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Get Directions
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            if (wedding.venueCoordinates) {
                              window.open(`https://maps.apple.com/?daddr=${wedding.venueCoordinates.lat},${wedding.venueCoordinates.lng}`, '_blank');
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4" />
                          Open in Apple Maps
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Fallback if no coordinates */}
                  {!wedding.venueCoordinates && (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">Map coordinates not available</p>
                      <Button 
                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(wedding.venueAddress)}`, '_blank')}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Search on Google Maps
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <nav className="sticky top-0 bg-white shadow-md z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center space-x-8 py-4">
            {/* Only show navigation items for sections that exist */}
            {(wedding.dearGuestMessage || wedding.welcomeMessage) && (
              <a href="#dear-guests" className="text-charcoal hover:text-romantic-gold transition-colors font-medium">
                {t('wedding.dearGuests')}
              </a>
            )}
            {currentTemplate !== 'standard' && ((wedding.story && wedding.story.trim()) || (photos && photos.filter((photo: any) => photo.photoType === 'couple').length > 0)) && (
              <a href="#story" className="text-charcoal hover:text-romantic-gold transition-colors font-medium">
                {t('wedding.ourStory')}
              </a>
            )}
            {((photos && photos.filter((photo: any) => photo.photoType === 'memory').length > 0) || isOwner) && (
              <a href="#photos" className="text-charcoal hover:text-romantic-gold transition-colors font-medium">
                {t('wedding.photos')}
              </a>
            )}
            <a href="#rsvp" className="text-charcoal hover:text-romantic-gold transition-colors font-medium">
              {t('wedding.rsvp')}
            </a>
            <a href="#details" className="text-charcoal hover:text-romantic-gold transition-colors font-medium">
              {t('wedding.weddingDetails')}
            </a>
            <a href="#guestbook" className="text-charcoal hover:text-romantic-gold transition-colors font-medium">
              {t('wedding.guestBook')}
            </a>
          </div>
        </div>
      </nav>

      {/* Dear Guests Section - Enhanced for Standard template */}
      {(wedding.dearGuestMessage || wedding.welcomeMessage) && (
        <section id="dear-guests" className="py-20 bg-gradient-to-b from-white to-soft-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-charcoal mb-6">
                {t('wedding.dearGuests')}
              </h2>
              <div className="max-w-3xl mx-auto">
                <div className={`${currentTemplate === 'standard' ? 'bg-white/95' : 'bg-white'} rounded-2xl shadow-lg p-8 md:p-12 border border-romantic-gold/20`}>
                  <div className="prose prose-lg max-w-none text-charcoal leading-relaxed">
                    {(wedding.dearGuestMessage || wedding.welcomeMessage)?.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 last:mb-0 text-lg">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-center">
                    <div className="w-24 h-0.5 bg-romantic-gold"></div>
                  </div>
                  <p className="mt-6 text-romantic-gold font-playfair font-semibold text-xl">
                    {wedding.bride} & {wedding.groom}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Our Story Section - Only show if there's a story or couple photo, but hide for Standard template */}
      {currentTemplate !== 'standard' && ((wedding.story && wedding.story.trim()) || (photos && photos.filter((photo: any) => photo.photoType === 'couple').length > 0)) ? (
        <section id="story" className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`text-3xl lg:text-4xl font-playfair font-bold ${config.textColor} mb-6`}>
                {t('wedding.ourStory')}
              </h2>
            </div>

            {wedding.story && wedding.story.trim() ? (
              // When there's a custom love story, show it prominently with photo
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  {photos && photos.filter((photo: any) => photo.photoType === 'couple').length > 0 ? (
                    <div className="rounded-xl shadow-lg w-full aspect-[4/5] overflow-hidden">
                      <img 
                        src={photos.filter((photo: any) => photo.photoType === 'couple')[0].url} 
                        alt={`${wedding.bride} & ${wedding.groom}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl shadow-lg w-full aspect-[4/3] bg-sage-green/10 flex items-center justify-center">
                      <div className="text-center p-8">
                        <Heart className="h-16 w-16 text-romantic-gold mx-auto mb-4" />
                        <p className="text-charcoal opacity-70">
                          {wedding.bride.split(' ')[0]} & {wedding.groom.split(' ')[0]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div className={`prose prose-lg max-w-none ${config.textColor} opacity-80 leading-relaxed`}>
                    <p className="text-lg">{wedding.story}</p>
                  </div>
                </div>
              </div>
            ) : (
              // When there's no custom story but couple photo exists, show beautiful photo layout
              <div className="max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="rounded-2xl shadow-2xl w-full max-w-md mx-auto aspect-[4/5] overflow-hidden mb-8">
                    <img 
                      src={photos.filter((photo: any) => photo.photoType === 'couple')[0].url} 
                      alt={`${wedding.bride} & ${wedding.groom}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="space-y-4">
                    <Heart className="h-12 w-12 text-romantic-gold mx-auto" />
                    <h3 className="text-2xl font-playfair font-semibold text-charcoal">
                      {wedding.bride} & {wedding.groom}
                    </h3>
                    <p className="text-lg text-charcoal opacity-70 max-w-md mx-auto leading-relaxed">
                      Two hearts, one beautiful journey together
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Photo Gallery Section - Only show if there are memory photos or if owner can upload */}
      {(photos && photos.filter((photo: any) => photo.photoType === 'memory').length > 0) || isOwner ? (
        <section id="photos" className="py-20 bg-soft-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-charcoal">
                {t('wedding.photos')}
              </h2>
              <p className="mt-4 text-lg text-charcoal opacity-70">
                {t('wedding.capturingJourney')}
              </p>
              
              {/* Enhanced Photo Upload Options - Only visible to wedding owners */}
              {isOwner && (
                <div className="mt-6 flex gap-3 justify-center">
                  <PhotoUpload 
                    weddingId={wedding.id} 
                    isOwner={true}
                    onSuccess={() => {
                      // Photos will automatically refresh via React Query
                    }}
                  />
                  <SmartImageUpload 
                    weddingId={wedding.id} 
                    isOwner={true}
                    onSuccess={() => {
                      // Photos will automatically refresh via React Query
                    }}
                  />
                </div>
              )}
            </div>
            
            <PhotoGallery weddingId={wedding.id} />
          </div>
        </section>
      ) : null}

      {/* RSVP Section - Now available for all templates including Standard */}
      <section id="rsvp" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-charcoal">
              {t('wedding.rsvp')}
            </h2>
            <p className="mt-4 text-lg text-charcoal opacity-70">
              {t('wedding.cantWaitToCelebrate')}
            </p>
          </div>
          
                          <EnhancedRSVPForm weddingId={wedding.id} />
        </div>
      </section>

      {/* Wedding Details Section */}
      <section id="details" className="py-20 bg-soft-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-charcoal">
              {t('wedding.weddingDetails')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="wedding-card">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-romantic-gold mx-auto mb-4" />
                <h3 className="text-xl font-playfair font-semibold text-charcoal mb-2">
                  {t('wedding.when')}
                </h3>
                <p className="text-lg text-charcoal">
                  {formatDate(wedding.weddingDate)}
                </p>
                <p className="text-charcoal opacity-70 mt-2">
                  {t('wedding.ceremonyBegins')} {wedding.weddingTime || '4:00 PM'}
                </p>
              </CardContent>
            </Card>

            <Card className="wedding-card">
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 text-romantic-gold mx-auto mb-4" />
                <h3 className="text-xl font-playfair font-semibold text-charcoal mb-2">
                  {t('wedding.where')}
                </h3>
                <p className="text-lg text-charcoal font-medium">
                  {wedding.venue}
                </p>
                {/* Only show address if it's not a Google Maps URL */}
                {wedding.venueAddress && !wedding.venueAddress.includes('maps.app.goo.gl') && (
                  <p className="text-charcoal opacity-70 mt-2">
                    {wedding.venueAddress}
                  </p>
                )}
                {/* Show address text for Google Maps URLs */}
                {wedding.venueAddress && wedding.venueAddress.includes('maps.app.goo.gl') && (
                  <p className="text-charcoal opacity-70 mt-2">
                    {t('wedding.clickToViewLocation')}
                  </p>
                )}
                <Button 
                  variant="outline" 
                  className="mt-4 wedding-button-outline"
                  onClick={() => {
                    if (wedding.venueAddress) {
                      // Check if it's already a URL
                      if (wedding.venueAddress.startsWith('http')) {
                        window.open(wedding.venueAddress, '_blank');
                      } else {
                        // If it's just an address, create a Google Maps search URL
                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venueAddress)}`;
                        window.open(googleMapsUrl, '_blank');
                      }
                    }
                  }}
                >
                  {t('wedding.viewOnMap')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Social Share Section */}
      <section className="py-16 bg-sage-green/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <EnhancedSocialShare
            weddingUrl={wedding.uniqueUrl}
            coupleName={`${wedding.bride.split(' ')[0]} & ${wedding.groom.split(' ')[0]}`}
          />
        </div>
      </section>

      {/* Guest Book Section */}
      <section id="guestbook" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-charcoal">
              {t('wedding.guestBook')}
            </h2>
            <p className="mt-4 text-lg text-charcoal opacity-70">
              {t('wedding.guestBookSubtitle')}
            </p>
          </div>

          <div className="space-y-8">
            {guestBookEntries.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-playfair font-semibold text-charcoal">{t('wedding.messagesFromLovedOnes')}</h3>
                {guestBookEntries.slice(0, 5).map((entry) => (
                  <Card key={entry.id} className="wedding-card">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <MessageSquare className="h-6 w-6 text-romantic-gold mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-charcoal italic leading-relaxed">
                            "{entry.message}"
                          </p>
                          <p className="text-romantic-gold font-medium mt-2">
                            — {entry.guestName}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Background Music Player */}
      {wedding.backgroundMusicUrl && (
        <BackgroundMusicPlayer 
          musicUrl={wedding.backgroundMusicUrl}
          autoPlay={true}
          loop={true}
          triggerPlay={triggerMusicPlay}
        />
      )}

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-romantic-gold mr-2" />
            <span className="text-2xl font-playfair font-semibold">
              {wedding.bride} & {wedding.groom}
            </span>
          </div>
          <p className="text-gray-300 mb-8">
            {t('wedding.thankYouGuests')}
          </p>
          
          {/* Uzbek Advertisement Section */}
          <div className="border-t border-gray-600 pt-8">
            <div className="bg-gradient-to-r from-romantic-gold/10 to-romantic-gold/5 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-romantic-gold mb-3">
                {t('ad.orderInvitation')}
              </h3>
              <p className="text-gray-300 mb-4">
                {t('ad.createWebsite')}
              </p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <a 
                  href="https://t.me/link_taklif" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  {t('share.telegram')}
                </a>
                <a 
                  href="https://www.instagram.com/taklif_link?igsh=cjRra3cxcHN3Y3U1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition-colors duration-200"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  {t('share.instagram')}
                </a>
              </div>
            </div>
            
            <div className="flex items-center justify-center text-gray-400 text-sm">
              <span>{t('footer.poweredBy')}</span>
              <Heart className="inline h-4 w-4 text-romantic-gold mx-2" />
              <span className="font-semibold text-romantic-gold">Taklif</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

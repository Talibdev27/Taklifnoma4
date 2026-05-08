import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageToggle } from '@/website/components/language-toggle';
import { 
  Heart, Palette, Calendar, Camera, Globe, MapPin, Music, 
  Check, Menu, X, Star, Users, MessageSquare, Sparkles, Phone, User 
} from 'lucide-react';
import { isFreeTemplate } from '@/lib/template-tiers';

export default function Landing() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detect scroll to change nav colors
  useEffect(() => {
    // Check initial scroll position
    const checkScroll = () => {
      const scrollPosition = window.scrollY;
      const shouldBeScrolled = scrollPosition > 1000;
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
      }
    };

    // Check immediately on mount
    checkScroll();

    // Add scroll listener
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, [isScrolled]);

  const features = [
    {
      icon: Palette,
      titleKey: 'features.customization',
      descriptionKey: 'features.customizationDesc',
    },
    {
      icon: Calendar,
      titleKey: 'features.rsvpManagement',
      descriptionKey: 'features.rsvpManagementDesc',
    },
    {
      icon: Camera,
      titleKey: 'features.photoGalleries',
      descriptionKey: 'features.photoGalleriesDesc',
    },
    {
      icon: Globe,
      titleKey: 'features.multiLanguage',
      descriptionKey: 'features.multiLanguageDesc',
    },
    {
      icon: MapPin,
      titleKey: 'features.venueIntegration',
      descriptionKey: 'features.venueIntegrationDesc',
    },
    {
      icon: Music,
      titleKey: 'features.backgroundMusic',
      descriptionKey: 'features.backgroundMusicDesc',
    },
  ];

  // The four templates currently offered to new users. The legacy
  // gardenRomance / modernElegance / rusticCharm / beachBliss /
  // classicTradition / bohoChic ids still render correctly for any
  // existing weddings (renderers + tier list keep them) but we've
  // retired them from the public picker.
  const templates = [
    {
      nameKey: 'templates.modern',
      image: '/modern_wedding_im.jpg',
      descriptionKey: 'templates.modernDesc',
    },
    {
      nameKey: 'templates.velvet',
      image: '/new2.jpg',
      descriptionKey: 'templates.velvetDesc',
    },
    {
      nameKey: 'templates.pearl',
      image: '/new3.jpg',
      descriptionKey: 'templates.pearlDesc',
    },
    {
      nameKey: 'templates.aurora',
      image: '/new4.jpg',
      descriptionKey: 'templates.auroraDesc',
    },
  ];

  const invitationComparisonItems = [
    {
      traditionalKey: 'comparison.traditional.item1',
      modernKey: 'comparison.modern.item1',
    },
    {
      traditionalKey: 'comparison.traditional.item2',
      modernKey: 'comparison.modern.item2',
    },
    {
      traditionalKey: 'comparison.traditional.item3',
      modernKey: 'comparison.modern.item3',
    },
    {
      traditionalKey: 'comparison.traditional.item4',
      modernKey: 'comparison.modern.item4',
    },
    {
      traditionalKey: 'comparison.traditional.item5',
      modernKey: 'comparison.modern.item5',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Desktop Navigation */}
        <div className="hidden md:block max-w-7xl mx-auto">
          <div className={`backdrop-blur-2xl rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/95 border-gray-200' 
              : 'bg-white/10 border-white/20'
          }`}>
            <div className="flex items-center justify-between px-6 py-3">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative h-12 w-12 rounded-full overflow-hidden shadow-lg ring-2 ring-taklif-gold/30 group-hover:ring-taklif-gold transition-all">
                  <img 
                    src="/takliflinklogo.jpg" 
                    alt="Taklif Link" 
                    className="h-full w-full object-cover scale-125"
                  />
                </div>
                <h1 className={`text-xl font-playfair font-bold transition-colors ${
                  isScrolled 
                    ? 'text-taklif-navy group-hover:text-taklif-gold' 
                    : 'text-white group-hover:text-taklif-gold'
                }`}>
                  Taklif Link
                </h1>
              </Link>

              {/* Center Menu Items */}
              <div className="flex items-center space-x-8">
                <a href="#templates" className={`text-sm font-medium transition-colors ${
                  isScrolled 
                    ? 'text-taklif-navy hover:text-taklif-gold' 
                    : 'text-white/90 hover:text-taklif-gold'
                }`}>
                  {t('nav.templates')}
                </a>
                <a href="#features" className={`text-sm font-medium transition-colors ${
                  isScrolled 
                    ? 'text-taklif-navy hover:text-taklif-gold' 
                    : 'text-white/90 hover:text-taklif-gold'
                }`}>
                  {t('nav.features')}
                </a>
                <a href="#pricing" className={`text-sm font-medium transition-colors ${
                  isScrolled 
                    ? 'text-taklif-navy hover:text-taklif-gold' 
                    : 'text-white/90 hover:text-taklif-gold'
                }`}>
                  {t('nav.pricing')}
                </a>
              </div>

              {/* Right Side Items */}
              <div className="flex items-center space-x-4">
                {/* Contact Button */}
                <a href="tel:+998901234567" className={`flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-full transition-all border shadow-lg ${
                  isScrolled
                    ? 'bg-gray-100 hover:bg-gray-200 text-taklif-navy border-gray-300'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                }`}>
                  <Phone className="h-4 w-4 text-taklif-gold" />
                  <span className="text-sm font-medium">+998 90 123 45 67</span>
                </a>

                {/* Language Toggle */}
                <div className={`backdrop-blur-sm rounded-full p-2 transition-all border shadow-lg ${
                  isScrolled
                    ? 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                    : 'bg-white/15 hover:bg-white/25 border-white/20'
                }`}>
                  <LanguageToggle isScrolled={isScrolled} />
                </div>

                {/* User Icon */}
                <Link href="/login">
                  <Button variant="ghost" size="icon" className={`backdrop-blur-sm rounded-full border shadow-lg ${
                    isScrolled
                      ? 'bg-gray-100 hover:bg-gray-200 text-taklif-navy border-gray-300'
                      : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                  }`}>
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden max-w-2xl mx-auto">
          <div className={`backdrop-blur-2xl rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/95 border-gray-200' 
              : 'bg-white/20 border-white/30'
          }`}>
            <div className="flex items-center justify-between px-4 py-3">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full overflow-hidden shadow-lg ring-2 ring-taklif-gold/30">
                  <img 
                    src="/takliflinklogo.jpg" 
                    alt="Taklif Link" 
                    className="h-full w-full object-cover scale-125"
                  />
                </div>
                <h1 className={`text-lg font-playfair font-bold transition-colors ${
                  isScrolled ? 'text-taklif-navy' : 'text-white'
                }`}>
                  Taklif Link
                </h1>
              </Link>

              {/* Right Icons */}
              <div className="flex items-center space-x-2">
                <div className={`backdrop-blur-sm rounded-full p-1.5 border shadow-lg transition-all ${
                  isScrolled
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-white/20 border-white/30'
                }`}>
                  <LanguageToggle isScrolled={isScrolled} />
                </div>
                <Link href="/login">
                  <Button variant="ghost" size="icon" className={`backdrop-blur-sm rounded-full h-9 w-9 border shadow-lg transition-all ${
                    isScrolled
                      ? 'bg-gray-100 hover:bg-gray-200 text-taklif-navy border-gray-300'
                      : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                  }`}>
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`backdrop-blur-sm rounded-full h-9 w-9 border shadow-lg transition-all ${
                    isScrolled
                      ? 'bg-gray-100 hover:bg-gray-200 text-taklif-navy border-gray-300'
                      : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                  }`}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className={`mt-2 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border overflow-hidden transition-all duration-300 ${
              isScrolled
                ? 'bg-white/95 border-gray-200'
                : 'bg-white/20 border-white/30'
            }`}>
              <div className="px-4 py-3 space-y-1">
                <a href="#templates" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl transition-all ${
                  isScrolled
                    ? 'text-taklif-navy hover:bg-gray-100'
                    : 'text-white hover:bg-white/5'
                } hover:text-taklif-gold`}>
                  {t('nav.templates')}
                </a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl transition-all ${
                  isScrolled
                    ? 'text-taklif-navy hover:bg-gray-100'
                    : 'text-white/90 hover:bg-white/10'
                } hover:text-taklif-gold`}>
                  {t('nav.features')}
                </a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl transition-all ${
                  isScrolled
                    ? 'text-taklif-navy hover:bg-gray-100'
                    : 'text-white/90 hover:bg-white/10'
                } hover:text-taklif-gold`}>
                  {t('nav.pricing')}
                </a>
                <Link href="/create-wedding" className="block">
                  <Button className="w-full mt-2 bg-taklif-gold hover:bg-taklif-gold/90 text-gray-900 font-semibold rounded-xl">
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center overflow-hidden pt-24 sm:pt-28">
        {/* Background with overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-taklif-navy via-taklif-navy/90 to-taklif-navy">
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: 'url(/bg_image.jpeg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-taklif-gold/40 bg-taklif-gold/10 backdrop-blur-sm mb-8">
              <Sparkles className="h-4 w-4 text-taklif-gold" />
              <span className="text-sm font-medium text-taklif-gold tracking-wider uppercase">
                {t('hero.badge')}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-playfair font-bold text-white leading-tight mb-6">
              {t('hero.newTitle')} <span className="italic text-taklif-gold font-serif">{t('hero.newTitleLove')}</span>
              <br className="hidden sm:block" /> {t('hero.newTitleEnd')}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/90 font-light leading-relaxed max-w-3xl mx-auto mb-10">
              {t('hero.newSubtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#templates">
                <Button className="bg-taklif-gold hover:bg-taklif-gold/90 text-gray-900 text-base font-semibold px-8 py-6 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto flex items-center gap-2">
                  {t('hero.browseTemplates')}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </a>
              <Link href="/create-wedding">
                <Button variant="outline" className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-taklif-navy text-base font-semibold px-8 py-6 rounded-lg transition-all duration-300 w-full sm:w-auto">
                  {t('hero.seeHowItWorks')}
                </Button>
              </Link>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center mt-16 mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-taklif-gold/50 to-transparent w-64"></div>
              <Heart className="h-6 w-6 text-taklif-gold mx-4" fill="currentColor" />
              <div className="h-px bg-gradient-to-r from-transparent via-taklif-gold/50 to-transparent w-64"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Template Gallery */}
      <section id="templates" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-taklif-navy">
              {t('templates.title')}
            </h2>
            <p className="mt-4 text-lg text-taklif-navy opacity-70 max-w-2xl mx-auto">
              {t('templates.subtitle')}
            </p>
          </div>

          {/* Mobile: Horizontal Scroll, Desktop: Grid */}
          <div className="md:hidden flex overflow-x-auto gap-4 pb-4 scrollbar-hide pl-4 snap-x snap-mandatory">
            {templates.map((template, index) => {
              const templateId = template.nameKey.split('.')[1];
              const isFree = isFreeTemplate(templateId);
              return (
                <div key={index} className="relative group flex-shrink-0 w-[280px] snap-start rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                  {/* Background Image/Video */}
                  <div className="relative h-[420px]">
                    <img 
                      src={template.image} 
                      alt={t(template.nameKey)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                    
                    {/* Badge - Top Left */}
                    <div className="absolute top-4 left-4">
                      {isFree ? (
                        <Badge className="bg-taklif-gold hover:bg-taklif-gold/90 text-gray-900 font-semibold px-3 py-1 shadow-lg">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Oddiy
                        </Badge>
                      ) : (
                        <Badge className="bg-taklif-navy hover:bg-taklif-navy/90 text-white font-semibold px-3 py-1 shadow-lg">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    {/* Number Circle - Top Left Below Badge */}
                    <div className="absolute top-16 left-4">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                    </div>
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="text-2xl font-playfair font-bold text-white mb-2">
                        {t(template.nameKey)}
                      </h3>
                      <p className="text-sm text-white/90 mb-4 line-clamp-2">
                        {t(template.descriptionKey)}
                      </p>
                      <Link href={`/demo?template=${templateId}`}>
                        <Button className="w-full bg-white/90 hover:bg-white text-taklif-navy font-semibold rounded-lg backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                          <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                          {t('templates.previewTemplate')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Coming Soon Card - Mobile */}
            <div className="relative group flex-shrink-0 w-[280px] snap-start rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-105">
              <div className="relative h-[420px] bg-gradient-to-br from-taklif-burgundy/60 via-taklif-burgundy/80 to-taklif-burgundy flex flex-col items-center justify-center p-8 overflow-hidden">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 animate-pulse"></div>
                
                {/* Decorative dots pattern with animation */}
                <div className="absolute inset-0 opacity-20 animate-pulse" style={{
                  backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  animation: 'float 20s ease-in-out infinite'
                }}></div>
                
                {/* Floating particles */}
                <div className="absolute top-10 left-10 w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
                <div className="absolute top-20 right-16 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
                <div className="absolute bottom-24 left-16 w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
                <div className="absolute bottom-32 right-12 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}></div>
                
                {/* Clock Icon with animations */}
                <div className="relative mb-8 group-hover:scale-110 transition-transform duration-500">
                  {/* Pulsing rings */}
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-white/20 animate-ping"></div>
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-white/30 animate-pulse"></div>
                  
                  <div className="relative w-20 h-20 rounded-full border-4 border-white/60 flex items-center justify-center bg-white/10 backdrop-blur-sm group-hover:border-white/90 group-hover:bg-white/20 transition-all duration-500">
                    {/* Animated clock icon */}
                    <svg className="w-10 h-10 text-white/80 group-hover:text-white transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" className="origin-center" style={{
                        animation: 'spin 4s linear infinite'
                      }} />
                    </svg>
                  </div>
                </div>
                
                {/* Text Content with slide-up animation */}
                <div className="relative z-10 group-hover:-translate-y-2 transition-transform duration-500">
                  <h3 className="text-3xl font-playfair font-bold text-white mb-3 text-center drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {t('templates.comingSoon')}
                  </h3>
                  <p className="text-white/80 text-center text-base drop-shadow group-hover:text-white transition-colors duration-300">
                    {t('templates.comingSoonDesc')}
                  </p>
                </div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              </div>
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template, index) => {
              const templateId = template.nameKey.split('.')[1];
              const isFree = isFreeTemplate(templateId);
              return (
                <div key={index} className="relative group rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  {/* Background Image/Video */}
                  <div className="relative h-[420px]">
                    <img 
                      src={template.image} 
                      alt={t(template.nameKey)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                    
                    {/* Badge - Top Left */}
                    <div className="absolute top-4 left-4">
                      {isFree ? (
                        <Badge className="bg-taklif-gold hover:bg-taklif-gold/90 text-gray-900 font-semibold px-3 py-1 shadow-lg">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Oddiy
                        </Badge>
                      ) : (
                        <Badge className="bg-taklif-navy hover:bg-taklif-navy/90 text-white font-semibold px-3 py-1 shadow-lg">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    {/* Number Circle - Top Left Below Badge */}
                    <div className="absolute top-16 left-4">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                    </div>
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="text-2xl font-playfair font-bold text-white mb-2">
                        {t(template.nameKey)}
                      </h3>
                      <p className="text-sm text-white/90 mb-4 line-clamp-2">
                        {t(template.descriptionKey)}
                      </p>
                      <Link href={`/demo?template=${templateId}`}>
                        <Button className="w-full bg-white/90 hover:bg-white text-taklif-navy font-semibold rounded-lg backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2 group">
                          <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                          {t('templates.previewTemplate')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Coming Soon Card - Desktop */}
            <div className="relative group rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-105 hover:-translate-y-3">
              <div className="relative h-[420px] bg-gradient-to-br from-taklif-burgundy/60 via-taklif-burgundy/80 to-taklif-burgundy flex flex-col items-center justify-center p-8 overflow-hidden">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 animate-pulse"></div>
                
                {/* Decorative dots pattern with animation */}
                <div className="absolute inset-0 opacity-20 animate-pulse" style={{
                  backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                  animation: 'float 20s ease-in-out infinite'
                }}></div>
                
                {/* Floating particles */}
                <div className="absolute top-10 left-10 w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
                <div className="absolute top-20 right-16 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
                <div className="absolute bottom-24 left-16 w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
                <div className="absolute bottom-32 right-12 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}></div>
                
                {/* Clock Icon with animations */}
                <div className="relative mb-8 group-hover:scale-110 transition-transform duration-500">
                  {/* Pulsing rings */}
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-white/20 animate-ping"></div>
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-white/30 animate-pulse"></div>
                  
                  <div className="relative w-20 h-20 rounded-full border-4 border-white/60 flex items-center justify-center bg-white/10 backdrop-blur-sm group-hover:border-white/90 group-hover:bg-white/20 transition-all duration-500">
                    {/* Animated clock icon */}
                    <svg className="w-10 h-10 text-white/80 group-hover:text-white transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" className="origin-center" style={{
                        animation: 'spin 4s linear infinite'
                      }} />
                    </svg>
                  </div>
                </div>
                
                {/* Text Content with slide-up animation */}
                <div className="relative z-10 group-hover:-translate-y-2 transition-transform duration-500">
                  <h3 className="text-3xl font-playfair font-bold text-white mb-3 text-center drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {t('templates.comingSoon')}
                  </h3>
                  <p className="text-white/80 text-center text-base drop-shadow group-hover:text-white transition-colors duration-300">
                    {t('templates.comingSoonDesc')}
                  </p>
                </div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Digital Invitation Section */}
      <section className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-br from-[hsl(var(--taklif-cream))] via-taklif-cream/95 to-taklif-cream/90">
        <div className="pointer-events-none absolute -top-16 -left-14 h-56 w-56 sm:-top-20 sm:-left-16 sm:h-72 sm:w-72 rounded-full bg-[hsl(var(--taklif-gold)/0.18)] blur-3xl" />
        <div className="pointer-events-none absolute top-20 -right-16 h-56 w-56 sm:top-24 sm:-right-20 sm:h-72 sm:w-72 rounded-full bg-[hsl(var(--taklif-navy)/0.12)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 sm:-bottom-20 sm:h-64 sm:w-64 rounded-full bg-[hsl(var(--taklif-burgundy)/0.12)] blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-[11px] sm:text-sm font-semibold tracking-[0.14em] sm:tracking-[0.18em] uppercase text-taklif-navy/70 mb-3 sm:mb-4">Why Taklif Link</p>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-playfair text-taklif-navy leading-tight">
              {t('comparison.title')} <span className="italic text-taklif-burgundy">{t('comparison.titleAccent')}</span> {t('comparison.titleHighlight')}
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-2xl text-taklif-burgundy/80 leading-relaxed px-1 sm:px-0">
              {t('comparison.subtitle')}
            </p>
          </div>

          <div className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 md:gap-10">
            <div className="rounded-2xl sm:rounded-3xl border border-[hsl(var(--taklif-navy)/0.15)] bg-[hsl(var(--taklif-navy)/0.04)] p-4 sm:p-6">
              <p className="text-center text-xs sm:text-sm font-semibold tracking-[0.18em] text-taklif-navy uppercase mb-4">
                {t('comparison.traditional.header')}
              </p>
              <div className="space-y-3 sm:space-y-4">
                {invitationComparisonItems.map((item) => (
                  <div
                    key={item.traditionalKey}
                    className="rounded-xl sm:rounded-2xl border border-[hsl(var(--taklif-navy)/0.18)] bg-white/75 px-3 sm:px-5 py-3.5 sm:py-5 md:py-6 flex items-center gap-2.5 sm:gap-3 min-h-[72px] sm:min-h-[84px]"
                  >
                    <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[hsl(var(--taklif-navy)/0.10)] flex items-center justify-center flex-shrink-0">
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-taklif-navy" />
                    </span>
                    <p className="text-taklif-navy/75 text-base sm:text-lg lg:text-xl leading-snug break-words">{t(item.traditionalKey)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-[hsl(var(--taklif-gold)/0.45)] bg-[hsl(var(--taklif-gold)/0.12)] p-4 sm:p-6">
              <p className="text-center text-xs sm:text-sm font-semibold tracking-[0.18em] text-taklif-burgundy uppercase mb-4">
                {t('comparison.modern.header')}
              </p>
              <div className="space-y-3 sm:space-y-4">
                {invitationComparisonItems.map((item) => (
                  <div
                    key={item.modernKey}
                    className="rounded-xl sm:rounded-2xl border border-[hsl(var(--taklif-burgundy)/0.28)] bg-white px-3 sm:px-5 py-3.5 sm:py-5 md:py-6 flex items-center gap-2.5 sm:gap-3 min-h-[72px] sm:min-h-[84px] shadow-[0_6px_20px_hsl(var(--taklif-burgundy)/0.10)]"
                  >
                    <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[hsl(var(--taklif-gold)/0.28)] flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-taklif-burgundy" />
                    </span>
                    <p className="text-taklif-burgundy text-base sm:text-lg lg:text-xl leading-snug break-words">{t(item.modernKey)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-10 sm:mt-16 md:mt-20 text-center text-2xl sm:text-3xl md:text-5xl italic font-playfair text-taklif-burgundy leading-tight max-w-4xl mx-auto px-2 sm:px-0">
            {t('comparison.quote')}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-taklif-navy">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-lg text-taklif-navy opacity-70 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="wedding-card text-center group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-4 md:p-8">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-taklif-burgundy rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="text-sm md:text-xl font-playfair font-semibold text-taklif-navy mb-2 md:mb-4 leading-tight">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="hidden md:block text-base text-taklif-navy opacity-70 leading-relaxed">
                    {t(feature.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-20 sm:py-28 overflow-hidden" style={{
        backgroundImage: 'url(/c_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        {/* Overlay gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-taklif-burgundy/85 via-taklif-navy/75 to-taklif-navy/85 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-bold text-white mb-6 drop-shadow-lg">
            {t('cta.title')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started">
              <Button className="bg-taklif-gold text-taklif-navy px-8 py-4 rounded-xl text-lg font-semibold hover:bg-taklif-gold/90 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                {t('cta.startFreeTrial')}
              </Button>
            </Link>
            <a href="#templates">
              <Button className="bg-white/20 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-taklif-burgundy transition-all shadow-lg hover:shadow-xl">
                {t('hero.viewDemo')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-taklif-navy text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Logo - styled like navbar */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-12 w-12 rounded-full overflow-hidden shadow-lg ring-2 ring-taklif-gold/30 group-hover:ring-taklif-gold transition-all">
                <img 
                  src="/takliflinklogo.jpg" 
                  alt="Taklif Link" 
                  className="h-full w-full object-cover scale-125"
                />
              </div>
              <h3 className="text-2xl sm:text-3xl font-playfair font-bold text-taklif-gold group-hover:text-taklif-gold/90 transition-colors">
                Taklif Link
              </h3>
            </Link>

            {/* Tagline */}
            <p className="text-white/70 text-sm sm:text-base max-w-md leading-relaxed">
              {t('footer.description')}
            </p>

            {/* Copyright */}
            <div className="border-t border-white/10 pt-6 w-full">
              <p className="text-white/60 text-sm">
                {t('footer.copyright')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
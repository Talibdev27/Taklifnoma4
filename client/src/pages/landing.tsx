import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageToggle } from '@/components/language-toggle';
import { 
  Heart, Palette, Calendar, Camera, Globe, MapPin, Music, 
  Check, Menu, X, Star, Users, MessageSquare 
} from 'lucide-react';
import { PricingSection } from '@/components/pricing-section';
import { isFreeTemplate } from '@/lib/template-tiers';

export default function Landing() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const templates = [
    {
      nameKey: 'templates.gardenRomance',
      image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250',
      descriptionKey: 'templates.gardenRomanceDesc',
    },
    {
      nameKey: 'templates.modernElegance',
      image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250',
      descriptionKey: 'templates.modernEleganceDesc',
    },
    {
      nameKey: 'templates.rusticCharm',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250',
      descriptionKey: 'templates.rusticCharmDesc',
    },
    {
      nameKey: 'templates.beachBliss',
      image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250',
      descriptionKey: 'templates.beachBlissDesc',
    },
    {
      nameKey: 'templates.classicTradition',
      image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250',
      descriptionKey: 'templates.classicTraditionDesc',
    },
    {
      nameKey: 'templates.bohoChic',
      image: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250',
      descriptionKey: 'templates.bohoChicDesc',
    },
  ];

  const pricingPlans = [
    {
      nameKey: 'pricing.basic',
      priceKey: 'pricing.free',
      featuresKey: 'pricing.basicFeatures',
      buttonKey: 'pricing.chooseBasic',
      popular: false,
    },
    {
      nameKey: 'pricing.premium',
      price: '100,000',
      currency: 'som',
      periodKey: 'pricing.perYear',
      featuresKey: 'pricing.premiumFeatures',
      buttonKey: 'pricing.choosePremium',
      popular: true,
    },
    {
      nameKey: 'pricing.deluxe',
      price: '300,000',
      currency: 'som',
      periodKey: 'pricing.perYear',
      featuresKey: 'pricing.deluxeFeatures',
      buttonKey: 'pricing.chooseDeluxe',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-soft-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Heart className="h-8 w-8 text-romantic-gold mr-2" />
                <h1 className="text-2xl font-playfair font-semibold text-romantic-gold">
                  LoveStory
                </h1>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <a href="#features" className="text-charcoal hover:text-romantic-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.features')}
              </a>
              <a href="#templates" className="text-charcoal hover:text-romantic-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.templates')}
              </a>
              <a href="#pricing" className="text-charcoal hover:text-romantic-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.pricing')}
              </a>
              <LanguageToggle />
              <Link href="/login">
                <Button variant="ghost" className="text-charcoal hover:text-romantic-gold">
                  {t('nav.signIn')}
                </Button>
              </Link>
              <Link href="/create-wedding">
                <Button className="wedding-button">
                  {t('nav.getStarted')}
                </Button>
              </Link>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <LanguageToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-soft-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block px-3 py-2 text-charcoal hover:text-romantic-gold">
                  {t('nav.features')}
                </a>
                <a href="#templates" className="block px-3 py-2 text-charcoal hover:text-romantic-gold">
                  {t('nav.templates')}
                </a>
                <a href="#pricing" className="block px-3 py-2 text-charcoal hover:text-romantic-gold">
                  {t('nav.pricing')}
                </a>
                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full justify-start text-charcoal hover:text-romantic-gold">
                    {t('nav.signIn')}
                  </Button>
                </Link>
                <Link href="/get-started" className="block">
                  <Button className="w-full wedding-button">
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-bold text-charcoal leading-tight">
                {t('hero.title')}
                <span className="text-romantic-gold block">
                  {t('hero.titleHighlight')}
                </span>
              </h1>
              <p className="mt-6 text-lg text-charcoal opacity-80 font-lato leading-relaxed max-w-xl">
                {t('hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/get-started">
                  <Button className="wedding-button text-lg px-8 py-4">
                    {t('hero.startCreating')}
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" className="wedding-button-outline text-lg px-8 py-4">
                    {t('hero.viewDemo')}
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-charcoal opacity-70">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-sage-green mr-2" />
                  <span>{t('hero.freeTrial')}</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-sage-green mr-2" />
                  <span>{t('hero.noCreditCard')}</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Beautiful couple in elegant wedding attire" 
                className="rounded-2xl shadow-2xl w-full h-auto" 
              />
              <Card className="absolute -bottom-6 -left-6 wedding-card">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-charcoal opacity-70 font-lato">{t('hero.joinOver')}</p>
                  <p className="text-2xl font-playfair font-bold text-romantic-gold">50,000+</p>
                  <p className="text-sm text-charcoal opacity-70 font-lato">{t('hero.happyCouples')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Wedding Website Section */}
      <section className="py-20 bg-soft-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-charcoal">
              {t('demo.title')}
            </h2>
            <p className="mt-4 text-lg text-charcoal opacity-70 max-w-2xl mx-auto">
              {t('demo.subtitle')}
            </p>
          </div>

          <Card className="wedding-card elegant-shadow overflow-hidden">
            <div className="bg-gradient-to-r from-romantic-gold to-sage-green p-1">
              <div className="bg-white rounded-xl">
                {/* Demo Hero Section */}
                <div className="relative h-96 overflow-hidden rounded-t-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600" 
                    alt="Elegant wedding venue with beautiful floral arrangements" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                    <div>
                      <h3 className="text-3xl lg:text-4xl font-playfair font-bold mb-2 text-shadow">
                        Sarah & Michael
                      </h3>
                      <p className="text-lg font-cormorant mb-4 text-shadow">
                        September 15, 2024
                      </p>
                      {/* Countdown Timer */}
                      <div className="flex justify-center space-x-4 text-sm">
                        <div className="bg-white bg-opacity-20 rounded-xl px-3 py-2">
                          <div className="font-bold text-lg">45</div>
                          <div>Days</div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-xl px-3 py-2">
                          <div className="font-bold text-lg">12</div>
                          <div>Hours</div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-xl px-3 py-2">
                          <div className="font-bold text-lg">30</div>
                          <div>Min</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demo Content */}
                <div className="p-6 md:p-12 space-y-16">
                  {/* Our Love Story Section */}
                  <div className="relative">
                    {/* Main Title */}
                    <div className="text-center mb-16">
                      <h4 className="text-4xl md:text-5xl font-playfair font-bold text-charcoal mb-4">{t('demo.ourStory')}</h4>
                      <div className="w-24 h-0.5 bg-romantic-gold mx-auto"></div>
                    </div>
                    
                    {/* Two Column Layout - Story Left, Image Right */}
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                      {/* Left Column - Story Content */}
                      <div className="text-left space-y-8">
                        <div className="relative">
                          <div className="absolute -left-6 top-0 text-8xl text-romantic-gold/20 font-playfair leading-none">"</div>
                          <p className="text-charcoal/80 leading-relaxed text-xl font-light italic pl-12 pr-6">
                            {t('demo.storyText')}
                          </p>
                          <div className="absolute -right-4 bottom-0 text-8xl text-romantic-gold/20 font-playfair leading-none transform rotate-180">"</div>
                        </div>
                        
                        {/* Date badge */}
                        <div className="inline-flex items-center gap-3 bg-romantic-gold/10 px-6 py-3 rounded-full ml-12">
                          <svg className="w-5 h-5 text-romantic-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="text-base text-charcoal/70 font-medium">Since 2019</span>
                        </div>
                      </div>
                      
                      {/* Right Column - Large Couple Image */}
                      <div className="flex justify-center">
                        <div className="relative group w-full max-w-lg">
                          <div className="absolute inset-0 bg-gradient-to-br from-romantic-gold/30 to-romantic-gold/10 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500"></div>
                          <div className="relative">
                            <img 
                              src="/beach-ceremony.png" 
                              alt="Beautiful beach wedding ceremony with white chairs and floral decorations" 
                              className="w-full h-[500px] object-cover rounded-3xl shadow-2xl group-hover:shadow-3xl transition-all duration-500"
                            />
                            {/* Decorative frame */}
                            <div className="absolute -inset-3 border-2 border-romantic-gold/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            {/* Floating heart decoration */}
                            <div className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                              <svg className="w-6 h-6 text-romantic-gold" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Our Memories Gallery */}
                  <div className="relative">
                    {/* Section Title */}
                    <div className="text-center mb-16">
                      <h4 className="text-4xl md:text-5xl font-playfair font-bold text-charcoal mb-4">{t('demo.ourMemories')}</h4>
                      <div className="w-24 h-0.5 bg-romantic-gold mx-auto mb-6"></div>
                      <p className="text-charcoal/60 text-lg font-light max-w-2xl mx-auto">
                        {t('demo.memoriesSubtitle')}
                      </p>
                    </div>
                    
                    {/* Photo Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { 
                          src: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                          label: 'Wedding ceremony with confetti celebration',
                          title: 'Ceremony'
                        },
                        { 
                          src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                          label: 'Wedding ceremony decorations',
                          title: 'First Look'
                        },
                        { 
                          src: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                          label: 'Wedding reception table setting',
                          title: 'Reception'
                        },
                        { 
                          src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                          label: 'Wedding couple dancing',
                          title: 'First Dance'
                        }
                      ].map((photo, index) => (
                        <div key={index} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                          <img 
                            src={photo.src} 
                            alt={photo.label}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700" 
                            onError={(e) => {
                              console.log(`Failed to load image: ${photo.src}`);
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Photo title overlay */}
                          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <h6 className="text-white text-sm font-semibold bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                              {photo.title}
                            </h6>
                          </div>
                          
                          {/* Decorative corner accent */}
                          <div className="absolute top-4 right-4 w-8 h-8 border-2 border-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <svg className="w-4 h-4 text-white/70 mt-1 ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* View More Button */}
                    <div className="text-center mt-12">
                      <button className="inline-flex items-center gap-3 bg-gradient-to-r from-romantic-gold to-romantic-gold/80 text-white px-8 py-4 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        View All Photos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-charcoal">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-lg text-charcoal opacity-70 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="wedding-card text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-romantic-gold rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-playfair font-semibold text-charcoal mb-4">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-charcoal opacity-70 leading-relaxed">
                    {t(feature.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Template Gallery */}
      <section id="templates" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-charcoal">
              {t('templates.title')}
            </h2>
            <p className="mt-4 text-lg text-charcoal opacity-70 max-w-2xl mx-auto">
              {t('templates.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template, index) => {
              const templateId = template.nameKey.split('.')[1];
              const isFree = isFreeTemplate(templateId);
              return (
                <Card key={index} className="wedding-card overflow-hidden relative">
                  <div className="relative">
                    <img 
                      src={template.image} 
                      alt={t(template.nameKey)}
                      className="w-full h-48 object-cover" 
                    />
                    <div className="absolute top-2 right-2">
                      {isFree ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          {t('templates.freeTemplate')}
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500 hover:bg-blue-600">
                          {t('templates.premiumTemplate')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-playfair font-semibold text-charcoal mb-2">
                      {t(template.nameKey)}
                    </h3>
                    <p className="text-sm text-charcoal opacity-70 mb-4">
                      {t(template.descriptionKey)}
                    </p>
                    <Link href={`/demo?template=${templateId}`}>
                      <Button className="w-full wedding-button">
                        {t('templates.previewTemplate')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-romantic-gold">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-playfair font-bold text-white mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-white opacity-90 mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started">
              <Button className="bg-white text-romantic-gold px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-50 transition-all shadow-lg">
                {t('cta.startFreeTrial')}
              </Button>
            </Link>
            <Link href="/demo">
              <Button className="bg-white/20 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white hover:text-romantic-gold transition-all shadow-lg font-semibold">
                {t('hero.viewDemo')}
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-white opacity-70">
            {t('cta.noCreditCard')} • {t('cta.freeTrial')} • {t('cta.cancelAnytime')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <Heart className="h-8 w-8 text-romantic-gold mr-2" />
                <h3 className="text-2xl font-playfair font-semibold text-romantic-gold">
                  LoveStory
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
                {t('footer.description')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.features')}</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-romantic-gold transition-colors">{t('footer.weddingWebsites')}</a></li>
                <li><a href="#" className="hover:text-romantic-gold transition-colors">{t('footer.rsvpManagement')}</a></li>
                <li><a href="#" className="hover:text-romantic-gold transition-colors">{t('footer.photoGalleries')}</a></li>
                <li><a href="#" className="hover:text-romantic-gold transition-colors">{t('footer.guestBook')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.support')}</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-romantic-gold transition-colors">{t('footer.helpCenter')}</a></li>
                <li><a href="#" className="hover:text-romantic-gold transition-colors">{t('footer.contactUs')}</a></li>
                <li><a href="#" className="hover:text-romantic-gold transition-colors">{t('footer.privacyPolicy')}</a></li>
                <li><a href="#" className="hover:text-romantic-gold transition-colors">{t('footer.termsOfService')}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 LoveStory. All rights reserved. Made with <Heart className="inline h-4 w-4 text-romantic-gold mx-1" /> for couples everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
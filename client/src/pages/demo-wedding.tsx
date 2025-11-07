import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Heart, Users, Camera, MessageSquare } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/language-toggle";

const templateConfigs = {
  gardenRomance: {
    heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-[#F8F1F1] to-white",
    primaryColor: "#D4B08C",
    accentColor: "#89916B",
    couple: "Emily & James",
    tagline: "A love that blooms like flowers in spring",
    venue: "Rose Garden Estate"
  },
  modernElegance: {
    heroImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-slate-100 to-white",
    primaryColor: "#2C3338",
    accentColor: "#8B7355",
    couple: "Sophia & Alexander",
    tagline: "Elegance in every moment",
    venue: "Grand Metropolitan Hall"
  },
  rusticCharm: {
    heroImage: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-amber-50 to-white",
    primaryColor: "#8B4513",
    accentColor: "#CD853F",
    couple: "Sarah & Michael",
    tagline: "Simple love, beautiful moments",
    venue: "Countryside Barn"
  },
  beachBliss: {
    heroImage: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-blue-50 to-white",
    primaryColor: "#2E86AB",
    accentColor: "#A23B72",
    couple: "Luna & Diego",
    tagline: "Love as endless as the ocean",
    venue: "Sunset Beach Resort"
  },
  classicTradition: {
    heroImage: "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-gray-50 to-white",
    primaryColor: "#1F2937",
    accentColor: "#6B7280",
    couple: "Victoria & Edward",
    tagline: "Timeless love, classic elegance",
    venue: "Heritage Manor"
  },
  bohoChic: {
    heroImage: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-orange-50 to-white",
    primaryColor: "#92400E",
    accentColor: "#F59E0B",
    couple: "Aurora & River",
    tagline: "Free spirits, boundless love",
    venue: "Bohemian Gardens"
  }
};

export default function DemoWedding() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const [currentTemplate, setCurrentTemplate] = useState('gardenRomance');
  const weddingDate = new Date('2024-08-15T15:00:00');
  
  useEffect(() => {
    const urlParts = location.split('?');
    if (urlParts.length > 1) {
      const urlParams = new URLSearchParams(urlParts[1]);
      const templateParam = urlParams.get('template');
      console.log('Template parameter from URL:', templateParam);
      if (templateParam && templateConfigs[templateParam as keyof typeof templateConfigs]) {
        console.log('Setting template to:', templateParam);
        setCurrentTemplate(templateParam);
      }
    }
  }, [location]);
  
  const config = templateConfigs[currentTemplate as keyof typeof templateConfigs];
  
  return (
    <div className={`min-h-screen bg-gradient-to-b ${config.colorScheme}`}>
      {/* Hero Section */}
      <div 
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `url('${config.heroImage}')`
        }}
      >
        {/* Language Selector - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1">
            <LanguageToggle />
          </div>
        </div>
        
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <h1 className="text-6xl md:text-8xl font-playfair font-bold mb-4">
            {t(`demo.${currentTemplate}.couple`)}
          </h1>
          <p className="text-2xl md:text-3xl font-light mb-8">
            {t(`demo.${currentTemplate}.tagline`)}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{t(`demo.${currentTemplate}.date`)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{t(`demo.${currentTemplate}.venue`)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <CountdownTimer targetDate={weddingDate} />
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-playfair font-bold text-[#2C3338] mb-8">
            {t('demo.ourStory')}
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Couple"
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="text-left">
              <p className="text-lg text-[#2C3338]/80 leading-relaxed whitespace-pre-line">
                {t(`demo.${currentTemplate}.story`)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wedding Details */}
      <section className="py-16 px-6 bg-[#F8F1F1]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-playfair font-bold text-[#2C3338] text-center mb-12">
            {t('wedding.weddingDetails')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 shadow-lg">
              <CardContent className="text-center">
                <Calendar className="h-12 w-12 text-[#D4B08C] mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-[#2C3338] mb-2">{t('wedding.when')}</h3>
                <p className="text-[#2C3338]/70 mb-2">{t(`demo.${currentTemplate}.date`)}</p>
                <p className="text-[#2C3338]/70">{t(`demo.${currentTemplate}.ceremony`)}</p>
              </CardContent>
            </Card>
            <Card className="p-6 shadow-lg">
              <CardContent className="text-center">
                <MapPin className="h-12 w-12 text-[#D4B08C] mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-[#2C3338] mb-2">{t('wedding.where')}</h3>
                <p className="text-[#2C3338]/70 mb-2">{t(`demo.${currentTemplate}.venue`)}</p>
                <Button variant="outline" className="mt-2 text-sm">
                  {t('demo.viewOnMap')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Photo Gallery Preview */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-playfair font-bold text-[#2C3338] text-center mb-12 flex items-center justify-center gap-3">
            <Camera className="h-8 w-8 text-[#D4B08C]" />
            {t('demo.photos')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", // Bride holding bouquet
              "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", // Couple portrait
              "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", // Wedding rings
              "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", // Wedding ceremony
              "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", // Reception dancing
              "https://images.unsplash.com/photo-1523438097201-512ae7d59c44?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"  // Wedding cake
            ].map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Beautiful wedding memory ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                onError={(e) => {
                  // Fallback to a different image if one fails to load
                  const fallbackImages = [
                    "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  ];
                  e.currentTarget.src = fallbackImages[index % fallbackImages.length];
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section className="py-16 px-6 bg-[#F8F1F1]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-playfair font-bold text-[#2C3338] mb-8 flex items-center justify-center gap-3">
            <Heart className="h-8 w-8 text-[#D4B08C]" />
            {t('demo.rsvp')}
          </h2>
          <p className="text-lg text-[#2C3338]/80 mb-8">
            {t('wedding.cantWaitToCelebrate')}
          </p>
          <Card className="p-8 shadow-lg">
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t('rsvp.enterFullName')}
                  className="w-full p-3 border border-[#D4B08C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4B08C]"
                />
                <input
                  type="email"
                  placeholder={t('rsvp.enterEmail')}
                  className="w-full p-3 border border-[#D4B08C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4B08C]"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <select className="w-full p-3 border border-[#D4B08C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4B08C]">
                  <option>{t('rsvp.willYouAttend')}</option>
                  <option>{t('rsvp.yesAttending')}</option>
                  <option>{t('rsvp.notAttending')}</option>
                  <option>{t('rsvp.maybe')}</option>
                </select>
                <input
                  type="number"
                  placeholder={t('guestList.totalGuests')}
                  className="w-full p-3 border border-[#D4B08C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4B08C]"
                />
              </div>
              <textarea
                rows={4}
                placeholder={t('rsvp.shareMessage')}
                className="w-full p-3 border border-[#D4B08C]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4B08C]"
              ></textarea>
              <Button className="w-full bg-[#D4B08C] hover:bg-[#C09E7A] text-white py-3 text-lg">
                {t('rsvp.submit')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Guest Messages */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-playfair font-bold text-[#2C3338] text-center mb-12 flex items-center justify-center gap-3">
            <MessageSquare className="h-8 w-8 text-[#D4B08C]" />
            {t('demo.messagesFromFamily')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: "Sarah & Michael",
                message: t('demo.guestMessage1'),
                avatar: "S"
              },
              {
                name: "Mom & Dad Johnson",
                message: t('demo.guestMessage2'),
                avatar: "J"
              },
              {
                name: "The Wilsons",
                message: t('demo.guestMessage3'),
                avatar: "W"
              },
              {
                name: "College Friends",
                message: t('demo.guestMessage4'),
                avatar: "F"
              }
            ].map((message, index) => (
              <Card key={index} className="p-6 shadow-md">
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#D4B08C] text-white rounded-full flex items-center justify-center font-semibold">
                      {message.avatar}
                    </div>
                    <h4 className="font-semibold text-[#2C3338]">{message.name}</h4>
                  </div>
                  <p className="text-[#2C3338]/80 italic">"{message.message}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-[#2C3338] text-white text-center">
        <p className="text-lg font-light">
          {t('demo.withLove')}
        </p>
        <p className="text-sm opacity-70 mt-2">
          {t(`demo.${currentTemplate}.date`)} • {t(`demo.${currentTemplate}.venue`)}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/get-started">
            <Button size="lg" className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-3">
              {t('demo.createYourOwn')}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-800 px-8 py-3">
              {t('demo.backToHome')}
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
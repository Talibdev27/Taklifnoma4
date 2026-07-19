// @ts-nocheck
import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Heart, Users, Camera, MessageSquare, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { CountdownTimer } from "@/website/components/countdown-timer";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/website/components/language-toggle";
import { AzamatScrollMusic, type AzamatScrollMusicHandle } from "@/website/components/azamat-scroll-music";
import { motion, AnimatePresence } from "framer-motion";
import { VelvetTemplate } from "@/website/components/templates/velvet-template";
import { PearlTemplate } from "@/website/components/templates/pearl-template";
import { AuroraTemplate } from "@/website/components/templates/aurora-template";
import { ImperialTemplate } from "@/website/components/templates/imperial-template";
import { TurkishTemplate } from "@/website/components/templates/turkish-template";
import { QizBazmiTemplate } from "@/website/components/templates/qizbazmi-template";
import { EpicTemplate } from "@/website/components/templates/epic-template";
import { FlowerTemplate } from "@/website/components/templates/flower-template";
import { GardenTemplate } from "@/website/components/templates/garden-template";
import { RoyalTemplate } from "@/website/components/templates/royal-template";

/* Demo wedding object used to preview the new premium templates. */
const DEMO_WEDDING = {
  id: 0,
  userId: 0,
  uniqueUrl: 'demo',
  eventType: 'wedding',
  bride: 'Sevara',
  groom: 'Azamat',
  weddingDate: new Date('2025-09-27T16:00:00').toISOString() as any,
  weddingTime: '16:00',
  timezone: 'Asia/Tashkent',
  venue: 'Sky Lounge',
  venueAddress: 'Tashkent, Uzbekistan',
  venueCoordinates: null,
  mapPinUrl: null,
  story: "Bizning ikki yurakimiz bir-birini topdi. Bir oqshomda boshlangan suhbat butun umrlik sevgiga aylandi. Bugun siz bilan bu baxtli kunni nishonlashga taklif etamiz.",
  welcomeMessage: null,
  dearGuestMessage: null,
  couplePhotoUrl: null,
  backgroundTemplate: 'template1',
  template: 'velvet',
  primaryColor: '#d4a87c',
  accentColor: '#8a5a3a',
  backgroundMusicUrl: '',
  dressCode: null,
  cardHolderName: 'AZAMAT KOCHIMOV',
  cardNumber: '8600 1234 5678 9012',
  isPublic: true,
  isApproved: true,
  availableLanguages: ['en', 'uz', 'ru'],
  defaultLanguage: 'uz',
  age: null,
  partyTheme: null,
  rsvpDeadline: null,
  giftRegistryInfo: null,
  contactPerson: null,
  specialInstructions: null,
  rsvpMode: 'both',
  createdAt: new Date().toISOString() as any,
};

/* Demo data for the Imperial (dark, cinematic) template. */
const IMPERIAL_DEMO = {
  ...DEMO_WEDDING,
  groom: 'Ulugʻbek',
  bride: 'Malika',
  weddingDate: new Date('2026-09-09T18:00:00').toISOString() as any,
  weddingTime: '18:00',
  venue: 'Restaurant «Baxtiyor»',
  venueAddress: 'Toshkent Region, Qibray District, Olmazor Street, 72',
  venueCoordinates: { lat: 41.3486, lng: 69.392 },
  story: null,
  template: 'imperial',
  defaultLanguage: 'uz',
  availableLanguages: ['uz', 'ru', 'en'],
  sections: { blessing: true, countdown: true, schedule: true, venue: true, location: true, rsvp: true, guestBook: true },
};

/* Demo data for the Turkish "Kına Gecesi" template. */
const TURKISH_DEMO = {
  ...DEMO_WEDDING,
  bride: 'Farida',
  groom: '',
  weddingDate: new Date('2026-07-22T11:00:00').toISOString() as any,
  weddingTime: '11:00',
  venue: 'Marğilon Restoranı',
  venueAddress: 'Mustakillik Caddesi 663, Margilan, Fergana, Özbekistan',
  venueCoordinates: null,
  mapPinUrl: 'https://maps.app.goo.gl/aVShWms9SiJQSr2q7',
  story: null,
  dearGuestMessage: null,
  dressCode: null,
  template: 'turkish',
  defaultLanguage: 'tr',
  availableLanguages: ['tr'],
  sections: { dearGuests: true, countdown: true, details: true, gallery: true, location: true, rsvp: true, guestbook: true, orderCta: true },
};

/* Demo data for the "Floral" (garden) template. */
const GARDEN_DEMO = {
  ...DEMO_WEDDING,
  groom: 'Azamat',
  bride: 'Shahnoza',
  weddingDate: new Date('2026-09-12T19:00:00').toISOString() as any,
  weddingTime: '19:00',
  venue: 'Banket zali «Istiqlol»',
  venueAddress: 'Navoiy viloyati, Qiziltepa tumani',
  venueCoordinates: { lat: 40.0072, lng: 64.8528 },
  couplePhotoUrl: 'https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=900',
  story: null,
  dearGuestMessage: null,
  template: 'garden',
  defaultLanguage: 'uz',
  availableLanguages: ['uz', 'ru', 'en'],
  sections: { dearGuests: true, countdown: true, gallery: true, location: true, rsvp: true, toyona: true, guestBook: true, orderCta: true },
};

/* Demo data for the "Royal" (navy-and-gold envelope) template. */
const ROYAL_DEMO = {
  ...DEMO_WEDDING,
  groom: 'Azizbek',
  bride: 'Nargizaxon',
  weddingDate: new Date('2026-03-29T18:00:00').toISOString() as any,
  weddingTime: '18:00',
  venue: 'Dvorets torjestv «Rohat»',
  venueAddress: 'Toshkent, Chilonzor tumani, Arnasoy koʻchasi 7/2',
  venueCoordinates: { lat: 41.2856, lng: 69.2034 },
  couplePhotoUrl: 'https://images.pexels.com/photos/265722/pexels-photo-265722.jpeg?auto=compress&cs=tinysrgb&w=900',
  story: null,
  dearGuestMessage: null,
  template: 'royal',
  defaultLanguage: 'ru',
  availableLanguages: ['ru', 'uz'],
  sections: { countdown: true, location: true, gallery: true, rsvp: true, toyona: true, guestBook: true, orderCta: true },
};

/* Demo data for the "Qiz Bazmi" (bridal celebration) template — bride only. */
const QIZBAZMI_DEMO = {
  ...DEMO_WEDDING,
  bride: 'Nilufar',
  groom: '',
  weddingDate: new Date('2026-08-14T17:00:00').toISOString() as any,
  weddingTime: '17:00',
  venue: 'Gulzor Saroyi',
  venueAddress: 'Toshkent, Yunusobod tumani, Bogʻishamol koʻchasi 12',
  story: null,
  dearGuestMessage: null,
  template: 'qizbazmi',
  defaultLanguage: 'uz',
  availableLanguages: ['uz', 'ru', 'en'],
  sections: { dearGuests: true, countdown: true, details: true, gallery: true, location: true, rsvp: true, toyona: true, guestbook: true, orderCta: true },
};

const templateConfigs = {
  gardenRomance: {
    heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-[#F8F1F1] to-white",
    primaryColor: "#D4B08C",
    accentColor: "#89916B",
    couple: "Emily & James",
    tagline: "A love that blooms like flowers in spring",
    venue: "Rose Garden Estate",
    date: "August 15, 2025",
    ceremony: "Ceremony at 3:00 PM",
    story: "We met at a garden party in spring 2020. James brought Emily roses, and that was the beginning of their beautiful story."
  },
  modernElegance: {
    heroImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-slate-100 to-white",
    primaryColor: "#2C3338",
    accentColor: "#8B7355",
    couple: "Sophia & Alexander",
    tagline: "Elegance in every moment",
    venue: "Grand Metropolitan Hall",
    date: "September 20, 2025",
    ceremony: "Ceremony at 4:00 PM",
    story: "Sophia and Alexander crossed paths at a gallery opening in New York. Their shared love of art became the foundation of a timeless bond."
  },
  rusticCharm: {
    heroImage: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-amber-50 to-white",
    primaryColor: "#8B4513",
    accentColor: "#CD853F",
    couple: "Sarah & Michael",
    tagline: "Simple love, beautiful moments",
    venue: "Countryside Barn",
    date: "October 5, 2025",
    ceremony: "Ceremony at 2:00 PM",
    story: "Sarah and Michael grew up in the same small town, but it took a chance encounter at a local fair to realize they were meant for each other."
  },
  beachBliss: {
    heroImage: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-blue-50 to-white",
    primaryColor: "#2E86AB",
    accentColor: "#A23B72",
    couple: "Luna & Diego",
    tagline: "Love as endless as the ocean",
    venue: "Sunset Beach Resort",
    date: "July 12, 2025",
    ceremony: "Ceremony at 5:30 PM",
    story: "Luna and Diego met while surfing the same wave in Bali. The ocean brought them together, and love kept them there."
  },
  classicTradition: {
    heroImage: "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-gray-50 to-white",
    primaryColor: "#1F2937",
    accentColor: "#6B7280",
    couple: "Victoria & Edward",
    tagline: "Timeless love, classic elegance",
    venue: "Heritage Manor",
    date: "November 8, 2025",
    ceremony: "Ceremony at 3:30 PM",
    story: "Victoria and Edward were introduced by mutual friends at a charity gala. Their courtship was as classic and refined as themselves."
  },
  bohoChic: {
    heroImage: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-orange-50 to-white",
    primaryColor: "#92400E",
    accentColor: "#F59E0B",
    couple: "Aurora & River",
    tagline: "Free spirits, boundless love",
    venue: "Bohemian Gardens",
    date: "June 21, 2025",
    ceremony: "Ceremony at 6:00 PM",
    story: "Aurora and River met at a music festival under the stars. They danced all night, and by sunrise they knew their souls were intertwined."
  },
  modern: {
    heroImage: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    colorScheme: "from-gray-900 to-gray-800",
    primaryColor: "#b08968",
    accentColor: "#c9a96e",
    couple: "Aisha & Kamol",
    tagline: "Two hearts, one beautiful journey",
    venue: "Skyline Rooftop Venue",
    date: "May 30, 2025",
    ceremony: "Ceremony at 4:30 PM",
    story: "Aisha and Kamol met through a mutual friend's dinner party. One conversation led to another, and soon they were inseparable.",
    backgroundMusicUrl: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_d1718ab41b.mp3" // Romantic piano music
  }
};

// Pre-computed particles (stable across renders)
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  size: 2 + (i * 7 % 5),
  left: (i * 17 + 3) % 100,
  duration: 12 + (i * 3 % 10),
  delay: (i * 2.3) % 10,
}));

function ModernDemoPreview() {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeSection, setActiveSection] = useState('home');
  const [showEnvelopeIntro, setShowEnvelopeIntro] = useState(false);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  const [envelopeFullyOpened, setEnvelopeFullyOpened] = useState(false);
  const weddingDate = useMemo(() => new Date('2025-09-27T16:00:00'), []);
  const musicRef = useRef<AzamatScrollMusicHandle | null>(null);
  const musicUrl = templateConfigs.modern.backgroundMusicUrl;

  // Always start previews from the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const tick = () => {
      const diff = weddingDate.getTime() - Date.now();
      if (diff <= 0) return;
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [weddingDate]);

  // In demo mode, always show envelope on each open so users can evaluate the effect.
  useEffect(() => {
    setShowEnvelopeIntro(true);
  }, []);

  const handleOpenEnvelope = () => {
    if (envelopeOpening) return;
    console.log('Demo wedding: envelope open started');
    musicRef.current?.startPlayback();
    setEnvelopeOpening(true);
    setTimeout(() => {
      console.log('Demo wedding: envelope fully opened');
      setEnvelopeFullyOpened(true);
    }, 650);
    setTimeout(() => {
      console.log('Demo wedding: intro overlay hidden');
      setShowEnvelopeIntro(false);
    }, 1500);
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { id: 'home',    label: t('demo.navHome'),    Icon: Heart },
    { id: 'details', label: t('demo.navDetails'), Icon: Calendar },
    { id: 'story',   label: t('demo.navStory'),   Icon: Sparkles },
    { id: 'rsvp',    label: t('demo.navRsvp'),    Icon: Users },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] } }),
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white overflow-x-hidden">
      {musicUrl && <AzamatScrollMusic ref={musicRef} musicUrl={musicUrl} />}

      <style>{`
        @keyframes luxuryBgShift {
          0%, 100% { transform: scale(1.04) translate3d(0, 0, 0); }
          50% { transform: scale(1.08) translate3d(-1.5%, -1%, 0); }
        }
        @keyframes ringDrift {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(0, -16px, 0) rotate(4deg); }
        }
        @keyframes ringDriftAlt {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(0, 14px, 0) rotate(-3deg); }
        }
        @keyframes goldSweep {
          0% { transform: translateX(-130%); }
          100% { transform: translateX(230%); }
        }
        .lux-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          background: radial-gradient(circle at 35% 35%, #45463f 0%, #30322d 45%, #21231f 100%);
        }
        .lux-bg::before {
          content: '';
          position: absolute;
          inset: -10%;
          background:
            radial-gradient(circle at 70% 18%, rgba(231,188,104,0.18), transparent 33%),
            radial-gradient(circle at 28% 82%, rgba(206,160,78,0.14), transparent 38%),
            linear-gradient(160deg, rgba(255,255,255,0.02), rgba(0,0,0,0.15));
          animation: luxuryBgShift 12s ease-in-out infinite;
        }
        .lux-ring {
          position: absolute;
          border-radius: 9999px;
          border: 10px solid rgba(227,182,95,0.92);
          box-shadow:
            inset 0 0 16px rgba(255, 228, 160, 0.28),
            0 0 26px rgba(207,160,77,0.3);
          filter: saturate(1.06) contrast(1.02);
        }
        .lux-ring-left {
          width: min(66vw, 420px);
          height: min(66vw, 420px);
          left: -9%;
          bottom: 9%;
          transform: rotate(-12deg);
          animation: ringDriftAlt 8s ease-in-out infinite;
        }
        .lux-ring-right {
          width: min(72vw, 470px);
          height: min(72vw, 470px);
          right: -12%;
          bottom: 16%;
          transform: rotate(10deg);
          animation: ringDrift 9s ease-in-out infinite;
        }
        .lux-sheen {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255, 242, 197, 0.22) 49%, transparent 60%);
          opacity: 0.55;
          animation: goldSweep 5.8s linear infinite;
        }
        @keyframes float-particle {
          0%   { transform: translateY(100vh) scale(0.5); opacity: 0; }
          8%   { opacity: 0.7; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-5vh) scale(1.2); opacity: 0; }
        }
        @keyframes gold-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes btn-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 18px rgba(201,169,110,0.25), inset 0 0 18px rgba(201,169,110,0.05); }
          50%       { box-shadow: 0 0 40px rgba(201,169,110,0.45), inset 0 0 30px rgba(201,169,110,0.10); }
        }
        @keyframes shimmer-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .gold-gradient-text {
          background: linear-gradient(120deg, #c9a96e 0%, #f5e0a0 40%, #e8c97e 60%, #a07840 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gold-shimmer 5s ease infinite;
        }
        .shimmer-cta {
          background: linear-gradient(90deg, #a07840 0%, #f5e0a0 40%, #c9a96e 60%, #a07840 100%);
          background-size: 250% auto;
          animation: btn-shimmer 2.2s linear infinite;
          color: #1a0e00;
        }
        .countdown-card {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .particle {
          position: fixed;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,169,110,0.8) 0%, rgba(201,169,110,0.1) 100%);
          pointer-events: none;
          animation: float-particle linear infinite;
        }
        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .shimmer-line::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: shimmer-slide 2.5s ease 1.2s forwards;
        }
      `}</style>

      <div className="lux-bg" aria-hidden>
        <div className="lux-ring lux-ring-left">
          <div className="lux-sheen" />
        </div>
        <div className="lux-ring lux-ring-right">
          <div className="lux-sheen" />
        </div>
      </div>

      {/* ── Envelope intro on demo ── */}
      {showEnvelopeIntro && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f0d0a]/95 px-4"
          onClick={() => {
            console.log('Demo wedding: intro container clicked');
            handleOpenEnvelope();
          }}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(212,176,140,0.16),transparent_60%)]" />

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              console.log('Demo wedding: envelope button clicked');
              handleOpenEnvelope();
            }}
            className="relative w-[min(92vw,430px)] h-[280px] cursor-pointer focus:outline-none"
            aria-label={t('demo.openEnvelopeAria')}
          >
            <div className="absolute inset-x-5 bottom-[-18px] h-9 rounded-full bg-black/40 blur-xl" />

            <div className="absolute inset-0 rounded-xl overflow-hidden border border-[#e8d8bf]/40 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f4ead8] via-[#ead7bb] to-[#d6bb8f]" />

              <div
                className="absolute inset-x-8 top-10 rounded-md border border-[#cfb080]/45 bg-white/85 text-center transition-all duration-700"
                style={{
                  padding: '20px 16px',
                  transform: envelopeFullyOpened ? 'translateY(-120px) scale(1.02)' : 'translateY(52px)',
                  opacity: envelopeFullyOpened ? 1 : 0.86,
                  filter: envelopeFullyOpened ? 'none' : 'blur(0.25px)',
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.32em] text-[#8b6045]/70 mb-3">
                  {t('demo.weddingInvitation')}
                </p>
                <p
                  className="text-2xl sm:text-3xl leading-tight"
                  style={{ fontFamily: '"Playfair Display","Georgia",serif', color: '#6f4c33' }}
                >
                  Aisha &amp; Kamol
                </p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[65%]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#c6a06f]/55 to-transparent" />
                <div className="absolute left-0 right-0 top-0 h-px bg-[#a88455]/35" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-[#a88455]/25" />
              </div>

              <div
                className="absolute top-0 left-0 right-0 h-[56%] origin-top transition-transform duration-700 ease-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: envelopeOpening ? 'perspective(1000px) rotateX(-172deg)' : 'perspective(1000px) rotateX(0deg)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    background: 'linear-gradient(180deg, #ead7bb 0%, #d3b183 100%)',
                    borderTop: '1px solid rgba(168,132,85,0.45)',
                  }}
                />
                <div className="absolute left-1/2 top-[38%] -translate-x-1/2 w-8 h-8 rounded-full bg-[#b48a58] border border-[#e2c79e]/60 shadow-inner flex items-center justify-center text-white/90 text-[11px]">
                  ♥
                </div>
              </div>
            </div>

            <p className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-center text-[11px] tracking-[0.24em] uppercase text-[#d4b08c]/75 whitespace-nowrap">
              {envelopeOpening ? t('welcome.opening') : t('welcome.clickToOpen')}
            </p>
          </button>
        </div>
      )}

      {/* ── Floating particles ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Desktop top nav ── */}
      <nav className="hidden sm:flex fixed top-0 inset-x-0 z-50 bg-black/50 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-8 py-3.5">
          <span className="gold-gradient-text text-xl font-light select-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Aisha &amp; Kamol
          </span>
          <div className="flex gap-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ${
                  activeSection === id
                    ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link href="/">
            <button className="text-xs text-white/30 hover:text-white/60 transition-colors tracking-wider">← {t('demo.back')}</button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
          preload="metadata"
        >
          <source src="/bg_video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-[#070707]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(201,169,110,0.06),transparent)]" />

        <div className="relative z-10 flex flex-col items-center">
          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.p
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/80 mb-8"
          >
            {t('demo.invitedToCelebrate')}
          </motion.p>

          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.h1
            initial={{ opacity: 0, y: 44, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="gold-gradient-text text-[clamp(3rem,12vw,7.5rem)] font-extralight leading-none mb-6"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Aisha &amp; Kamol
          </motion.h1>

          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.7 }}
            className="relative overflow-hidden h-px w-56 shimmer-line"
            style={{ background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)' }}
          />

          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.0 }}
            className="text-white/40 text-sm font-light tracking-[0.3em] mt-6 mb-10 uppercase"
          >
            September 27, 2025 &nbsp;·&nbsp; Skyline Rooftop, Tashkent
          </motion.p>

          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 1.3 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link href="/get-started">
              <button className="shimmer-cta font-semibold px-10 py-3.5 rounded-full text-xs tracking-[0.2em] uppercase shadow-lg shadow-[#c9a96e]/20">
                {t('demo.createYourOwn')}
              </button>
            </Link>
            <button
              onClick={() => scrollTo('details')}
              className="border border-white/15 text-white/50 hover:text-white hover:border-white/30 px-10 py-3.5 rounded-full text-xs tracking-[0.2em] uppercase transition-all"
            >
              {t('demo.explore')}
            </button>
          </motion.div>
        </div>

        {/* @ts-ignore - Framer Motion typing issue */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronUp className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ── COUNTDOWN ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(201,169,110,0.04),transparent)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.p
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-4"
          >
            {t('demo.countingDown')}
          </motion.p>
          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-4 gap-3 md:gap-5"
          >
            {[
              { label: t('demo.days'),   value: countdown.days },
              { label: t('demo.hours'),  value: countdown.hours },
              { label: t('demo.mins'),   value: countdown.minutes },
              { label: t('demo.secs'),   value: countdown.seconds },
            ].map(({ label, value }, i) => (
              // @ts-ignore - Framer Motion typing issue
              <motion.div
                key={label}
                variants={fadeUp} custom={i + 2} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="countdown-card glass-card rounded-2xl p-4 md:p-7"
              >
                {/* @ts-ignore - Framer Motion typing issue */}
                <motion.span
                  key={value}
                  initial={{ opacity: 0.4, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="gold-gradient-text text-4xl md:text-6xl font-extralight tabular-nums block"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {String(value).padStart(2, '0')}
                </motion.span>
                <span className="block text-[9px] uppercase tracking-[0.3em] text-white/25 mt-2">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── DETAILS ── */}
      <section id="details" className="relative z-10 py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-3">{t('demo.ceremonyDetails')}</p>
            <h2 className="text-3xl font-extralight gold-gradient-text" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {t('demo.joinUsSpecialDay')}
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { Icon: Calendar, label: t('demo.dateLabel'),      title: 'Sept 27, 2025',       sub: t('demo.saturdayEvening') },
              { Icon: MapPin,   label: t('demo.venueLabel'),     title: 'Skyline Rooftop',     sub: 'Tashkent, Uzbekistan' },
              { Icon: Heart,    label: t('demo.receptionLabel'), title: '6:00 PM onwards',     sub: t('demo.dinnerAndDancing') },
            ].map(({ Icon, label, title, sub }, i) => (
              // @ts-ignore - Framer Motion typing issue
              <motion.div
                key={label}
                variants={fadeUp} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ y: -6, borderColor: 'rgba(201,169,110,0.35)' }}
                className="glass-card rounded-2xl p-8 text-center cursor-default transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#c9a96e]/8 border border-[#c9a96e]/20 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-5 h-5 text-[#c9a96e]" />
                </div>
                <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-2">{label}</p>
                <p className="text-white text-base font-light">{title}</p>
                <p className="text-white/35 text-sm mt-1">{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORY ── */}
      <section id="story" className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-[#c9a96e]/15 to-transparent blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
              alt={t('demo.coupleAlt')}
              className="relative w-full rounded-3xl object-cover aspect-[4/5] shadow-2xl"
            />
            <div className="absolute inset-0 rounded-3xl ring-1 ring-[#c9a96e]/20" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-4">{t('demo.ourStoryLabel')}</p>
            <h3
              className="text-4xl font-extralight leading-tight mb-6"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {t('demo.howItAll')}{' '}
              <em className="gold-gradient-text not-italic">{t('demo.began')}</em>
            </h3>
            <div className="space-y-4 text-white/50 leading-relaxed text-sm">
              <p>
                {t('demo.storyParagraph1')}
              </p>
              <p>
                {t('demo.storyParagraph2')}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-8">
              <div className="h-px flex-1 bg-white/8" />
              <Heart className="w-4 h-4 text-[#c9a96e]/60" />
              <div className="h-px flex-1 bg-white/8" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PHOTO STRIP ── */}
      <section className="relative z-10 py-16 px-6 overflow-hidden">
        {/* @ts-ignore - Framer Motion typing issue */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-none max-w-5xl mx-auto"
        >
          {[
            'photo-1519741497674-611481863552',
            'photo-1511285560929-80b456fea0bc',
            'photo-1606800052052-a08af7148866',
            'photo-1537633552985-df8429e8048b',
            'photo-1465495976277-4387d4b0e4a6',
          ].map((id, i) => (
            // @ts-ignore - Framer Motion typing issue
            <motion.img
              key={id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.03 }}
              src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=80`}
              alt=""
              className="flex-shrink-0 h-52 w-40 object-cover rounded-2xl ring-1 ring-white/10"
            />
          ))}
        </motion.div>
      </section>

      {/* ── RSVP ── */}
      <section id="rsvp" className="relative z-10 py-24 px-6">
        <div className="max-w-md mx-auto">
          {/* @ts-ignore - Framer Motion typing issue */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-12"
          >
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c9a96e]/70 mb-3 text-center">{t('demo.rsvp')}</p>
            <h3
              className="text-3xl font-extralight text-center mb-8 gold-gradient-text"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {t('demo.willYouJoinUs')}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t('demo.yourFullName')}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e]/40 transition-colors text-sm"
              />
              <input
                type="email"
                placeholder={t('demo.emailAddress')}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e]/40 transition-colors text-sm"
              />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button className="py-3 rounded-xl border border-[#c9a96e]/35 text-[#c9a96e] text-xs tracking-widest uppercase hover:bg-[#c9a96e]/8 transition-colors">
                  ✓ &nbsp;{t('demo.attending')}
                </button>
                <button className="py-3 rounded-xl border border-white/8 text-white/30 text-xs tracking-widest uppercase hover:border-white/20 hover:text-white/50 transition-colors">
                  ✗ &nbsp;{t('demo.decline')}
                </button>
              </div>
              <button className="shimmer-cta w-full font-semibold py-4 rounded-xl text-xs tracking-[0.25em] uppercase mt-1 shadow-lg shadow-[#c9a96e]/10">
                {t('demo.sendRsvp')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/[0.04] text-center">
        {/* @ts-ignore - Framer Motion typing issue */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="gold-gradient-text text-3xl font-extralight mb-2"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          Aisha &amp; Kamol
        </motion.p>
        <p className="text-white/25 text-xs tracking-widest uppercase mb-10">September 27, 2025 · Skyline Rooftop</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/get-started">
            <button className="shimmer-cta font-semibold px-10 py-3.5 rounded-full text-xs tracking-[0.2em] uppercase shadow-lg shadow-[#c9a96e]/15">
              {t('demo.createYourOwnInvitation')}
            </button>
          </Link>
          <Link href="/">
            <button className="border border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 px-10 py-3.5 rounded-full text-xs tracking-[0.2em] uppercase transition-all">
              {t('demo.backToHome')}
            </button>
          </Link>
        </div>
      </footer>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-black/75 backdrop-blur-2xl border-t border-white/[0.07]">
        <div className="flex justify-around py-3 px-2">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex flex-col items-center gap-1 min-w-[52px] py-1 transition-colors ${
                activeSection === id ? 'text-[#c9a96e]' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function DemoWedding() {
  const { t, i18n } = useTranslation();
  const [currentTemplate, setCurrentTemplate] = useState('gardenRomance');
  const weddingDate = new Date('2025-08-15T15:00:00');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateParam = urlParams.get('template');
    if (!templateParam) return;
    // These templates render via their real wedding-template components.
    if (['velvet', 'pearl', 'aurora', 'imperial', 'turkish', 'qizbazmi', 'garden', 'royal', 'epic', 'flower'].includes(templateParam)) {
      setCurrentTemplate(templateParam);
      return;
    }
    if (templateConfigs[templateParam as keyof typeof templateConfigs]) {
      setCurrentTemplate(templateParam);
    }
  }, []);

  if (currentTemplate === 'modern') {
    return <ModernDemoPreview />;
  }

  if (currentTemplate === 'velvet') {
    return <VelvetTemplate wedding={{ ...DEMO_WEDDING, template: 'velvet' } as any} photos={[]} />;
  }
  if (currentTemplate === 'pearl') {
    return <PearlTemplate wedding={{ ...DEMO_WEDDING, template: 'pearl' } as any} photos={[]} />;
  }
  if (currentTemplate === 'aurora') {
    return <AuroraTemplate wedding={{ ...DEMO_WEDDING, template: 'aurora' } as any} photos={[]} />;
  }
  if (currentTemplate === 'imperial') {
    return <ImperialTemplate wedding={IMPERIAL_DEMO as any} photos={[]} />;
  }
  if (currentTemplate === 'turkish') {
    return <TurkishTemplate wedding={TURKISH_DEMO as any} photos={[]} />;
  }
  if (currentTemplate === 'qizbazmi') {
    return <QizBazmiTemplate wedding={QIZBAZMI_DEMO as any} photos={[]} />;
  }
  if (currentTemplate === 'garden') {
    return <GardenTemplate wedding={GARDEN_DEMO as any} photos={[]} />;
  }
  if (currentTemplate === 'royal') {
    return <RoyalTemplate wedding={ROYAL_DEMO as any} photos={[]} />;
  }
  if (currentTemplate === 'epic') {
    return <EpicTemplate wedding={{ ...DEMO_WEDDING, template: 'epic' } as any} />;
  }
  if (currentTemplate === 'flower') {
    return <FlowerTemplate wedding={{ ...DEMO_WEDDING, template: 'flower' } as any} />;
  }

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
            {config.couple}
          </h1>
          <p className="text-2xl md:text-3xl font-light mb-8">
            {config.tagline}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{config.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{config.venue}</span>
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
                {config.story}
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
                <p className="text-[#2C3338]/70 mb-2">{config.date}</p>
                <p className="text-[#2C3338]/70">{config.ceremony}</p>
              </CardContent>
            </Card>
            <Card className="p-6 shadow-lg">
              <CardContent className="text-center">
                <MapPin className="h-12 w-12 text-[#D4B08C] mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-[#2C3338] mb-2">{t('wedding.where')}</h3>
                <p className="text-[#2C3338]/70 mb-2">{config.venue}</p>
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
                  <option>{t('rsvp.confirmed')}</option>
                  <option>{t('rsvp.declined')}</option>
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
          {config.date} • {config.venue}
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
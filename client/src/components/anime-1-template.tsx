import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Calendar, MapPin, Users, MessageSquare, Camera, Music } from 'lucide-react';
import { BackgroundMusicPlayer } from './background-music-player';
import { WeddingWelcomeOverlay } from './wedding-welcome-overlay';
import { RSVPForm } from './rsvp-form';
import { GuestBookForm } from './guest-book-form';
import { PhotoGallery } from './photo-gallery';
import { SocialShare } from './social-share';
import { CountdownTimer } from './countdown-timer';
import { MilestoneCountdown } from './milestone-countdown';
import { LanguageToggle } from './language-toggle';

interface Anime1TemplateProps {
  wedding: {
    id: number;
    uniqueUrl: string;
    bride: string;
    groom: string;
    weddingDate: string | Date;
    weddingTime: string;
    timezone: string;
    venue: string;
    venueAddress: string;
    story?: string;
    welcomeMessage?: string;
    dearGuestMessage?: string;
    couplePhotoUrl?: string;
    backgroundMusicUrl?: string;
    dressCode?: string;
    primaryColor?: string;
    accentColor?: string;
    availableLanguages: string[];
    defaultLanguage: string;
    template: string;
    eventType?: string;
  };
  guests: any[];
  photos: any[];
  guestBookEntries: any[];
}

export function Anime1Template({ wedding, guests, photos, guestBookEntries }: Anime1TemplateProps) {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(wedding.defaultLanguage || 'en');
  const [showRSVP, setShowRSVP] = useState(false);
  const [showGuestBook, setShowGuestBook] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  
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

  useEffect(() => {
    i18n.changeLanguage(currentLanguage);
  }, [currentLanguage, i18n]);

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString(currentLanguage === 'uz' ? 'uz-UZ' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const createHeartBurst = (event: React.MouseEvent) => {
    const hearts = ['💖', '💕', '💗', '❤️', '🧡'];
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.innerHTML = hearts[Math.floor(Math.random() * hearts.length)];
        heart.className = 'heart-particle';
        heart.style.left = (event.clientX + (Math.random() - 0.5) * 100) + 'px';
        heart.style.top = (event.clientY + (Math.random() - 0.5) * 50) + 'px';
        document.body.appendChild(heart);
        
        setTimeout(() => {
          if (heart.parentNode) {
            heart.parentNode.removeChild(heart);
          }
        }, 4000);
      }, i * 100);
    }
  };

  const createSparkleEffect = (event: React.MouseEvent) => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        createSparkle(
          event.clientX + (Math.random() - 0.5) * 200,
          event.clientY + (Math.random() - 0.5) * 100
        );
      }, i * 150);
    }
  };

  const createSparkle = (x: number, y: number) => {
    const sparkle = document.createElement('div');
    sparkle.innerHTML = ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)];
    sparkle.style.position = 'absolute';
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.fontSize = Math.random() * 8 + 12 + 'px';
    sparkle.style.animation = 'sparkleAnimation 3s ease-out forwards';
    sparkle.style.zIndex = '1000';
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
    }, 3000);
  };

  const createGlitterEffect = (event: React.MouseEvent) => {
    const glitters = ['✨', '🌟', '💎', '⚡'];
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const glitter = document.createElement('div');
        glitter.innerHTML = glitters[Math.floor(Math.random() * glitters.length)];
        glitter.style.position = 'absolute';
        glitter.style.left = (event.clientX + (Math.random() - 0.5) * 150) + 'px';
        glitter.style.top = (event.clientY + (Math.random() - 0.5) * 80) + 'px';
        glitter.style.pointerEvents = 'none';
        glitter.style.fontSize = '14px';
        glitter.style.animation = 'sparkleAnimation 2.5s ease-out forwards';
        glitter.style.zIndex = '1000';
        document.body.appendChild(glitter);
        
        setTimeout(() => {
          if (glitter.parentNode) {
            glitter.parentNode.removeChild(glitter);
          }
        }, 2500);
      }, i * 80);
    }
  };

  const createConfettiExplosion = (event: React.MouseEvent) => {
    const confetti = ['🎉', '🎊', '✨', '🌟', '💖', '🎈'];
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const piece = document.createElement('div');
        piece.innerHTML = confetti[Math.floor(Math.random() * confetti.length)];
        piece.style.position = 'absolute';
        piece.style.left = (event.clientX + (Math.random() - 0.5) * 300) + 'px';
        piece.style.top = (event.clientY + (Math.random() - 0.5) * 200) + 'px';
        piece.style.pointerEvents = 'none';
        piece.style.fontSize = Math.random() * 10 + 16 + 'px';
        piece.style.animation = `confettiFall ${2 + Math.random() * 2}s ease-out forwards`;
        piece.style.zIndex = '1000';
        document.body.appendChild(piece);
        
        setTimeout(() => {
          if (piece.parentNode) {
            piece.parentNode.removeChild(piece);
          }
        }, 4000);
      }, i * 100);
    }
  };

  const handleRSVP = (event: React.MouseEvent) => {
    event.preventDefault();
    createConfettiExplosion(event);
    setShowRSVP(true);
  };

  return (
    <>
      {/* Welcome Overlay */}
      {showWelcomeOverlay && (
        <WeddingWelcomeOverlay
          weddingData={{
            bride: wedding.bride,
            groom: wedding.groom,
            template: wedding.template,
            eventType: wedding.eventType || 'wedding'
          }}
          hasMusic={!!wedding.backgroundMusicUrl}
          onEnter={handleEnterSite}
          isVisible={showWelcomeOverlay}
          defaultLanguage={wedding.defaultLanguage}
        />
      )}

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:wght@300;400;500;600&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Cormorant Garamond', serif;
            background: linear-gradient(135deg, #f5f1e8 0%, #e8dcc6 50%, #f5f1e8 100%);
            background-size: 400% 400%;
            animation: gradientShift 8s ease-in-out infinite;
            min-height: 100vh;
            overflow-x: hidden;
          }

          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .invitation-container {
            max-width: 400px;
            margin: 0 auto;
            background: rgba(245, 241, 232, 0.95);
            backdrop-filter: blur(10px);
            position: relative;
            min-height: 100vh;
            box-shadow: 
              0 20px 60px rgba(139, 69, 19, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
            animation: containerPulse 4s ease-in-out infinite;
          }

          @keyframes containerPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.005); }
          }

          .decorative-border {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 120px;
            background: linear-gradient(45deg, #8B4513, #CD853F, #D2691E, #F4A460);
            background-size: 400% 400%;
            animation: borderFlow 6s ease-in-out infinite;
            overflow: hidden;
          }

          @keyframes borderFlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .decorative-border::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              90deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.15) 20px,
              rgba(255,255,255,0.15) 22px
            );
            animation: patternSlide 4s linear infinite;
          }

          @keyframes patternSlide {
            0% { transform: translateX(0); }
            100% { transform: translateX(44px); }
          }

          .ornamental-pattern {
            position: absolute;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: radial-gradient(circle, #CD853F 30%, #8B4513 70%);
            border: 3px solid #F4A460;
            animation: ornamentRotate 8s linear infinite;
          }

          @keyframes ornamentRotate {
            0% { transform: rotate(-15deg) scale(1); }
            25% { transform: rotate(-10deg) scale(1.05); }
            50% { transform: rotate(-15deg) scale(1); }
            75% { transform: rotate(-20deg) scale(0.95); }
            100% { transform: rotate(-15deg) scale(1); }
          }

          .ornamental-pattern.top-left {
            top: 20px;
            left: 20px;
          }

          .ornamental-pattern.top-right {
            top: 20px;
            right: 20px;
            animation-delay: -4s;
          }

          .ornamental-pattern::after {
            content: '❋';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #f5f1e8;
            font-size: 24px;
            animation: sparkleRotate 3s ease-in-out infinite;
          }

          @keyframes sparkleRotate {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
            50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.2); }
          }

          .side-pattern-left, .side-pattern-right {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 60px;
            background: linear-gradient(180deg, #8B4513 0%, #CD853F 25%, #F4A460 50%, #CD853F 75%, #8B4513 100%);
            background-size: 100% 300px;
            animation: patternFlow 10s linear infinite;
          }

          .side-pattern-left {
            left: 0;
          }

          .side-pattern-right {
            right: 0;
            animation-direction: reverse;
          }

          @keyframes patternFlow {
            0% { background-position: 0 0; }
            100% { background-position: 0 300px; }
          }

          .side-pattern-left::before,
          .side-pattern-right::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              radial-gradient(circle at 30px 40px, #F4A460 8px, transparent 8px),
              radial-gradient(circle at 30px 120px, #DEB887 6px, transparent 6px),
              radial-gradient(circle at 30px 200px, #F4A460 8px, transparent 8px),
              radial-gradient(circle at 30px 280px, #CD853F 5px, transparent 5px);
            background-size: 60px 200px;
            animation: ornamentFloat 5s ease-in-out infinite alternate;
          }

          @keyframes ornamentFloat {
            0% { transform: translateY(0); opacity: 0.8; }
            100% { transform: translateY(-30px); opacity: 1; }
          }

          .main-content {
            padding: 140px 80px 40px;
            text-align: center;
            position: relative;
            z-index: 10;
            animation: contentFadeIn 2s ease-out;
          }

          @keyframes contentFadeIn {
            0% { opacity: 0; transform: translateY(50px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          .couple-names {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #8B4513;
            margin-bottom: 20px;
            text-shadow: 3px 3px 6px rgba(139, 69, 19, 0.3);
            line-height: 1.2;
            animation: nameGlow 3s ease-in-out infinite alternate;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          @keyframes nameGlow {
            0% { text-shadow: 3px 3px 6px rgba(139, 69, 19, 0.3); }
            100% { text-shadow: 3px 3px 15px rgba(205, 133, 63, 0.6), 0 0 20px rgba(244, 164, 96, 0.4); }
          }

          .couple-names:hover {
            transform: scale(1.05);
            color: #CD853F;
          }

          .couple-names .and {
            font-size: 24px;
            font-weight: 400;
            color: #CD853F;
            display: block;
            margin: 10px 0;
            font-style: italic;
            animation: andPulse 2s ease-in-out infinite;
          }

          @keyframes andPulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
          }

          .wedding-text {
            font-size: 20px;
            color: #8B4513;
            margin-bottom: 30px;
            font-weight: 500;
            letter-spacing: 3px;
            animation: textShimmer 4s ease-in-out infinite;
          }

          @keyframes textShimmer {
            0%, 100% { opacity: 0.8; letter-spacing: 3px; }
            50% { opacity: 1; letter-spacing: 5px; }
          }

          .date-time {
            background: linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(205, 133, 63, 0.15));
            padding: 25px 20px;
            border-radius: 15px;
            border: 2px solid transparent;
            background-clip: padding-box;
            margin: 30px 0;
            position: relative;
            overflow: hidden;
            animation: cardFloat 6s ease-in-out infinite;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          @keyframes cardFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }

          .date-time:hover {
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 15px 30px rgba(139, 69, 19, 0.3);
          }

          .date-time::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #CD853F, #F4A460, #DEB887, #CD853F, #8B4513);
            background-size: 400% 400%;
            border-radius: 17px;
            z-index: -1;
            animation: borderGlow 4s linear infinite;
          }

          @keyframes borderGlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .date-time::after {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #F4A460, transparent);
            border-radius: 50%;
            animation: sparkle 2s ease-in-out infinite;
          }

          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
          }

          .date-time h3 {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            color: #8B4513;
            margin-bottom: 15px;
            font-weight: 600;
            animation: titleBounce 3s ease-in-out infinite;
          }

          @keyframes titleBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }

          .date-time p {
            font-size: 18px;
            color: #8B4513;
            margin: 8px 0;
            font-weight: 500;
            animation: fadeInUp 1s ease-out forwards;
            opacity: 0;
          }

          .date-time p:nth-child(2) { animation-delay: 0.2s; }
          .date-time p:nth-child(3) { animation-delay: 0.4s; }
          .date-time p:nth-child(4) { animation-delay: 0.6s; }

          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          .venue {
            margin: 30px 0;
            padding: 20px;
            background: linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(139, 69, 19, 0.05));
            border-radius: 10px;
            border-left: 4px solid #CD853F;
            position: relative;
            overflow: hidden;
            animation: venueSlide 5s ease-in-out infinite;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          @keyframes venueSlide {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(2px); }
          }

          .venue:hover {
            transform: translateX(5px) scale(1.01);
            border-left-width: 6px;
          }

          .venue::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(244, 164, 96, 0.2), transparent);
            animation: shimmer 3s infinite;
          }

          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }

          .venue h3 {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            color: #8B4513;
            margin-bottom: 10px;
            animation: venueTitle 4s ease-in-out infinite;
          }

          @keyframes venueTitle {
            0%, 100% { color: #8B4513; }
            50% { color: #CD853F; }
          }

          .venue p {
            font-size: 16px;
            color: #8B4513;
            line-height: 1.6;
            animation: fadeInLeft 1s ease-out forwards;
            opacity: 0;
          }

          .venue p:nth-child(2) { animation-delay: 0.3s; }
          .venue p:nth-child(3) { animation-delay: 0.6s; }
          .venue p:nth-child(4) { animation-delay: 0.9s; }

          @keyframes fadeInLeft {
            0% { opacity: 0; transform: translateX(-20px); }
            100% { opacity: 1; transform: translateX(0); }
          }

          .decorative-divider {
            width: 100px;
            height: 3px;
            background: linear-gradient(90deg, transparent, #CD853F, #F4A460, #CD853F, transparent);
            background-size: 200% 100%;
            margin: 30px auto;
            position: relative;
            animation: dividerGlow 3s linear infinite;
          }

          @keyframes dividerGlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .decorative-divider::before,
          .decorative-divider::after {
            content: '◆';
            position: absolute;
            top: -8px;
            color: #CD853F;
            font-size: 16px;
            animation: diamondSpin 4s ease-in-out infinite;
          }

          @keyframes diamondSpin {
            0%, 100% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(45deg) scale(1.2); }
          }

          .decorative-divider::before {
            left: -15px;
          }

          .decorative-divider::after {
            right: -15px;
            animation-delay: -2s;
          }

          .rsvp-section {
            margin-top: 40px;
            padding: 25px;
            background: linear-gradient(135deg, rgba(139, 69, 19, 0.05), rgba(205, 133, 63, 0.1));
            border-radius: 15px;
            border: 2px dashed #CD853F;
            position: relative;
            overflow: hidden;
            animation: rsvpPulse 5s ease-in-out infinite;
          }

          @keyframes rsvpPulse {
            0%, 100% { border-color: #CD853F; }
            50% { border-color: #F4A460; }
          }

          .rsvp-section::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(from 0deg, transparent, rgba(244, 164, 96, 0.1), transparent);
            animation: rotate 6s linear infinite;
          }

          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .rsvp-btn {
            background: linear-gradient(135deg, #CD853F, #8B4513, #D2691E);
            background-size: 200% 200%;
            color: white;
            padding: 15px 40px;
            border: none;
            border-radius: 25px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 
              0 6px 20px rgba(139, 69, 19, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
            font-family: 'Cormorant Garamond', serif;
            position: relative;
            z-index: 10;
            animation: buttonGlow 3s ease-in-out infinite;
            overflow: hidden;
          }

          @keyframes buttonGlow {
            0%, 100% { background-position: 0% 50%; transform: scale(1); }
            50% { background-position: 100% 50%; transform: scale(1.02); }
          }

          .rsvp-btn:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 
              0 12px 30px rgba(139, 69, 19, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            animation: none;
          }

          .rsvp-btn:active {
            transform: translateY(-2px) scale(1.02);
          }

          .rsvp-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }

          .rsvp-btn:hover::before {
            left: 100%;
          }

          .floating-ornament {
            position: absolute;
            color: rgba(205, 133, 63, 0.4);
            font-size: 24px;
            animation: complexFloat 6s ease-in-out infinite;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          @keyframes complexFloat {
            0%, 100% { 
              transform: translateY(0) rotate(0deg) scale(1); 
              opacity: 0.4; 
            }
            25% { 
              transform: translateY(-15px) rotate(90deg) scale(1.1); 
              opacity: 0.7; 
            }
            50% { 
              transform: translateY(-10px) rotate(180deg) scale(0.9); 
              opacity: 0.6; 
            }
            75% { 
              transform: translateY(-20px) rotate(270deg) scale(1.2); 
              opacity: 0.8; 
            }
          }

          .floating-ornament:hover {
            color: #CD853F;
            transform: scale(1.5) rotate(180deg) !important;
            opacity: 1 !important;
          }

          .floating-ornament.ornament-1 {
            top: 200px;
            left: 90px;
            animation-delay: 0s;
          }

          .floating-ornament.ornament-2 {
            top: 350px;
            right: 90px;
            animation-delay: 2s;
          }

          .floating-ornament.ornament-3 {
            top: 500px;
            left: 95px;
            animation-delay: 4s;
          }

          .bottom-pattern {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 100px;
            background: linear-gradient(45deg, #8B4513, #CD853F, #F4A460, #CD853F);
            background-size: 400% 400%;
            animation: bottomFlow 8s ease-in-out infinite;
            clip-path: polygon(0 100%, 100% 100%, 100% 60%, 90% 45%, 80% 60%, 70% 40%, 60% 60%, 50% 35%, 40% 60%, 30% 40%, 20% 60%, 10% 45%, 0 60%);
          }

          @keyframes bottomFlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .heart-particle {
            position: absolute;
            color: rgba(205, 133, 63, 0.6);
            font-size: 16px;
            pointer-events: none;
            animation: heartFloat 4s ease-out forwards;
            z-index: 1000;
          }

          @keyframes heartFloat {
            0% {
              opacity: 1;
              transform: translateY(0) scale(0);
            }
            10% {
              transform: translateY(-10px) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateY(-100px) scale(0.5);
            }
          }

          @keyframes sparkleAnimation {
            0% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.2) rotate(180deg);
            }
            100% {
              opacity: 0;
              transform: scale(0) rotate(360deg);
            }
          }

          @keyframes confettiFall {
            0% {
              opacity: 1;
              transform: translateY(0) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: translateY(200px) rotate(720deg);
            }
          }

          .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
          }

          .action-btn {
            background: linear-gradient(135deg, #CD853F, #8B4513);
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 20px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(139, 69, 19, 0.3);
          }

          @media (max-width: 480px) {
            .invitation-container {
              max-width: 100%;
            }
            
            .main-content {
              padding: 140px 40px 40px;
            }
            
            .couple-names {
              font-size: 28px;
            }
          }
        `}
      </style>

      <div className="invitation-container">
        <div className="decorative-border">
          <div className="ornamental-pattern top-left"></div>
          <div className="ornamental-pattern top-right"></div>
        </div>
        
        <div className="side-pattern-left"></div>
        <div className="side-pattern-right"></div>
        
        <div className="main-content">
          <div className="floating-ornament ornament-1">❋</div>
          <div className="floating-ornament ornament-2">✦</div>
          <div className="floating-ornament ornament-3">❋</div>
          
          <div className="couple-names" onClick={createHeartBurst}>
            {wedding.bride}
            <span className="and">
              {currentLanguage === 'uz' ? 'ва' : currentLanguage === 'ru' ? 'и' : 'and'}
            </span>
            {wedding.groom}
          </div>
          
          <div className="decorative-divider"></div>
          
          <div className="wedding-text">
            {currentLanguage === 'uz' ? 'Никоҳ тўйи' : 
             currentLanguage === 'ru' ? 'Свадебная церемония' : 
             'Wedding Ceremony'}
          </div>
          
          <div className="date-time" onClick={createSparkleEffect}>
            <h3>
              {currentLanguage === 'uz' ? 'Сана ва вақт' : 
               currentLanguage === 'ru' ? 'Дата и время' : 
               'Date & Time'}
            </h3>
            <p>{formatDate(wedding.weddingDate)}</p>
            <p>{new Date(wedding.weddingDate).toLocaleDateString(currentLanguage === 'uz' ? 'uz-UZ' : 'en-US', { weekday: 'long' })}</p>
            <p>{formatTime(wedding.weddingTime)}</p>
          </div>
          
          <div className="venue" onClick={createGlitterEffect}>
            <h3>
              {currentLanguage === 'uz' ? 'Жойлашув' : 
               currentLanguage === 'ru' ? 'Место проведения' : 
               'Venue'}
            </h3>
            <p>{wedding.venue}</p>
            <p>{wedding.venueAddress}</p>
          </div>
          
          {wedding.dressCode && (
            <>
              <div className="decorative-divider"></div>
              <div className="venue">
                <h3>
                  {currentLanguage === 'uz' ? 'Кийим коди' : 
                   currentLanguage === 'ru' ? 'Дресс-код' : 
                   'Dress Code'}
                </h3>
                <p>{wedding.dressCode}</p>
              </div>
            </>
          )}
          
          <div className="decorative-divider"></div>
          
          <div className="rsvp-section">
            <p style={{ marginBottom: '15px', fontSize: '16px', color: '#8B4513', position: 'relative', zIndex: 10 }}>
              {currentLanguage === 'uz' ? 'Ҳурматли меҳмонлар, иштирокингизни тасдиқланг' : 
               currentLanguage === 'ru' ? 'Уважаемые гости, подтвердите ваше участие' : 
               'Dear guests, please confirm your attendance'}
            </p>
            <button className="rsvp-btn" onClick={handleRSVP}>
              {currentLanguage === 'uz' ? 'Жавоб бериш' : 
               currentLanguage === 'ru' ? 'Ответить' : 
               'RSVP'}
            </button>
          </div>

          <div className="action-buttons">
            <button className="action-btn" onClick={() => setShowPhotos(true)}>
              <Camera size={16} />
              {currentLanguage === 'uz' ? 'Расмлар' : 
               currentLanguage === 'ru' ? 'Фото' : 
               'Photos'}
            </button>
            <button className="action-btn" onClick={() => setShowGuestBook(true)}>
              <MessageSquare size={16} />
              {currentLanguage === 'uz' ? 'Хатлар' : 
               currentLanguage === 'ru' ? 'Сообщения' : 
               'Messages'}
            </button>
            <button className="action-btn">
              <Users size={16} />
              {currentLanguage === 'uz' ? 'Меҳмонлар' : 
               currentLanguage === 'ru' ? 'Гости' : 
               'Guests'}
              <span style={{ marginLeft: '5px' }}>({guests.length})</span>
            </button>
          </div>
        </div>
        
        <div className="bottom-pattern"></div>
      </div>

      {wedding.backgroundMusicUrl && (
        <BackgroundMusicPlayer 
          musicUrl={wedding.backgroundMusicUrl}
          autoPlay={true}
          loop={true}
          triggerPlay={triggerMusicPlay}
        />
      )}

      {showRSVP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <RSVPForm weddingId={wedding.id} />
            <button 
              onClick={() => setShowRSVP(false)}
              className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showGuestBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <GuestBookForm weddingId={wedding.id} />
            <button 
              onClick={() => setShowGuestBook(false)}
              className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPhotos && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <PhotoGallery weddingId={wedding.id} />
            <button 
              onClick={() => setShowPhotos(false)}
              className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
} 
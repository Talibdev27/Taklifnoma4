import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Heart, Music, Sparkles } from 'lucide-react';

interface WelcomeOverlayProps {
  weddingData: {
    bride: string;
    groom: string;
    template: string;
    eventType?: string;
  };
  hasMusic: boolean;
  onEnter: () => void;
  isVisible: boolean;
  defaultLanguage?: string;
}

export function WeddingWelcomeOverlay({ 
  weddingData, 
  hasMusic, 
  onEnter, 
  isVisible,
  defaultLanguage
}: WelcomeOverlayProps) {
  const { t, i18n } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Set language immediately when component mounts
  useEffect(() => {
    if (defaultLanguage && i18n.language !== defaultLanguage) {
      console.log('Welcome overlay: Setting language to', defaultLanguage);
      i18n.changeLanguage(defaultLanguage);
    }
  }, [defaultLanguage, i18n]);

  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(() => {
        setShowContent(true);
        setIsAnimating(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setIsAnimating(false);
    }
  }, [isVisible]);

  const handleEnter = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onEnter();
    }, 300); // Wait for fade-out animation
  };

  if (!isVisible) return null;

  const isBirthday = weddingData.eventType === 'birthday' || weddingData.template === 'birthday';
  const titleText = isBirthday 
    ? t('welcome.birthdayTitle', { name: weddingData.bride })
    : t('welcome.weddingTitle', { bride: weddingData.bride, groom: weddingData.groom });

  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-500 ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/95 via-rose-50/95 to-pink-50/95 backdrop-blur-sm" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-rose-200/30 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-amber-200/30 rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/6 w-16 h-16 bg-pink-200/30 rounded-full animate-pulse delay-500" />
        <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-rose-200/30 rounded-full animate-pulse delay-700" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className={`text-center max-w-2xl mx-auto transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Wedding/Birthday Icon */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                {isBirthday ? (
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                ) : (
                  <Heart className="w-12 h-12 text-white animate-pulse" />
                )}
              </div>
              {/* Floating hearts/sparkles */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-300 rounded-full animate-bounce" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-pink-300 rounded-full animate-bounce delay-300" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-playfair font-bold text-gray-800 mb-6 leading-tight">
            {titleText}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
            {isBirthday 
              ? t('welcome.birthdaySubtitle')
              : t('welcome.weddingSubtitle')
            }
          </p>

          {/* Music indicator */}
          {hasMusic && (
            <div className="mb-8 flex items-center justify-center gap-3 text-amber-600">
              <Music className="w-6 h-6 animate-pulse" />
              <span className="text-lg font-medium">
                {t('welcome.withMusic')}
              </span>
              <Music className="w-6 h-6 animate-pulse delay-500" />
            </div>
          )}

          {/* Enter button */}
          <Button
            onClick={handleEnter}
            size="lg"
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-12 py-4 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <Heart className="w-5 h-5 mr-2" />
            {isBirthday ? t('welcome.enterBirthday') : t('welcome.enterWedding')}
          </Button>

          {/* Small hint text */}
          <p className="mt-6 text-sm text-gray-500">
            {t('welcome.clickToStart')}
          </p>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-amber-300 rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  );
}

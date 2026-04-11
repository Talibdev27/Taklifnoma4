import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { calculateWeddingCountdown } from '@/lib/utils';

interface EnhancedCountdownTimerProps {
  targetDate: Date | string;
  weddingTime?: string;
  timezone?: string;
  className?: string;
  variant?: 'default' | 'wedding-day' | 'compact';
}

export function EnhancedCountdownTimer({ 
  targetDate, 
  weddingTime = '16:00',
  timezone = 'Asia/Tashkent',
  className = '', 
  variant = 'default' 
}: EnhancedCountdownTimerProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isWeddingDay: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isWeddingDay: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const result = calculateWeddingCountdown(targetDate, weddingTime, timezone);
      
      return {
        days: result.days,
        hours: result.hours,
        minutes: result.minutes,
        seconds: result.seconds,
        isWeddingDay: result.isExpired
      };
    };

    // Update immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, weddingTime, timezone]);

  if (timeLeft.isWeddingDay) {
    return (
      <div className={`text-center ${className}`}>
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-8 shadow-xl">
          <Heart className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <h3 className="text-2xl md:text-3xl font-playfair font-bold mb-2">
            {t('wedding.weddingDayIsHere')}
          </h3>
          <p className="text-lg opacity-90">
            Today is the special day!
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{timeLeft.days}</div>
            <div className="text-xs uppercase tracking-wide">Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{timeLeft.hours}</div>
            <div className="text-xs uppercase tracking-wide">Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{timeLeft.minutes}</div>
            <div className="text-xs uppercase tracking-wide">Minutes</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50">
        <h3 className="text-lg font-playfair font-semibold text-gray-800 mb-4">
          {t('wedding.countdown')}
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
              {timeLeft.days}
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
              Days
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
              {timeLeft.hours}
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
              Hours
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
              {timeLeft.minutes}
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
              Minutes
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
              {timeLeft.seconds}
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
              Seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateWeddingCountdown } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate: Date | string;
  weddingTime?: string;
  timezone?: string;
  className?: string;
}

export function CountdownTimer({ 
  targetDate, 
  weddingTime = '16:00',
  timezone = 'Asia/Tashkent',
  className = '' 
}: CountdownTimerProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(() => 
    calculateWeddingCountdown(targetDate, weddingTime, timezone)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateWeddingCountdown(targetDate, weddingTime, timezone));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, weddingTime, timezone]);

  if (timeLeft.isExpired) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-2xl font-playfair font-bold text-romantic-gold">
          🎉 {t('wedding.weddingDayIsHere')} 🎉
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center space-x-4 text-sm ${className}`}>
      <div className="bg-white bg-opacity-20 rounded-xl px-3 py-2 text-center">
        <div className="font-bold text-lg">{timeLeft.days}</div>
        <div>{t('time.days')}</div>
      </div>
      <div className="bg-white bg-opacity-20 rounded-xl px-3 py-2 text-center">
        <div className="font-bold text-lg">{timeLeft.hours}</div>
        <div>{t('time.hours')}</div>
      </div>
      <div className="bg-white bg-opacity-20 rounded-xl px-3 py-2 text-center">
        <div className="font-bold text-lg">{timeLeft.minutes}</div>
        <div>{t('time.minutes')}</div>
      </div>
    </div>
  );
}

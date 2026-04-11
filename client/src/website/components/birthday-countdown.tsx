import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateWeddingCountdown } from '@/lib/utils';

interface BirthdayCountdownProps {
  weddingDate: string;
  weddingTime?: string;
  timezone?: string;
  age?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function BirthdayCountdown({ 
  weddingDate, 
  weddingTime = '16:00', 
  timezone = 'Asia/Tashkent',
  age,
  primaryColor = '#FF6B9D',
  accentColor = '#FFB6C1'
}: BirthdayCountdownProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMilestone, setIsMilestone] = useState(false);

  // Check if it's a milestone birthday
  useEffect(() => {
    if (age) {
      const milestones = [1, 5, 10, 13, 16, 18, 21, 25, 30, 40, 50, 60, 70, 80, 90, 100];
      setIsMilestone(milestones.includes(age));
    }
  }, [age]);

  // Countdown calculation
  useEffect(() => {
    const calculateTimeLeft = () => {
      const result = calculateWeddingCountdown(weddingDate, weddingTime, timezone);
      setTimeLeft(result);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [weddingDate, weddingTime, timezone]);

  // Birthday emojis for different time units
  const getBirthdayEmoji = (unit: string) => {
    switch (unit) {
      case 'days': return '🎂';
      case 'hours': return '🎈';
      case 'minutes': return '🎁';
      case 'seconds': return '✨';
      default: return '🎉';
    }
  };

  // Milestone birthday emojis
  const getMilestoneEmoji = () => {
    if (!age) return '🎂';
    
    if (age === 1) return '👶';
    if (age === 5) return '🎠';
    if (age === 10) return '🎮';
    if (age === 13) return '📱';
    if (age === 16) return '🚗';
    if (age === 18) return '🎓';
    if (age === 21) return '🍾';
    if (age === 25) return '💎';
    if (age === 30) return '🌟';
    if (age === 40) return '💎';
    if (age === 50) return '🏆';
    if (age === 60) return '👑';
    if (age === 70) return '🌅';
    if (age === 80) return '🏛️';
    if (age === 90) return '🌺';
    if (age === 100) return '💯';
    
    return '🎂';
  };

  const countdownItems = [
    { value: timeLeft.days, label: t('countdown.days'), unit: 'days' },
    { value: timeLeft.hours, label: t('countdown.hours'), unit: 'hours' },
    { value: timeLeft.minutes, label: t('countdown.minutes'), unit: 'minutes' },
    { value: timeLeft.seconds, label: t('countdown.seconds'), unit: 'seconds' }
  ];

  return (
    <div className="text-center">
      {/* Milestone Birthday Banner */}
      {isMilestone && age && (
        <div 
          className="mb-6 p-4 rounded-2xl animate-pulse"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)`,
            border: `2px solid ${primaryColor}40`
          }}
        >
          <div className="text-4xl mb-2">{getMilestoneEmoji()}</div>
          <h3 className="text-xl font-bold mb-1" style={{ color: primaryColor }}>
            {t('birthday.milestone.title') || `🎉 ${age}th Birthday! 🎉`}
          </h3>
          <p className="text-sm opacity-80">
            {t('birthday.milestone.subtitle') || 'A Special Milestone Celebration!'}
          </p>
        </div>
      )}

      {/* Countdown Title */}
      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6" style={{ color: primaryColor }}>
        {isMilestone ? '🎉' : '🎂'} {t('birthday.countdown.title') || 'Countdown to the Big Day!'} {isMilestone ? '🎉' : '🎂'}
      </h3>

      {/* Countdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto mb-6">
        {countdownItems.map((item, index) => (
          <div 
            key={index}
            className="relative group"
          >
            <div 
              className="rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                animation: isMilestone ? 'pulse 2s infinite' : 'none'
              }}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl"></div>
              
              {/* Emoji */}
              <div className="text-2xl sm:text-3xl mb-2 relative z-10 animate-bounce" style={{ animationDelay: `${index * 0.1}s` }}>
                {getBirthdayEmoji(item.unit)}
              </div>
              
              {/* Number */}
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white relative z-10">
                {item.value.toString().padStart(2, '0')}
              </div>
              
              {/* Label */}
              <div className="text-xs sm:text-sm text-white/90 uppercase tracking-wider font-medium mt-1 relative z-10">
                {item.label}
              </div>
            </div>
            
            {/* Hover effect */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                transform: 'scale(1.05)',
                zIndex: -1
              }}
            />
          </div>
        ))}
      </div>

      {/* Birthday Message */}
      <div className="text-center">
        <p className="text-sm sm:text-base opacity-80 mb-2">
          {isMilestone 
            ? t('birthday.countdown.milestoneMessage') || `🎊 Get ready for an amazing ${age}th birthday celebration! 🎊`
            : t('birthday.countdown.message') || '🎈 The countdown is on! 🎈'
          }
        </p>
        
        {/* Special milestone features */}
        {isMilestone && (
          <div className="flex justify-center space-x-2 mt-4">
            <span className="text-2xl animate-spin" style={{ animationDuration: '3s' }}>🎉</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎊</span>
            <span className="text-2xl animate-pulse">🎂</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '1s' }}>🎈</span>
            <span className="text-2xl animate-spin" style={{ animationDuration: '2s' }}>✨</span>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }
      `}</style>
    </div>
  );
}

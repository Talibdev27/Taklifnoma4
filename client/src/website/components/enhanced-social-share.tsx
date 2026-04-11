import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Copy, Instagram, Check } from 'lucide-react';
import { SiWhatsapp, SiTelegram, SiFacebook } from 'react-icons/si';

interface EnhancedSocialShareProps {
  weddingUrl: string;
  coupleName: string;
  className?: string;
  primaryColor?: string;
  accentColor?: string;
  isBirthday?: boolean;
}

export function EnhancedSocialShare({ weddingUrl, coupleName, className = '', primaryColor = '#D4B08C', accentColor = '#89916B', isBirthday = false }: EnhancedSocialShareProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const fullUrl = `${window.location.origin}/wedding/${weddingUrl}`;
  const shareText = isBirthday 
    ? `${coupleName} tug'ilgan kuniga taklif qilinasiz! / You're invited to ${coupleName}'s birthday celebration!`
    : `${coupleName} to'yiga taklif qilinasiz! / You're invited to ${coupleName}'s wedding!`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t('share.linkCopied'),
        description: t('share.linkCopiedDesc'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('share.copyError'),
        variant: "destructive",
      });
    }
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToInstagram = () => {
    copyToClipboard();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      try {
        window.location.href = 'instagram://';
        setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank');
        }, 1000);
      } catch (error) {
        window.open('https://www.instagram.com/', '_blank');
      }
    } else {
      window.open('https://www.instagram.com/', '_blank');
    }
    
    toast({
      title: t('share.instagram'),
      description: t('share.linkCopied') + " " + (isMobile ? t('share.instagramOpened') : t('share.instagramWebOpened')),
      duration: 4000,
    });
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
    window.open(url, '_blank');
  };

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      icon: SiWhatsapp,
      color: '#25D366',
      onClick: shareToWhatsApp,
      gradient: 'from-[#25D366]/20 to-[#25D366]/5',
    },
    {
      name: 'Telegram',
      icon: SiTelegram,
      color: '#0088cc',
      onClick: shareToTelegram,
      gradient: 'from-[#0088cc]/20 to-[#0088cc]/5',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: '#E4405F',
      onClick: shareToInstagram,
      gradient: 'from-[#E4405F]/20 to-[#E4405F]/5',
    },
    {
      name: 'Facebook',
      icon: SiFacebook,
      color: '#1877F2',
      onClick: shareToFacebook,
      gradient: 'from-[#1877F2]/20 to-[#1877F2]/5',
    },
  ];

  return (
    <div className={className}>
      {/* Social Platform Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {socialPlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <button
              key={platform.name}
              onClick={platform.onClick}
              className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${platform.color}08, ${platform.color}03)`,
                border: `1px solid ${platform.color}20`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${platform.color}40`;
                e.currentTarget.style.boxShadow = `0 8px 24px ${platform.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${platform.color}20`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Hover Gradient Effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${platform.color}12, transparent)`,
                }}
              />
              
              <div className="relative flex flex-col items-center gap-2.5">
                <div 
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${platform.color}15, ${platform.color}08)`,
                    boxShadow: `0 4px 12px ${platform.color}10`,
                  }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: platform.color }} />
                </div>
                <span 
                  className="text-xs sm:text-sm font-medium tracking-wide"
                  style={{ color: platform.color }}
                >
                  {platform.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Copy Link Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.01]"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}03)`,
          border: `1px solid ${primaryColor}20`,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex-1 px-4 py-3 rounded-xl text-sm sm:text-base font-light overflow-x-auto scrollbar-none"
            style={{
              background: 'rgba(0,0,0,0.15)',
              border: `1px solid ${primaryColor}15`,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: '"Courier New", monospace',
            }}
          >
            <span className="whitespace-nowrap">{fullUrl}</span>
          </div>
          
          <button
            onClick={copyToClipboard}
            className="group relative flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: copied 
                ? `linear-gradient(135deg, #22c55e20, #22c55e10)`
                : `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
              border: copied ? '1px solid #22c55e40' : `1px solid ${primaryColor}30`,
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor}25, ${primaryColor}15)`;
                e.currentTarget.style.borderColor = `${primaryColor}50`;
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`;
                e.currentTarget.style.borderColor = `${primaryColor}30`;
              }
            }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500 hidden sm:inline">
                  {t('share.copied')}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" style={{ color: primaryColor }} />
                <span className="text-sm font-medium hidden sm:inline" style={{ color: primaryColor }}>
                  {t('share.copyLink')}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
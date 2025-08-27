import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Instagram, MessageCircle, ExternalLink } from 'lucide-react';
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
  const [showMore, setShowMore] = useState(false);

  const fullUrl = `${window.location.origin}/wedding/${weddingUrl}`;
  const shareText = isBirthday 
    ? `${coupleName} tug'ilgan kuniga taklif qilinasiz! / You're invited to ${coupleName}'s birthday celebration!`
    : `${coupleName} to'yiga taklif qilinasiz! / You're invited to ${coupleName}'s wedding!`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
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
    // Copy link to clipboard first
    copyToClipboard();
    
    // Try to open Instagram
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open Instagram app on mobile
      try {
        window.location.href = 'instagram://';
        // Fallback to web version if app doesn't open
        setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank');
        }, 1000);
      } catch (error) {
        window.open('https://www.instagram.com/', '_blank');
      }
    } else {
      // Open Instagram web version on desktop
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

  return (
    <Card className={`wedding-card ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold text-[#2C3338]">
            {isBirthday ? t('birthday.share.title') : t('share.title')}
          </h3>
        </div>
        
        <p className="text-[#2C3338]/70 mb-6 text-sm">
          {isBirthday ? t('birthday.share.subtitle') : t('share.subtitle')}
        </p>

        {/* Quick Share Options */}
        <div className="space-y-3 mb-4">
          <h4 className="font-medium text-[#2C3338] text-sm">{t('share.quickShare')}</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={shareToWhatsApp}
              className="flex items-center gap-2 h-12 transition-colors"
              style={{ 
                borderColor: `${primaryColor}30`,
                color: '#25D366'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#25D36610';
                e.currentTarget.style.borderColor = '#25D366';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = `${primaryColor}30`;
              }}
            >
              <SiWhatsapp className="w-4 h-4 text-[#25D366]" />
              <span className="text-sm">{t('share.whatsapp')}</span>
            </Button>

            <Button
              variant="outline"
              onClick={shareToTelegram}
              className="flex items-center gap-2 h-12 transition-colors"
              style={{ 
                borderColor: `${primaryColor}30`,
                color: '#0088cc'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0088cc10';
                e.currentTarget.style.borderColor = '#0088cc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = `${primaryColor}30`;
              }}
            >
              <SiTelegram className="w-4 h-4 text-[#0088cc]" />
              <span className="text-sm">{t('share.telegram')}</span>
            </Button>

            <Button
              variant="outline"
              onClick={shareToInstagram}
              className="flex items-center gap-2 h-12 transition-colors"
              style={{ 
                borderColor: `${primaryColor}30`,
                color: '#E4405F'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E4405F10';
                e.currentTarget.style.borderColor = '#E4405F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = `${primaryColor}30`;
              }}
            >
              <Instagram className="w-4 h-4 text-[#E4405F]" />
              <span className="text-sm">{t('share.instagram')}</span>
            </Button>

            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2 h-12 transition-colors"
              style={{ 
                borderColor: `${primaryColor}30`,
                color: primaryColor
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                e.currentTarget.style.borderColor = primaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = `${primaryColor}30`;
              }}
            >
              <Copy className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-sm">{t('share.copyLink')}</span>
            </Button>
          </div>
        </div>

        {/* More Options Toggle */}
        <Button
          variant="ghost"
          onClick={() => setShowMore(!showMore)}
          className="w-full text-sm"
          style={{ color: primaryColor }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${primaryColor}10`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {showMore ? t('share.showLess') : t('share.moreOptions')}
        </Button>

        {/* Additional Share Options */}
        {showMore && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: `${primaryColor}30` }}>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={shareToFacebook}
                className="flex items-center gap-2 h-12 transition-colors"
                style={{ 
                  borderColor: `${primaryColor}30`,
                  color: '#1877F2'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1877F210';
                  e.currentTarget.style.borderColor = '#1877F2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = `${primaryColor}30`;
                }}
              >
                <SiFacebook className="w-4 h-4 text-[#1877F2]" />
                <span className="text-sm">{t('share.facebook')}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const subject = encodeURIComponent(`${coupleName} Wedding Invitation`);
                  const body = encodeURIComponent(`${shareText}\n\n${fullUrl}`);
                  window.open(`mailto:?subject=${subject}&body=${body}`);
                }}
                className="flex items-center gap-2 h-12 transition-colors"
                style={{ 
                  borderColor: `${primaryColor}30`,
                  color: primaryColor
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                  e.currentTarget.style.borderColor = primaryColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = `${primaryColor}30`;
                }}
              >
                <ExternalLink className="w-4 h-4" style={{ color: primaryColor }} />
                <span className="text-sm">Email</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
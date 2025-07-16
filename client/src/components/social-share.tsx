import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Instagram, 
  MessageCircle,
  Copy,
  Mail,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SiWhatsapp, SiTelegram, SiLinkedin } from 'react-icons/si';

interface SocialShareProps {
  title: string;
  url: string;
  description?: string;
  image?: string;
}

export function SocialShare({ title, url, description, image }: SocialShareProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const shareText = description || `Join us for our special day! ${title}`;
  const fullUrl = `${window.location.origin}${url}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: t('share.linkCopied'),
        description: t('share.linkCopiedDesc'),
      });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('share.copyError'),
        variant: 'destructive',
      });
    }
  };

  const shareToFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + fullUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
  };

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${shareText}\n\nVisit our wedding website: ${fullUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: fullUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card className="wedding-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-playfair font-semibold text-charcoal flex items-center gap-2">
          <Share2 className="h-5 w-5 text-gold" />
          {t('share.title')}
        </CardTitle>
        <p className="text-sm text-charcoal/70">
          {t('share.subtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Share Button */}
        <Button 
          onClick={shareViaWebAPI}
          className="w-full wedding-button"
        >
          <Share2 className="h-4 w-4 mr-2" />
          {t('share.quickShare')}
        </Button>

        {/* Popular Platforms */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={shareToWhatsApp}
            className="flex flex-col items-center gap-1 h-auto py-3 wedding-button-outline"
          >
            <SiWhatsapp className="h-5 w-5 text-green-600" />
            <span className="text-xs">{t('share.whatsapp')}</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={shareToFacebook}
            className="flex flex-col items-center gap-1 h-auto py-3 wedding-button-outline"
          >
            <Facebook className="h-5 w-5 text-blue-600" />
            <span className="text-xs">{t('share.facebook')}</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={copyToClipboard}
            className="flex flex-col items-center gap-1 h-auto py-3 wedding-button-outline"
          >
            <Copy className="h-4 w-4 text-charcoal" />
            <span className="text-xs">{t('share.copyLink')}</span>
          </Button>
        </div>

        {/* More Options Toggle */}
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-charcoal/70 hover:text-charcoal"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              {t('share.showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              {t('share.moreOptions')}
            </>
          )}
        </Button>

        {/* Expanded Options */}
        {isExpanded && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-sage/20">
            <Button
              variant="outline"
              onClick={shareToTwitter}
              className="flex items-center gap-2 wedding-button-outline"
            >
              <Twitter className="h-4 w-4 text-blue-400" />
              {t('share.twitter')}
            </Button>
            
            <Button
              variant="outline"
              onClick={shareToTelegram}
              className="flex items-center gap-2 wedding-button-outline"
            >
              <SiTelegram className="h-4 w-4 text-blue-500" />
              {t('share.telegram')}
            </Button>
            
            <Button
              variant="outline"
              onClick={shareToLinkedIn}
              className="flex items-center gap-2 wedding-button-outline"
            >
              <SiLinkedin className="h-4 w-4 text-blue-700" />
              {t('share.linkedin')}
            </Button>
            
            <Button
              variant="outline"
              onClick={shareToEmail}
              className="flex items-center gap-2 wedding-button-outline"
            >
              <Mail className="h-4 w-4 text-charcoal" />
              {t('share.email')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
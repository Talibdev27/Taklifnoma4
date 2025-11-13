import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EpicRSVPForm } from '@/components/epic-rsvp-form';
import { GuestBookForm } from '@/components/guest-book-form';
import { calculateWeddingCountdown } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { Wedding, Photo, GuestBookEntry } from '@shared/schema';

interface Customer1TemplateProps {
  wedding: Wedding;
}

export function Customer1Template({ wedding }: Customer1TemplateProps) {
  const { t, i18n } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpAttending, setRsvpAttending] = useState('');
  const [rsvpGuests, setRsvpGuests] = useState('');
  const [rsvpName, setRsvpName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Force language based on wedding settings
  useEffect(() => {
    if (wedding?.defaultLanguage && i18n.language !== wedding.defaultLanguage) {
      console.log('Customer1 template: Setting language to', wedding.defaultLanguage);
      i18n.changeLanguage(wedding.defaultLanguage);
    }
  }, [wedding?.defaultLanguage, i18n]);

  // Get the appropriate locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'uz': return uz;
      case 'ru': return ru;
      case 'kk': return ru;
      case 'kaa': return ru;
      default: return enUS;
    }
  };

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ['/api/photos/wedding', wedding?.id],
    queryFn: () => fetch(`/api/photos/wedding/${wedding?.id}`).then(res => res.json()),
    enabled: !!wedding?.id,
  });

  const { data: guestBookEntries = [] } = useQuery<GuestBookEntry[]>({
    queryKey: ['/api/guest-book/wedding', wedding?.id],
    queryFn: () => fetch(`/api/guest-book/wedding/${wedding?.id}`).then(res => res.json()),
    enabled: !!wedding?.id,
  });

  // Timezone-aware countdown calculation
  useEffect(() => {
    if (!wedding?.weddingDate) return;
    
    const calculateTimeLeft = () => {
      const result = calculateWeddingCountdown(
        wedding.weddingDate,
        wedding.weddingTime || '16:00',
        wedding.timezone || 'Asia/Tashkent'
      );
      
      setTimeLeft(result);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [wedding?.weddingDate, wedding?.weddingTime, wedding?.timezone]);

  // Format wedding date
  const weddingDateFormatted = wedding?.weddingDate 
    ? format(new Date(wedding.weddingDate), 'dd.MM.yy', { locale: getDateLocale() })
    : '';

  // Get couple names
  const coupleNames = `${wedding?.bride || ''} & ${wedding?.groom || ''}`;

  // Get hero image - use couple photo or default
  const heroImage = wedding?.couplePhotoUrl || '/elegant-venue-garden-wedding-hall.jpg';

  // Handle RSVP submission
  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName || !rsvpAttending) return;

    try {
      const response = await fetch(`/api/weddings/${wedding.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: wedding.id,
          name: rsvpName,
          rsvpStatus: rsvpAttending === 'yes' ? 'confirmed' : rsvpAttending === 'no' ? 'declined' : 'pending',
          additionalGuests: parseInt(rsvpGuests) || 0,
        }),
      });

      if (response.ok) {
        alert(t('rsvp.submitSuccess') || 'RSVP submitted successfully!');
        setRsvpName('');
        setRsvpAttending('');
        setRsvpGuests('');
      }
    } catch (error) {
      console.error('RSVP submission error:', error);
      alert(t('rsvp.submitError') || 'Failed to submit RSVP');
    }
  };

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // This could be integrated with a contact API endpoint
    alert(t('customer1.contactSubmitted') || 'Thank you for your message!');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactMessage('');
  };

  // Wavy divider clip-path
  const wavyDivider = 'polygon(0 30%, 2% 25%, 4% 30%, 6% 25%, 8% 30%, 10% 25%, 12% 30%, 14% 25%, 16% 30%, 18% 25%, 20% 30%, 22% 25%, 24% 30%, 26% 25%, 28% 30%, 30% 25%, 32% 30%, 34% 25%, 36% 30%, 38% 25%, 40% 30%, 42% 25%, 44% 30%, 46% 25%, 48% 30%, 50% 25%, 52% 30%, 54% 25%, 56% 30%, 58% 25%, 60% 30%, 62% 25%, 64% 30%, 66% 25%, 68% 30%, 70% 25%, 72% 30%, 74% 25%, 76% 30%, 78% 25%, 80% 30%, 82% 25%, 84% 30%, 86% 25%, 88% 30%, 90% 25%, 92% 30%, 94% 25%, 96% 30%, 98% 25%, 100% 30%, 100% 100%, 0 100%)';
  const wavyDividerSmall = 'polygon(0 50%, 2% 45%, 4% 50%, 6% 45%, 8% 50%, 10% 45%, 12% 50%, 14% 45%, 16% 50%, 18% 45%, 20% 50%, 22% 45%, 24% 50%, 26% 45%, 28% 50%, 30% 45%, 32% 50%, 34% 45%, 36% 50%, 38% 45%, 40% 50%, 42% 45%, 44% 50%, 46% 45%, 48% 50%, 50% 45%, 52% 50%, 54% 45%, 56% 50%, 58% 45%, 60% 50%, 62% 45%, 64% 50%, 66% 45%, 68% 50%, 70% 45%, 72% 50%, 74% 45%, 76% 50%, 78% 45%, 80% 50%, 82% 45%, 84% 50%, 86% 45%, 88% 50%, 90% 45%, 92% 50%, 94% 45%, 96% 50%, 98% 45%, 100% 50%, 100% 100%, 0 100%)';

  return (
    <div className="min-h-screen bg-white font-serif">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-300 to-slate-100 opacity-40" />
        <img 
          src={heroImage} 
          alt="Wedding venue" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-6xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            WEDDING<br />DAY
          </h1>
          <p className="text-4xl mb-8" style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '3rem' }}>
            {coupleNames}
          </p>
          <p className="text-2xl tracking-wide">{weddingDateFormatted}</p>
        </div>

        {/* Wavy Divider */}
        <div className="absolute bottom-0 w-full h-24 bg-white" style={{ clipPath: wavyDivider }} />
      </section>

      {/* Invitation Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <p className="text-2xl mb-6" style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '2.5rem' }}>
            {t('customer1.dearGuests') || 'Dear Guests!'}
          </p>
          <p className="text-lg leading-relaxed mb-8 text-gray-700">
            {wedding?.welcomeMessage || wedding?.story || t('customer1.invitationMessage') || 'We invite you to celebrate our special day with us.'}
          </p>
          <p className="text-2xl mb-8" style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '2.5rem' }}>
            {coupleNames}
          </p>
          <p className="text-base leading-relaxed text-gray-600">
            {t('customer1.invitationClosing') || 'We look forward to celebrating with you!'}
          </p>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="relative bg-white py-16 px-4">
        <div className="max-w-md mx-auto">
          {/* Image with wavy divider */}
          <div className="relative mb-12 h-48 bg-gray-300 rounded-lg overflow-hidden">
            <img 
              src="/wedding-couple-venue-interior-elegant-hall.jpg" 
              alt="Wedding venue interior" 
              className="w-full h-full object-cover" 
            />
            <p className="absolute top-6 left-0 right-0 text-center text-white text-2xl" style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '2rem' }}>
              {t('customer1.countdownTitle') || 'Until the Wedding'}
            </p>
            <div className="absolute bottom-0 w-full h-12 bg-white" style={{ clipPath: wavyDividerSmall }} />
          </div>

          {/* Countdown Timer */}
          <div className="grid grid-cols-4 gap-4 text-center mb-12">
            <div>
              <p className="text-3xl font-bold text-gray-800">{timeLeft.days}</p>
              <p className="text-sm text-gray-600 mt-2">{t('customer1.days') || 'days'}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{timeLeft.hours}</p>
              <p className="text-sm text-gray-600 mt-2">{t('customer1.hours') || 'hours'}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{timeLeft.minutes}</p>
              <p className="text-sm text-gray-600 mt-2">{t('customer1.minutes') || 'minutes'}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{timeLeft.seconds}</p>
              <p className="text-sm text-gray-600 mt-2">{t('customer1.seconds') || 'seconds'}</p>
            </div>
          </div>

          {/* Location Icon and Details */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#5a7d6f] rounded-full flex items-center justify-center text-white text-xl">♥</div>
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-4">{t('customer1.venueTitle') || 'OUR VENUE:'}</p>
            <p className="text-base text-gray-700 leading-relaxed">
              {wedding?.venueAddress || wedding?.venue || t('customer1.venueAddress') || 'Venue address'}
            </p>
            <p className="text-lg mt-6 mb-4" style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '1.8rem' }}>
              {wedding?.venue || t('customer1.venueName') || 'Venue Name'}
            </p>
            <p className="text-sm text-gray-600">{t('customer1.venueType') || 'RESTAURANT'}</p>
          </div>
        </div>
      </section>

      {/* Guest Information */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-md mx-auto">
          <p className="text-2xl text-center mb-8" style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '2rem' }}>
            {t('customer1.dearGuests') || 'Dear Guests!'}
          </p>
          <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
            <p className="text-base leading-relaxed text-gray-700 mb-6">
              {wedding?.dearGuestMessage || wedding?.welcomeMessage || t('customer1.guestMessage') || 'We are delighted to invite you to our wedding celebration.'}
            </p>
            <p className="text-2xl text-center mt-6 mb-6" style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '2rem' }}>
              {coupleNames}
            </p>
            <p className="text-base leading-relaxed text-gray-700">
              {t('customer1.guestMessageClosing') || 'We look forward to celebrating with you!'}
            </p>
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-md mx-auto">
          <p className="text-center text-sm tracking-widest text-gray-600 mb-8">
            {t('customer1.rsvpTitle') || 'PLEASE CONFIRM YOUR ATTENDANCE:'}
          </p>
          
          <form onSubmit={handleRSVPSubmit} className="space-y-8">
            {/* First Question */}
            <div>
              <p className="text-lg font-semibold text-gray-800 mb-4">{t('customer1.willYouAttend') || 'Will you attend?'}</p>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="attendance" 
                    value="yes"
                    checked={rsvpAttending === 'yes'}
                    onChange={(e) => setRsvpAttending(e.target.value)}
                    className="w-4 h-4" 
                  />
                  <span className="ml-3 text-gray-700">{t('customer1.yesAttending') || 'Yes, I will attend'}</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="attendance" 
                    value="with-partner"
                    checked={rsvpAttending === 'with-partner'}
                    onChange={(e) => setRsvpAttending(e.target.value)}
                    className="w-4 h-4" 
                  />
                  <span className="ml-3 text-gray-700">{t('customer1.withPartner') || 'I will attend with my partner'}</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="attendance" 
                    value="no"
                    checked={rsvpAttending === 'no'}
                    onChange={(e) => setRsvpAttending(e.target.value)}
                    className="w-4 h-4" 
                  />
                  <span className="ml-3 text-gray-700">{t('customer1.notAttending') || 'I cannot attend'}</span>
                </label>
              </div>
            </div>

            {/* Second Question */}
            <div>
              <p className="text-lg font-semibold text-gray-800 mb-4">{t('customer1.howManyGuests') || 'How many people will attend?'}</p>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="guests" 
                    value="1-2"
                    checked={rsvpGuests === '1-2'}
                    onChange={(e) => setRsvpGuests(e.target.value)}
                    className="w-4 h-4" 
                  />
                  <span className="ml-3 text-gray-700">1-2</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="guests" 
                    value="3-4"
                    checked={rsvpGuests === '3-4'}
                    onChange={(e) => setRsvpGuests(e.target.value)}
                    className="w-4 h-4" 
                  />
                  <span className="ml-3 text-gray-700">3-4</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="guests" 
                    value="5-6"
                    checked={rsvpGuests === '5-6'}
                    onChange={(e) => setRsvpGuests(e.target.value)}
                    className="w-4 h-4" 
                  />
                  <span className="ml-3 text-gray-700">5-6</span>
                </label>
              </div>
            </div>

            {/* Input and Button */}
            <div className="mt-8">
              <input 
                type="text" 
                placeholder={t('customer1.enterYourName') || 'Enter your name'} 
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-full py-3 px-4 text-center text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#5a7d6f] mb-4"
                required
              />
              <button 
                type="submit"
                className="w-full bg-[#5a7d6f] text-white py-3 rounded-full font-semibold hover:bg-[#4a6d5f] transition-colors"
              >
                {t('customer1.submit') || 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Dress Code Section */}
      {wedding?.dressCode && (
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-md mx-auto">
            <p className="text-center text-sm tracking-widest text-gray-600 mb-8">
              {t('customer1.dressCode') || 'DRESS CODE:'}
            </p>
            
            <div className="space-y-12">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800 mb-4">{t('customer1.mensDressCode') || 'MEN\'S ATTIRE:'}</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {wedding.dressCode}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact/Help Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <p className="text-lg font-semibold text-gray-800 mb-6">
            {t('customer1.needHelp') || 'Do you need help?'}
          </p>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder={t('customer1.fullName') || 'Full name'} 
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#5a7d6f]"
            />
            <input 
              type="email" 
              placeholder="Email" 
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#5a7d6f]"
            />
            <input 
              type="tel" 
              placeholder={t('customer1.phone') || 'Phone'} 
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#5a7d6f]"
            />
            <textarea 
              placeholder={t('customer1.message') || 'Message'} 
              rows={4}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-[#5a7d6f]"
            />
            <button 
              type="submit" 
              className="w-full bg-[#5a7d6f] text-white py-3 rounded-lg font-semibold hover:bg-[#4a6d5f] transition-colors"
            >
              {t('customer1.submit') || 'Submit'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 px-4 text-center text-sm text-gray-600">
        <p>{coupleNames} {t('customer1.wedding') || 'Wedding'} • {weddingDateFormatted}</p>
      </footer>
    </div>
  );
}


import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertGuestSchema } from '@shared/schema';

const rsvpFormSchema = insertGuestSchema.extend({
  email: z.string().email().optional().or(z.literal('')),
});

type RSVPFormData = z.infer<typeof rsvpFormSchema>;

interface EpicRSVPFormProps {
  weddingId: number;
  primaryColor?: string;
  accentColor?: string;
  isBirthday?: boolean;
}

export function EpicRSVPForm({ weddingId, primaryColor = '#1976d2', accentColor = '#1565c0', isBirthday = false }: EpicRSVPFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: {
      weddingId,
      name: '',
      email: '',
      phone: '',
      rsvpStatus: 'pending',
      additionalGuests: 0,
      dietaryRestrictions: '',
      message: '',
    },
  });

  const submitRSVP = useMutation({
    mutationFn: async (data: RSVPFormData) => {
      const response = await fetch(`/api/weddings/${weddingId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit RSVP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('rsvp.thankYou'),
        description: isBirthday ? t('birthday.rsvp.thankYouMessage') || t('rsvp.thankYouMessage') : t('rsvp.thankYouMessage'),
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: [`/api/guests/wedding/${weddingId}`] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('rsvp.errorMessage'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RSVPFormData) => {
    submitRSVP.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-8">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
        >
          <span className="text-white text-2xl">✓</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('rsvp.thankYou')}</h3>
        <p className="text-gray-600">
          {isBirthday ? t('birthday.rsvp.thankYouMessage') || t('rsvp.thankYouMessage') : t('rsvp.thankYouMessage')}
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">{t('rsvp.guestName')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('rsvp.enterFullName')} 
                  {...field} 
                  className="border-gray-300"
                  style={{
                    '--tw-ring-color': primaryColor + '50',
                    borderColor: field.value ? primaryColor + '30' : undefined
                  } as any}
                  onFocus={(e) => {
                    e.target.style.borderColor = primaryColor;
                    e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = field.value ? primaryColor + '30' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rsvpStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">{t('rsvp.willYouAttend')}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Set additionalGuests to 1 when confirmed_with_guest is selected
                    if (value === 'confirmed_with_guest') {
                      form.setValue('additionalGuests', 1);
                      form.setValue('plusOne', true);
                    } else {
                      form.setValue('additionalGuests', 0);
                      form.setValue('plusOne', false);
                    }
                  }}
                  defaultValue={field.value}
                  className="flex flex-col space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="confirmed" 
                      id="confirmed" 
                      className="border-2"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    />
                    <Label htmlFor="confirmed" className="text-gray-700">{t('rsvp.confirmedEmoji')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="confirmed_with_guest" 
                      id="confirmed_with_guest" 
                      className="border-2"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    />
                    <Label htmlFor="confirmed_with_guest" className="text-gray-700">{t('rsvp.confirmedWithGuestEmoji')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="declined" 
                      id="declined" 
                      className="border-2"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    />
                    <Label htmlFor="declined" className="text-gray-700">{t('rsvp.declinedEmoji')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="maybe" 
                      id="maybe" 
                      className="border-2"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    />
                    <Label htmlFor="maybe" className="text-gray-700">{t('rsvp.maybeEmoji')}</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-medium">
                {isBirthday ? t('birthday.rsvp.message') || t('rsvp.message') : t('rsvp.message')}
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={isBirthday ? t('birthday.rsvp.shareMessage') : t('rsvp.shareMessage')} 
                  {...field} 
                  value={field.value || ''}
                  className="border-gray-300 min-h-[80px]"
                  onFocus={(e) => {
                    e.target.style.borderColor = primaryColor;
                    e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = field.value ? primaryColor + '30' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          style={{ 
            background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
            border: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          disabled={submitRSVP.isPending}
        >
          {submitRSVP.isPending ? t('common.loading') : (isBirthday ? t('birthday.rsvp.submit') || t('rsvp.submit') : t('rsvp.submit'))}
        </Button>
      </form>
    </Form>
  );
}
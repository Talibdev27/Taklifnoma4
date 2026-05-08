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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertGuestSchema } from '@shared/schema';

const rsvpFormSchema = insertGuestSchema.extend({
  email: z.string().email().optional().or(z.literal('')),
});

type RSVPFormData = z.infer<typeof rsvpFormSchema>;

interface RSVPFormProps {
  weddingId: number;
  className?: string;
}

export function RSVPForm({ weddingId, className = '' }: RSVPFormProps) {
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
      plusOne: false,
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
      setIsSubmitted(true);
      toast({
        title: t('rsvp.thankYou'),
        description: t('rsvp.thankYouMessage'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/guests/wedding/${weddingId}`] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('rsvp.errorMessage'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RSVPFormData) => {
    submitRSVP.mutate(data);
  };

  if (isSubmitted) {
    return (
      <Card className={`max-w-md mx-auto ${className}`}>
        <CardContent className="pt-6 text-center">
          <div className="text-6xl mb-4">💝</div>
          <h3 className="text-xl font-playfair font-semibold text-charcoal mb-2">
            {t('rsvp.thankYou')}
          </h3>
          <p className="text-charcoal opacity-70">
            {t('rsvp.thankYouMessage')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`max-w-lg mx-auto ${className} shadow-2xl rounded-2xl`}>
      <CardHeader className="text-center bg-gray-50 p-8 rounded-t-2xl">
        <CardTitle className="font-playfair text-4xl text-gray-800">{t('rsvp.title')}</CardTitle>
        <p className="text-gray-600 font-cormorant text-lg">{t('rsvp.subtitle')}</p>
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rsvp.guestName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('rsvp.enterFullName')} {...field} />
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
                  <FormLabel className="text-lg font-semibold text-gray-700">{t('rsvp.willYouAttend')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value === 'confirmed_with_guest' ? 'confirmed' : value);
                        form.setValue('plusOne', value === 'confirmed_with_guest');
                      }}
                      defaultValue={field.value}
                      className="flex flex-col space-y-4 pt-2"
                    >
                      <FormItem className="flex items-center space-x-3">
                        <FormControl>
                          <RadioGroupItem value="confirmed" id="confirmed" />
                        </FormControl>
                        <Label htmlFor="confirmed" className="text-base font-medium text-gray-700">{t('rsvp.confirmedEmoji')}</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3">
                        <FormControl>
                          <RadioGroupItem value="confirmed_with_guest" id="confirmed_with_guest" />
                        </FormControl>
                        <Label htmlFor="confirmed_with_guest" className="text-base font-medium text-gray-700">{t('rsvp.confirmedWithGuestEmoji')}</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3">
                        <FormControl>
                          <RadioGroupItem value="declined" id="declined" />
                        </FormControl>
                        <Label htmlFor="declined" className="text-base font-medium text-gray-700">{t('rsvp.declinedEmoji')}</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3">
                        <FormControl>
                          <RadioGroupItem value="maybe" id="maybe" />
                        </FormControl>
                        <Label htmlFor="maybe" className="text-base font-medium text-gray-700">{t('rsvp.maybeEmoji')}</Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
/>
            
            /

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rsvp.message')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('rsvp.shareMessage')}
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              disabled={submitRSVP.isPending}
            >
              {submitRSVP.isPending ? t('common.loading') : t('rsvp.submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

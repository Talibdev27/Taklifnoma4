import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Search, User, CheckCircle } from 'lucide-react';
import type { Wedding, Guest } from '@shared/schema';

const rsvpFormSchema = insertGuestSchema.extend({
  email: z.string().email().optional().or(z.literal('')),
});

type RSVPFormData = z.infer<typeof rsvpFormSchema>;

interface EpicRSVPFormProps {
  wedding: Wedding;
  primaryColor?: string;
  accentColor?: string;
  isBirthday?: boolean;
}

export function EpicRSVPForm({ wedding, primaryColor = '#1976d2', accentColor = '#1565c0', isBirthday = false }: EpicRSVPFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // RSVP Mode state
  const rsvpMode = wedding.rsvpMode || 'both';
  const [rsvpMethod, setRsvpMethod] = useState<'manual' | 'preregistered'>(
    rsvpMode === 'manual' ? 'manual' : 'preregistered'
  );
  
  // Guest search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // Fetch guests for this wedding (public endpoint) - only when needed
  const { data: guests = [], isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: [`/api/guests/public/${wedding.id}`],
    queryFn: () => fetch(`/api/guests/public/${wedding.id}`).then(res => res.json()),
    enabled: !!wedding.id && (rsvpMode === 'preregistered' || rsvpMode === 'both'),
  });

  // Filter guests based on search term
  const filteredGuests = guests.filter(guest => 
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const form = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: {
      weddingId: wedding.id,
      name: '',
      email: '',
      phone: '',
      rsvpStatus: 'pending',
      additionalGuests: 0,
      dietaryRestrictions: '',
      message: '',
    },
  });

  // Handle manual RSVP submission
  const submitRSVP = useMutation({
    mutationFn: async (data: RSVPFormData) => {
      const response = await fetch(`/api/weddings/${wedding.id}/rsvp`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/guests/wedding/${wedding.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('rsvp.errorMessage'),
        variant: 'destructive',
      });
    },
  });

  // Handle pre-registered guest RSVP update
  const updateRSVP = useMutation({
    mutationFn: async (data: { guestId: number; rsvpStatus: string; responseText: string; message?: string; plusOne?: boolean }) => {
      const response = await fetch(`/api/guests/${data.guestId}/rsvp`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rsvpStatus: data.rsvpStatus,
          responseText: data.responseText,
          message: data.message,
          plusOne: data.plusOne,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update RSVP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: t('rsvp.rsvpUpdated'),
        description: t('rsvp.thankYouResponse'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/guests/public/${wedding.id}`] });
    },
    onError: () => {
      toast({
        title: t('rsvp.error'),
        description: t('rsvp.failedToUpdate'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RSVPFormData) => {
    submitRSVP.mutate(data);
  };

  // Handle pre-registered guest RSVP submission
  const handlePreRegisteredSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) {
      toast({
        title: t('rsvp.pleaseSelectName'),
        description: t('rsvp.selectNameDescription'),
        variant: "destructive",
      });
      return;
    }

    const formData = form.getValues();
    const finalRsvpStatus = formData.rsvpStatus === 'confirmed_with_guest' ? 'confirmed' : formData.rsvpStatus;
    const plusOne = formData.rsvpStatus === 'confirmed_with_guest';
    
    updateRSVP.mutate({
      guestId: selectedGuest.id,
      rsvpStatus: finalRsvpStatus,
      responseText: formData.rsvpStatus,
      message: formData.message,
      plusOne,
    });
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
    <div className="space-y-6">
      {/* RSVP Mode Toggle - Only show if mode is 'both' */}
      {rsvpMode === 'both' && (
        <div className="flex gap-2 mb-6 w-full">
          <Button
            type="button"
            variant={rsvpMethod === 'manual' ? 'default' : 'outline'}
            onClick={() => setRsvpMethod('manual')}
            className="flex-1 min-w-0 py-4 text-base font-medium whitespace-normal break-words h-auto leading-tight"
            style={{
              backgroundColor: rsvpMethod === 'manual' ? primaryColor : 'transparent',
              borderColor: primaryColor,
              color: rsvpMethod === 'manual' ? 'white' : primaryColor,
              minHeight: '52px',
              paddingLeft: '12px',
              paddingRight: '12px',
            }}
          >
            {t('rsvp.manualEntry')}
          </Button>
          <Button
            type="button"
            variant={rsvpMethod === 'preregistered' ? 'default' : 'outline'}
            onClick={() => setRsvpMethod('preregistered')}
            className="flex-1 min-w-0 py-4 text-base font-medium whitespace-normal break-words h-auto leading-tight"
            style={{
              backgroundColor: rsvpMethod === 'preregistered' ? primaryColor : 'transparent',
              borderColor: primaryColor,
              color: rsvpMethod === 'preregistered' ? 'white' : primaryColor,
              minHeight: '52px',
              paddingLeft: '12px',
              paddingRight: '12px',
            }}
          >
            {t('rsvp.findMyName')}
          </Button>
        </div>
      )}

      {/* Manual Entry Form */}
      {(rsvpMode === 'manual' || (rsvpMode === 'both' && rsvpMethod === 'manual')) && (
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
      )}

      {/* Pre-registered Guest Search Form */}
      {(rsvpMode === 'preregistered' || (rsvpMode === 'both' && rsvpMethod === 'preregistered')) && (
        <Form {...form}>
          <form onSubmit={handlePreRegisteredSubmit} className="space-y-6">
          {/* Guest Search */}
          <div className="space-y-4">
            <Label className="text-gray-700 font-medium">{t('rsvp.findYourName')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('rsvp.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300"
                style={{
                  '--tw-ring-color': primaryColor + '50',
                  borderColor: searchTerm ? primaryColor + '30' : undefined
                } as any}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor;
                  e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = searchTerm ? primaryColor + '30' : '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            {/* Guest List */}
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {guestsLoading ? (
                  <div className="p-4 text-center text-gray-500">{t('rsvp.loadingGuests')}</div>
                ) : filteredGuests.length > 0 ? (
                  filteredGuests.map((guest) => (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => {
                        setSelectedGuest(guest);
                        setSearchTerm(guest.name);
                        // Pre-fill form with guest data
                        form.setValue('name', guest.name);
                        form.setValue('email', guest.email || '');
                        form.setValue('phone', guest.phone || '');
                      }}
                      className={`w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                        selectedGuest?.id === guest.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{guest.name}</div>
                          {guest.email && (
                            <div className="text-sm text-gray-500">{guest.email}</div>
                          )}
                        </div>
                        {selectedGuest?.id === guest.id && (
                          <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {t('rsvp.noGuestsFound')}
                  </div>
                )}
              </div>
            )}
            
            {selectedGuest && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">{t('rsvp.selected')}: {selectedGuest.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* RSVP Status - Only show if guest is selected */}
          {selectedGuest && (
            <>
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
                            id="preregistered-confirmed" 
                            className="border-2"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                          />
                          <Label htmlFor="preregistered-confirmed" className="text-gray-700">{t('rsvp.confirmedEmoji')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="confirmed_with_guest" 
                            id="preregistered-confirmed_with_guest" 
                            className="border-2"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                          />
                          <Label htmlFor="preregistered-confirmed_with_guest" className="text-gray-700">{t('rsvp.confirmedWithGuestEmoji')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="declined" 
                            id="preregistered-declined" 
                            className="border-2"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                          />
                          <Label htmlFor="preregistered-declined" className="text-gray-700">{t('rsvp.declinedEmoji')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value="maybe" 
                            id="preregistered-maybe" 
                            className="border-2"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                          />
                          <Label htmlFor="preregistered-maybe" className="text-gray-700">{t('rsvp.maybeEmoji')}</Label>
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
                disabled={updateRSVP.isPending}
              >
                {updateRSVP.isPending ? t('common.loading') : (isBirthday ? t('birthday.rsvp.submit') || t('rsvp.submit') : t('rsvp.submit'))}
              </Button>
            </>
          )}
          </form>
        </Form>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Heart, 
  MapPin, 
  Palette, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Users,
  Calendar,
  Camera,
  Share2
} from 'lucide-react';
import { formatDateForInput } from '@/lib/utils';

const progressiveOnboardingSchema = z.object({
  // Step 1: Personal Info
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  
  // Step 2: Couple Info
  bride: z.string().min(1, "Bride's name is required"),
  groom: z.string().min(1, "Groom's name is required"),
  weddingDate: z.date(),
  relationshipStory: z.string().optional(),
  
  // Step 3: Wedding Details
  venue: z.string().min(1, "Venue is required"),
  venueAddress: z.string().min(1, "Venue address is required"),
  guestCount: z.number().min(1, "Guest count is required"),
  
  // Step 4: Personalization
  template: z.string().default("gardenRomance"),
  primaryColor: z.string().default("#D4AF76"),
  accentColor: z.string().default("#89916B"),
  isPublic: z.boolean().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProgressiveFormData = z.infer<typeof progressiveOnboardingSchema>;

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  fields: (keyof ProgressiveFormData)[];
  completionTip: string;
}

export function ProgressiveOnboarding() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: t('onboarding.step1.title'),
      description: t('onboarding.step1.description'),
      icon: User,
      fields: ['name', 'email', 'password', 'confirmPassword'],
      completionTip: t('onboarding.step1.tip')
    },
    {
      id: 2,
      title: t('onboarding.step2.title'),
      description: t('onboarding.step2.description'),
      icon: Heart,
      fields: ['bride', 'groom', 'weddingDate', 'relationshipStory'],
      completionTip: t('onboarding.step2.tip')
    },
    {
      id: 3,
      title: t('onboarding.step3.title'),
      description: t('onboarding.step3.description'),
      icon: MapPin,
      fields: ['venue', 'venueAddress', 'guestCount'],
      completionTip: t('onboarding.step3.tip')
    },
    {
      id: 4,
      title: t('onboarding.step4.title'),
      description: t('onboarding.step4.description'),
      icon: Palette,
      fields: ['template', 'primaryColor', 'accentColor', 'isPublic'],
      completionTip: t('onboarding.step4.tip')
    }
  ];

  const form = useForm<ProgressiveFormData>({
    resolver: zodResolver(progressiveOnboardingSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      bride: '',
      groom: '',
      weddingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      relationshipStory: '',
      venue: '',
      venueAddress: '',
      guestCount: 50,
      template: 'gardenRomance',
      primaryColor: '#D4AF76',
      accentColor: '#89916B',
      isPublic: true,
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: ProgressiveFormData) => {
      // Validate required fields
      if (!data.email || !data.password || !data.name) {
        throw new Error('Please fill in all required account information');
      }

      const response = await fetch('/api/get-started', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          weddingDate: data.weddingDate.toISOString(),
          story: data.relationshipStory || '',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create account');
      }
      
      return response.json();
    },
    onSuccess: ({ user, wedding }) => {
      // Store user ID for dashboard access
      localStorage.setItem('currentUserId', user.id.toString());
      
      toast({
        title: t('onboarding.success.title'),
        description: t('onboarding.success.description'),
      });
      setLocation(`/wedding/${wedding.uniqueUrl}`);
    },
    onError: (error) => {
      toast({
        title: t('onboarding.error.title'),
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  const currentStepData = steps[currentStep - 1];
  const totalSteps = steps.length;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate = currentStepData.fields;
    const result = await form.trigger(fieldsToValidate);
    
    if (result && !completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (!isValid) {
      toast({
        title: 'Please complete this step',
        description: 'Fill in all required fields before continuing',
        variant: 'destructive',
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: ProgressiveFormData) => {
    setIsSubmitting(true);
    
    // Validate all steps before submission
    const allFieldsValid = await form.trigger();
    if (!allFieldsValid) {
      setIsSubmitting(false);
      toast({
        title: t('onboarding.error.title'),
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    // Check specifically for required fields
    if (!data.bride || !data.groom || !data.venue || !data.venueAddress) {
      setIsSubmitting(false);
      toast({
        title: t('onboarding.error.title'),
        description: 'Please complete all required wedding information',
        variant: 'destructive',
      });
      return;
    }
    
    createAccountMutation.mutate(data);
  };

  const templateOptions = [
    { id: 'gardenRomance', name: t('templates.gardenRomance'), preview: '#D4AF76' },
    { id: 'modernMinimal', name: t('templates.modernMinimal'), preview: '#6B7280' },
    { id: 'vintageChic', name: t('templates.vintageChic'), preview: '#92400E' },
    { id: 'bohoGarden', name: t('templates.bohoGarden'), preview: '#059669' },
    { id: 'modern', name: t('templates.modern'), preview: '#b08968' },
  ];

  const features = [
    { icon: Calendar, text: t('onboarding.features.rsvp') },
    { icon: Camera, text: t('onboarding.features.photos') },
    { icon: Users, text: t('onboarding.features.guestBook') },
    { icon: Share2, text: t('onboarding.features.socialSharing') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-soft-white to-sage-green/10 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-playfair font-bold text-charcoal mb-2">
            {t('onboarding.title')}
          </h1>
          <p className="text-charcoal/70 mb-6">
            {t('onboarding.subtitle')}
          </p>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-charcoal/60">
                {t('onboarding.step')} {currentStep} {t('onboarding.of')} {totalSteps}
              </span>
              <span className="text-sm font-medium text-charcoal">
                {Math.round(progressPercentage)}% {t('onboarding.complete')}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-4 mb-8">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-gold text-white'
                      : isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{step.title}</span>
                  {isCompleted && <Check className="w-4 h-4" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="wedding-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <currentStepData.icon className="w-6 h-6 text-gold" />
                  <div>
                    <h2 className="text-xl font-playfair font-semibold">
                      {currentStepData.title}
                    </h2>
                    <p className="text-sm text-charcoal/70 font-normal">
                      {currentStepData.description}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('onboarding.fields.fullName')}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t('onboarding.placeholders.fullName')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('onboarding.fields.email')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder={t('onboarding.placeholders.email')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('onboarding.fields.password')}</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" placeholder={t('onboarding.placeholders.password')} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('onboarding.fields.confirmPassword')}</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" placeholder={t('onboarding.placeholders.confirmPassword')} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Couple Information */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="bride"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('onboarding.fields.brideName')}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder={t('onboarding.placeholders.brideName')} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="groom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('onboarding.fields.groomName')}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder={t('onboarding.placeholders.groomName')} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="weddingDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('onboarding.fields.weddingDate')}</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  value={field.value ? formatDateForInput(field.value) : ''}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="relationshipStory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('onboarding.fields.loveStory')}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder={t('onboarding.placeholders.loveStory')}
                                  rows={4}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Step 3: Wedding Details */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="venue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('onboarding.fields.venueName')}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t('onboarding.placeholders.venueName')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="venueAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('onboarding.fields.venueAddress')}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t('onboarding.placeholders.venueAddress')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="guestCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('onboarding.fields.guestCount')}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  placeholder={t('onboarding.placeholders.guestCount')} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Step 4: Personalization */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="template"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('onboarding.fields.template')}</FormLabel>
                              <div className="grid grid-cols-2 gap-3">
                                {templateOptions.map((template) => (
                                  <div
                                    key={template.id}
                                    onClick={() => field.onChange(template.id)}
                                    className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                                      field.value === template.id
                                        ? 'border-gold bg-gold/10'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div 
                                      className="w-full h-16 rounded mb-3"
                                      style={{ backgroundColor: template.preview }}
                                    />
                                    <p className="text-sm font-medium">{template.name}</p>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="primaryColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('onboarding.fields.primaryColor')}</FormLabel>
                                <FormControl>
                                  <Input type="color" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="accentColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('onboarding.fields.accentColor')}</FormLabel>
                                <FormControl>
                                  <Input type="color" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>{t('onboarding.fields.makePublic')}</FormLabel>
                                <p className="text-sm text-charcoal/60">
                                  {t('onboarding.fields.makePublicDesc')}
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1 || isSubmitting}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('onboarding.previous')}
                      </Button>
                      
                      {currentStep < totalSteps ? (
                        <Button
                          type="button"
                          onClick={handleNext}
                          className="wedding-button"
                          disabled={isSubmitting}
                        >
                          {t('onboarding.next')}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="wedding-button"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              {t('onboarding.creating')}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              {t('onboarding.createWebsite')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Step Tip */}
            <Card className="wedding-card">
              <CardHeader>
                <CardTitle className="text-lg">{t('onboarding.helpfulTip')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-charcoal/70">
                  {currentStepData.completionTip}
                </p>
              </CardContent>
            </Card>

            {/* Features Preview */}
            <Card className="wedding-card">
              <CardHeader>
                <CardTitle className="text-lg">{t('onboarding.whatYouGet')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-gold" />
                        <span className="text-sm">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Progress Summary */}
            <Card className="wedding-card">
              <CardHeader>
                <CardTitle className="text-lg">{t('onboarding.progress')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between">
                      <span className="text-sm">{step.title}</span>
                      {completedSteps.includes(step.id) ? (
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          <Check className="w-3 h-3 mr-1" />
                          {t('onboarding.completed')}
                        </Badge>
                      ) : step.id === currentStep ? (
                        <Badge variant="outline" className="border-gold text-gold">
                          {t('onboarding.current')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t('onboarding.pending')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
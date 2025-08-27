import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { insertWeddingSchema, insertUserSchema } from "@shared/schema";
import { formatDateForInput } from "@/lib/utils";
import { Heart, Calendar, MapPin, Camera, ChevronLeft, ChevronRight, User, Eye, EyeOff } from "lucide-react";
import { CreateWeddingLoading } from "@/components/ui/loading";

// Combined schema for user registration + wedding creation
const getStartedSchema = z.object({
  // User fields
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  
  // Wedding fields
  bride: z.string().min(1, "Bride's name is required"),
  groom: z.string().min(1, "Groom's name is required"),
  weddingDate: z.date(),
  weddingTime: z.string().default("18:00"),
  venue: z.string().min(1, "Venue is required"),
  venueAddress: z.string().min(1, "Venue address is required"),
  template: z.string().default("gardenRomance"),
  primaryColor: z.string().default("#D4B08C"),
  accentColor: z.string().default("#89916B"),
  story: z.string().optional(),
  backgroundMusicUrl: z.string().optional(),
  isPublic: z.boolean().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type GetStartedFormData = z.infer<typeof getStartedSchema>;

const templateOptions = [
  {
    id: "gardenRomance",
    name: "Garden Romance",
    nameUz: "Bog' romantikasi",
    nameRu: "Садовый романс",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop"
  },
  {
    id: "anime_1",
    name: "Anime 1 (Animated)",
    nameUz: "Anime 1 (Animatsiyali)",
    nameRu: "Аниме 1 (Анимированный)",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop"
  },
  {
    id: "flower",
    name: "Flower",
    nameUz: "Gul",
    nameRu: "Цветок",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop"
  },
  {
    id: "birthday",
    name: "Birthday",
    nameUz: "Tug'ilgan kun",
    nameRu: "День рождения",
    image: "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400&h=300&fit=crop"
  },
  {
    id: "modernElegance", 
    name: "Modern Elegance",
    nameUz: "Zamonaviy nafislik",
    nameRu: "Современная элегантность",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop"
  },
  {
    id: "rusticCharm",
    name: "Rustic Charm",
    nameUz: "Qishloq jozibasi",
    nameRu: "Деревенский шарм",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop"
  },
  {
    id: "beachBliss",
    name: "Beach Bliss",
    nameUz: "Plyaj baxt",
    nameRu: "Пляжное блаженство",
    image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=300&fit=crop"
  },
];

export default function GetStarted() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const totalSteps = 4;

  const form = useForm<GetStartedFormData>({
    resolver: zodResolver(getStartedSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      bride: "",
      groom: "",
      weddingDate: new Date(),
      weddingTime: "18:00",
      venue: "",
      venueAddress: "",
      template: "gardenRomance",
      primaryColor: "#D4B08C",
      accentColor: "#89916B",
      story: "",
      backgroundMusicUrl: "",
      isPublic: true,
    },
  });

  const createUserAndWedding = useMutation({
    mutationFn: async (data: GetStartedFormData) => {
      try {
        // Use the combined registration endpoint that creates both user and wedding
        const response = await fetch('/api/get-started', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            weddingDate: data.weddingDate.toISOString(),
            weddingTime: data.weddingTime || "18:00"
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create account and wedding website');
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Registration and wedding creation error:', error);
        throw error;
      }
    },
    onSuccess: ({ wedding }) => {
      toast({
        title: "Welcome to LoveStory!",
        description: "Your account and wedding website have been created successfully!",
      });
      setLocation(`/wedding/${wedding.uniqueUrl}`);
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GetStartedFormData) => {
    console.log('Form submitted, current step:', currentStep);
    console.log('Form data:', data);
    console.log('Form errors:', form.formState.errors);
    
    if (currentStep < totalSteps) {
      nextStep();
    } else {
      createUserAndWedding.mutate(data);
    }
  };

  const handleNextStep = async () => {
    // Validate only the current step's required fields
    let fieldsToValidate: (keyof GetStartedFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'email', 'password', 'confirmPassword'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['bride', 'groom', 'weddingDate'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['venue', 'venueAddress'];
    }
    
    const isValid = await form.trigger(fieldsToValidate);
    console.log('Validation result for step', currentStep, ':', isValid);
    
    if (isValid) {
      nextStep();
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTemplateName = (template: any) => {
    if (i18n.language === 'uz') return template.nameUz;
    if (i18n.language === 'ru') return template.nameRu;
    return template.name;
  };

  if (createUserAndWedding.isPending) {
    return <CreateWeddingLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-sage/10 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-charcoal mb-4">
            {t('getStarted.title')}
          </h1>
          <p className="text-lg text-charcoal/70 max-w-2xl mx-auto">
            {t('getStarted.subtitle')}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step <= currentStep
                      ? "bg-gold text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-12 h-0.5 mx-2 transition-all ${
                      step < currentStep ? "bg-gold" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Account Creation */}
            {currentStep === 1 && (
              <Card className="wedding-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-playfair font-bold text-charcoal flex items-center justify-center gap-2">
                    <User className="text-gold" />
                    {t('getStarted.createAccount')}
                  </CardTitle>
                  <p className="text-charcoal/70">
                    {t('getStarted.createAccountDesc')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-charcoal font-semibold">
                          {t('getStarted.fullName')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('getStarted.fullNamePlaceholder')}
                            className="wedding-input"
                            {...field}
                          />
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
                        <FormLabel className="text-charcoal font-semibold">
                          {t('getStarted.emailAddress')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t('getStarted.emailPlaceholder')}
                            className="wedding-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-charcoal font-semibold">
                          {t('getStarted.password')}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder={t('getStarted.passwordPlaceholder')}
                              className="wedding-input pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
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
                        <FormLabel className="text-charcoal font-semibold">
                          {t('getStarted.confirmPassword')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('getStarted.confirmPasswordPlaceholder')}
                            className="wedding-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Couple Information */}
            {currentStep === 2 && (
              <Card className="wedding-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-playfair font-bold text-charcoal flex items-center justify-center gap-2">
                    <Heart className="text-gold" />
                    About Your Wedding
                  </CardTitle>
                  <p className="text-charcoal/70">
                    Tell us about the happy couple
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bride"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-semibold">
                            Bride's Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter bride's name"
                              className="wedding-input"
                              {...field}
                            />
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
                          <FormLabel className="text-charcoal font-semibold">
                            {t('getStarted.groomName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('getStarted.groomNamePlaceholder')}
                              className="wedding-input"
                              {...field}
                            />
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
                        <FormLabel className="text-charcoal font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gold" />
                          {t('getStarted.weddingDate')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="wedding-input"
                            value={formatDateForInput(field.value)}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weddingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-charcoal font-semibold">
                          {t('getStarted.ceremonyTime')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('getStarted.ceremonyTimePlaceholder')}
                            className="wedding-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 3: Venue Information */}
            {currentStep === 3 && (
              <Card className="wedding-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-playfair font-bold text-charcoal flex items-center justify-center gap-2">
                    <MapPin className="text-gold" />
                    {t('getStarted.venueDetails')}
                  </CardTitle>
                  <p className="text-charcoal/70">
                    {t('getStarted.venueDetailsDesc')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-charcoal font-semibold">
                          Venue Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Grand Ballroom, Garden Manor"
                            className="wedding-input"
                            {...field}
                          />
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
                        <FormLabel className="text-charcoal font-semibold">
                          Venue Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full address of the venue"
                            className="wedding-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="story"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-charcoal font-semibold">
                          Your Love Story (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your beautiful love story with your guests..."
                            className="wedding-input min-h-[120px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 4: Template Selection */}
            {currentStep === 4 && (
              <Card className="wedding-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-playfair font-bold text-charcoal flex items-center justify-center gap-2">
                    <Camera className="text-gold" />
                    Choose Your Style
                  </CardTitle>
                  <p className="text-charcoal/70">
                    Select a beautiful template for your wedding website
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-charcoal font-semibold">
                          Website Template
                        </FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {templateOptions.map((template) => (
                            <div
                              key={template.id}
                              className={`relative rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                                field.value === template.id
                                  ? "border-gold shadow-lg"
                                  : "border-gray-200 hover:border-sage"
                              }`}
                              onClick={() => {
                                console.log('Template clicked:', template.id);
                                field.onChange(template.id);
                                console.log('Field value after change:', field.value);
                              }}
                            >
                              <img
                                src={template.image}
                                alt={getTemplateName(template)}
                                className="w-full h-32 object-cover rounded-t-lg"
                              />
                              <div className="p-3">
                                <h3 className="font-semibold text-charcoal">
                                  {getTemplateName(template)}
                                </h3>
                              </div>
                              {field.value === template.id && (
                                <div className="absolute top-2 right-2 bg-gold text-white rounded-full p-1">
                                  <Heart className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-sage/20 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-semibold text-charcoal">
                            Make Website Public
                          </FormLabel>
                          <p className="text-sm text-charcoal/70">
                            Allow your website to be discovered by others
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
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="wedding-button-outline"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-charcoal/60">
                Step {currentStep} of {totalSteps}
              </div>

              {currentStep === totalSteps ? (
                <Button
                  type="submit"
                  className="wedding-button"
                  disabled={createUserAndWedding.isPending}
                >
                  {createUserAndWedding.isPending ? "Creating..." : "Create My Website"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="wedding-button"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
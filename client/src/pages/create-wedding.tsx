import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertWeddingSchema, type InsertWedding } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatDateForInput } from "@/lib/utils";
import { Heart, Calendar, MapPin, Camera, Music, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { CreateWeddingLoading } from "@/components/ui/loading";

const createWeddingSchema = insertWeddingSchema.extend({
  weddingDate: insertWeddingSchema.shape.weddingDate
    .transform((val) => typeof val === 'string' ? new Date(val) : val)
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, {
      message: "Wedding date must be today or in the future",
    }),
  weddingTime: insertWeddingSchema.shape.weddingTime.optional().default("18:00"),
});

type CreateWeddingFormData = InsertWedding & {
  weddingDate: Date;
  weddingTime?: string;
};

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
    id: "gul",
    name: "Gul",
    nameUz: "Gul",
    nameRu: "Гуль",
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
  {
    id: "classicTradition",
    name: "Classic Tradition",
    nameUz: "Klassik an'ana",
    nameRu: "Классическая традиция",
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=300&fit=crop"
  },
  {
    id: "bohoChic",
    name: "Boho Chic",
    nameUz: "Boho chik",
    nameRu: "Бохо шик",
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&h=300&fit=crop"
  },
  {
    id: "standard",
    name: "Standard",
    nameUz: "Standart",
    nameRu: "Стандартный",
    image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop"
  },
];

export default function CreateWedding() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<CreateWeddingFormData>({
    resolver: zodResolver(createWeddingSchema),
    defaultValues: {
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

  const createWedding = useMutation({
    mutationFn: async (data: CreateWeddingFormData) => {
      try {
        // Check if user is logged in
        const currentUserId = localStorage.getItem('currentUserId');
        if (!currentUserId) {
          throw new Error('Please register or login to create a wedding website');
        }

        // Check if user has paid subscription first
        const userResponse = await fetch(`/api/users/${currentUserId}`);
        if (!userResponse.ok) {
          throw new Error('Failed to verify user status');
        }
        
        const user = await userResponse.json();
        if (!user.hasPaidSubscription && !user.isAdmin) {
          // Redirect to payment page
          setLocation('/payment');
          return;
        }
        
        // Create wedding for registered user
        const weddingData = { 
          userId: parseInt(currentUserId),
          bride: data.bride,
          groom: data.groom,
          weddingDate: data.weddingDate.toISOString(),
          weddingTime: data.weddingTime || "18:00",
          venue: data.venue,
          venueAddress: data.venueAddress,
          story: data.story || "",
          template: data.template,
          primaryColor: data.primaryColor,
          accentColor: data.accentColor,
          isPublic: data.isPublic
        };
        
        console.log('Sending wedding data:', weddingData);
        
        const weddingResponse = await fetch('/api/weddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(weddingData)
        });
        
        console.log('Wedding response status:', weddingResponse.status);
        
        if (!weddingResponse.ok) {
          const errorText = await weddingResponse.text();
          console.error('Wedding creation failed:', errorText);
          throw new Error(`Failed to create wedding: ${errorText}`);
        }
        
        const result = await weddingResponse.json();
        console.log('Wedding created successfully:', result);
        return result;
      } catch (error) {
        console.error('Wedding creation error:', error);
        throw error;
      }
    },
    onSuccess: (wedding) => {
      toast({
        title: t('createWedding.success'),
        description: t('createWedding.successDescription'),
      });
      // Store user ID for dashboard access
      localStorage.setItem('currentUserId', wedding.userId.toString());
      // Redirect to the wedding site
      setTimeout(() => {
        setLocation(`/wedding/${wedding.uniqueUrl}`);
      }, 1000);
    },
    onError: () => {
      toast({
        title: t('createWedding.error'),
        description: t('createWedding.errorDescription'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateWeddingFormData) => {
    if (currentStep < totalSteps) {
      nextStep();
    } else {
      createWedding.mutate(data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-sage/10 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-charcoal mb-4">
            {t('createWedding.title')}
          </h1>
          <p className="text-lg text-charcoal/70 max-w-2xl mx-auto">
            {t('createWedding.subtitle')}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
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
                {step < 3 && (
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
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card className="wedding-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-playfair font-bold text-charcoal flex items-center justify-center gap-2">
                    <Heart className="text-gold" />
                    {t('createWedding.basicInfo')}
                  </CardTitle>
                  <p className="text-charcoal/70">
                    {t('createWedding.basicInfoDescription')}
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
                            {t('createWedding.brideName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('createWedding.brideNamePlaceholder')}
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
                            {t('createWedding.groomName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('createWedding.groomNamePlaceholder')}
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
                          {t('createWedding.weddingDate')}
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

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="weddingTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-semibold">
                            {t('createWedding.ceremonyTime')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('createWedding.ceremonyTimePlaceholder')}
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
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-charcoal font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gold" />
                          {t('createWedding.venue')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('createWedding.venuePlaceholder')}
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
                          {t('createWedding.venueAddress')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('createWedding.venueAddressPlaceholder')}
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

            {/* Step 2: Story & Details */}
            {currentStep === 2 && (
              <Card className="wedding-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-playfair font-bold text-charcoal flex items-center justify-center gap-2">
                    <Camera className="text-gold" />
                    {t('createWedding.storyDetails')}
                  </CardTitle>
                  <p className="text-charcoal/70">
                    {t('createWedding.storyDetailsDescription')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="story"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-charcoal font-semibold">
                          {t('createWedding.loveStory')}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('createWedding.loveStoryPlaceholder')}
                            className="wedding-input min-h-[120px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="backgroundMusicUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-charcoal font-semibold flex items-center gap-2">
                          <Music className="w-4 h-4 text-gold" />
                          {t('createWedding.backgroundMusic')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('createWedding.backgroundMusicPlaceholder')}
                            className="wedding-input"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
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
                            {t('createWedding.makePublic')}
                          </FormLabel>
                          <p className="text-sm text-charcoal/70">
                            {t('createWedding.makePublicDescription')}
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

            {/* Step 3: Design & Template */}
            {currentStep === 3 && (
              <Card className="wedding-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-playfair font-bold text-charcoal flex items-center justify-center gap-2">
                    <Palette className="text-gold" />
                    {t('createWedding.designTemplate')}
                  </CardTitle>
                  <p className="text-charcoal/70">
                    {t('createWedding.designTemplateDescription')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <FormField
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold text-charcoal">
                          {t('createWedding.chooseTemplate')}
                        </FormLabel>
                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                          {templateOptions.map((template) => (
                            <div
                              key={template.id}
                              className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                                field.value === template.id
                                  ? "ring-4 ring-gold shadow-2xl"
                                  : "ring-2 ring-gray-200 hover:ring-gold/50"
                              }`}
                              onClick={() => {
                                console.log('Template clicked:', template.id);
                                field.onChange(template.id);
                                form.setValue('template', template.id);
                                console.log('Field value after change:', template.id);
                              }}
                            >
                              <img
                                src={template.image}
                                alt={getTemplateName(template)}
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-white font-semibold text-lg">
                                  {getTemplateName(template)}
                                </h3>
                                {field.value === template.id && (
                                  <Badge className="mt-2 bg-gold hover:bg-gold/90">
                                    {t('createWedding.selected')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-semibold">
                            {t('createWedding.primaryColor')}
                          </FormLabel>
                          <div className="flex items-center space-x-3">
                            <FormControl>
                              <Input type="color" className="w-12 h-12 rounded-lg border" {...field} />
                            </FormControl>
                            <FormControl>
                              <Input placeholder="#D4B08C" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-charcoal font-semibold">
                            {t('createWedding.accentColor')}
                          </FormLabel>
                          <div className="flex items-center space-x-3">
                            <FormControl>
                              <Input type="color" className="w-12 h-12 rounded-lg border" {...field} />
                            </FormControl>
                            <FormControl>
                              <Input placeholder="#89916B" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('createWedding.previous')}
              </Button>

              <div className="text-center">
                <p className="text-sm text-charcoal/60">
                  {t('createWedding.step')} {currentStep} {t('createWedding.of')} {totalSteps}
                </p>
              </div>

              <Button
                type="submit"
                disabled={createWedding.isPending}
                className="wedding-button flex items-center gap-2"
              >
                {currentStep === totalSteps ? (
                  <>
                    {createWedding.isPending ? t('createWedding.creating') : t('createWedding.createWebsite')}
                    <Heart className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    {t('createWedding.next')}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

          </form>
        </Form>

        {/* Loading overlay when creating wedding */}
        {createWedding.isPending && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 m-4 max-w-md w-full">
              <CreateWeddingLoading />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
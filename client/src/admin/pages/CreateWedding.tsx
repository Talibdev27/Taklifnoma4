import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
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
import { isFreeTemplate, isPremiumTemplate } from "@/lib/template-tiers";
import { z } from "zod";

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
}).partial().required({
  bride: true,
  groom: true,
  weddingDate: true,
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
  {
    id: "modern",
    name: "Modern",
    nameUz: "Zamonaviy",
    nameRu: "Современный",
    image: "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=400&h=300&fit=crop"
  },
  {
    id: "velvet",
    name: "Velvet",
    nameUz: "Baxmali",
    nameRu: "Бархат",
    image: "/new2.jpg"
  },
];

export default function CreateWedding() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [musicFileName, setMusicFileName] = useState<string>("");

  const form = useForm<CreateWeddingFormData>({
    // No resolver for multi-step form - validate manually in onSubmit
    mode: "onChange",
    defaultValues: {
      bride: "",
      groom: "",
      weddingDate: new Date(),
      weddingTime: "18:00",
      venue: "",
      venueAddress: "",
      template: "gardenRomance",
      primaryColor: "#D4AF76",
      accentColor: "#7A1E3E",
      story: "",
      backgroundMusicUrl: "",
      isPublic: true,
    },
  });

  const createWedding = useMutation({
    mutationFn: async (data: CreateWeddingFormData) => {
      try {
        // Get current user from API using auth token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Please register or login to create a wedding website');
        }

        const currentUserResponse = await fetch('/api/user/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!currentUserResponse.ok) {
          throw new Error('Please register or login to create a wedding website');
        }

        const currentUser = await currentUserResponse.json();
        console.log('Current user:', currentUser);

        // Check if template requires payment
        const templateRequiresPayment = isPremiumTemplate(data.template || 'gardenRomance');
        
        // Only require payment for premium templates (unless user has paid subscription or is admin)
        if (templateRequiresPayment && !currentUser.hasPaidSubscription && !currentUser.isAdmin) {
          // Redirect to payment page for premium templates
          setLocation('/payment');
          return;
        }
        
        // Free templates can be created without payment
        
        // Create wedding for registered user
        const weddingData = { 
          userId: currentUser.id,
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
          isPublic: data.isPublic,
          backgroundMusicUrl: data.backgroundMusicUrl || "",
        };
        
        console.log('Sending wedding data:', weddingData);
        
        const weddingResponse = await fetch('/api/weddings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
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

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mp4'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Xato",
        description: "Faqat audio fayllar qabul qilinadi (MP3, WAV, OGG, M4A, AAC)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Xato",
        description: "Fayl hajmi 10MB dan oshmasligi kerak",
        variant: "destructive",
      });
      return;
    }

    setUploadingMusic(true);
    setMusicFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('music', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/wedding-music', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload music');
      }

      const data = await response.json();
      
      // Update form with the uploaded music URL
      form.setValue('backgroundMusicUrl', data.url);
      
      toast({
        title: "Muvaffaqiyat!",
        description: "Fon musiqasi yuklandi",
      });
    } catch (error) {
      console.error('Music upload error:', error);
      toast({
        title: "Xato",
        description: "Fon musiqasini yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
      setMusicFileName("");
    } finally {
      setUploadingMusic(false);
    }
  };

  const onSubmit = async (data: CreateWeddingFormData) => {
    console.log('Form submitted, current step:', currentStep);
    console.log('Form data:', data);
    
    if (currentStep < totalSteps) {
      // Validate required fields for current step
      if (currentStep === 1) {
        if (!data.bride?.trim() || !data.groom?.trim()) {
          toast({
            title: t('createWedding.error'),
            description: "Kelin va kuyov ismlarini to'ldiring",
            variant: "destructive",
          });
          return;
        }
        if (!data.weddingDate) {
          toast({
            title: t('createWedding.error'),
            description: "To'y sanasini tanlang",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Move to next step
      console.log('Moving to next step...');
      nextStep();
    } else {
      // Final step - validate and create the wedding
      console.log('Final step - validating and creating wedding...');
      
      // Final validation
      if (!data.bride?.trim() || !data.groom?.trim()) {
        toast({
          title: t('createWedding.error'),
          description: "Kelin va kuyov ismlarini to'ldiring",
          variant: "destructive",
        });
        return;
      }
      
      // Ensure template is selected
      if (!data.template) {
        data.template = "gardenRomance";
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-taklif-cream via-white to-taklif-gold/10">
      {/* Top Navigation */}
      <div className="w-full bg-white/80 backdrop-blur-sm border-b border-taklif-gold/10 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img 
              src="/takliflinklogo.jpg" 
              alt="Taklif Link" 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full shadow-md"
            />
            <h1 className="text-lg sm:text-2xl font-playfair font-bold text-taklif-burgundy">
              Taklif Link
            </h1>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-playfair font-bold text-taklif-navy mb-2 sm:mb-4">
            {t('createWedding.title')}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-taklif-navy/70 max-w-2xl mx-auto px-4">
            {t('createWedding.subtitle')}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                    step <= currentStep
                      ? "bg-taklif-gold text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-all ${
                      step < currentStep ? "bg-taklif-gold" : "bg-gray-200"
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
                  <CardTitle className="text-xl sm:text-2xl font-playfair font-bold text-taklif-navy flex items-center justify-center gap-2">
                    <Heart className="text-taklif-gold" />
                    {t('createWedding.basicInfo')}
                  </CardTitle>
                  <p className="text-sm sm:text-base text-taklif-navy/70">
                    {t('createWedding.basicInfoDescription')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bride"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-taklif-navy font-semibold">
                            {t('createWedding.brideName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('createWedding.brideNamePlaceholder')}
                              className="wedding-input border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30"
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
                          <FormLabel className="text-taklif-navy font-semibold">
                            {t('createWedding.groomName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('createWedding.groomNamePlaceholder')}
                              className="wedding-input border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30"
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
                        <FormLabel className="text-taklif-navy font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-taklif-gold" />
                          {t('createWedding.weddingDate')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="wedding-input border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30"
                            value={formatDateForInput(field.value)}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="weddingTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-taklif-navy font-semibold">
                            {t('createWedding.ceremonyTime')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('createWedding.ceremonyTimePlaceholder')}
                              className="wedding-input border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30"
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
                        <FormLabel className="text-taklif-navy font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-taklif-gold" />
                          {t('createWedding.venue')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('createWedding.venuePlaceholder')}
                            className="wedding-input border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30"
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
                        <FormLabel className="text-taklif-navy font-semibold">
                          {t('createWedding.venueAddress')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('createWedding.venueAddressPlaceholder')}
                            className="wedding-input border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30"
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
                  <CardTitle className="text-xl sm:text-2xl font-playfair font-bold text-taklif-navy flex items-center justify-center gap-2">
                    <Camera className="text-taklif-gold" />
                    {t('createWedding.storyDetails')}
                  </CardTitle>
                  <p className="text-sm sm:text-base text-taklif-navy/70">
                    {t('createWedding.storyDetailsDescription')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="story"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-taklif-navy font-semibold">
                          {t('createWedding.loveStory')}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('createWedding.loveStoryPlaceholder')}
                            className="wedding-input border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30 min-h-[100px] sm:min-h-[120px]"
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
                        <FormLabel className="text-taklif-navy font-semibold flex items-center gap-2">
                          <Music className="w-4 h-4 text-taklif-gold" />
                          {t('createWedding.backgroundMusic')}
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/aac,audio/mp4"
                              onChange={handleMusicUpload}
                              disabled={uploadingMusic}
                              className="wedding-input border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-taklif-gold file:text-white hover:file:bg-taklif-gold/90 file:cursor-pointer"
                            />
                            {uploadingMusic && (
                              <div className="flex items-center gap-2 text-sm text-taklif-navy/70">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-taklif-gold"></div>
                                <span>Yuklanmoqda...</span>
                              </div>
                            )}
                            {musicFileName && !uploadingMusic && (
                              <div className="flex items-center gap-2 text-sm text-taklif-navy/70">
                                <Music className="w-4 h-4 text-taklif-gold" />
                                <span className="truncate">{musicFileName}</span>
                              </div>
                            )}
                            {field.value && (
                              <audio controls className="w-full mt-2">
                                <source src={field.value} type="audio/mpeg" />
                                Brauzeringiz audio elementni qo'llab-quvvatlamaydi.
                              </audio>
                            )}
                          </div>
                        </FormControl>
                        <p className="text-xs text-taklif-navy/60">
                          MP3, WAV, OGG, M4A, AAC (10MB gacha)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-taklif-gold/20 p-4">
                        <div className="space-y-0.5 flex-1 pr-4">
                          <FormLabel className="text-sm sm:text-base font-semibold text-taklif-navy">
                            {t('createWedding.makePublic')}
                          </FormLabel>
                          <p className="text-xs sm:text-sm text-taklif-navy/70">
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
                  <CardTitle className="text-xl sm:text-2xl font-playfair font-bold text-taklif-navy flex items-center justify-center gap-2">
                    <Palette className="text-taklif-gold" />
                    {t('createWedding.designTemplate')}
                  </CardTitle>
                  <p className="text-sm sm:text-base text-taklif-navy/70">
                    {t('createWedding.designTemplateDescription')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <FormField
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base sm:text-lg font-semibold text-taklif-navy">
                          {t('createWedding.chooseTemplate')}
                        </FormLabel>
                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
                          {templateOptions.map((template) => (
                            <div
                              key={template.id}
                              className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 touch-manipulation ${
                                field.value === template.id
                                  ? "ring-4 ring-taklif-gold shadow-2xl"
                                  : "ring-2 ring-gray-200 hover:ring-taklif-gold/50"
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
                                className="w-full h-40 sm:h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute top-2 right-2">
                                {isFreeTemplate(template.id) ? (
                                  <Badge className="bg-taklif-gold hover:bg-taklif-gold/90 text-gray-900">
                                    {t('templates.freeTemplate')}
                                  </Badge>
                                ) : isPremiumTemplate(template.id) ? (
                                  <Badge className="bg-taklif-navy hover:bg-taklif-navy/90 text-white">
                                    {t('templates.premiumTemplate')}
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-white font-semibold text-base sm:text-lg truncate">
                                  {getTemplateName(template)}
                                </h3>
                                {field.value === template.id && (
                                  <Badge className="mt-2 bg-taklif-gold hover:bg-taklif-gold/90">
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

                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-taklif-navy font-semibold">
                            {t('createWedding.primaryColor')}
                          </FormLabel>
                          <div className="flex items-center space-x-3">
                            <FormControl>
                              <Input type="color" className="w-12 h-12 rounded-lg border border-taklif-gold/20" {...field} />
                            </FormControl>
                            <FormControl>
                              <Input placeholder="#D4AF76" {...field} className="border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30" />
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
                          <FormLabel className="text-taklif-navy font-semibold">
                            {t('createWedding.accentColor')}
                          </FormLabel>
                          <div className="flex items-center space-x-3">
                            <FormControl>
                              <Input type="color" className="w-12 h-12 rounded-lg border border-taklif-gold/20" {...field} />
                            </FormControl>
                            <FormControl>
                              <Input placeholder="#7A1E3E" {...field} className="border-taklif-gold/20 focus:border-taklif-gold focus:ring-taklif-gold/30" />
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
            <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center justify-center gap-2 border-taklif-gold/30 text-taklif-navy hover:bg-taklif-gold/10 order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('createWedding.previous')}</span>
                <span className="sm:hidden">Previous</span>
              </Button>

              <div className="text-center order-1 sm:order-2">
                <p className="text-xs sm:text-sm text-taklif-navy/60 font-medium">
                  {t('createWedding.step')} {currentStep} {t('createWedding.of')} {totalSteps}
                </p>
              </div>

              <Button
                type="submit"
                disabled={createWedding.isPending}
                className="bg-taklif-burgundy hover:bg-taklif-burgundy/90 text-white flex items-center justify-center gap-2 order-3"
              >
                {currentStep === totalSteps ? (
                  <>
                    <span className="hidden sm:inline">{createWedding.isPending ? t('createWedding.creating') : t('createWedding.createWebsite')}</span>
                    <span className="sm:hidden">{createWedding.isPending ? 'Creating...' : 'Create'}</span>
                    <Heart className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">{t('createWedding.next')}</span>
                    <span className="sm:hidden">Next</span>
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
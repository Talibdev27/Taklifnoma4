import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image, Eye, Save, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Wedding } from '@shared/schema';

interface StandardTemplateSettingsProps {
  wedding: Wedding;
}

const BACKGROUND_TEMPLATES = [
  {
    id: 'template1',
    nameKey: 'templateSettings.bg.gardenRomance',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    descKey: 'templateSettings.bg.gardenRomanceDesc'
  },
  {
    id: 'template2',
    nameKey: 'templateSettings.bg.classicElegance',
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    descKey: 'templateSettings.bg.classicEleganceDesc'
  },
  {
    id: 'template3',
    nameKey: 'templateSettings.bg.beachBliss',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    descKey: 'templateSettings.bg.beachBlissDesc'
  },
  {
    id: 'template4',
    nameKey: 'templateSettings.bg.rusticCharm',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    descKey: 'templateSettings.bg.rusticCharmDesc'
  },
  {
    id: 'template5',
    nameKey: 'templateSettings.bg.modernLuxury',
    image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    descKey: 'templateSettings.bg.modernLuxuryDesc'
  },
  {
    id: 'template6',
    nameKey: 'templateSettings.bg.vintageRomance',
    image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    descKey: 'templateSettings.bg.vintageRomanceDesc'
  }
];

export function StandardTemplateSettings({ wedding }: StandardTemplateSettingsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dearGuestMessage, setDearGuestMessage] = useState(wedding.dearGuestMessage || '');
  const [backgroundType, setBackgroundType] = useState<'custom' | 'template'>(
    wedding.couplePhotoUrl ? 'custom' : 'template'
  );
  const [selectedTemplate, setSelectedTemplate] = useState(wedding.backgroundTemplate || 'template1');
  const [couplePhotoFile, setCouplePhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(wedding.couplePhotoUrl || null);

  // Update wedding settings mutation
  const updateWeddingMutation = useMutation({
    mutationFn: (data: Partial<Wedding>) =>
      apiRequest(`/api/weddings/${wedding.id}`, 'PUT', data),
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('templateSettings.updateSuccess'),
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/weddings', wedding.id]
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('templateSettings.updateError'),
        variant: 'destructive',
      });
    },
  });

  // Upload couple photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch(`/api/weddings/${wedding.id}/photos`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(t('templateSettings.uploadError'));
      }
      
      return response.json();
    },
    onSuccess: (photo) => {
      const photoUrl = photo.url;
      setPreviewUrl(photoUrl);
      
      // Update wedding with couple photo URL
      updateWeddingMutation.mutate({
        couplePhotoUrl: photoUrl,
        backgroundTemplate: selectedTemplate
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: t('templateSettings.uploadPhotoError'),
        variant: 'destructive',
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCouplePhotoFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Auto-upload the file
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleSaveSettings = () => {
    const updateData: Partial<Wedding> = {
      dearGuestMessage,
      backgroundTemplate: selectedTemplate,
    };

    // If using template background, clear couple photo
    if (backgroundType === 'template') {
      updateData.couplePhotoUrl = null;
    }

    updateWeddingMutation.mutate(updateData);
  };

  const hasChanges = () => {
    return (
      dearGuestMessage !== (wedding.dearGuestMessage || '') ||
      selectedTemplate !== (wedding.backgroundTemplate || 'template1') ||
      (backgroundType === 'custom' && couplePhotoFile !== null)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {t('templateSettings.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('templateSettings.subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="background" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="background">{t('templateSettings.tabBackground')}</TabsTrigger>
            <TabsTrigger value="message">{t('templateSettings.tabMessage')}</TabsTrigger>
          </TabsList>

          <TabsContent value="background" className="space-y-6">
            {/* Background Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('templateSettings.backgroundOption')}</Label>
              <RadioGroup
                value={backgroundType}
                onValueChange={(value) => setBackgroundType(value as 'custom' | 'template')}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer">
                    {t('templateSettings.uploadOwnPhoto')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="template" id="template" />
                  <Label htmlFor="template" className="cursor-pointer">
                    {t('templateSettings.choosePredesigned')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Custom Photo Upload */}
            {backgroundType === 'custom' && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">{t('templateSettings.uploadCouplePhoto')}</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt={t('templateSettings.couplePhotoPreviewAlt')}
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-sm text-muted-foreground">
                        {t('templateSettings.currentCouplePhoto')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-base font-medium">{t('templateSettings.uploadCouplePhotoTitle')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('templateSettings.uploadCouplePhotoHint')}
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="couple-photo-upload"
                  />
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById('couple-photo-upload')?.click()}
                    disabled={uploadPhotoMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadPhotoMutation.isPending ? t('message.saving') : t('templateSettings.choosePhoto')}
                  </Button>
                </div>
              </div>
            )}

            {/* Template Selection */}
            {backgroundType === 'template' && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">{t('templateSettings.chooseBackgroundTemplate')}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {BACKGROUND_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedTemplate === template.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <img
                        src={template.image}
                        alt={t(template.nameKey)}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="font-medium text-sm">{t(template.nameKey)}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t(template.descKey)}
                        </p>
                      </div>
                      {selectedTemplate === template.id && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-primary text-primary-foreground">
                            {t('templateSettings.selected')}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="message" className="space-y-6">
            {/* Dear Guest Message */}
            <div className="space-y-4">
              <Label htmlFor="dear-guest-message" className="text-base font-semibold">
                {t('templateSettings.dearGuestMessage')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('templateSettings.dearGuestMessageDesc')}
              </p>
              <Textarea
                id="dear-guest-message"
                placeholder={t('templateSettings.dearGuestMessagePlaceholder')}
                value={dearGuestMessage}
                onChange={(e) => setDearGuestMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {t('templateSettings.dearGuestMessageHint')}
              </p>
            </div>

            {/* Preview */}
            {dearGuestMessage && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">{t('templateSettings.preview')}</Label>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">{t('wedding.dearGuests')}</h4>
                  <div className="prose prose-sm">
                    {dearGuestMessage.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 text-sm font-medium text-primary">
                    {wedding.bride} & {wedding.groom}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-6 border-t mt-6">
          <Button 
            onClick={handleSaveSettings}
            disabled={!hasChanges() || updateWeddingMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateWeddingMutation.isPending ? t('message.saving') : t('templateSettings.saveSettings')}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(`/wedding/${wedding.uniqueUrl}`, '_blank')}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {t('templateSettings.previewWebsite')}
          </Button>
        </div>

        {hasChanges() && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {t('templateSettings.unsavedChanges')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
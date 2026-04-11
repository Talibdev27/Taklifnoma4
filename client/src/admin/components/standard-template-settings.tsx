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
    name: 'Garden Romance',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    description: 'Beautiful outdoor garden setting'
  },
  {
    id: 'template2',
    name: 'Classic Elegance',
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    description: 'Timeless indoor celebration'
  },
  {
    id: 'template3',
    name: 'Beach Bliss',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    description: 'Coastal wedding vibes'
  },
  {
    id: 'template4',
    name: 'Rustic Charm',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    description: 'Country-style celebration'
  },
  {
    id: 'template5',
    name: 'Modern Luxury',
    image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    description: 'Contemporary sophistication'
  },
  {
    id: 'template6',
    name: 'Vintage Romance',
    image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    description: 'Classic vintage appeal'
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
        description: 'Template settings updated successfully',
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/weddings', wedding.id]
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to update template settings',
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
        throw new Error('Failed to upload photo');
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
        description: 'Failed to upload couple photo',
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
          Standard Template Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customize your standard template with background options and dear guest message.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="background" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="background">Background & Photo</TabsTrigger>
            <TabsTrigger value="message">Dear Guest Message</TabsTrigger>
          </TabsList>

          <TabsContent value="background" className="space-y-6">
            {/* Background Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Background Option</Label>
              <RadioGroup
                value={backgroundType}
                onValueChange={(value) => setBackgroundType(value as 'custom' | 'template')}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer">
                    Upload your own couple photo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="template" id="template" />
                  <Label htmlFor="template" className="cursor-pointer">
                    Choose from pre-designed backgrounds
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Custom Photo Upload */}
            {backgroundType === 'custom' && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Upload Couple Photo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Couple photo preview"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-sm text-muted-foreground">
                        Current couple photo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-base font-medium">Upload your couple photo</p>
                        <p className="text-sm text-muted-foreground">
                          This will be the main background image for your wedding website
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
                    {uploadPhotoMutation.isPending ? 'Uploading...' : 'Choose Photo'}
                  </Button>
                </div>
              </div>
            )}

            {/* Template Selection */}
            {backgroundType === 'template' && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Choose Background Template</Label>
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
                        alt={template.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      {selectedTemplate === template.id && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-primary text-primary-foreground">
                            Selected
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
                Dear Guest Message
              </Label>
              <p className="text-sm text-muted-foreground">
                Write a personal message to welcome your guests to your wedding website.
              </p>
              <Textarea
                id="dear-guest-message"
                placeholder="Write your heartfelt message to guests here..."
                value={dearGuestMessage}
                onChange={(e) => setDearGuestMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This message will appear in the "Dear Guests" section of your wedding website.
              </p>
            </div>

            {/* Preview */}
            {dearGuestMessage && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Preview</Label>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Dear Guests</h4>
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
            {updateWeddingMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open(`/wedding/${wedding.uniqueUrl}`, '_blank')}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Website
          </Button>
        </div>

        {hasChanges() && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              You have unsaved changes. Click "Save Settings" to apply them.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
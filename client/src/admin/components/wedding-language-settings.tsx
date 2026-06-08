import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Languages, Eye, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Wedding } from '@shared/schema';

interface WeddingLanguageSettingsProps {
  wedding: Wedding;
}

const SUPPORTED_LANGUAGES = [
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'kaa', name: 'Қарақалпақша', flag: '🇺🇿' }
];

export function WeddingLanguageSettings({ wedding }: WeddingLanguageSettingsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    wedding.availableLanguages || ['uz']
  );
  const [defaultLanguage, setDefaultLanguage] = useState<string>(
    wedding.defaultLanguage || 'uz'
  );

  // Fetch current language settings
  const { data: languageSettings, isLoading } = useQuery({
    queryKey: ['/api/weddings', wedding.id, 'languages'],
    queryFn: () => fetch(`/api/weddings/${wedding.id}/languages`).then(res => res.json()),
  });

  // Update language settings mutation
  const updateLanguagesMutation = useMutation({
    mutationFn: (data: { availableLanguages: string[]; defaultLanguage: string }) =>
      apiRequest('PUT', `/api/weddings/${wedding.id}/languages`, data),
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('languageSettings.updateSuccess'),
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/weddings', wedding.id]
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/weddings', wedding.id, 'languages']
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('languageSettings.updateError'),
        variant: 'destructive',
      });
    },
  });

  const handleLanguageToggle = (langCode: string, checked: boolean) => {
    if (checked) {
      setSelectedLanguages(prev => [...prev, langCode]);
    } else {
      if (selectedLanguages.length <= 1) {
        toast({
          title: t('common.error'),
          description: t('languageSettings.atLeastOneRequired'),
          variant: 'destructive',
        });
        return;
      }
      setSelectedLanguages(prev => prev.filter(lang => lang !== langCode));
      
      // If removing the default language, set a new default
      if (langCode === defaultLanguage) {
        const remainingLanguages = selectedLanguages.filter(lang => lang !== langCode);
        setDefaultLanguage(remainingLanguages[0]);
      }
    }
  };

  const handleDefaultLanguageChange = (langCode: string) => {
    if (!selectedLanguages.includes(langCode)) {
      toast({
        title: t('common.error'),
        description: t('languageSettings.defaultMustBeAvailable'),
        variant: 'destructive',
      });
      return;
    }
    setDefaultLanguage(langCode);
  };

  const handleSave = () => {
    if (selectedLanguages.length === 0) {
      toast({
        title: t('common.error'),
        description: t('languageSettings.atLeastOneRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (!selectedLanguages.includes(defaultLanguage)) {
      toast({
        title: t('common.error'),
        description: t('languageSettings.defaultMustBeAvailable'),
        variant: 'destructive',
      });
      return;
    }

    updateLanguagesMutation.mutate({
      availableLanguages: selectedLanguages,
      defaultLanguage: defaultLanguage
    });
  };

  const hasChanges = () => {
    const currentSettings = languageSettings || { availableLanguages: ['en'], defaultLanguage: 'en' };
    return (
      JSON.stringify(selectedLanguages.sort()) !== JSON.stringify(currentSettings.availableLanguages?.sort() || ['en']) ||
      defaultLanguage !== currentSettings.defaultLanguage
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('languageSettings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          {t('languageSettings.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('languageSettings.subtitle')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Languages Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold mb-2">{t('languageSettings.availableLanguages')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('languageSettings.availableLanguagesDesc')}
            </p>
          </div>
          
          <div className="grid gap-4">
            {SUPPORTED_LANGUAGES.map((language) => (
              <div key={language.code} className="flex items-center space-x-3">
                <Checkbox
                  id={`lang-${language.code}`}
                  checked={selectedLanguages.includes(language.code)}
                  onCheckedChange={(checked) => 
                    handleLanguageToggle(language.code, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`lang-${language.code}`}
                  className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                >
                  <span className="text-lg">{language.flag}</span>
                  {language.name}
                  {defaultLanguage === language.code && (
                    <Badge variant="secondary" className="text-xs">
                      {t('languageSettings.default')}
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Default Language Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold mb-2">{t('languageSettings.defaultLanguage')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('languageSettings.defaultLanguageDesc')}
            </p>
          </div>
          
          <Select value={defaultLanguage} onValueChange={handleDefaultLanguageChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('languageSettings.selectDefaultPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES
                .filter(lang => selectedLanguages.includes(lang.code))
                .map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span>{language.flag}</span>
                      {language.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold mb-2">{t('languageSettings.switcherPreview')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('languageSettings.switcherPreviewDesc')}
            </p>
          </div>
          
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4" />
              <span className="font-medium">{t('languageSettings.languagesLabel')}</span>
              <div className="flex gap-2">
                {selectedLanguages.map(langCode => {
                  const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                  return lang ? (
                    <Badge 
                      key={langCode} 
                      variant={langCode === defaultLanguage ? "default" : "outline"}
                      className="text-xs"
                    >
                      {lang.flag} {lang.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button 
            onClick={handleSave}
            disabled={!hasChanges() || updateLanguagesMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateLanguagesMutation.isPending ? t('message.saving') : t('languageSettings.saveSettings')}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open(`/wedding/${wedding.uniqueUrl}`, '_blank')}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {t('languageSettings.previewWebsite')}
          </Button>
        </div>

        {hasChanges() && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {t('languageSettings.unsavedChanges')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StandardTemplateSettings } from '@/admin/components/standard-template-settings';
import { WeddingLanguageSettings } from '@/admin/components/wedding-language-settings';
import { Settings, Languages, Palette, Eye } from 'lucide-react';
import type { Wedding } from '@shared/schema';

interface WeddingAdminEnhancedProps {
  weddingId: number;
}

export function WeddingAdminEnhanced({ weddingId }: WeddingAdminEnhancedProps) {
  const { t } = useTranslation();

  const { data: wedding, isLoading } = useQuery<Wedding>({
    queryKey: ['/api/weddings', weddingId],
    queryFn: () => fetch(`/api/weddings/${weddingId}`).then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Wedding not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wedding Overview Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Wedding Settings: {wedding.bride} & {wedding.groom}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your wedding website settings and customization options
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={wedding.template === 'standard' ? 'default' : 'secondary'}>
                {wedding.template === 'standard' ? 'Standard Template' : 'Premium Template'}
              </Badge>
              <Badge variant="outline">
                {wedding.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Wedding Date:</span>
              <p className="text-muted-foreground">
                {new Date(wedding.weddingDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="font-medium">Venue:</span>
              <p className="text-muted-foreground">{wedding.venue}</p>
            </div>
            <div>
              <span className="font-medium">Website URL:</span>
              <p className="text-muted-foreground">
                <a 
                  href={`/wedding/${wedding.uniqueUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  View Website <Eye className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings Tabs */}
      <Tabs defaultValue="template" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="template" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Template Settings
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Language Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-6">
          {wedding.template === 'standard' ? (
            <StandardTemplateSettings wedding={wedding} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Premium Template Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Premium template customization options
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Premium template settings are available for templates other than Standard.
                  Your current template: <strong>{wedding.template}</strong>
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <WeddingLanguageSettings wedding={wedding} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
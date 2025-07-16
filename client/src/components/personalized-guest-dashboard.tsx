import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Users, Camera, MessageSquare, MapPin, Clock, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Guest, Wedding, GuestBookEntry, Photo } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface PersonalizedGuestDashboardProps {
  wedding: Wedding;
  currentGuest?: Guest;
  className?: string;
}

export function PersonalizedGuestDashboard({ 
  wedding, 
  currentGuest,
  className = '' 
}: PersonalizedGuestDashboardProps) {
  const { t } = useTranslation();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [guestMessage, setGuestMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all guests for RSVP stats
  const { data: allGuests = [] } = useQuery<Guest[]>({
    queryKey: wedding?.id ? [`/api/guests/wedding/${wedding.id}`] : [],
    enabled: !!wedding?.id,
  });

  // Fetch guest book entries
  const { data: guestBookEntries = [] } = useQuery<GuestBookEntry[]>({
    queryKey: wedding?.id ? [`/api/guest-book/wedding/${wedding.id}`] : [],
    enabled: !!wedding?.id,
  });

  // Fetch photos
  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: wedding?.id ? [`/api/photos/wedding/${wedding.id}`] : [],
    enabled: !!wedding?.id,
  });

  // WebSocket disabled for stability
  useEffect(() => {
    // WebSocket functionality disabled to prevent connection errors
    setIsConnected(false);
  }, [wedding?.id]);

  // Guest book mutation
  const guestBookMutation = useMutation({
    mutationFn: async (data: { guestName: string; message: string }) => {
      const response = await fetch('/api/guest-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: wedding.id,
          guestName: data.guestName,
          message: data.message
        })
      });
      if (!response.ok) throw new Error('Failed to add message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/guest-book/wedding/${wedding.id}`] });
      setGuestMessage('');
      setGuestName('');
      toast({
        title: "Message Added!",
        description: "Your message has been added to the guest book.",
      });
    }
  });

  // Calculate RSVP stats
  const rsvpStats = {
    total: allGuests.length,
    confirmed: allGuests.filter(g => g.rsvpStatus === 'confirmed').length,
    pending: allGuests.filter(g => g.rsvpStatus === 'pending').length,
    declined: allGuests.filter(g => g.rsvpStatus === 'declined').length,
    maybe: allGuests.filter(g => g.rsvpStatus === 'maybe').length,
  };

  const responseRate = rsvpStats.total > 0 
    ? Math.round(((rsvpStats.confirmed + rsvpStats.declined + rsvpStats.maybe) / rsvpStats.total) * 100)
    : 0;

  // Personalized welcome message based on guest status
  const getWelcomeMessage = () => {
    if (currentGuest) {
      switch (currentGuest.rsvpStatus) {
        case 'confirmed':
          return t('dashboard.welcomeConfirmed', { name: currentGuest.name });
        case 'declined':
          return t('dashboard.welcomeDeclined', { name: currentGuest.name });
        case 'maybe':
          return t('dashboard.welcomeMaybe', { name: currentGuest.name });
        default:
          return t('dashboard.welcomeDefault', { name: currentGuest.name });
      }
    }
    return t('dashboard.welcomeGeneral', { bride: wedding.bride, groom: wedding.groom });
  };

  const formatDate = (date: Date | string) => {
    const currentLocale = localStorage.getItem('language') || 'en';
    return new Date(date).toLocaleDateString(currentLocale === 'kk' ? 'ru-RU' : currentLocale === 'uz' ? 'uz-UZ' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? t('dashboard.liveUpdatesEnabled') : t('dashboard.connecting')}
          </span>
        </div>
      </div>

      {/* Personalized Welcome */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {wedding.bride} & {wedding.groom}
          </CardTitle>
          <CardDescription>
            {getWelcomeMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(wedding.weddingDate)}</span>
            </div>
            {wedding.weddingTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatTime(wedding.weddingTime)}</span>
              </div>
            )}
            {wedding.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{wedding.venue}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
          <TabsTrigger value="rsvp">{t('dashboard.rsvpStatus')}</TabsTrigger>
          <TabsTrigger value="memories">{t('dashboard.memories')}</TabsTrigger>
          <TabsTrigger value="guestbook">{t('dashboard.guestBook')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.weddingOverview')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{rsvpStats.confirmed}</div>
                  <div className="text-sm text-muted-foreground">{t('guests.status.confirmed')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{rsvpStats.pending}</div>
                  <div className="text-sm text-muted-foreground">{t('guests.status.pending')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{rsvpStats.maybe}</div>
                  <div className="text-sm text-muted-foreground">{t('guests.status.maybe')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{photos.length}</div>
                  <div className="text-sm text-muted-foreground">{t('dashboard.photos')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rsvp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('guests.rsvpProgressOverview')}
              </CardTitle>
              <CardDescription>
                {t('guests.realTimeTracking')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('guests.responseRatePercent')}</span>
                  <span>{responseRate}% ({rsvpStats.confirmed + rsvpStats.declined + rsvpStats.maybe} {t('guests.outOf')} {rsvpStats.total})</span>
                </div>
                <Progress value={responseRate} className="w-full" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {t('guests.status.confirmed')}
                    </Badge>
                    <span className="text-sm font-medium">{rsvpStats.confirmed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                      {t('guests.status.pending')}
                    </Badge>
                    <span className="text-sm font-medium">{rsvpStats.pending}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      {t('guests.status.maybe')}
                    </Badge>
                    <span className="text-sm font-medium">{rsvpStats.maybe}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="bg-red-100 text-red-800">
                      {t('guests.status.declined')}
                    </Badge>
                    <span className="text-sm font-medium">{rsvpStats.declined}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t('dashboard.weddingMemories')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.shareAndViewPhotos')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square">
                      <img
                        src={photo.url}
                        alt={photo.caption || t('common.weddingPhoto')}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
                          <p className="text-xs">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t('dashboard.noPhotosYet')}</p>
                  <p className="text-sm">{t('dashboard.photosWillAppear')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guestbook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('dashboard.guestBook')}
              </CardTitle>
              <CardDescription>
                {t('dashboard.leaveMessageForCouple')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guest-name">{t('form.name')}</Label>
                  <Input
                    id="guest-name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={t('guestBook.form.namePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="guest-message">{t('form.message')}</Label>
                  <Textarea
                    id="guest-message"
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                    placeholder={t('guestBook.form.messagePlaceholder')}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={() => guestBookMutation.mutate({ guestName, message: guestMessage })}
                  disabled={!guestName.trim() || !guestMessage.trim() || guestBookMutation.isPending}
                  className="w-full"
                >
                  {guestBookMutation.isPending ? t('guestBook.addingMessage') : t('guestBook.addToGuestBook')}
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {guestBookEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{entry.guestName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.message}</p>
                  </div>
                ))}
                {guestBookEntries.length === 0 && (
                                  <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t('guestBook.noMessages')}</p>
                  <p className="text-sm">{t('guestBook.beFirstToLeave')}</p>
                </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
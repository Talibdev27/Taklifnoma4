import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  Users,
  Heart,
  Calendar,
  MapPin,
  Eye,
  Settings,
  Camera,
  UserPlus
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User, Wedding, Guest, Photo, insertGuestSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TEMPLATE_REGISTRY, EVENT_TYPES, getTemplatesForEvent } from '@/lib/templates';
import { useTranslation } from 'react-i18next';

export default function AdminWeddingEdit() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const weddingUrl = params.weddingUrl;

  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isAddGuestDialogOpen, setIsAddGuestDialogOpen] = useState(false);

  // Guest form schema
  const addGuestSchema = z.object({
    weddingId: z.number(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe', 'confirmed_with_guest']).default('pending'),
    plusOne: z.boolean().default(false),
  });

  type AddGuestFormData = z.infer<typeof addGuestSchema>;

  // Guest form
  const guestForm = useForm<AddGuestFormData>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: {
      weddingId: 0,
      name: '',
      email: '',
      phone: '',
      rsvpStatus: 'pending',
      plusOne: false,
    },
  });

  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin');
    if (adminStatus !== 'true') {
      setLocation('/admin');
      return;
    }
    setIsAdmin(true);
  }, [setLocation]);

  // Fetch wedding details
  const { data: wedding, isLoading: weddingLoading } = useQuery<Wedding>({
    queryKey: [`/api/weddings/url/${weddingUrl}`],
    enabled: isAdmin && !!weddingUrl,
    queryFn: () => apiRequest('GET', `/api/weddings/url/${weddingUrl}`).then(res => res.json())
  });

  // Fetch guests for this wedding
  const { data: guests, isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ['/api/admin/guests', wedding?.id],
    enabled: isAdmin && !!wedding?.id,
    queryFn: () => apiRequest('GET', `/api/admin/guests/${wedding?.id}`).then(res => res.json())
  });

  // Fetch photos for this wedding
  const { data: photos, isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ['/api/photos/wedding', wedding?.id],
    enabled: isAdmin && !!wedding?.id,
    queryFn: () => apiRequest('GET', `/api/photos/wedding/${wedding?.id}`).then(res => res.json())
  });

  // Update wedding mutation
  const updateWeddingMutation = useMutation({
    mutationFn: async (updates: Partial<Wedding>) => {
      // Filter out non-updatable fields
      const { id, userId, uniqueUrl, createdAt, ...updateData } = updates;
      
      // Convert date string back to Date object if it exists
      if (updateData.weddingDate && typeof updateData.weddingDate === 'string') {
        updateData.weddingDate = new Date(updateData.weddingDate);
      }
      
      console.log('Updating wedding with filtered data:', updateData);
      console.log('Wedding ID:', wedding?.id);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/weddings/${wedding?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update wedding: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('weddingEdit.weddingUpdated'),
        description: t('weddingEdit.weddingUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/weddings/url/${weddingUrl}`] });
      setEditMode(false);
    },
    onError: (error: any) => {
      console.error('Wedding update error:', error);
      toast({
        title: t('weddingEdit.updateFailed'),
        description: error.message || t('weddingEdit.updateFailedDesc'),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (wedding && !weddingData) {
      setWeddingData(wedding);
    }
  }, [wedding, weddingData]);

  const handleSave = () => {
    if (weddingData) {
      updateWeddingMutation.mutate(weddingData);
    }
  };

  const handleInputChange = (field: keyof Wedding, value: string) => {
    setWeddingData(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Photo management mutations
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('weddingEdit.photoDeleted'),
        description: t('weddingEdit.photoDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/photos/wedding/${wedding?.id}`] });
    },
    onError: () => {
      toast({
        title: t('weddingEdit.deleteFailed'),
        description: t('weddingEdit.deleteFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: async (photoData: any) => {
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoData),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('weddingEdit.photoAdded'),
        description: t('weddingEdit.photoAddedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
    },
    onError: () => {
      toast({
        title: t('weddingEdit.uploadFailed'),
        description: t('weddingEdit.photoAddFailedDesc'),
        variant: "destructive",
      });
    },
  });

  // Add guest mutation
  const addGuestMutation = useMutation({
    mutationFn: async (guestData: AddGuestFormData) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/guests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(guestData),
      });
      if (!response.ok) {
        throw new Error('Failed to add guest');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('weddingEdit.guestAdded'),
        description: t('weddingEdit.guestAddedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/guests', wedding?.id] });
      setIsAddGuestDialogOpen(false);
      guestForm.reset();
    },
    onError: () => {
      toast({
        title: t('weddingEdit.guestAddFailed'),
        description: t('weddingEdit.guestAddFailedDesc'),
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmitGuest = (data: AddGuestFormData) => {
    if (wedding?.id) {
      addGuestMutation.mutate({
        ...data,
        weddingId: wedding.id,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (weddingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8F1F1] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4B08C] mx-auto mb-4"></div>
          <p className="text-[#2C3338]">{t('manage.loadingDetails')}</p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8F1F1] to-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-[#2C3338] mb-2">{t('wedding.notFound')}</h2>
            <p className="text-[#2C3338]/70 mb-4">{t('weddingEdit.notFoundDesc')}</p>
            <Button onClick={() => setLocation('/admin/dashboard')} className="wedding-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('nav.backToDashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F1F1] to-white">
      <header className="bg-white shadow-sm border-b border-[#D4B08C]/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/dashboard')}
                className="border-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('nav.backToDashboard')}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#2C3338]">
                  {wedding?.template === 'birthday' ? t('weddingEdit.manageBirthdayEvent') : t('weddingEdit.manageEvent')}: {wedding.template === 'birthday' ? wedding.bride : `${wedding.bride} & ${wedding.groom}`}
                </h1>
                <p className="text-[#2C3338]/70">
                  {wedding.isPublic ? t('manage.publicLabel') : t('manage.privateLabel')} • {wedding.uniqueUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(`/wedding/${wedding.uniqueUrl}`, '_blank')}
                className="border-gray-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                {t('weddingEdit.viewSite')}
              </Button>
              {editMode ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={updateWeddingMutation.isPending}
                    className="wedding-button"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('weddingEdit.saveChanges')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setWeddingData(wedding);
                    }}
                    className="border-gray-200"
                  >
                    {t('common.cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setEditMode(true)}
                  className="wedding-button"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {wedding?.template === 'birthday' ? t('weddingEdit.editBirthdayEvent') : t('weddingEdit.editWedding')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">
                                {wedding?.template === 'birthday' ? t('weddingEdit.birthdayDetails') : t('weddingEdit.eventDetails')}
            </TabsTrigger>
            <TabsTrigger value="photos">{t('manage.photoManagement')}</TabsTrigger>
            <TabsTrigger value="guests">{t('manage.guestManagement')}</TabsTrigger>
            <TabsTrigger value="settings">{t('admin.settings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card className="wedding-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-[#D4B08C]" />
                  {wedding?.template === 'birthday' ? t('weddingEdit.birthdayInformation') : t('weddingEdit.eventInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {wedding?.template === 'birthday' ? t('weddingEdit.birthdayPersonName') : t('weddingEdit.eventHostName')}
                      </label>
                      {editMode ? (
                        <Input
                          value={weddingData?.bride || ''}
                          onChange={(e) => handleInputChange('bride', e.target.value)}
                          className="wedding-input"
                          placeholder={wedding?.template === 'birthday' ? t('weddingEdit.enterBirthdayPersonName') : t('weddingEdit.enterEventHostName')}
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">{wedding.bride}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {wedding?.template === 'birthday' ? t('weddingEdit.eventType') : t('weddingEdit.groomName')}
                      </label>
                      {editMode ? (
                        <Input
                          value={weddingData?.groom || ''}
                          onChange={(e) => handleInputChange('groom', e.target.value)}
                          className="wedding-input"
                          placeholder={wedding?.template === 'birthday' ? t('weddingEdit.eventTypePlaceholder') : t('weddingEdit.enterGroomName')}
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">{wedding.groom}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {wedding?.template === 'birthday' ? t('weddingEdit.birthdayDate') : t('weddingEdit.eventDate')}
                      </label>
                      {editMode ? (
                        <Input
                          type="date"
                          value={weddingData?.weddingDate ? new Date(weddingData.weddingDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleInputChange('weddingDate', e.target.value)}
                          className="wedding-input"
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString() : (wedding?.template === 'birthday' ? t('weddingEdit.noBirthdayDateSet') : t('weddingEdit.noWeddingDateSet'))}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {wedding?.template === 'birthday' ? t('weddingEdit.partyTime') : t('weddingEdit.eventTime')}
                      </label>
                      {editMode ? (
                        <Input
                          value={weddingData?.weddingTime || ''}
                          onChange={(e) => handleInputChange('weddingTime', e.target.value)}
                          className="wedding-input"
                          placeholder={wedding?.template === 'birthday' ? t('weddingEdit.partyTimePlaceholder') : t('weddingEdit.eventTimePlaceholder')}
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {wedding.weddingTime || (wedding?.template === 'birthday' ? '18:00' : '4:00 PM')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {wedding?.template === 'birthday' ? t('weddingEdit.partyTimezone') : t('weddingEdit.weddingTimezone')}
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        {t('weddingEdit.timezoneHint', { type: wedding?.template === 'birthday' ? t('weddingEdit.typeBirthdayParty') : t('weddingEdit.typeEvent') })}
                      </p>
                      {editMode ? (
                        <select
                          value={weddingData?.timezone || 'Asia/Tashkent'}
                          onChange={(e) => handleInputChange('timezone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <optgroup label="Central Asia">
                            <option value="Asia/Tashkent">Uzbekistan (Tashkent) - UTC+5</option>
                            <option value="Asia/Almaty">Kazakhstan (Almaty) - UTC+6</option>
                            <option value="Asia/Bishkek">Kyrgyzstan (Bishkek) - UTC+6</option>
                            <option value="Asia/Dushanbe">Tajikistan (Dushanbe) - UTC+5</option>
                            <option value="Asia/Ashgabat">Turkmenistan (Ashgabat) - UTC+5</option>
                          </optgroup>
                          <optgroup label="Middle East">
                            <option value="Asia/Dubai">UAE (Dubai) - UTC+4</option>
                            <option value="Asia/Istanbul">Turkey (Istanbul) - UTC+3</option>
                            <option value="Asia/Tehran">Iran (Tehran) - UTC+3:30</option>
                          </optgroup>
                          <optgroup label="Russia">
                            <option value="Europe/Moscow">Russia (Moscow) - UTC+3</option>
                            <option value="Asia/Yekaterinburg">Russia (Yekaterinburg) - UTC+5</option>
                            <option value="Asia/Novosibirsk">Russia (Novosibirsk) - UTC+7</option>
                          </optgroup>
                          <optgroup label="Europe">
                            <option value="Europe/London">UK (London) - UTC+0</option>
                            <option value="Europe/Paris">France (Paris) - UTC+1</option>
                            <option value="Europe/Berlin">Germany (Berlin) - UTC+1</option>
                            <option value="Europe/Rome">Italy (Rome) - UTC+1</option>
                            <option value="Europe/Madrid">Spain (Madrid) - UTC+1</option>
                          </optgroup>
                          <optgroup label="North America">
                            <option value="America/New_York">USA (New York) - UTC-5</option>
                            <option value="America/Chicago">USA (Chicago) - UTC-6</option>
                            <option value="America/Denver">USA (Denver) - UTC-7</option>
                            <option value="America/Los_Angeles">USA (Los Angeles) - UTC-8</option>
                            <option value="America/Toronto">Canada (Toronto) - UTC-5</option>
                          </optgroup>
                          <optgroup label="Asia">
                            <option value="Asia/Tokyo">Japan (Tokyo) - UTC+9</option>
                            <option value="Asia/Seoul">South Korea (Seoul) - UTC+9</option>
                            <option value="Asia/Shanghai">China (Shanghai) - UTC+8</option>
                            <option value="Asia/Singapore">Singapore - UTC+8</option>
                            <option value="Asia/Kolkata">India (Delhi) - UTC+5:30</option>
                          </optgroup>
                        </select>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {wedding.timezone || 'Asia/Tashkent (Uzbekistan)'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {wedding?.template === 'birthday' ? t('weddingEdit.partyVenue') : t('weddingEdit.eventVenue')}
                      </label>
                      {editMode ? (
                        <Input
                          value={weddingData?.venue || ''}
                          onChange={(e) => handleInputChange('venue', e.target.value)}
                          className="wedding-input"
                          placeholder={wedding?.template === 'birthday' ? t('weddingEdit.partyVenuePlaceholder') : t('weddingEdit.enterVenueName')}
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">{wedding.venue}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {wedding?.template === 'birthday' ? t('weddingEdit.partyLocationAddress') : t('weddingEdit.eventLocationAddress')}
                      </label>
                      {editMode ? (
                        <Input
                          value={weddingData?.venueAddress || ''}
                          onChange={(e) => handleInputChange('venueAddress', e.target.value)}
                          className="wedding-input"
                          placeholder={wedding?.template === 'birthday' ? t('weddingEdit.partyLocationPlaceholder') : t('weddingEdit.fullVenueAddress')}
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">{wedding.venueAddress}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('weddingEdit.dressCodeOptional')}
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        {t('weddingEdit.dressCodeHint', { type: wedding?.template === 'birthday' ? t('weddingEdit.typeBirthdayParty') : t('weddingEdit.typeEvent') })}
                      </p>
                      {editMode ? (
                        <Input
                          value={weddingData?.dressCode || ''}
                          onChange={(e) => handleInputChange('dressCode', e.target.value)}
                          className="wedding-input"
                          placeholder={wedding?.template === 'birthday' ? t('weddingEdit.dressCodePlaceholderBirthday') : t('weddingEdit.dressCodePlaceholderWedding')}
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">{wedding.dressCode || t('weddingEdit.notSpecified')}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('weddingEdit.mapPinUrlOptional')}
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        {t('weddingEdit.mapPinHint', { type: wedding?.template === 'birthday' ? t('weddingEdit.typeParty') : t('weddingEdit.typeEventVenue') })}
                      </p>
                      {editMode ? (
                        <Input
                          value={weddingData?.mapPinUrl || ''}
                          onChange={(e) => handleInputChange('mapPinUrl', e.target.value)}
                          className="wedding-input"
                          placeholder={t('weddingEdit.mapPinUrlPlaceholder')}
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {wedding.mapPinUrl || t('weddingEdit.mapPinNotSet', { type: wedding?.template === 'birthday' ? t('weddingEdit.typePartyLocation') : t('weddingEdit.typeEventVenue') })}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {wedding?.template === 'birthday' ? t('weddingEdit.birthdayPersonPhotoOptional') : t('weddingEdit.eventPhotoOptional')}
                      </label>
                      <p className="text-xs text-gray-500 mb-1">
                        {t('weddingEdit.heroPhotoHint', { type: wedding?.template === 'birthday' ? t('weddingEdit.typeBirthdayPerson') : t('weddingEdit.typeEvent') })}
                      </p>
                      {editMode ? (
                        <>
                          {weddingData?.couplePhotoUrl && (
                            <div className="mb-2">
                              <img
                                src={weddingData.couplePhotoUrl}
                                alt={wedding?.template === 'birthday' ? t('weddingEdit.altBirthdayPerson') : t('weddingEdit.altCouple')}
                                className="w-32 h-32 object-cover rounded-lg border mb-2"
                              />
                              <button
                                type="button"
                                onClick={() => handleInputChange('couplePhotoUrl', '')}
                                className="text-red-500 text-sm hover:underline block mb-2"
                              >
                                {t('weddingEdit.removePhoto')}
                              </button>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const formData = new FormData();
                              formData.append('photo', file);
                              try {
                                const token = localStorage.getItem('adminToken');
                                const response = await fetch('/api/upload/couple-photo', {
                                  method: 'POST',
                                  headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
                                  body: formData
                                });
                                if (response.ok) {
                                  const result = await response.json();
                                  handleInputChange('couplePhotoUrl', result.url);
                                } else {
                                  alert(t('weddingEdit.uploadPhotoFailed', { type: wedding?.template === 'birthday' ? t('weddingEdit.typeBirthdayPerson') : t('weddingEdit.typeCouple') }));
                                }
                              } catch (err) {
                                alert(t('weddingEdit.uploadPhotoFailed', { type: wedding?.template === 'birthday' ? t('weddingEdit.typeBirthdayPerson') : t('weddingEdit.typeCouple') }));
                              }
                            }}
                            className="mb-2"
                          />
                        </>
                      ) : (
                        wedding.couplePhotoUrl ? (
                          <img
                            src={wedding.couplePhotoUrl}
                            alt={wedding?.template === 'birthday' ? t('weddingEdit.altBirthdayPerson') : t('weddingEdit.altCouple')}
                            className="w-32 h-32 object-cover rounded-lg border mb-2"
                          />
                        ) : (
                          <span className="text-gray-400">{t('weddingEdit.noPhotoUploaded', { type: wedding?.template === 'birthday' ? t('weddingEdit.typeBirthdayPerson') : t('weddingEdit.typeCouple') })}</span>
                        )
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('weddingEdit.backgroundMusicOptional')}
                      </label>
                      <p className="text-xs text-gray-500 mb-1">
                        {t('weddingEdit.backgroundMusicHint', { site: wedding?.template === 'birthday' ? t('weddingEdit.siteBirthday') : t('weddingEdit.siteEvent') })}
                      </p>
                      {editMode ? (
                        <>
                          {weddingData?.backgroundMusicUrl && (
                            <div className="mb-2">
                              <audio
                                controls
                                className="w-full"
                                src={weddingData.backgroundMusicUrl}
                              >
                                {t('weddingEdit.audioNotSupported')}
                              </audio>
                              <button
                                type="button"
                                onClick={() => handleInputChange('backgroundMusicUrl', '')}
                                className="text-red-500 text-sm hover:underline block mb-2"
                              >
                                {t('music.removeMusic')}
                              </button>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              // Validate file type
                              if (!file.type.startsWith('audio/')) {
                                alert(t('music.invalidFileTypeDesc'));
                                return;
                              }

                              // Validate file size (max 10MB)
                              if (file.size > 10 * 1024 * 1024) {
                                alert(t('music.fileTooLargeDesc'));
                                return;
                              }
                              
                              const formData = new FormData();
                              formData.append('music', file);
                              try {
                                const token = localStorage.getItem('adminToken');
                                console.log('Uploading music file:', file.name, 'Size:', file.size, 'Type:', file.type);
                                
                                const response = await fetch('/api/upload/background-music', {
                                  method: 'POST',
                                  headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
                                  body: formData
                                });
                                
                                console.log('Upload response status:', response.status);
                                
                                if (response.ok) {
                                  const result = await response.json();
                                  console.log('Upload successful:', result);
                                  handleInputChange('backgroundMusicUrl', result.url);
                                  toast({
                                    title: t('music.musicUploaded'),
                                    description: t('weddingEdit.musicUploadedDesc'),
                                  });
                                } else {
                                  const errorText = await response.text();
                                  console.error('Upload failed:', response.status, errorText);
                                  toast({
                                    title: t('music.uploadFailed'),
                                    description: t('weddingEdit.musicUploadFailedStatus', { status: response.status, statusText: response.statusText }),
                                    variant: "destructive",
                                  });
                                }
                              } catch (err) {
                                console.error('Upload error:', err);
                                toast({
                                  title: t('weddingEdit.uploadError'),
                                  description: t('weddingEdit.musicUploadErrorDesc'),
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="mb-2"
                          />
                        </>
                      ) : (
                        wedding.backgroundMusicUrl ? (
                          <div>
                            <audio
                              controls
                              className="w-full"
                              src={wedding.backgroundMusicUrl}
                            >
                              {t('weddingEdit.audioNotSupported')}
                            </audio>
                          </div>
                        ) : (
                          <span className="text-gray-400">{t('weddingEdit.noBackgroundMusic')}</span>
                        )
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('weddingEdit.eventType')}
                      </label>
                      {editMode ? (
                        <select
                          value={weddingData?.eventType || 'wedding'}
                          onChange={(e) => {
                            handleInputChange('eventType', e.target.value);
                            // Reset template to first available for new event type
                            const firstTemplate = getTemplatesForEvent(e.target.value)[0].value;
                            handleInputChange('template', firstTemplate);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {EVENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg capitalize">{wedding.eventType || 'wedding'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('manage.template')}
                      </label>
                      {editMode ? (
                        <select
                          value={weddingData?.template || 'modern'}
                          onChange={(e) => handleInputChange('template', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {getTemplatesForEvent(weddingData?.eventType || wedding?.eventType).map(template => (
                            <option key={template.value} value={template.value}>
                              {template.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg capitalize">{wedding.template}</p>
                      )}
                    </div>

                    {/* Epic Template Specific Colors */}
                    {(editMode ? weddingData?.template : wedding?.template) === 'epic' && (
                      <div>
                        <h3 className="font-semibold text-[#2C3338] mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {t('weddingEdit.epicTemplateColors')}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">{t('weddingEdit.epicColorsHint')}</p>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#2C3338] mb-2">
                              {t('createWedding.primaryColor')}
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={editMode ? (weddingData?.primaryColor || '#1976d2') : (wedding?.primaryColor || '#1976d2')}
                                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                                className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              />
                              <Input
                                value={editMode ? (weddingData?.primaryColor || '#1976d2') : (wedding?.primaryColor || '#1976d2')}
                                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                                placeholder="#1976d2"
                                className="flex-1"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{t('weddingEdit.primaryColorHint')}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#2C3338] mb-2">
                              {t('createWedding.accentColor')}
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={editMode ? (weddingData?.accentColor || '#1565c0') : (wedding?.accentColor || '#1565c0')}
                                onChange={(e) => handleInputChange('accentColor', e.target.value)}
                                className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              />
                              <Input
                                value={editMode ? (weddingData?.accentColor || '#1565c0') : (wedding?.accentColor || '#1565c0')}
                                onChange={(e) => handleInputChange('accentColor', e.target.value)}
                                placeholder="#1565c0"
                                className="flex-1"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{t('weddingEdit.accentColorHint')}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('weddingEdit.rsvpMode')}
                      </label>
                      {editMode ? (
                        <select
                          value={weddingData?.rsvpMode || wedding?.rsvpMode || 'both'}
                          onChange={(e) => handleInputChange('rsvpMode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="both">{t('weddingEdit.rsvpModeBoth')}</option>
                          <option value="manual">{t('weddingEdit.rsvpModeManual')}</option>
                          <option value="preregistered">{t('weddingEdit.rsvpModePreregistered')}</option>
                        </select>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg capitalize">
                          {wedding.rsvpMode === 'both' && t('weddingEdit.rsvpModeBoth')}
                          {wedding.rsvpMode === 'manual' && t('weddingEdit.rsvpModeManual')}
                          {wedding.rsvpMode === 'preregistered' && t('weddingEdit.rsvpModePreregistered')}
                        </p>
                      )}
                      {editMode && (
                        <p className="text-xs text-gray-500 mt-1">
                          {weddingData?.rsvpMode === 'both' && t('weddingEdit.rsvpModeBothHint')}
                          {weddingData?.rsvpMode === 'manual' && t('weddingEdit.rsvpModeManualHint')}
                          {weddingData?.rsvpMode === 'preregistered' && t('weddingEdit.rsvpModePreregisteredHint')}
                        </p>
                      )}
                    </div>

                    {/* Birthday-specific fields */}
                    {(editMode ? weddingData?.template : wedding?.template) === 'birthday' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-[#2C3338] mb-2">
                            {t('weddingEdit.ageTurning')}
                          </label>
                          {editMode ? (
                            <Input
                              value={weddingData?.age || ''}
                              onChange={(e) => handleInputChange('age', e.target.value)}
                              className="wedding-input"
                              placeholder={t('weddingEdit.ageTurningPlaceholder')}
                            />
                          ) : (
                            <p className="p-3 bg-gray-50 rounded-lg">{wedding.age || t('weddingEdit.notSpecified')}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3338] mb-2">
                            {t('weddingEdit.partyThemeOptional')}
                          </label>
                          {editMode ? (
                            <Input
                              value={weddingData?.partyTheme || ''}
                              onChange={(e) => handleInputChange('partyTheme', e.target.value)}
                              className="wedding-input"
                              placeholder={t('weddingEdit.partyThemePlaceholder')}
                            />
                          ) : (
                            <p className="p-3 bg-gray-50 rounded-lg">{wedding.partyTheme || t('weddingEdit.notSpecified')}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3338] mb-2">
                            {t('weddingEdit.rsvpDeadlineOptional')}
                          </label>
                          {editMode ? (
                            <Input
                              type="date"
                              value={weddingData?.rsvpDeadline ? new Date(weddingData.rsvpDeadline).toISOString().split('T')[0] : ''}
                              onChange={(e) => handleInputChange('rsvpDeadline', e.target.value)}
                              className="wedding-input"
                            />
                          ) : (
                            <p className="p-3 bg-gray-50 rounded-lg">
                              {wedding.rsvpDeadline ? new Date(wedding.rsvpDeadline).toLocaleDateString() : t('weddingEdit.notSpecified')}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3338] mb-2">
                            {t('weddingEdit.contactPersonForQuestions')}
                          </label>
                          {editMode ? (
                            <Input
                              value={weddingData?.contactPerson || ''}
                              onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                              className="wedding-input"
                              placeholder={t('weddingEdit.contactPersonPlaceholder')}
                            />
                          ) : (
                            <p className="p-3 bg-gray-50 rounded-lg">{wedding.contactPerson || t('weddingEdit.notSpecified')}</p>
                          )}
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('weddingEdit.availableLanguages')}
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        {t('weddingEdit.availableLanguagesHint')}
                      </p>
                      {editMode ? (
                        <div className="flex flex-wrap gap-3">
                          {[
                            { value: 'en', label: 'English' },
                            { value: 'ru', label: 'Русский' },
                            { value: 'uz', label: "O'zbekcha" },
                            { value: 'kk', label: 'Қазақша' },
                            { value: 'kaa', label: 'Қарақалпақша' },
                          ].map(({ value, label }) => {
                            const langs: string[] = weddingData?.availableLanguages || ['en'];
                            const checked = langs.includes(value);
                            return (
                              <label key={value} className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked
                                      ? langs.filter(l => l !== value)
                                      : [...langs, value];
                                    setWeddingData(prev => prev ? { ...prev, availableLanguages: next.length ? next : [value] } : null);
                                  }}
                                  className="w-4 h-4 accent-blue-600"
                                />
                                <span className="text-sm text-[#2C3338]">{label}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {(wedding.availableLanguages || ['en']).map(l => ({
                            en: 'English', ru: 'Русский', uz: "O'zbekcha", kk: 'Қазақша', kaa: 'Қарақалпақша'
                          }[l] || l)).join(', ')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('weddingEdit.defaultLanguage')}
                      </label>
                      {editMode ? (
                        <select
                          value={weddingData?.defaultLanguage || 'uz'}
                          onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="ru">Russian</option>
                          <option value="uz">O'zbekcha</option>
                          <option value="kk">Қазақша</option>
                          <option value="kaa">Қарақалпақша</option>
                        </select>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg capitalize">{wedding.defaultLanguage}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('weddingEdit.privacyStatus')}
                      </label>
                      {editMode ? (
                        <select
                          value={weddingData?.isPublic ? 'public' : 'private'}
                          onChange={(e) => handleInputChange('isPublic', e.target.value === 'public' ? 'true' : 'false')}
                          className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        >
                          <option value="public">{t('manage.publicLabel')}</option>
                          <option value="private">{t('manage.privateLabel')}</option>
                        </select>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {wedding.isPublic ? t('manage.publicLabel') : t('manage.privateLabel')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Love Story Section */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-[#2C3338] mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-[#D4B08C]" />
                    {wedding?.template === 'birthday' ? t('birthday.partyDetails') : t('weddingEdit.eventDetails')}
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      {t('weddingEdit.welcomeMessageForGuests')}
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('weddingEdit.welcomeMessageHint', { section: wedding?.template === 'birthday' ? t('weddingEdit.sectionBirthdayCelebration') : t('weddingEdit.sectionEventDetails') })}
                    </p>
                    {editMode ? (
                      <Textarea
                        value={weddingData?.dearGuestMessage || ''}
                        onChange={(e) => handleInputChange('dearGuestMessage', e.target.value)}
                        className="wedding-input min-h-[120px]"
                        placeholder={t('weddingEdit.welcomeMessagePlaceholder')}
                      />
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg min-h-[120px]">
                        {wedding.dearGuestMessage ? (
                          <p className="text-gray-800 leading-relaxed">{wedding.dearGuestMessage}</p>
                        ) : (
                          <p className="text-gray-500 italic">{t('weddingEdit.noDearGuestMessage')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-[#2C3338] mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-[#D4B08C]" />
                    {wedding?.template === 'birthday' ? t('weddingEdit.aboutName') : t('weddingEdit.loveStory')}
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      {wedding?.template === 'birthday' ? t('weddingEdit.aboutBirthdayPerson') : t('weddingEdit.yourLoveStoryOptional')}
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      {wedding?.template === 'birthday'
                        ? t('weddingEdit.aboutBirthdayPersonHint')
                        : t('weddingEdit.loveStoryHint')
                      }
                    </p>
                    {editMode ? (
                      <Textarea
                        value={weddingData?.story || ''}
                        onChange={(e) => handleInputChange('story', e.target.value)}
                        className="wedding-input min-h-[120px]"
                        placeholder={wedding?.template === 'birthday'
                          ? t('weddingEdit.aboutBirthdayPersonPlaceholder')
                          : t('weddingEdit.loveStoryPlaceholder')
                        }
                      />
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg min-h-[120px]">
                        {wedding.story ? (
                          <p className="text-gray-800 leading-relaxed">{wedding.story}</p>
                        ) : (
                          <p className="text-gray-500 italic">
                            {wedding?.template === 'birthday'
                              ? t('weddingEdit.noBirthdayDescription')
                              : t('weddingEdit.noLoveStory')
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Birthday-specific additional fields */}
                {(editMode ? weddingData?.template : wedding?.template) === 'birthday' && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-[#2C3338] mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-[#D4B08C]" />
                      {t('weddingEdit.birthdayPartyDetails')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          {t('weddingEdit.giftRegistryInfoOptional')}
                        </label>
                        {editMode ? (
                          <Textarea
                            value={weddingData?.giftRegistryInfo || ''}
                            onChange={(e) => handleInputChange('giftRegistryInfo', e.target.value)}
                            className="wedding-input min-h-[120px]"
                            placeholder={t('weddingEdit.giftRegistryPlaceholder')}
                          />
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg min-h-[120px]">
                            {wedding.giftRegistryInfo ? (
                              <p className="text-gray-800 leading-relaxed">{wedding.giftRegistryInfo}</p>
                            ) : (
                              <p className="text-gray-500 italic">{t('weddingEdit.noGiftRegistryInfo')}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          {t('weddingEdit.specialInstructionsOptional')}
                        </label>
                        {editMode ? (
                          <Textarea
                            value={weddingData?.specialInstructions || ''}
                            onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                            className="wedding-input min-h-[120px]"
                            placeholder={t('weddingEdit.specialInstructionsPlaceholder')}
                          />
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg min-h-[120px]">
                            {wedding.specialInstructions ? (
                              <p className="text-gray-800 leading-relaxed">{wedding.specialInstructions}</p>
                            ) : (
                              <p className="text-gray-500 italic">{t('weddingEdit.noSpecialInstructions')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests" className="space-y-6">
            <Card className="wedding-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#D4B08C]" />
                    {t('weddingEdit.guestListCount', { count: guests?.length || 0 })}
                  </CardTitle>
                  <Dialog open={isAddGuestDialogOpen} onOpenChange={setIsAddGuestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-[#D4B08C] hover:bg-[#C19B75] text-white">
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('guestList.addGuest')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{t('weddingEdit.addNewGuest')}</DialogTitle>
                      </DialogHeader>
                      <Form {...guestForm}>
                        <form onSubmit={guestForm.handleSubmit(onSubmitGuest)} className="space-y-4">
                          <FormField
                            control={guestForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('weddingEdit.nameRequired')}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder={t('weddingEdit.enterGuestName')} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={guestForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('form.email')}</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" placeholder={t('weddingEdit.enterEmailAddress')} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={guestForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('customer1.phone')}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder={t('weddingEdit.enterPhoneNumber')} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={guestForm.control}
                            name="rsvpStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('weddingEdit.rsvpStatus')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('weddingEdit.selectStatus')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pending">{t('guestList.pending')}</SelectItem>
                                    <SelectItem value="confirmed">{t('guestList.confirmed')}</SelectItem>
                                    <SelectItem value="declined">{t('guestList.declined')}</SelectItem>
                                    <SelectItem value="maybe">{t('guestList.maybe')}</SelectItem>
                                    <SelectItem value="confirmed_with_guest">{t('weddingEdit.confirmedWithGuest')}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAddGuestDialogOpen(false)}
                            >
                              {t('common.cancel')}
                            </Button>
                            <Button
                              type="submit"
                              className="bg-[#D4B08C] hover:bg-[#C19B75] text-white"
                              disabled={addGuestMutation.isPending}
                            >
                              {addGuestMutation.isPending ? t('weddingEdit.adding') : t('guestList.addGuest')}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {guestsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4B08C] mx-auto mb-4"></div>
                    <p className="text-[#2C3338]/70">{t('rsvp.loadingGuests')}</p>
                  </div>
                ) : guests && guests.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
                      <div>{t('form.name')}</div>
                      <div>{t('form.email')}</div>
                      <div>{t('weddingEdit.status')}</div>
                      <div>{t('form.message')}</div>
                      <div>{t('weddingEdit.respondedAt')}</div>
                    </div>
                    {guests.map(guest => (
                      <div key={guest.id} className="grid grid-cols-5 gap-4 text-sm border-b border-gray-100 py-3">
                        <div className="font-medium">{guest.name}</div>
                        <div>{guest.email || '-'}</div>
                        <div>
                          <Badge 
                            variant={
                              guest.rsvpStatus === 'confirmed' ? 'default' :
                              guest.rsvpStatus === 'declined' ? 'destructive' : 'secondary'
                            }
                            className="capitalize"
                          >
                            {guest.rsvpStatus}
                          </Badge>
                        </div>
                        <div className="truncate">{guest.message || '-'}</div>
                        <div className="text-xs text-gray-500">
                          {guest.respondedAt ? new Date(guest.respondedAt).toLocaleString() : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#2C3338]/70">
                    {t('weddingEdit.noGuestsAddedYet')}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            <Card className="wedding-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-[#D4B08C]" />
                  {t('manage.photoManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {photosLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4B08C] mx-auto mb-4"></div>
                    <p className="text-[#2C3338]/70">{t('weddingEdit.loadingPhotos')}</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Couple Photo Section */}
                    <div>
                      <h3 className="font-semibold text-[#2C3338] mb-4 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        {wedding?.template === 'birthday' ? t('weddingEdit.birthdayPersonPhotoHero') : t('weddingEdit.eventPhotoHero')}
                      </h3>

                      {/* Upload Section for Couple Photo */}
                      <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-center">
                          <Heart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <h4 className="font-medium text-gray-700 mb-2">
                            {wedding?.template === 'birthday' ? t('weddingEdit.uploadBirthdayPersonPhoto') : t('weddingEdit.uploadEventPhoto')}
                          </h4>
                          <p className="text-sm text-gray-500 mb-3">
                            {t('weddingEdit.photoNextToSection', { section: wedding?.template === 'birthday' ? t('weddingEdit.sectionBirthdayPerson') : t('weddingEdit.sectionEventDetailsLower') })}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const formData = new FormData();
                                  formData.append('photo', file);
                                  formData.append('photoType', 'couple');
                                  formData.append('weddingId', wedding?.id?.toString() || '');
                                  
                                  // Upload photo
                                  const response = await fetch('/api/photos/upload', {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  
                                  if (response.ok) {
                                    toast({
                                      title: t('weddingEdit.photoUploaded'),
                                      description: t('weddingEdit.photoUploadedDesc'),
                                    });
                                    queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
                                  } else {
                                    throw new Error('Upload failed');
                                  }
                                } catch (error) {
                                  toast({
                                    title: t('weddingEdit.uploadFailed'),
                                    description: t('weddingEdit.photoUploadFailedDesc'),
                                    variant: "destructive",
                                  });
                                }
                                // Reset input to allow same file selection
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                            id="couple-photo-upload"
                          />
                          <label
                            htmlFor="couple-photo-upload"
                            className="inline-flex items-center px-4 py-2 bg-[#D4B08C] text-white rounded-lg hover:bg-[#C19B75] cursor-pointer"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            {wedding?.template === 'birthday' ? t('weddingEdit.chooseBirthdayPersonPhoto') : t('weddingEdit.chooseCouplePhoto')}
                          </label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {photos && photos.filter((photo: any) => photo.photoType === 'couple').length > 0 ? (
                          photos.filter((photo: any) => photo.photoType === 'couple').map((photo: any) => (
                            <div key={photo.id} className="border rounded-lg p-4 space-y-3">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={photo.url}
                                  alt={photo.caption || (wedding?.template === 'birthday' ? t('weddingEdit.altBirthdayPersonPhoto') : t('weddingEdit.altCouplePhoto'))}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-2">
                                {photo.caption && (
                                  <p className="text-sm text-gray-600">{photo.caption}</p>
                                )}
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">
                                    {new Date(photo.uploadedAt).toLocaleDateString()}
                                  </span>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deletePhotoMutation.mutate(photo.id)}
                                    disabled={deletePhotoMutation.isPending}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            <Heart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p>{t('weddingEdit.noPhotoUploadedYet', { type: wedding?.template === 'birthday' ? t('weddingEdit.typeBirthdayPerson') : t('weddingEdit.typeCouple') })}</p>
                            <p className="text-sm text-gray-400 mt-1">{t('weddingEdit.photoNextToSection', { section: wedding?.template === 'birthday' ? t('weddingEdit.sectionBirthdayPerson') : t('weddingEdit.sectionHowWeMet') })}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Flower Template Specific Photos */}
                    {(editMode ? weddingData?.template : wedding?.template) === 'flower' && (
                      <div>
                        <h3 className="font-semibold text-[#2C3338] mb-4 flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          {t('weddingEdit.flowerTemplatePhotos')}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">{t('weddingEdit.flowerTemplatePhotosHint')}</p>

                        {/* Photo 1 - Hero Section */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-700 mb-3">{t('weddingEdit.flowerPhoto1Title')}</h4>
                          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                            <div className="text-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const formData = new FormData();
                                      formData.append('photo', file);
                                      formData.append('photoType', 'flower_photo_1');
                                      formData.append('weddingId', wedding?.id?.toString() || '');
                                      
                                      const response = await fetch('/api/photos/upload', {
                                        method: 'POST',
                                        body: formData,
                                      });
                                      
                                      if (response.ok) {
                                        toast({
                                          title: t('weddingEdit.photoUploaded'),
                                          description: t('weddingEdit.photoNUploadedDesc', { number: 1 }),
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
                                      } else {
                                        throw new Error('Upload failed');
                                      }
                                    } catch (error) {
                                      toast({
                                        title: t('weddingEdit.uploadFailed'),
                                        description: t('weddingEdit.photoUploadFailedDesc'),
                                        variant: "destructive",
                                      });
                                    }
                                    e.target.value = '';
                                  }
                                }}
                                className="hidden"
                                id="flower-photo-1-upload"
                              />
                              <label
                                htmlFor="flower-photo-1-upload"
                                className="inline-flex items-center px-4 py-2 bg-[#D4B08C] text-white rounded-lg hover:bg-[#C19B75] cursor-pointer"
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                {t('weddingEdit.uploadPhotoN', { number: 1 })}
                              </label>
                            </div>
                          </div>
                          {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_1').length > 0 && (
                            <div className="mt-3">
                              <img
                                src={photos.filter((photo: any) => photo.photoType === 'flower_photo_1')[0].url}
                                alt={t('weddingEdit.altPhotoN', { number: 1 })}
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                              />
                            </div>
                          )}
                        </div>

                        {/* Photo 2 - Dear Guest Section */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-700 mb-3">{t('weddingEdit.flowerPhoto2Title')}</h4>
                          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                            <div className="text-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const formData = new FormData();
                                      formData.append('photo', file);
                                      formData.append('photoType', 'flower_photo_2');
                                      formData.append('weddingId', wedding?.id?.toString() || '');
                                      
                                      const response = await fetch('/api/photos/upload', {
                                        method: 'POST',
                                        body: formData,
                                      });
                                      
                                      if (response.ok) {
                                        toast({
                                          title: t('weddingEdit.photoUploaded'),
                                          description: t('weddingEdit.photoNUploadedDesc', { number: 2 }),
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
                                      } else {
                                        throw new Error('Upload failed');
                                      }
                                    } catch (error) {
                                      toast({
                                        title: t('weddingEdit.uploadFailed'),
                                        description: t('weddingEdit.photoUploadFailedDesc'),
                                        variant: "destructive",
                                      });
                                    }
                                    e.target.value = '';
                                  }
                                }}
                                className="hidden"
                                id="flower-photo-2-upload"
                              />
                              <label
                                htmlFor="flower-photo-2-upload"
                                className="inline-flex items-center px-4 py-2 bg-[#D4B08C] text-white rounded-lg hover:bg-[#C19B75] cursor-pointer"
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                {t('weddingEdit.uploadPhotoN', { number: 2 })}
                              </label>
                              <p className="text-sm text-gray-500 mt-2">{t('weddingEdit.flowerPhoto2Hint')}</p>
                            </div>
                          </div>
                          {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_2').length > 0 && (
                            <div className="mt-3">
                              <img
                                src={photos.filter((photo: any) => photo.photoType === 'flower_photo_2')[0].url}
                                alt={t('weddingEdit.altPhotoN', { number: 2 })}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                              />
                            </div>
                          )}
                        </div>

                        {/* Photo 3 - Calendar Section */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-700 mb-3">{t('weddingEdit.flowerPhoto3Title')}</h4>
                          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                            <div className="text-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const formData = new FormData();
                                      formData.append('photo', file);
                                      formData.append('photoType', 'flower_photo_3');
                                      formData.append('weddingId', wedding?.id?.toString() || '');
                                      
                                      const response = await fetch('/api/photos/upload', {
                                        method: 'POST',
                                        body: formData,
                                      });
                                      
                                      if (response.ok) {
                                        toast({
                                          title: t('weddingEdit.photoUploaded'),
                                          description: t('weddingEdit.photoNUploadedDesc', { number: 3 }),
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
                                      } else {
                                        throw new Error('Upload failed');
                                      }
                                    } catch (error) {
                                      toast({
                                        title: t('weddingEdit.uploadFailed'),
                                        description: t('weddingEdit.photoUploadFailedDesc'),
                                        variant: "destructive",
                                      });
                                    }
                                    e.target.value = '';
                                  }
                                }}
                                className="hidden"
                                id="flower-photo-3-upload"
                              />
                              <label
                                htmlFor="flower-photo-3-upload"
                                className="inline-flex items-center px-4 py-2 bg-[#D4B08C] text-white rounded-lg hover:bg-[#C19B75] cursor-pointer"
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                {t('weddingEdit.uploadPhotoN', { number: 3 })}
                              </label>
                              <p className="text-sm text-gray-500 mt-2">{t('weddingEdit.flowerPhoto3Hint')}</p>
                            </div>
                          </div>
                          {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_3').length > 0 && (
                            <div className="mt-3">
                              <img
                                src={photos.filter((photo: any) => photo.photoType === 'flower_photo_3')[0].url}
                                alt={t('weddingEdit.altPhotoN', { number: 3 })}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                              />
                            </div>
                          )}
                        </div>

                        {/* Photo 4 - Location Section */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-700 mb-3">{t('weddingEdit.flowerPhoto4Title')}</h4>
                          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                            <div className="text-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const formData = new FormData();
                                      formData.append('photo', file);
                                      formData.append('photoType', 'flower_photo_4');
                                      formData.append('weddingId', wedding?.id?.toString() || '');
                                      
                                      const response = await fetch('/api/photos/upload', {
                                        method: 'POST',
                                        body: formData,
                                      });
                                      
                                      if (response.ok) {
                                        toast({
                                          title: t('weddingEdit.photoUploaded'),
                                          description: t('weddingEdit.photoNUploadedDesc', { number: 4 }),
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
                                      } else {
                                        throw new Error('Upload failed');
                                      }
                                    } catch (error) {
                                      toast({
                                        title: t('weddingEdit.uploadFailed'),
                                        description: t('weddingEdit.photoUploadFailedDesc'),
                                        variant: "destructive",
                                      });
                                    }
                                    e.target.value = '';
                                  }
                                }}
                                className="hidden"
                                id="flower-photo-4-upload"
                              />
                              <label
                                htmlFor="flower-photo-4-upload"
                                className="inline-flex items-center px-4 py-2 bg-[#D4B08C] text-white rounded-lg hover:bg-[#C19B75] cursor-pointer"
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                {t('weddingEdit.uploadPhotoN', { number: 4 })}
                              </label>
                            </div>
                          </div>
                          {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_4').length > 0 && (
                            <div className="mt-3">
                              <img
                                src={photos.filter((photo: any) => photo.photoType === 'flower_photo_4')[0].url}
                                alt={t('weddingEdit.altPhotoN', { number: 4 })}
                                className="w-32 h-20 object-cover rounded-lg border-2 border-gray-200"
                              />
                            </div>
                          )}
                        </div>

                        {/* Photo 5 & 6 - Additional Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-3">{t('weddingEdit.flowerPhoto5Title')}</h4>
                            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                              <div className="text-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const formData = new FormData();
                                        formData.append('photo', file);
                                        formData.append('photoType', 'flower_photo_5');
                                        formData.append('weddingId', wedding?.id?.toString() || '');
                                        
                                        const response = await fetch('/api/photos/upload', {
                                          method: 'POST',
                                          body: formData,
                                        });
                                        
                                        if (response.ok) {
                                          toast({
                                            title: t('weddingEdit.photoUploaded'),
                                            description: t('weddingEdit.photoNUploadedDesc', { number: 5 }),
                                          });
                                          queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
                                        } else {
                                          throw new Error('Upload failed');
                                        }
                                      } catch (error) {
                                        toast({
                                          title: t('weddingEdit.uploadFailed'),
                                          description: t('weddingEdit.photoUploadFailedDesc'),
                                          variant: "destructive",
                                        });
                                      }
                                      e.target.value = '';
                                    }
                                  }}
                                  className="hidden"
                                  id="flower-photo-5-upload"
                                />
                                <label
                                  htmlFor="flower-photo-5-upload"
                                  className="inline-flex items-center px-4 py-2 bg-[#D4B08C] text-white rounded-lg hover:bg-[#C19B75] cursor-pointer"
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  {t('weddingEdit.uploadPhotoN', { number: 5 })}
                                </label>
                              </div>
                            </div>
                            {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_5').length > 0 && (
                              <div className="mt-3">
                                <img
                                  src={photos.filter((photo: any) => photo.photoType === 'flower_photo_5')[0].url}
                                  alt={t('weddingEdit.altPhotoN', { number: 5 })}
                                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-3">{t('weddingEdit.flowerPhoto6Title')}</h4>
                            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                              <div className="text-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const formData = new FormData();
                                        formData.append('photo', file);
                                        formData.append('photoType', 'flower_photo_6');
                                        formData.append('weddingId', wedding?.id?.toString() || '');
                                        
                                        const response = await fetch('/api/photos/upload', {
                                          method: 'POST',
                                          body: formData,
                                        });
                                        
                                        if (response.ok) {
                                          toast({
                                            title: t('weddingEdit.photoUploaded'),
                                            description: t('weddingEdit.photoNUploadedDesc', { number: 6 }),
                                          });
                                          queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
                                        } else {
                                          throw new Error('Upload failed');
                                        }
                                      } catch (error) {
                                        toast({
                                          title: t('weddingEdit.uploadFailed'),
                                          description: t('weddingEdit.photoUploadFailedDesc'),
                                          variant: "destructive",
                                        });
                                      }
                                      e.target.value = '';
                                    }
                                  }}
                                  className="hidden"
                                  id="flower-photo-6-upload"
                                />
                                <label
                                  htmlFor="flower-photo-6-upload"
                                  className="inline-flex items-center px-4 py-2 bg-[#D4B08C] text-white rounded-lg hover:bg-[#C19B75] cursor-pointer"
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  {t('weddingEdit.uploadPhotoN', { number: 6 })}
                                </label>
                              </div>
                            </div>
                            {photos && photos.filter((photo: any) => photo.photoType === 'flower_photo_6').length > 0 && (
                              <div className="mt-3">
                                <img
                                  src={photos.filter((photo: any) => photo.photoType === 'flower_photo_6')[0].url}
                                  alt={t('weddingEdit.altPhotoN', { number: 6 })}
                                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}


                    {/* Memory Photos Section */}
                    <div>
                      <h3 className="font-semibold text-[#2C3338] mb-4 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        {t('weddingEdit.ourMemoriesGallery')}
                      </h3>

                      {/* Upload Section for Memory Photos */}
                      <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-center">
                          <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <h4 className="font-medium text-gray-700 mb-2">{t('weddingEdit.uploadMemoryPhotos')}</h4>
                          <p className="text-sm text-gray-500 mb-3">{t('weddingEdit.memoryPhotosHint')}</p>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) return;
                              
                              let successCount = 0;
                              let errorCount = 0;
                              
                              for (const file of files) {
                                try {
                                  const formData = new FormData();
                                  formData.append('photo', file);
                                  formData.append('photoType', 'memory');
                                  formData.append('weddingId', wedding?.id?.toString() || '');
                                  
                                  // Upload photo
                                  const response = await fetch('/api/photos/upload', {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  
                                  if (response.ok) {
                                    successCount++;
                                  } else {
                                    errorCount++;
                                  }
                                } catch (error) {
                                  errorCount++;
                                }
                              }
                              
                              // Show toast based on results
                              if (successCount > 0) {
                                toast({
                                  title: t('weddingEdit.photosUploaded'),
                                  description: errorCount > 0
                                    ? t('weddingEdit.photosUploadedWithErrors', { count: successCount, errorCount })
                                    : t('weddingEdit.photosUploadedSuccess', { count: successCount }),
                                });
                                queryClient.invalidateQueries({ queryKey: ['/api/photos/wedding', wedding?.id] });
                              } else {
                                toast({
                                  title: t('weddingEdit.uploadFailed'),
                                  description: t('weddingEdit.photosUploadFailedDesc'),
                                  variant: "destructive",
                                });
                              }
                              
                              // Reset input to allow same file selection
                              e.target.value = '';
                            }}
                            className="hidden"
                            id="memory-photos-upload"
                          />
                          <label
                            htmlFor="memory-photos-upload"
                            className="inline-flex items-center px-4 py-2 bg-[#D4B08C] text-white rounded-lg hover:bg-[#C19B75] cursor-pointer"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            {t('weddingEdit.chooseMemoryPhotos')}
                          </label>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos && photos.filter((photo: any) => photo.photoType === 'memory').length > 0 ? (
                          photos.filter((photo: any) => photo.photoType === 'memory').map((photo: any) => (
                            <div key={photo.id} className="border rounded-lg p-3 space-y-2">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={photo.url}
                                  alt={photo.caption || t('weddingEdit.altMemoryPhoto')}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-1">
                                {photo.caption && (
                                  <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
                                )}
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">
                                    {new Date(photo.uploadedAt).toLocaleDateString()}
                                  </span>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deletePhotoMutation.mutate(photo.id)}
                                    disabled={deletePhotoMutation.isPending}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-4 text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p>{t('weddingEdit.noMemoryPhotosUploaded')}</p>
                            <p className="text-sm text-gray-400 mt-1">{t('weddingEdit.memoryPhotosHint')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Photo Statistics */}
                    {photos && photos.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">{t('wedding.couplePhotos')}</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {photos.filter((photo: any) => photo.photoType === 'couple').length}
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">{t('weddingEdit.memoryPhotos')}</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600 mt-1">
                            {photos.filter((photo: any) => photo.photoType === 'memory').length}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">{t('weddingEdit.totalPhotos')}</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600 mt-1">
                            {photos.length}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="wedding-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#D4B08C]" />
                  {t('weddingEdit.weddingSettings')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium text-[#2C3338]">{t('weddingEdit.uniqueUrl')}</h3>
                      <p className="text-sm text-[#2C3338]/70">{t('weddingEdit.weddingWebsiteAddress')}</p>
                    </div>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                      /wedding/{wedding.uniqueUrl}
                    </code>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium text-[#2C3338]">{t('manage.template')}</h3>
                      <p className="text-sm text-[#2C3338]/70">{t('weddingEdit.currentDesignTemplate')}</p>
                    </div>
                    <Badge variant="outline">{wedding.template || 'Default'}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium text-[#2C3338]">{t('weddingEdit.created')}</h3>
                      <p className="text-sm text-[#2C3338]/70">{t('weddingEdit.weddingCreationDate')}</p>
                    </div>
                    <span className="text-sm text-[#2C3338]/70">
                      {new Date(wedding.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  PieChart,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { insertGuestSchema, type Guest } from '@shared/schema';
import { z } from 'zod';

interface GuestManagementProps {
  weddingId: number;
}

const addGuestSchema = insertGuestSchema.extend({
  weddingId: z.number()
});

type AddGuestFormData = z.infer<typeof addGuestSchema>;

export function GuestManagementDashboard({ weddingId }: GuestManagementProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [commentFilter, setCommentFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ['/api/guests/wedding', weddingId],
    enabled: !!weddingId,
  });

  const form = useForm<AddGuestFormData>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: {
      weddingId,
      name: '',
      email: '',
      phone: '',
      rsvpStatus: 'pending',
      plusOne: false,
      dietaryRestrictions: '',
      notes: '',
    },
  });

  const addGuestMutation = useMutation({
    mutationFn: (data: AddGuestFormData) => apiRequest('POST', '/api/guests', data),
    onSuccess: () => {
      toast({
        title: t('guests.guestAdded'),
        description: t('guests.guestAddedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/guests/wedding', weddingId] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('guests.addGuestError'),
        variant: 'destructive',
      });
    },
  });

  // Analytics calculations
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter(g => g.rsvpStatus === 'confirmed').length;
  const confirmedWithGuestGuests = guests.filter(g => g.rsvpStatus === 'confirmed_with_guest').length;
  const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending').length;
  const declinedGuests = guests.filter(g => g.rsvpStatus === 'declined').length;
  const maybeGuests = guests.filter(g => g.rsvpStatus === 'maybe').length;
  const guestsWithComments = guests.filter(g => g.message && g.message.trim()).length;
  
  // Total attendees including +1 guests
  const totalAttendees = confirmedGuests + (confirmedWithGuestGuests * 2); // Each confirmed_with_guest counts as 2 people
  const allConfirmedGuests = confirmedGuests + confirmedWithGuestGuests;
  const responseRate = totalGuests > 0 ? ((allConfirmedGuests + declinedGuests + maybeGuests) / totalGuests) * 100 : 0;

  // Filter guests based on search, status, and comments
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (guest.message?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || guest.rsvpStatus === statusFilter;
    const matchesComment = commentFilter === 'all' || 
                          (commentFilter === 'with-comments' && guest.message) ||
                          (commentFilter === 'no-comments' && !guest.message);
    return matchesSearch && matchesStatus && matchesComment;
  });

  const onSubmit = (data: AddGuestFormData) => {
    addGuestMutation.mutate(data);
  };

  const getStatusBadge = (status: string, responseText?: string | null, plusOne?: boolean) => {
    const variants = {
      confirmed: 'default',
      confirmed_with_guest: 'default',
      pending: 'secondary',
      declined: 'destructive',
      maybe: 'outline'
    } as const;
    
    // Determine display text based on status
    let displayText = '';
    let badgeColor = '';
    
    switch (status) {
      case 'confirmed':
        displayText = '✅ Ha, albatta boraman!';
        badgeColor = 'text-green-600 bg-green-50 border-green-200';
        break;
      case 'confirmed_with_guest':
        displayText = '👥 Ha, mehmon bilan boraman';
        badgeColor = 'text-blue-600 bg-blue-50 border-blue-200';
        break;
      case 'declined':
        displayText = '❌ Afsus, kela olmayman';
        badgeColor = 'text-red-600 bg-red-50 border-red-200';
        break;
      case 'maybe':
        displayText = '😐 Hali aniq emas';
        badgeColor = 'text-yellow-600 bg-yellow-50 border-yellow-200';
        break;
      case 'pending':
        displayText = 'Kutilmoqda';
        badgeColor = 'text-gray-600 bg-gray-50 border-gray-200';
        break;
      default:
        displayText = responseText || status;
        badgeColor = 'text-gray-600 bg-gray-50 border-gray-200';
    }
    
    return (
      <Badge variant="outline" className={badgeColor}>
        {displayText}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'declined': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatCommentPreview = (message: string | null) => {
    if (!message) return null;
    const preview = message.length > 20 ? `${message.substring(0, 20)}...` : message;
    return preview;
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    } catch {
      return typeof date === 'string' ? date : '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span className="truncate">{t('guests.totalGuests')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{totalGuests}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalAttendees} {t('guestList.attendees') || 'attendees'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="truncate">{t('guestList.confirmed')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{confirmedGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              <span className="truncate">{t('guestList.withGuest')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-blue-500">{confirmedWithGuestGuests}</div>
            <div className="text-xs text-gray-500 mt-1">
              +{confirmedWithGuestGuests} {t('guestList.additional') || 'additional'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              <span className="truncate">{t('guestList.pending')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{pendingGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              <span className="truncate">{t('guestList.responseRate')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold">{responseRate.toFixed(1)}%</div>
            <Progress value={responseRate} className="mt-1 sm:mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('guests.guestManagement')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('guests.exportList')}
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="wedding-button">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('guests.addGuest')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('guests.addNewGuest')}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('guests.guestName')}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t('guests.enterName')} />
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
                            <FormLabel>{t('guests.email')}</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder={t('guests.enterEmail')} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('guests.phone')}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t('guests.enterPhone')} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rsvpStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('guests.rsvpStatus')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">{t('guests.status.pending')}</SelectItem>
                                <SelectItem value="confirmed">{t('guests.status.confirmed')}</SelectItem>
                                <SelectItem value="declined">{t('guests.status.declined')}</SelectItem>
                                <SelectItem value="maybe">{t('guests.status.maybe')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(false)}
                          className="flex-1"
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={addGuestMutation.isPending}
                          className="wedding-button flex-1"
                        >
                          {addGuestMutation.isPending ? t('common.saving') : t('guests.addGuest')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">{t('guests.guestList')}</TabsTrigger>
              <TabsTrigger value="analytics">{t('guests.analytics')}</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('guestList.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('guestList.filterByStatus') || 'Filter by status'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('guestList.all')}</SelectItem>
                      <SelectItem value="pending">{t('guestList.pending')}</SelectItem>
                      <SelectItem value="confirmed">{t('guestList.confirmed')}</SelectItem>
                      <SelectItem value="confirmed_with_guest">{t('guestList.withGuest')}</SelectItem>
                      <SelectItem value="declined">{t('guestList.declined')}</SelectItem>
                      <SelectItem value="maybe">{t('guestList.maybe')}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={commentFilter} onValueChange={setCommentFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter comments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('guestList.all')}</SelectItem>
                      <SelectItem value="with-comments">{t('guestList.withComments')}</SelectItem>
                      <SelectItem value="no-comments">{t('guestList.noComments')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Guest List */}
              <div className="space-y-3">
                {filteredGuests.map((guest) => (
                  <Card key={guest.id} className="p-3 sm:p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0 mt-0.5">
                            {getStatusIcon(guest.rsvpStatus)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium flex items-center gap-2 mb-1">
                              <span className="truncate">{guest.name}</span>
                              {guest.message && (
                                <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="space-y-1">
                              {guest.email && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{guest.email}</span>
                                </div>
                              )}
                              {guest.phone && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <span>{guest.phone}</span>
                                </div>
                              )}
                              {guest.respondedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span>{formatDate(guest.respondedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            {guest.plusOne && (
                              <Badge variant="outline" className="text-xs">+1</Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedGuest(guest)}
                              className="p-1"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                          {getStatusBadge(guest.rsvpStatus, guest.responseText, guest.plusOne)}
                        </div>
                      </div>
                      
                      {/* Comment Preview */}
                      {guest.message && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border-l-4 border-blue-200">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Comment:</span>{' '}
                                {formatCommentPreview(guest.message)}
                              </p>
                              {guest.message.length > 20 && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                                  onClick={() => setSelectedGuest(guest)}
                                >
                                  Read full comment
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {filteredGuests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || statusFilter !== 'all' || commentFilter !== 'all'
                    ? t('guests.noGuestsFound') 
                    : t('guests.noGuestsYet')
                  }
                </div>
              )}
            </TabsContent>

            {/* Guest Detail Modal */}
            {selectedGuest && (
              <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {getStatusIcon(selectedGuest.rsvpStatus)}
                      {selectedGuest.name}
                      {selectedGuest.message && (
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Guest Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">RSVP Status</label>
                        <div className="mt-1">{getStatusBadge(selectedGuest.rsvpStatus, selectedGuest.responseText, selectedGuest.plusOne)}</div>
                      </div>
                      
                      {selectedGuest.email && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <div className="mt-1 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{selectedGuest.email}</span>
                          </div>
                        </div>
                      )}
                      
                      {selectedGuest.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone</label>
                          <div className="mt-1 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{selectedGuest.phone}</span>
                          </div>
                        </div>
                      )}
                      
                      {selectedGuest.respondedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Response Date</label>
                          <div className="mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{formatDate(selectedGuest.respondedAt)}</span>
                          </div>
                        </div>
                      )}
                      
                      {selectedGuest.plusOne && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Plus One</label>
                          <div className="mt-1">
                            <Badge variant="outline">
                              {selectedGuest.plusOneName || 'Plus One Invited'}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Full Comment Display */}
                    {selectedGuest.message && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Guest Comment
                        </label>
                        <div className="mt-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border-l-4 border-blue-200">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedGuest.message}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <div className="mt-1">
                          <Badge variant="outline">{selectedGuest.category || 'Not specified'}</Badge>
                        </div>
                      </div>
                      
                      {selectedGuest.side && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Wedding Side</label>
                          <div className="mt-1">
                            <Badge variant="outline">
                              {selectedGuest.side === 'bride' ? "Bride's Side" : 
                               selectedGuest.side === 'groom' ? "Groom's Side" : 'Both Sides'}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedGuest.dietaryRestrictions && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Dietary Restrictions</label>
                        <div className="mt-1 text-sm text-gray-600">
                          {selectedGuest.dietaryRestrictions}
                        </div>
                      </div>
                    )}

                    {selectedGuest.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Internal Notes</label>
                        <div className="mt-1 text-sm text-gray-600">
                          {selectedGuest.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      {t('guests.rsvpBreakdown')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          {t('guestList.confirmed')}
                        </span>
                        <span className="font-medium">{confirmedGuests}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          {t('guestList.withGuest')}
                        </span>
                        <span className="font-medium">{confirmedWithGuestGuests}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          {t('guestList.pending')}
                        </span>
                        <span className="font-medium">{pendingGuests}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          {t('guestList.declined')}
                        </span>
                        <span className="font-medium">{declinedGuests}</span>
                      </div>
                      {maybeGuests > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            {t('guestList.maybe')}
                          </span>
                          <span className="font-medium">{maybeGuests}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('guests.responseProgress')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-2xl font-bold">{responseRate.toFixed(1)}%</div>
                      <Progress value={responseRate} className="h-3" />
                      <p className="text-sm text-gray-600">
                        {allConfirmedGuests + declinedGuests + maybeGuests} dan {totalGuests} mehmon javob berdi
                      </p>
                      <p className="text-xs text-gray-500">
                        Jami keluvchilar: {totalAttendees} kishi
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Guest Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-2xl font-bold">{guestsWithComments}</div>
                      <div className="text-sm text-gray-600">
                        out of {totalGuests} guests
                      </div>
                      <div className="text-xs text-gray-500">
                        {totalGuests > 0 ? ((guestsWithComments / totalGuests) * 100).toFixed(1) : 0}% left comments
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Comments */}
              {guestsWithComments > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Recent Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {guests
                        .filter(g => g.message && g.message.trim())
                        .slice(0, 3)
                        .map((guest) => (
                          <div key={guest.id} className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border-l-4 border-blue-200">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{guest.name}</span>
                                  {getStatusBadge(guest.rsvpStatus, guest.responseText, guest.plusOne)}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {guest.message}
                                </p>
                                {guest.respondedAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(guest.respondedAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      
                      {guestsWithComments > 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCommentFilter('with-comments')}
                          className="w-full"
                        >
                          View all {guestsWithComments} comments
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
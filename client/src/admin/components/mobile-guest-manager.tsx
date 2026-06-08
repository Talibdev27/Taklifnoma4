import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, Search, Edit, Trash2, Mail, Phone,
  CheckCircle, XCircle, Clock, UserPlus, MessageSquare
} from 'lucide-react';
import { AddGuestDialog } from '@/admin/components/add-guest-dialog';
import type { Guest } from '@shared/schema';

interface MobileGuestManagerProps {
  weddingId: number;
  weddingTitle?: string;
  className?: string;
}

export function MobileGuestManager({ weddingId, weddingTitle, className = '' }: MobileGuestManagerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch guests
  const { data: guests = [], isLoading } = useQuery<Guest[]>({
    queryKey: [`/api/guests/wedding/${weddingId}`],
    enabled: !!weddingId,
  });

  // Update guest status mutation
  const updateGuestMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Guest['rsvpStatus'] }) => 
      apiRequest('PATCH', `/api/guests/${id}`, { 
        rsvpStatus: status,
        respondedAt: new Date(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/guests/wedding/${weddingId}`] });
      toast({
        title: t('guestList.guestUpdated'),
        description: t('guestList.guestUpdatedSuccess'),
      });
    },
  });

  // Delete guest mutation
  const deleteGuestMutation = useMutation({
    mutationFn: (guestId: number) => apiRequest('DELETE', `/api/guests/${guestId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/guests/wedding/${weddingId}`] });
      toast({
        title: t('guestList.guestDeleted'),
        description: t('guestList.guestDeletedSuccess'),
      });
    },
  });

  const handleStatusUpdate = (guestId: number, status: Guest['rsvpStatus']) => {
    updateGuestMutation.mutate({ id: guestId, status });
  };

  // Filter guests
  const filteredGuests = guests.filter((guest: Guest) => {
    if (!guest || !guest.name) return false; // Safety check
    
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.phone?.includes(searchTerm) ||
                         guest.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || guest.rsvpStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: guests.length,
    confirmed: guests.filter((g: Guest) => g.rsvpStatus === 'confirmed').length,
    confirmedWithGuest: guests.filter((g: Guest) => g.rsvpStatus === 'confirmed_with_guest').length,
    declined: guests.filter((g: Guest) => g.rsvpStatus === 'declined').length,
    pending: guests.filter((g: Guest) => g.rsvpStatus === 'pending').length,
    maybe: guests.filter((g: Guest) => g.rsvpStatus === 'maybe').length,
    withComments: guests.filter((g: Guest) => g.message && g.message.trim()).length,
  };

  const getStatusBadge = (status: Guest['rsvpStatus'], responseText?: string | null, plusOne?: boolean) => {
    const statusConfig = {
      confirmed: { 
        variant: 'default' as const, 
        label: t('guestList.confirmed'),
        className: 'bg-green-100 text-green-800 border-2 border-green-300'
      },
      confirmed_with_guest: { 
        variant: 'default' as const, 
        label: t('rsvp.confirmedWithGuestEmoji'),
        className: 'bg-blue-100 text-blue-800 border-2 border-blue-300'
      },
      declined: { 
        variant: 'destructive' as const, 
        label: t('guestList.declined'),
        className: 'bg-red-100 text-red-800 border-2 border-red-300'
      },
      pending: { 
        variant: 'secondary' as const, 
        label: t('guestList.pending'),
        className: 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
      },
      maybe: { 
        variant: 'outline' as const, 
        label: t('guestList.maybe'),
        className: 'bg-blue-100 text-blue-800 border-2 border-blue-300'
      },
    };

    const config = statusConfig[status] || statusConfig.pending; // Fallback to pending if status is invalid
    
    // Determine display text based on current UI language
    let displayText = config.label; // Default fallback
    
    if (status === 'confirmed_with_guest') {
      // "With guest" option
      displayText = t('rsvp.confirmedWithGuestEmoji');
    } else if (status === 'confirmed') {
      // Regular confirmation
      displayText = t('rsvp.confirmedEmoji');
    } else if (status === 'declined') {
      displayText = t('rsvp.declinedEmoji');
    } else if (status === 'maybe') {
      displayText = t('rsvp.maybeEmoji');
    }
    
    // Fallback to responseText only if translation is not available
    if (!displayText || displayText.includes('rsvp.')) {
      displayText = responseText || config.label;
    }
    
    return (
      <Badge 
        variant={config.variant}
        className={`text-lg font-bold px-6 py-3 rounded-xl ${config.className}`}
      >
        {displayText.toUpperCase()}
      </Badge>
    );
  };

  const getStatusIcon = (status: Guest['rsvpStatus']) => {
    const icons = {
      confirmed: <CheckCircle className="h-4 w-4 text-green-500" />,
      confirmed_with_guest: <CheckCircle className="h-4 w-4 text-blue-500" />,
      declined: <XCircle className="h-4 w-4 text-red-500" />,
      pending: <Clock className="h-4 w-4 text-yellow-500" />,
      maybe: <Clock className="h-4 w-4 text-blue-500" />,
    };

    return icons[status] || icons.pending; // Fallback to pending icon if status is invalid
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const responseRate = stats.total > 0 ? Math.round(((stats.confirmed + stats.confirmedWithGuest + stats.declined + stats.maybe) / stats.total) * 100) : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mobile-First Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{weddingTitle || t('guestManager.weddingFallback')}</h1>
        <p className="text-base text-gray-600">{t('manage.guestManagement')}</p>
      </div>

      {/* Mobile-Optimized Statistics Section - Vertical Stack */}
      <div className="space-y-4">
        {/* TASDIQLANGAN */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-lg font-semibold text-gray-900">{t('guestList.confirmed').toUpperCase()}</span>
            </div>
            <span className="text-3xl font-bold text-green-600">{stats.confirmed}</span>
          </div>
        </div>

        {/* MEHMON BILAN */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-lg font-semibold text-gray-900">
                {(() => {
                  const translation = t('guestList.withGuest');
                  // Check if translation returned the key itself (no translation found)
                  if (translation === 'guestList.withGuest' || !translation) {
                    return t('guestManager.withGuestFallback').toUpperCase();
                  }
                  return translation.toUpperCase();
                })()}
              </span>
            </div>
            <span className="text-3xl font-bold text-blue-600">{stats.confirmedWithGuest || 0}</span>
          </div>
        </div>

        {/* KUTILMOQDA */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-lg font-semibold text-gray-900">{t('guestList.pending').toUpperCase()}</span>
            </div>
            <span className="text-3xl font-bold text-yellow-600">{stats.pending}</span>
          </div>
        </div>

        {/* EHTIMOL */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-lg font-semibold text-gray-900">{t('guestList.maybe').toUpperCase()}</span>
            </div>
            <span className="text-3xl font-bold text-blue-600">{stats.maybe}</span>
          </div>
        </div>

        {/* RAD ETILGAN */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-lg font-semibold text-gray-900">{t('guestList.declined').toUpperCase()}</span>
            </div>
            <span className="text-3xl font-bold text-red-600">{stats.declined}</span>
          </div>
        </div>

        {/* IZOHLAR */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              <span className="text-lg font-semibold text-gray-900">
                {(() => {
                  const translation = t('guestList.comments');
                  // Check if translation returned the key itself (no translation found)
                  if (translation === 'guestList.comments' || !translation) {
                    return t('guestManager.commentsFallback').toUpperCase();
                  }
                  return translation.toUpperCase();
                })()}
              </span>
            </div>
            <span className="text-3xl font-bold text-purple-600">{stats.withComments}</span>
          </div>
        </div>
      </div>

      {/* Response Rate Progress */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-900">{t('guestList.responseRate')}</span>
          <span className="text-2xl font-bold text-green-600">{responseRate}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${responseRate}%` }}
          ></div>
        </div>
        <div className="mt-4 text-base text-gray-600">
          {t('guestList.responseStats', { 
            responded: stats.confirmed + stats.confirmedWithGuest + stats.declined + stats.maybe, 
            total: stats.total 
          })}
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t('guestList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-14 pr-5 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          
          {/* Filter Buttons - Mobile Optimized */}
          <div className="flex flex-col gap-3">
            {[
              { key: 'all', label: t('guestList.all') },
              { key: 'confirmed', label: t('guestList.confirmed') },
              { 
                key: 'confirmed_with_guest', 
                label: (() => {
                  const translation = t('guestList.withGuest');
                  if (translation === 'guestList.withGuest' || !translation) {
                    return t('guestManager.withGuestFallback');
                  }
                  return translation;
                })()
              },
              { key: 'pending', label: t('guestList.pending') },
              { key: 'maybe', label: t('guestList.maybe') },
              { key: 'declined', label: t('guestList.declined') }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`w-full h-12 px-6 rounded-xl text-lg font-medium transition-all ${
                  statusFilter === filter.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guest Comments Section - Mobile-Optimized Cards */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('guestList.title')}</h2>
        <div className="space-y-4">
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">{t('guestList.noGuests')}</h3>
              <p className="text-lg text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? t('guestList.adjustFilters') 
                  : t('guestList.noGuestsYet')
                }
              </p>
            </div>
          ) : (
            filteredGuests.map((guest: Guest) => (
              <div key={guest.id} className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                {/* Guest Name - Large and Bold at Top */}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{guest.name}</h3>
                  
                  {/* Contact Info */}
                  <div className="space-y-2">
                    {guest.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <span className="text-lg text-gray-600">{guest.phone}</span>
                      </div>
                    )}
                    {guest.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="text-lg text-gray-600 break-all">{guest.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge - Below Name */}
                <div className="mb-4">
                  {getStatusBadge(guest.rsvpStatus, guest.responseText, guest.plusOne)}
                </div>

                {/* Message Section - At Bottom in Styled Container */}
                {guest.message && (
                  <div className="mb-4">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-blue-900 mb-2">{t('guestList.message')}:</p>
                          <p className="text-lg text-blue-800 leading-relaxed break-words">
                            {guest.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Only Delete for Guest Managers */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={() => deleteGuestMutation.mutate(guest.id)}
                    className="h-12 text-lg font-medium w-full max-w-xs"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    {t('guestList.deleteGuest')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button - Larger for Mobile */}
      <div className="fixed bottom-8 right-8 z-50">
        <AddGuestDialog weddingId={weddingId} />
      </div>
    </div>
  );
} 
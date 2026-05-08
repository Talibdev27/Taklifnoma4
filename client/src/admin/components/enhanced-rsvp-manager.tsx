import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Guest, Wedding } from '@shared/schema';
import { User, Mail, Phone, Check, X, Clock, HelpCircle, Users, Search, Filter, MessageSquare, Calendar } from 'lucide-react';

interface EnhancedRSVPManagerProps {
  wedding: Wedding;
  guests: Guest[];
  className?: string;
}

export function EnhancedRSVPManager({ wedding, guests, className = '' }: EnhancedRSVPManagerProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [commentFilter, setCommentFilter] = useState<string>('all');
  const [selectedGuests, setSelectedGuests] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter guests based on search, status, and comments
  const filteredGuests = (guests || []).filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (guest.message && guest.message.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStatus = statusFilter === 'all' || guest.rsvpStatus === statusFilter;
    const matchesComment = commentFilter === 'all' || 
                          (commentFilter === 'with-comments' && guest.message && guest.message.trim()) ||
                          (commentFilter === 'no-comments' && (!guest.message || !guest.message.trim()));
    return matchesSearch && matchesStatus && matchesComment;
  });

  // Calculate RSVP statistics
  const stats = {
    total: (guests || []).length,
    confirmed: (guests || []).filter(g => g.rsvpStatus === 'confirmed').length,
    pending: (guests || []).filter(g => g.rsvpStatus === 'pending').length,
    declined: (guests || []).filter(g => g.rsvpStatus === 'declined').length,
    maybe: (guests || []).filter(g => g.rsvpStatus === 'maybe').length,
    withComments: (guests || []).filter(g => g.message && g.message.trim()).length,
  };

  const responseRate = stats.total > 0 
    ? Math.round(((stats.confirmed + stats.declined + stats.maybe) / stats.total) * 100)
    : 0;

  // One-click RSVP update mutation
  const updateRSVPMutation = useMutation({
    mutationFn: async ({ guestId, status }: { guestId: number; status: string }) => {
      const response = await fetch(`/api/guests/${guestId}/rsvp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvpStatus: status, respondedAt: new Date() })
      });
      if (!response.ok) throw new Error('Failed to update RSVP');
      return response.json();
    },
    onSuccess: (updatedGuest) => {
      queryClient.invalidateQueries({ queryKey: [`/api/guests/wedding/${wedding.id}`] });
      toast({
        title: "RSVP Updated!",
        description: `${updatedGuest.name}'s RSVP status has been updated to ${updatedGuest.rsvpStatus}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update RSVP status. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Bulk action mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ guestIds, action }: { guestIds: number[]; action: string }) => {
      const promises = guestIds.map(guestId => 
        fetch(`/api/guests/${guestId}/rsvp`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rsvpStatus: action, respondedAt: new Date() })
        })
      );
      const responses = await Promise.all(promises);
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/guests/wedding/${wedding.id}`] });
      setSelectedGuests([]);
      setBulkAction('');
      toast({
        title: "Bulk Update Complete!",
        description: `Updated ${selectedGuests.length} guest(s) successfully.`,
      });
    }
  });

  const handleBulkAction = () => {
    if (selectedGuests.length === 0 || !bulkAction) return;
    bulkUpdateMutation.mutate({ guestIds: selectedGuests, action: bulkAction });
  };

  const toggleGuestSelection = (guestId: number) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const selectAll = () => {
    setSelectedGuests(
      selectedGuests.length === filteredGuests.length 
        ? [] 
        : filteredGuests.map(guest => guest.id)
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Check className="h-4 w-4 text-green-600" />;
      case 'declined': return <X className="h-4 w-4 text-red-600" />;
      case 'maybe': return <HelpCircle className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'maybe': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* RSVP Progress Overview */}
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
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>{t('guests.responseRatePercent')}</span>
              <span className="font-medium">{responseRate}% ({stats.total - stats.pending} {t('guests.outOf')} {stats.total})</span>
            </div>
            <Progress value={responseRate} className="w-full h-3" />
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-xs sm:text-sm text-green-700 font-medium">{t('guests.status.confirmed')}</div>
            </div>
            <div className="text-center p-2 sm:p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs sm:text-sm text-yellow-700 font-medium">{t('guests.status.pending')}</div>
            </div>
            <div className="text-center p-2 sm:p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.maybe}</div>
              <div className="text-xs sm:text-sm text-blue-700 font-medium">{t('guests.status.maybe')}</div>
            </div>
            <div className="text-center p-2 sm:p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.declined}</div>
              <div className="text-xs sm:text-sm text-red-700 font-medium">{t('guests.status.declined')}</div>
            </div>
            <div className="text-center p-2 sm:p-4 rounded-lg bg-purple-50 border border-purple-200 col-span-2 sm:col-span-1">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{stats.withComments}</div>
              <div className="text-xs sm:text-sm text-purple-700 font-medium flex items-center justify-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Comments
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guest Management Tools */}
      <Card>
        <CardHeader>
          <CardTitle>{t('guests.guestManagementTools')}</CardTitle>
          <CardDescription>
            {t('guests.searchFilterTools')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="space-y-4">
            <div className="w-full">
              <Label htmlFor="search" className="text-sm font-medium">{t('guests.searchGuests')}</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search guests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="status-filter" className="text-sm font-medium">{t('guests.filterByStatus')}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full mt-1">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('guests.allStatus')}</SelectItem>
                    <SelectItem value="confirmed">{t('guests.status.confirmed')}</SelectItem>
                    <SelectItem value="pending">{t('guests.status.pending')}</SelectItem>
                    <SelectItem value="maybe">{t('guests.status.maybe')}</SelectItem>
                    <SelectItem value="declined">{t('guests.status.declined')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="comment-filter" className="text-sm font-medium">Comments</Label>
                <Select value={commentFilter} onValueChange={setCommentFilter}>
                  <SelectTrigger className="w-full mt-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="with-comments">With Comments</SelectItem>
                    <SelectItem value="no-comments">No Comments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedGuests.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium">
                {selectedGuests.length} guest(s) selected
              </span>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Bulk action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Mark Confirmed</SelectItem>
                  <SelectItem value="pending">Mark Pending</SelectItem>
                  <SelectItem value="maybe">Mark Maybe</SelectItem>
                  <SelectItem value="declined">Mark Declined</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleBulkAction}
                disabled={!bulkAction || bulkUpdateMutation.isPending}
                size="sm"
              >
                {bulkUpdateMutation.isPending ? 'Updating...' : 'Apply'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guest List with One-Click Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('guests.guestListCount', { count: filteredGuests.length })}</CardTitle>
              <CardDescription>
                {t('guests.clickStatusBadges')}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
            >
              {selectedGuests.length === filteredGuests.length ? t('guests.deselectAll') : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredGuests.map((guest) => (
              <div key={guest.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  checked={selectedGuests.includes(guest.id)}
                  onCheckedChange={() => toggleGuestSelection(guest.id)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium truncate">{guest.name}</span>
                    {guest.message && (
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  {guest.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {guest.message && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <div className="flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          {guest.message.length > 60 ? `${guest.message.substring(0, 60)}...` : guest.message}
                        </span>
                      </div>
                    </div>
                  )}
                  {guest.respondedAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Responded: {new Date(guest.respondedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* One-Click Status Updates */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRSVPMutation.mutate({ guestId: guest.id, status: 'confirmed' })}
                      disabled={updateRSVPMutation.isPending}
                      className={`p-2 ${guest.rsvpStatus === 'confirmed' ? 'bg-green-100 border-green-300' : ''}`}
                      title="Mark as Confirmed"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRSVPMutation.mutate({ guestId: guest.id, status: 'maybe' })}
                      disabled={updateRSVPMutation.isPending}
                      className={`p-2 ${guest.rsvpStatus === 'maybe' ? 'bg-blue-100 border-blue-300' : ''}`}
                      title="Mark as Maybe"
                    >
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRSVPMutation.mutate({ guestId: guest.id, status: 'declined' })}
                      disabled={updateRSVPMutation.isPending}
                      className={`p-2 ${guest.rsvpStatus === 'declined' ? 'bg-red-100 border-red-300' : ''}`}
                      title="Mark as Declined"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRSVPMutation.mutate({ guestId: guest.id, status: 'pending' })}
                      disabled={updateRSVPMutation.isPending}
                      className={`p-2 ${guest.rsvpStatus === 'pending' ? 'bg-yellow-100 border-yellow-300' : ''}`}
                      title="Mark as Pending"
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                  </div>

                  <Badge className={`border ${getStatusColor(guest.rsvpStatus)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(guest.rsvpStatus)}
                      <span>{(() => {
                        // Determine display text based on current UI language
                        let displayText = t(`guests.status.${guest.rsvpStatus}`); // Default fallback
                        
                        if (guest.rsvpStatus === 'confirmed' && guest.plusOne) {
                          displayText = t('rsvp.confirmedWithGuestEmoji');
                        } else if (guest.rsvpStatus === 'confirmed') {
                          displayText = t('rsvp.confirmedEmoji');
                        } else if (guest.rsvpStatus === 'declined') {
                          displayText = t('rsvp.declinedEmoji');
                        } else if (guest.rsvpStatus === 'maybe') {
                          displayText = t('rsvp.maybeEmoji');
                        }
                        
                        // Fallback to responseText only if translation is not available
                        if (!displayText || displayText.includes('rsvp.')) {
                          displayText = guest.responseText || t(`guests.status.${guest.rsvpStatus}`);
                        }
                        
                        return displayText;
                      })()}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            ))}

            {filteredGuests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('guests.noGuestsFoundFilter')}</p>
                <p className="text-sm">{t('guests.adjustSearchFilter')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
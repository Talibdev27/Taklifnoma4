import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AddGuestDialogProps {
  weddingId: number;
  trigger?: React.ReactNode;
}

export function AddGuestDialog({ weddingId, trigger }: AddGuestDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rsvpStatus: 'pending' as const,
    category: 'family',
    side: 'both' as const,
  });

  const addGuestMutation = useMutation({
    mutationFn: (guestData: typeof formData) => 
      apiRequest('POST', '/api/guests', {
        ...guestData,
        weddingId,
      }),
    onSuccess: () => {
      // Invalidate all guest-related queries with different key patterns
      queryClient.invalidateQueries({ queryKey: [`/api/guests/wedding/${weddingId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/guests/wedding', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['/api/guests/wedding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/guests', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/guests'] });
      
      // Force immediate refetch to ensure UI updates
      queryClient.refetchQueries({ queryKey: [`/api/guests/wedding/${weddingId}`] });
      queryClient.refetchQueries({ queryKey: ['/api/guests/wedding', weddingId] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/guests', weddingId] });
      
      toast({
        title: t('guestList.guestAdded'),
        description: t('guestList.guestAddedSuccess'),
      });
      setIsOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        rsvpStatus: 'pending',
        category: 'family',
        side: 'both',
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('guests.failedToAdd'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: t('guests.validationError'),
        description: t('guests.nameRequired'),
        variant: 'destructive',
      });
      return;
    }
    addGuestMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            size="lg"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all duration-200 active:scale-95"
            title={t('guests.addNewGuest')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            {t('guestList.addGuest')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('guests.name')} *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('guests.enterGuestName')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('guests.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('guests.enterEmailAddress')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('guests.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder={t('guests.enterPhoneNumber')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t('guests.category')}</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('guests.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">{t('guests.family')}</SelectItem>
                  <SelectItem value="friends">{t('guests.friends')}</SelectItem>
                  <SelectItem value="colleagues">{t('guests.colleagues')}</SelectItem>
                  <SelectItem value="other">{t('guests.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="side">{t('guests.side')}</Label>
              <Select value={formData.side} onValueChange={(value) => handleInputChange('side', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('guests.selectSide')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride">{t('guests.bride')}</SelectItem>
                  <SelectItem value="groom">{t('guests.groom')}</SelectItem>
                  <SelectItem value="both">{t('guests.both')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsvpStatus">{t('guests.initialStatus')}</Label>
            <Select value={formData.rsvpStatus} onValueChange={(value) => handleInputChange('rsvpStatus', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder={t('guests.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('guestList.pending')}</SelectItem>
                <SelectItem value="confirmed">{t('guestList.confirmed')}</SelectItem>
                <SelectItem value="maybe">{t('guestList.maybe')}</SelectItem>
                <SelectItem value="declined">{t('guestList.declined')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={addGuestMutation.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {addGuestMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t('guests.adding')}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('guestList.addGuest')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={addGuestMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
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
        title: 'Error',
        description: error.message || 'Failed to add guest',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Guest name is required',
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
            title="Add new guest"
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
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter guest name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="colleagues">Colleagues</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="side">Side</Label>
              <Select value={formData.side} onValueChange={(value) => handleInputChange('side', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bride">Bride</SelectItem>
                  <SelectItem value="groom">Groom</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsvpStatus">Initial Status</Label>
            <Select value={formData.rsvpStatus} onValueChange={(value) => handleInputChange('rsvpStatus', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
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
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Guest
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={addGuestMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
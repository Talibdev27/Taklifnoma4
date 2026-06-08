import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface GuestBookEntry {
  id: number;
  weddingId: number;
  guestName: string;
  message: string;
  createdAt: string;
}

interface GuestBookManagerProps {
  weddingId: number;
  readOnly?: boolean;
}

export function GuestBookManager({ weddingId, readOnly = false }: GuestBookManagerProps) {
  const { t } = useTranslation();
  const [guestName, setGuestName] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: guestBookEntries = [], isLoading } = useQuery({
    queryKey: ['/api/guestbook', weddingId],
    queryFn: () => fetch(`/api/guestbook/${weddingId}`).then(res => res.json()),
  });

  const addEntryMutation = useMutation({
    mutationFn: (data: { guestName: string; message: string }) =>
      apiRequest(`/api/guestbook/${weddingId}`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guestbook', weddingId] });
      setGuestName('');
      setGuestMessage('');
      toast({
        title: t('guestBook.entryAdded'),
        description: t('guestBook.entryAddedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('guestBook.entryAddError'),
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: number) =>
      apiRequest(`/api/guestbook/entry/${entryId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guestbook', weddingId] });
      toast({
        title: t('guestBook.entryDeleted'),
        description: t('guestBook.entryDeletedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('guestBook.entryDeleteError'),
        variant: "destructive",
      });
    },
  });

  const handleAddEntry = () => {
    if (!guestName.trim() || !guestMessage.trim()) {
      toast({
        title: t('guestBook.missingInformation'),
        description: t('guestBook.provideNameAndMessage'),
        variant: "destructive",
      });
      return;
    }

    addEntryMutation.mutate({
      guestName: guestName.trim(),
      message: guestMessage.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4B08C] mx-auto"></div>
        <p className="mt-2 text-gray-500">{t('guestBook.loadingMessages')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add new entry form - only for non-read-only users */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('guestBook.addEntry')}</CardTitle>
            <CardDescription>
              {t('guestBook.addEntryDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guest-name">{t('guestBook.guestNameLabel')}</Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={t('guestBook.guestNamePlaceholder')}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="guest-message">{t('form.message')}</Label>
              <Textarea
                id="guest-message"
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                placeholder={t('guestBook.messagePlaceholder')}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleAddEntry}
              disabled={addEntryMutation.isPending}
              className="w-full bg-[#D4B08C] hover:bg-[#C19A75]"
            >
              {addEntryMutation.isPending ? t('guestBook.adding') : t('guestBook.addEntryButton')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Read-only indicator */}
      {readOnly && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Eye className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">{t('guestBook.viewOnlyAccess')}</span>
        </div>
      )}

      {/* Guest book entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('guestBook.messagesCount', { count: guestBookEntries.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {guestBookEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('guestBook.noMessagesYet')}</p>
              {!readOnly && <p className="text-sm">{t('guestBook.addFirstMessage')}</p>}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {guestBookEntries.map((entry: GuestBookEntry) => (
                <div key={entry.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#8B4513]">{entry.guestName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString(localStorage.getItem('language') === 'kk' ? 'ru-RU' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{entry.message}</p>
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntryMutation.mutate(entry.id)}
                        disabled={deleteEntryMutation.isPending}
                        className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
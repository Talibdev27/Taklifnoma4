import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, MessageSquare, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GuestBookEntry } from '@shared/schema';

interface AdminGuestBookManagerProps {
  weddingId: number;
}

export function AdminGuestBookManager({ weddingId }: AdminGuestBookManagerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [entryToDelete, setEntryToDelete] = useState<GuestBookEntry | null>(null);

  // Fetch guest book entries
  const { data: entries = [], isLoading } = useQuery<GuestBookEntry[]>({
    queryKey: ['/api/guest-book/wedding', weddingId],
    queryFn: () => fetch(`/api/guest-book/wedding/${weddingId}`).then(res => res.json()),
    enabled: !!weddingId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const token = localStorage.getItem('adminToken');
      console.log('Attempting to delete entry:', entryId, 'with token:', token ? 'present' : 'missing');
      
      const response = await fetch(`/api/guest-book/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete failed:', response.status, errorText);
        throw new Error(`Failed to delete entry: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('admin.guestBook.entryDeleted'),
        description: t('admin.guestBook.entryDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/guest-book/wedding', weddingId] });
      setEntryToDelete(null);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('admin.guestBook.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (entry: GuestBookEntry) => {
    setEntryToDelete(entry);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteMutation.mutate(entryToDelete.id);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading guest book entries...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t('admin.guestBook.title')} ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {t('admin.guestBook.noEntries')}
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {entry.guestName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.createdAt)}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(entry)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t('admin.guestBook.confirmDelete')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('admin.guestBook.confirmDeleteDesc')}
                            <br />
                            <strong>{entry.guestName}</strong>: "{entry.message}"
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t('common.cancel')}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {entry.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
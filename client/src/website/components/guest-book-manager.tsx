import { useState } from 'react';
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
        title: "Message added",
        description: "Guest book entry has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add guest book entry.",
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
        title: "Message deleted",
        description: "Guest book entry has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete guest book entry.",
        variant: "destructive",
      });
    },
  });

  const handleAddEntry = () => {
    if (!guestName.trim() || !guestMessage.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both name and message.",
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
        <p className="mt-2 text-gray-500">Loading guest book messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add new entry form - only for non-read-only users */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Guest Book Entry</CardTitle>
            <CardDescription>
              Add a new message to the guest book
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guest-name">Guest Name</Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter guest name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="guest-message">Message</Label>
              <Textarea
                id="guest-message"
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                placeholder="Enter the guest's message..."
                rows={3}
              />
            </div>
            <Button 
              onClick={handleAddEntry}
              disabled={addEntryMutation.isPending}
              className="w-full bg-[#D4B08C] hover:bg-[#C19A75]"
            >
              {addEntryMutation.isPending ? 'Adding...' : 'Add Entry'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Read-only indicator */}
      {readOnly && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Eye className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">You have view-only access to guest book messages</span>
        </div>
      )}

      {/* Guest book entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Guest Book Messages ({guestBookEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {guestBookEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No guest book messages yet</p>
              {!readOnly && <p className="text-sm">Add the first message above</p>}
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
import React from 'react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface GuestBookFormProps {
  weddingId: number;
  primaryColor?: string;
  accentColor?: string;
}

export function GuestBookForm({ weddingId, primaryColor = '#1976d2', accentColor = '#1565c0' }: GuestBookFormProps) {
  const { t } = useTranslation();
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEntryMutation = useMutation({
    mutationFn: async (data: { guestName: string; message: string }) => {
      const response = await fetch('/api/guest-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, weddingId }),
      });
      if (!response.ok) throw new Error('Failed to add message');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('guestBook.messageAdded'),
        description: t('guestBook.messageAddedDesc'),
      });
      setGuestName('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/guest-book/wedding', weddingId] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('guestBook.addMessageError'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !message.trim()) {
      toast({
        title: t('common.error'),
        description: t('guestBook.form.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }
    createEntryMutation.mutate({ guestName: guestName.trim(), message: message.trim() });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder={t('guestBook.form.namePlaceholder')}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
            />
          </div>
          <div>
            <Textarea
              placeholder={t('guestBook.form.messagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full text-white font-medium transition-all duration-300"
            style={{ 
              background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            disabled={createEntryMutation.isPending}
          >
            {createEntryMutation.isPending ? t('common.loading') : t('guestBook.form.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
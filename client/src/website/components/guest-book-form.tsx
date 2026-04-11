import React from 'react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Send, User, MessageSquare } from 'lucide-react';

interface GuestBookFormProps {
  weddingId: number;
  primaryColor?: string;
  accentColor?: string;
}

export function GuestBookForm({ weddingId, primaryColor = '#c9a96e', accentColor = '#a07840' }: GuestBookFormProps) {
  const { t } = useTranslation();
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name Input */}
      <div className="relative group">
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 z-10"
          style={{ 
            opacity: focusedField === 'name' ? 1 : 0.4,
            color: focusedField === 'name' ? primaryColor : 'rgba(255,255,255,0.5)'
          }}
        >
          <User className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder={t('guestBook.form.namePlaceholder')}
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          required
          className="w-full h-14 pl-14 pr-5 rounded-2xl text-base font-light text-white placeholder:text-white/40 transition-all duration-300 outline-none"
          style={{
            background: focusedField === 'name' 
              ? `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}08)`
              : 'rgba(0,0,0,0.2)',
            border: `1px solid ${focusedField === 'name' ? `${primaryColor}50` : 'rgba(255,255,255,0.1)'}`,
            boxShadow: focusedField === 'name' ? `0 8px 24px ${primaryColor}15` : 'none',
          }}
        />
      </div>

      {/* Message Textarea */}
      <div className="relative group">
        <div 
          className="absolute left-4 top-5 transition-all duration-300 z-10"
          style={{ 
            opacity: focusedField === 'message' ? 1 : 0.4,
            color: focusedField === 'message' ? primaryColor : 'rgba(255,255,255,0.5)'
          }}
        >
          <MessageSquare className="w-5 h-5" />
        </div>
        <textarea
          placeholder={t('guestBook.form.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setFocusedField('message')}
          onBlur={() => setFocusedField(null)}
          rows={5}
          required
          className="w-full min-h-[140px] pl-14 pr-5 py-5 rounded-2xl text-base font-light text-white placeholder:text-white/40 transition-all duration-300 outline-none resize-none"
          style={{
            background: focusedField === 'message' 
              ? `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}08)`
              : 'rgba(0,0,0,0.2)',
            border: `1px solid ${focusedField === 'message' ? `${primaryColor}50` : 'rgba(255,255,255,0.1)'}`,
            boxShadow: focusedField === 'message' ? `0 8px 24px ${primaryColor}15` : 'none',
            fontFamily: '"Playfair Display", Georgia, serif',
          }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={createEntryMutation.isPending}
        className="group relative w-full h-14 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          boxShadow: `0 8px 24px ${primaryColor}25`,
        }}
        onMouseEnter={(e) => {
          if (!createEntryMutation.isPending) {
            e.currentTarget.style.boxShadow = `0 12px 32px ${primaryColor}35`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 8px 24px ${primaryColor}25`;
        }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        <div className="relative flex items-center justify-center gap-2.5">
          {createEntryMutation.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-base font-medium text-white tracking-wide">
                {t('guestBook.addingMessage')}
              </span>
            </>
          ) : (
            <>
              <span className="text-base font-medium text-white tracking-wide">
                {t('guestBook.form.submit')}
              </span>
              <Send className="w-5 h-5 text-white transition-transform group-hover:translate-x-1" />
            </>
          )}
        </div>
      </button>

      {/* Decorative line */}
      <div className="flex items-center justify-center gap-3 mt-6 opacity-40">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: primaryColor }} />
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
      </div>
    </form>
  );
}
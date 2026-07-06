import React, { useState } from 'react';
import { Link } from 'wouter';
import { format, differenceInCalendarDays } from 'date-fns';
import {
  Calendar,
  MapPin,
  Eye,
  Settings,
  Copy,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  ExternalLink,
  MoreHorizontal,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface WeddingCardData {
  id: number;
  bride: string;
  groom: string;
  weddingDate: string;
  venue: string;
  uniqueUrl: string;
  isPublic: boolean;
  isApproved: boolean;
  template: string;
}

export interface WeddingCardProps {
  wedding: WeddingCardData;
  /** Translation lookup. Pass `t` from `useTranslation()`. */
  t: (key: string, fallback?: string) => string;
  /** Handler invoked when the user copies the public URL — typically toasts. */
  onCopied?: (url: string) => void;
  /** Card variant — controls which actions are shown.
   *  - "owner" (default): Manage / View / Copy actions, kebab menu, full chrome
   *  - "guest-manager": single "Manage guests" action, no copy/view, no kebab */
  variant?: 'owner' | 'guest-manager';
  className?: string;
}

const formatTemplateLabel = (template: string) =>
  template
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

/**
 * Wedding tile shown on the dashboard. Surfaces the most useful facts
 * in glanceable hierarchy: couple → date countdown → venue → status,
 * with primary actions exposed and secondary ones tucked into a menu.
 */
export function WeddingCard({
  wedding,
  t,
  onCopied,
  variant = 'owner',
  className = '',
}: WeddingCardProps) {
  const [copied, setCopied] = useState(false);

  const date = new Date(wedding.weddingDate);
  const daysUntil = differenceInCalendarDays(date, new Date());
  const isPast = daysUntil < 0;

  const handleCopy = async () => {
    const url = `${window.location.origin}/wedding/${wedding.uniqueUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopied?.(url);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API blocked — silently no-op; user can still copy via menu
    }
  };

  const countdownLabel = isPast
    ? t('dashboard.eventPassed', 'Event passed')
    : daysUntil === 0
    ? t('dashboard.today', 'Today')
    : daysUntil === 1
    ? t('dashboard.tomorrow', 'Tomorrow')
    : `${daysUntil} ${t('dashboard.daysAway', 'days away')}`;

  return (
    <article
      className={`group relative flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-300 hover:shadow-md ${className}`}
    >
      {/* ── Status strip ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          {wedding.isApproved ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              {t('dashboard.statusActive', 'Active')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              <Clock className="w-3 h-3" />
              {t('dashboard.statusPending', 'Pending review')}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
              wedding.isPublic ? 'text-slate-600 bg-slate-100' : 'text-slate-500 bg-slate-50 border border-slate-200'
            }`}
          >
            {wedding.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {wedding.isPublic
              ? t('dashboard.public', 'Public')
              : t('dashboard.private', 'Private')}
          </span>
        </div>

        {variant === 'owner' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              {t('dashboard.copyLink', 'Copy public link')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`/wedding/${wedding.uniqueUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('dashboard.openInNewTab', 'Open in new tab')}
              </a>
            </DropdownMenuItem>
            {!wedding.isApproved && (
              <div className="px-2 py-1.5 text-xs text-slate-500 leading-snug">
                {t('dashboard.pendingViewHint', "Until it's approved, opening the link shows a 'pending approval' page.")}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/manage/${wedding.uniqueUrl}`}>
                <Settings className="w-4 h-4 mr-2" />
                {t('dashboard.manage', 'Manage')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
      </div>

      {/* ── Couple + countdown ─────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 flex-1">
        <h3 className="text-[17px] font-semibold text-slate-900 tracking-tight leading-tight line-clamp-2">
          {wedding.bride} &amp; {wedding.groom}
        </h3>
        <p className="mt-0.5 text-[13px] text-slate-500">
          {formatTemplateLabel(wedding.template)} · {countdownLabel}
        </p>

        <dl className="mt-4 space-y-2.5">
          <div className="flex items-start gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <span className="text-slate-700 truncate">
              {format(date, 'PPP')}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <span className="text-slate-700 line-clamp-1">
              {wedding.venue || t('dashboard.venueTBD', 'Venue TBD')}
            </span>
          </div>
        </dl>
      </div>

      {/* ── Action footer ─────────────────────────────────────── */}
      {variant === 'guest-manager' ? (
        <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100">
          <Link href={`/manage/${wedding.uniqueUrl}`}>
            <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {t('guestManager.manageGuests', 'Manage guests')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center gap-2">
          <Link href={`/manage/${wedding.uniqueUrl}`} className="flex-1">
            <Button variant="default" size="sm" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              {t('dashboard.manage', 'Manage')}
            </Button>
          </Link>
          <Link href={`/wedding/${wedding.uniqueUrl}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              {t('dashboard.view', 'View')}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="px-2.5"
            onClick={handleCopy}
            title={
              copied
                ? t('dashboard.linkCopied', 'Link copied!')
                : t('dashboard.copyLink', 'Copy link')
            }
            aria-label={t('dashboard.copyLink', 'Copy link')}
          >
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      )}
    </article>
  );
}

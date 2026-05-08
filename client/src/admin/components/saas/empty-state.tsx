import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  /** Lucide icon shown above the heading */
  icon?: LucideIcon;
  /** Main heading — what isn't here yet */
  title: string;
  /** Supporting copy explaining how to create something */
  description?: React.ReactNode;
  /** Primary CTA button (or any node) */
  action?: React.ReactNode;
  /** Optional secondary action shown next to the primary one */
  secondaryAction?: React.ReactNode;
  /** Compact variant — smaller padding for nested empty states */
  compact?: boolean;
  className?: string;
}

/**
 * Friendly placeholder shown when a list/section has no items yet.
 *
 * Used both at the page level (when a user has zero weddings) and inside
 * panels (no guests, no photos, no RSVPs). Designed to feel inviting
 * rather than apologetic — leads with a clear next action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/40 ${
        compact ? 'px-6 py-10' : 'px-6 py-16 sm:py-20'
      } ${className}`}
    >
      {Icon && (
        <div
          className={`flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm ${
            compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-5'
          }`}
        >
          <Icon
            className={`text-slate-400 ${compact ? 'w-5 h-5' : 'w-7 h-7'}`}
            strokeWidth={1.5}
          />
        </div>
      )}
      <h3
        className={`font-semibold text-slate-900 tracking-tight ${
          compact ? 'text-base' : 'text-lg'
        }`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`text-slate-500 leading-relaxed mt-1.5 max-w-md ${
            compact ? 'text-sm' : 'text-sm sm:text-[15px]'
          }`}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className={`flex items-center gap-2 flex-wrap justify-center ${compact ? 'mt-4' : 'mt-6'}`}>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

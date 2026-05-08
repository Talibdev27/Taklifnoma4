import React from 'react';

export interface PageHeaderProps {
  /** Tiny eyebrow label rendered above the title (e.g., "Overview") */
  eyebrow?: string;
  /** Main page title — sized like a true H1 */
  title: React.ReactNode;
  /** Supporting one-liner under the title */
  description?: React.ReactNode;
  /** Right-aligned actions — e.g., a primary CTA + secondary button */
  actions?: React.ReactNode;
  /** Visually subtle bottom border to separate from page body */
  bordered?: boolean;
  className?: string;
}

/**
 * Standard SaaS page header used on Dashboard, Settings, Manage pages.
 * Keeps title hierarchy and CTA placement consistent across the app.
 *
 * Layout: title block on the left, actions cluster on the right.
 * On narrow viewports both stack vertically with comfortable spacing.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  bordered = false,
  className = '',
}: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${
        bordered ? 'pb-6 border-b border-slate-200' : ''
      } ${className}`}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-indigo-600 mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm sm:text-[15px] text-slate-500 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

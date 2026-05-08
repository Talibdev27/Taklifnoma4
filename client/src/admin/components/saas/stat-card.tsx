import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  /** Short metric label (e.g., "Total RSVPs") */
  label: string;
  /** Headline metric value */
  value: React.ReactNode;
  /** Tiny description rendered under the value */
  hint?: React.ReactNode;
  /** Optional icon shown in the top-right corner */
  icon?: LucideIcon;
  /** Optional trend chip — positive numbers show green, negative red */
  trend?: { value: number; label?: string };
  /** Visual accent — affects icon tint and subtle background */
  accent?: 'indigo' | 'emerald' | 'amber' | 'slate' | 'rose';
  /** Skeleton placeholder when loading */
  loading?: boolean;
  className?: string;
}

const ACCENT_TOKENS: Record<NonNullable<StatCardProps['accent']>, { iconBg: string; iconFg: string }> = {
  indigo:  { iconBg: 'bg-indigo-50',  iconFg: 'text-indigo-600' },
  emerald: { iconBg: 'bg-emerald-50', iconFg: 'text-emerald-600' },
  amber:   { iconBg: 'bg-amber-50',   iconFg: 'text-amber-600' },
  slate:   { iconBg: 'bg-slate-100',  iconFg: 'text-slate-600' },
  rose:    { iconBg: 'bg-rose-50',    iconFg: 'text-rose-600' },
};

/**
 * Compact dashboard metric tile.
 *
 * Matches Stripe/Linear pattern: large numeric value, label above,
 * optional icon and trend chip. Designed to live in a 2-up (mobile) /
 * 4-up (desktop) grid.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = 'indigo',
  loading = false,
  className = '',
}: StatCardProps) {
  const tokens = ACCENT_TOKENS[accent];
  const trendUp = trend && trend.value >= 0;

  if (loading) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="mt-4 h-8 w-24 rounded bg-slate-100 animate-pulse" />
        <div className="mt-2 h-3 w-16 rounded bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-sm hover:border-slate-300 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {Icon && (
          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${tokens.iconBg}`}>
            <Icon className={`w-4.5 h-4.5 ${tokens.iconFg}`} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${
              trendUp
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-rose-700 bg-rose-50'
            }`}
          >
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

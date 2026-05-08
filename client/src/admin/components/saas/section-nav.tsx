import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SectionNavItem {
  /** Stable id used to switch active section (not a route). */
  id: string;
  /** Visible (already-translated) label. */
  label: string;
  /** Optional one-liner under the label, shown only on the desktop rail. */
  description?: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** Optional small badge (count, "New", etc.). */
  badge?: string | number;
}

export interface SectionNavProps {
  items: SectionNavItem[];
  /** Currently active id. */
  value: string;
  /** Called when the user picks a new section. */
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Lightweight section navigation used inside the Manage page.
 *
 * Two presentations driven entirely by CSS — no JS branching:
 *
 *   - **Desktop (≥md)**: vertical rail showing icon + label + description,
 *     with the active item highlighted via a left accent bar and a soft
 *     surface tint. Behaves like Linear/Notion sidebar sub-nav.
 *
 *   - **Mobile/tablet**: horizontal scroll-snap pill row at the top so the
 *     user can swipe through sections without losing space.
 *
 * State is driven by the parent — this component is intentionally
 * presentational so it can be reused for the Admin redesign later.
 */
export function SectionNav({ items, value, onChange, className = '' }: SectionNavProps) {
  return (
    <>
      {/* ── Mobile / tablet: horizontal pill row ──────────────────── */}
      <div className={`md:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 ${className}`}>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.id === value;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={`shrink-0 snap-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Desktop: vertical rail ──────────────────────────────── */}
      <nav className={`hidden md:block ${className}`} aria-label="Manage sections">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.id === value;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onChange(item.id)}
                  className={`group w-full text-left rounded-lg px-3 py-2.5 transition-colors flex items-start gap-3 relative ${
                    active
                      ? 'bg-slate-100/80 text-slate-900'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {/* Active accent bar */}
                  <span
                    className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full transition-all ${
                      active ? 'bg-indigo-600' : 'bg-transparent'
                    }`}
                  />
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium leading-tight">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                            active
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p
                        className={`text-xs mt-0.5 leading-snug ${
                          active ? 'text-slate-600' : 'text-slate-500'
                        }`}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

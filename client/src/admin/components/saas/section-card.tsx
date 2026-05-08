import React from 'react';

export interface SectionCardProps {
  /** Visible card title (already translated). */
  title?: React.ReactNode;
  /** Optional supporting description under the title. */
  description?: React.ReactNode;
  /** Optional right-aligned actions in the card header. */
  actions?: React.ReactNode;
  /** Inner padding control — set to false when the body is a table or a media grid. */
  padded?: boolean;
  /** Card body. */
  children: React.ReactNode;
  className?: string;
  /** Set the body element type — useful when wrapping a <form>. */
  as?: 'div' | 'form' | 'section';
  /** Forwarded onSubmit when as="form". */
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}

/**
 * Panel wrapper used by Manage page sections.
 *
 * Visual rules (consistent with the dashboard StatCard + WeddingCard):
 *   - white surface, slate-200 border, rounded-xl, no shadow at rest
 *   - title block sits in a header strip with a hairline separator
 *   - optional `actions` slot lives on the right of the header
 *   - body padding configurable; tables/grids opt out via `padded={false}`
 */
export function SectionCard({
  title,
  description,
  actions,
  padded = true,
  children,
  className = '',
  as = 'div',
  onSubmit,
}: SectionCardProps) {
  const Component: any = as;
  const componentProps = as === 'form' ? { onSubmit } : {};

  return (
    <Component
      {...componentProps}
      className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${className}`}
    >
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-base font-semibold text-slate-900 tracking-tight leading-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'p-5 sm:p-6' : ''}>{children}</div>
    </Component>
  );
}

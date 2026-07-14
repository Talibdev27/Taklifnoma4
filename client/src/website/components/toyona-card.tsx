import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check } from 'lucide-react';

interface ToyonaCardProps {
  /** Name embossed on the card. */
  cardHolderName?: string | null;
  /** Card number — stored as entered by the admin; digits are regrouped in 4s. */
  cardNumber?: string | null;
  /** Accent colour — pass the template's accent so the card blends in. */
  accent?: string;
  /** 'dark' = light text on a translucent dark card; 'light' = dark text on a light card. */
  surface?: 'dark' | 'light';
  /** Override the copy-button label (the Turkish template hardcodes its copy). */
  copyLabel?: string;
  /** Override the copied-confirmation label. */
  copiedLabel?: string;
  /** Extra classes on the outer card. */
  className?: string;
}

/** Regroup a card number's digits into blocks of 4 for display. */
function groupDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw.trim();
  return (digits.match(/.{1,4}/g) || []).join(' ');
}

function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
}

/**
 * To'yona (monetary gift) bank card. Shared across templates so the
 * copy-to-clipboard behaviour stays consistent; each template wraps it in its
 * own section with its own heading and passes `accent`/`surface` so the card
 * blends into the design.
 */
export function ToyonaCard({
  cardHolderName,
  cardNumber,
  accent = '#c9a96e',
  surface = 'dark',
  copyLabel,
  copiedLabel,
  className = '',
}: ToyonaCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!cardNumber?.trim()) return null;

  const isLight = surface === 'light';
  const displayNumber = groupDigits(cardNumber);

  const handleCopy = () => {
    copyText(cardNumber.replace(/\D/g, '') || cardNumber.trim())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className={`max-w-sm mx-auto ${className}`}>
      {/* The "bank card" */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-7 text-left shadow-lg ${
          isLight ? 'border border-black/10 bg-white' : 'border border-white/15 bg-white/[0.06] backdrop-blur-sm'
        }`}
        style={{
          backgroundImage: isLight
            ? `linear-gradient(135deg, ${accent}14 0%, transparent 55%, ${accent}0d 100%)`
            : `linear-gradient(135deg, ${accent}26 0%, transparent 55%, ${accent}1a 100%)`,
        }}
      >
        {/* Soft glow in the corner */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${accent}33, transparent 70%)` }}
        />

        {/* Chip */}
        <div
          className="w-10 h-7 rounded-md mb-6"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
            boxShadow: `inset 0 0 0 1px ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.25)'}`,
          }}
        />

        {/* Card number */}
        <p
          className={`text-xl sm:text-2xl tracking-[0.12em] tabular-nums ${
            isLight ? 'text-gray-900' : 'text-white'
          }`}
          style={{ fontFamily: '"Courier New", ui-monospace, monospace', fontWeight: 700 }}
        >
          {displayNumber}
        </p>

        {/* Holder name */}
        {cardHolderName?.trim() && (
          <p
            className={`mt-5 text-xs sm:text-sm uppercase tracking-[0.25em] ${
              isLight ? 'text-gray-600' : 'text-white/75'
            }`}
          >
            {cardHolderName}
          </p>
        )}
      </div>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className="mt-5 inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: accent }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        <span>{copied ? (copiedLabel || t('toyona.copied')) : (copyLabel || t('toyona.copy'))}</span>
      </button>
    </div>
  );
}

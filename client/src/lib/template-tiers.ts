/**
 * Template Tier Classification
 * Defines which templates are free (Basic tier) vs premium (require payment)
 *
 * NOTE — The product currently runs in fully-free mode: every template (the
 * legacy palette set + the redesigned premium set) is available to all users
 * without payment. PREMIUM_TEMPLATES is intentionally left empty so the
 * `isPremiumTemplate()` check returns false everywhere and the gold "Premium"
 * badge / payment redirect logic stays dormant. To re-enable a paywall, move
 * the relevant template ids back into PREMIUM_TEMPLATES.
 */

// Free templates available to all users without payment
export const FREE_TEMPLATES = [
  'bohoChic',
  'classicTradition',
  'beachBliss',
  'rusticCharm',
  'modernElegance',
  'gardenRomance',
  'modern',
  'epic',
  'flower',
  'velvet',
  'pearl',
  'aurora',
  'imperial',
  'turkish',
] as const;

// Premium templates that require payment (currently none — see file header).
export const PREMIUM_TEMPLATES: readonly string[] = [] as const;

export type FreeTemplate = typeof FREE_TEMPLATES[number];
export type PremiumTemplate = typeof PREMIUM_TEMPLATES[number];

/**
 * Check if a template is in the free tier
 */
export function isFreeTemplate(template: string): boolean {
  return FREE_TEMPLATES.includes(template as FreeTemplate);
}

/**
 * Check if a template is in the premium tier
 */
export function isPremiumTemplate(template: string): boolean {
  return PREMIUM_TEMPLATES.includes(template as PremiumTemplate);
}

/**
 * Get template tier classification
 */
export function getTemplateTier(template: string): 'free' | 'premium' | 'unknown' {
  if (isFreeTemplate(template)) return 'free';
  if (isPremiumTemplate(template)) return 'premium';
  return 'unknown';
}


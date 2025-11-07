/**
 * Template Tier Classification
 * Defines which templates are free (Basic tier) vs premium (require payment)
 */

// Free templates available to all users without payment
export const FREE_TEMPLATES = [
  'standard',
  'bohoChic',
  'classicTradition',
  'beachBliss',
  'rusticCharm',
  'modernElegance',
  'gardenRomance'
] as const;

// Premium templates that require payment (unless user has paid subscription)
export const PREMIUM_TEMPLATES = [
  'epic',
  'anime_1',
  'flower',
  'gul',
  'birthday'
] as const;

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


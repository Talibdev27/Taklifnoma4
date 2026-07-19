/**
 * Per-template UI tokens.
 *
 * Every template has its own colour identity. UI controls that float on top
 * of the page (music button, carousel dots, etc.) read from this map so they
 * blend in with the active template instead of always being gold.
 *
 * `primary`  — main button background / dominant brand colour
 * `accent`   — gradient companion / secondary highlight
 * `iconColor`— foreground colour of icons inside the primary surface
 * `glow`     — soft drop-shadow tint behind the primary surface
 */

export interface TemplateTheme {
  primary: string;
  accent: string;
  iconColor: string;
  glow: string;
}

export const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  // ── Premium templates (the redesigned trio) ────────────────────────────
  velvet: {
    primary: '#d4a87c',
    accent: '#8a5a3a',
    iconColor: '#1a060f',
    glow: 'rgba(212,168,124,0.45)',
  },
  pearl: {
    primary: '#1a1a1a',
    accent: '#5a5a5a',
    iconColor: '#f8f5f0',
    glow: 'rgba(26,26,26,0.35)',
  },
  aurora: {
    primary: '#c9b6e3',
    accent: '#a8d0e6',
    iconColor: '#1a1530',
    glow: 'rgba(201,182,227,0.55)',
  },
  imperial: {
    primary: '#c9a96e',
    accent: '#9c7b34',
    iconColor: '#241a08',
    glow: 'rgba(201,169,110,0.5)',
  },
  // Turkish "Kına Gecesi" — Ottoman burgundy carpet + antique gold on ivory.
  turkish: {
    primary: '#7a1f2b',
    accent: '#b0894a',
    iconColor: '#f7f1e3',
    glow: 'rgba(122,31,43,0.45)',
  },
  // Floral (garden) — forest green over a watercolour garden.
  garden: {
    primary: '#54683c',
    accent: '#7d9160',
    iconColor: '#f4f6ef',
    glow: 'rgba(84,104,60,0.5)',
  },
  // Royal (envelope) — deep navy + antique gold.
  royal: {
    primary: '#22385c',
    accent: '#c9a45f',
    iconColor: '#f6f0e2',
    glow: 'rgba(201,164,95,0.5)',
  },

  // ── Other premium templates ────────────────────────────────────────────
  modern: {
    primary: '#c9a96e',
    accent: '#a07840',
    iconColor: '#1a0e00',
    glow: 'rgba(201,169,110,0.45)',
  },
  epic: {
    primary: '#fbbf24',
    accent: '#f59e0b',
    iconColor: '#1a0e00',
    glow: 'rgba(251,191,36,0.45)',
  },
  birthday: {
    primary: '#f472b6',
    accent: '#a855f7',
    iconColor: '#ffffff',
    glow: 'rgba(244,114,182,0.45)',
  },
  flower: {
    primary: '#f472b6',
    accent: '#fb7185',
    iconColor: '#ffffff',
    glow: 'rgba(244,114,182,0.45)',
  },
  gul: {
    primary: '#dc2626',
    accent: '#b91c1c',
    iconColor: '#ffffff',
    glow: 'rgba(220,38,38,0.45)',
  },
  anime_1: {
    primary: '#a855f7',
    accent: '#ec4899',
    iconColor: '#ffffff',
    glow: 'rgba(168,85,247,0.45)',
  },
  ccostumer_1: {
    primary: '#0891b2',
    accent: '#0e7490',
    iconColor: '#ffffff',
    glow: 'rgba(8,145,178,0.45)',
  },

  // ── Free templates (handled by WeddingSite generic renderer) ───────────
  gardenRomance: {
    primary: '#89916b',     // sage green
    accent: '#d4b08c',      // warm tan
    iconColor: '#ffffff',
    glow: 'rgba(137,145,107,0.45)',
  },
  modernElegance: {
    primary: '#475569',     // slate
    accent: '#cbd5e1',      // light slate
    iconColor: '#ffffff',
    glow: 'rgba(71,85,105,0.45)',
  },
  rusticCharm: {
    primary: '#92400e',     // warm brown
    accent: '#d4a373',      // sand
    iconColor: '#ffffff',
    glow: 'rgba(146,64,14,0.45)',
  },
  beachBliss: {
    primary: '#0891b2',     // turquoise
    accent: '#7dd3fc',      // sky
    iconColor: '#ffffff',
    glow: 'rgba(8,145,178,0.45)',
  },
  classicTradition: {
    primary: '#7c2d12',     // burgundy
    accent: '#fbbf24',      // gold
    iconColor: '#ffffff',
    glow: 'rgba(124,45,18,0.45)',
  },
  bohoChic: {
    primary: '#a16207',     // mustard
    accent: '#dc2626',      // crimson
    iconColor: '#ffffff',
    glow: 'rgba(161,98,7,0.45)',
  },
};

/** Default fallback when the template id isn't in the map. */
export const DEFAULT_THEME: TemplateTheme = {
  primary: '#c9a96e',
  accent: '#a07840',
  iconColor: '#1a0e00',
  glow: 'rgba(201,169,110,0.45)',
};

export function getTemplateTheme(template?: string | null): TemplateTheme {
  if (!template) return DEFAULT_THEME;
  return TEMPLATE_THEMES[template] ?? DEFAULT_THEME;
}

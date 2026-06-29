/**
 * Per-template list of sections that the admin can toggle on/off.
 *
 * Section visibility is stored on the wedding as `sections` (a JSON map). A
 * section is SHOWN unless its flag is explicitly `false`, so existing weddings
 * (no `sections` value) keep showing everything.
 *
 * Keys here must match the `show('<key>')` calls inside each template component.
 */
export interface SectionDef {
  key: string;
  labelKey: string;
}

const L = (k: string) => `createWedding.sections.${k}`;

const DEAR_GUESTS: SectionDef = { key: 'dearGuests', labelKey: L('dearGuests') };
const COUNTDOWN: SectionDef = { key: 'countdown', labelKey: L('countdown') };
const DETAILS: SectionDef = { key: 'details', labelKey: L('details') };
const STORY: SectionDef = { key: 'story', labelKey: L('story') };
const GALLERY: SectionDef = { key: 'gallery', labelKey: L('gallery') };
const RSVP: SectionDef = { key: 'rsvp', labelKey: L('rsvp') };
const GUESTBOOK: SectionDef = { key: 'guestbook', labelKey: L('guestBook') };

export const TEMPLATE_SECTIONS: Record<string, SectionDef[]> = {
  imperial: [
    { key: 'blessing', labelKey: L('blessing') },
    COUNTDOWN,
    { key: 'schedule', labelKey: L('schedule') },
    { key: 'venue', labelKey: L('venue') },
    { key: 'location', labelKey: L('location') },
    RSVP,
    { key: 'guestBook', labelKey: L('guestBook') },
  ],
  modern: [DEAR_GUESTS, COUNTDOWN, DETAILS, STORY, GALLERY, RSVP, GUESTBOOK],
  aurora: [DEAR_GUESTS, COUNTDOWN, GALLERY, DETAILS, RSVP, GUESTBOOK],
  velvet: [DEAR_GUESTS, COUNTDOWN, GALLERY, DETAILS, RSVP, GUESTBOOK],
  pearl: [DEAR_GUESTS, COUNTDOWN, GALLERY, DETAILS, RSVP, GUESTBOOK],
  epic: [DETAILS, RSVP, GUESTBOOK],
  flower: [DETAILS, RSVP, GUESTBOOK],
};

/** Every section key across all templates, defaulted to ON (for form state). */
export const DEFAULT_SECTIONS: Record<string, boolean> = {
  blessing: true, countdown: true, schedule: true, venue: true, location: true,
  rsvp: true, guestBook: true, dearGuests: true, details: true, story: true,
  gallery: true, guestbook: true,
};

export function getTemplateSections(template?: string | null): SectionDef[] {
  return TEMPLATE_SECTIONS[template || ''] || [];
}

/** True unless the section is explicitly turned off. */
export function sectionShown(sections: Record<string, any> | null | undefined, key: string): boolean {
  return (sections || {})[key] !== false;
}

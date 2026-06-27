export const TEMPLATE_REGISTRY = {
  wedding: [
    // Curated set shown in the admin "Create Event" dropdown.
    // Each entry's `value` matches the id used by WeddingSite to render
    // the corresponding template component. Add/remove templates here
    // to control what admins can pick from.
    { value: 'modern', label: 'Azamat (Zamonaviy) ⭐' },
    { value: 'epic', label: 'Epic' },
    { value: 'flower', label: 'Gul' },
    { value: 'velvet', label: 'Velvet' },
    { value: 'pearl', label: 'Pearl' },
    { value: 'aurora', label: 'Aurora' },
    { value: 'imperial', label: 'Imperial 👑' },
  ],
};

export const EVENT_TYPES = [
  { value: 'wedding', label: 'To\'y' },
];

export type EventType = keyof typeof TEMPLATE_REGISTRY;
export type TemplateValue = typeof TEMPLATE_REGISTRY[EventType][number]['value'];

// Safe accessor: legacy records may carry an event type that no longer exists
// (e.g. 'birthday'); fall back to the wedding set so admin forms never crash on
// `TEMPLATE_REGISTRY[eventType].map(...)`.
export function getTemplatesForEvent(eventType?: string) {
  return TEMPLATE_REGISTRY[eventType as EventType] || TEMPLATE_REGISTRY.wedding;
}

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
  ],
  birthday: [
    { value: 'birthday', label: 'Tug\'ilgan kun bayrami' },
    { value: 'standard', label: 'Standart' },
    { value: 'flower', label: 'Gul' },
  ],
};

export const EVENT_TYPES = [
  { value: 'wedding', label: 'To\'y' },
  { value: 'birthday', label: 'Tug\'ilgan kun' },
];

export type EventType = keyof typeof TEMPLATE_REGISTRY;
export type TemplateValue = typeof TEMPLATE_REGISTRY[EventType][number]['value'];


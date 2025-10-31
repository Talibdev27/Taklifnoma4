export const TEMPLATE_REGISTRY = {
  wedding: [
    { value: 'standard', label: 'Standard' },
    { value: 'epic', label: 'Epic' },
    { value: 'anime_1', label: 'Anime 1 (Animated)' },
    { value: 'flower', label: 'Flower' },
    { value: 'gul', label: 'Gul' },
    { value: 'gardenRomance', label: 'Garden Romance' },
    { value: 'modernElegance', label: 'Modern Elegance' },
    { value: 'rusticCharm', label: 'Rustic Charm' },
    { value: 'beachBliss', label: 'Beach Bliss' },
    { value: 'classicTradition', label: 'Classic Tradition' },
    { value: 'bohoChic', label: 'Boho Chic' }
  ],
  birthday: [
    { value: 'birthday', label: 'Birthday Celebration' },
    { value: 'standard', label: 'Standard' },
    { value: 'flower', label: 'Flower' }
  ]
};

export const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'birthday', label: 'Birthday' }
];

export type EventType = keyof typeof TEMPLATE_REGISTRY;
export type TemplateValue = typeof TEMPLATE_REGISTRY[EventType][number]['value'];

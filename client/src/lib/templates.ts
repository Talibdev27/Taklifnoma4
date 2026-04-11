export const TEMPLATE_REGISTRY = {
  wedding: [
    { value: 'modern', label: 'Azamat (Zamonaviy) ⭐' },
    { value: 'standard', label: 'Standart' },
    { value: 'epic', label: 'Epic' },
    { value: 'anime_1', label: 'Anime 1 (Animatsiyali)' },
    { value: 'flower', label: 'Gul' },
    { value: 'gul', label: 'Gul 2' },
    { value: 'ccostumer_1', label: 'Mijoz 1' },
    { value: 'gardenRomance', label: 'Bog\' Romantikasi' },
    { value: 'modernElegance', label: 'Zamonaviy Nafosatli' },
    { value: 'rusticCharm', label: 'Rustik Joziba' },
    { value: 'beachBliss', label: 'Sohil Baxti' },
    { value: 'classicTradition', label: 'Klassik An\'ana' },
    { value: 'bohoChic', label: 'Boho Shik' },
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


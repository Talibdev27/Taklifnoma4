import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en/translation.json';
import ru from '../locales/ru/translation.json';
import uz from '../locales/uz/translation.json';
import kk from '../locales/kk/translation.json';
import kaa from '../locales/kaa/translation.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uz: { translation: uz },
  kk: { translation: kk },
  kaa: { translation: kaa },
};

// Get saved language from localStorage or default to Uzbek
const savedLanguage = localStorage.getItem('language') || 'uz';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
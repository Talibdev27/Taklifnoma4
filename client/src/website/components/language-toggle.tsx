import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'kaa', name: 'Қарақалпақша', flag: '🇺🇿' },
];

export function LanguageToggle({ isScrolled = false }: { isScrolled?: boolean }) {
  const { i18n } = useTranslation();
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    // Force a re-render by triggering a storage event
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 hover:bg-transparent">
          <span className="text-xl">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={`backdrop-blur-xl ${
        isScrolled 
          ? 'bg-white/95 border-gray-200' 
          : 'bg-[#2d4a6f]/95 border-white/10'
      }`}>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`${
              i18n.language === language.code 
                ? isScrolled ? 'bg-gray-100' : 'bg-white/10' 
                : ''
            } ${
              isScrolled 
                ? 'text-[#002147] hover:bg-gray-100' 
                : 'text-white hover:bg-white/10'
            } hover:text-[#d4a574] cursor-pointer`}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

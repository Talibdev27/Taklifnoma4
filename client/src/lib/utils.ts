import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Use current locale or fallback to English
  const currentLocale = locale || localStorage.getItem('language') || 'en';
  
  // Custom Uzbek month names
  if (currentLocale === 'uz') {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  
  // Custom Kazakh month names
  if (currentLocale === 'kk') {
    const months = [
      'Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым',
      'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'
    ];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  
  // Use browser locale for other languages
  return d.toLocaleDateString(currentLocale === 'en' ? 'en-US' : 'ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
}

export function generateUniqueUrl(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function calculateTimeUntil(targetDate: Date | string) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const difference = target.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

/**
 * Calculate time until wedding with timezone awareness
 */
export function calculateWeddingCountdown(
  weddingDate: Date | string, 
  weddingTime: string = '16:00', 
  weddingTimezone: string = 'Asia/Tashkent'
) {
  const date = typeof weddingDate === 'string' ? new Date(weddingDate) : weddingDate;
  
  // Parse wedding time (e.g., "4:00 PM", "16:00")
  let [time, modifier] = weddingTime.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (modifier) {
    if (modifier.toLowerCase() === 'pm' && hours !== 12) {
      hours += 12;
    }
    if (modifier.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }
  }
  
  // Create wedding datetime in local timezone first
  const weddingLocalDateTime = new Date(date);
  weddingLocalDateTime.setHours(hours, minutes || 0, 0, 0);
  
  // Get current time
  const now = new Date();
  
  // Calculate difference
  const difference = weddingLocalDateTime.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hrs = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours: hrs, minutes: mins, seconds: secs, isExpired: false };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

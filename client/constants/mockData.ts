export interface Language {
  code: string;
  name: string;
  nameEn: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  pricePerMinute: number;
}

export interface Translator {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  totalCalls: number;
  languages: { from: string; to: string }[];
  categories: string[];
  isOnline: boolean;
  bio: string;
}

export interface CallHistory {
  id: string;
  translatorName: string;
  translatorId: string;
  fromLang: string;
  toLang: string;
  category: string;
  duration: number;
  totalPrice: number;
  rating?: number;
  date: Date;
  status: "completed" | "cancelled" | "missed";
}

export const languages: Language[] = [
  { code: "ka", name: "ქართული", nameEn: "Georgian" },
  { code: "en", name: "ინგლისური", nameEn: "English" },
  { code: "de", name: "გერმანული", nameEn: "German" },
  { code: "fr", name: "ფრანგული", nameEn: "French" },
  { code: "it", name: "იტალიური", nameEn: "Italian" },
  { code: "es", name: "ესპანური", nameEn: "Spanish" },
  { code: "ru", name: "რუსული", nameEn: "Russian" },
  { code: "tr", name: "თურქული", nameEn: "Turkish" },
];

export const categories: Category[] = [
  { id: "general", name: "ზოგადი", nameEn: "General", icon: "message-circle", pricePerMinute: 2 },
  { id: "administrative", name: "ადმინისტრაციული", nameEn: "Administrative", icon: "file-text", pricePerMinute: 2.5 },
  { id: "business", name: "ბიზნესი", nameEn: "Business", icon: "briefcase", pricePerMinute: 3 },
  { id: "medical", name: "სამედიცინო", nameEn: "Medical", icon: "heart", pricePerMinute: 4 },
  { id: "legal", name: "იურიდიული", nameEn: "Legal", icon: "shield", pricePerMinute: 4 },
];

export const mockTranslators: Translator[] = [
  {
    id: "1",
    name: "Anna K.",
    rating: 4.9,
    totalCalls: 156,
    languages: [
      { from: "ka", to: "en" },
      { from: "en", to: "ka" },
      { from: "ka", to: "de" },
    ],
    categories: ["general", "business"],
    isOnline: true,
    bio: "Professional translator with 5 years of experience",
  },
  {
    id: "2",
    name: "Giorgi M.",
    rating: 4.7,
    totalCalls: 89,
    languages: [
      { from: "ka", to: "en" },
      { from: "en", to: "ka" },
    ],
    categories: ["general", "medical"],
    isOnline: true,
    bio: "Specializing in medical translations",
  },
  {
    id: "3",
    name: "Nino S.",
    rating: 4.8,
    totalCalls: 234,
    languages: [
      { from: "ka", to: "fr" },
      { from: "fr", to: "ka" },
      { from: "ka", to: "en" },
    ],
    categories: ["general", "legal", "administrative"],
    isOnline: false,
    bio: "Legal document specialist",
  },
];

export const mockHistory: CallHistory[] = [
  {
    id: "1",
    translatorName: "Anna K.",
    translatorId: "1",
    fromLang: "ka",
    toLang: "en",
    category: "general",
    duration: 420,
    totalPrice: 14,
    rating: 5,
    date: new Date(Date.now() - 86400000),
    status: "completed",
  },
  {
    id: "2",
    translatorName: "Giorgi M.",
    translatorId: "2",
    fromLang: "ka",
    toLang: "en",
    category: "medical",
    duration: 600,
    totalPrice: 40,
    rating: 4,
    date: new Date(Date.now() - 172800000),
    status: "completed",
  },
  {
    id: "3",
    translatorName: "Nino S.",
    translatorId: "3",
    fromLang: "ka",
    toLang: "fr",
    category: "legal",
    duration: 0,
    totalPrice: 0,
    date: new Date(Date.now() - 259200000),
    status: "cancelled",
  },
];

export const getLanguageName = (code: string): string => {
  const lang = languages.find((l) => l.code === code);
  return lang?.nameEn || code;
};

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find((c) => c.id === id);
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const formatPrice = (price: number): string => {
  return `${price.toFixed(2)}₾`;
};

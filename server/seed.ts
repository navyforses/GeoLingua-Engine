import { db } from "./db";
import { translators, categories, languages, users } from "@shared/schema";

const seedLanguages = [
  { code: "ka", name: "ქართული", nameEn: "Georgian" },
  { code: "en", name: "ინგლისური", nameEn: "English" },
  { code: "de", name: "გერმანული", nameEn: "German" },
  { code: "fr", name: "ფრანგული", nameEn: "French" },
  { code: "it", name: "იტალიური", nameEn: "Italian" },
  { code: "es", name: "ესპანური", nameEn: "Spanish" },
  { code: "ru", name: "რუსული", nameEn: "Russian" },
  { code: "tr", name: "თურქული", nameEn: "Turkish" },
];

const seedCategories = [
  { id: "general", name: "ზოგადი", nameEn: "General", icon: "message-circle", pricePerMinute: 2 },
  { id: "administrative", name: "ადმინისტრაციული", nameEn: "Administrative", icon: "file-text", pricePerMinute: 2.5 },
  { id: "business", name: "ბიზნესი", nameEn: "Business", icon: "briefcase", pricePerMinute: 3 },
  { id: "medical", name: "სამედიცინო", nameEn: "Medical", icon: "heart", pricePerMinute: 4 },
  { id: "legal", name: "იურიდიული", nameEn: "Legal", icon: "shield", pricePerMinute: 4 },
];

const seedTranslators = [
  {
    name: "Anna Kobakhidze",
    email: "anna@geolingua.com",
    bio: "Professional translator with 5 years of experience in business and general translations. Fluent in Georgian, English, and German.",
    rating: 4.9,
    totalCalls: 156,
    totalMinutes: 4200,
    isOnline: true,
    isVerified: true,
    languages: [
      { from: "ka", to: "en" },
      { from: "en", to: "ka" },
      { from: "ka", to: "de" },
      { from: "de", to: "ka" },
    ],
    categories: ["general", "business"],
  },
  {
    name: "Giorgi Margvelashvili",
    email: "giorgi@geolingua.com",
    bio: "Medical specialist translator with background in healthcare. Certified for medical documentation translation.",
    rating: 4.7,
    totalCalls: 89,
    totalMinutes: 2450,
    isOnline: true,
    isVerified: true,
    languages: [
      { from: "ka", to: "en" },
      { from: "en", to: "ka" },
    ],
    categories: ["general", "medical"],
  },
  {
    name: "Nino Surguladze",
    email: "nino@geolingua.com",
    bio: "Legal document specialist with 8 years experience in court and administrative translations. Sworn translator.",
    rating: 4.8,
    totalCalls: 234,
    totalMinutes: 7800,
    isOnline: false,
    isVerified: true,
    languages: [
      { from: "ka", to: "fr" },
      { from: "fr", to: "ka" },
      { from: "ka", to: "en" },
      { from: "en", to: "ka" },
    ],
    categories: ["general", "legal", "administrative"],
  },
  {
    name: "Davit Kvaratskhelia",
    email: "davit@geolingua.com",
    bio: "Business interpreter specialized in negotiations and corporate meetings. MBA graduate with translation certification.",
    rating: 4.6,
    totalCalls: 67,
    totalMinutes: 1890,
    isOnline: true,
    isVerified: true,
    languages: [
      { from: "ka", to: "en" },
      { from: "en", to: "ka" },
      { from: "ka", to: "ru" },
      { from: "ru", to: "ka" },
    ],
    categories: ["business", "administrative"],
  },
  {
    name: "Mariam Tskitishvili",
    email: "mariam@geolingua.com",
    bio: "Multilingual translator fluent in 5 languages. Specializes in tourism and general interpretation.",
    rating: 4.5,
    totalCalls: 45,
    totalMinutes: 980,
    isOnline: false,
    isVerified: false,
    languages: [
      { from: "ka", to: "es" },
      { from: "es", to: "ka" },
      { from: "ka", to: "it" },
      { from: "it", to: "ka" },
      { from: "ka", to: "en" },
    ],
    categories: ["general"],
  },
];

const seedUser = {
  email: "demo@geolingua.com",
  name: "Demo User",
  phone: "+995 555 123 456",
  preferredLanguage: "en",
};

export async function seedDatabase() {
  console.log("Seeding database...");

  const existingLanguages = await db.select().from(languages);
  if (existingLanguages.length === 0) {
    await db.insert(languages).values(seedLanguages);
    console.log("Languages seeded");
  }

  const existingCategories = await db.select().from(categories);
  if (existingCategories.length === 0) {
    await db.insert(categories).values(seedCategories);
    console.log("Categories seeded");
  }

  const existingTranslators = await db.select().from(translators);
  if (existingTranslators.length === 0) {
    await db.insert(translators).values(seedTranslators);
    console.log("Translators seeded");
  }

  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    await db.insert(users).values(seedUser);
    console.log("Demo user seeded");
  }

  console.log("Database seeding complete");
}

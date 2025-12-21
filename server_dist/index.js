var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  calls: () => calls,
  categories: () => categories,
  insertCallSchema: () => insertCallSchema,
  insertTranslatorSchema: () => insertTranslatorSchema,
  insertUserSchema: () => insertUserSchema,
  languages: () => languages,
  translators: () => translators,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  preferredLanguage: text("preferred_language").default("en"),
  createdAt: timestamp("created_at").defaultNow()
});
var translators = pgTable("translators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  rating: real("rating").default(5),
  totalCalls: integer("total_calls").default(0),
  totalMinutes: integer("total_minutes").default(0),
  isOnline: boolean("is_online").default(false),
  isVerified: boolean("is_verified").default(false),
  languages: jsonb("languages").$type().default([]),
  categories: jsonb("categories").$type().default([]),
  createdAt: timestamp("created_at").defaultNow()
});
var calls = pgTable("calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  translatorId: varchar("translator_id").references(() => translators.id),
  fromLang: text("from_lang").notNull(),
  toLang: text("to_lang").notNull(),
  category: text("category").notNull(),
  pricePerMinute: real("price_per_minute").notNull(),
  duration: integer("duration").default(0),
  totalPrice: real("total_price").default(0),
  status: text("status").notNull().default("pending"),
  rating: integer("rating"),
  comment: text("comment"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  icon: text("icon").notNull(),
  pricePerMinute: real("price_per_minute").notNull()
});
var languages = pgTable("languages", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertTranslatorSchema = createInsertSchema(translators).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalCalls: true,
  totalMinutes: true
});
var insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  createdAt: true,
  duration: true,
  totalPrice: true
});

// server/db.ts
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  async getUsers() {
    return db.select().from(users);
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  async getTranslators() {
    return db.select().from(translators).orderBy(desc(translators.rating));
  }
  async getTranslator(id) {
    const [translator] = await db.select().from(translators).where(eq(translators.id, id));
    return translator;
  }
  async getOnlineTranslators() {
    return db.select().from(translators).where(eq(translators.isOnline, true)).orderBy(desc(translators.rating));
  }
  async createTranslator(translator) {
    const [newTranslator] = await db.insert(translators).values(translator).returning();
    return newTranslator;
  }
  async updateTranslatorOnline(id, isOnline) {
    await db.update(translators).set({ isOnline }).where(eq(translators.id, id));
  }
  async updateTranslatorStats(id, rating, totalCalls, totalMinutes) {
    await db.update(translators).set({ rating, totalCalls, totalMinutes }).where(eq(translators.id, id));
  }
  async getCalls() {
    return db.select().from(calls).orderBy(desc(calls.createdAt));
  }
  async getCall(id) {
    const [call] = await db.select().from(calls).where(eq(calls.id, id));
    return call;
  }
  async getUserCalls(userId) {
    return db.select().from(calls).where(eq(calls.userId, userId)).orderBy(desc(calls.createdAt));
  }
  async createCall(call) {
    const [newCall] = await db.insert(calls).values(call).returning();
    return newCall;
  }
  async updateCall(id, updates) {
    const [updatedCall] = await db.update(calls).set(updates).where(eq(calls.id, id)).returning();
    return updatedCall;
  }
  async rateCall(id, rating, comment) {
    const [updatedCall] = await db.update(calls).set({ rating, comment, status: "completed" }).where(eq(calls.id, id)).returning();
    return updatedCall;
  }
  async getCategories() {
    return db.select().from(categories);
  }
  async getCategory(id) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  async getLanguages() {
    return db.select().from(languages);
  }
};
var storage = new DatabaseStorage();

// server/seed.ts
var seedLanguages = [
  { code: "ka", name: "\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8", nameEn: "Georgian" },
  { code: "en", name: "\u10D8\u10DC\u10D2\u10DA\u10D8\u10E1\u10E3\u10E0\u10D8", nameEn: "English" },
  { code: "de", name: "\u10D2\u10D4\u10E0\u10DB\u10D0\u10DC\u10E3\u10DA\u10D8", nameEn: "German" },
  { code: "fr", name: "\u10E4\u10E0\u10D0\u10DC\u10D2\u10E3\u10DA\u10D8", nameEn: "French" },
  { code: "it", name: "\u10D8\u10E2\u10D0\u10DA\u10D8\u10E3\u10E0\u10D8", nameEn: "Italian" },
  { code: "es", name: "\u10D4\u10E1\u10DE\u10D0\u10DC\u10E3\u10E0\u10D8", nameEn: "Spanish" },
  { code: "ru", name: "\u10E0\u10E3\u10E1\u10E3\u10DA\u10D8", nameEn: "Russian" },
  { code: "tr", name: "\u10D7\u10E3\u10E0\u10E5\u10E3\u10DA\u10D8", nameEn: "Turkish" }
];
var seedCategories = [
  { id: "general", name: "\u10D6\u10DD\u10D2\u10D0\u10D3\u10D8", nameEn: "General", icon: "message-circle", pricePerMinute: 2 },
  { id: "administrative", name: "\u10D0\u10D3\u10DB\u10D8\u10DC\u10D8\u10E1\u10E2\u10E0\u10D0\u10EA\u10D8\u10E3\u10DA\u10D8", nameEn: "Administrative", icon: "file-text", pricePerMinute: 2.5 },
  { id: "business", name: "\u10D1\u10D8\u10D6\u10DC\u10D4\u10E1\u10D8", nameEn: "Business", icon: "briefcase", pricePerMinute: 3 },
  { id: "medical", name: "\u10E1\u10D0\u10DB\u10D4\u10D3\u10D8\u10EA\u10D8\u10DC\u10DD", nameEn: "Medical", icon: "heart", pricePerMinute: 4 },
  { id: "legal", name: "\u10D8\u10E3\u10E0\u10D8\u10D3\u10D8\u10E3\u10DA\u10D8", nameEn: "Legal", icon: "shield", pricePerMinute: 4 }
];
var seedTranslators = [
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
      { from: "de", to: "ka" }
    ],
    categories: ["general", "business"]
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
      { from: "en", to: "ka" }
    ],
    categories: ["general", "medical"]
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
      { from: "en", to: "ka" }
    ],
    categories: ["general", "legal", "administrative"]
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
      { from: "ru", to: "ka" }
    ],
    categories: ["business", "administrative"]
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
      { from: "ka", to: "en" }
    ],
    categories: ["general"]
  }
];
var seedUser = {
  email: "demo@geolingua.com",
  name: "Demo User",
  phone: "+995 555 123 456",
  preferredLanguage: "en"
};
async function seedDatabase() {
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

// server/i18n.ts
var messages = {
  errors: {
    languagesNotFound: {
      ka: "\u10D4\u10DC\u10D4\u10D1\u10D8 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0",
      en: "Failed to fetch languages"
    },
    categoriesNotFound: {
      ka: "\u10D9\u10D0\u10E2\u10D4\u10D2\u10DD\u10E0\u10D8\u10D4\u10D1\u10D8 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0",
      en: "Failed to fetch categories"
    },
    categoryNotFound: {
      ka: "\u10D9\u10D0\u10E2\u10D4\u10D2\u10DD\u10E0\u10D8\u10D0 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0",
      en: "Category not found"
    },
    translatorsNotFound: {
      ka: "\u10D7\u10D0\u10E0\u10EF\u10D8\u10DB\u10DC\u10D4\u10D1\u10D8 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0",
      en: "Failed to fetch translators"
    },
    translatorNotFound: {
      ka: "\u10D7\u10D0\u10E0\u10EF\u10D8\u10DB\u10D0\u10DC\u10D8 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0",
      en: "Translator not found"
    },
    translatorStatusUpdateFailed: {
      ka: "\u10D7\u10D0\u10E0\u10EF\u10D8\u10DB\u10DC\u10D8\u10E1 \u10E1\u10E2\u10D0\u10E2\u10E3\u10E1\u10D8\u10E1 \u10D2\u10D0\u10DC\u10D0\u10EE\u10DA\u10D4\u10D1\u10D0 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10EE\u10D4\u10E0\u10EE\u10D3\u10D0",
      en: "Failed to update translator status"
    },
    userNotFound: {
      ka: "\u10DB\u10DD\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10D4\u10DA\u10D8 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0",
      en: "User not found"
    },
    userCreateFailed: {
      ka: "\u10DB\u10DD\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10DA\u10D8\u10E1 \u10E8\u10D4\u10E5\u10DB\u10DC\u10D0 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10EE\u10D4\u10E0\u10EE\u10D3\u10D0",
      en: "Failed to create user"
    },
    callsNotFound: {
      ka: "\u10D6\u10D0\u10E0\u10D4\u10D1\u10D8 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0",
      en: "Failed to fetch calls"
    },
    callNotFound: {
      ka: "\u10D6\u10D0\u10E0\u10D8 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0",
      en: "Call not found"
    },
    callCreateFailed: {
      ka: "\u10D6\u10D0\u10E0\u10D8\u10E1 \u10E8\u10D4\u10E5\u10DB\u10DC\u10D0 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10EE\u10D4\u10E0\u10EE\u10D3\u10D0",
      en: "Failed to create call"
    },
    callUpdateFailed: {
      ka: "\u10D6\u10D0\u10E0\u10D8\u10E1 \u10D2\u10D0\u10DC\u10D0\u10EE\u10DA\u10D4\u10D1\u10D0 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10EE\u10D4\u10E0\u10EE\u10D3\u10D0",
      en: "Failed to update call"
    },
    callRateFailed: {
      ka: "\u10D6\u10D0\u10E0\u10D8\u10E1 \u10E8\u10D4\u10E4\u10D0\u10E1\u10D4\u10D1\u10D0 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10EE\u10D4\u10E0\u10EE\u10D3\u10D0",
      en: "Failed to rate call"
    },
    onlineCountFailed: {
      ka: "\u10DD\u10DC\u10DA\u10D0\u10D8\u10DC \u10D7\u10D0\u10E0\u10EF\u10D8\u10DB\u10DC\u10D4\u10D1\u10D8\u10E1 \u10E0\u10D0\u10DD\u10D3\u10D4\u10DC\u10DD\u10D1\u10D0 \u10D5\u10D4\u10E0 \u10DB\u10DD\u10D8\u10EB\u10D4\u10D1\u10DC\u10D0",
      en: "Failed to fetch online count"
    },
    invalidRequest: {
      ka: "\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10DB\u10DD\u10D7\u10EE\u10DD\u10D5\u10DC\u10D0",
      en: "Invalid request"
    },
    serverError: {
      ka: "\u10E1\u10D4\u10E0\u10D5\u10D4\u10E0\u10D8\u10E1 \u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D0",
      en: "Server error"
    }
  },
  success: {
    statusUpdated: {
      ka: "\u10E1\u10E2\u10D0\u10E2\u10E3\u10E1\u10D8 \u10EC\u10D0\u10E0\u10DB\u10D0\u10E2\u10D4\u10D1\u10D8\u10D7 \u10D2\u10D0\u10DC\u10D0\u10EE\u10DA\u10D3\u10D0",
      en: "Status updated successfully"
    },
    callCreated: {
      ka: "\u10D6\u10D0\u10E0\u10D8 \u10EC\u10D0\u10E0\u10DB\u10D0\u10E2\u10D4\u10D1\u10D8\u10D7 \u10E8\u10D4\u10D8\u10E5\u10DB\u10DC\u10D0",
      en: "Call created successfully"
    },
    callRated: {
      ka: "\u10D6\u10D0\u10E0\u10D8 \u10EC\u10D0\u10E0\u10DB\u10D0\u10E2\u10D4\u10D1\u10D8\u10D7 \u10E8\u10D4\u10E4\u10D0\u10E1\u10D3\u10D0",
      en: "Call rated successfully"
    }
  },
  callStatus: {
    pending: {
      ka: "\u10DB\u10DD\u10DA\u10DD\u10D3\u10D8\u10DC\u10E8\u10D8",
      en: "Pending"
    },
    matching: {
      ka: "\u10D7\u10D0\u10E0\u10EF\u10D8\u10DB\u10DC\u10D8\u10E1 \u10EB\u10D8\u10D4\u10D1\u10D0",
      en: "Matching"
    },
    active: {
      ka: "\u10DB\u10D8\u10DB\u10D3\u10D8\u10DC\u10D0\u10E0\u10D4",
      en: "Active"
    },
    completed: {
      ka: "\u10D3\u10D0\u10E1\u10E0\u10E3\u10DA\u10D4\u10D1\u10E3\u10DA\u10D8",
      en: "Completed"
    },
    cancelled: {
      ka: "\u10D2\u10D0\u10E3\u10E5\u10DB\u10D4\u10D1\u10E3\u10DA\u10D8",
      en: "Cancelled"
    },
    missed: {
      ka: "\u10D2\u10D0\u10DB\u10DD\u10E2\u10DD\u10D5\u10D4\u10D1\u10E3\u10DA\u10D8",
      en: "Missed"
    }
  }
};
function getLocale(acceptLanguage) {
  if (!acceptLanguage) return "en";
  if (acceptLanguage.includes("ka")) return "ka";
  return "en";
}

// server/routes.ts
function getError(key, locale) {
  return messages.errors[key][locale];
}
function getSuccess(key, locale) {
  return messages.success[key][locale];
}
async function registerRoutes(app2) {
  await seedDatabase();
  app2.get("/api/languages", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const languages2 = await storage.getLanguages();
      res.json({ data: languages2, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("languagesNotFound", locale),
        errorKa: messages.errors.languagesNotFound.ka,
        errorEn: messages.errors.languagesNotFound.en,
        locale
      });
    }
  });
  app2.get("/api/categories", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const categories2 = await storage.getCategories();
      res.json({ data: categories2, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("categoriesNotFound", locale),
        errorKa: messages.errors.categoriesNotFound.ka,
        errorEn: messages.errors.categoriesNotFound.en,
        locale
      });
    }
  });
  app2.get("/api/categories/:id", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({
          error: getError("categoryNotFound", locale),
          errorKa: messages.errors.categoryNotFound.ka,
          errorEn: messages.errors.categoryNotFound.en,
          locale
        });
      }
      res.json({ data: category, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("categoriesNotFound", locale),
        errorKa: messages.errors.categoriesNotFound.ka,
        errorEn: messages.errors.categoriesNotFound.en,
        locale
      });
    }
  });
  app2.get("/api/translators", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const translators2 = await storage.getTranslators();
      res.json({ data: translators2, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("translatorsNotFound", locale),
        errorKa: messages.errors.translatorsNotFound.ka,
        errorEn: messages.errors.translatorsNotFound.en,
        locale
      });
    }
  });
  app2.get("/api/translators/online", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const translators2 = await storage.getOnlineTranslators();
      res.json({ data: translators2, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("translatorsNotFound", locale),
        errorKa: messages.errors.translatorsNotFound.ka,
        errorEn: messages.errors.translatorsNotFound.en,
        locale
      });
    }
  });
  app2.get("/api/translators/:id", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const translator = await storage.getTranslator(req.params.id);
      if (!translator) {
        return res.status(404).json({
          error: getError("translatorNotFound", locale),
          errorKa: messages.errors.translatorNotFound.ka,
          errorEn: messages.errors.translatorNotFound.en,
          locale
        });
      }
      res.json({ data: translator, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("translatorsNotFound", locale),
        errorKa: messages.errors.translatorsNotFound.ka,
        errorEn: messages.errors.translatorsNotFound.en,
        locale
      });
    }
  });
  app2.patch("/api/translators/:id/status", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const { isOnline } = req.body;
      await storage.updateTranslatorOnline(req.params.id, isOnline);
      res.json({
        success: true,
        message: getSuccess("statusUpdated", locale),
        messageKa: messages.success.statusUpdated.ka,
        messageEn: messages.success.statusUpdated.en,
        locale
      });
    } catch (error) {
      res.status(500).json({
        error: getError("translatorStatusUpdateFailed", locale),
        errorKa: messages.errors.translatorStatusUpdateFailed.ka,
        errorEn: messages.errors.translatorStatusUpdateFailed.en,
        locale
      });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({
          error: getError("userNotFound", locale),
          errorKa: messages.errors.userNotFound.ka,
          errorEn: messages.errors.userNotFound.en,
          locale
        });
      }
      res.json({ data: user, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("userNotFound", locale),
        errorKa: messages.errors.userNotFound.ka,
        errorEn: messages.errors.userNotFound.en,
        locale
      });
    }
  });
  app2.post("/api/users", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json({ data: user, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("userCreateFailed", locale),
        errorKa: messages.errors.userCreateFailed.ka,
        errorEn: messages.errors.userCreateFailed.en,
        locale
      });
    }
  });
  app2.get("/api/calls", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const calls2 = await storage.getCalls();
      const callsWithStatus = calls2.map((call) => ({
        ...call,
        statusKa: messages.callStatus[call.status]?.ka || call.status,
        statusEn: messages.callStatus[call.status]?.en || call.status
      }));
      res.json({ data: callsWithStatus, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("callsNotFound", locale),
        errorKa: messages.errors.callsNotFound.ka,
        errorEn: messages.errors.callsNotFound.en,
        locale
      });
    }
  });
  app2.get("/api/calls/:id", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const call = await storage.getCall(req.params.id);
      if (!call) {
        return res.status(404).json({
          error: getError("callNotFound", locale),
          errorKa: messages.errors.callNotFound.ka,
          errorEn: messages.errors.callNotFound.en,
          locale
        });
      }
      const callWithStatus = {
        ...call,
        statusKa: messages.callStatus[call.status]?.ka || call.status,
        statusEn: messages.callStatus[call.status]?.en || call.status
      };
      res.json({ data: callWithStatus, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("callsNotFound", locale),
        errorKa: messages.errors.callsNotFound.ka,
        errorEn: messages.errors.callsNotFound.en,
        locale
      });
    }
  });
  app2.get("/api/users/:userId/calls", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const calls2 = await storage.getUserCalls(req.params.userId);
      const callsWithStatus = calls2.map((call) => ({
        ...call,
        statusKa: messages.callStatus[call.status]?.ka || call.status,
        statusEn: messages.callStatus[call.status]?.en || call.status
      }));
      res.json({ data: callsWithStatus, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("callsNotFound", locale),
        errorKa: messages.errors.callsNotFound.ka,
        errorEn: messages.errors.callsNotFound.en,
        locale
      });
    }
  });
  app2.post("/api/calls", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const call = await storage.createCall(req.body);
      res.status(201).json({
        data: call,
        locale,
        message: getSuccess("callCreated", locale),
        messageKa: messages.success.callCreated.ka,
        messageEn: messages.success.callCreated.en
      });
    } catch (error) {
      res.status(500).json({
        error: getError("callCreateFailed", locale),
        errorKa: messages.errors.callCreateFailed.ka,
        errorEn: messages.errors.callCreateFailed.en,
        locale
      });
    }
  });
  app2.patch("/api/calls/:id", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const call = await storage.updateCall(req.params.id, req.body);
      if (!call) {
        return res.status(404).json({
          error: getError("callNotFound", locale),
          errorKa: messages.errors.callNotFound.ka,
          errorEn: messages.errors.callNotFound.en,
          locale
        });
      }
      const callWithStatus = {
        ...call,
        statusKa: messages.callStatus[call.status]?.ka || call.status,
        statusEn: messages.callStatus[call.status]?.en || call.status
      };
      res.json({ data: callWithStatus, locale });
    } catch (error) {
      res.status(500).json({
        error: getError("callUpdateFailed", locale),
        errorKa: messages.errors.callUpdateFailed.ka,
        errorEn: messages.errors.callUpdateFailed.en,
        locale
      });
    }
  });
  app2.post("/api/calls/:id/rate", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const { rating, comment } = req.body;
      const call = await storage.rateCall(req.params.id, rating, comment);
      if (!call) {
        return res.status(404).json({
          error: getError("callNotFound", locale),
          errorKa: messages.errors.callNotFound.ka,
          errorEn: messages.errors.callNotFound.en,
          locale
        });
      }
      res.json({
        data: call,
        locale,
        message: getSuccess("callRated", locale),
        messageKa: messages.success.callRated.ka,
        messageEn: messages.success.callRated.en
      });
    } catch (error) {
      res.status(500).json({
        error: getError("callRateFailed", locale),
        errorKa: messages.errors.callRateFailed.ka,
        errorEn: messages.errors.callRateFailed.en,
        locale
      });
    }
  });
  app2.get("/api/stats/online-count", async (req, res) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const translators2 = await storage.getOnlineTranslators();
      res.json({
        data: {
          count: translators2.length,
          labelKa: `${translators2.length} \u10D7\u10D0\u10E0\u10EF\u10D8\u10DB\u10D0\u10DC\u10D8 \u10DD\u10DC\u10DA\u10D0\u10D8\u10DC`,
          labelEn: `${translators2.length} translator${translators2.length !== 1 ? "s" : ""} online`
        },
        locale
      });
    } catch (error) {
      res.status(500).json({
        error: getError("onlineCountFailed", locale),
        errorKa: messages.errors.onlineCountFailed.ka,
        errorEn: messages.errors.onlineCountFailed.en,
        locale
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/payments.ts
import Stripe from "stripe";
var stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
if (!stripeSecretKey) {
  console.warn(
    "Stripe secret key not found. Payment features will not work. Please set STRIPE_SECRET_KEY in your environment variables."
  );
}
var stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
var userWallets = /* @__PURE__ */ new Map();
var userPaymentMethods = /* @__PURE__ */ new Map();
var transactions = /* @__PURE__ */ new Map();
function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  return "demo-user-id";
}
function registerPaymentRoutes(app2) {
  app2.post(
    "/api/payments/create-setup-intent",
    async (req, res) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!stripe) {
        return res.status(500).json({ error: "Payment service not configured" });
      }
      try {
        const setupIntent = await stripe.setupIntents.create({
          payment_method_types: ["card"],
          metadata: { userId }
        });
        res.json({ clientSecret: setupIntent.client_secret });
      } catch (error) {
        console.error("Error creating setup intent:", error);
        res.status(500).json({ error: "Failed to create setup intent" });
      }
    }
  );
  app2.post(
    "/api/payments/create-intent",
    async (req, res) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!stripe) {
        return res.status(500).json({ error: "Payment service not configured" });
      }
      const { amount, metadata } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "gel",
          metadata: { userId, ...metadata }
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ error: "Failed to create payment" });
      }
    }
  );
  app2.get("/api/payments/methods", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const methods = userPaymentMethods.get(userId) || [];
    const defaultMethod = methods.find((m) => m.isDefault);
    res.json({
      paymentMethods: methods,
      defaultPaymentMethodId: defaultMethod?.id || null
    });
  });
  app2.post("/api/payments/methods/add", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!stripe) {
      return res.status(500).json({ error: "Payment service not configured" });
    }
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method ID required" });
    }
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (paymentMethod.type !== "card" || !paymentMethod.card) {
        return res.status(400).json({ error: "Invalid payment method type" });
      }
      const methods = userPaymentMethods.get(userId) || [];
      const isFirst = methods.length === 0;
      const newMethod = {
        id: paymentMethod.id,
        type: "card",
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4 || "",
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year
        },
        isDefault: isFirst,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      methods.push(newMethod);
      userPaymentMethods.set(userId, methods);
      res.json({ success: true, paymentMethod: newMethod });
    } catch (error) {
      console.error("Error adding payment method:", error);
      res.status(500).json({ error: "Failed to add payment method" });
    }
  });
  app2.post(
    "/api/payments/methods/remove",
    async (req, res) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { paymentMethodId } = req.body;
      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method ID required" });
      }
      const methods = userPaymentMethods.get(userId) || [];
      const filteredMethods = methods.filter((m) => m.id !== paymentMethodId);
      if (filteredMethods.length > 0 && !filteredMethods.some((m) => m.isDefault)) {
        filteredMethods[0].isDefault = true;
      }
      userPaymentMethods.set(userId, filteredMethods);
      res.json({ success: true });
    }
  );
  app2.post(
    "/api/payments/methods/default",
    async (req, res) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { paymentMethodId } = req.body;
      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method ID required" });
      }
      const methods = userPaymentMethods.get(userId) || [];
      const updatedMethods = methods.map((m) => ({
        ...m,
        isDefault: m.id === paymentMethodId
      }));
      userPaymentMethods.set(userId, updatedMethods);
      res.json({ success: true });
    }
  );
  app2.get(
    "/api/payments/wallet/balance",
    async (req, res) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const wallet = userWallets.get(userId) || {
        balance: 0,
        currency: "GEL"
      };
      res.json({
        balance: {
          amount: wallet.balance,
          currency: wallet.currency,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    }
  );
  app2.post(
    "/api/payments/wallet/top-up",
    async (req, res) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!stripe) {
        return res.status(500).json({ error: "Payment service not configured" });
      }
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "gel",
          metadata: {
            userId,
            type: "wallet_top_up"
          }
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating top-up intent:", error);
        res.status(500).json({ error: "Failed to create top-up" });
      }
    }
  );
  app2.get("/api/payments/transactions", async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userTransactions = transactions.get(userId) || [];
    res.json({ transactions: userTransactions });
  });
  app2.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Payment service not configured" });
    }
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !endpointSecret) {
      return res.status(400).json({ error: "Missing signature or secret" });
    }
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object;
          const userId = paymentIntent.metadata.userId;
          if (paymentIntent.metadata.type === "wallet_top_up" && userId) {
            const wallet = userWallets.get(userId) || {
              balance: 0,
              currency: "GEL"
            };
            wallet.balance += paymentIntent.amount / 100;
            userWallets.set(userId, wallet);
            const userTxns = transactions.get(userId) || [];
            userTxns.unshift({
              id: paymentIntent.id,
              type: "top_up",
              amount: paymentIntent.amount / 100,
              currency: "GEL",
              description: "Wallet top-up",
              status: "completed",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            });
            transactions.set(userId, userTxns);
          }
          break;
        }
        case "payment_intent.payment_failed": {
          console.log("Payment failed:", event.data.object.id);
          break;
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook error" });
    }
  });
}

// server/signaling.ts
import { Server as SocketIOServer } from "socket.io";
var activeRooms = /* @__PURE__ */ new Map();
var translatorPresence = /* @__PURE__ */ new Map();
var userSockets = /* @__PURE__ */ new Map();
function initializeSignaling(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on(
      "register",
      async (data) => {
        if (data.type === "user") {
          userSockets.set(data.id, socket.id);
          socket.join(`user:${data.id}`);
          console.log(`User registered: ${data.id}`);
        } else if (data.type === "translator") {
          const translator = await storage.getTranslator(data.id);
          if (translator) {
            translatorPresence.set(socket.id, {
              socketId: socket.id,
              translatorId: data.id,
              isAvailable: true,
              languages: translator.languages,
              categories: translator.categories
            });
            socket.join(`translator:${data.id}`);
            socket.join("translators:online");
            await storage.updateTranslatorOnline(data.id, true);
            const onlineTranslators = await storage.getOnlineTranslators();
            io.emit("online-count", { count: onlineTranslators.length });
            console.log(`Translator registered: ${data.id}`);
          }
        }
      }
    );
    socket.on("set-availability", async (data) => {
      const presence = translatorPresence.get(socket.id);
      if (presence) {
        presence.isAvailable = data.available;
        translatorPresence.set(socket.id, presence);
        await storage.updateTranslatorOnline(
          presence.translatorId,
          data.available
        );
        const onlineTranslators = await storage.getOnlineTranslators();
        io.emit("online-count", { count: onlineTranslators.length });
      }
    });
    socket.on("request-translator", async (data) => {
      console.log(`Match request from user ${data.userId}:`, data);
      const availableTranslators = [];
      translatorPresence.forEach((presence) => {
        if (!presence.isAvailable) return;
        const languageMatch = presence.languages.some(
          (lang) => lang.from === data.fromLang && lang.to === data.toLang
        );
        const categoryMatch = presence.categories.includes(data.category);
        if (languageMatch && categoryMatch) {
          availableTranslators.push(presence);
        }
      });
      if (availableTranslators.length === 0) {
        socket.emit("no-translator-available", {
          message: "No translators available for your request"
        });
        return;
      }
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const room = {
        id: roomId,
        userId: data.userId,
        translatorId: "",
        userSocketId: socket.id,
        translatorSocketId: null,
        status: "waiting",
        createdAt: /* @__PURE__ */ new Date(),
        category: data.category,
        fromLang: data.fromLang,
        toLang: data.toLang,
        pricePerMinute: 2
        // Default, should be fetched from category
      };
      activeRooms.set(roomId, room);
      socket.join(roomId);
      socket.emit("searching", {
        roomId,
        availableCount: availableTranslators.length
      });
      availableTranslators.forEach((translator) => {
        io.to(translator.socketId).emit("incoming-request", {
          roomId,
          userId: data.userId,
          fromLang: data.fromLang,
          toLang: data.toLang,
          category: data.category
        });
      });
      setTimeout(() => {
        const currentRoom = activeRooms.get(roomId);
        if (currentRoom && currentRoom.status === "waiting") {
          socket.emit("request-timeout", { roomId });
          activeRooms.delete(roomId);
        }
      }, 6e4);
    });
    socket.on("accept-request", async (data) => {
      const room = activeRooms.get(data.roomId);
      const presence = translatorPresence.get(socket.id);
      if (!room || !presence) {
        socket.emit("error", { message: "Room or translator not found" });
        return;
      }
      if (room.status !== "waiting") {
        socket.emit("error", { message: "Request already accepted" });
        return;
      }
      room.translatorId = presence.translatorId;
      room.translatorSocketId = socket.id;
      room.status = "connecting";
      activeRooms.set(data.roomId, room);
      presence.isAvailable = false;
      translatorPresence.set(socket.id, presence);
      socket.join(data.roomId);
      const translator = await storage.getTranslator(presence.translatorId);
      if (room.userSocketId) {
        io.to(room.userSocketId).emit("translator-found", {
          roomId: data.roomId,
          translator: {
            id: translator?.id,
            name: translator?.name,
            rating: translator?.rating
          }
        });
      }
      io.to(data.roomId).emit("start-call", {
        roomId: data.roomId,
        initiator: room.userSocketId
      });
      console.log(
        `Translator ${presence.translatorId} accepted request for room ${data.roomId}`
      );
    });
    socket.on("reject-request", (data) => {
      const presence = translatorPresence.get(socket.id);
      if (presence) {
        console.log(
          `Translator ${presence.translatorId} rejected request for room ${data.roomId}`
        );
      }
    });
    socket.on(
      "offer",
      (data) => {
        socket.to(data.roomId).emit("offer", {
          offer: data.offer,
          from: socket.id
        });
      }
    );
    socket.on(
      "answer",
      (data) => {
        socket.to(data.roomId).emit("answer", {
          answer: data.answer,
          from: socket.id
        });
      }
    );
    socket.on(
      "ice-candidate",
      (data) => {
        socket.to(data.roomId).emit("ice-candidate", {
          candidate: data.candidate,
          from: socket.id
        });
      }
    );
    socket.on("call-connected", async (data) => {
      const room = activeRooms.get(data.roomId);
      if (room) {
        room.status = "active";
        activeRooms.set(data.roomId, room);
        const categoryData = await storage.getCategory(room.category);
        await storage.createCall({
          userId: room.userId,
          translatorId: room.translatorId,
          fromLang: room.fromLang,
          toLang: room.toLang,
          category: room.category,
          status: "active",
          pricePerMinute: categoryData?.pricePerMinute || 2
        });
        io.to(data.roomId).emit("call-started", { roomId: data.roomId });
        console.log(`Call started in room ${data.roomId}`);
      }
    });
    socket.on(
      "end-call",
      async (data) => {
        const room = activeRooms.get(data.roomId);
        if (room) {
          room.status = "ended";
          const minutes = Math.ceil(data.duration / 60);
          const totalPrice = minutes * room.pricePerMinute;
          await storage.updateCall(data.roomId, {
            status: "completed",
            duration: data.duration,
            totalPrice,
            endedAt: /* @__PURE__ */ new Date()
          });
          io.to(data.roomId).emit("call-ended", {
            roomId: data.roomId,
            duration: data.duration,
            totalPrice
          });
          if (room.translatorSocketId) {
            const presence = translatorPresence.get(room.translatorSocketId);
            if (presence) {
              presence.isAvailable = true;
              translatorPresence.set(room.translatorSocketId, presence);
            }
          }
          activeRooms.delete(data.roomId);
          console.log(
            `Call ended in room ${data.roomId}, duration: ${data.duration}s, price: ${totalPrice}\u20BE`
          );
        }
      }
    );
    socket.on("cancel-request", (data) => {
      const room = activeRooms.get(data.roomId);
      if (room && room.status === "waiting") {
        io.to(data.roomId).emit("request-cancelled", { roomId: data.roomId });
        activeRooms.delete(data.roomId);
        console.log(`Request cancelled for room ${data.roomId}`);
      }
    });
    socket.on("disconnect", async () => {
      console.log(`Client disconnected: ${socket.id}`);
      const presence = translatorPresence.get(socket.id);
      if (presence) {
        await storage.updateTranslatorOnline(presence.translatorId, false);
        translatorPresence.delete(socket.id);
        const onlineTranslators = await storage.getOnlineTranslators();
        io.emit("online-count", { count: onlineTranslators.length });
        activeRooms.forEach((room, roomId) => {
          if (room.translatorSocketId === socket.id && room.status === "active") {
            io.to(roomId).emit("peer-disconnected", {
              reason: "Translator disconnected"
            });
          }
        });
      }
      userSockets.forEach((socketId, odId) => {
        if (socketId === socket.id) {
          userSockets.delete(odId);
          activeRooms.forEach((room, roomId) => {
            if (room.userSocketId === socket.id && room.status === "active") {
              io.to(roomId).emit("peer-disconnected", {
                reason: "User disconnected"
              });
            }
          });
        }
      });
    });
  });
  console.log("Signaling server initialized");
  return io;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  registerPaymentRoutes(app);
  const server = await registerRoutes(app);
  const io = initializeSignaling(server);
  log("WebSocket signaling server initialized");
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`Express server serving on port ${port}`);
      log(`WebSocket server ready for connections`);
    }
  );
})();

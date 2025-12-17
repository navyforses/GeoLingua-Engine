import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  real,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  preferredLanguage: text("preferred_language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const translators = pgTable("translators", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  rating: real("rating").default(5.0),
  totalCalls: integer("total_calls").default(0),
  totalMinutes: integer("total_minutes").default(0),
  isOnline: boolean("is_online").default(false),
  isVerified: boolean("is_verified").default(false),
  languages: jsonb("languages")
    .$type<{ from: string; to: string }[]>()
    .default([]),
  categories: jsonb("categories").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calls = pgTable("calls", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  icon: text("icon").notNull(),
  pricePerMinute: real("price_per_minute").notNull(),
});

export const languages = pgTable("languages", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTranslatorSchema = createInsertSchema(translators).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalCalls: true,
  totalMinutes: true,
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  createdAt: true,
  duration: true,
  totalPrice: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTranslator = z.infer<typeof insertTranslatorSchema>;
export type Translator = typeof translators.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Language = typeof languages.$inferSelect;

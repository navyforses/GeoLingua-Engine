import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import {
  users,
  translators,
  calls,
  categories,
  languages,
  type User,
  type Translator,
  type Call,
  type Category,
  type Language,
  type InsertUser,
  type InsertTranslator,
  type InsertCall,
} from "@shared/schema";

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getTranslators(): Promise<Translator[]>;
  getTranslator(id: string): Promise<Translator | undefined>;
  getOnlineTranslators(): Promise<Translator[]>;
  createTranslator(translator: InsertTranslator): Promise<Translator>;
  updateTranslatorOnline(id: string, isOnline: boolean): Promise<void>;
  updateTranslatorStats(id: string, rating: number, calls: number, minutes: number): Promise<void>;

  getCalls(): Promise<Call[]>;
  getCall(id: string): Promise<Call | undefined>;
  getUserCalls(userId: string): Promise<Call[]>;
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: string, updates: Partial<Call>): Promise<Call | undefined>;
  rateCall(id: string, rating: number, comment?: string): Promise<Call | undefined>;

  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;

  getLanguages(): Promise<Language[]>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getTranslators(): Promise<Translator[]> {
    return db.select().from(translators).orderBy(desc(translators.rating));
  }

  async getTranslator(id: string): Promise<Translator | undefined> {
    const [translator] = await db.select().from(translators).where(eq(translators.id, id));
    return translator;
  }

  async getOnlineTranslators(): Promise<Translator[]> {
    return db.select().from(translators).where(eq(translators.isOnline, true)).orderBy(desc(translators.rating));
  }

  async createTranslator(translator: InsertTranslator): Promise<Translator> {
    const [newTranslator] = await db.insert(translators).values(translator).returning();
    return newTranslator;
  }

  async updateTranslatorOnline(id: string, isOnline: boolean): Promise<void> {
    await db.update(translators).set({ isOnline }).where(eq(translators.id, id));
  }

  async updateTranslatorStats(id: string, rating: number, totalCalls: number, totalMinutes: number): Promise<void> {
    await db.update(translators).set({ rating, totalCalls, totalMinutes }).where(eq(translators.id, id));
  }

  async getCalls(): Promise<Call[]> {
    return db.select().from(calls).orderBy(desc(calls.createdAt));
  }

  async getCall(id: string): Promise<Call | undefined> {
    const [call] = await db.select().from(calls).where(eq(calls.id, id));
    return call;
  }

  async getUserCalls(userId: string): Promise<Call[]> {
    return db.select().from(calls).where(eq(calls.userId, userId)).orderBy(desc(calls.createdAt));
  }

  async createCall(call: InsertCall): Promise<Call> {
    const [newCall] = await db.insert(calls).values(call).returning();
    return newCall;
  }

  async updateCall(id: string, updates: Partial<Call>): Promise<Call | undefined> {
    const [updatedCall] = await db.update(calls).set(updates).where(eq(calls.id, id)).returning();
    return updatedCall;
  }

  async rateCall(id: string, rating: number, comment?: string): Promise<Call | undefined> {
    const [updatedCall] = await db
      .update(calls)
      .set({ rating, comment, status: "completed" })
      .where(eq(calls.id, id))
      .returning();
    return updatedCall;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getLanguages(): Promise<Language[]> {
    return db.select().from(languages);
  }
}

export const storage = new DatabaseStorage();

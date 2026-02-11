import { db } from "./db";
import { generatedApps, type InsertGeneratedApp, type GeneratedApp } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createGeneratedApp(app: InsertGeneratedApp): Promise<GeneratedApp>;
  updateGeneratedApp(id: number, app: Partial<InsertGeneratedApp>): Promise<void>;
  getGeneratedApp(id: number): Promise<GeneratedApp | undefined>;
  getAllGeneratedApps(): Promise<GeneratedApp[]>;
  deleteGeneratedApp(id: number): Promise<void>;
}

class DatabaseStorage implements IStorage {
  async createGeneratedApp(app: InsertGeneratedApp): Promise<GeneratedApp> {
    const [result] = await db.insert(generatedApps).values(app).returning();
    return result;
  }

  async updateGeneratedApp(id: number, app: Partial<InsertGeneratedApp>): Promise<void> {
    await db.update(generatedApps).set(app).where(eq(generatedApps.id, id));
  }

  async getGeneratedApp(id: number): Promise<GeneratedApp | undefined> {
    const [result] = await db.select().from(generatedApps).where(eq(generatedApps.id, id));
    return result;
  }

  async getAllGeneratedApps(): Promise<GeneratedApp[]> {
    return db.select().from(generatedApps).orderBy(desc(generatedApps.createdAt));
  }

  async deleteGeneratedApp(id: number): Promise<void> {
    await db.delete(generatedApps).where(eq(generatedApps.id, id));
  }
}

export const storage = new DatabaseStorage();

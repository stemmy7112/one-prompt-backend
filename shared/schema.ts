import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Generated app record
export const generatedApps = pgTable("generated_apps", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  appName: text("app_name").notNull(),
  description: text("description"),
  files: jsonb("files").$type<GeneratedFile[]>().notNull(),
  envVars: jsonb("env_vars").$type<EnvVar[]>().notNull(),
  deploymentInstructions: text("deployment_instructions").notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertGeneratedAppSchema = createInsertSchema(generatedApps).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneratedApp = z.infer<typeof insertGeneratedAppSchema>;
export type GeneratedApp = typeof generatedApps.$inferSelect;

// Types for generated app structure
export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  example?: string;
}

// App generation request/response types
export interface GenerateAppRequest {
  prompt: string;
}

export interface GenerateAppResponse {
  id: number;
  appName: string;
  description: string;
  files: GeneratedFile[];
  envVars: EnvVar[];
  deploymentInstructions: string;
}

export interface GenerationStreamEvent {
  type: "status" | "file" | "envVar" | "complete" | "error";
  data: any;
}

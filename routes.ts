import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateApp } from "./generator";
import type { InsertGeneratedApp } from "@shared/schema";
import { z } from "zod";

const generateAppSchema = z.object({
  prompt: z.string().min(10, "Please provide a detailed app description (at least 10 characters)").max(5000, "Prompt too long (max 5000 characters)")
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Generate a new app from prompt
  app.post("/api/generate", async (req, res) => {
    try {
      const validation = generateAppSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Invalid request" });
      }
      
      const { prompt } = validation.data;

      if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY || !process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
        return res.status(500).json({ error: "AI integration not configured. Please check your environment setup." });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let appId: number | null = null;
      let appData: Partial<InsertGeneratedApp> = {
        prompt,
        status: "generating",
        appName: "Generating...",
        files: [],
        envVars: [],
        deploymentInstructions: ""
      };

      for await (const event of generateApp(prompt)) {
        switch (event.type) {
          case "status":
            res.write(`data: ${JSON.stringify({ 
              type: "status", 
              step: event.data.step,
              completed: event.data.completed 
            })}\n\n`);
            break;
          case "appInfo":
            appData.appName = event.data.appName || "AI Generated App";
            appData.description = event.data.description || "An AI-powered application";
            if (!appId) {
              const draftApp = await storage.createGeneratedApp(appData as InsertGeneratedApp);
              appId = draftApp.id;
            }
            res.write(`data: ${JSON.stringify({ 
              type: "appInfo", 
              appName: appData.appName,
              description: appData.description,
              appId 
            })}\n\n`);
            break;
          case "files":
            appData.files = event.data;
            res.write(`data: ${JSON.stringify({ type: "files", files: event.data })}\n\n`);
            break;
          case "envVars":
            appData.envVars = event.data;
            res.write(`data: ${JSON.stringify({ type: "envVars", envVars: event.data })}\n\n`);
            break;
          case "deploymentInstructions":
            appData.deploymentInstructions = event.data;
            res.write(`data: ${JSON.stringify({ 
              type: "deploymentInstructions", 
              instructions: event.data 
            })}\n\n`);
            break;
          case "complete":
            appData.status = "completed";
            let savedApp;
            if (appId) {
              await storage.updateGeneratedApp(appId, appData);
              savedApp = await storage.getGeneratedApp(appId);
            } else {
              savedApp = await storage.createGeneratedApp(appData as InsertGeneratedApp);
            }
            res.write(`data: ${JSON.stringify({ type: "complete", app: savedApp })}\n\n`);
            break;
        }
      }

      res.end();
    } catch (error) {
      console.error("Generation error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate app" });
      } else {
        res.write(`data: ${JSON.stringify({ 
          type: "error", 
          message: error instanceof Error ? error.message : "Generation failed" 
        })}\n\n`);
        res.end();
      }
    }
  });

  // Get all generated apps
  app.get("/api/apps", async (req, res) => {
    try {
      const apps = await storage.getAllGeneratedApps();
      res.json(apps);
    } catch (error) {
      console.error("Error fetching apps:", error);
      res.status(500).json({ error: "Failed to fetch apps" });
    }
  });

  // Get a specific generated app
  app.get("/api/apps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const app = await storage.getGeneratedApp(id);
      if (!app) {
        return res.status(404).json({ error: "App not found" });
      }
      res.json(app);
    } catch (error) {
      console.error("Error fetching app:", error);
      res.status(500).json({ error: "Failed to fetch app" });
    }
  });

  // Delete a generated app
  app.delete("/api/apps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGeneratedApp(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting app:", error);
      res.status(500).json({ error: "Failed to delete app" });
    }
  });

  return httpServer;
}

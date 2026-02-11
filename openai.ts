import OpenAI from "openai";
import type { GeneratedFile, EnvVar } from "@shared/schema";

let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiInstance) return openaiInstance;
  
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  
  if (!apiKey || !baseURL) {
    throw new Error("AI integration not configured. Please check your environment setup.");
  }
  
  openaiInstance = new OpenAI({ apiKey, baseURL });
  return openaiInstance;
}

function getOpenAI(): OpenAI {
  return getOpenAIClient();
}

interface GeneratedAppStructure {
  appName: string;
  description: string;
  coreFeature: string;
  aiPromptExample: string;
  dataModels: DataModel[];
}

interface DataModel {
  name: string;
  fields: { name: string; type: string; description: string }[];
}

export async function analyzePrompt(prompt: string): Promise<GeneratedAppStructure> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      {
        role: "system",
        content: `You are an expert app architect. Analyze the user's app idea and output a JSON structure.
Return ONLY valid JSON with this exact structure:
{
  "appName": "string - concise, catchy name for the app",
  "description": "string - one sentence description",
  "coreFeature": "string - the main AI-powered feature users interact with",
  "aiPromptExample": "string - example prompt a user might enter in this app",
  "dataModels": [
    {
      "name": "string - model name in PascalCase",
      "fields": [
        { "name": "string", "type": "string|number|boolean|date", "description": "string" }
      ]
    }
  ]
}`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_completion_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const defaultResult: GeneratedAppStructure = {
    appName: "AI App",
    description: "An AI-powered application",
    coreFeature: "AI text generation",
    aiPromptExample: "Generate something creative",
    dataModels: []
  };
  
  try {
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      appName: parsed.appName || defaultResult.appName,
      description: parsed.description || defaultResult.description,
      coreFeature: parsed.coreFeature || defaultResult.coreFeature,
      aiPromptExample: parsed.aiPromptExample || defaultResult.aiPromptExample,
      dataModels: Array.isArray(parsed.dataModels) ? parsed.dataModels : defaultResult.dataModels
    };
  } catch {
    return defaultResult;
  }
}

export async function generateFrontendCode(
  appStructure: GeneratedAppStructure,
  prompt: string
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  const frontendResponse = await getOpenAI().chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      {
        role: "system",
        content: `You are an expert React developer. Generate the main React component for this app.
App: ${appStructure.appName}
Description: ${appStructure.description}
Core Feature: ${appStructure.coreFeature}

Generate a SINGLE React component that:
1. Has a clean, modern UI with Tailwind CSS
2. Includes an input/textarea for the AI prompt
3. Has a submit button
4. Shows loading state while processing
5. Displays the AI response beautifully
6. Handles errors gracefully
7. Includes payment check - if user hasn't paid, shows upgrade prompt

Output ONLY the React component code, no markdown, no explanation.
Use modern React with hooks. Import from "react".
Use fetch to call "/api/generate" endpoint.
Check "/api/access" to verify payment status.`
      },
      {
        role: "user",
        content: `Create the main page component for: ${prompt}`
      }
    ],
    max_completion_tokens: 2048,
  });

  files.push({
    path: "client/src/pages/Home.tsx",
    content: frontendResponse.choices[0]?.message?.content || getDefaultHomePage(appStructure),
    language: "tsx"
  });

  files.push({
    path: "client/src/App.tsx",
    content: getAppTsx(),
    language: "tsx"
  });

  files.push({
    path: "client/src/main.tsx",
    content: getMainTsx(),
    language: "tsx"
  });

  files.push({
    path: "client/index.html",
    content: getIndexHtml(appStructure.appName),
    language: "html"
  });

  files.push({
    path: "client/src/index.css",
    content: getTailwindCss(),
    language: "css"
  });

  return files;
}

export async function generateBackendCode(
  appStructure: GeneratedAppStructure,
  prompt: string
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  const backendResponse = await getOpenAI().chat.completions.create({
    model: "gpt-5-nano",
    messages: [
      {
        role: "system",
        content: `You are an expert Node.js/Express developer. Generate the AI generation endpoint.
App: ${appStructure.appName}
Core Feature: ${appStructure.coreFeature}
AI Prompt Example: ${appStructure.aiPromptExample}

Generate an Express route handler for POST /api/generate that:
1. Takes user input from request body
2. Calls OpenAI API using chat.completions.create with gpt-4o-mini model
3. Returns clean plain-text output from response.choices[0].message.content
4. Implements token limits (max_tokens: 2048)
5. Handles errors gracefully
6. Checks payment status before processing

Output ONLY the route handler code, no markdown.
Use modern ES modules. Import OpenAI from "openai".`
      },
      {
        role: "user",
        content: `Create the AI generation endpoint for: ${prompt}`
      }
    ],
    max_completion_tokens: 1500,
  });

  files.push({
    path: "server/routes/generate.ts",
    content: backendResponse.choices[0]?.message?.content || getDefaultGenerateRoute(appStructure),
    language: "typescript"
  });

  files.push({
    path: "server/index.ts",
    content: getServerIndex(),
    language: "typescript"
  });

  files.push({
    path: "server/routes/payments.ts",
    content: getPaymentsRoute(),
    language: "typescript"
  });

  files.push({
    path: "server/routes/access.ts",
    content: getAccessRoute(),
    language: "typescript"
  });

  files.push({
    path: "server/routes/settings.ts",
    content: getSettingsRoute(),
    language: "typescript"
  });

  files.push({
    path: "server/middleware/auth.ts",
    content: getAuthMiddleware(),
    language: "typescript"
  });

  files.push({
    path: "server/lib/stripe.ts",
    content: getStripeLib(),
    language: "typescript"
  });

  files.push({
    path: "server/lib/openai.ts",
    content: getOpenAILib(),
    language: "typescript"
  });

  return files;
}

export async function generateSchemaCode(
  appStructure: GeneratedAppStructure
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  let schemaFields = "";
  for (const model of appStructure.dataModels) {
    const fields = model.fields.map((f) => {
      const drizzleType = f.type === "number" ? "integer" : f.type === "boolean" ? "boolean" : "text";
      return `  ${f.name}: ${drizzleType}("${f.name}"),`;
    }).join("\n");
    
    schemaFields += `
export const ${model.name.toLowerCase()}s = pgTable("${model.name.toLowerCase()}s", {
  id: serial("id").primaryKey(),
${fields}
  createdAt: timestamp("created_at").default(sql\`CURRENT_TIMESTAMP\`).notNull(),
});
`;
  }

  files.push({
    path: "shared/schema.ts",
    content: getSchemaTs(schemaFields),
    language: "typescript"
  });

  files.push({
    path: "server/db.ts",
    content: getDbTs(),
    language: "typescript"
  });

  return files;
}

function getDefaultHomePage(app: GeneratedAppStructure): string {
  return `import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const checkAccess = async () => {
    try {
      const res = await fetch("/api/access");
      const data = await res.json();
      setHasAccess(data.hasAccess);
    } catch {
      setHasAccess(false);
    }
  };

  useState(() => { checkAccess(); }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      
      if (!res.ok) {
        if (res.status === 402) {
          window.location.href = "/api/checkout";
          return;
        }
        throw new Error("Generation failed");
      }
      
      const data = await res.json();
      setOutput(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">${app.appName}</h1>
          <p className="text-gray-600 mb-6">${app.description}</p>
          <a
            href="/api/checkout"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Get Access
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">${app.appName}</h1>
        <p className="text-gray-600 text-center mb-8">${app.description}</p>
        
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="${app.aiPromptExample}"
            className="w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
          )}
          
          {output && (
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">{output}</div>
          )}
        </div>
      </div>
    </div>
  );
}`;
}

function getAppTsx(): string {
  return `import Home from "./pages/Home";

export default function App() {
  return <Home />;
}`;
}

function getMainTsx(): string {
  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);`;
}

function getIndexHtml(appName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

function getTailwindCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;`;
}

function getDefaultGenerateRoute(app: GeneratedAppStructure): string {
  return `import { Router } from "express";
import { openai } from "../lib/openai";
import { checkPayment } from "../middleware/auth";

const router = Router();

router.post("/", checkPayment, async (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input || typeof input !== "string") {
      return res.status(400).json({ error: "Input is required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: input }],
      max_tokens: 2048,
    });

    const result = response.choices[0]?.message?.content || "";
    
    res.json({ result });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ error: "Generation failed" });
  }
});

export default router;`;
}

function getServerIndex(): string {
  return `import express from "express";
import session from "express-session";
import { config } from "dotenv";
import generateRouter from "./routes/generate";
import paymentsRouter from "./routes/payments";
import accessRouter from "./routes/access";
import settingsRouter from "./routes/settings";

config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" }
}));

app.use("/api/generate", generateRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/access", accessRouter);
app.use("/api/settings", settingsRouter);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;
}

function getPaymentsRoute(): string {
  return `import { Router } from "express";
import { stripe } from "../lib/stripe";
import { db } from "../db";

const router = Router();

router.get("/checkout", async (req, res) => {
  try {
    const settings = await db.getSettings();
    const mode = settings.paymentMode === "subscription" ? "subscription" : "payment";
    
    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      line_items: [{
        price: settings.stripePriceId,
        quantity: 1,
      }],
      success_url: \`\${process.env.APP_URL}/success\`,
      cancel_url: \`\${process.env.APP_URL}/\`,
    });

    res.redirect(session.url!);
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"]!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        await db.grantAccess(session.customer_email!);
        break;
      case "customer.subscription.deleted":
        const subscription = event.data.object;
        await db.revokeAccess(subscription.customer as string);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).send("Webhook error");
  }
});

export default router;`;
}

function getAccessRoute(): string {
  return `import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.json({ hasAccess: false });
    }

    const hasAccess = await db.checkAccess(userId);
    res.json({ hasAccess });
  } catch (error) {
    res.json({ hasAccess: false });
  }
});

export default router;`;
}

function getSettingsRoute(): string {
  return `import { Router } from "express";
import { db } from "../db";

const router = Router();

// Owner-only settings
router.get("/", async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.put("/", async (req, res) => {
  try {
    const { paymentMode, oneTimePrice, subscriptionPrice, stripePriceId } = req.body;
    
    await db.updateSettings({
      paymentMode, // "one_time" or "subscription"
      oneTimePrice,
      subscriptionPrice,
      stripePriceId,
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;`;
}

function getAuthMiddleware(): string {
  return `import { Request, Response, NextFunction } from "express";
import { db } from "../db";

export async function checkPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const hasAccess = await db.checkAccess(userId);
    
    if (!hasAccess) {
      return res.status(402).json({ error: "Payment required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Access check failed" });
  }
}`;
}

function getStripeLib(): string {
  return `import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});`;
}

function getOpenAILib(): string {
  return `import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});`;
}

function getSchemaTs(customFields: string): string {
  return `import { sql } from "drizzle-orm";
import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  hasAccess: boolean("has_access").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionId: text("subscription_id"),
  createdAt: timestamp("created_at").default(sql\`CURRENT_TIMESTAMP\`).notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  paymentMode: text("payment_mode").default("one_time").notNull(), // "one_time" or "subscription"
  oneTimePrice: integer("one_time_price").default(2900), // $29.00 in cents
  subscriptionPrice: integer("subscription_price").default(999), // $9.99/month in cents
  stripePriceId: text("stripe_price_id"),
  updatedAt: timestamp("updated_at").default(sql\`CURRENT_TIMESTAMP\`).notNull(),
});
${customFields}`;
}

function getDbTs(): string {
  return `import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });`;
}

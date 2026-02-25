import { analyzePrompt, generateFrontendCode, generateBackendCode, generateSchemaCode } from "./openai";
import { 
  getBaseEnvVars, 
  getDeploymentInstructions, 
  generatePackageJson, 
  generateTsConfig, 
  generateDrizzleConfig,
  generateEnvExample 
} from "./templates";
import type { GeneratedFile, EnvVar } from "@shared/schema";

export interface GenerationResult {
  appName: string;
  description: string;
  files: GeneratedFile[];
  envVars: EnvVar[];
  deploymentInstructions: string;
}

export interface GenerationProgress {
  step: string;
  completed?: string;
}

export async function* generateApp(
  prompt: string
): AsyncGenerator<{ type: string; data: any }> {
  yield { type: "status", data: { step: "analyzing" } };
  
  const appStructure = await analyzePrompt(prompt);
  
  yield { type: "status", data: { step: "schema", completed: "analyzing" } };
  yield { 
    type: "appInfo", 
    data: { appName: appStructure.appName, description: appStructure.description } 
  };

  const schemaFiles = await generateSchemaCode(appStructure);
  
  yield { type: "status", data: { step: "frontend", completed: "schema" } };

  const frontendFiles = await generateFrontendCode(appStructure, prompt);
  
  yield { type: "status", data: { step: "backend", completed: "frontend" } };

  const backendFiles = await generateBackendCode(appStructure, prompt);
  
  yield { type: "status", data: { step: "payments", completed: "backend" } };

  const envVars = getBaseEnvVars();
  
  const configFiles: GeneratedFile[] = [
    {
      path: "package.json",
      content: generatePackageJson(appStructure.appName),
      language: "json"
    },
    {
      path: "tsconfig.json",
      content: generateTsConfig(),
      language: "json"
    },
    {
      path: "drizzle.config.ts",
      content: generateDrizzleConfig(),
      language: "typescript"
    },
    {
      path: ".env.example",
      content: generateEnvExample(envVars),
      language: "env"
    },
    {
      path: "README.md",
      content: generateReadme(appStructure.appName, appStructure.description),
      language: "markdown"
    },
    {
      path: "tailwind.config.js",
      content: generateTailwindConfig(),
      language: "javascript"
    },
    {
      path: "postcss.config.js", 
      content: generatePostcssConfig(),
      language: "javascript"
    },
    {
      path: "vite.config.ts",
      content: generateViteConfig(),
      language: "typescript"
    }
  ];

  yield { type: "status", data: { step: "finalizing", completed: "payments" } };

  const allFiles = [...configFiles, ...schemaFiles, ...frontendFiles, ...backendFiles];
  const deploymentInstructions = getDeploymentInstructions(appStructure.appName);

  yield { type: "files", data: allFiles };
  yield { type: "envVars", data: envVars };
  yield { type: "deploymentInstructions", data: deploymentInstructions };

  const result: GenerationResult = {
    appName: appStructure.appName,
    description: appStructure.description,
    files: allFiles,
    envVars,
    deploymentInstructions
  };

  yield { type: "complete", data: result };
}

function generateReadme(appName: string, description: string): string {
  return `# ${appName}

${description}

## Features

- AI-powered core functionality using OpenAI
- Built-in monetization with Stripe
- Owner settings for payment configuration
- Production-ready full-stack architecture

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your values
   \`\`\`

3. Push database schema:
   \`\`\`bash
   npm run db:push
   \`\`\`

4. Start development:
   \`\`\`bash
   npm run dev
   \`\`\`

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI API
- **Payments**: Stripe

## Monetization

Configure monetization settings in the admin panel:
- One-time payment (default)
- Monthly subscription

## Deployment

See DEPLOYMENT.md for detailed deployment instructions.
`;
}

function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/index.html", "./client/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};`;
}

function generatePostcssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;
}

function generateViteConfig(): string {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./client",
  build: {
    outDir: "../dist/client",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});`;
}

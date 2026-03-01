import type { GeneratedFile, EnvVar } from "@shared/schema";

export interface AppTemplate {
  files: GeneratedFile[];
  envVars: EnvVar[];
  deploymentInstructions: string;
}

export function getBaseEnvVars(): EnvVar[] {
  return [
    {
      name: "OPENAI_API_KEY",
      description: "Your OpenAI API key for AI-powered features",
      required: true,
      example: "sk-...",
    },
    {
      name: "STRIPE_SECRET_KEY",
      description: "Your Stripe secret key for payment processing",
      required: true,
      example: "sk_live_...",
    },
    {
      name: "STRIPE_PUBLISHABLE_KEY",
      description: "Your Stripe publishable key for client-side payment integration",
      required: true,
      example: "pk_live_...",
    },
    {
      name: "STRIPE_WEBHOOK_SECRET",
      description: "Stripe webhook secret for verifying webhook signatures",
      required: true,
      example: "whsec_...",
    },
    {
      name: "SESSION_SECRET",
      description: "Secret key for signing session cookies",
      required: true,
      example: "your-random-secret-key-min-32-chars",
    },
    {
      name: "DATABASE_URL",
      description: "PostgreSQL database connection URL",
      required: true,
      example: "postgresql://user:password@host:5432/database",
    },
  ];
}

export function getDeploymentInstructions(appName: string): string {
  return `## Deploying ${appName}

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Stripe account
- OpenAI API key

### Quick Start

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Push database schema
npm run db:push

# Start development server
npm run dev
\`\`\`

### Environment Variables

Create a \`.env\` file in the root directory with all required environment variables. See the Environment tab for details.

### Production Deployment

#### Replit
- Click the "Deploy" button in Replit
- Add your environment secrets in the Secrets tab
- Your app will be live automatically

#### Vercel
\`\`\`bash
npm install -g vercel
vercel
\`\`\`
- Add environment variables in Vercel dashboard

#### Railway
\`\`\`bash
railway init
railway up
\`\`\`
- Configure environment variables in Railway dashboard

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Create products and prices in Stripe
4. Set up webhook endpoint: \`https://your-domain.com/api/webhooks/stripe\`
5. Configure webhook to listen for:
   - \`checkout.session.completed\`
   - \`customer.subscription.created\`
   - \`customer.subscription.deleted\`

### Monetization Settings

Access the owner settings at \`/admin/settings\` to configure:
- Payment mode (one-time or subscription)
- Pricing
- Feature access rules
`;
}

export function generatePackageJson(appName: string): string {
  const packageName = appName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return JSON.stringify({
    name: packageName,
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: "tsx watch server/index.ts",
      build: "npm run build:client && npm run build:server",
      "build:client": "vite build",
      "build:server": "esbuild server/index.ts --bundle --platform=node --outdir=dist",
      start: "node dist/index.js",
      "db:push": "drizzle-kit push",
      "db:studio": "drizzle-kit studio"
    },
    dependencies: {
      "express": "^4.18.2",
      "express-session": "^1.17.3",
      "drizzle-orm": "^0.29.0",
      "pg": "^8.11.3",
      "openai": "^4.20.0",
      "stripe": "^14.7.0",
      "zod": "^3.22.4",
      "dotenv": "^16.3.1"
    },
    devDependencies: {
      "@types/express": "^4.17.21",
      "@types/express-session": "^1.17.10",
      "@types/node": "^20.10.0",
      "@types/pg": "^8.10.9",
      "drizzle-kit": "^0.20.6",
      "esbuild": "^0.19.8",
      "tsx": "^4.6.2",
      "typescript": "^5.3.2",
      "vite": "^5.0.0",
      "@vitejs/plugin-react": "^4.2.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "tailwindcss": "^3.3.6",
      "postcss": "^8.4.32",
      "autoprefixer": "^10.4.16"
    }
  }, null, 2);
}

export function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      jsx: "react-jsx",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: "./dist",
      rootDir: ".",
      baseUrl: ".",
      paths: {
        "@/*": ["./client/src/*"],
        "@shared/*": ["./shared/*"]
      }
    },
    include: ["client/src/**/*", "server/**/*", "shared/**/*"],
    exclude: ["node_modules", "dist"]
  }, null, 2);
}

export function generateDrizzleConfig(): string {
  return `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;
}

export function generateEnvExample(envVars: EnvVar[]): string {
  return envVars.map((v) => `${v.name}=${v.example || ""}`).join("\n");
}

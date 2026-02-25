import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rootDir = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: [
      { find: /^@\/components\/ui\/(.+)$/, replacement: `${rootDir}/$1` },
      { find: /^@\/components\/(.+)$/, replacement: `${rootDir}/$1` },
      { find: /^@\/(?:lib|hooks|pages)\/(.+)$/, replacement: `${rootDir}/$1` },
      { find: /^@shared\/(.+)$/, replacement: `${rootDir}/$1` },
      // Keep this catch-all last so more specific aliases take precedence.
      { find: /^@\/(.*)$/, replacement: `${rootDir}/$1` },
    ],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});

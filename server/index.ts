import express from "express";
import { config } from "dotenv";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { setupVite } from "./vite";

config();

const app = express();
const httpServer = createServer(app);

app.use(express.json());

async function start() {
  const port = Number(process.env.PORT) || 5000;

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(httpServer, app);
  }

  await registerRoutes(httpServer, app);

  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

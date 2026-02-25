import express from "express";
import { createServer } from "http";
import { config } from "dotenv";
import { registerRoutes } from "../routes";
import { serveStatic } from "../static";

config();

async function start() {
  const app = express();
  const httpServer = createServer(app);

  app.use(express.json());

  await registerRoutes(httpServer, app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("../dev-server");
    await setupVite(httpServer, app);
  }

  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

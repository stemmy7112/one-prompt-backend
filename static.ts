import express, { type Express } from "express";
import fs from "fs";
import path from "path";

function resolveDistPath() {
  return typeof __dirname !== "undefined"
    ? path.resolve(__dirname, "dist/public")
    : path.resolve(process.cwd(), "dist/public");
}

export function serveStatic(app: Express) {
  const distPath = resolveDistPath();
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

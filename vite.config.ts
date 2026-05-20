import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function vitePluginDevLogs(): Plugin {
  return {
    name: "dev-logs",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/__logs__/collect", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (chunk) => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            ensureLogDir();
            const payload = JSON.parse(body);
            if (payload.consoleLogs?.length > 0) {
              const lines = payload.consoleLogs.map((e: unknown) => `[${new Date().toISOString()}] ${JSON.stringify(e)}`);
              fs.appendFileSync(path.join(LOG_DIR, "browser.log"), lines.join("\n") + "\n");
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: String(e) }));
          }
        });
      });
    },
  };
}

const plugins = [react(), tailwindcss(), vitePluginDevLogs()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: false,
    },
  },
});

import react from "@vitejs/plugin-react";
import { sites } from "@openai/sites-vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), sites()],
  // HMR is disabled because the desktop in-app browser does not expose a
  // stable WebSocket transport. Manual refresh keeps local preview reliable.
  server: { host: "0.0.0.0", port: 3000, hmr: false, forwardConsole: false },
  preview: { host: "0.0.0.0", port: 4173 },
  build: { outDir: "dist/client", emptyOutDir: true },
});

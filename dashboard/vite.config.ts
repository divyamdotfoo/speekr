import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const rootDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: rootDirectory,
  plugins: [tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  build: {
    outDir: resolve(rootDirectory, "dist"),
    emptyOutDir: true,
  },
});

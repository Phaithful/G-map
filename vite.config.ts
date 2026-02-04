import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import mkcert from "vite-plugin-mkcert";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mkcert(),
    mode === "development" ? componentTagger() : null,
  ].filter(Boolean),

  server: {
    host: true,
    https: {}, // mkcert makes this work
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

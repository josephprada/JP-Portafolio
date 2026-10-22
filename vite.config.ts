import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  /*
   * Two HTML entries instead of a client router. `/canal/` ships as its own
   * directory index, so nginx serves it with the default `index` directive and
   * the landing bundle never carries the channel map.
   */
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        canal: resolve(import.meta.dirname, "canal/index.html"),
      },
    },
  },
  server: {
    port: Number(process.env.PORT) || 5180,
  },
});

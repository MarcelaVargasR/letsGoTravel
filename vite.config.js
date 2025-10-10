import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"), 
        destinations: resolve(__dirname, "src/destinations/index.html"), 
        events: resolve(__dirname, "src/ourEvents/index.html")
      },
    },
  },
});

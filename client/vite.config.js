import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 5175 to avoid clashing with the ATS Docker stack, which uses 5173
    port: 5175,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});

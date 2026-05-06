import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/lop-route-app/",
  plugins: [react()],
});

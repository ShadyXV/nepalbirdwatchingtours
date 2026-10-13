import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Must match `basename` in react-router.config.ts.
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), reactRouter()],
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const app = (name: string) => fileURLToPath(new URL(`./apps/${name}`, import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
  },
  resolve: {
    // Next resolves "@/..." per app via tsconfig paths; vitest runs from the repo root
    // and needs the same mapping. PM first — catalogue names don't collide today.
    alias: [
      { find: /^@\/(.*)$/, replacement: `${app("project-management")}/$1` },
    ],
  },
});

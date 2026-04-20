import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Prisma loads prisma.config.ts before reading .env, so we load it manually.
config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});

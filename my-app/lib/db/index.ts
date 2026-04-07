import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Vérification explicite avec message clair
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined. ' +
    'Please check that:\n' +
    '1. You have a .env.local file in the project root\n' +
    '2. DATABASE_URL is defined in that file\n' +
    '3. You have restarted the Next.js server after creating the file'
  );
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const dbUrl = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();

if (!dbUrl) {
  console.error("DATABASE_URL introuvable dans .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

// Tables existantes
const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`;
console.log("Tables :", tables.map(t => t.table_name).join(", "));

// Enums existants
const enums = await sql`
  SELECT typname FROM pg_type
  WHERE typtype = 'e' ORDER BY typname
`;
console.log("Enums  :", enums.map(e => e.typname).join(", "));

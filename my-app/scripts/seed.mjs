import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";

// Charge .env.local manuellement
const env = readFileSync(".env.local", "utf-8");
const dbUrl = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();

if (!dbUrl) {
  console.error("DATABASE_URL introuvable dans .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);
const hash = await bcrypt.hash("admin123", 12);

await sql`
  INSERT INTO users (name, email, password, role)
  VALUES ('Admin', 'admin@demo.fr', ${hash}, 'admin')
  ON CONFLICT (email) DO NOTHING
`;

console.log("✓ Utilisateur admin créé : admin@demo.fr / admin123");

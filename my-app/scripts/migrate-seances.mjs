import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const dbUrl = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();

if (!dbUrl) {
  console.error("DATABASE_URL introuvable dans .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

try {
  await sql`CREATE TYPE "public"."fatigue" AS ENUM('pas_du_tout', 'un_peu', 'moyennement')`;
  console.log("✓ Type fatigue créé");
} catch (e) {
  if (e.message.includes("already exists")) {
    console.log("~ Type fatigue déjà existant, on continue");
  } else {
    console.error("Erreur type fatigue:", e.message);
    process.exit(1);
  }
}

try {
  await sql`
    CREATE TABLE "seances" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "patient_id" uuid NOT NULL,
      "fatigue" "fatigue" NOT NULL,
      "a_douleur" boolean NOT NULL,
      "eva_douleur" integer,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✓ Table seances créée");
} catch (e) {
  if (e.message.includes("already exists")) {
    console.log("~ Table seances déjà existante, on continue");
  } else {
    console.error("Erreur table seances:", e.message);
    process.exit(1);
  }
}

try {
  await sql`
    ALTER TABLE "seances" ADD CONSTRAINT "seances_patient_id_patients_id_fk"
    FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action
  `;
  console.log("✓ Contrainte FK ajoutée");
} catch (e) {
  if (e.message.includes("already exists")) {
    console.log("~ Contrainte FK déjà existante");
  } else {
    console.error("Erreur FK:", e.message);
    process.exit(1);
  }
}

console.log("\n✓ Migration seances terminée avec succès");

CREATE TYPE "public"."fatigue" AS ENUM('pas_du_tout', 'un_peu', 'moyennement');--> statement-breakpoint
CREATE TABLE "seances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"fatigue" "fatigue" NOT NULL,
	"a_douleur" boolean NOT NULL,
	"eva_douleur" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seances" ADD CONSTRAINT "seances_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
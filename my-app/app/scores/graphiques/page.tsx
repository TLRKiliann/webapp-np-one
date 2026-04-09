import { db } from "@/lib/db";
import { scores, patients } from "@/lib/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import ScoresCharts, { type PatientData } from "@/app/ui/scores/ScoresCharts";

export default async function ScoresGraphiquesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    const rows = await db
        .select({
            id: scores.id,
            patientId: scores.patientId,
            exercice: scores.exercice,
            domaine: scores.domaine,
            score: scores.score,
            niveauDifficulte: scores.niveauDifficulte,
            date: scores.date,
            patientNom: patients.nom,
            patientPrenom: patients.prenom,
        })
        .from(scores)
        .innerJoin(patients, eq(scores.patientId, patients.id))
        .where(eq(patients.createdBy, userId))
        .orderBy(scores.date);

    // Group by patient
    const map = new Map<string, PatientData>();
    for (const row of rows) {
        if (!map.has(row.patientId)) {
            map.set(row.patientId, {
                patientId: row.patientId,
                nom: row.patientNom,
                prenom: row.patientPrenom,
                scores: [],
            });
        }
        map.get(row.patientId)!.scores.push({
            id: row.id,
            exercice: row.exercice,
            domaine: row.domaine,
            score: row.score,
            niveauDifficulte: row.niveauDifficulte,
            date: row.date.toISOString(),
        });
    }

    const patientList = [...map.values()].sort((a, b) =>
        `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
    );

    return <ScoresCharts patients={patientList} />;
}

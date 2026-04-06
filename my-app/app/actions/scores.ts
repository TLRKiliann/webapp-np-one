"use server";

import { db } from "@/lib/db";
import { scores } from "@/lib/db/schema";

export async function saveScore(data: {
    patientId: string;
    exercice: string;
    domaine: string;
    score: number;
    empan: number;
}) {
    const niveauDifficulte =
        data.empan <= 3 ? "facile" :
        data.empan <= 5 ? "moyen" : "difficile";

    await db.insert(scores).values({
        patientId: data.patientId,
        exercice: data.exercice,
        domaine: data.domaine,
        score: data.score,
        niveauDifficulte,
    });
}

"use server";

import { db } from "@/lib/db";
import { scores, seances } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

export async function deleteScore(formData: FormData) {
    const id = formData.get("id") as string;
    await db.delete(scores).where(eq(scores.id, id));
    revalidatePath("/scores");
}

export async function deleteSeance(formData: FormData) {
    const id = formData.get("id") as string;
    await db.delete(seances).where(eq(seances.id, id));
    revalidatePath("/scores");
}

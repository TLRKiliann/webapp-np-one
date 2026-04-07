import { db } from "@/lib/db";
import { scores, patients, seances } from "@/lib/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { deleteScore, deleteSeance } from "@/app/actions/scores";

export default async function ScoresPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    const results = await db
        .select({
            id: scores.id,
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

    const seancesResults = await db
        .select({
            id: seances.id,
            fatigue: seances.fatigue,
            aDouleur: seances.aDouleur,
            evaDouleur: seances.evaDouleur,
            createdAt: seances.createdAt,
            patientNom: patients.nom,
            patientPrenom: patients.prenom,
        })
        .from(seances)
        .innerJoin(patients, eq(seances.patientId, patients.id))
        .where(eq(patients.createdBy, userId))
        .orderBy(seances.createdAt);

    const difficulteColor: Record<string, string> = {
        facile:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        moyen:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        difficile: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };

    const fatigueLabel: Record<string, string> = {
        pas_du_tout: "Pas du tout",
        un_peu: "Un peu",
        moyennement: "Moyennement",
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold dark:text-white mb-6">
                Scores
            </h1>

            {results.length === 0 ? (
                <div className="text-center py-16 dark:text-slate-500">
                    Aucun score enregistré pour l'instant.
                </div>
            ) : (
                <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                            <tr>
                                <th className="text-left px-4 py-3">Patient</th>
                                <th className="text-left px-4 py-3">Exercice</th>
                                <th className="text-left px-4 py-3">Domaine</th>
                                <th className="text-left px-4 py-3">Score</th>
                                <th className="text-left px-4 py-3">Difficulté</th>
                                <th className="text-left px-4 py-3">Date</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {results.map((row) => (
                                <tr
                                    key={row.id}
                                    className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                                        {row.patientPrenom} {row.patientNom}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                        {row.exercice}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                        {row.domaine}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">
                                        {row.score}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${difficulteColor[row.niveauDifficulte]}`}>
                                            {row.niveauDifficulte}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                        {new Date(row.date).toLocaleDateString("fr-FR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <form action={deleteScore}>
                                            <input type="hidden" name="id" value={row.id} />
                                            <button type="submit" className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                                Supprimer
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <h2 className="text-xl font-bold dark:text-white mt-10 mb-6">
                État avant séance
            </h2>

            {seancesResults.length === 0 ? (
                <div className="text-center py-16 dark:text-slate-500">
                    Aucune séance enregistrée pour l'instant.
                </div>
            ) : (
                <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                            <tr>
                                <th className="text-left px-4 py-3">Patient</th>
                                <th className="text-left px-4 py-3">Fatigue</th>
                                <th className="text-left px-4 py-3">Douleur</th>
                                <th className="text-left px-4 py-3">EVA</th>
                                <th className="text-left px-4 py-3">Date</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {seancesResults.map((row) => (
                                <tr
                                    key={row.id}
                                    className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                                        {row.patientPrenom} {row.patientNom}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                        {fatigueLabel[row.fatigue]}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.aDouleur ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                                            {row.aDouleur ? "Oui" : "Non"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                        {row.evaDouleur ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                        {new Date(row.createdAt).toLocaleDateString("fr-FR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <form action={deleteSeance}>
                                            <input type="hidden" name="id" value={row.id} />
                                            <button type="submit" className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                                Supprimer
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

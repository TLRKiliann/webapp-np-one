"use client";

import { useState } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "feedback" | "finished";
type Niveau = "facile" | "moyen" | "difficile";
type Reponse = "OUI" | "NON";

interface Question {
    id: number;
    texte: string;
    reponseCorrecte: Reponse;
    niveau: Niveau;
}

interface RoundResult {
    question: Question;
    reponse: Reponse;
    correct: boolean;
}

const QUESTIONS: Question[] = [
    // === FACILE ===
    { id: 1,  texte: "Le soleil est chaud ?",                              reponseCorrecte: "OUI", niveau: "facile" },
    { id: 2,  texte: "Un chien peut voler ?",                              reponseCorrecte: "NON", niveau: "facile" },
    { id: 3,  texte: "L'eau est mouillée ?",                               reponseCorrecte: "OUI", niveau: "facile" },
    { id: 4,  texte: "Les poissons vivent dans l'eau ?",                   reponseCorrecte: "OUI", niveau: "facile" },
    { id: 5,  texte: "Un éléphant est plus petit qu'une souris ?",         reponseCorrecte: "NON", niveau: "facile" },
    // === MOYEN ===
    { id: 6,  texte: "Une pomme est un légume ?",                          reponseCorrecte: "NON", niveau: "moyen" },
    { id: 7,  texte: "Le lundi vient avant le mardi ?",                    reponseCorrecte: "OUI", niveau: "moyen" },
    { id: 8,  texte: "On utilise des ciseaux pour manger ?",               reponseCorrecte: "NON", niveau: "moyen" },
    { id: 9,  texte: "Le printemps vient après l'hiver ?",                 reponseCorrecte: "OUI", niveau: "moyen" },
    { id: 10, texte: "En France, les voitures roulent à gauche ?",         reponseCorrecte: "NON", niveau: "moyen" },
    // === DIFFICILE ===
    { id: 11, texte: "Si on ferme les yeux, on ne peut pas voir ?",        reponseCorrecte: "OUI", niveau: "difficile" },
    { id: 12, texte: "Un objet qui flotte va au fond de l'eau ?",          reponseCorrecte: "NON", niveau: "difficile" },
    { id: 13, texte: "Le cheval court moins vite que la tortue ?",         reponseCorrecte: "NON", niveau: "difficile" },
    { id: 14, texte: "Si l'été est chaud, il neige souvent en été ?",      reponseCorrecte: "NON", niveau: "difficile" },
    { id: 15, texte: "Un médecin soigne les malades, donc les malades n'ont pas besoin de médecin ?", reponseCorrecte: "NON", niveau: "difficile" },
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const niveauBadge: Record<Niveau, string> = {
    facile:   "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    moyen:    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    difficile:"text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

export default function ComprehensionPropo({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<Reponse | null>(null);
    const [results, setResults] = useState<RoundResult[]>([]);

    const startGame = () => {
        const shuffled = shuffle(QUESTIONS);
        setQuestions(shuffled);
        setCurrentIndex(0);
        setResults([]);
        setSelected(null);
        setPhase("playing");
    };

    const handleReponse = (reponse: Reponse) => {
        if (selected) return;
        const question = questions[currentIndex];
        const correct = reponse === question.reponseCorrecte;
        const updated: RoundResult[] = [...results, { question, reponse, correct }];

        setSelected(reponse);
        setResults(updated);
        setPhase("feedback");

        // Sauvegarder ici avec `updated` (liste fraîche) sur la dernière question
        if (currentIndex + 1 >= questions.length && patientId) {
            const correctCount = updated.filter(r => r.correct).length;
            const score = Math.round((correctCount / updated.length) * 100);
            const difficiles = updated.filter(r => r.question.niveau === "difficile" && r.correct).length;
            const empan = difficiles >= 3 ? 6
                : updated.filter(r => r.question.niveau === "moyen" && r.correct).length >= 3 ? 4
                : 2;
            saveScore({
                patientId,
                exercice: "Questions oui/non",
                domaine: "language",
                score,
                empan,
            }).catch(console.error);
        }
    };

    const handleNext = () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
            setPhase("finished");
        } else {
            setCurrentIndex(nextIndex);
            setSelected(null);
            setPhase("playing");
        }
    };

    const currentQuestion = questions[currentIndex];
    const correctCount = results.filter(r => r.correct).length;

    return (
        <div className="flex flex-col h-full p-6 gap-4 select-none items-center justify-center">

            {/* --- Écran d'accueil --- */}
            {phase === "idle" && (
                <div className="text-center space-y-6 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Une affirmation va s'afficher. Répondez par{" "}
                        <strong className="text-green-600 dark:text-green-400">OUI</strong> ou{" "}
                        <strong className="text-red-500 dark:text-red-400">NON</strong> selon qu'elle est
                        vraie ou fausse.<br />
                        Les questions vont progressivement devenir plus complexes.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {QUESTIONS.length} questions · niveaux facile, moyen et difficile
                    </p>
                    <button
                        onClick={startGame}
                        className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* --- Exercice en cours --- */}
            {(phase === "playing" || phase === "feedback") && currentQuestion && (
                <div className="flex flex-col items-center gap-6 w-full max-w-lg">

                    {/* Progression */}
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                            {currentIndex + 1} / {questions.length}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                                className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${niveauBadge[currentQuestion.niveau]}`}>
                            {currentQuestion.niveau}
                        </span>
                    </div>

                    {/* Question */}
                    <div className="w-full bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-2xl px-6 py-6 text-center">
                        <p className="text-xl font-semibold text-teal-800 dark:text-teal-200 leading-relaxed">
                            {currentQuestion.texte}
                        </p>
                    </div>

                    {/* Boutons OUI / NON */}
                    <div className="flex gap-4 w-full">
                        {(["OUI", "NON"] as Reponse[]).map((rep) => {
                            let cls = "flex-1 py-5 text-2xl font-bold rounded-2xl border-2 transition-all duration-150 ";

                            if (phase === "playing") {
                                cls += rep === "OUI"
                                    ? "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-green-400 dark:hover:border-green-500 cursor-pointer"
                                    : "border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-400 dark:hover:border-red-500 cursor-pointer";
                            } else {
                                // phase feedback
                                const isCorrectAnswer = rep === currentQuestion.reponseCorrecte;
                                const isSelected = rep === selected;

                                if (isCorrectAnswer) {
                                    cls += "border-green-400 dark:border-green-500 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 cursor-default";
                                } else if (isSelected) {
                                    cls += "border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 cursor-default";
                                } else {
                                    cls += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 opacity-40 cursor-default";
                                }
                            }

                            return (
                                <button
                                    key={rep}
                                    onClick={() => handleReponse(rep)}
                                    disabled={phase === "feedback"}
                                    className={cls}
                                >
                                    {rep}
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback */}
                    {phase === "feedback" && (
                        <div className="flex flex-col items-center gap-3">
                            <p className={`text-base font-semibold ${
                                selected === currentQuestion.reponseCorrecte
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                            }`}>
                                {selected === currentQuestion.reponseCorrecte
                                    ? "✓ Correct !"
                                    : `✗ Incorrect — la bonne réponse était ${currentQuestion.reponseCorrecte}`}
                            </p>
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                            >
                                {currentIndex + 1 < questions.length ? "Question suivante →" : "Voir les résultats"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- Résultats finaux --- */}
            {phase === "finished" && (
                <div className="text-center space-y-5 max-w-sm">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p>
                            Score :{" "}
                            <strong className="text-teal-600 dark:text-teal-300 text-lg">
                                {correctCount} / {results.length}
                            </strong>
                        </p>
                        <p>({Math.round((correctCount / results.length) * 100)} %)</p>
                    </div>

                    {/* Détail des réponses */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-2 text-left max-h-52 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className={`shrink-0 mt-0.5 ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className={`shrink-0 text-xs px-1 rounded border font-medium ${niveauBadge[r.question.niveau]}`}>
                                    {r.question.niveau}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 flex-1">{r.question.texte}</span>
                                {!r.correct && (
                                    <span className="shrink-0 text-red-400 font-medium">{r.reponse}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={startGame}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Recommencer
                    </button>
                </div>
            )}

        </div>
    );
}

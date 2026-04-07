"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

const WORD_BANK = [
    "chat", "soleil", "maison", "arbre", "lampe", "nuage", "livre", "table",
    "fleur", "route", "porte", "fleuve", "lune", "stylo", "ville", "forêt",
    "pain", "rivière", "école", "chaise", "fenêtre", "clé", "oiseau", "pierre",
    "montagne", "jardin", "miroir", "horloge", "bateau", "étoile", "champ", "lettre",
    "violon", "ballon", "corbeau", "bougie", "casque", "feuille", "marché", "phare",
];

type Phase = "idle" | "showing" | "recall" | "correct" | "wrong" | "finished";

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

export default function MiseAJourMemo({ patientId }: { patientId: string | null }) {
    const [n, setN] = useState(2);              // nb de mots à rappeler
    const [errors, setErrors] = useState(0);
    const [score, setScore] = useState(0);
    const [record, setRecord] = useState(0);
    const [phase, setPhase] = useState<Phase>("idle");

    const [series, setSeries] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [wordBank, setWordBank] = useState<string[]>([]);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);

    const EXTRA = 3; // mots supplémentaires au-delà de N pour forcer la mise à jour

    const buildSeries = (count: number): string[] =>
        shuffle(WORD_BANK).slice(0, count);

    const buildWordBank = (shownWords: string[], lastN: string[]): string[] => {
        // Tous les mots montrés + 2 distracteurs non montrés, mélangés
        const distractors = shuffle(WORD_BANK.filter(w => !shownWords.includes(w))).slice(0, 2);
        return shuffle([...shownWords, ...distractors]);
    };

    const startRound = useCallback((currentN: number) => {
        const total = currentN + EXTRA;
        const newSeries = buildSeries(total);
        setSeries(newSeries);
        setCurrentIndex(0);
        setSelectedWords([]);
        setPhase("showing");
    }, []);

    const handleNext = () => {
        if (currentIndex + 1 >= series.length) {
            const lastN = series.slice(-n);
            setWordBank(buildWordBank(series, lastN));
            setPhase("recall");
        } else {
            setCurrentIndex(i => i + 1);
        }
    };

    const handleWordSelect = (word: string) => {
        if (selectedWords.includes(word)) return;
        const newSelected = [...selectedWords, word];
        setSelectedWords(newSelected);

        if (newSelected.length < n) return;

        const targets = series.slice(-n);
        const recallOk = targets.every((w, i) => newSelected[i] === w);

        if (recallOk) {
            const newN = Math.min(8, n + 1);
            setScore(s => s + n);
            setRecord(r => Math.max(r, n));
            setN(newN);
            setPhase("correct");
            setTimeout(() => startRound(newN), 1400);
        } else {
            const newErrors = errors + 1;
            setErrors(newErrors);
            if (newErrors >= 3) {
                setPhase("finished");
                if (patientId) {
                    saveScore({
                        patientId,
                        exercice: "Mise à jour en mémoire",
                        domaine: "admin-central",
                        score,
                        empan: record,
                    });
                }
            } else {
                const newN = Math.max(2, n - 1);
                setN(newN);
                setPhase("wrong");
                setTimeout(() => startRound(newN), 1400);
            }
        }
    };

    const reset = () => {
        setN(2);
        setErrors(0);
        setScore(0);
        setRecord(0);
        setPhase("idle");
        setSeries([]);
        setCurrentIndex(0);
        setSelectedWords([]);
    };

    const targets = series.slice(-n);
    const currentWord = series[currentIndex];

    return (
        <div className="flex flex-col h-full p-4 gap-3 select-none">

            {/* Stats */}
            <div className="flex gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>N derniers : <strong className="text-indigo-600 dark:text-indigo-300">{n}</strong></span>
                <span>Score : <strong className="text-emerald-600 dark:text-green-400">{score}</strong></span>
                <span>Erreurs : <strong className={errors >= 2 ? "text-red-600" : ""}>{errors}</strong> / 3</span>
                <span>Record : <strong className="text-yellow-600 dark:text-yellow-400">{record}</strong></span>
            </div>

            {/* Zone principale */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">

                {phase === "idle" && (
                    <div className="text-center space-y-5 max-w-md">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Des mots vont s'afficher un par un.<br />
                            Mémorisez uniquement les <strong>{n} derniers</strong> mots de la série.<br />
                            À la fin, rappellez-les dans l'ordre.
                        </p>
                        <button
                            onClick={() => startRound(n)}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {phase === "showing" && currentWord && (
                    <div className="w-full max-w-sm text-center space-y-6">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Mot {currentIndex + 1} / {series.length} — retenez les <strong>{n} derniers</strong>
                        </p>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-12 py-10 shadow-sm">
                            <p className="text-4xl font-bold text-slate-800 dark:text-white tracking-wide">
                                {currentWord}
                            </p>
                        </div>
                        <button
                            onClick={handleNext}
                            className="px-8 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            {currentIndex + 1 >= series.length ? "Rappel →" : "Suivant →"}
                        </button>
                    </div>
                )}

                {phase === "recall" && (
                    <div className="w-full max-w-lg space-y-5">
                        <p className="text-center font-semibold text-slate-700 dark:text-slate-200">
                            Rappellez les <strong>{n}</strong> derniers mots dans l'ordre
                        </p>

                        {/* Cases de réponse */}
                        <div className="flex gap-2 flex-wrap justify-center">
                            {targets.map((_, i) => (
                                <div
                                    key={i}
                                    className="px-4 py-2 min-w-24 text-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    {selectedWords[i] ?? ""}
                                </div>
                            ))}
                        </div>

                        {/* Banque de mots */}
                        <div className="flex gap-2 flex-wrap justify-center mt-2">
                            {wordBank.map((word) => {
                                const used = selectedWords.includes(word);
                                return (
                                    <button
                                        key={word}
                                        onClick={() => handleWordSelect(word)}
                                        disabled={used}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 ${
                                            used
                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-default"
                                                : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900 cursor-pointer text-slate-800 dark:text-white"
                                        }`}
                                    >
                                        {word}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {phase === "correct" && (
                    <p className="text-emerald-600 dark:text-green-400 font-bold text-lg">
                        Excellent ! Niveau suivant...
                    </p>
                )}

                {phase === "wrong" && (
                    <p className="text-red-600 dark:text-red-400 font-bold text-lg">
                        Incorrect. On recommence...
                    </p>
                )}

                {phase === "finished" && (
                    <div className="text-center space-y-4">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                            Exercice terminé
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                            Score final : <strong>{score}</strong> — Record : N = <strong>{record}</strong>
                        </p>
                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Recommencer
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

"use client";

import { useState, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "study" | "recall" | "result" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

const ALL_PAIRS = [
    { word: "Chien",        associate: "Laisse" },
    { word: "Soleil",       associate: "Lunettes" },
    { word: "Piano",        associate: "Musique" },
    { word: "Mer",          associate: "Bateau" },
    { word: "Forêt",        associate: "Champignon" },
    { word: "Hôpital",      associate: "Médecin" },
    { word: "École",        associate: "Crayon" },
    { word: "Montagne",     associate: "Neige" },
    { word: "Cuisine",      associate: "Casserole" },
    { word: "Jardin",       associate: "Arrosoir" },
    { word: "Marché",       associate: "Panier" },
    { word: "Bibliothèque", associate: "Livre" },
];

const DIFFICULTY_COUNTS: Record<Difficulty, number> = {
    facile: 4,
    moyen: 6,
    difficile: 8,
};

const ROUNDS = 3;

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

function buildOptions(correct: string, pool: string[]): string[] {
    const distractors = shuffle(pool.filter(a => a !== correct)).slice(0, 3);
    return shuffle([correct, ...distractors]);
}

export default function AssociationPairesExo({ patientId }: { patientId: string | null }) {
    const [phase, setPhase]             = useState<Phase>("idle");
    const [difficulty, setDifficulty]   = useState<Difficulty>("facile");
    const [pairs, setPairs]             = useState<{ word: string; associate: string }[]>([]);
    const [studyIndex, setStudyIndex]   = useState(0);
    const [recallIndex, setRecallIndex] = useState(0);
    const [options, setOptions]         = useState<string[]>([]);
    const [roundResults, setRoundResults] = useState<boolean[]>([]);
    const [lastAnswer, setLastAnswer]   = useState<string | null>(null);

    // Affichage uniquement
    const [displayScore, setDisplayScore] = useState(0);
    const [displayRecord, setDisplayRecord] = useState(0);
    const [displayRound, setDisplayRound]   = useState(1);
    const [displayRoundResults, setDisplayRoundResults] = useState<boolean[]>([]);

    // Refs pour les valeurs utilisées dans le save (pas de stale closure)
    const totalScoreRef = useRef(0);
    const roundRef      = useRef(1);
    const difficultyRef = useRef<Difficulty>("facile");
    const pairsRef      = useRef<{ word: string; associate: string }[]>([]);

    const startRound = (selectedPairs: typeof pairs, roundNum: number) => {
        pairsRef.current = selectedPairs;
        roundRef.current = roundNum;
        setPairs(selectedPairs);
        setStudyIndex(0);
        setRecallIndex(0);
        setRoundResults([]);
        setLastAnswer(null);
        setDisplayRound(roundNum);
        setPhase("study");
    };

    const startGame = () => {
        const count = DIFFICULTY_COUNTS[difficulty];
        difficultyRef.current = difficulty;
        totalScoreRef.current = 0;
        roundRef.current = 1;
        setDisplayScore(0);
        setDisplayRecord(0);
        setDisplayRound(1);
        const selected = shuffle(ALL_PAIRS).slice(0, count);
        startRound(selected, 1);
    };

    const handleNextStudy = () => {
        if (studyIndex + 1 < pairsRef.current.length) {
            setStudyIndex(i => i + 1);
        } else {
            const pool = pairsRef.current.map(p => p.associate);
            setOptions(buildOptions(pairsRef.current[0].associate, pool));
            setRecallIndex(0);
            setLastAnswer(null);
            setPhase("recall");
        }
    };

    const handleAnswer = (chosen: string, currentRecallIndex: number, currentRoundResults: boolean[]) => {
        if (lastAnswer !== null) return;
        setLastAnswer(chosen);

        const correct = chosen === pairsRef.current[currentRecallIndex].associate;
        const newResults = [...currentRoundResults, correct];
        setRoundResults(newResults);

        const isLastQuestion = currentRecallIndex + 1 >= pairsRef.current.length;

        if (isLastQuestion) {
            const roundScore = newResults.filter(Boolean).length;
            totalScoreRef.current += roundScore;
            const newRecord = Math.max(displayRecord, roundScore);

            setDisplayScore(totalScoreRef.current);
            setDisplayRecord(newRecord);
            setDisplayRoundResults(newResults);

            if (roundRef.current >= ROUNDS && patientId) {
                saveScore({
                    patientId,
                    exercice: "Association de paires",
                    domaine: "buffer-episodique",
                    score: totalScoreRef.current,
                    empan: DIFFICULTY_COUNTS[difficultyRef.current],
                });
            }
        }

        setTimeout(() => {
            const next = currentRecallIndex + 1;
            if (next < pairsRef.current.length) {
                const pool = pairsRef.current.map(p => p.associate);
                setOptions(buildOptions(pairsRef.current[next].associate, pool));
                setRecallIndex(next);
                setLastAnswer(null);
            } else {
                setPhase("result");
            }
        }, 900);
    };

    const nextRound = () => {
        if (roundRef.current >= ROUNDS) {
            setPhase("finished");
        } else {
            const count = DIFFICULTY_COUNTS[difficultyRef.current];
            const selected = shuffle(ALL_PAIRS).slice(0, count);
            startRound(selected, roundRef.current + 1);
        }
    };

    const reset = () => {
        totalScoreRef.current = 0;
        roundRef.current = 1;
        setPhase("idle");
        setPairs([]);
        setStudyIndex(0);
        setRecallIndex(0);
        setRoundResults([]);
        setLastAnswer(null);
        setDisplayScore(0);
        setDisplayRecord(0);
        setDisplayRound(1);
        setDisplayRoundResults([]);
    };

    const currentPair   = pairsRef.current[studyIndex];
    const recallPair    = pairsRef.current[recallIndex];
    const maxPerRound   = DIFFICULTY_COUNTS[difficulty];
    const roundScore    = displayRoundResults.filter(Boolean).length;

    return (
        <div className="flex flex-col h-full p-4 gap-3 select-none">

            {/* Stats */}
            <div className="flex gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Manche : <strong className="text-indigo-600 dark:text-indigo-300">{displayRound} / {ROUNDS}</strong></span>
                <span>Score : <strong className="text-emerald-600 dark:text-green-400">{displayScore}</strong></span>
                <span>Record : <strong className="text-yellow-600 dark:text-yellow-400">{displayRecord} / {maxPerRound}</strong></span>
                <span className="ml-auto text-slate-400 capitalize">{difficulty}</span>
            </div>

            {/* Zone principale */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">

                {phase === "idle" && (
                    <div className="text-center space-y-6 max-w-md">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Des paires de mots vont s'afficher une par une.<br />
                            Mémorisez les associations, puis retrouvez le mot associé à chaque indice.
                        </p>
                        <div className="flex gap-3 justify-center">
                            {(["facile", "moyen", "difficile"] as Difficulty[]).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 capitalize ${
                                        difficulty === d
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                                    }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Facile : 4 paires · Moyen : 6 paires · Difficile : 8 paires
                        </p>
                        <button
                            onClick={startGame}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {phase === "study" && currentPair && (
                    <div className="w-full max-w-sm text-center space-y-6">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Paire {studyIndex + 1} / {pairsRef.current.length} — mémorisez l'association
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-8 py-6 shadow-sm min-w-28">
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {currentPair.word}
                                </p>
                            </div>
                            <span className="text-2xl text-slate-400">→</span>
                            <div className="bg-indigo-50 dark:bg-indigo-900 rounded-2xl px-8 py-6 shadow-sm min-w-28">
                                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                                    {currentPair.associate}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleNextStudy}
                            className="px-8 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            {studyIndex + 1 >= pairsRef.current.length ? "Commencer le rappel →" : "Suivant →"}
                        </button>
                    </div>
                )}

                {phase === "recall" && recallPair && (
                    <div className="w-full max-w-md space-y-5">
                        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                            Rappel {recallIndex + 1} / {pairsRef.current.length}
                        </p>
                        <div className="text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Quel mot était associé à…</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {recallPair.word}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {options.map((opt, idx) => {
                                const correct = recallPair.associate;
                                let style = "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900 text-slate-800 dark:text-white cursor-pointer";
                                if (lastAnswer !== null) {
                                    if (opt === correct) style = "bg-green-100 dark:bg-green-900 border-green-500 text-green-800 dark:text-green-200 cursor-default";
                                    else if (opt === lastAnswer) style = "bg-red-100 dark:bg-red-900 border-red-400 text-red-700 dark:text-red-200 cursor-default";
                                    else style = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-default";
                                }
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(opt, recallIndex, roundResults)}
                                        disabled={lastAnswer !== null}
                                        className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors duration-150 ${style}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {phase === "result" && (
                    <div className="text-center space-y-4 max-w-sm">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                            Manche {displayRound} terminée
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                            {roundScore} / {pairsRef.current.length} bonnes associations
                        </p>
                        <div className="flex gap-2 justify-center">
                            {displayRoundResults.map((ok, i) => (
                                <span key={i} className={`text-xl ${ok ? "text-emerald-500" : "text-red-400"}`}>
                                    {ok ? "✓" : "✗"}
                                </span>
                            ))}
                        </div>
                        {roundRef.current < ROUNDS ? (
                            <button
                                onClick={nextRound}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                            >
                                Manche suivante →
                            </button>
                        ) : (
                            <button
                                onClick={() => setPhase("finished")}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                            >
                                Voir le résultat final →
                            </button>
                        )}
                    </div>
                )}

                {phase === "finished" && (
                    <div className="text-center space-y-4">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé</p>
                        <p className="text-slate-600 dark:text-slate-400">
                            Score total : <strong>{displayScore}</strong> / {ROUNDS * maxPerRound}
                        </p>
                        <p className="text-slate-500 dark:text-slate-500 text-sm">
                            Meilleure manche : <strong>{displayRecord}</strong> / {maxPerRound}
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

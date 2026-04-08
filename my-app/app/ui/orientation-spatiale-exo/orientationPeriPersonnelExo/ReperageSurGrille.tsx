"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface RoundResult {
    target: string;
    clicked: string;
    correct: boolean;
    timeMs: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { cols: number; rows: number; rounds: number; empan: number }> = {
    facile:    { cols: 4, rows: 4, rounds: 8,  empan: 3 },
    moyen:     { cols: 6, rows: 5, rounds: 12, empan: 5 },
    difficile: { cols: 8, rows: 6, rounds: 16, empan: 8 },
};

const COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ROW_LABELS = ["1", "2", "3", "4", "5", "6"];

function randomTarget(cols: number, rows: number, exclude?: string): string {
    let cell: string;
    do {
        const col = COL_LABELS[Math.floor(Math.random() * cols)];
        const row = ROW_LABELS[Math.floor(Math.random() * rows)];
        cell = `${col}${row}`;
    } while (cell === exclude);
    return cell;
}

export default function ReperageSurGrille({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [target, setTarget] = useState("");
    const [lastClicked, setLastClicked] = useState("");
    const [results, setResults] = useState<RoundResult[]>([]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
    const roundStartRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { cols, rows, rounds } = DIFFICULTY_CONFIG[difficulty];

    const startRound = useCallback((idx: number, diff: Difficulty, prevTarget?: string) => {
        const { cols, rows } = DIFFICULTY_CONFIG[diff];
        const next = randomTarget(cols, rows, prevTarget);
        setTarget(next);
        setLastClicked("");
        setLastCorrect(null);
        setRoundIdx(idx);
        setPhase("playing");
        roundStartRef.current = Date.now();
    }, []);

    const startGame = useCallback((diff: Difficulty) => {
        setResults([]);
        startRound(0, diff);
    }, [startRound]);

    const finishGame = useCallback((allResults: RoundResult[]) => {
        setPhase("finished");
        if (patientId) {
            const correct = allResults.filter(r => r.correct).length;
            const score = Math.round((correct / allResults.length) * 100);
            saveScore({
                patientId,
                exercice: "Repérage sur grille",
                domaine: "orientation-spatiale",
                score,
                empan: DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
    }, [patientId, difficulty]);

    const handleCellClick = useCallback((cell: string) => {
        const timeMs = Date.now() - roundStartRef.current;
        const correct = cell === target;
        const result: RoundResult = { target, clicked: cell, correct, timeMs };
        const updated = [...results, result];

        setLastClicked(cell);
        setLastCorrect(correct);
        setResults(updated);
        setPhase("feedback");

        const nextIdx = roundIdx + 1;
        if (nextIdx >= DIFFICULTY_CONFIG[difficulty].rounds) {
            timeoutRef.current = setTimeout(() => finishGame(updated), 1200);
        } else {
            timeoutRef.current = setTimeout(() => startRound(nextIdx, difficulty, target), 1000);
        }
    }, [target, results, roundIdx, difficulty, startRound, finishGame]);

    const reset = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setPhase("idle");
        setResults([]);
        setTarget("");
        setLastClicked("");
        setLastCorrect(null);
    };

    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    const correctCount = results.filter(r => r.correct).length;
    const avgTime = results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.timeMs, 0) / results.length / 100) / 10
        : 0;

    const getCellState = (cell: string) => {
        if (phase !== "feedback") return "default";
        if (cell === target) return "correct";
        if (cell === lastClicked && !lastCorrect) return "wrong";
        return "default";
    };

    const cellBase = "flex items-center justify-center rounded-md text-sm font-medium border transition-colors duration-150 cursor-pointer select-none aspect-square";
    const cellStates: Record<string, string> = {
        default: "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-300 dark:hover:border-sky-600",
        correct: "bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300",
        wrong:   "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300",
    };

    return (
        <div className="flex flex-col h-full p-4 gap-4 select-none items-center justify-center">

            {/* --- Écran d'accueil --- */}
            {phase === "idle" && (
                <div className="text-center space-y-6 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Une <strong>coordonnée</strong> s'affiche (ex. : <span className="font-mono font-bold text-sky-600 dark:text-sky-400">C3</span>).<br />
                        Cliquez sur la case correspondante dans la grille.<br />
                        Les colonnes sont des <strong>lettres</strong>, les lignes des <strong>chiffres</strong>.
                    </p>
                    <div className="flex gap-3 justify-center">
                        {(["facile", "moyen", "difficile"] as Difficulty[]).map(d => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 capitalize ${
                                    difficulty === d
                                        ? "bg-sky-600 text-white border-sky-600"
                                        : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Facile : grille 4×4 · Moyen : 6×5 · Difficile : 8×6
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* --- Jeu --- */}
            {(phase === "playing" || phase === "feedback") && (
                <div className="flex flex-col items-center gap-4 w-full max-w-lg">

                    {/* Barre de progression + cible */}
                    <div className="flex items-center justify-between w-full px-1">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            {roundIdx + 1} / {rounds}
                        </span>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                                Trouvez la case
                            </span>
                            <span className={`text-3xl font-bold font-mono tracking-widest transition-colors duration-200 ${
                                phase === "feedback"
                                    ? lastCorrect
                                        ? "text-green-500"
                                        : "text-red-500"
                                    : "text-sky-600 dark:text-sky-400"
                            }`}>
                                {target}
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            {correctCount} ✓
                        </span>
                    </div>

                    {/* Grille */}
                    <div className="w-full">
                        {/* En-tête colonnes */}
                        <div
                            className="grid mb-1"
                            style={{ gridTemplateColumns: `1.5rem repeat(${cols}, 1fr)` }}
                        >
                            <div />
                            {COL_LABELS.slice(0, cols).map(c => (
                                <div key={c} className="flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {c}
                                </div>
                            ))}
                        </div>

                        {/* Lignes */}
                        {ROW_LABELS.slice(0, rows).map(row => (
                            <div
                                key={row}
                                className="grid mb-1"
                                style={{ gridTemplateColumns: `1.5rem repeat(${cols}, 1fr)` }}
                            >
                                {/* Label ligne */}
                                <div className="flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {row}
                                </div>
                                {/* Cellules */}
                                {COL_LABELS.slice(0, cols).map(col => {
                                    const cell = `${col}${row}`;
                                    const state = getCellState(cell);
                                    return (
                                        <div
                                            key={cell}
                                            onClick={() => phase === "playing" && handleCellClick(cell)}
                                            className={`${cellBase} ${cellStates[state]} mx-0.5 ${phase === "feedback" ? "cursor-default" : ""}`}
                                        >
                                            <span className="text-xs opacity-40">{cell}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Feedback inline */}
                    {phase === "feedback" && (
                        <p className={`text-sm font-medium ${lastCorrect ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                            {lastCorrect
                                ? "Bonne case !"
                                : `Incorrect — la case ${target} est en vert`}
                        </p>
                    )}
                </div>
            )}

            {/* --- Résultats --- */}
            {phase === "finished" && (
                <div className="text-center space-y-5 max-w-sm">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                        <p>
                            Réussite :{" "}
                            <strong className={correctCount === results.length ? "text-green-600" : correctCount >= results.length * 0.7 ? "text-amber-500" : "text-red-500"}>
                                {correctCount} / {results.length}
                            </strong>
                        </p>
                        <p>Temps moyen par case : <strong>{avgTime} s</strong></p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs capitalize">
                            Niveau : <strong>{difficulty}</strong> · Grille {cols}×{rows}
                        </p>
                    </div>

                    {/* Détail compact */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1 text-left max-h-36 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={`shrink-0 ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold w-6">{r.target}</span>
                                {!r.correct && (
                                    <span className="text-red-400 font-mono">→ {r.clicked}</span>
                                )}
                                <span className="ml-auto text-slate-400">{(r.timeMs / 1000).toFixed(1)}s</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={reset}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Recommencer
                    </button>
                </div>
            )}

        </div>
    );
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "memorize" | "recall" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface Cell { r: number; c: number; }

const DIFFICULTY_CONFIG: Record<Difficulty, {
    size: number;
    pathLen: number;
    memorizeSec: number;
    empan: number;
}> = {
    facile:    { size: 4, pathLen: 4, memorizeSec: 10, empan: 3 },
    moyen:     { size: 6, pathLen: 7, memorizeSec: 8,  empan: 5 },
    difficile: { size: 8, pathLen: 10, memorizeSec: 6, empan: 8 },
};

// Landmarks scattered on the grid (emoji + label)
const LANDMARK_POOL = [
    { icon: "🏠", label: "Maison" },
    { icon: "🏪", label: "Épicerie" },
    { icon: "🏫", label: "École" },
    { icon: "🌳", label: "Parc" },
    { icon: "⛪", label: "Église" },
    { icon: "🏥", label: "Pharmacie" },
    { icon: "🚌", label: "Arrêt bus" },
    { icon: "☕", label: "Café" },
    { icon: "📮", label: "Poste" },
    { icon: "🍞", label: "Boulangerie" },
];

function cellKey(c: Cell) { return `${c.r}-${c.c}`; }
function cellEq(a: Cell, b: Cell) { return a.r === b.r && a.c === b.c; }

function generatePath(size: number, length: number): Cell[] {
    const dirs = [
        { r: -1, c: 0 }, { r: 1, c: 0 },
        { r: 0, c: -1 }, { r: 0, c: 1 },
    ];
    const visited = new Set<string>();
    const startR = Math.floor(Math.random() * size);
    const startC = Math.floor(Math.random() * size);
    const path: Cell[] = [{ r: startR, c: startC }];
    visited.add(cellKey(path[0]));

    for (let attempt = 0; attempt < 500 && path.length < length; attempt++) {
        const cur = path[path.length - 1];
        const shuffled = [...dirs].sort(() => Math.random() - 0.5);
        let moved = false;
        for (const d of shuffled) {
            const next = { r: cur.r + d.r, c: cur.c + d.c };
            if (next.r < 0 || next.r >= size || next.c < 0 || next.c >= size) continue;
            if (visited.has(cellKey(next))) continue;
            path.push(next);
            visited.add(cellKey(next));
            moved = true;
            break;
        }
        if (!moved) break;
    }
    return path;
}

function assignLandmarks(path: Cell[], size: number): Map<string, { icon: string; label: string }> {
    const map = new Map<string, { icon: string; label: string }>();
    const pool = [...LANDMARK_POOL].sort(() => Math.random() - 0.5);
    // Place landmark at start and end of path
    map.set(cellKey(path[0]), pool[0]);
    map.set(cellKey(path[path.length - 1]), pool[1]);
    // A few random intermediate landmarks
    const mid = Math.floor(path.length / 2);
    if (path.length > 3) map.set(cellKey(path[mid]), pool[2]);
    return map;
}

function dirArrow(from: Cell, to: Cell): string {
    if (to.r < from.r) return "↑";
    if (to.r > from.r) return "↓";
    if (to.c < from.c) return "←";
    return "→";
}

export default function ApprentissageTrajectoireVirtuel({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [path, setPath] = useState<Cell[]>([]);
    const [landmarks, setLandmarks] = useState<Map<string, { icon: string; label: string }>>(new Map());
    const [playerPath, setPlayerPath] = useState<Cell[]>([]);
    const [countdown, setCountdown] = useState(0);
    const [score, setScore] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { size, pathLen, memorizeSec } = DIFFICULTY_CONFIG[difficulty];

    const clearTimer = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    const startGame = useCallback((diff: Difficulty) => {
        const cfg = DIFFICULTY_CONFIG[diff];
        const newPath = generatePath(cfg.size, cfg.pathLen);
        const lm = assignLandmarks(newPath, cfg.size);
        setPath(newPath);
        setLandmarks(lm);
        setPlayerPath([]);
        setScore(null);
        setCountdown(cfg.memorizeSec);
        setPhase("memorize");
    }, []);

    useEffect(() => {
        if (phase !== "memorize") return;
        clearTimer();
        timerRef.current = setInterval(() => {
            setCountdown(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    useEffect(() => {
        if (phase === "memorize" && countdown === 0) {
            clearTimer();
            setPhase("recall");
        }
    }, [countdown, phase]);

    useEffect(() => () => clearTimer(), []);

    const handleCellClick = useCallback((cell: Cell) => {
        if (phase !== "recall") return;

        setPlayerPath(prev => {
            // Toggle: if last cell is this one, remove it (undo last step)
            if (prev.length > 0 && cellEq(prev[prev.length - 1], cell)) {
                return prev.slice(0, -1);
            }
            // Prevent revisiting already clicked cells
            if (prev.some(p => cellEq(p, cell))) return prev;
            return [...prev, cell];
        });
    }, [phase]);

    // Auto-finish when playerPath reaches required length
    const autoFinishRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (phase !== "recall" || playerPath.length < path.length || path.length === 0) return;
        const correct = playerPath.filter((c, i) => path[i] && cellEq(c, path[i])).length;
        const pct = Math.round((correct / path.length) * 100);
        setScore(pct);
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Apprentissage d'un trajet virtuel",
                domaine: "orientation-spatiale",
                score: pct,
                empan: DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
        autoFinishRef.current = setTimeout(() => setPhase("finished"), 400);
        return () => { if (autoFinishRef.current) clearTimeout(autoFinishRef.current); };
    }, [playerPath, phase, path, patientId, difficulty]);

    const submitRecall = useCallback(() => {
        const correct = playerPath.filter((c, i) => path[i] && cellEq(c, path[i])).length;
        const pct = Math.round((correct / path.length) * 100);
        setScore(pct);
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Apprentissage d'un trajet virtuel",
                domaine: "orientation-spatiale",
                score: pct,
                empan: DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
        setPhase("finished");
    }, [playerPath, path, patientId, difficulty]);

    const reset = () => {
        clearTimer();
        setPhase("idle");
        setPath([]);
        setPlayerPath([]);
        setScore(null);
    };

    // Determine cell appearance
    const getCellDisplay = (r: number, c: number) => {
        const cell: Cell = { r, c };
        const key = cellKey(cell);
        const lm = landmarks.get(key);
        const inPath = path.findIndex(p => cellEq(p, cell));
        const inPlayer = playerPath.findIndex(p => cellEq(p, cell));
        const isStart = path.length > 0 && cellEq(path[0], cell);
        const isEnd = path.length > 0 && cellEq(path[path.length - 1], cell);

        let bg = "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600";
        let content: React.ReactNode = null;
        let textColor = "text-slate-500 dark:text-slate-400";

        if (phase === "memorize") {
            if (inPath >= 0) {
                if (isStart) bg = "bg-emerald-200 dark:bg-emerald-800 border-emerald-400 dark:border-emerald-500";
                else if (isEnd) bg = "bg-amber-200 dark:bg-amber-800 border-amber-400 dark:border-amber-500";
                else bg = "bg-primary-100 dark:bg-primary-900/50 border-primary-300 dark:border-primary-600";
                const arrow = inPath < path.length - 1 ? dirArrow(path[inPath], path[inPath + 1]) : "★";
                const stepNum = inPath + 1;
                content = (
                    <span className="flex flex-col items-center leading-tight">
                        {lm ? <span className="text-base">{lm.icon}</span> : null}
                        <span className="text-[10px] font-bold">{stepNum}</span>
                        <span className="text-xs font-bold">{arrow}</span>
                    </span>
                );
            } else if (lm) {
                content = <span className="text-base opacity-40">{lm.icon}</span>;
            }
        } else if (phase === "recall") {
            if (inPlayer >= 0) {
                const correctStep = path[inPlayer] && cellEq(path[inPlayer], cell);
                bg = correctStep
                    ? "bg-primary-200 dark:bg-primary-800 border-primary-400 dark:border-primary-500"
                    : "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-500";
                content = (
                    <span className="flex flex-col items-center leading-tight">
                        {lm ? <span className="text-base">{lm.icon}</span> : null}
                        <span className="text-[10px] font-bold">{inPlayer + 1}</span>
                    </span>
                );
            } else {
                // Only show landmarks during recall (path hidden)
                if (lm) {
                    // Show start landmark as hint
                    if (isStart) {
                        bg = "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300";
                        content = <span className="text-base">{lm.icon}</span>;
                    } else if (isEnd) {
                        bg = "bg-amber-100 dark:bg-amber-900/30 border-amber-300";
                        content = <span className="text-base">{lm.icon}</span>;
                    } else {
                        content = <span className="text-base">{lm.icon}</span>;
                    }
                }
            }
            textColor = "text-primary-700 dark:text-primary-300";
        } else if (phase === "finished") {
            if (inPath >= 0) {
                const playerHere = playerPath.findIndex(p => cellEq(p, cell));
                if (playerHere >= 0 && path[playerHere] && cellEq(path[playerHere], cell)) {
                    bg = "bg-green-200 dark:bg-green-800/60 border-green-400";
                } else if (playerHere >= 0) {
                    bg = "bg-red-100 dark:bg-red-900/30 border-red-400";
                } else {
                    bg = "bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 opacity-60";
                }
                const arrow = inPath < path.length - 1 ? dirArrow(path[inPath], path[inPath + 1]) : "★";
                content = (
                    <span className="flex flex-col items-center leading-tight">
                        {lm ? <span className="text-base">{lm.icon}</span> : null}
                        <span className="text-[10px] font-bold">{inPath + 1}</span>
                        <span className="text-xs font-bold">{arrow}</span>
                    </span>
                );
            } else if (lm) {
                content = <span className="text-base opacity-50">{lm.icon}</span>;
            }
        }

        return { bg, content, textColor };
    };

    const correctCount = playerPath.filter((c, i) => path[i] && cellEq(c, path[i])).length;

    return (
        <div className="flex flex-col h-full p-4 gap-4 select-none items-center justify-center overflow-y-auto">

            {/* ── Écran d'accueil ── */}
            {phase === "idle" && (
                <div className="text-center space-y-5 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Un <strong>trajet</strong> s'affiche sur la carte pendant quelques secondes.<br />
                        Mémorisez l'itinéraire, puis <strong>reproduisez-le</strong> en cliquant
                        les cases dans l'ordre, de la case de <span className="text-emerald-600 font-semibold">départ</span> jusqu'à l'<span className="text-amber-600 font-semibold">arrivée</span>.<br />
                        Cliquez sur la dernière case pour annuler une étape.
                    </p>
                    <div className="flex gap-3 justify-center">
                        {(["facile", "moyen", "difficile"] as Difficulty[]).map(d => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 capitalize ${
                                    difficulty === d
                                        ? "bg-primary-600 text-white border-primary-600"
                                        : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Facile : grille 4×4, 4 étapes, 10 s · Moyen : 6×6, 7 étapes, 8 s · Difficile : 8×8, 10 étapes, 6 s
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Mémorisation ── */}
            {phase === "memorize" && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex items-center justify-between w-full max-w-xs">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Mémorisez le trajet…
                        </p>
                        <span className={`text-xl font-bold tabular-nums ${countdown <= 3 ? "text-red-500" : "text-primary-600 dark:text-primary-400"}`}>
                            {countdown}s
                        </span>
                    </div>

                    <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-800 border border-emerald-400 inline-block" />
                            Départ
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-amber-200 dark:bg-amber-800 border border-amber-400 inline-block" />
                            Arrivée (★)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-primary-100 dark:bg-primary-900/50 border border-primary-300 dark:border-primary-600 inline-block" />
                            Étape
                        </span>
                    </div>

                    <Grid size={size} getCellDisplay={getCellDisplay} onCellClick={() => {}} phase={phase} />
                </div>
            )}

            {/* ── Rappel ── */}
            {phase === "recall" && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex items-center justify-between w-full max-w-xs">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Reproduisez le trajet ({playerPath.length} / {path.length})
                        </p>
                        <span className="text-sm text-slate-400">{correctCount} ✓</span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 -mt-1">
                        Partez de la case <span className="text-emerald-600 font-semibold">verte</span> (départ) et rejoignez l'<span className="text-amber-600 font-semibold">orange</span> (arrivée).
                    </p>

                    <Grid size={size} getCellDisplay={getCellDisplay} onCellClick={handleCellClick} phase={phase} />

                    {playerPath.length > 0 && playerPath.length < path.length && (
                        <button
                            onClick={submitRecall}
                            className="mt-1 px-5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
                        >
                            Valider ({playerPath.length} étapes)
                        </button>
                    )}
                </div>
            )}

            {/* ── Résultats ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center gap-4 w-full">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 text-center">
                        <p>
                            Étapes correctes :{" "}
                            <strong className={
                                (score ?? 0) >= 80 ? "text-green-600" :
                                (score ?? 0) >= 50 ? "text-amber-500" : "text-red-500"
                            }>
                                {playerPath.filter((c, i) => path[i] && cellEq(c, path[i])).length} / {path.length}
                            </strong>
                            {" "}— Score : <strong>{score} %</strong>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                            Niveau : <strong>{difficulty}</strong>
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-1.5">
                            <span className="inline-flex items-center gap-1 mr-3">
                                <span className="w-3 h-3 rounded bg-green-200 dark:bg-green-800/60 border border-green-400 inline-block" /> Correct
                            </span>
                            <span className="inline-flex items-center gap-1 mr-3">
                                <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-400 inline-block" /> Incorrect
                            </span>
                            <span className="inline-flex items-center gap-1 opacity-50">
                                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-600 border border-slate-300 inline-block" /> Manqué
                            </span>
                        </p>
                        <Grid size={size} getCellDisplay={getCellDisplay} onCellClick={() => {}} phase={phase} />
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

// ── Sub-component: Grid ──────────────────────────────────────────────────────

interface GridProps {
    size: number;
    phase: Phase;
    getCellDisplay: (r: number, c: number) => {
        bg: string;
        content: React.ReactNode;
        textColor: string;
    };
    onCellClick: (cell: Cell) => void;
}

function Grid({ size, phase, getCellDisplay, onCellClick }: GridProps) {
    const maxPx = size <= 4 ? 280 : size <= 6 ? 330 : 380;
    const cellSize = Math.floor(maxPx / size);

    return (
        <div
            className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden"
            style={{ width: cellSize * size, height: cellSize * size }}
        >
            {Array.from({ length: size }, (_, r) => (
                <div key={r} className="flex">
                    {Array.from({ length: size }, (_, c) => {
                        const { bg, content } = getCellDisplay(r, c);
                        return (
                            <div
                                key={c}
                                onClick={() => onCellClick({ r, c })}
                                className={`flex items-center justify-center border border-slate-200/60 dark:border-slate-600/60 transition-colors duration-150 ${bg} ${phase === "recall" ? "cursor-pointer hover:brightness-95 active:scale-95" : "cursor-default"}`}
                                style={{ width: cellSize, height: cellSize }}
                            >
                                {content}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

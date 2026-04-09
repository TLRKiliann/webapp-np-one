"use client";

import { useState, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

const DISK_COUNTS: Record<Difficulty, number> = { facile: 3, moyen: 4, difficile: 5 };
const MIN_MOVES:   Record<Difficulty, number> = { facile: 7, moyen: 15, difficile: 31 };

// Color per disk size: index 0 = disk size 1 (smallest), index 4 = disk size 5 (largest)
const DISK_COLORS = [
    "bg-blue-400 border-blue-600 dark:bg-blue-500 dark:border-blue-400",
    "bg-teal-400 border-teal-600 dark:bg-teal-500 dark:border-teal-400",
    "bg-yellow-400 border-yellow-600 dark:bg-yellow-500 dark:border-yellow-400",
    "bg-orange-400 border-orange-600 dark:bg-orange-500 dark:border-orange-400",
    "bg-red-400 border-red-600 dark:bg-red-500 dark:border-red-400",
];

// pegs[i][0] = bottom disk (largest number), pegs[i][last] = top disk (smallest)
function initPegs(count: number): number[][] {
    return [Array.from({ length: count }, (_, i) => count - i), [], []];
}

const PEG_LABELS = ["Source", "Auxiliaire", "Cible"];

export default function SimpleHanoiFexec({ patientId = null }: { patientId?: string | null }) {
    const [phase, setPhase]           = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [pegs, setPegs]             = useState<number[][]>([[], [], []]);
    const [selected, setSelected]     = useState<number | null>(null);
    const [moves, setMoves]           = useState(0);
    const [errors, setErrors]         = useState(0);
    const [elapsed, setElapsed]       = useState(0);
    const [flashPeg, setFlashPeg]     = useState<number | null>(null);
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef  = useRef(0);
    const movesRef  = useRef(0);

    const startGame = (diff: Difficulty) => {
        setPegs(initPegs(DISK_COUNTS[diff]));
        setSelected(null);
        setMoves(0);
        movesRef.current = 0;
        setErrors(0);
        setElapsed(0);
        setFlashPeg(null);
        setPhase("playing");
        startRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 500);
    };

    const handlePegClick = (pegIdx: number) => {
        if (phase !== "playing") return;

        // Nothing selected yet: pick the top disk of this peg
        if (selected === null) {
            if (pegs[pegIdx].length === 0) return;
            setSelected(pegIdx);
            return;
        }

        // Same peg clicked: deselect
        if (selected === pegIdx) {
            setSelected(null);
            return;
        }

        const fromPeg = pegs[selected];
        const toPeg   = pegs[pegIdx];
        const disk    = fromPeg[fromPeg.length - 1];
        const topDest = toPeg[toPeg.length - 1];

        // Invalid: larger disk onto a smaller one
        if (topDest !== undefined && disk > topDest) {
            setFlashPeg(pegIdx);
            setTimeout(() => setFlashPeg(null), 700);
            setErrors(e => e + 1);
            setSelected(null);
            return;
        }

        // Valid move
        const newPegs = pegs.map(p => [...p]);
        newPegs[selected].pop();
        newPegs[pegIdx].push(disk);
        movesRef.current += 1;
        const newMoves = movesRef.current;

        setPegs(newPegs);
        setMoves(newMoves);
        setSelected(null);

        // Win: all disks on peg 2 (Cible)
        if (newPegs[2].length === DISK_COUNTS[difficulty]) {
            if (timerRef.current) clearInterval(timerRef.current);
            const finalTime = Math.floor((Date.now() - startRef.current) / 1000);
            setElapsed(finalTime);
            setPhase("finished");
            if (patientId) {
                const extra = Math.max(0, newMoves - MIN_MOVES[difficulty]);
                const score = Math.max(0, 1000 - extra * 30 - finalTime * 2);
                saveScore({
                    patientId,
                    exercice: "Tours de Hanoï simplifiée",
                    domaine: "fonctions-executives",
                    score,
                    empan: DISK_COUNTS[difficulty],
                });
            }
        }
    };

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("idle");
        setPegs([[], [], []]);
        setSelected(null);
        setMoves(0);
        movesRef.current = 0;
        setErrors(0);
        setElapsed(0);
        setFlashPeg(null);
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    const diskCount = DISK_COUNTS[difficulty];

    return (
        <div className="flex flex-col h-full p-4 gap-3 select-none">

            {/* ── Stats bar ─────────────────────────────────────────────────── */}
            <div className="flex gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Temps : <strong className="text-indigo-600 dark:text-indigo-300">{formatTime(elapsed)}</strong></span>
                <span>Coups : <strong>{moves}</strong></span>
                <span>Erreurs : <strong className={errors >= 3 ? "text-red-500" : ""}>{errors}</strong></span>
                <span className="ml-auto text-slate-400 capitalize">{difficulty}</span>
            </div>

            {/* ── Main zone ─────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4">

                {/* ── Idle ──────────────────────────────────────────────────── */}
                {phase === "idle" && (
                    <div className="text-center space-y-5 max-w-md">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Déplacez tous les disques du piquet <strong>Source</strong> vers le piquet <strong>Cible</strong>.<br />
                            Règles : un seul disque à la fois, jamais un grand disque sur un plus petit.
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
                            Facile : 3 disques (min. 7 coups) · Moyen : 4 disques (min. 15) · Difficile : 5 disques (min. 31)
                        </p>
                        <button
                            onClick={() => startGame(difficulty)}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {/* ── Playing ───────────────────────────────────────────────── */}
                {phase === "playing" && (
                    <div className="w-full flex flex-col items-center gap-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 min-h-[1.25rem]">
                            {selected !== null
                                ? "Disque sélectionné — cliquez sur le piquet de destination"
                                : "Cliquez sur un piquet pour sélectionner le disque du dessus"}
                        </p>

                        {/* Pegs */}
                        <div className="flex items-end justify-around w-full max-w-2xl px-6">
                            {pegs.map((peg, pegIdx) => {
                                const isSelected = selected === pegIdx;
                                const isFlash    = flashPeg === pegIdx;

                                const rodColor = isSelected
                                    ? "bg-indigo-400 dark:bg-indigo-500"
                                    : isFlash
                                    ? "bg-red-400 dark:bg-red-500"
                                    : "bg-slate-300 dark:bg-slate-600";

                                const baseColor = isSelected
                                    ? "bg-indigo-400 dark:bg-indigo-500"
                                    : isFlash
                                    ? "bg-red-400 dark:bg-red-500"
                                    : "bg-slate-400 dark:bg-slate-500";

                                // Reverse so smallest disk (top of peg) renders first (visually on top)
                                const displayDisks = [...peg].reverse();

                                return (
                                    <div
                                        key={pegIdx}
                                        className="flex flex-col items-center cursor-pointer"
                                        onClick={() => handlePegClick(pegIdx)}
                                    >
                                        {/* Label */}
                                        <span className={`text-xs font-medium mb-2 transition-colors ${
                                            isSelected
                                                ? "text-indigo-500 dark:text-indigo-300"
                                                : "text-slate-400 dark:text-slate-500"
                                        }`}>
                                            {PEG_LABELS[pegIdx]}
                                        </span>

                                        {/* Stack + rod */}
                                        <div
                                            className="relative flex flex-col items-center justify-end"
                                            style={{ height: `${(diskCount + 1) * 36}px`, width: "180px" }}
                                        >
                                            {/* Rod */}
                                            <div
                                                className={`absolute left-1/2 -translate-x-1/2 w-3 rounded-t-full transition-colors duration-200 ${rodColor}`}
                                                style={{ top: 0, bottom: 0, zIndex: 0 }}
                                            />

                                            {/* Disks: displayDisks[0] = smallest = top of peg */}
                                            {displayDisks.map((diskSize, i) => {
                                                const isTopOfPeg  = i === 0;
                                                const colorClass  = DISK_COLORS[(diskSize - 1) % DISK_COLORS.length];
                                                const widthPx     = 44 + diskSize * 24;

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`border-2 rounded-md h-8 transition-all duration-150 ${colorClass} ${
                                                            isSelected && isTopOfPeg
                                                                ? "ring-2 ring-indigo-400 ring-offset-1 -translate-y-2"
                                                                : ""
                                                        }`}
                                                        style={{ width: `${widthPx}px`, zIndex: 1, position: "relative" }}
                                                    />
                                                );
                                            })}
                                        </div>

                                        {/* Base */}
                                        <div className={`w-40 h-3 rounded-full transition-colors duration-200 ${baseColor}`} />
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={reset}
                            className="mt-2 px-4 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                        >
                            Réinitialiser
                        </button>
                    </div>
                )}

                {/* ── Finished ──────────────────────────────────────────────── */}
                {phase === "finished" && (
                    <div className="text-center space-y-4">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                            Bravo ! Puzzle résolu !
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                            Temps : <strong>{formatTime(elapsed)}</strong> · Coups : <strong>{moves}</strong> · Erreurs : <strong>{errors}</strong>
                        </p>
                        <p className="text-slate-500 dark:text-slate-500 text-sm">
                            Minimum théorique : <strong>{MIN_MOVES[difficulty]} coups</strong> · Niveau : <strong className="capitalize">{difficulty}</strong>
                        </p>
                        {moves === MIN_MOVES[difficulty] && (
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                                Solution optimale atteinte !
                            </p>
                        )}
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

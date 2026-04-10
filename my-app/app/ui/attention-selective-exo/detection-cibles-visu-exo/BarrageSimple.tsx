"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface GridItem {
    id: number;
    char: string;
    isTarget: boolean;
    clicked: boolean;
}

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    cols: number;
    rows: number;
    targetRatio: number;   // proportion of target items
    timeSec: number;
    cellPx: number;
    fontSize: string;
    empan: number;
    // character pools
    targetPool: string[];
    distractorBoost: string[]; // extra weight for visually similar distractors
}> = {
    facile: {
        cols: 8, rows: 10, targetRatio: 0.22, timeSec: 90,
        cellPx: 42, fontSize: "text-xl", empan: 3,
        targetPool: ["A", "E", "S", "T", "R", "N", "I"],
        distractorBoost: [],
    },
    moyen: {
        cols: 10, rows: 12, targetRatio: 0.18, timeSec: 60,
        cellPx: 34, fontSize: "text-base", empan: 5,
        targetPool: ["B", "D", "P", "F", "H", "M", "L"],
        distractorBoost: ["B", "D", "P", "R", "F", "E", "H"],
    },
    difficile: {
        cols: 12, rows: 14, targetRatio: 0.15, timeSec: 45,
        cellPx: 28, fontSize: "text-sm", empan: 7,
        targetPool: ["C", "G", "O", "Q", "U"],
        distractorBoost: ["C", "G", "O", "Q", "U", "D", "J"],
    },
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ─── Grid builder ─────────────────────────────────────────────────────────────

function buildGrid(diff: Difficulty): { grid: GridItem[]; target: string } {
    const cfg = DIFFICULTY_CONFIG[diff];
    const total = cfg.cols * cfg.rows;
    const targetCount = Math.round(total * cfg.targetRatio);

    // Pick one random target from the pool
    const target = cfg.targetPool[Math.floor(Math.random() * cfg.targetPool.length)];

    // Build distractor pool (all letters except target), with boosted similar chars
    const base = LETTERS.filter(l => l !== target);
    const pool: string[] = [...base];
    cfg.distractorBoost.filter(c => c !== target).forEach(c => pool.push(c, c)); // 3× weight

    // Generate items
    const items: Array<{ char: string; isTarget: boolean }> = [];
    for (let i = 0; i < targetCount; i++)   items.push({ char: target, isTarget: true });
    for (let i = targetCount; i < total; i++) {
        const char = pool[Math.floor(Math.random() * pool.length)];
        items.push({ char, isTarget: false });
    }

    // Shuffle
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    return {
        grid: items.map((it, id) => ({ ...it, id, clicked: false })),
        target,
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BarrageSimple({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [grid,       setGrid]       = useState<GridItem[]>([]);
    const [target,     setTarget]     = useState("");
    const [timeLeft,   setTimeLeft]   = useState(0);
    const [elapsed,    setElapsed]    = useState(0);
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAt = useRef<number>(0);

    const cfg = DIFFICULTY_CONFIG[difficulty];

    // ── Timer ──────────────────────────────────────────────────────────────────

    const stopTimer = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    useEffect(() => {
        if (phase !== "playing") return;
        stopTimer();
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { return 0; }
                return prev - 1;
            });
        }, 1000);
        return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // Auto-finish when timer hits 0
    useEffect(() => {
        if (phase === "playing" && timeLeft === 0) {
            stopTimer();
            finishGame();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, phase]);

    useEffect(() => () => stopTimer(), []);

    // ── Start ──────────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        const { grid: g, target: t } = buildGrid(diff);
        setGrid(g);
        setTarget(t);
        setTimeLeft(DIFFICULTY_CONFIG[diff].timeSec);
        setElapsed(0);
        startedAt.current = Date.now();
        setPhase("playing");
    }, []);

    // ── Click cell ─────────────────────────────────────────────────────────────

    const handleClick = useCallback((id: number) => {
        if (phase !== "playing") return;
        setGrid(prev => prev.map(item =>
            item.id === id && !item.clicked ? { ...item, clicked: true } : item
        ));
    }, [phase]);

    // ── Finish ─────────────────────────────────────────────────────────────────

    const finishGame = useCallback(() => {
        stopTimer();
        const secs = Math.round((Date.now() - startedAt.current) / 1000);
        setElapsed(secs);
        setPhase("finished");
    }, []);

    // Save score after finishing
    useEffect(() => {
        if (phase !== "finished" || grid.length === 0) return;
        const targets       = grid.filter(i => i.isTarget);
        const hits          = targets.filter(i => i.clicked).length;
        const falseAlarms   = grid.filter(i => !i.isTarget && i.clicked).length;
        const totalTargets  = targets.length;
        const raw           = ((hits - falseAlarms) / totalTargets) * 100;
        const score         = Math.max(0, Math.round(raw));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Barrage simple",
                domaine: "attention-selective",
                score,
                empan: DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const reset = () => {
        stopTimer();
        setPhase("idle");
        setGrid([]);
        setTarget("");
        setTimeLeft(0);
    };

    // ── Computed stats ─────────────────────────────────────────────────────────

    const totalTargets  = grid.filter(i => i.isTarget).length;
    const hits          = grid.filter(i => i.isTarget && i.clicked).length;
    const misses        = totalTargets - hits;
    const falseAlarms   = grid.filter(i => !i.isTarget && i.clicked).length;
    const score         = Math.max(0, Math.round(((hits - falseAlarms) / (totalTargets || 1)) * 100));
    const timerPct      = (timeLeft / cfg.timeSec) * 100;

    // ── Cell appearance ────────────────────────────────────────────────────────

    function cellClass(item: GridItem): string {
        const base = `flex items-center justify-center rounded font-mono font-bold select-none transition-colors duration-100 `;
        if (phase === "playing") {
            if (item.clicked) return base + "bg-primary-500 text-white cursor-default";
            return base + "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400 cursor-pointer active:scale-95";
        }
        // finished
        if (item.isTarget && item.clicked)  return base + "bg-green-500 text-white";
        if (item.isTarget && !item.clicked) return base + "bg-amber-400 text-white";
        if (!item.isTarget && item.clicked) return base + "bg-red-400 text-white";
        return base + "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400";
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Une grille de lettres s'affiche. Une <strong>lettre cible</strong> est indiquée en haut.<br />
                        Cliquez le plus vite possible sur <strong>toutes ses occurrences</strong> dans la grille
                        avant la fin du temps imparti.<br />
                        <span className="text-xs text-slate-400">Attention : ne cliquez pas les autres lettres !</span>
                    </p>
                    <div className="flex gap-3">
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
                        Facile&nbsp;: 80 cases, 90&nbsp;s · Moyen&nbsp;: 120 cases, 60&nbsp;s · Difficile&nbsp;: 168 cases, 45&nbsp;s
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Playing ── */}
            {phase === "playing" && (
                <>
                    {/* Sticky header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 gap-4">
                        {/* Target */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Cible :
                            </span>
                            <span className="text-3xl font-bold font-mono text-primary-600 dark:text-primary-400 w-10 text-center">
                                {target}
                            </span>
                        </div>

                        {/* Progress hint */}
                        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                            Trouvées&nbsp;: {hits}&nbsp;/ {totalTargets}
                        </span>

                        {/* Timer */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                        timerPct > 50 ? "bg-green-400"
                                        : timerPct > 20 ? "bg-amber-400"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${timerPct}%` }}
                                />
                            </div>
                            <span className={`text-lg font-bold tabular-nums w-10 text-right ${
                                timeLeft <= 10 ? "text-red-500" : "text-slate-700 dark:text-slate-200"
                            }`}>
                                {timeLeft}s
                            </span>
                        </div>

                        {/* Finish button */}
                        <button
                            onClick={finishGame}
                            className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150 shrink-0"
                        >
                            Terminer
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-2">
                        <div
                            className="grid gap-1 mx-auto"
                            style={{
                                gridTemplateColumns: `repeat(${cfg.cols}, ${cfg.cellPx}px)`,
                                width: `${cfg.cols * (cfg.cellPx + 4)}px`,
                            }}
                        >
                            {grid.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleClick(item.id)}
                                    disabled={item.clicked}
                                    className={`${cellClass(item)} ${cfg.fontSize}`}
                                    style={{ width: cfg.cellPx, height: cfg.cellPx }}
                                >
                                    {item.char}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Stats header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
                                Cible :
                            </span>
                            <span className="text-2xl font-bold font-mono text-primary-600 dark:text-primary-400">
                                {target}
                            </span>
                        </div>
                        <div className="flex gap-4 text-sm flex-wrap">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                                ✓ Trouvées : {hits}/{totalTargets}
                            </span>
                            <span className="text-amber-500 font-medium">
                                ◌ Manquées : {misses}
                            </span>
                            <span className="text-red-400 font-medium">
                                ✗ Erreurs : {falseAlarms}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                ⏱ {elapsed}s
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-lg font-bold ${
                                score >= 80 ? "text-green-600 dark:text-green-400"
                                : score >= 50 ? "text-amber-500"
                                : "text-red-500"
                            }`}>
                                {score}&nbsp;%
                            </span>
                            <button
                                onClick={reset}
                                className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150"
                            >
                                Recommencer
                            </button>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 px-4 py-1.5 text-xs border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-green-500 inline-block"/>&nbsp;Trouvée ✓
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-amber-400 inline-block"/>&nbsp;Manquée
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-red-400 inline-block"/>&nbsp;Erreur (non-cible)
                        </span>
                    </div>

                    {/* Result grid */}
                    <div className="flex-1 overflow-y-auto p-2">
                        <div
                            className="grid gap-1 mx-auto"
                            style={{
                                gridTemplateColumns: `repeat(${cfg.cols}, ${cfg.cellPx}px)`,
                                width: `${cfg.cols * (cfg.cellPx + 4)}px`,
                            }}
                        >
                            {grid.map(item => (
                                <div
                                    key={item.id}
                                    className={`${cellClass(item)} ${cfg.fontSize}`}
                                    style={{ width: cfg.cellPx, height: cfg.cellPx }}
                                >
                                    {item.char}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

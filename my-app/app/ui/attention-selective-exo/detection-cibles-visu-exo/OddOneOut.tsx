"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface Round {
    majority: string;
    intrus: string;
    items: string[];
    intrusIndex: number;
    clicked: number | null;
}

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    cols: number;
    totalRounds: number;
    timeSec: number;
    cellPx: number;
    fontSize: string;
    empan: number;
    pairs: Array<[string, string]>; // [majority, intrus]
}> = {
    facile: {
        cols: 4, totalRounds: 10, timeSec: 120,
        cellPx: 60, fontSize: "text-3xl", empan: 3,
        // Clearly different characters
        pairs: [
            ["O", "X"], ["A", "Z"], ["S", "W"], ["T", "Y"],
            ["M", "V"], ["H", "J"], ["B", "K"], ["R", "U"],
        ],
    },
    moyen: {
        cols: 5, totalRounds: 12, timeSec: 90,
        cellPx: 46, fontSize: "text-2xl", empan: 5,
        // Somewhat visually similar
        pairs: [
            ["b", "d"], ["p", "q"], ["E", "F"], ["C", "G"],
            ["V", "W"], ["6", "9"], ["8", "B"], ["0", "O"],
            ["2", "Z"], ["n", "u"],
        ],
    },
    difficile: {
        cols: 6, totalRounds: 15, timeSec: 60,
        cellPx: 38, fontSize: "text-xl", empan: 7,
        // Very similar — high visual discrimination required
        pairs: [
            ["C", "G"], ["O", "Q"], ["I", "J"], ["S", "5"],
            ["Z", "2"], ["U", "V"], ["P", "F"], ["6", "b"],
            ["D", "O"], ["8", "B"],
        ],
    },
};

const FEEDBACK_MS = 900;

// ─── Round builder ────────────────────────────────────────────────────────────

function buildAllRounds(diff: Difficulty): Round[] {
    const cfg = DIFFICULTY_CONFIG[diff];
    const total = cfg.cols * cfg.cols;

    // Shuffle pairs so they appear in random order
    const shuffled = [...cfg.pairs].sort(() => Math.random() - 0.5);

    return Array.from({ length: cfg.totalRounds }, (_, r) => {
        const [majority, intrus] = shuffled[r % shuffled.length];
        const intrusIndex = Math.floor(Math.random() * total);
        const items = Array<string>(total).fill(majority);
        items[intrusIndex] = intrus;
        return { majority, intrus, items, intrusIndex, clicked: null };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OddOneOut({ patientId }: { patientId: string | null }) {
    const [phase,        setPhase]        = useState<Phase>("idle");
    const [difficulty,   setDifficulty]   = useState<Difficulty>("facile");
    const [rounds,       setRounds]       = useState<Round[]>([]);
    const [currentRound, setCurrentRound] = useState(0);
    const [timeLeft,     setTimeLeft]     = useState(0);
    const [elapsed,      setElapsed]      = useState(0);

    const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startedAt   = useRef<number>(0);

    const cfg = DIFFICULTY_CONFIG[difficulty];

    // ── Helpers ────────────────────────────────────────────────────────────────

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }, []);

    const stopFeedback = useCallback(() => {
        if (feedbackRef.current) { clearTimeout(feedbackRef.current); feedbackRef.current = null; }
    }, []);

    // ── Finish ─────────────────────────────────────────────────────────────────

    const finishGame = useCallback(() => {
        if (timerRef.current)    { clearInterval(timerRef.current);  timerRef.current    = null; }
        if (feedbackRef.current) { clearTimeout(feedbackRef.current); feedbackRef.current = null; }
        setElapsed(Math.round((Date.now() - startedAt.current) / 1000));
        setPhase("finished");
    }, []);

    // ── Start ──────────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        stopTimer();
        stopFeedback();
        const r = buildAllRounds(diff);
        setRounds(r);
        setCurrentRound(0);
        setElapsed(0);

        const secs = DIFFICULTY_CONFIG[diff].timeSec;
        setTimeLeft(secs);
        startedAt.current = Date.now();

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        setPhase("playing");
    }, [stopTimer, stopFeedback]);

    // ── Auto-finish when time runs out ─────────────────────────────────────────

    useEffect(() => {
        if ((phase === "playing" || phase === "feedback") && timeLeft === 0) {
            finishGame();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft]);

    // ── Cleanup on unmount ─────────────────────────────────────────────────────

    useEffect(() => () => { stopTimer(); stopFeedback(); }, [stopTimer, stopFeedback]);

    // ── Click cell ─────────────────────────────────────────────────────────────

    const handleClick = useCallback((cellIndex: number) => {
        if (phase !== "playing") return;
        setRounds(prev => {
            const updated = [...prev];
            updated[currentRound] = { ...updated[currentRound], clicked: cellIndex };
            return updated;
        });
        setPhase("feedback");
    }, [phase, currentRound]);

    // ── Feedback → advance round ───────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "feedback") return;
        feedbackRef.current = setTimeout(() => {
            const next = currentRound + 1;
            if (next >= DIFFICULTY_CONFIG[difficulty].totalRounds) {
                finishGame();
            } else {
                setCurrentRound(next);
                setPhase("playing");
            }
        }, FEEDBACK_MS);
        return stopFeedback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // ── Save score ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || rounds.length === 0) return;
        const played  = rounds.filter(r => r.clicked !== null);
        const correct = played.filter(r => r.clicked === r.intrusIndex).length;
        const score   = Math.max(0, Math.round((correct / cfg.totalRounds) * 100));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Odd-one-out",
                domaine: "attention-selective",
                score,
                empan: cfg.empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const reset = useCallback(() => {
        stopTimer();
        stopFeedback();
        setPhase("idle");
        setRounds([]);
        setCurrentRound(0);
        setTimeLeft(0);
    }, [stopTimer, stopFeedback]);

    // ── Computed stats ─────────────────────────────────────────────────────────

    const played    = rounds.filter(r => r.clicked !== null);
    const correct   = played.filter(r => r.clicked === r.intrusIndex).length;
    const errors    = played.filter(r => r.clicked !== null && r.clicked !== r.intrusIndex).length;
    const score     = Math.max(0, Math.round((correct / (cfg.totalRounds || 1)) * 100));
    const timerPct  = (timeLeft / cfg.timeSec) * 100;

    const round     = rounds[currentRound];

    // ── Cell appearance ────────────────────────────────────────────────────────

    function cellClass(item: Round, cellIndex: number): string {
        const base = "flex items-center justify-center rounded font-mono font-bold select-none transition-colors duration-150 ";

        if (phase === "playing") {
            return base + "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400 cursor-pointer active:scale-95";
        }

        if (phase === "feedback" || phase === "finished") {
            const isIntrus  = cellIndex === item.intrusIndex;
            const isClicked = cellIndex === item.clicked;

            if (isIntrus && isClicked)   return base + "bg-green-500 text-white ring-2 ring-green-300";
            if (!isIntrus && isClicked)  return base + "bg-red-400 text-white ring-2 ring-red-300";
            if (isIntrus && !isClicked)  return base + "bg-amber-400 text-white";
            return base + "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-default";
        }

        return base + "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Une grille de caractères identiques s'affiche, <strong>sauf un intrus</strong>.<br />
                        Trouvez et cliquez l'<strong>élément différent</strong> le plus vite possible.<br />
                        <span className="text-xs text-slate-400">Plusieurs manches s'enchaînent automatiquement.</span>
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
                        Facile&nbsp;: grille 4×4, 10&nbsp;manches, 120&nbsp;s ·
                        Moyen&nbsp;: grille 5×5, 12&nbsp;manches, 90&nbsp;s ·
                        Difficile&nbsp;: grille 6×6, 15&nbsp;manches, 60&nbsp;s
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Playing / Feedback ── */}
            {(phase === "playing" || phase === "feedback") && round && (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 gap-4">
                        {/* Round counter */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Manche
                            </span>
                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                                {currentRound + 1}
                                <span className="text-slate-400 font-normal text-sm"> / {cfg.totalRounds}</span>
                            </span>
                        </div>

                        {/* Feedback badge */}
                        {phase === "feedback" && (
                            <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                                round.clicked === round.intrusIndex
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                                {round.clicked === round.intrusIndex ? "✓ Correct !" : "✗ Raté"}
                            </span>
                        )}

                        {/* Score running */}
                        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                            ✓ {correct}&nbsp;&nbsp;✗ {errors}
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
                    <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
                        <div
                            className="grid gap-1.5"
                            style={{ gridTemplateColumns: `repeat(${cfg.cols}, ${cfg.cellPx}px)` }}
                        >
                            {round.items.map((char, idx) => (
                                phase === "playing" ? (
                                    <button
                                        key={idx}
                                        onClick={() => handleClick(idx)}
                                        className={`${cellClass(round, idx)} ${cfg.fontSize}`}
                                        style={{ width: cfg.cellPx, height: cfg.cellPx }}
                                    >
                                        {char}
                                    </button>
                                ) : (
                                    <div
                                        key={idx}
                                        className={`${cellClass(round, idx)} ${cfg.fontSize}`}
                                        style={{ width: cfg.cellPx, height: cfg.cellPx }}
                                    >
                                        {char}
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    {/* Score display */}
                    <div className={`text-6xl font-bold tabular-nums ${
                        score >= 80 ? "text-green-500 dark:text-green-400"
                        : score >= 50 ? "text-amber-500"
                        : "text-red-500"
                    }`}>
                        {score}&nbsp;%
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 text-sm">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{correct}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Corrects</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-bold text-red-500">{errors}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Erreurs</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-bold text-slate-400 dark:text-slate-300">
                                {cfg.totalRounds - played.length}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Non joués</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-bold text-slate-600 dark:text-slate-300">{elapsed}s</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Temps</span>
                        </div>
                    </div>

                    {/* Round summary */}
                    <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                        {rounds.map((r, i) => (
                            <div
                                key={i}
                                title={`Manche ${i + 1} : ${r.majority} → intrus « ${r.intrus} »`}
                                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white ${
                                    r.clicked === null        ? "bg-slate-300 dark:bg-slate-600"
                                    : r.clicked === r.intrusIndex ? "bg-green-500"
                                    : "bg-red-400"
                                }`}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={reset}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Recommencer
                    </button>
                </div>
            )}

        </div>
    );
}

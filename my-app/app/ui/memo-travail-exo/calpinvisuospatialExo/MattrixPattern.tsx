"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "showing" | "recall" | "correct" | "wrong" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface Config {
    gridSize:  number;
    startSpan: number;
    maxErrors: number;
    showMs:    (span: number) => number;
}

const CONFIGS: Record<Difficulty, Config> = {
    facile:    { gridSize: 3, startSpan: 2, maxErrors: 3, showMs: (s) => Math.max(2000, s * 500) },
    moyen:     { gridSize: 4, startSpan: 3, maxErrors: 2, showMs: (s) => Math.max(2000, s * 450) },
    difficile: { gridSize: 5, startSpan: 4, maxErrors: 2, showMs: (s) => Math.max(2000, s * 400) },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generatePattern(total: number, count: number): number[] {
    const pool = Array.from({ length: total }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
}

// ─── Countdown ring ───────────────────────────────────────────────────────────

function CountdownRing({ ms, total }: { ms: number; total: number }) {
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef(Date.now());

    useEffect(() => {
        startRef.current = Date.now();
        const id = setInterval(() => {
            const e = Date.now() - startRef.current;
            setElapsed(Math.min(e, total));
        }, 50);
        return () => clearInterval(id);
    }, [total]);

    const pct = Math.min(elapsed / total, 1);
    const r = 18;
    const circ = 2 * Math.PI * r;
    const dash = circ * (1 - pct);

    return (
        <svg width={44} height={44} className="rotate-[-90deg]">
            <circle cx={22} cy={22} r={r} fill="none" stroke="#e2e8f0" strokeWidth={4} />
            <circle
                cx={22} cy={22} r={r} fill="none"
                stroke="#6366f1" strokeWidth={4}
                strokeDasharray={circ}
                strokeDashoffset={dash}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 50ms linear" }}
            />
        </svg>
    );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface GridProps {
    gridSize:  number;
    pattern:   number[];
    selected:  Set<number>;
    phase:     Phase;
    onToggle:  (idx: number) => void;
}

function Grid({ gridSize, pattern, selected, phase, onToggle }: GridProps) {
    const patternSet = new Set(pattern);

    const cellCls = (idx: number): string => {
        const inP = patternSet.has(idx);
        const isSel = selected.has(idx);

        const base = "aspect-square rounded-xl border-2 transition-all duration-150 outline-none ";

        if (phase === "showing") {
            return base + (inP
                ? "bg-indigo-400 dark:bg-indigo-500 border-indigo-500 shadow-lg scale-[1.04]"
                : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 cursor-default");
        }

        if (phase === "correct") {
            return base + (inP
                ? "bg-green-400 dark:bg-green-600 border-green-500 shadow-md scale-[1.04]"
                : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 cursor-default");
        }

        if (phase === "wrong") {
            if (inP && isSel)  return base + "bg-green-300 dark:bg-green-700 border-green-400";
            if (inP)           return base + "bg-green-200 dark:bg-green-800/60 border-green-400 ring-2 ring-green-400";
            if (isSel)         return base + "bg-red-300 dark:bg-red-700 border-red-400";
            return base + "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 cursor-default";
        }

        if (phase === "recall") {
            return base + (isSel
                ? "bg-indigo-400 dark:bg-indigo-500 border-indigo-500 shadow-md scale-[1.04] cursor-pointer"
                : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 hover:bg-indigo-50 dark:hover:bg-slate-600 hover:border-indigo-300 cursor-pointer");
        }

        return base + "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 cursor-default";
    };

    return (
        <div
            className="grid gap-2 w-full"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
            {Array.from({ length: gridSize * gridSize }, (_, i) => (
                <button
                    key={i}
                    onClick={() => onToggle(i)}
                    disabled={phase !== "recall"}
                    className={cellCls(i)}
                />
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MattrixPattern({ patientId }: { patientId: string | null }) {
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [span,       setSpan]       = useState(2);
    const [gridSize,   setGridSize]   = useState(3);
    const [showMs,     setShowMs]     = useState(2000);
    const [maxErrors,  setMaxErrors]  = useState(3);
    const [pattern,    setPattern]    = useState<number[]>([]);
    const [selected,   setSelected]   = useState<Set<number>>(new Set());
    const [errors,     setErrors]     = useState(0);
    const [score,      setScore]      = useState(0);
    const [totalRounds, setTotalRounds] = useState(0);
    const [correctRounds, setCorrectRounds] = useState(0);
    const [record,     setRecord]     = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

    const startRound = useCallback((s: number, gs: number, showDuration: number) => {
        const total = gs * gs;
        const p = generatePattern(total, Math.min(s, total - 1));
        setPattern(p);
        setSelected(new Set());
        setPhase("showing");
        clearTimer();
        timerRef.current = setTimeout(() => setPhase("recall"), showDuration);
    }, []);

    const startGame = (diff: Difficulty) => {
        clearTimer();
        const cfg = CONFIGS[diff];
        setDifficulty(diff);
        setGridSize(cfg.gridSize);
        setMaxErrors(cfg.maxErrors);
        setSpan(cfg.startSpan);
        setErrors(0);
        setScore(0);
        setTotalRounds(0);
        setCorrectRounds(0);
        setRecord(0);
        setSelected(new Set());
        const ms = cfg.showMs(cfg.startSpan);
        setShowMs(ms);
        startRound(cfg.startSpan, cfg.gridSize, ms);
    };

    const toggleCell = (idx: number) => {
        if (phase !== "recall") return;
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };

    const finishGame = useCallback((cr: number, tr: number, rec: number) => {
        setPhase("finished");
        if (patientId) {
            const finalScore = tr > 0 ? Math.round((cr / tr) * 100) : 0;
            saveScore({
                patientId,
                exercice: "Matrix Pattern",
                domaine: "memo-travail",
                score: finalScore,
                empan: rec,
            });
        }
    }, [patientId]);

    const validate = useCallback(() => {
        if (phase !== "recall") return;
        clearTimer();

        const patSet = new Set(pattern);
        const correct =
            pattern.every(c => selected.has(c)) &&
            selected.size === pattern.length &&
            [...selected].every(c => patSet.has(c));

        const newTotal = totalRounds + 1;
        setTotalRounds(newTotal);

        if (correct) {
            const newCR = correctRounds + 1;
            const newScore = score + span;
            const newSpan = span + 1;
            const newRec = Math.max(record, span);
            setCorrectRounds(newCR);
            setScore(newScore);
            setRecord(newRec);
            setPhase("correct");
            clearTimer();
            timerRef.current = setTimeout(() => {
                const ms = CONFIGS[difficulty].showMs(newSpan);
                setSpan(newSpan);
                setShowMs(ms);
                startRound(newSpan, gridSize, ms);
            }, 1200);
        } else {
            const newErrors = errors + 1;
            setErrors(newErrors);
            setPhase("wrong");
            clearTimer();
            timerRef.current = setTimeout(() => {
                if (newErrors >= maxErrors) {
                    finishGame(correctRounds, newTotal, record);
                } else {
                    const ms = CONFIGS[difficulty].showMs(span);
                    setShowMs(ms);
                    startRound(span, gridSize, ms);
                }
            }, 1800);
        }
    }, [phase, pattern, selected, span, score, errors, maxErrors, totalRounds, correctRounds, record, gridSize, difficulty, startRound, finishGame]);

    useEffect(() => () => clearTimer(), []);

    // ── Status message ──
    const statusMsg = (): { text: string; cls: string } => {
        switch (phase) {
            case "idle":     return { text: "Choisissez un niveau et démarrez.",            cls: "text-slate-500 dark:text-slate-400" };
            case "showing":  return { text: "Mémorisez le motif !",                          cls: "text-indigo-600 dark:text-indigo-300 font-semibold" };
            case "recall":   return { text: `Reproduisez le motif — ${selected.size} / ${pattern.length} cellule${pattern.length > 1 ? "s" : ""} sélectionnée${selected.size > 1 ? "s" : ""}`, cls: "text-sky-600 dark:text-sky-300" };
            case "correct":  return { text: "Correct ! Niveau suivant…",                    cls: "text-green-600 dark:text-green-400 font-semibold" };
            case "wrong":    return { text: "Erreur ! Les cases correctes sont en vert.",    cls: "text-red-600 dark:text-red-400 font-semibold" };
            case "finished": return { text: "Exercice terminé !",                            cls: "text-slate-700 dark:text-slate-200 font-bold" };
        }
    };
    const { text: statusText, cls: statusCls } = statusMsg();

    const finalScore = totalRounds > 0 ? Math.round((correctRounds / totalRounds) * 100) : 0;

    return (
        <div className="flex flex-col items-center h-full p-4 gap-3 select-none overflow-y-auto">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
                    <div className="space-y-2 max-w-xs">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Un motif de cellules est affiché brièvement dans une grille.<br />
                            Mémorisez-le, puis reproduisez-le en cliquant les bonnes cases.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Facile : grille 3×3 · Moyen : 4×4 · Difficile : 5×5
                        </p>
                    </div>

                    <div className="flex gap-3">
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

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Active game ── */}
            {phase !== "idle" && phase !== "finished" && (
                <>
                    {/* Stats */}
                    <div className="flex gap-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <span>Motif : <strong className="text-indigo-600 dark:text-indigo-300">{pattern.length}</strong></span>
                        <span>Score : <strong className="text-green-600 dark:text-green-400">{score}</strong></span>
                        <span>Erreurs : <strong className={errors > 0 ? "text-red-500" : "text-slate-700 dark:text-slate-300"}>{errors}</strong> / {maxErrors}</span>
                        <span>Record : <strong className="text-yellow-600 dark:text-yellow-400">{record}</strong></span>
                    </div>

                    {/* Status */}
                    <p className={`text-sm h-5 ${statusCls}`}>{statusText}</p>

                    {/* Grid + countdown */}
                    <div className="flex flex-col items-center gap-3 w-full max-w-xs flex-1 justify-center">
                        <Grid
                            gridSize={gridSize}
                            pattern={pattern}
                            selected={selected}
                            phase={phase}
                            onToggle={toggleCell}
                        />

                        {phase === "showing" && (
                            <div className="flex flex-col items-center gap-1">
                                <CountdownRing ms={showMs} total={showMs} />
                                <span className="text-xs text-slate-400 dark:text-slate-500">Mémorisez</span>
                            </div>
                        )}

                        {phase === "recall" && (
                            <button
                                onClick={validate}
                                disabled={selected.size === 0}
                                className="mt-1 px-8 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors duration-200"
                            >
                                Valider
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Score",         value: String(score),                color: "text-indigo-600 dark:text-indigo-400" },
                            { label: "Réussite",      value: `${finalScore} %`,            color: finalScore >= 80 ? "text-green-600 dark:text-green-400" : finalScore >= 60 ? "text-amber-500" : "text-red-500" },
                            { label: "Record motif",  value: `${record} cellule${record > 1 ? "s" : ""}`, color: "text-yellow-600 dark:text-yellow-400" },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                                <p className={`text-xl font-bold ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {correctRounds} bonne{correctRounds > 1 ? "s" : ""} réponse{correctRounds > 1 ? "s" : ""} sur {totalRounds} essai{totalRounds > 1 ? "s" : ""}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => startGame(difficulty)}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Rejouer
                        </button>
                        <button
                            onClick={() => setPhase("idle")}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Changer de niveau
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "fixation" | "stimulus" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type Direction  = "left" | "right";
type TrialType  = "congruent" | "incongruent" | "neutral";
type Feedback   = "correct" | "wrong" | "timeout" | null;

interface Trial {
    target:  Direction;
    flanker: Direction | "neutral";
    type:    TrialType;
}

interface TrialResult {
    trial:    Trial;
    response: Direction | null;
    correct:  boolean;
    rt:       number; // ms (0 si timeout)
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CFG: Record<Difficulty, {
    fixationMs:  number;
    timeLimitMs: number;
    feedbackMs:  number;
    empan:       number;
    mix: { congruent: number; neutral: number; incongruent: number };
}> = {
    facile: {
        fixationMs: 600, timeLimitMs: 3000, feedbackMs: 600, empan: 3,
        mix: { congruent: 12, neutral: 8, incongruent: 0 },
    },
    moyen: {
        fixationMs: 500, timeLimitMs: 2000, feedbackMs: 450, empan: 5,
        mix: { congruent: 12, neutral: 6, incongruent: 12 },
    },
    difficile: {
        fixationMs: 400, timeLimitMs: 1500, feedbackMs: 350, empan: 7,
        mix: { congruent: 10, neutral: 6, incongruent: 24 },
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTrials(diff: Difficulty): Trial[] {
    const { mix } = CFG[diff];
    const trials: Trial[] = [];

    for (let i = 0; i < mix.congruent; i++) {
        const target: Direction = Math.random() < 0.5 ? "left" : "right";
        trials.push({ target, flanker: target, type: "congruent" });
    }
    for (let i = 0; i < mix.neutral; i++) {
        const target: Direction = Math.random() < 0.5 ? "left" : "right";
        trials.push({ target, flanker: "neutral", type: "neutral" });
    }
    for (let i = 0; i < mix.incongruent; i++) {
        const target: Direction = Math.random() < 0.5 ? "left" : "right";
        trials.push({ target, flanker: target === "left" ? "right" : "left", type: "incongruent" });
    }

    for (let i = trials.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trials[i], trials[j]] = [trials[j], trials[i]];
    }
    return trials;
}

function arrowChar(dir: Direction | "neutral"): string {
    if (dir === "left")    return "←";
    if (dir === "right")   return "→";
    return "■";
}

const typeBadge: Record<TrialType, string> = {
    congruent:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    neutral:     "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    incongruent: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FlankerTask({ patientId }: { patientId: string | null }) {
    const [phase,       setPhase]       = useState<Phase>("idle");
    const [difficulty,  setDifficulty]  = useState<Difficulty>("facile");
    const [feedback,    setFeedback]    = useState<Feedback>(null);
    const [displayIdx,  setDisplayIdx]  = useState(0);
    const [renderRes,   setRenderRes]   = useState<TrialResult[]>([]);

    // Refs — évitent les closures périmées dans les timers
    const trialsRef      = useRef<Trial[]>([]);
    const currentIdxRef  = useRef(0);
    const resultsRef     = useRef<TrialResult[]>([]);
    const trialStartAt   = useRef(0);
    const fixTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stimTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fbTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cfg = CFG[difficulty];
    const totalTrials = cfg.mix.congruent + cfg.mix.neutral + cfg.mix.incongruent;

    // ── Cleanup ────────────────────────────────────────────────────────────────

    const clearAll = useCallback(() => {
        [fixTimerRef, stimTimerRef, fbTimerRef].forEach(r => {
            if (r.current) { clearTimeout(r.current); r.current = null; }
        });
    }, []);

    useEffect(() => () => clearAll(), [clearAll]);

    // ── Advance helper (lecture depuis refs) ───────────────────────────────────

    const advance = useCallback(() => {
        const next = currentIdxRef.current + 1;
        if (next >= trialsRef.current.length) {
            setPhase("finished");
        } else {
            currentIdxRef.current = next;
            setDisplayIdx(next);
            setFeedback(null);
            setPhase("fixation");
        }
    }, []);

    // ── Fixation → Stimulus ────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "fixation") return;
        fixTimerRef.current = setTimeout(() => {
            trialStartAt.current = Date.now();
            setPhase("stimulus");
        }, cfg.fixationMs);
        return () => { if (fixTimerRef.current) clearTimeout(fixTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // ── Stimulus timeout ───────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "stimulus" || feedback !== null) return;
        stimTimerRef.current = setTimeout(() => {
            const trial = trialsRef.current[currentIdxRef.current];
            const result: TrialResult = { trial, response: null, correct: false, rt: 0 };
            resultsRef.current = [...resultsRef.current, result];
            setRenderRes([...resultsRef.current]);
            setFeedback("timeout");
        }, cfg.timeLimitMs);
        return () => { if (stimTimerRef.current) clearTimeout(stimTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, feedback]);

    // ── Feedback → avance ──────────────────────────────────────────────────────

    useEffect(() => {
        if (feedback === null) return;
        fbTimerRef.current = setTimeout(advance, cfg.feedbackMs);
        return () => { if (fbTimerRef.current) clearTimeout(fbTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedback]);

    // ── Save score ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || resultsRef.current.length === 0) return;
        const results = resultsRef.current;
        const correct = results.filter(r => r.correct).length;
        const score   = Math.max(0, Math.round((correct / results.length) * 100));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Flanker task",
                domaine: "attention-selective",
                score,
                empan: cfg.empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        clearAll();
        const trials = buildTrials(diff);
        trialsRef.current    = trials;
        currentIdxRef.current = 0;
        resultsRef.current   = [];
        setRenderRes([]);
        setDisplayIdx(0);
        setFeedback(null);
        setPhase("fixation");
    }, [clearAll]);

    const handleResponse = useCallback((dir: Direction) => {
        if (phase !== "stimulus" || feedback !== null) return;
        if (stimTimerRef.current) { clearTimeout(stimTimerRef.current); stimTimerRef.current = null; }
        const rt     = Date.now() - trialStartAt.current;
        const trial  = trialsRef.current[currentIdxRef.current];
        const correct = dir === trial.target;
        const result: TrialResult = { trial, response: dir, correct, rt };
        resultsRef.current = [...resultsRef.current, result];
        setRenderRes([...resultsRef.current]);
        setFeedback(correct ? "correct" : "wrong");
    }, [phase, feedback]);

    const reset = useCallback(() => {
        clearAll();
        setPhase("idle");
        setFeedback(null);
        setDisplayIdx(0);
        setRenderRes([]);
        resultsRef.current    = [];
        trialsRef.current     = [];
        currentIdxRef.current = 0;
    }, [clearAll]);

    // ── Computed stats ─────────────────────────────────────────────────────────

    const currentTrial   = trialsRef.current[displayIdx];
    const doneCount      = renderRes.length;
    const correctRunning = renderRes.filter(r => r.correct).length;
    const progressPct    = (doneCount / totalTrials) * 100;

    // Stats par type (pour l'écran final)
    function statsByType(type: TrialType) {
        const sub = renderRes.filter(r => r.trial.type === type);
        if (sub.length === 0) return null;
        const ok  = sub.filter(r => r.correct).length;
        const avgRt = Math.round(sub.filter(r => r.rt > 0).reduce((s, r) => s + r.rt, 0) / (sub.filter(r => r.rt > 0).length || 1));
        return { total: sub.length, ok, pct: Math.round((ok / sub.length) * 100), avgRt };
    }

    const overallScore = renderRes.length > 0
        ? Math.round((renderRes.filter(r => r.correct).length / renderRes.length) * 100)
        : 0;

    // ── Button styles ──────────────────────────────────────────────────────────

    function btnCls(dir: Direction): string {
        const base = "flex-1 flex flex-col items-center justify-center gap-1 py-5 rounded-2xl border-2 text-2xl font-bold transition-colors duration-100 ";
        if (feedback === null) {
            return base + "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-800 dark:text-slate-100 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400 active:scale-95 cursor-pointer";
        }
        const responded = renderRes.at(-1)?.response === dir;
        const isCorrect = feedback === "correct";

        if (responded && isCorrect)  return base + "bg-green-100 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-300";
        if (responded && !isCorrect) return base + "bg-red-100 dark:bg-red-900/30 border-red-400 text-red-600 dark:text-red-400";
        // Reveal correct on wrong/timeout
        if (!responded && dir === currentTrial?.target && (feedback === "wrong" || feedback === "timeout"))
            return base + "bg-green-50 dark:bg-green-900/20 border-green-300 text-green-600 dark:text-green-400 opacity-80";
        return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 opacity-40 cursor-default";
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Cinq symboles s'affichent en ligne. Répondez le plus vite possible à la
                        <strong> direction de la flèche CENTRALE</strong> en ignorant les quatre autres.<br />
                        <span className="text-xs text-slate-400">
                            Exemple : <span className="font-mono">← ← <strong>→</strong> ← ←</span> → répondre <strong>Droite</strong>.
                            Le symbole <span className="font-mono">■</span> est neutre (à ignorer).
                        </span>
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
                        Facile&nbsp;: 20 essais, 3&nbsp;s · Moyen&nbsp;: 30 essais, 2&nbsp;s · Difficile&nbsp;: 40 essais, 1,5&nbsp;s
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Fixation ── */}
            {phase === "fixation" && (
                <>
                    {/* Progress header */}
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 shrink-0">{doneCount} / {totalTrials}</span>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">✓ {correctRunning}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-center flex-1">
                        <span className="text-5xl text-slate-300 dark:text-slate-600 font-thin select-none">+</span>
                    </div>
                </>
            )}

            {/* ── Stimulus ── */}
            {phase === "stimulus" && currentTrial && (
                <>
                    {/* Progress header */}
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 shrink-0">{doneCount + 1} / {totalTrials}</span>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">✓ {correctRunning}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 gap-10 p-4">

                        {/* Feedback badge */}
                        <div className="h-8 flex items-center">
                            {feedback === "correct" && (
                                <span className="px-4 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    ✓ Correct !
                                </span>
                            )}
                            {feedback === "wrong" && (
                                <span className="px-4 py-1 rounded-full text-sm font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                    ✗ Incorrect
                                </span>
                            )}
                            {feedback === "timeout" && (
                                <span className="px-4 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    ⏱ Trop lent
                                </span>
                            )}
                        </div>

                        {/* Flanker stimulus */}
                        <div className="flex items-center gap-3 select-none" aria-hidden>
                            {[0, 1, 2, 3, 4].map(i => {
                                const isCenter = i === 2;
                                const char = isCenter
                                    ? arrowChar(currentTrial.target)
                                    : arrowChar(currentTrial.flanker);
                                return (
                                    <span
                                        key={i}
                                        className={`font-mono font-bold leading-none transition-none ${
                                            isCenter
                                                ? "text-7xl text-slate-900 dark:text-slate-50"
                                                : "text-6xl text-slate-500 dark:text-slate-400"
                                        }`}
                                    >
                                        {char}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Response buttons */}
                        <div className="flex gap-4 w-full max-w-sm">
                            <button
                                onClick={() => handleResponse("left")}
                                disabled={feedback !== null}
                                className={btnCls("left")}
                            >
                                <span className="text-3xl">←</span>
                                <span className="text-sm font-semibold">Gauche</span>
                            </button>
                            <button
                                onClick={() => handleResponse("right")}
                                disabled={feedback !== null}
                                className={btnCls("right")}
                            >
                                <span className="text-3xl">→</span>
                                <span className="text-sm font-semibold">Droite</span>
                            </button>
                        </div>

                    </div>
                </>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">

                    {/* Score global */}
                    <div className={`text-6xl font-bold tabular-nums ${
                        overallScore >= 80 ? "text-green-500 dark:text-green-400"
                        : overallScore >= 50 ? "text-amber-500"
                        : "text-red-500"
                    }`}>
                        {overallScore}&nbsp;%
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {renderRes.filter(r => r.correct).length} corrects · {renderRes.filter(r => !r.correct).length} erreurs · {renderRes.length} essais
                    </p>

                    {/* Breakdown par type */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        {(["congruent", "neutral", "incongruent"] as TrialType[]).map(type => {
                            const s = statsByType(type);
                            if (!s) return null;
                            const label = type === "congruent" ? "Congruents" : type === "neutral" ? "Neutres" : "Incongruents";
                            return (
                                <div key={type} className={`px-4 py-3 rounded-xl border text-sm ${typeBadge[type]}`}>
                                    <p className="font-semibold capitalize">{label}</p>
                                    <p className="text-lg font-bold">{s.pct}&nbsp;%</p>
                                    <p className="text-xs opacity-75">{s.ok}/{s.total} · moy. {s.avgRt}&nbsp;ms</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Historique des essais */}
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                        {renderRes.map((r, i) => (
                            <div
                                key={i}
                                title={`Essai ${i + 1} · ${r.trial.type} · ${r.correct ? "✓" : "✗"} · ${r.rt > 0 ? r.rt + "ms" : "timeout"}`}
                                className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold text-white ${
                                    r.correct
                                        ? r.trial.type === "incongruent" ? "bg-emerald-500" : "bg-green-400"
                                        : "bg-red-400"
                                }`}
                            >
                                {r.correct ? "✓" : "✗"}
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

"use client";

import { useState, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type ArrowDir   = "left" | "right";
type Position   = "left" | "right";
type Stimulus   = "left-arrow" | "right-arrow" | "neutral";
type TrialType  = "congruent" | "incongruent" | "neutral";
type Response   = "left" | "right";
type TrialPhase = "showing" | "feedback";

interface Trial {
    stimulus: Stimulus;
    position: Position;
    trialType: TrialType;
    correctResponse: Response;  // always equals position
}

interface TrialResult {
    trialType: TrialType;
    correct: boolean;
    timedOut: boolean;
    rtMs: number;
    chosen: Response | null;
    answer: Response;
}

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    totalTrials:      number;
    trialTimeMs:      number;
    congruentRatio:   number;
    incongruentRatio: number;
    empan:            number;
}> = {
    facile:    { totalTrials: 18, trialTimeMs: 4000, congruentRatio: 0.33, incongruentRatio: 0.50, empan: 3 },
    moyen:     { totalTrials: 24, trialTimeMs: 3000, congruentRatio: 0.25, incongruentRatio: 0.58, empan: 5 },
    difficile: { totalTrials: 30, trialTimeMs: 2000, congruentRatio: 0.17, incongruentRatio: 0.66, empan: 7 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildTrials(diff: Difficulty): Trial[] {
    const cfg = DIFFICULTY_CONFIG[diff];
    const n   = cfg.totalTrials;
    const nCong    = Math.round(n * cfg.congruentRatio);
    const nIncong  = Math.round(n * cfg.incongruentRatio);
    const nNeutral = n - nCong - nIncong;

    const trials: Trial[] = [];
    const positions: Position[] = ["left", "right"];

    // Congruent: arrow direction === position
    for (let i = 0; i < nCong; i++) {
        const pos = rand(positions);
        const stim: Stimulus = pos === "left" ? "left-arrow" : "right-arrow";
        trials.push({ stimulus: stim, position: pos, trialType: "congruent", correctResponse: pos });
    }

    // Incongruent: arrow direction ≠ position
    for (let i = 0; i < nIncong; i++) {
        const pos = rand(positions);
        const stim: Stimulus = pos === "left" ? "right-arrow" : "left-arrow";
        trials.push({ stimulus: stim, position: pos, trialType: "incongruent", correctResponse: pos });
    }

    // Neutral: non-directional dot at left or right
    for (let i = 0; i < nNeutral; i++) {
        const pos = rand(positions);
        trials.push({ stimulus: "neutral", position: pos, trialType: "neutral", correctResponse: pos });
    }

    return shuffle(trials);
}

// ─── Arrow SVG ────────────────────────────────────────────────────────────────

function StimulusIcon({ stimulus, size = 72 }: { stimulus: Stimulus; size?: number }) {
    if (stimulus === "neutral") {
        return (
            <svg width={size} height={size} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="36" fill="#94a3b8" />
            </svg>
        );
    }
    const dir: ArrowDir = stimulus === "left-arrow" ? "left" : "right";
    // Arrow: shaft + arrowhead
    const shaft = dir === "right"
        ? "M12,50 H78"
        : "M88,50 H22";
    const head = dir === "right"
        ? "M58,28 L85,50 L58,72"
        : "M42,28 L15,50 L42,72";
    return (
        <svg width={size} height={size} viewBox="0 0 100 100">
            <path d={shaft} stroke="white" strokeWidth="13" strokeLinecap="round" fill="none" />
            <path d={head}  stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StroopSpatial({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [trials,     setTrials]     = useState<Trial[]>([]);
    const [trialIdx,   setTrialIdx]   = useState(0);
    const [trialPhase, setTrialPhase] = useState<TrialPhase>("showing");
    const [results,    setResults]    = useState<TrialResult[]>([]);
    const [chosen,     setChosen]     = useState<Response | null>(null);
    const [timeLeftMs, setTimeLeftMs] = useState(0);

    const trialsRef         = useRef<Trial[]>([]);
    const trialIdxRef       = useRef(0);
    const trialStartRef     = useRef(0);
    const tickRef           = useRef<ReturnType<typeof setInterval> | null>(null);
    const feedbackRef       = useRef<ReturnType<typeof setTimeout>  | null>(null);
    const timedOutFiredRef  = useRef(false);

    trialsRef.current   = trials;
    trialIdxRef.current = trialIdx;

    const cfg = DIFFICULTY_CONFIG[difficulty];

    // ── Clear helpers ──────────────────────────────────────────────────────────

    const clearTick = () => {
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
    const clearFeedback = () => {
        if (feedbackRef.current) { clearTimeout(feedbackRef.current); feedbackRef.current = null; }
    };

    useEffect(() => () => { clearTick(); clearFeedback(); }, []);

    // ── Per-trial countdown ────────────────────────────────────────────────────

    const startTrialTimer = (timeMs: number) => {
        clearTick();
        trialStartRef.current    = Date.now();
        timedOutFiredRef.current = false;
        setTimeLeftMs(timeMs);
        tickRef.current = setInterval(() => {
            const remaining = Math.max(0, timeMs - (Date.now() - trialStartRef.current));
            setTimeLeftMs(remaining);
            if (remaining <= 0) clearTick();
        }, 80);
    };

    // Start timer on each new trial
    useEffect(() => {
        if (phase !== "playing" || trialIdx >= trials.length) return;
        startTrialTimer(cfg.trialTimeMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, trialIdx]);

    // Detect end of trials
    useEffect(() => {
        if (phase !== "playing" || trials.length === 0) return;
        if (trialIdx >= trials.length) {
            clearTick(); clearFeedback();
            setPhase("finished");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trialIdx, trials.length, phase]);

    // ── Record result ──────────────────────────────────────────────────────────

    const recordResult = (pick: Response | null, timedOut: boolean) => {
        const idx   = trialIdxRef.current;
        const trial = trialsRef.current[idx];
        if (!trial) return;

        clearTick();
        const rt      = Date.now() - trialStartRef.current;
        const correct = !timedOut && pick === trial.correctResponse;

        setChosen(pick);
        setResults(prev => [...prev, {
            trialType: trial.trialType,
            correct,
            timedOut,
            rtMs: rt,
            chosen: pick,
            answer: trial.correctResponse,
        }]);
        setTrialPhase("feedback");

        feedbackRef.current = setTimeout(() => {
            setChosen(null);
            setTrialPhase("showing");
            setTrialIdx(prev => prev + 1);
        }, 700);
    };

    // Auto-timeout
    useEffect(() => {
        if (phase !== "playing" || trialPhase !== "showing" || timeLeftMs > 0) return;
        if (timedOutFiredRef.current) return;
        timedOutFiredRef.current = true;
        recordResult(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeftMs, phase, trialPhase]);

    // Keyboard: arrow keys
    useEffect(() => {
        if (phase !== "playing" || trialPhase !== "showing") return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft")  recordResult("left",  false);
            if (e.key === "ArrowRight") recordResult("right", false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, trialPhase, trialIdx]);

    // ── Save score ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || results.length === 0) return;
        const correct = results.filter(r => r.correct).length;
        const score   = Math.round((correct / results.length) * 100);
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Stroop spatial",
                domaine:  "attention-selective",
                score,
                empan:    DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // ── Start / Reset ──────────────────────────────────────────────────────────

    const startGame = (diff: Difficulty) => {
        clearTick(); clearFeedback();
        const t = buildTrials(diff);
        setTrials(t);
        setTrialIdx(0);
        setResults([]);
        setChosen(null);
        setTrialPhase("showing");
        setPhase("playing");
    };

    const reset = () => {
        clearTick(); clearFeedback();
        setPhase("idle");
        setTrials([]);
        setTrialIdx(0);
        setResults([]);
        setChosen(null);
        setTimeLeftMs(0);
    };

    // ── Stats ──────────────────────────────────────────────────────────────────

    const byType  = (t: TrialType) => results.filter(r => r.trialType === t);
    const accPct  = (rs: TrialResult[]) =>
        rs.length === 0 ? null : Math.round((rs.filter(r => r.correct).length / rs.length) * 100);
    const meanRT  = (rs: TrialResult[]) => {
        const valid = rs.filter(r => r.correct && !r.timedOut);
        return valid.length === 0 ? null
            : Math.round(valid.reduce((s, r) => s + r.rtMs, 0) / valid.length);
    };

    const congResults    = byType("congruent");
    const incongResults  = byType("incongruent");
    const neutralResults = byType("neutral");
    const totalCorrect   = results.filter(r => r.correct).length;
    const totalScore     = results.length ? Math.round((totalCorrect / results.length) * 100) : 0;

    const rtCong    = meanRT(congResults);
    const rtIncong  = meanRT(incongResults);
    const stroopEff = rtCong !== null && rtIncong !== null ? rtIncong - rtCong : null;

    const currentTrial = trials[trialIdx] ?? null;
    const timerPct     = cfg.trialTimeMs > 0 ? (timeLeftMs / cfg.trialTimeMs) * 100 : 0;

    // Determine feedback classes for the two buttons
    function btnFeedbackClass(side: Response): string {
        if (trialPhase !== "feedback" || !currentTrial) return "";
        const correct = currentTrial.correctResponse;
        if (side === chosen && side === correct)  return "ring-4 ring-green-400 scale-105";
        if (side === chosen && side !== correct)  return "ring-4 ring-red-400";
        if (side === correct && chosen !== correct) return "ring-4 ring-green-400"; // reveal
        return "";
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Une flèche apparaît à <strong>gauche</strong> ou à <strong>droite</strong> de l'écran.<br />
                        Cliquez (ou appuyez sur ← /) sur <strong>la position de la flèche</strong>,
                        pas sur la direction vers laquelle elle pointe.<br />
                        <span className="text-xs text-slate-400">
                            Exemple&nbsp;: une flèche → à gauche → cliquez sur <strong>Gauche</strong>.
                        </span>
                    </p>

                    {/* Live demo */}
                    <div className="relative bg-slate-800 rounded-xl w-72 h-20 overflow-hidden select-none">
                        {/* Arrow on the left */}
                        <div className="absolute left-[18%] top-1/2 -translate-y-1/2">
                            <StimulusIcon stimulus="right-arrow" size={56} />
                        </div>
                        {/* Annotation */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 text-right leading-tight">
                            → pointe à droite<br />
                            <span className="text-green-400 font-semibold">mais est à gauche</span>
                        </div>
                    </div>

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
                        Facile&nbsp;: 18 essais, 4&nbsp;s · Moyen&nbsp;: 24 essais, 3&nbsp;s · Difficile&nbsp;: 30 essais, 2&nbsp;s
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Touche clavier&nbsp;: ← (gauche) · → (droite)
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
            {phase === "playing" && currentTrial && (
                <div className="flex flex-col items-center justify-between flex-1 p-4 gap-3">

                    {/* Top bar */}
                    <div className="flex items-center justify-between w-full max-w-lg">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tabular-nums">
                            {Math.min(trialIdx + 1, trials.length)}&nbsp;/&nbsp;{trials.length}
                        </span>
                        {/* Progress dots */}
                        <div className="flex gap-1">
                            {trials.slice(0, Math.min(trialIdx, trials.length)).map((_, i) => {
                                const r = results[i];
                                return (
                                    <div key={i} className={`w-2 h-2 rounded-full ${
                                        !r              ? "bg-slate-300 dark:bg-slate-600"
                                        : r.timedOut    ? "bg-amber-400"
                                        : r.correct     ? "bg-green-400"
                                        : "bg-red-400"
                                    }`} />
                                );
                            })}
                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            ✓&nbsp;{totalCorrect}
                        </span>
                    </div>

                    {/* Stimulus display */}
                    <div className="relative bg-slate-800 dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg flex-1 overflow-hidden">

                        {/* Position the stimulus */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 transition-none"
                            style={
                                currentTrial.position === "left"
                                    ? { left: "18%" }
                                    : { right: "18%" }
                            }
                        >
                            <StimulusIcon stimulus={currentTrial.stimulus} size={72} />
                        </div>

                        {/* Subtle position hint lines */}
                        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700/50" />
                    </div>

                    {/* Timer bar */}
                    <div className="w-full max-w-lg h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${
                                timerPct > 50 ? "bg-green-400"
                                : timerPct > 25 ? "bg-amber-400"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${timerPct}%`, transition: "width 80ms linear" }}
                        />
                    </div>

                    {/* Response buttons */}
                    <div className="flex gap-4 w-full max-w-lg">
                        {(["left", "right"] as Response[]).map(side => {
                            const disabled = trialPhase === "feedback";
                            const fb       = btnFeedbackClass(side);
                            return (
                                <button
                                    key={side}
                                    disabled={disabled}
                                    onClick={() => !disabled && recordResult(side, false)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg border-2 transition-all duration-150 select-none
                                        ${disabled ? "cursor-default" : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"}
                                        ${fb || "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"}
                                    `}
                                >
                                    {side === "left"  && <span className="text-2xl">←</span>}
                                    <span className="text-base">{side === "left" ? "Gauche" : "Droite"}</span>
                                    {side === "right" && <span className="text-2xl">→</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback text */}
                    {trialPhase === "feedback" && (
                        <p className={`text-sm font-bold ${
                            chosen === currentTrial.correctResponse ? "text-green-500" : "text-red-400"
                        }`}>
                            {chosen === null
                                ? "⏱ Temps dépassé"
                                : chosen === currentTrial.correctResponse
                                ? "✓ Correct"
                                : `✗ La flèche était à ${currentTrial.correctResponse === "left" ? "gauche" : "droite"}`
                            }
                        </p>
                    )}

                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">

                    {/* Overall score */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-5 py-3 border border-slate-200 dark:border-slate-700">
                        <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Score global</p>
                            <p className="text-xs text-slate-400">{totalCorrect}&nbsp;/&nbsp;{results.length} correctes</p>
                        </div>
                        <span className={`text-3xl font-extrabold ${
                            totalScore >= 80 ? "text-green-600 dark:text-green-400"
                            : totalScore >= 50 ? "text-amber-500"
                            : "text-red-500"
                        }`}>
                            {totalScore}&nbsp;%
                        </span>
                        <button
                            onClick={reset}
                            className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150"
                        >
                            Recommencer
                        </button>
                    </div>

                    {/* Stats by type */}
                    <div className="grid grid-cols-3 gap-3">
                        {([
                            { label: "Congruent",   rs: congResults,    fg: "text-green-700 dark:text-green-300",  bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
                            { label: "Incongruent", rs: incongResults,  fg: "text-red-700 dark:text-red-300",      bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
                            { label: "Neutre",      rs: neutralResults, fg: "text-slate-600 dark:text-slate-300",  bg: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
                        ] as const).map(({ label, rs, fg, bg }) => (
                            <div key={label} className={`rounded-xl border px-3 py-2 ${bg}`}>
                                <p className={`text-xs font-semibold ${fg} mb-1`}>{label}</p>
                                <p className="text-slate-700 dark:text-slate-200 font-bold text-xl">
                                    {accPct(rs) !== null ? `${accPct(rs)}\u00a0%` : "—"}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {rs.filter(r => r.correct).length}&nbsp;/&nbsp;{rs.length}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    TR moy.&nbsp;:&nbsp;{meanRT(rs) !== null ? `${meanRT(rs)}\u00a0ms` : "—"}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Stroop spatial effect */}
                    {stroopEff !== null && (
                        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-3 text-sm">
                            <span className="font-semibold text-violet-700 dark:text-violet-300">
                                Effet Stroop spatial&nbsp;:&nbsp;
                            </span>
                            <span className="text-slate-700 dark:text-slate-200">
                                TR incongruent − TR congruent&nbsp;=&nbsp;
                                <strong className={stroopEff > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                                    {stroopEff > 0 ? "+" : ""}{stroopEff}&nbsp;ms
                                </strong>
                            </span>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {stroopEff > 250
                                    ? "Interférence spatiale forte — difficulté à ignorer la direction de la flèche."
                                    : stroopEff > 80
                                    ? "Interférence modérée — effet Stroop spatial présent."
                                    : stroopEff > 0
                                    ? "Interférence légère — bonne inhibition spatiale."
                                    : "Pas d'interférence spatiale détectée."
                                }
                            </p>
                        </div>
                    )}

                    {/* Trial-by-trial log */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Détail des essais
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto">
                            {results.map((r, i) => {
                                const t = trials[i];
                                const dirSymbol = t.stimulus === "left-arrow" ? "←" : t.stimulus === "right-arrow" ? "→" : "●";
                                const posLabel  = t.position === "left" ? "gauche" : "droite";
                                return (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                                        <span className="text-slate-400 w-5 shrink-0 tabular-nums">{i + 1}.</span>

                                        {/* Stimulus */}
                                        <span className="font-bold text-base w-5 shrink-0 text-white bg-slate-700 rounded px-1 text-center">
                                            {dirSymbol}
                                        </span>

                                        {/* Position */}
                                        <span className="text-slate-500 dark:text-slate-400 w-14 shrink-0">
                                            @ {posLabel}
                                        </span>

                                        {/* Type */}
                                        <span className={`w-20 shrink-0 ${
                                            r.trialType === "congruent"   ? "text-green-600 dark:text-green-400"
                                            : r.trialType === "incongruent" ? "text-red-500 dark:text-red-400"
                                            : "text-slate-500"
                                        }`}>
                                            {r.trialType === "congruent" ? "Congruent"
                                            : r.trialType === "incongruent" ? "Incongruent"
                                            : "Neutre"}
                                        </span>

                                        {/* Result */}
                                        <span className={`font-bold w-4 shrink-0 ${r.correct ? "text-green-500" : "text-red-400"}`}>
                                            {r.timedOut ? "⏱" : r.correct ? "✓" : "✗"}
                                        </span>

                                        {/* RT */}
                                        <span className="text-slate-400 shrink-0 tabular-nums">
                                            {r.timedOut ? "Temps dépassé" : `${r.rtMs}\u00a0ms`}
                                        </span>

                                        {/* Error detail */}
                                        {!r.correct && !r.timedOut && r.chosen && (
                                            <span className="text-slate-400">
                                                — attendu&nbsp;: {r.answer === "left" ? "← Gauche" : "Droite →"}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}

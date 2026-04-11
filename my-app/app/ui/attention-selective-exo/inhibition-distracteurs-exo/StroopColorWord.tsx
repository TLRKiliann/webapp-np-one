"use client";

import { useState, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type ColorKey   = "rouge" | "bleu" | "vert" | "jaune" | "violet" | "orange";
type TrialType  = "congruent" | "incongruent" | "neutral";
type TrialPhase = "showing" | "feedback";

interface Trial {
    word: string;
    inkColor: ColorKey;
    trialType: TrialType;
    options: ColorKey[];   // 4 choices, shuffled
}

interface TrialResult {
    trialType: TrialType;
    correct: boolean;
    timedOut: boolean;
    rtMs: number;
    chosen: ColorKey | null;
    answer: ColorKey;
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const ALL_COLORS: ColorKey[] = ["rouge", "bleu", "vert", "jaune", "violet", "orange"];

// Bright variants for display on dark background
const COLOR_DISPLAY: Record<ColorKey, string> = {
    rouge:  "#f87171",
    bleu:   "#60a5fa",
    vert:   "#4ade80",
    jaune:  "#fde047",
    violet: "#c084fc",
    orange: "#fb923c",
};

// Saturated variants for the response swatches
const COLOR_SWATCH: Record<ColorKey, string> = {
    rouge:  "#ef4444",
    bleu:   "#3b82f6",
    vert:   "#22c55e",
    jaune:  "#ca8a04",   // darker yellow for visibility
    violet: "#a855f7",
    orange: "#f97316",
};

const COLOR_WORD: Record<ColorKey, string> = {
    rouge: "ROUGE", bleu: "BLEU", vert: "VERT",
    jaune: "JAUNE", violet: "VIOLET", orange: "ORANGE",
};

const COLOR_LABEL: Record<ColorKey, string> = {
    rouge: "Rouge", bleu: "Bleu", vert: "Vert",
    jaune: "Jaune", violet: "Violet", orange: "Orange",
};

const NEUTRAL_WORDS = ["MAISON", "TABLE", "ARBRE", "CHIEN", "LIVRE", "SOLEIL", "CHAISE"];

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    totalTrials:        number;
    trialTimeMs:        number;
    congruentRatio:     number;
    incongruentRatio:   number;
    // neutral = 1 − congruent − incongruent
    empan:              number;
}> = {
    facile:    { totalTrials: 18, trialTimeMs: 5000, congruentRatio: 0.33, incongruentRatio: 0.50, empan: 3 },
    moyen:     { totalTrials: 24, trialTimeMs: 3500, congruentRatio: 0.25, incongruentRatio: 0.58, empan: 5 },
    difficile: { totalTrials: 30, trialTimeMs: 2500, congruentRatio: 0.17, incongruentRatio: 0.66, empan: 7 },
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

function buildOptions(correct: ColorKey): ColorKey[] {
    const others = shuffle(ALL_COLORS.filter(c => c !== correct)).slice(0, 3);
    return shuffle([correct, ...others]);
}

function buildTrials(diff: Difficulty): Trial[] {
    const cfg = DIFFICULTY_CONFIG[diff];
    const n   = cfg.totalTrials;
    const nCong   = Math.round(n * cfg.congruentRatio);
    const nIncong = Math.round(n * cfg.incongruentRatio);
    const nNeutral = n - nCong - nIncong;

    const trials: Trial[] = [];

    // Congruent: word === inkColor
    for (let i = 0; i < nCong; i++) {
        const c = rand(ALL_COLORS);
        trials.push({ word: COLOR_WORD[c], inkColor: c, trialType: "congruent", options: buildOptions(c) });
    }

    // Incongruent: word ≠ inkColor
    for (let i = 0; i < nIncong; i++) {
        const ink   = rand(ALL_COLORS);
        const other = shuffle(ALL_COLORS.filter(c => c !== ink));
        trials.push({ word: COLOR_WORD[other[0]], inkColor: ink, trialType: "incongruent", options: buildOptions(ink) });
    }

    // Neutral: non-colour word
    for (let i = 0; i < nNeutral; i++) {
        const ink = rand(ALL_COLORS);
        trials.push({ word: rand(NEUTRAL_WORDS), inkColor: ink, trialType: "neutral", options: buildOptions(ink) });
    }

    return shuffle(trials);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StroopColorWord({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [trials,     setTrials]     = useState<Trial[]>([]);
    const [trialIdx,   setTrialIdx]   = useState(0);
    const [trialPhase, setTrialPhase] = useState<TrialPhase>("showing");
    const [results,    setResults]    = useState<TrialResult[]>([]);
    const [chosen,     setChosen]     = useState<ColorKey | null>(null);
    const [timeLeftMs, setTimeLeftMs] = useState(0);

    // Stable refs — avoid stale closures in async callbacks
    const trialsRef        = useRef<Trial[]>([]);
    const trialIdxRef      = useRef(0);
    const trialStartRef    = useRef(0);
    const tickRef          = useRef<ReturnType<typeof setInterval> | null>(null);
    const feedbackRef      = useRef<ReturnType<typeof setTimeout>  | null>(null);
    const timedOutFiredRef = useRef(false);
    const resultsRef       = useRef<TrialResult[]>([]);

    // Keep refs in sync
    trialsRef.current   = trials;
    trialIdxRef.current = trialIdx;
    resultsRef.current  = results;

    const cfg = DIFFICULTY_CONFIG[difficulty];

    // ── Clear helpers ──────────────────────────────────────────────────────────

    const clearTick = () => {
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
    const clearFeedback = () => {
        if (feedbackRef.current) { clearTimeout(feedbackRef.current); feedbackRef.current = null; }
    };

    useEffect(() => () => { clearTick(); clearFeedback(); }, []);

    // ── Per-trial countdown (wall-clock based) ─────────────────────────────────

    const startTrialTimer = (timeMs: number) => {
        clearTick();
        trialStartRef.current   = Date.now();
        timedOutFiredRef.current = false;
        setTimeLeftMs(timeMs);
        tickRef.current = setInterval(() => {
            const remaining = Math.max(0, timeMs - (Date.now() - trialStartRef.current));
            setTimeLeftMs(remaining);
            if (remaining <= 0) clearTick();
        }, 80);
    };

    // Auto-start timer when a new trial begins
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

    // ── Core: record a response ────────────────────────────────────────────────
    // Uses refs so it is safe to call from timer effects without stale closures.

    const recordResult = (pick: ColorKey | null, timedOut: boolean) => {
        const idx   = trialIdxRef.current;
        const trial = trialsRef.current[idx];
        if (!trial) return;

        clearTick();
        const rt      = Date.now() - trialStartRef.current;
        const correct = !timedOut && pick === trial.inkColor;

        const result: TrialResult = {
            trialType: trial.trialType,
            correct,
            timedOut,
            rtMs: rt,
            chosen: pick,
            answer: trial.inkColor,
        };

        setChosen(pick);
        setResults(prev => [...prev, result]);
        setTrialPhase("feedback");

        feedbackRef.current = setTimeout(() => {
            setChosen(null);
            setTrialPhase("showing");
            setTrialIdx(prev => prev + 1);
        }, 700);
    };

    // Timeout: fire recordResult when countdown hits zero
    useEffect(() => {
        if (phase !== "playing" || trialPhase !== "showing") return;
        if (timeLeftMs > 0) return;
        if (timedOutFiredRef.current) return;
        timedOutFiredRef.current = true;
        recordResult(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeftMs, phase, trialPhase]);

    // ── Save score ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || results.length === 0) return;
        const correct = results.filter(r => r.correct).length;
        const score   = Math.round((correct / results.length) * 100);
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Stroop couleur-mot",
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

    // ── Stats helpers ──────────────────────────────────────────────────────────

    const byType  = (t: TrialType) => results.filter(r => r.trialType === t);
    const accPct  = (rs: TrialResult[]) =>
        rs.length === 0 ? null : Math.round((rs.filter(r => r.correct).length / rs.length) * 100);
    const meanRT  = (rs: TrialResult[]) => {
        const valid = rs.filter(r => r.correct && !r.timedOut);
        return valid.length === 0 ? null : Math.round(valid.reduce((s, r) => s + r.rtMs, 0) / valid.length);
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

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Un mot de couleur s'affiche écrit dans une encre colorée.<br />
                        <strong>Cliquez sur la couleur de l'encre</strong>, pas sur la signification du mot.<br />
                        <span className="text-xs text-slate-400">
                            Exemple&nbsp;: le mot <span style={{ color: "#60a5fa" }} className="font-bold">ROUGE</span> écrit
                            en bleu → cliquez sur le bleu.
                        </span>
                    </p>

                    {/* Live demo */}
                    <div className="flex items-center gap-4 bg-slate-800 rounded-xl px-6 py-3 select-none">
                        <span style={{ color: "#60a5fa" }} className="text-3xl font-extrabold tracking-widest">
                            ROUGE
                        </span>
                        <span className="text-slate-400 text-sm">→ répondre</span>
                        <div className="w-8 h-8 rounded-lg ring-2 ring-green-400" style={{ backgroundColor: "#3b82f6" }} />
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
                        Facile&nbsp;: 18 essais, 5&nbsp;s/essai&nbsp;·
                        Moyen&nbsp;: 24 essais, 3,5&nbsp;s&nbsp;·
                        Difficile&nbsp;: 30 essais, 2,5&nbsp;s
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
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${
                                            !r ? "bg-slate-300 dark:bg-slate-600"
                                            : r.timedOut ? "bg-amber-400"
                                            : r.correct  ? "bg-green-400"
                                            : "bg-red-400"
                                        }`}
                                    />
                                );
                            })}
                            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            ✓&nbsp;{totalCorrect}
                        </span>
                    </div>

                    {/* Word display */}
                    <div className="flex items-center justify-center bg-slate-800 dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg flex-1">
                        <span
                            className="text-6xl font-extrabold tracking-widest select-none"
                            style={{ color: COLOR_DISPLAY[currentTrial.inkColor] }}
                        >
                            {currentTrial.word}
                        </span>
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

                    {/* Response swatches */}
                    <div className="flex gap-4 justify-center w-full max-w-lg pb-1">
                        {currentTrial.options.map(opt => {
                            let ring = "";
                            if (trialPhase === "feedback") {
                                if (opt === chosen && opt === currentTrial.inkColor)
                                    ring = "ring-4 ring-green-400 scale-110";
                                else if (opt === chosen && opt !== currentTrial.inkColor)
                                    ring = "ring-4 ring-red-400 opacity-80";
                                else if (opt === currentTrial.inkColor && chosen !== currentTrial.inkColor)
                                    ring = "ring-4 ring-green-400";   // reveal correct
                            }
                            const disabled = trialPhase === "feedback";
                            return (
                                <button
                                    key={opt}
                                    disabled={disabled}
                                    onClick={() => !disabled && recordResult(opt, false)}
                                    className={`flex flex-col items-center gap-1.5 transition-transform duration-100 ${
                                        disabled ? "cursor-default" : "hover:scale-105 active:scale-95 cursor-pointer"
                                    }`}
                                >
                                    <div
                                        className={`w-14 h-14 rounded-xl shadow-md transition-all duration-150 ${ring}`}
                                        style={{ backgroundColor: COLOR_SWATCH[opt] }}
                                    />
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium select-none">
                                        {COLOR_LABEL[opt]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback overlay text */}
                    {trialPhase === "feedback" && (
                        <p className={`text-sm font-bold ${
                            chosen === currentTrial.inkColor ? "text-green-500" : "text-red-400"
                        }`}>
                            {chosen === null
                                ? "⏱ Temps dépassé"
                                : chosen === currentTrial.inkColor
                                ? "✓ Correct"
                                : `✗ Erreur — couleur : ${COLOR_LABEL[currentTrial.inkColor]}`
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

                    {/* Stroop interference */}
                    {stroopEff !== null && (
                        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-3 text-sm">
                            <span className="font-semibold text-violet-700 dark:text-violet-300">
                                Effet Stroop&nbsp;:&nbsp;
                            </span>
                            <span className="text-slate-700 dark:text-slate-200">
                                TR incongruent − TR congruent&nbsp;=&nbsp;
                                <strong className={stroopEff > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                                    {stroopEff > 0 ? "+" : ""}{stroopEff}&nbsp;ms
                                </strong>
                            </span>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {stroopEff > 300
                                    ? "Interférence forte — difficulté marquée à inhiber la lecture automatique."
                                    : stroopEff > 100
                                    ? "Interférence modérée — effet Stroop classique présent."
                                    : stroopEff > 0
                                    ? "Interférence légère — bonne capacité d'inhibition."
                                    : "Pas d'effet Stroop — inhibition très efficace."
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
                                return (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                                        <span className="text-slate-400 w-5 shrink-0 tabular-nums">{i + 1}.</span>

                                        {/* Word in its ink colour */}
                                        <span
                                            className="font-bold font-mono w-20 shrink-0 truncate"
                                            style={{ color: COLOR_DISPLAY[t.inkColor] }}
                                        >
                                            {t.word}
                                        </span>

                                        {/* Trial type */}
                                        <span className={`w-20 shrink-0 ${
                                            r.trialType === "congruent"   ? "text-green-600 dark:text-green-400"
                                            : r.trialType === "incongruent" ? "text-red-500 dark:text-red-400"
                                            : "text-slate-500"
                                        }`}>
                                            {r.trialType === "congruent" ? "Congruent" : r.trialType === "incongruent" ? "Incongruent" : "Neutre"}
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
                                            <span className="text-slate-400 flex items-center gap-1">
                                                <span
                                                    className="w-3 h-3 rounded-sm inline-block shrink-0"
                                                    style={{ backgroundColor: COLOR_SWATCH[r.chosen] }}
                                                />
                                                →
                                                <span
                                                    className="w-3 h-3 rounded-sm inline-block shrink-0"
                                                    style={{ backgroundColor: COLOR_SWATCH[r.answer] }}
                                                />
                                                <span style={{ color: COLOR_SWATCH[r.answer] }}>{COLOR_LABEL[r.answer]}</span>
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

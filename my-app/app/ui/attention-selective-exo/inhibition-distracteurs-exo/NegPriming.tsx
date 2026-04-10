"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "fixation" | "stimulus" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type TrialType  = "prime" | "NP" | "CTL";
type Feedback   = "correct" | "wrong" | "timeout" | null;

// ─── Paradigme ────────────────────────────────────────────────────────────────
// Chaque paire : essai PRIME → essai PROBE
//   • NP probe  : la cible du probe = le distracteur du prime (interférence)
//   • CTL probe : la cible du probe est nouvelle (ligne de base)
// Le patient voit 2 lettres (CIBLE en teal, IGNORE en gris) et clique la cible.

interface Trial {
    target:     string;
    distractor: string;
    leftChar:   string;   // lettre affichée à gauche
    rightChar:  string;   // lettre affichée à droite
    options:    string[]; // 4 boutons réponse (mélangés)
    type:       TrialType;
}

interface TrialResult {
    trial:    Trial;
    response: string | null;  // lettre cliquée (null = timeout)
    correct:  boolean;
    rt:       number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CFG: Record<Difficulty, {
    totalTrials: number;
    fixationMs:  number;
    timeLimitMs: number;
    feedbackMs:  number;
    empan:       number;
    pool:        string[];
}> = {
    facile: {
        totalTrials: 20, fixationMs: 600, timeLimitMs: 4000, feedbackMs: 700, empan: 3,
        pool: ["A", "B", "E", "F", "H", "K", "M", "T"],
    },
    moyen: {
        totalTrials: 30, fixationMs: 500, timeLimitMs: 3000, feedbackMs: 550, empan: 5,
        pool: ["B", "D", "E", "F", "G", "H", "P", "R"],
    },
    difficile: {
        totalTrials: 40, fixationMs: 400, timeLimitMs: 2000, feedbackMs: 400, empan: 7,
        pool: ["C", "G", "O", "Q", "B", "D", "E", "F"],
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickFrom(pool: string[], exclude: string[]): string {
    const avail = pool.filter(x => !exclude.includes(x));
    return avail[Math.floor(Math.random() * avail.length)];
}

function makeTrial(
    target: string,
    distractor: string,
    type: TrialType,
    pool: string[]
): Trial {
    const [leftChar, rightChar] = Math.random() < 0.5
        ? [target, distractor]
        : [distractor, target];

    // 4 réponses : cible + distracteur + 2 leurres
    const foils   = pool.filter(l => l !== target && l !== distractor);
    const twoFoils = [...foils].sort(() => Math.random() - 0.5).slice(0, 2);
    const options  = [target, distractor, ...twoFoils].sort(() => Math.random() - 0.5);

    return { target, distractor, leftChar, rightChar, options, type };
}

function buildTrials(diff: Difficulty): Trial[] {
    const { totalTrials, pool } = CFG[diff];
    const trials: Trial[] = [];

    while (trials.length < totalTrials) {
        // Essai PRIME
        const primTarget     = pickFrom(pool, []);
        const primDistractor = pickFrom(pool, [primTarget]);
        trials.push(makeTrial(primTarget, primDistractor, "prime", pool));

        if (trials.length >= totalTrials) break;

        // Essai PROBE : NP (50 %) ou CTL (50 %)
        const isNP = Math.random() < 0.5;
        let probeTarget: string;
        let probeDistractor: string;

        if (isNP) {
            probeTarget     = primDistractor;                           // ← ancienne cible ignorée
            probeDistractor = pickFrom(pool, [probeTarget, primTarget]);
        } else {
            probeTarget     = pickFrom(pool, [primTarget, primDistractor]);
            probeDistractor = pickFrom(pool, [probeTarget, primTarget, primDistractor]);
        }
        trials.push(makeTrial(probeTarget, probeDistractor, isNP ? "NP" : "CTL", pool));
    }

    return trials;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const typeBadge: Record<TrialType, string> = {
    prime: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    CTL:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    NP:    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};
const typeLabel: Record<TrialType, string> = {
    prime: "Prime",
    CTL:   "Contrôle",
    NP:    "NP",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NegPriming({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [feedback,   setFeedback]   = useState<Feedback>(null);
    const [displayIdx, setDisplayIdx] = useState(0);
    const [renderRes,  setRenderRes]  = useState<TrialResult[]>([]);

    const trialsRef     = useRef<Trial[]>([]);
    const currentIdxRef = useRef(0);
    const resultsRef    = useRef<TrialResult[]>([]);
    const trialStartAt  = useRef(0);
    const fixTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stimTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fbTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cfg         = CFG[difficulty];
    const totalTrials = cfg.totalTrials;

    // ── Cleanup ────────────────────────────────────────────────────────────────

    const clearAll = useCallback(() => {
        [fixTimerRef, stimTimerRef, fbTimerRef].forEach(r => {
            if (r.current) { clearTimeout(r.current); r.current = null; }
        });
    }, []);

    useEffect(() => () => clearAll(), [clearAll]);

    // ── Advance ───────────────────────────────────────────────────────────────

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

    // ── Timeout stimulus ───────────────────────────────────────────────────────

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
                exercice: "Negative priming",
                domaine: "attention-selective",
                score,
                empan: cfg.empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        clearAll();
        const trials = buildTrials(diff);
        trialsRef.current     = trials;
        currentIdxRef.current = 0;
        resultsRef.current    = [];
        setRenderRes([]);
        setDisplayIdx(0);
        setFeedback(null);
        setPhase("fixation");
    }, [clearAll]);

    const handleResponse = useCallback((letter: string) => {
        if (phase !== "stimulus" || feedback !== null) return;
        if (stimTimerRef.current) { clearTimeout(stimTimerRef.current); stimTimerRef.current = null; }
        const rt      = Date.now() - trialStartAt.current;
        const trial   = trialsRef.current[currentIdxRef.current];
        const correct = letter === trial.target;
        const result: TrialResult = { trial, response: letter, correct, rt };
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

    // ── Stats ──────────────────────────────────────────────────────────────────

    const currentTrial   = trialsRef.current[displayIdx];
    const doneCount      = renderRes.length;
    const correctRunning = renderRes.filter(r => r.correct).length;

    function statsByType(type: TrialType) {
        const sub = renderRes.filter(r => r.trial.type === type);
        if (sub.length === 0) return null;
        const ok    = sub.filter(r => r.correct).length;
        const timed = sub.filter(r => r.rt > 0);
        const avgRt = timed.length > 0
            ? Math.round(timed.reduce((s, r) => s + r.rt, 0) / timed.length)
            : 0;
        return { total: sub.length, ok, pct: Math.round((ok / sub.length) * 100), avgRt };
    }

    const overallScore = renderRes.length > 0
        ? Math.round((renderRes.filter(r => r.correct).length / renderRes.length) * 100)
        : 0;

    // Effet NP = écart CTL - NP (positif = interférence normale)
    const npStat  = statsByType("NP");
    const ctlStat = statsByType("CTL");
    const npEffect = (npStat && ctlStat)
        ? ctlStat.avgRt - npStat.avgRt   // positif si NP est plus lent
        : null;

    // ── Boutons réponse ────────────────────────────────────────────────────────

    function optionCls(letter: string): string {
        const base = "flex-1 flex items-center justify-center rounded-xl border-2 text-2xl font-bold font-mono transition-colors duration-100 py-3 ";
        if (feedback === null) {
            return base + "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-800 dark:text-slate-100 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400 active:scale-95 cursor-pointer";
        }
        const chosen    = renderRes.at(-1)?.response === letter;
        const isTarget  = currentTrial && letter === currentTrial.target;
        if (chosen && feedback === "correct")  return base + "bg-green-100 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-300";
        if (chosen && feedback !== "correct")  return base + "bg-red-100 dark:bg-red-900/30 border-red-400 text-red-600 dark:text-red-400";
        if (!chosen && isTarget && (feedback === "wrong" || feedback === "timeout"))
            return base + "bg-green-50 dark:bg-green-900/20 border-green-300 text-green-600 opacity-80";
        return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 opacity-40 cursor-default";
    }

    // ── Progress bar ───────────────────────────────────────────────────────────

    function ProgressBar() {
        return (
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 shrink-0">{doneCount} / {totalTrials}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                            className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(doneCount / totalTrials) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">✓ {correctRunning}</span>
                </div>
            </div>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Deux lettres s'affichent à chaque essai.<br />
                        Cliquez la lettre <strong className="text-teal-600 dark:text-teal-400">CIBLE</strong> (encadrée en teal)
                        en ignorant la lettre <strong className="text-slate-400">IGNORE</strong> (grisée).<br />
                        <span className="text-xs text-slate-400">
                            Parfois la cible est une lettre que vous veniez d'ignorer — c'est plus difficile !
                        </span>
                    </p>

                    {/* Exemple visuel */}
                    <div className="flex gap-4 items-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-16 h-16 rounded-xl border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-3xl font-bold font-mono text-teal-700 dark:text-teal-300">
                                H
                            </div>
                            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">Cible</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-16 h-16 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold font-mono text-slate-300 dark:text-slate-600">
                                B
                            </div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ignore</span>
                        </div>
                        <span className="text-slate-300 dark:text-slate-600 text-2xl">→</span>
                        <div className="flex gap-2">
                            {["A", "H", "B", "M"].map(l => (
                                <div key={l} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-lg ${
                                    l === "H"
                                        ? "border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
                                        : "border-slate-200 dark:border-slate-600 text-slate-400"
                                }`}>{l}</div>
                            ))}
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
                        Facile&nbsp;: 20 essais, 4&nbsp;s · Moyen&nbsp;: 30 essais, 3&nbsp;s · Difficile&nbsp;: 40 essais, 2&nbsp;s
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
                    <ProgressBar />
                    <div className="flex items-center justify-center flex-1">
                        <span className="text-5xl text-slate-300 dark:text-slate-600 font-thin select-none">+</span>
                    </div>
                </>
            )}

            {/* ── Stimulus ── */}
            {phase === "stimulus" && currentTrial && (
                <>
                    <ProgressBar />

                    <div className="flex flex-col items-center justify-center flex-1 gap-6 p-4">

                        {/* Paire de lettres */}
                        <div className="flex gap-6 items-end select-none">
                            {[currentTrial.leftChar, currentTrial.rightChar].map((char, i) => {
                                const isTarget = char === currentTrial.target;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <div className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center text-5xl font-bold font-mono transition-none ${
                                            isTarget
                                                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-200 shadow-md shadow-teal-100 dark:shadow-teal-900/30"
                                                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
                                        }`}>
                                            {char}
                                        </div>
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${
                                            isTarget
                                                ? "text-teal-600 dark:text-teal-400"
                                                : "text-slate-300 dark:text-slate-600"
                                        }`}>
                                            {isTarget ? "Cible" : "Ignore"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Badge feedback */}
                        <div className="h-7 flex items-center">
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

                        {/* Boutons réponse (4 lettres) */}
                        <div className="flex gap-2 w-full max-w-xs">
                            {currentTrial.options.map(letter => (
                                <button
                                    key={letter}
                                    onClick={() => handleResponse(letter)}
                                    disabled={feedback !== null}
                                    className={optionCls(letter)}
                                >
                                    {letter}
                                </button>
                            ))}
                        </div>

                    </div>
                </>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-5 p-6 text-center">

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
                        {(["prime", "CTL", "NP"] as TrialType[]).map(type => {
                            const s = statsByType(type);
                            if (!s) return null;
                            return (
                                <div key={type} className={`px-4 py-3 rounded-xl border text-sm ${typeBadge[type]}`}>
                                    <p className="font-semibold">{typeLabel[type]}</p>
                                    <p className="text-lg font-bold">{s.pct}&nbsp;%</p>
                                    <p className="text-xs opacity-75">{s.ok}/{s.total} · moy. {s.avgRt}&nbsp;ms</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Effet NP */}
                    {npEffect !== null && (
                        <div className={`text-xs px-4 py-2 rounded-lg border ${
                            npEffect > 0
                                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                        }`}>
                            {npEffect > 0
                                ? `Effet NP observé : +${npEffect} ms sur les essais NP vs contrôle`
                                : `Pas d'effet NP de TR détecté (${Math.abs(npEffect)} ms)`
                            }
                        </div>
                    )}

                    {/* Historique */}
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                        {renderRes.map((r, i) => (
                            <div
                                key={i}
                                title={`Essai ${i + 1} · ${typeLabel[r.trial.type]} · cible «${r.trial.target}» · ${r.correct ? "✓" : "✗"} · ${r.rt > 0 ? r.rt + "ms" : "timeout"}`}
                                className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold text-white ${
                                    r.trial.type === "prime"
                                        ? r.correct ? "bg-slate-400" : "bg-red-400"
                                        : r.trial.type === "NP"
                                        ? r.correct ? "bg-violet-500" : "bg-red-400"
                                        : r.correct ? "bg-blue-400" : "bg-red-400"
                                }`}
                            >
                                {typeLabel[r.trial.type][0]}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 text-xs text-slate-400 dark:text-slate-500">
                        <span><span className="inline-block w-3 h-3 rounded bg-slate-400 mr-1" />P = Prime</span>
                        <span><span className="inline-block w-3 h-3 rounded bg-blue-400 mr-1" />C = Contrôle</span>
                        <span><span className="inline-block w-3 h-3 rounded bg-violet-500 mr-1" />N = NP</span>
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

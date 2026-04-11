"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "running" | "finished";
type TrialPhase = "fixation" | "cue" | "isi" | "target" | "feedback";
type Side       = "left" | "right";
type Difficulty = "facile" | "moyen" | "difficile";

interface TrialConfig {
    cueType:    "valid" | "invalid";
    cueSide:    Side;
    targetSide: Side;
}

interface TrialResult extends TrialConfig {
    correct:     boolean;
    rt:          number | null; // ms — null = miss (timeout)
    clickedSide: Side | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_TRIALS = 20;

const TIMING: Record<Difficulty, {
    fixation: number;
    cue:      number;
    isi:      number;
    target:   number;
    feedback: number;
}> = {
    facile:    { fixation: 800, cue: 500, isi: 100, target: 3000, feedback: 700 },
    moyen:     { fixation: 600, cue: 300, isi:  75, target: 2000, feedback: 600 },
    difficile: { fixation: 500, cue: 200, isi:  50, target: 1500, feedback: 500 },
};

const EMPAN: Record<Difficulty, number> = {
    facile: 3, moyen: 5, difficile: 7,
};

// ─── Trial generator ──────────────────────────────────────────────────────────
// 75 % essais valides, 25 % invalides — mélange aléatoire (Fisher-Yates).

function generateTrials(): TrialConfig[] {
    const nValid   = Math.round(TOTAL_TRIALS * 0.75); // 15
    const nInvalid = TOTAL_TRIALS - nValid;            //  5
    const list: TrialConfig[] = [];

    for (let i = 0; i < nValid; i++) {
        const cueSide: Side = Math.random() < 0.5 ? "left" : "right";
        list.push({ cueType: "valid", cueSide, targetSide: cueSide });
    }
    for (let i = 0; i < nInvalid; i++) {
        const cueSide: Side = Math.random() < 0.5 ? "left" : "right";
        list.push({ cueType: "invalid", cueSide, targetSide: cueSide === "left" ? "right" : "left" });
    }
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParadigmePosner({ patientId }: { patientId: string | null }) {
    const [phase,        setPhase]       = useState<Phase>("idle");
    const [difficulty,   setDifficulty]  = useState<Difficulty>("facile");
    const [trialPhase,   setTrialPhase]  = useState<TrialPhase>("fixation");
    const [trialIdx,     setTrialIdx]    = useState(0);
    const [trials,       setTrials]      = useState<TrialConfig[]>([]);
    const [results,      setResults]     = useState<TrialResult[]>([]);
    const [lastOutcome,  setLastOutcome] = useState<"correct" | "incorrect" | "miss" | null>(null);
    const [lastClicked,  setLastClicked] = useState<Side | null>(null);

    // phaseTimerRef   : timers fixation/cue/isi/target (gérés par le useEffect)
    // nextTrialTimerRef : timer feedback → essai suivant (géré par recordAndAdvance)
    // Ces deux refs DOIVENT rester séparées : le cleanup du useEffect ne doit PAS
    // annuler le timer de transition inter-essai posé dans recordAndAdvance.
    const phaseTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const nextTrialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const targetOnset      = useRef(0);
    const respondedRef     = useRef(false);

    const timing       = TIMING[difficulty];
    const currentTrial = trials[trialIdx] ?? null;

    const clearPhaseTimer = () => {
        if (phaseTimerRef.current) { clearTimeout(phaseTimerRef.current); phaseTimerRef.current = null; }
    };
    const clearNextTrialTimer = () => {
        if (nextTrialTimerRef.current) { clearTimeout(nextTrialTimerRef.current); nextTrialTimerRef.current = null; }
    };

    // ── Record response → feedback → next trial ───────────────────────────────

    const recordAndAdvance = useCallback((clickedSide: Side | null) => {
        if (!currentTrial) return;
        clearPhaseTimer(); // annule uniquement le timer de phase (ex: timeout miss)

        const rt      = clickedSide !== null
            ? Math.round(performance.now() - targetOnset.current)
            : null;
        const correct = clickedSide === currentTrial.targetSide;
        const outcome: "correct" | "incorrect" | "miss" =
            clickedSide === null ? "miss" : correct ? "correct" : "incorrect";

        setResults(prev => [...prev, {
            ...currentTrial,
            correct:     clickedSide !== null && correct,
            rt,
            clickedSide,
        }]);
        setLastOutcome(outcome);
        setLastClicked(clickedSide);
        setTrialPhase("feedback");

        // Stocké dans nextTrialTimerRef — le cleanup du useEffect ne le touchera pas.
        nextTrialTimerRef.current = setTimeout(() => {
            const nextIdx = trialIdx + 1;
            if (nextIdx >= TOTAL_TRIALS) {
                setPhase("finished");
            } else {
                setTrialIdx(nextIdx);
                respondedRef.current = false;
                setTrialPhase("fixation");
            }
        }, timing.feedback);

    }, [currentTrial, trialIdx, timing.feedback]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Phase-progression timers ──────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "running") return;

        if (trialPhase === "fixation") {
            phaseTimerRef.current = setTimeout(() => setTrialPhase("cue"), timing.fixation);

        } else if (trialPhase === "cue") {
            phaseTimerRef.current = setTimeout(() => setTrialPhase("isi"), timing.cue);

        } else if (trialPhase === "isi") {
            phaseTimerRef.current = setTimeout(() => {
                targetOnset.current  = performance.now();
                respondedRef.current = false;
                setTrialPhase("target");
            }, timing.isi);

        } else if (trialPhase === "target") {
            // Auto-advance on miss
            phaseTimerRef.current = setTimeout(() => {
                if (!respondedRef.current) {
                    respondedRef.current = true;
                    recordAndAdvance(null);
                }
            }, timing.target);
        }

        return clearPhaseTimer;
    }, [phase, trialPhase, trialIdx, timing, recordAndAdvance]);

    useEffect(() => () => { clearPhaseTimer(); clearNextTrialTimer(); }, []);

    // ── Click handler ─────────────────────────────────────────────────────────

    const handleBoxClick = (side: Side) => {
        if (trialPhase !== "target" || respondedRef.current) return;
        respondedRef.current = true;
        recordAndAdvance(side);
    };

    // ── Start ─────────────────────────────────────────────────────────────────

    const startGame = (diff: Difficulty) => {
        clearPhaseTimer();
        clearNextTrialTimer();
        setDifficulty(diff);
        setTrials(generateTrials());
        setResults([]);
        setTrialIdx(0);
        setLastOutcome(null);
        setLastClicked(null);
        respondedRef.current = false;
        setTrialPhase("fixation");
        setPhase("running");
    };

    const reset = () => {
        clearPhaseTimer();
        clearNextTrialTimer();
        setPhase("idle");
        setTrials([]);
        setResults([]);
        setTrialIdx(0);
        setLastOutcome(null);
        setLastClicked(null);
    };

    // ── Save score ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || results.length === 0) return;
        const correct = results.filter(r => r.correct).length;
        const score   = Math.round((correct / TOTAL_TRIALS) * 100);
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Paradigme de Posner",
                domaine:  "attention-selective",
                score,
                empan:    EMPAN[difficulty],
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // ── Stats (finished screen) ───────────────────────────────────────────────

    const correctCount = results.filter(r => r.correct).length;
    const missCount    = results.filter(r => r.rt === null).length;
    const finalScore   = results.length ? Math.round((correctCount / TOTAL_TRIALS) * 100) : 0;

    const meanRt = (filter: (r: TrialResult) => boolean) => {
        const arr = results.filter(r => filter(r) && r.rt !== null);
        return arr.length ? Math.round(arr.reduce((s, r) => s + r.rt!, 0) / arr.length) : null;
    };
    const rtValid       = meanRt(r => r.cueType === "valid");
    const rtInvalid     = meanRt(r => r.cueType === "invalid");
    const validityEffect = rtValid !== null && rtInvalid !== null ? rtInvalid - rtValid : null;

    // ── Box styling ───────────────────────────────────────────────────────────

    function boxClass(side: Side): string {
        const base = "flex items-center justify-center rounded-2xl border-2 transition-all duration-100 select-none w-24 h-24 sm:w-32 sm:h-32 ";

        if (trialPhase === "feedback") {
            if (currentTrial?.targetSide === side) {
                return base + (lastOutcome === "correct"
                    ? "border-green-400 bg-green-100 dark:bg-green-900/40"
                    : "border-amber-400 bg-amber-100 dark:bg-amber-900/30");
            }
            if (lastOutcome === "incorrect" && lastClicked === side) {
                return base + "border-red-400 bg-red-100 dark:bg-red-900/30";
            }
            return base + "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800";
        }

        if (trialPhase === "target") {
            return base + "border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-800 cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/20 active:scale-95";
        }

        return base + "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800";
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-lg">
                        <p className="mb-2">
                            Deux cases apparaissent à gauche et à droite de l&apos;écran.<br />
                            Une <strong>flèche centrale</strong> indique le côté probable de la cible
                            {" "}(valide 75&nbsp;% du temps).<br />
                            Dès qu&apos;une <strong>étoile ★</strong> apparaît dans l&apos;une des cases,{" "}
                            <strong>cliquez dessus le plus vite possible.</strong>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            La flèche est parfois trompeuse — restez attentif à l&apos;étoile, pas à la flèche.
                        </p>
                    </div>

                    {/* Difficulty cards */}
                    <div className="grid grid-cols-3 gap-3 text-xs text-left max-w-md w-full">
                        {([
                            { d: "facile",    label: "Facile",    desc: "Indice 500 ms · Cible 3 s",    n: "20 essais" },
                            { d: "moyen",     label: "Moyen",     desc: "Indice 300 ms · Cible 2 s",    n: "20 essais" },
                            { d: "difficile", label: "Difficile", desc: "Indice 200 ms · Cible 1,5 s",  n: "20 essais" },
                        ] as const).map(({ d, label, desc, n }) => (
                            <div
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`rounded-lg border p-2 cursor-pointer transition-colors duration-150 ${
                                    difficulty === d
                                        ? "bg-sky-50 dark:bg-sky-900/30 border-sky-400 dark:border-sky-600"
                                        : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-sky-300"
                                }`}
                            >
                                <p className={`font-semibold mb-0.5 ${difficulty === d ? "text-sky-700 dark:text-sky-300" : "text-slate-700 dark:text-slate-200"}`}>
                                    {label}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">{desc}</p>
                                <p className="text-slate-400 dark:text-slate-500 mt-0.5">{n}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Running ── */}
            {phase === "running" && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Progress bar */}
                    <div className="px-4 pt-3 pb-1 shrink-0">
                        <div className="flex items-center justify-between mb-1 text-xs text-slate-400 dark:text-slate-500">
                            <span>Essai {Math.min(trialIdx + 1, TOTAL_TRIALS)}&nbsp;/&nbsp;{TOTAL_TRIALS}</span>
                            <span className="capitalize">{difficulty}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-sky-400 dark:bg-sky-500 transition-all duration-300"
                                style={{ width: `${(trialIdx / TOTAL_TRIALS) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Arena */}
                    <div className="flex-1 flex items-center justify-center gap-10 sm:gap-20 px-4">

                        {/* Left box */}
                        <button
                            onClick={() => handleBoxClick("left")}
                            className={boxClass("left")}
                            disabled={trialPhase !== "target"}
                            aria-label="Case gauche"
                        >
                            {(trialPhase === "target" || trialPhase === "feedback") &&
                             currentTrial?.targetSide === "left" && (
                                <span className="text-4xl sm:text-5xl text-sky-500 dark:text-sky-400 select-none">
                                    ★
                                </span>
                            )}
                        </button>

                        {/* Central fixation / cue */}
                        <div className="flex flex-col items-center justify-center w-14 shrink-0 gap-1">
                            {trialPhase === "cue" ? (
                                <span className="text-4xl font-bold text-sky-600 dark:text-sky-400 select-none leading-none">
                                    {currentTrial?.cueSide === "left" ? "←" : "→"}
                                </span>
                            ) : (
                                <span className="text-4xl font-bold text-slate-400 dark:text-slate-500 select-none leading-none">
                                    +
                                </span>
                            )}
                        </div>

                        {/* Right box */}
                        <button
                            onClick={() => handleBoxClick("right")}
                            className={boxClass("right")}
                            disabled={trialPhase !== "target"}
                            aria-label="Case droite"
                        >
                            {(trialPhase === "target" || trialPhase === "feedback") &&
                             currentTrial?.targetSide === "right" && (
                                <span className="text-4xl sm:text-5xl text-sky-500 dark:text-sky-400 select-none">
                                    ★
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Feedback label */}
                    <div className="h-10 flex items-center justify-center shrink-0 pb-2">
                        {trialPhase === "feedback" && lastOutcome && (
                            <span className={`text-sm font-semibold ${
                                lastOutcome === "correct"   ? "text-green-600 dark:text-green-400" :
                                lastOutcome === "incorrect" ? "text-red-500 dark:text-red-400" :
                                                             "text-slate-400 dark:text-slate-500"
                            }`}>
                                {lastOutcome === "correct"   ? "✓ Correct" :
                                 lastOutcome === "incorrect" ? "✗ Mauvais côté" :
                                                              "⏱ Trop lent"}
                            </span>
                        )}
                        {trialPhase === "target" && (
                            <span className="text-xs text-sky-500 dark:text-sky-400 animate-pulse">
                                Cliquez sur l&apos;étoile !
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            <span className={`text-3xl font-extrabold ${
                                finalScore >= 80 ? "text-green-600 dark:text-green-400" :
                                finalScore >= 50 ? "text-amber-500" : "text-red-500"
                            }`}>
                                {finalScore}&nbsp;%
                            </span>
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                                <p>Corrects&nbsp;: <strong>{correctCount}</strong>&nbsp;/&nbsp;{TOTAL_TRIALS}</p>
                                {missCount > 0 && (
                                    <p className="text-slate-400">Manqués&nbsp;: <strong>{missCount}</strong></p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={reset}
                            className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150"
                        >
                            Recommencer
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

                        {/* RT summary cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                                    TR moyen — indice valide
                                </p>
                                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                                    {rtValid !== null ? `${rtValid} ms` : "—"}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {results.filter(r => r.cueType === "valid").length} essais
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                                    TR moyen — indice invalide
                                </p>
                                <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
                                    {rtInvalid !== null ? `${rtInvalid} ms` : "—"}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {results.filter(r => r.cueType === "invalid").length} essais
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center col-span-2 sm:col-span-1">
                                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                                    Effet de validité
                                </p>
                                <p className={`text-2xl font-bold ${
                                    validityEffect !== null && validityEffect > 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-slate-400"
                                }`}>
                                    {validityEffect !== null
                                        ? `${validityEffect > 0 ? "+" : ""}${validityEffect} ms`
                                        : "—"}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {validityEffect !== null && validityEffect > 0
                                        ? "Orientation attentionnelle normale"
                                        : validityEffect !== null
                                        ? "Pas d'effet de validité détecté"
                                        : "Données insuffisantes"}
                                </p>
                            </div>
                        </div>

                        {/* Per-trial table */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide grid grid-cols-4 gap-2">
                                <span>#</span>
                                <span>Indice</span>
                                <span>Résultat</span>
                                <span>TR (ms)</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto">
                                {results.map((r, i) => (
                                    <div key={i} className="grid grid-cols-4 gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                                        <span>{i + 1}</span>
                                        <span className={r.cueType === "valid"
                                            ? "text-sky-600 dark:text-sky-400"
                                            : "text-orange-500 dark:text-orange-400"}>
                                            {r.cueType === "valid" ? "valide" : "invalide"}
                                        </span>
                                        <span className={
                                            r.correct      ? "text-green-600 dark:text-green-400 font-semibold" :
                                            r.rt === null  ? "text-slate-400" :
                                                             "text-red-500 font-semibold"
                                        }>
                                            {r.correct ? "✓ Correct" : r.rt === null ? "Manqué" : "✗ Erreur"}
                                        </span>
                                        <span className="tabular-nums font-mono">
                                            {r.rt !== null ? r.rt : "—"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interpretation */}
                        <div className="p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
                            <p className="font-semibold mb-1 text-sm">Que mesure cet exercice ?</p>
                            <p>
                                Le <strong>paradigme de Posner</strong> évalue l&apos;orientation de l&apos;attention
                                visuo-spatiale. Un temps de réaction plus court sur les indices valides que sur les
                                invalides — l&apos;<strong>effet de validité</strong> — indique que l&apos;attention
                                s&apos;oriente efficacement vers l&apos;indice spatial. Un effet absent ou inversé peut
                                signaler une difficulté à orienter volontairement l&apos;attention dans l&apos;espace.
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

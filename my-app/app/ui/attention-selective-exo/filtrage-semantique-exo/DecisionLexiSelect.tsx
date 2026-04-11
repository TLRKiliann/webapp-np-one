"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type Response   = "vivant" | "non-vivant" | "timeout";

interface Trial {
    word:         string;
    isLiving:     boolean;
    isRealWord:   boolean; // all items here are real words
    response:     Response | null;
    correct:      boolean | null;
    reactionTime: number | null;
}

// ─── Word banks ────────────────────────────────────────────────────────────────

// Living entities (animés / vivants)
const LIVING: string[] = [
    // Animaux
    "chien", "chat", "lion", "tigre", "aigle", "dauphin", "lapin", "ours",
    "renard", "loup", "serpent", "hibou", "singe", "baleine", "girafe",
    "zèbre", "panthère", "lynx", "coyote", "vautour", "araignée", "grenouille",
    "moustique", "papillon", "fourmi", "requin", "pieuvre", "homard", "crabe",
    // Végétaux / organismes vivants
    "rosier", "chêne", "algue", "champignon", "bactérie", "levure", "mousse",
    // Humains / parties vivantes
    "enfant", "médecin", "fermier", "nourrisson", "acteur", "auteur", "berger",
];

// Non-living entities (inanimés / non-vivants)
const NON_LIVING: string[] = [
    // Objets quotidiens
    "table", "chaise", "lampe", "miroir", "tasse", "fourchette", "couteau",
    "bouteille", "cahier", "stylo", "cartable", "montre", "lunettes", "bague",
    // Bâtiments / lieux
    "maison", "château", "tunnel", "pont", "escalier", "couloir", "grenier",
    // Véhicules
    "voiture", "avion", "bateau", "camion", "moto", "train", "vélo", "fusée",
    // Nature inanimée
    "rocher", "montagne", "nuage", "rivière", "glacier", "volcan", "désert",
    // Abstractions concrètes
    "dollar", "contrat", "lettre", "médaille", "trophée", "drapeau", "billet",
];

// ─── Difficulty config ─────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    trialsCount: number;
    msPerWord:   number;
    empan:       number;
    // At "difficile" we add near-miss distractor words (ambiguous)
    nearMiss:    boolean;
}> = {
    facile:    { trialsCount: 16, msPerWord: 3000, empan: 3, nearMiss: false },
    moyen:     { trialsCount: 22, msPerWord: 2000, empan: 5, nearMiss: false },
    difficile: { trialsCount: 28, msPerWord: 1300, empan: 7, nearMiss: true  },
};

// Near-miss words for "difficile" — things that sound/look biological but are not
const NEAR_MISS_NON_LIVING: string[] = [
    "corail",    // animé mais souvent classé objet/décor
    "virus",     // frontière vivant/non-vivant
    "fossile",   // était vivant, ne l'est plus
    "charbon",   // d'origine organique
    "ivoire",    // matière animale morte
    "coquille",  // produit d'un vivant
    "plume",     // produit d'un vivant
    "écorce",    // partie d'un arbre
    "farine",    // transformation végétale
    "laine",     // produit animal
];

// ─── Trial builder ─────────────────────────────────────────────────────────────

function buildTrials(diff: Difficulty): Trial[] {
    const cfg = DIFFICULTY_CONFIG[diff];
    const halfLiving = Math.round(cfg.trialsCount * 0.5);
    const halfNonLiving = cfg.trialsCount - halfLiving;

    const shuffle = <T,>(arr: T[]): T[] => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    let nonLivingPool = [...NON_LIVING];
    if (cfg.nearMiss) nonLivingPool = [...nonLivingPool, ...NEAR_MISS_NON_LIVING];

    const livingWords    = shuffle(LIVING).slice(0, halfLiving);
    const nonLivingWords = shuffle(nonLivingPool).slice(0, halfNonLiving);

    const living    = livingWords.map(w    => ({ word: w, isLiving: true,  isRealWord: true, response: null, correct: null, reactionTime: null }));
    const nonLiving = nonLivingWords.map(w => ({ word: w, isLiving: false, isRealWord: true, response: null, correct: null, reactionTime: null }));

    return shuffle([...living, ...nonLiving]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DecisionLexiSelect({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [trials,     setTrials]     = useState<Trial[]>([]);
    const [current,    setCurrent]    = useState(0);
    const [progress,   setProgress]   = useState(100);
    const [feedback,   setFeedback]   = useState<"correct" | "wrong" | null>(null);

    const wordStartAt = useRef<number>(0);
    const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fbRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cfg = DIFFICULTY_CONFIG[difficulty];

    // ── Clear timers ──────────────────────────────────────────────────────────

    const clearTimers = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (autoRef.current)  { clearTimeout(autoRef.current);   autoRef.current  = null; }
        if (fbRef.current)    { clearTimeout(fbRef.current);     fbRef.current    = null; }
    };

    useEffect(() => () => clearTimers(), []);

    // ── Advance to next word ───────────────────────────────────────────────────

    const advance = useCallback((nextIdx: number) => {
        setFeedback(null);
        if (nextIdx >= 0) setCurrent(nextIdx);
    }, []);

    // ── Start word display ─────────────────────────────────────────────────────

    const startWord = useCallback((idx: number) => {
        clearTimers();
        setFeedback(null);
        wordStartAt.current = Date.now();
        setProgress(100);

        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - wordStartAt.current;
            setProgress(Math.max(0, 100 - (elapsed / cfg.msPerWord) * 100));
        }, 50);

        autoRef.current = setTimeout(() => {
            clearTimers();
            setTrials(prev => {
                const updated = [...prev];
                if (updated[idx]?.response === null) {
                    updated[idx] = {
                        ...updated[idx],
                        response: "timeout", correct: false, reactionTime: cfg.msPerWord,
                    };
                }
                return updated;
            });
            setFeedback("wrong");
            fbRef.current = setTimeout(() => advance(idx + 1), 500);
        }, cfg.msPerWord);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cfg.msPerWord]);

    // ── Watch current index ────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "playing") return;
        if (current >= trials.length) {
            clearTimers();
            setPhase("finished");
            return;
        }
        startWord(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, phase]);

    // ── Start game ────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        const t = buildTrials(diff);
        setTrials(t);
        setCurrent(0);
        setProgress(100);
        setFeedback(null);
        setPhase("playing");
    }, []);

    // ── Handle response ───────────────────────────────────────────────────────

    const handleResponse = useCallback((resp: "vivant" | "non-vivant") => {
        if (phase !== "playing") return;
        clearTimers();
        const rt      = Date.now() - wordStartAt.current;
        let isCorrect = false;
        setTrials(prev => {
            const updated = [...prev];
            const trial   = updated[current];
            if (!trial || trial.response !== null) return prev;
            isCorrect = (resp === "vivant") === trial.isLiving;
            updated[current] = { ...trial, response: resp, correct: isCorrect, reactionTime: rt };
            return updated;
        });
        setFeedback(isCorrect ? "correct" : "wrong");
        fbRef.current = setTimeout(() => advance(current + 1), 400);
    }, [phase, current, advance]);

    // ── Keyboard support ──────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "playing") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "v" || e.key === "V" || e.key === " ") handleResponse("vivant");
            if (e.key === "n" || e.key === "N")                  handleResponse("non-vivant");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [phase, handleResponse]);

    // ── Save score ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || trials.length === 0) return;
        const living      = trials.filter(t => t.isLiving);
        const hits        = living.filter(t => t.response === "vivant").length;
        const falseAlarms = trials.filter(t => !t.isLiving && t.response === "vivant").length;
        const raw         = ((hits - falseAlarms) / living.length) * 100;
        const score       = Math.max(0, Math.round(raw));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Décision lexicale sélective",
                domaine:  "attention-selective",
                score,
                empan:    DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const reset = () => {
        clearTimers();
        setPhase("idle");
        setTrials([]);
        setCurrent(0);
        setFeedback(null);
    };

    // ── Computed stats ─────────────────────────────────────────────────────────

    const living      = trials.filter(t => t.isLiving);
    const nonLiving   = trials.filter(t => !t.isLiving);
    const hits        = living.filter(t => t.response === "vivant").length;
    const misses      = living.filter(t => t.response !== "vivant").length;
    const falseAlarms = nonLiving.filter(t => t.response === "vivant").length;
    const correct     = trials.filter(t => t.correct).length;
    const accuracy    = trials.length > 0 ? Math.round((correct / trials.length) * 100) : 0;
    const answered    = trials.filter(t => t.response !== null && t.response !== "timeout");
    const avgRt       = answered.length > 0
        ? Math.round(answered.reduce((s, t) => s + (t.reactionTime ?? 0), 0) / answered.length)
        : 0;
    const score = trials.length > 0
        ? Math.max(0, Math.round(((hits - falseAlarms) / (living.length || 1)) * 100))
        : 0;

    const currentTrial = trials[current];

    // ── Word background during feedback ───────────────────────────────────────

    const wordBg =
        feedback === "correct" ? "bg-green-100 dark:bg-green-900/40 border-green-400"
        : feedback === "wrong"  ? "bg-red-100 dark:bg-red-900/40 border-red-400"
        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <div className="max-w-md space-y-2">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Un mot apparaît à l'écran. Décidez rapidement s'il désigne quelque chose de <strong>vivant</strong> ou de <strong>non-vivant</strong>.
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">
                            Vivants&nbsp;: animaux, plantes, personnes, micro-organismes…<br />
                            Non-vivants&nbsp;: objets, lieux, véhicules, phénomènes naturels…
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                            Raccourcis : <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">V</kbd> ou <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">Espace</kbd> = Vivant
                            &nbsp;·&nbsp; <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">N</kbd> = Non-vivant
                        </p>
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
                        Facile&nbsp;: 16 mots, 3&nbsp;s · Moyen&nbsp;: 22 mots, 2&nbsp;s · Difficile&nbsp;: 28 mots, 1,3&nbsp;s (mots ambigus inclus)
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
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Vivant ou non-vivant ?
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                            {current + 1}&nbsp;/&nbsp;{trials.length}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 shrink-0">
                        <div
                            className={`h-full transition-none ${
                                progress > 50 ? "bg-green-400"
                                : progress > 20 ? "bg-amber-400"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Word display */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-10">
                        <div className={`px-10 py-6 rounded-2xl border-2 transition-colors duration-150 ${wordBg}`}>
                            <p className="text-4xl font-bold tracking-wide text-slate-800 dark:text-slate-100 select-none">
                                {currentTrial.word}
                            </p>
                        </div>

                        {/* Feedback icon */}
                        {feedback && (
                            <p className={`text-2xl font-bold ${feedback === "correct" ? "text-green-500" : "text-red-500"}`}>
                                {feedback === "correct" ? "✓" : "✗"}
                            </p>
                        )}

                        <div className="flex gap-6">
                            <button
                                onClick={() => handleResponse("vivant")}
                                disabled={feedback !== null}
                                className="w-36 py-3 rounded-xl text-base font-bold bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-60 text-white transition-all duration-100 shadow"
                            >
                                VIVANT
                                <span className="block text-xs font-normal opacity-75 mt-0.5">V / Espace</span>
                            </button>
                            <button
                                onClick={() => handleResponse("non-vivant")}
                                disabled={feedback !== null}
                                className="w-36 py-3 rounded-xl text-base font-bold bg-slate-500 hover:bg-slate-600 active:scale-95 disabled:opacity-60 text-white transition-all duration-100 shadow"
                            >
                                NON-VIVANT
                                <span className="block text-xs font-normal opacity-75 mt-0.5">N</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Stats header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex-wrap gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            Décision lexicale sélective
                        </span>
                        <div className="flex gap-4 text-sm flex-wrap">
                            <span className="text-green-600 dark:text-green-400 font-medium">✓ Hits&nbsp;: {hits}/{living.length}</span>
                            <span className="text-amber-500 font-medium">◌ Manqués&nbsp;: {misses}</span>
                            <span className="text-red-400 font-medium">✗ Faux pos.&nbsp;: {falseAlarms}</span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">⏱ ~{avgRt}&nbsp;ms</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-bold ${
                                score >= 80 ? "text-green-600 dark:text-green-400"
                                : score >= 50 ? "text-amber-500"
                                : "text-red-500"
                            }`}>
                                {score}&nbsp;%
                            </span>
                            <span className="text-xs text-slate-400">Précision&nbsp;: {accuracy}&nbsp;%</span>
                            <button
                                onClick={reset}
                                className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150"
                            >
                                Recommencer
                            </button>
                        </div>
                    </div>

                    {/* Trial review */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-wrap gap-2">
                            {trials.map((t, i) => {
                                let bg: string;
                                if (t.response === "timeout")
                                    bg = "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400";
                                else if (t.correct)
                                    bg = "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300";
                                else
                                    bg = "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300";
                                return (
                                    <div
                                        key={i}
                                        title={`Réponse : ${t.response ?? "—"} · Correct : ${t.isLiving ? "VIVANT" : "NON-VIVANT"} · ${t.reactionTime ?? "—"} ms`}
                                        className={`px-2 py-1 rounded border text-sm font-medium ${bg}`}
                                    >
                                        {t.word}
                                        <span className="ml-1 text-xs opacity-50">
                                            {t.isLiving ? "V" : "NV"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                            V = vivant · NV = non-vivant · Vert = correct · Rouge = erreur · Gris = délai dépassé
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}

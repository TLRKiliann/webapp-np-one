"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "stimulus" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type Response   = "cible" | "distracteur";

interface Trial {
    word:      string;
    isTarget:  boolean;
    response:  Response | null;
    correct:   boolean | null;
}

// ─── Word banks ────────────────────────────────────────────────────────────────

const BANKS: Record<string, string[]> = {
    Animaux:     ["chien", "chat", "lion", "tigre", "aigle", "dauphin", "lapin", "ours",
                  "renard", "loup", "serpent", "hibou", "singe", "baleine", "girafe",
                  "zèbre", "lynx", "coyote", "vautour", "grenouille"],
    Fruits:      ["pomme", "banane", "fraise", "cerise", "raisin", "orange", "poire",
                  "melon", "kiwi", "mangue", "pêche", "prune", "abricot", "ananas", "citron",
                  "figue", "litchi", "papaye", "grenade", "myrtille"],
    Légumes:     ["carotte", "tomate", "poireau", "courgette", "épinard", "navet",
                  "radis", "oignon", "poivron", "brocoli", "chou", "haricot", "laitue",
                  "pois", "fenouil", "artichaut", "asperge", "betterave", "céleri", "potiron"],
    Couleurs:    ["rouge", "bleu", "vert", "jaune", "violet", "blanc", "noir", "rose",
                  "gris", "brun", "indigo", "turquoise", "beige", "mauve", "écarlate",
                  "cramoisi", "ivoire", "ocre", "bordeaux", "azur"],
    Meubles:     ["table", "chaise", "canapé", "armoire", "bureau", "lit", "étagère",
                  "buffet", "commode", "fauteuil", "bibliothèque", "tabouret", "divan",
                  "bahut", "coffre", "pouf", "secrétaire", "console", "vitrine", "ottomane"],
    Instruments: ["piano", "guitare", "violon", "trompette", "flûte", "tambour",
                  "harpe", "accordéon", "saxophone", "contrebasse", "mandoline",
                  "clarinette", "hautbois", "tuba", "cor", "basson", "luth", "banjo", "cornet", "cymbalum"],
    Vêtements:   ["chemise", "pantalon", "robe", "veste", "manteau", "chaussure",
                  "chapeau", "cravate", "jean", "pull", "jupe", "écharpe", "gant",
                  "collant", "ceinture", "bonnet", "tablier", "gilet", "imperméable", "pardessus"],
};

// ─── Difficulty config ─────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    trialsCount:      number;
    empan:            number;
    feedbackAutoMs:   number;   // ms before auto-advance from feedback (0 = manual)
    targetCat:        string;
    distractorCats:   string[];
    showFeedbackHint: boolean;  // show explanatory sentence in feedback
}> = {
    facile: {
        trialsCount: 16, empan: 3, feedbackAutoMs: 2500,
        targetCat: "Animaux",
        distractorCats: ["Couleurs", "Meubles"],
        showFeedbackHint: true,
    },
    moyen: {
        trialsCount: 20, empan: 5, feedbackAutoMs: 2000,
        targetCat: "Fruits",
        distractorCats: ["Légumes", "Couleurs", "Vêtements"],
        showFeedbackHint: true,
    },
    difficile: {
        trialsCount: 24, empan: 7, feedbackAutoMs: 0,
        targetCat: "Instruments",
        distractorCats: ["Meubles", "Vêtements", "Animaux", "Fruits"],
        showFeedbackHint: true,
    },
};

// ─── Trial builder ─────────────────────────────────────────────────────────────

function buildTrials(diff: Difficulty): Trial[] {
    const cfg          = DIFFICULTY_CONFIG[diff];
    const targetWords  = [...BANKS[cfg.targetCat]];
    const distrPool    = cfg.distractorCats.flatMap(c => BANKS[c]);
    const targetCount  = Math.round(cfg.trialsCount * 0.5);
    const distrCount   = cfg.trialsCount - targetCount;

    const shuffle = <T,>(a: T[]): T[] => {
        const arr = [...a];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    const targets = shuffle(targetWords).slice(0, targetCount)
        .map(w => ({ word: w, isTarget: true,  response: null, correct: null }));
    const distrs  = shuffle(distrPool).slice(0, distrCount)
        .map(w => ({ word: w, isTarget: false, response: null, correct: null }));

    return shuffle([...targets, ...distrs]);
}

// ─── Feedback message builder ─────────────────────────────────────────────────

function buildFeedbackMsg(trial: Trial, targetCat: string, correct: boolean): string {
    const w = trial.word.charAt(0).toUpperCase() + trial.word.slice(1);
    if (correct) {
        return trial.isTarget
            ? `✓ Exact ! « ${w} » appartient bien à la catégorie ${targetCat}.`
            : `✓ Exact ! « ${w} » n'appartient pas à la catégorie ${targetCat}.`;
    }
    return trial.isTarget
        ? `✗ Erreur. « ${w} » appartient à ${targetCat} — il fallait répondre Cible.`
        : `✗ Erreur. « ${w} » n'appartient pas à ${targetCat} — il fallait répondre Distracteur.`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedBackImmediat({ patientId }: { patientId: string | null }) {
    const [phase,        setPhase]        = useState<Phase>("idle");
    const [difficulty,   setDifficulty]   = useState<Difficulty>("facile");
    const [trials,       setTrials]       = useState<Trial[]>([]);
    const [current,      setCurrent]      = useState(0);
    const [lastCorrect,  setLastCorrect]  = useState<boolean | null>(null);
    const [feedbackMsg,  setFeedbackMsg]  = useState("");
    const [countdown,    setCountdown]    = useState(0);

    const autoRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
    const tickRef    = useRef<ReturnType<typeof setInterval> | null>(null);

    const cfg = DIFFICULTY_CONFIG[difficulty];

    const clearTimers = () => {
        if (autoRef.current)  { clearTimeout(autoRef.current);   autoRef.current  = null; }
        if (tickRef.current)  { clearInterval(tickRef.current);  tickRef.current  = null; }
    };
    useEffect(() => () => clearTimers(), []);

    // ── Start ─────────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        setTrials(buildTrials(diff));
        setCurrent(0);
        setLastCorrect(null);
        setFeedbackMsg("");
        setPhase("stimulus");
    }, []);

    // ── Handle response ───────────────────────────────────────────────────────

    const handleResponse = useCallback((resp: Response) => {
        if (phase !== "stimulus") return;
        clearTimers();

        const trial   = trials[current];
        const correct = (resp === "cible") === trial.isTarget;
        const msg     = buildFeedbackMsg(
            { ...trial, response: resp },
            DIFFICULTY_CONFIG[difficulty].targetCat,
            correct,
        );

        setTrials(prev => {
            const u = [...prev];
            u[current] = { ...u[current], response: resp, correct };
            return u;
        });
        setLastCorrect(correct);
        setFeedbackMsg(msg);
        setPhase("feedback");

        // Auto-advance
        const ms = DIFFICULTY_CONFIG[difficulty].feedbackAutoMs;
        if (ms > 0) {
            setCountdown(Math.round(ms / 1000));
            tickRef.current = setInterval(() => {
                setCountdown(prev => Math.max(0, prev - 1));
            }, 1000);
            autoRef.current = setTimeout(() => {
                clearTimers();
                advance(current + 1);
            }, ms);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, trials, current, difficulty]);

    const advance = (nextIdx: number) => {
        clearTimers();
        setLastCorrect(null);
        setFeedbackMsg("");
        setCountdown(0);
        if (nextIdx >= trials.length) {
            setPhase("finished");
        } else {
            setCurrent(nextIdx);
            setPhase("stimulus");
        }
    };

    // ── Keyboard support ──────────────────────────────────────────────────────

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (phase === "stimulus") {
                if (e.key === "c" || e.key === "C" || e.key === " ") handleResponse("cible");
                if (e.key === "d" || e.key === "D")                  handleResponse("distracteur");
            }
            if (phase === "feedback" && (e.key === "Enter" || e.key === " ")) {
                advance(current + 1);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, handleResponse, current]);

    // ── Save score ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || trials.length === 0) return;
        const targets     = trials.filter(t => t.isTarget);
        const hits        = targets.filter(t => t.response === "cible").length;
        const falseAlarms = trials.filter(t => !t.isTarget && t.response === "cible").length;
        const raw         = ((hits - falseAlarms) / targets.length) * 100;
        const score       = Math.max(0, Math.round(raw));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Feedback immédiat",
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
        setLastCorrect(null);
        setFeedbackMsg("");
        setCountdown(0);
    };

    // ── Stats ─────────────────────────────────────────────────────────────────

    const targets     = trials.filter(t => t.isTarget);
    const hits        = targets.filter(t => t.response === "cible").length;
    const misses      = targets.filter(t => t.response !== "cible" && t.response !== null).length;
    const falseAlarms = trials.filter(t => !t.isTarget && t.response === "cible").length;
    const correct     = trials.filter(t => t.correct).length;
    const accuracy    = trials.length > 0 ? Math.round((correct / trials.length) * 100) : 0;
    const score       = trials.length > 0
        ? Math.max(0, Math.round(((hits - falseAlarms) / (targets.length || 1)) * 100))
        : 0;

    const currentTrial = trials[current];
    const progressPct  = trials.length > 0 ? (current / trials.length) * 100 : 0;

    const targetCat = cfg.targetCat;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <div className="max-w-md space-y-3">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Des mots apparaissent un à un. Indiquez si chaque mot est une
                            <strong> Cible</strong> (appartient à la catégorie) ou un
                            <strong> Distracteur</strong>.<br />
                            Après chaque réponse, un <strong>feedback immédiat</strong> vous
                            indique si vous avez eu raison et <em>pourquoi</em>.
                        </p>
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                            Stratégie : corriger chaque erreur de sélection immédiatement,
                            avant de passer à l'item suivant.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Raccourcis : <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">C</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">Espace</kbd> = Cible
                            &nbsp;·&nbsp; <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">D</kbd> = Distracteur
                            &nbsp;·&nbsp; <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">Entrée</kbd> = Continuer
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
                        Facile&nbsp;: {DIFFICULTY_CONFIG.facile.trialsCount} items, avance auto 2,5&nbsp;s
                        &nbsp;·&nbsp; Moyen&nbsp;: {DIFFICULTY_CONFIG.moyen.trialsCount} items, avance auto 2&nbsp;s
                        &nbsp;·&nbsp; Difficile&nbsp;: {DIFFICULTY_CONFIG.difficile.trialsCount} items, avance manuelle
                    </p>

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Stimulus ── */}
            {phase === "stimulus" && currentTrial && (
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Catégorie cible :
                            </span>
                            <span className="text-base font-bold text-primary-600 dark:text-primary-400">
                                {targetCat}
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums">
                            {current + 1}&nbsp;/&nbsp;{trials.length}
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 shrink-0">
                        <div
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>

                    {/* Word */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-10">
                        <div className="px-12 py-8 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
                            <p className="text-5xl font-bold tracking-wide text-slate-800 dark:text-slate-100 select-none">
                                {currentTrial.word}
                            </p>
                        </div>

                        <div className="flex gap-5">
                            <button
                                onClick={() => handleResponse("cible")}
                                className="flex flex-col items-center w-36 py-3.5 rounded-xl border-2 border-primary-400 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold transition-all duration-100 shadow"
                            >
                                <span className="text-lg">🎯</span>
                                <span className="text-base mt-0.5">Cible</span>
                                <span className="text-xs opacity-70">C / Espace</span>
                            </button>
                            <button
                                onClick={() => handleResponse("distracteur")}
                                className="flex flex-col items-center w-36 py-3.5 rounded-xl border-2 border-slate-400 bg-slate-500 hover:bg-slate-600 active:scale-95 text-white font-bold transition-all duration-100 shadow"
                            >
                                <span className="text-lg">🚫</span>
                                <span className="text-base mt-0.5">Distracteur</span>
                                <span className="text-xs opacity-70">D</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Feedback ── */}
            {phase === "feedback" && currentTrial && (
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Feedback immédiat
                        </span>
                        <span className="text-xs text-slate-400 tabular-nums">
                            {current + 1}&nbsp;/&nbsp;{trials.length}
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 shrink-0">
                        <div
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${((current + 1) / trials.length) * 100}%` }}
                        />
                    </div>

                    {/* Feedback panel */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">

                        {/* Word recalled */}
                        <p className="text-2xl font-bold font-mono text-slate-500 dark:text-slate-400 tracking-widest">
                            {currentTrial.word}
                        </p>

                        {/* Main feedback block */}
                        <div className={`w-full max-w-md rounded-2xl border-2 px-6 py-6 text-center shadow-md transition-all duration-200 ${
                            lastCorrect
                                ? "border-green-400 bg-green-50 dark:bg-green-900/30"
                                : "border-red-400 bg-red-50 dark:bg-red-900/30"
                        }`}>
                            {/* Icon */}
                            <p className={`text-5xl mb-3 ${lastCorrect ? "text-green-500" : "text-red-500"}`}>
                                {lastCorrect ? "✓" : "✗"}
                            </p>

                            {/* Verdict */}
                            <p className={`text-xl font-bold mb-3 ${
                                lastCorrect
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-red-700 dark:text-red-300"
                            }`}>
                                {lastCorrect ? "Bonne réponse !" : "Erreur de sélection"}
                            </p>

                            {/* Explanatory sentence — the core of this exercise */}
                            {cfg.showFeedbackHint && (
                                <p className={`text-sm leading-relaxed ${
                                    lastCorrect
                                        ? "text-green-800 dark:text-green-200"
                                        : "text-red-800 dark:text-red-200"
                                }`}>
                                    {feedbackMsg}
                                </p>
                            )}

                            {/* Correct answer reminder on error */}
                            {!lastCorrect && (
                                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-700">
                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide mb-1">
                                        Réponse correcte
                                    </p>
                                    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                                        currentTrial.isTarget
                                            ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700"
                                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-500"
                                    }`}>
                                        {currentTrial.isTarget ? "🎯 Cible" : "🚫 Distracteur"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Continue button */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => advance(current + 1)}
                                className={`px-8 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 text-white shadow ${
                                    lastCorrect
                                        ? "bg-green-500 hover:bg-green-600"
                                        : "bg-red-500 hover:bg-red-600"
                                }`}
                            >
                                {current + 1 < trials.length ? "Continuer →" : "Voir les résultats"}
                                <span className="ml-2 text-xs opacity-70">Entrée</span>
                            </button>
                            {cfg.feedbackAutoMs > 0 && countdown > 0 && (
                                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                                    avance dans {countdown}&nbsp;s
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Score header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex-wrap gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            Résultats — catégorie : {targetCat}
                        </span>
                        <div className="flex gap-4 text-sm flex-wrap">
                            <span className="text-green-600 dark:text-green-400 font-medium">✓ Hits&nbsp;: {hits}/{targets.length}</span>
                            <span className="text-amber-500 font-medium">◌ Manqués&nbsp;: {misses}</span>
                            <span className="text-red-400 font-medium">✗ Faux pos.&nbsp;: {falseAlarms}</span>
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
                                className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                            >
                                Recommencer
                            </button>
                        </div>
                    </div>

                    {/* Trial review */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-wrap gap-2">
                            {trials.map((t, i) => {
                                const bg = t.correct
                                    ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
                                    : "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300";
                                return (
                                    <div
                                        key={i}
                                        title={`Réponse : ${t.response ?? "—"} · Correct : ${t.isTarget ? "Cible" : "Distracteur"}`}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-sm font-medium ${bg}`}
                                    >
                                        <span className="text-xs">{t.correct ? "✓" : "✗"}</span>
                                        {t.word}
                                        {t.isTarget && (
                                            <span className="text-xs opacity-50">🎯</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                            🎯 = cible · Vert = correct · Rouge = erreur · Survolez pour les détails
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type Response   = "oui" | "non" | "timeout";

interface Trial {
    word:         string;
    isTarget:     boolean;
    response:     Response | null;
    correct:      boolean | null;
    reactionTime: number | null;
}

// ─── Word banks ────────────────────────────────────────────────────────────────

const WORD_BANKS: Record<string, string[]> = {
    Animaux:     ["chien", "chat", "lion", "tigre", "aigle", "dauphin", "lapin", "ours",
                  "renard", "loup", "serpent", "hibou", "singe", "baleine", "girafe",
                  "zèbre", "panthère", "lynx", "coyote", "vautour"],
    Fruits:      ["pomme", "banane", "fraise", "cerise", "raisin", "orange", "poire",
                  "melon", "kiwi", "mangue", "pêche", "prune", "abricot", "ananas", "citron",
                  "figue", "litchi", "papaye", "grenade", "coco"],
    Légumes:     ["carotte", "tomate", "poireau", "courgette", "épinard", "navet",
                  "radis", "oignon", "poivron", "brocoli", "chou", "haricot", "laitue",
                  "pois", "fenouil", "artichaut", "asperge", "betterave", "endive", "céleri"],
    Couleurs:    ["rouge", "bleu", "vert", "jaune", "violet", "blanc", "noir", "rose",
                  "gris", "brun", "indigo", "turquoise", "beige", "mauve", "écarlate",
                  "cramoisi", "ivoire", "ocre", "bordeaux", "azur"],
    Meubles:     ["table", "chaise", "canapé", "armoire", "bureau", "lit", "étagère",
                  "buffet", "commode", "fauteuil", "bibliothèque", "tabouret", "divan",
                  "bahut", "coffre", "pouf", "secrétaire", "console", "vitrine", "ottomane"],
    Vêtements:   ["chemise", "pantalon", "robe", "veste", "manteau", "chaussure",
                  "chapeau", "cravate", "jean", "pull", "jupe", "écharpe", "gant",
                  "collant", "ceinture", "bonnet", "tablier", "gilet", "pardessus", "imperméable"],
    Instruments: ["piano", "guitare", "violon", "trompette", "flûte", "tambour",
                  "harpe", "accordéon", "saxophone", "contrebasse", "mandoline",
                  "clarinette", "hautbois", "tuba", "cor", "basson", "luth", "banjo", "balalaïka", "cornet"],
};

// ─── Difficulty config ─────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    trialsCount:   number;
    msPerWord:     number;
    empan:         number;
    // Category pairs: [target, ...distractorCategories]
    categorySetup: [string, string[]];
}> = {
    facile: {
        trialsCount: 15, msPerWord: 3000, empan: 3,
        categorySetup: ["Animaux", ["Couleurs", "Meubles"]],
    },
    moyen: {
        trialsCount: 20, msPerWord: 2000, empan: 5,
        categorySetup: ["Fruits", ["Légumes", "Couleurs", "Vêtements"]],
    },
    difficile: {
        trialsCount: 25, msPerWord: 1200, empan: 7,
        categorySetup: ["Instruments", ["Meubles", "Vêtements", "Animaux", "Fruits"]],
    },
};

// ─── Trial builder ─────────────────────────────────────────────────────────────

function buildTrials(diff: Difficulty): { trials: Trial[]; category: string } {
    const cfg = DIFFICULTY_CONFIG[diff];
    const [targetCat, distractorCats] = cfg.categorySetup;
    const targetWords    = [...WORD_BANKS[targetCat]];
    const distractorPool: string[] = distractorCats.flatMap(c => WORD_BANKS[c]);

    const targetCount     = Math.round(cfg.trialsCount * 0.45);
    const distractorCount = cfg.trialsCount - targetCount;

    const shuffle = <T,>(arr: T[]): T[] => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const targets     = shuffle(targetWords).slice(0, targetCount)
        .map(w => ({ word: w, isTarget: true,  response: null, correct: null, reactionTime: null }));
    const distractors = shuffle(distractorPool).slice(0, distractorCount)
        .map(w => ({ word: w, isTarget: false, response: null, correct: null, reactionTime: null }));

    return { trials: shuffle([...targets, ...distractors]), category: targetCat };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CategoryRapide({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [category,   setCategory]   = useState("");
    const [trials,     setTrials]     = useState<Trial[]>([]);
    const [current,    setCurrent]    = useState(0);
    const [progress,   setProgress]   = useState(100); // countdown bar %

    const wordStartAt = useRef<number>(0);
    const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cfg = DIFFICULTY_CONFIG[difficulty];

    // ── Clear timers ──────────────────────────────────────────────────────────

    const clearTimers = () => {
        if (timerRef.current)  { clearInterval(timerRef.current);  timerRef.current  = null; }
        if (autoRef.current)   { clearTimeout(autoRef.current);    autoRef.current   = null; }
    };

    useEffect(() => () => clearTimers(), []);

    // ── Start word display ─────────────────────────────────────────────────────

    const startWord = useCallback((idx: number) => {
        clearTimers();
        wordStartAt.current = Date.now();
        setProgress(100);

        // Countdown bar (updates every 50 ms)
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - wordStartAt.current;
            setProgress(Math.max(0, 100 - (elapsed / cfg.msPerWord) * 100));
        }, 50);

        // Auto-advance on timeout
        autoRef.current = setTimeout(() => {
            clearTimers();
            setTrials(prev => {
                const updated = [...prev];
                if (updated[idx].response === null) {
                    updated[idx] = {
                        ...updated[idx],
                        response:     "timeout",
                        correct:      false,
                        reactionTime: cfg.msPerWord,
                    };
                }
                return updated;
            });
            setCurrent(prev => prev + 1);
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
        const { trials: t, category: cat } = buildTrials(diff);
        setTrials(t);
        setCategory(cat);
        setCurrent(0);
        setProgress(100);
        setPhase("playing");
    }, []);

    // ── Handle response ───────────────────────────────────────────────────────

    const handleResponse = useCallback((resp: "oui" | "non") => {
        if (phase !== "playing") return;
        clearTimers();
        const rt = Date.now() - wordStartAt.current;
        setTrials(prev => {
            const updated = [...prev];
            const trial   = updated[current];
            if (!trial || trial.response !== null) return prev;
            const correct = (resp === "oui") === trial.isTarget;
            updated[current] = { ...trial, response: resp, correct, reactionTime: rt };
            return updated;
        });
        setCurrent(prev => prev + 1);
    }, [phase, current]);

    // ── Keyboard support ──────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "playing") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === " " || e.key === "o" || e.key === "O") handleResponse("oui");
            if (e.key === "n"  || e.key === "N")                  handleResponse("non");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [phase, handleResponse]);

    // ── Save score ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || trials.length === 0) return;
        const targets    = trials.filter(t => t.isTarget);
        const hits       = targets.filter(t => t.response === "oui").length;
        const falseAlarms = trials.filter(t => !t.isTarget && t.response === "oui").length;
        const raw        = ((hits - falseAlarms) / targets.length) * 100;
        const score      = Math.max(0, Math.round(raw));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Catégorisation rapide",
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
    };

    // ── Computed stats ────────────────────────────────────────────────────────

    const done        = trials.filter(t => t.response !== null);
    const hits        = done.filter(t => t.isTarget  && t.response === "oui").length;
    const misses      = done.filter(t => t.isTarget  && t.response !== "oui").length;
    const falseAlarms = done.filter(t => !t.isTarget && t.response === "oui").length;
    const correct     = done.filter(t => t.correct).length;
    const accuracy    = trials.length > 0 ? Math.round((correct / trials.length) * 100) : 0;
    const avgRt       = done.length > 0
        ? Math.round(done.reduce((s, t) => s + (t.reactionTime ?? 0), 0) / done.length)
        : 0;
    const targets     = trials.filter(t => t.isTarget);
    const hitsF       = targets.filter(t => t.response === "oui").length;
    const faF         = trials.filter(t => !t.isTarget && t.response === "oui").length;
    const score       = trials.length > 0
        ? Math.max(0, Math.round(((hitsF - faF) / (targets.length || 1)) * 100))
        : 0;

    const currentTrial = trials[current];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Une <strong>catégorie cible</strong> est affichée en haut.<br />
                        Des mots apparaissent un à un : cliquez <strong>OUI</strong> si le mot
                        appartient à la catégorie, <strong>NON</strong> sinon.<br />
                        <span className="text-xs text-slate-400">
                            Raccourcis : <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-xs font-mono">Espace</kbd> ou <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-xs font-mono">O</kbd> = OUI
                            · <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-xs font-mono">N</kbd> = NON
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
                        Facile&nbsp;: 15 mots, 3&nbsp;s · Moyen&nbsp;: 20 mots, 2&nbsp;s · Difficile&nbsp;: 25 mots, 1,2&nbsp;s
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
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Catégorie :
                            </span>
                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                {category}
                            </span>
                        </div>
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
                        <p className="text-4xl font-bold tracking-wide text-slate-800 dark:text-slate-100 select-none">
                            {currentTrial.word}
                        </p>

                        <div className="flex gap-6">
                            <button
                                onClick={() => handleResponse("oui")}
                                className="w-28 py-3 rounded-xl text-lg font-bold bg-green-500 hover:bg-green-600 active:scale-95 text-white transition-all duration-100 shadow"
                            >
                                OUI
                            </button>
                            <button
                                onClick={() => handleResponse("non")}
                                className="w-28 py-3 rounded-xl text-lg font-bold bg-red-400 hover:bg-red-500 active:scale-95 text-white transition-all duration-100 shadow"
                            >
                                NON
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
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                            Catégorie : <span className="text-primary-600 dark:text-primary-400">{category}</span>
                        </span>
                        <div className="flex gap-4 text-sm flex-wrap">
                            <span className="text-green-600 dark:text-green-400 font-medium">✓ Hits : {hits}</span>
                            <span className="text-amber-500 font-medium">◌ Manqués : {misses}</span>
                            <span className="text-red-400 font-medium">✗ Faux pos. : {falseAlarms}</span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">⏱ ~{avgRt}&nbsp;ms/mot</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-bold ${
                                score >= 80 ? "text-green-600 dark:text-green-400"
                                : score >= 50 ? "text-amber-500"
                                : "text-red-500"
                            }`}>
                                {score}&nbsp;%
                            </span>
                            <span className="text-xs text-slate-400">Précision : {accuracy}&nbsp;%</span>
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
                                if (t.correct)                        bg = "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300";
                                else if (t.response === "timeout")    bg = "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400";
                                else                                  bg = "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300";
                                return (
                                    <div
                                        key={i}
                                        title={`Réponse : ${t.response ?? "—"} · ${t.reactionTime != null ? t.reactionTime + " ms" : ""}`}
                                        className={`px-2 py-1 rounded border text-sm font-medium ${bg}`}
                                    >
                                        {t.word}
                                        {t.isTarget && (
                                            <span className="ml-1 text-xs opacity-60">★</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                            ★ = mot cible · Vert = correct · Rouge = erreur · Gris = délai dépassé
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}

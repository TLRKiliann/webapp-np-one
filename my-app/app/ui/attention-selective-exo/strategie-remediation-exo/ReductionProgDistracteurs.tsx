"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "block-end" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type Response   = "cible" | "distracteur";

interface Trial {
    word:      string;
    isTarget:  boolean;
    response:  Response | null;
    correct:   boolean | null;
}

interface Block {
    blockIndex:      number;    // 0-based
    distractorCount: number;
    trials:          Trial[];
}

// ─── Word banks ────────────────────────────────────────────────────────────────

const BANKS: Record<string, string[]> = {
    Animaux:     ["chien", "chat", "lion", "tigre", "aigle", "dauphin", "lapin", "ours",
                  "renard", "loup", "serpent", "hibou", "singe", "baleine", "girafe",
                  "zèbre", "lynx", "coyote", "vautour", "grenouille", "araignée", "homard",
                  "panthère", "requin", "pieuvre", "crabe", "loutre", "bison", "tapir", "jaguar"],
    Fruits:      ["pomme", "banane", "fraise", "cerise", "raisin", "orange", "poire",
                  "melon", "kiwi", "mangue", "pêche", "prune", "abricot", "ananas", "citron",
                  "figue", "litchi", "papaye", "grenade", "myrtille", "clémentine", "noix",
                  "nectarine", "mirabelle", "pastèque", "datte", "coing", "groseille", "cassis", "brugnon"],
    Légumes:     ["carotte", "tomate", "poireau", "courgette", "épinard", "navet",
                  "radis", "oignon", "poivron", "brocoli", "chou", "haricot", "laitue",
                  "pois", "fenouil", "artichaut", "asperge", "betterave", "céleri", "potiron",
                  "panais", "rutabaga", "topinambour", "endive", "mâche", "roquette", "ciboulette"],
    Couleurs:    ["rouge", "bleu", "vert", "jaune", "violet", "blanc", "noir", "rose",
                  "gris", "brun", "indigo", "turquoise", "beige", "mauve", "écarlate",
                  "cramoisi", "ivoire", "ocre", "bordeaux", "azur", "saumon", "corail",
                  "chartreuse", "magenta", "kaki", "olive", "lilas", "taupe"],
    Meubles:     ["table", "chaise", "canapé", "armoire", "bureau", "lit", "étagère",
                  "buffet", "commode", "fauteuil", "bibliothèque", "tabouret", "divan",
                  "bahut", "coffre", "pouf", "secrétaire", "console", "vitrine", "ottomane",
                  "bonheur", "crédence", "banquette", "méridienne", "guéridon", "trumeau"],
    Instruments: ["piano", "guitare", "violon", "trompette", "flûte", "tambour",
                  "harpe", "accordéon", "saxophone", "contrebasse", "mandoline",
                  "clarinette", "hautbois", "tuba", "cor", "basson", "luth", "banjo",
                  "cornet", "cymbalum", "viole", "clavecin", "orgue", "dulcimer", "sitar", "balalaïka"],
    Vêtements:   ["chemise", "pantalon", "robe", "veste", "manteau", "chaussure",
                  "chapeau", "cravate", "jean", "pull", "jupe", "écharpe", "gant",
                  "collant", "ceinture", "bonnet", "tablier", "gilet", "imperméable", "pardessus",
                  "salopette", "tunique", "blouson", "trench", "kimono", "soutane"],
};

// ─── Difficulty config ─────────────────────────────────────────────────────────
// blocksDistractors: number of distractors per block (blocks = array length)
// wordsPerBlock: total words shown per block (targets + distractors)

const DIFFICULTY_CONFIG: Record<Difficulty, {
    targetCat:          string;
    distractorCats:     string[];
    wordsPerBlock:      number;
    blocksDistractors:  number[];   // one entry per block
    empan:              number;
}> = {
    facile: {
        targetCat: "Animaux",
        distractorCats: ["Couleurs", "Meubles"],
        wordsPerBlock: 6,
        blocksDistractors: [0, 1, 2, 3],   // 4 blocs
        empan: 3,
    },
    moyen: {
        targetCat: "Fruits",
        distractorCats: ["Légumes", "Couleurs"],
        wordsPerBlock: 6,
        blocksDistractors: [0, 2, 3, 5],   // 4 blocs, legumes = catégorie proche
        empan: 5,
    },
    difficile: {
        targetCat: "Instruments",
        distractorCats: ["Meubles", "Vêtements", "Animaux"],
        wordsPerBlock: 6,
        blocksDistractors: [0, 2, 4, 5, 6],   // 5 blocs jusqu'à quasi-total
        empan: 7,
    },
};

// ─── Block builder ─────────────────────────────────────────────────────────────

function buildBlocks(diff: Difficulty): { blocks: Block[]; targetCat: string } {
    const cfg         = DIFFICULTY_CONFIG[diff];
    const targetPool  = shuffle([...BANKS[cfg.targetCat]]);
    const distrPool   = shuffle(cfg.distractorCats.flatMap(c => BANKS[c]));
    let targetIdx = 0;
    let distrIdx  = 0;

    const blocks: Block[] = cfg.blocksDistractors.map((distractorCount, i) => {
        const targetCount = cfg.wordsPerBlock - distractorCount;
        const targets     = targetPool.slice(targetIdx, targetIdx + targetCount)
            .map(w => ({ word: w, isTarget: true,  response: null, correct: null }));
        const distrs      = distrPool.slice(distrIdx, distrIdx + distractorCount)
            .map(w => ({ word: w, isTarget: false, response: null, correct: null }));
        targetIdx += targetCount;
        distrIdx  += distractorCount;

        return {
            blockIndex:      i,
            distractorCount,
            trials:          shuffle([...targets, ...distrs]),
        };
    });

    return { blocks, targetCat: cfg.targetCat };
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Distractor gauge dots ────────────────────────────────────────────────────

function DistractorGauge({ distractorCount, total, size = "md" }: {
    distractorCount: number;
    total: number;
    size?: "sm" | "md";
}) {
    const dotSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
    return (
        <div className="flex gap-1 items-center">
            {Array.from({ length: total }).map((_, i) => (
                <span
                    key={i}
                    className={`${dotSize} rounded-full border transition-colors duration-300 ${
                        i < distractorCount
                            ? "bg-red-400 border-red-500"
                            : "bg-primary-400 border-primary-500"
                    }`}
                />
            ))}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReductionProgDistracteurs({ patientId }: { patientId: string | null }) {
    const [phase,       setPhase]       = useState<Phase>("idle");
    const [difficulty,  setDifficulty]  = useState<Difficulty>("facile");
    const [blocks,      setBlocks]      = useState<Block[]>([]);
    const [targetCat,   setTargetCat]   = useState("");
    const [blockIdx,    setBlockIdx]    = useState(0);
    const [trialIdx,    setTrialIdx]    = useState(0);
    const [feedback,    setFeedback]    = useState<"correct" | "wrong" | null>(null);

    const fbRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearFb = () => { if (fbRef.current) { clearTimeout(fbRef.current); fbRef.current = null; } };
    useEffect(() => () => clearFb(), []);

    // ── Start ─────────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        const { blocks: b, targetCat: cat } = buildBlocks(diff);
        setBlocks(b);
        setTargetCat(cat);
        setBlockIdx(0);
        setTrialIdx(0);
        setFeedback(null);
        setPhase("playing");
    }, []);

    // ── Handle response ───────────────────────────────────────────────────────

    const handleResponse = useCallback((resp: Response) => {
        if (phase !== "playing") return;
        clearFb();

        const trial   = blocks[blockIdx]?.trials[trialIdx];
        if (!trial || trial.response !== null) return;

        const correct = (resp === "cible") === trial.isTarget;

        setBlocks(prev => {
            const updated = prev.map((b, bi) =>
                bi !== blockIdx ? b : {
                    ...b,
                    trials: b.trials.map((t, ti) =>
                        ti !== trialIdx ? t : { ...t, response: resp, correct }
                    ),
                }
            );
            return updated;
        });

        setFeedback(correct ? "correct" : "wrong");

        fbRef.current = setTimeout(() => {
            setFeedback(null);
            const nextTrial = trialIdx + 1;
            const block     = blocks[blockIdx];
            if (nextTrial >= block.trials.length) {
                // End of block
                const nextBlock = blockIdx + 1;
                if (nextBlock >= blocks.length) {
                    setPhase("finished");
                } else {
                    setPhase("block-end");
                }
            } else {
                setTrialIdx(nextTrial);
            }
        }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, blocks, blockIdx, trialIdx]);

    // ── Keyboard support ──────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "playing") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "c" || e.key === "C" || e.key === " ") handleResponse("cible");
            if (e.key === "d" || e.key === "D")                  handleResponse("distracteur");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [phase, handleResponse]);

    // ── Block transition ──────────────────────────────────────────────────────

    const goNextBlock = () => {
        const next = blockIdx + 1;
        setBlockIdx(next);
        setTrialIdx(0);
        setFeedback(null);
        setPhase("playing");
    };

    // ── Save score ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || blocks.length === 0) return;
        const allTrials   = blocks.flatMap(b => b.trials);
        const targets     = allTrials.filter(t => t.isTarget);
        const hits        = targets.filter(t => t.response === "cible").length;
        const falseAlarms = allTrials.filter(t => !t.isTarget && t.response === "cible").length;
        const raw         = ((hits - falseAlarms) / targets.length) * 100;
        const score       = Math.max(0, Math.round(raw));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Réduction progressive des distracteurs",
                domaine:  "attention-selective",
                score,
                empan:    DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const reset = () => {
        clearFb();
        setPhase("idle");
        setBlocks([]);
        setBlockIdx(0);
        setTrialIdx(0);
        setFeedback(null);
    };

    // ── Stats helpers ─────────────────────────────────────────────────────────

    const cfg          = DIFFICULTY_CONFIG[difficulty];
    const currentBlock = blocks[blockIdx];
    const currentTrial = currentBlock?.trials[trialIdx];
    const totalBlocks  = blocks.length;

    function blockScore(b: Block) {
        const done   = b.trials.filter(t => t.response !== null);
        const ok     = done.filter(t => t.correct).length;
        return done.length > 0 ? Math.round((ok / done.length) * 100) : null;
    }

    const allTrials   = blocks.flatMap(b => b.trials);
    const globalHits  = allTrials.filter(t => t.isTarget && t.response === "cible").length;
    const globalFa    = allTrials.filter(t => !t.isTarget && t.response === "cible").length;
    const globalTgt   = allTrials.filter(t => t.isTarget).length;
    const globalScore = globalTgt > 0
        ? Math.max(0, Math.round(((globalHits - globalFa) / globalTgt) * 100))
        : 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <div className="max-w-md space-y-3">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            L'exercice se déroule en <strong>blocs progressifs</strong>.<br />
                            Le premier bloc ne contient <strong>aucun distracteur</strong> : tous les mots
                            appartiennent à la catégorie cible.<br />
                            Chaque bloc suivant introduit <strong>davantage de distracteurs</strong> à filtrer.
                        </p>

                        {/* Visual preview of progression */}
                        <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left">
                            {DIFFICULTY_CONFIG[difficulty].blocksDistractors.map((d, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400 w-14 shrink-0">Bloc {i + 1}</span>
                                    <DistractorGauge
                                        distractorCount={d}
                                        total={DIFFICULTY_CONFIG[difficulty].wordsPerBlock}
                                        size="sm"
                                    />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {d === 0
                                            ? "aucun distracteur"
                                            : `${d} distracteur${d > 1 ? "s" : ""}`}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Raccourcis : <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">C</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">Espace</kbd> = Cible
                            &nbsp;·&nbsp; <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">D</kbd> = Distracteur
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
                        Facile&nbsp;: Animaux vs Couleurs/Meubles, 4 blocs
                        &nbsp;·&nbsp; Moyen&nbsp;: Fruits vs Légumes (catégorie proche), 4 blocs
                        &nbsp;·&nbsp; Difficile&nbsp;: Instruments, 5 blocs jusqu'à saturation
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
            {phase === "playing" && currentBlock && currentTrial && (
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 gap-4 flex-wrap">
                        {/* Block info */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
                                Bloc {blockIdx + 1}/{totalBlocks}
                            </span>
                            <DistractorGauge
                                distractorCount={currentBlock.distractorCount}
                                total={cfg.wordsPerBlock}
                                size="sm"
                            />
                        </div>
                        {/* Category */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 dark:text-slate-500">Cible :</span>
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{targetCat}</span>
                        </div>
                        {/* Trial in block */}
                        <span className="text-xs text-slate-400 tabular-nums">
                            {trialIdx + 1}&nbsp;/&nbsp;{currentBlock.trials.length}
                        </span>
                    </div>

                    {/* Block progress bar */}
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 shrink-0">
                        <div
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${((trialIdx) / currentBlock.trials.length) * 100}%` }}
                        />
                    </div>

                    {/* Distractor info banner (changes each block) */}
                    <div className={`px-4 py-1.5 text-xs font-medium text-center shrink-0 transition-colors duration-500 ${
                        currentBlock.distractorCount === 0
                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                            : currentBlock.distractorCount <= cfg.wordsPerBlock / 3
                            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    }`}>
                        {currentBlock.distractorCount === 0
                            ? "Aucun distracteur — tous les mots sont des cibles"
                            : `${currentBlock.distractorCount} distracteur${currentBlock.distractorCount > 1 ? "s" : ""} sur ${cfg.wordsPerBlock} mots — filtrez les intrus !`}
                    </div>

                    {/* Word display */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-10">
                        <div className={`px-12 py-8 rounded-2xl border-2 text-center transition-colors duration-200 ${
                            feedback === "correct" ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                            : feedback === "wrong"  ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                            : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                        }`}>
                            <p className="text-5xl font-bold tracking-wide text-slate-800 dark:text-slate-100 select-none">
                                {currentTrial.word}
                            </p>
                            {feedback && (
                                <p className={`mt-3 text-lg font-bold ${feedback === "correct" ? "text-green-500" : "text-red-500"}`}>
                                    {feedback === "correct" ? "✓" : "✗"}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-5">
                            <button
                                onClick={() => handleResponse("cible")}
                                disabled={feedback !== null}
                                className="flex flex-col items-center w-36 py-3.5 rounded-xl border-2 border-primary-400 bg-primary-500 hover:bg-primary-600 active:scale-95 disabled:opacity-50 text-white font-bold transition-all duration-100 shadow"
                            >
                                <span className="text-lg">🎯</span>
                                <span className="text-base mt-0.5">Cible</span>
                                <span className="text-xs opacity-70">C / Espace</span>
                            </button>
                            <button
                                onClick={() => handleResponse("distracteur")}
                                disabled={feedback !== null}
                                className="flex flex-col items-center w-36 py-3.5 rounded-xl border-2 border-slate-400 bg-slate-500 hover:bg-slate-600 active:scale-95 disabled:opacity-50 text-white font-bold transition-all duration-100 shadow"
                            >
                                <span className="text-lg">🚫</span>
                                <span className="text-base mt-0.5">Distracteur</span>
                                <span className="text-xs opacity-70">D</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Block end ── */}
            {phase === "block-end" && currentBlock && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">

                    {/* Block result */}
                    <div className="w-full max-w-sm space-y-2">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Bloc {blockIdx + 1} terminé
                        </p>
                        {(() => {
                            const sc = blockScore(currentBlock);
                            return (
                                <p className={`text-4xl font-bold ${
                                    sc === null ? "text-slate-400"
                                    : sc >= 80 ? "text-green-600 dark:text-green-400"
                                    : sc >= 50 ? "text-amber-500"
                                    : "text-red-500"
                                }`}>
                                    {sc !== null ? `${sc} %` : "—"}
                                </p>
                            );
                        })()}
                        <div className="flex justify-center gap-1 mt-1">
                            {currentBlock.trials.map((t, i) => (
                                <span
                                    key={i}
                                    className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                                        t.correct
                                            ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                                            : "bg-red-100 dark:bg-red-900/40 text-red-500"
                                    }`}
                                >
                                    {t.correct ? "✓" : "✗"}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Next block preview */}
                    {blocks[blockIdx + 1] && (() => {
                        const next = blocks[blockIdx + 1];
                        return (
                            <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-800 rounded-xl px-5 py-4 space-y-2">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Prochain bloc — Bloc {blockIdx + 2}/{totalBlocks}
                                </p>
                                <div className="flex items-center gap-3 justify-center">
                                    <DistractorGauge
                                        distractorCount={next.distractorCount}
                                        total={cfg.wordsPerBlock}
                                    />
                                </div>
                                <p className={`text-sm font-medium ${
                                    next.distractorCount === 0
                                        ? "text-primary-600 dark:text-primary-400"
                                        : next.distractorCount <= cfg.wordsPerBlock / 3
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-red-600 dark:text-red-400"
                                }`}>
                                    {next.distractorCount === 0
                                        ? "Aucun distracteur"
                                        : `${next.distractorCount} distracteur${next.distractorCount > 1 ? "s" : ""} sur ${cfg.wordsPerBlock} mots`}
                                </p>
                            </div>
                        );
                    })()}

                    <button
                        onClick={goNextBlock}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Bloc suivant →
                    </button>
                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Score header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex-wrap gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            Résultats — {targetCat}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-bold ${
                                globalScore >= 80 ? "text-green-600 dark:text-green-400"
                                : globalScore >= 50 ? "text-amber-500"
                                : "text-red-500"
                            }`}>
                                {globalScore}&nbsp;%
                            </span>
                            <button
                                onClick={reset}
                                className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                            >
                                Recommencer
                            </button>
                        </div>
                    </div>

                    {/* Per-block summary */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {blocks.map((b, bi) => {
                            const sc = blockScore(b);
                            return (
                                <div key={bi} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    {/* Block header */}
                                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                Bloc {bi + 1}
                                            </span>
                                            <DistractorGauge distractorCount={b.distractorCount} total={cfg.wordsPerBlock} size="sm" />
                                            <span className="text-xs text-slate-400">
                                                {b.distractorCount === 0 ? "0 distracteur" : `${b.distractorCount} distracteur${b.distractorCount > 1 ? "s" : ""}`}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-bold ${
                                            sc === null ? "text-slate-400"
                                            : sc >= 80 ? "text-green-600 dark:text-green-400"
                                            : sc >= 50 ? "text-amber-500"
                                            : "text-red-500"
                                        }`}>
                                            {sc !== null ? `${sc} %` : "—"}
                                        </span>
                                    </div>
                                    {/* Trials */}
                                    <div className="flex flex-wrap gap-1.5 px-4 py-2.5">
                                        {b.trials.map((t, ti) => (
                                            <span
                                                key={ti}
                                                title={`Réponse : ${t.response} · Attendu : ${t.isTarget ? "Cible" : "Distracteur"}`}
                                                className={`px-2 py-0.5 rounded border text-xs font-medium ${
                                                    t.correct
                                                        ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
                                                        : "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                                                }`}
                                            >
                                                {t.correct ? "✓" : "✗"} {t.word}
                                                {t.isTarget && <span className="opacity-50 ml-0.5">🎯</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
}

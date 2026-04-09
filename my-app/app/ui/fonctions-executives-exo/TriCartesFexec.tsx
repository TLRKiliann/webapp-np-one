"use client";

import { useState, useRef, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

// ── Types ─────────────────────────────────────────────────────────────────────

type Color      = "red" | "green" | "blue" | "yellow";
type Shape      = "triangle" | "star" | "cross" | "circle";
type Rule       = "color" | "shape" | "number";
type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface Card { color: Color; shape: Shape; number: 1 | 2 | 3 | 4 }

// ── Constants ─────────────────────────────────────────────────────────────────

// The 4 reference cards shown permanently at the top.
// Each has a unique color, shape and number — guarantees exactly one correct
// answer per rule for any deck card.
const KEY_CARDS: Card[] = [
    { color: "red",    shape: "triangle", number: 1 },
    { color: "green",  shape: "star",     number: 2 },
    { color: "blue",   shape: "cross",    number: 3 },
    { color: "yellow", shape: "circle",   number: 4 },
];

const SHAPE_SYMBOL: Record<Shape, string> = {
    triangle: "▲",
    star:     "★",
    cross:    "✚",
    circle:   "●",
};

const COLOR_CLS: Record<Color, { text: string; border: string; bg: string }> = {
    red:    { text: "text-red-500 dark:text-red-400",     border: "border-red-500 dark:border-red-400",     bg: "bg-red-50    dark:bg-red-950/30"    },
    green:  { text: "text-green-500 dark:text-green-400", border: "border-green-500 dark:border-green-400", bg: "bg-green-50  dark:bg-green-950/30"  },
    blue:   { text: "text-blue-500 dark:text-blue-400",   border: "border-blue-500 dark:border-blue-400",   bg: "bg-blue-50   dark:bg-blue-950/30"   },
    yellow: { text: "text-yellow-500 dark:text-yellow-400", border: "border-yellow-500 dark:border-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
};

// How many consecutive correct sorts trigger a rule change per difficulty
const CONSEC_NEEDED: Record<Difficulty, number> = { facile: 5, moyen: 8, difficile: 10 };
// Total deck size per difficulty
const DECK_SIZE:     Record<Difficulty, number> = { facile: 24, moyen: 48, difficile: 64 };
// Show current rule as a hint (facile only)
const SHOW_HINT:     Record<Difficulty, boolean> = { facile: true, moyen: false, difficile: false };

const ALL_RULES: Rule[] = ["color", "shape", "number"];
const RULE_LABEL: Record<Rule, string> = { color: "Couleur", shape: "Forme", number: "Nombre" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickRule(): Rule {
    return ALL_RULES[Math.floor(Math.random() * 3)];
}

function rotateRule(current: Rule): Rule {
    const others = ALL_RULES.filter(r => r !== current);
    return others[Math.floor(Math.random() * 2)];
}

function makeDeck(n: number): Card[] {
    const colors:  Color[]     = ["red", "green", "blue", "yellow"];
    const shapes:  Shape[]     = ["triangle", "star", "cross", "circle"];
    const nums:    (1|2|3|4)[] = [1, 2, 3, 4];
    return Array.from({ length: n }, () => ({
        color:  colors[Math.floor(Math.random() * 4)],
        shape:  shapes[Math.floor(Math.random() * 4)],
        number: nums[Math.floor(Math.random() * 4)],
    }));
}

function correctKeyIdx(card: Card, rule: Rule): number {
    if (rule === "color")  return KEY_CARDS.findIndex(k => k.color  === card.color);
    if (rule === "shape")  return KEY_CARDS.findIndex(k => k.shape  === card.shape);
    return                        KEY_CARDS.findIndex(k => k.number === card.number);
}

// ── Card face component ───────────────────────────────────────────────────────

function CardFace({ card, variant }: {
    card: Card;
    variant: "key" | "current" | "mini";
}) {
    const cls = COLOR_CLS[card.color];
    const sym = SHAPE_SYMBOL[card.shape];

    const outer: Record<typeof variant, string> = {
        key:     "w-[72px] h-[96px] text-xl  gap-0.5 rounded-xl  border-2",
        current: "w-[88px] h-[116px] text-2xl gap-1   rounded-2xl border-4 shadow-lg",
        mini:    "w-10     h-14      text-xs  gap-0   rounded-lg  border",
    };

    return (
        <div className={`flex flex-col items-center justify-center ${cls.border} ${cls.bg} bg-white dark:bg-slate-800 ${outer[variant]}`}>
            {Array.from({ length: card.number }).map((_, i) => (
                <span key={i} className={`${cls.text} leading-tight font-bold`}>{sym}</span>
            ))}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TriCartesFexec({ patientId = null }: { patientId?: string | null }) {

    // ── UI state ──────────────────────────────────────────────────────────────
    const [phase, setPhase]           = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [deck, setDeck]             = useState<Card[]>([]);
    const [deckIdx, setDeckIdx]       = useState(0);
    const [rule, setRule]             = useState<Rule>("color");
    const [consec, setConsec]         = useState(0);
    const [rulesComp, setRulesComp]   = useState(0);
    const [correct, setCorrect]       = useState(0);
    const [errors, setErrors]         = useState(0);
    const [persev, setPersev]         = useState(0);
    const [elapsed, setElapsed]       = useState(0);
    const [feedback, setFeedback]     = useState<"ok" | "rulechange" | "ko" | null>(null);
    const [flashKey, setFlashKey]     = useState<number | null>(null);

    // ── Refs (safe to read inside setTimeout closures) ────────────────────────
    const ruleRef      = useRef<Rule>("color");
    const prevRuleRef  = useRef<Rule | null>(null);
    const deckIdxRef   = useRef(0);
    const consecRef    = useRef(0);
    const rulesCompRef = useRef(0);
    const correctRef   = useRef(0);
    const errorsRef    = useRef(0);
    const persevRef    = useRef(0);
    const lockRef      = useRef(false);
    const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef     = useRef(0);
    const deckRef      = useRef<Card[]>([]);

    // ── End game ──────────────────────────────────────────────────────────────
    const endGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalTime = Math.floor((Date.now() - startRef.current) / 1000);
        setElapsed(finalTime);
        setPhase("finished");
        if (patientId) {
            const score = Math.max(0,
                rulesCompRef.current * 200
                - persevRef.current  * 50
                - errorsRef.current  * 10
            );
            saveScore({
                patientId,
                exercice: "Tri de cartes (WCST adapté)",
                domaine:  "fonctions-executives",
                score,
                empan:    rulesCompRef.current,
            });
        }
    }, [patientId]);

    // ── Start game ────────────────────────────────────────────────────────────
    const startGame = (diff: Difficulty) => {
        const firstRule = pickRule();
        const newDeck   = makeDeck(DECK_SIZE[diff]);

        ruleRef.current      = firstRule;
        prevRuleRef.current  = null;
        deckIdxRef.current   = 0;
        consecRef.current    = 0;
        rulesCompRef.current = 0;
        correctRef.current   = 0;
        errorsRef.current    = 0;
        persevRef.current    = 0;
        lockRef.current      = false;
        deckRef.current      = newDeck;

        setDeck(newDeck);
        setDeckIdx(0);
        setRule(firstRule);
        setConsec(0);
        setRulesComp(0);
        setCorrect(0);
        setErrors(0);
        setPersev(0);
        setFeedback(null);
        setFlashKey(null);
        setElapsed(0);
        setPhase("playing");

        startRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 500);
    };

    // ── Sort a card ───────────────────────────────────────────────────────────
    const handleSort = (keyIdx: number) => {
        if (phase !== "playing" || lockRef.current) return;
        lockRef.current = true;

        const card   = deckRef.current[deckIdxRef.current];
        const right  = correctKeyIdx(card, ruleRef.current);
        const isOk   = keyIdx === right;

        // Perseverative error: patient sorted by the previous (now obsolete) rule
        const isPersev = !isOk
            && prevRuleRef.current !== null
            && keyIdx === correctKeyIdx(card, prevRuleRef.current);

        setFlashKey(isOk ? right : keyIdx);

        if (isOk) {
            correctRef.current++;
            setCorrect(correctRef.current);

            const newConsec = consecRef.current + 1;
            consecRef.current = newConsec;

            if (newConsec >= CONSEC_NEEDED[difficulty]) {
                // ── Rule change ──────────────────────────────────────────────
                rulesCompRef.current++;
                setRulesComp(rulesCompRef.current);

                const oldRule = ruleRef.current;
                const nxtRule = rotateRule(oldRule);
                prevRuleRef.current = oldRule;
                ruleRef.current     = nxtRule;

                setRule(nxtRule);
                consecRef.current = 0;
                setConsec(0);
                setFeedback("rulechange");
            } else {
                setConsec(newConsec);
                setFeedback("ok");
            }
        } else {
            errorsRef.current++;
            setErrors(errorsRef.current);
            if (isPersev) { persevRef.current++; setPersev(persevRef.current); }
            consecRef.current = 0;
            setConsec(0);
            setFeedback("ko");
        }

        const delay = isOk ? 900 : 1300;
        setTimeout(() => {
            setFeedback(null);
            setFlashKey(null);
            const next = deckIdxRef.current + 1;
            deckIdxRef.current = next;
            setDeckIdx(next);
            lockRef.current = false;
            if (next >= deckRef.current.length) endGame();
        }, delay);
    };

    // ── Reset ─────────────────────────────────────────────────────────────────
    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        lockRef.current = false;
        setPhase("idle");
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const formatTime  = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    const total       = DECK_SIZE[difficulty];
    const needed      = CONSEC_NEEDED[difficulty];
    const currentCard = deck[deckIdx] ?? null;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full p-4 gap-2 select-none">

            {/* ── Stats bar ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Temps : <strong className="text-indigo-600 dark:text-indigo-300">{formatTime(elapsed)}</strong></span>
                <span>Corrects : <strong className="text-emerald-600 dark:text-emerald-400">{correct}</strong></span>
                <span>Erreurs : <strong className={errors >= 5 ? "text-red-500" : ""}>{errors}</strong></span>
                <span>Persévératives : <strong className="text-orange-500">{persev}</strong></span>
                <span>Catégories : <strong className="text-teal-600 dark:text-teal-400">{rulesComp}</strong></span>
                {phase === "playing" && (
                    <span className="ml-auto text-slate-400">{deckIdx} / {total}</span>
                )}
            </div>

            {/* ── Main zone ─────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4">

                {/* ══ Idle ════════════════════════════════════════════════════ */}
                {phase === "idle" && (
                    <div className="text-center space-y-5 max-w-lg">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Classez chaque carte en la faisant correspondre à l&apos;une des quatre cartes-clés ci-dessous.<br />
                            La règle de tri (couleur, forme ou nombre) est <strong>secrète</strong> et change sans prévenir
                            après plusieurs bonnes réponses consécutives. Apprenez par l&apos;essai et l&apos;erreur.
                        </p>

                        {/* Mini preview of key cards */}
                        <div className="flex gap-3 justify-center items-end">
                            {KEY_CARDS.map((k, i) => (
                                <CardFace key={i} card={k} variant="mini" />
                            ))}
                        </div>

                        {/* Difficulty selector */}
                        <div className="flex gap-3 justify-center">
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
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Facile : {DECK_SIZE.facile} cartes, règle change après {CONSEC_NEEDED.facile} bonnes (règle visible) ·
                            Moyen : {DECK_SIZE.moyen} cartes, {CONSEC_NEEDED.moyen} bonnes ·
                            Difficile : {DECK_SIZE.difficile} cartes, {CONSEC_NEEDED.difficile} bonnes
                        </p>
                        <button
                            onClick={() => startGame(difficulty)}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {/* ══ Playing ════════════════════════════════════════════════ */}
                {phase === "playing" && currentCard && (
                    <div className="flex flex-col items-center gap-4 w-full max-w-2xl">

                        {/* Rule hint (facile only) */}
                        {SHOW_HINT[difficulty] ? (
                            <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full">
                                Règle actuelle : {RULE_LABEL[rule]}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Trouvez la règle secrète — cliquez sur la carte-clé correspondante
                            </p>
                        )}

                        {/* Key cards (clickable targets) */}
                        <div className="flex gap-4 justify-center">
                            {KEY_CARDS.map((k, i) => {
                                const isGood = flashKey === i && (feedback === "ok" || feedback === "rulechange");
                                const isBad  = flashKey === i && feedback === "ko";
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleSort(i)}
                                        className={`cursor-pointer rounded-xl transition-all duration-150 ${
                                            isGood ? "ring-4 ring-emerald-400 dark:ring-emerald-500 scale-105"
                                          : isBad  ? "ring-4 ring-red-400    dark:ring-red-500    scale-95"
                                          : "hover:scale-105 hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-600"
                                        }`}
                                    >
                                        <CardFace card={k} variant="key" />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Consecutive progress dots */}
                        <div className="flex gap-1.5 items-center" title={`${consec}/${needed} réponses correctes consécutives`}>
                            {Array.from({ length: needed }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                        i < consec
                                            ? "bg-emerald-400 dark:bg-emerald-500 scale-125"
                                            : "bg-slate-200 dark:bg-slate-600"
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Current card to classify */}
                        <CardFace card={currentCard} variant="current" />

                        {/* Feedback message */}
                        <div className="h-6 flex items-center justify-center">
                            {feedback === "ok" && (
                                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                                    Correct !
                                </p>
                            )}
                            {feedback === "rulechange" && (
                                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                    Correct — la règle vient de changer…
                                </p>
                            )}
                            {feedback === "ko" && (
                                <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                                    Incorrect
                                </p>
                            )}
                        </div>

                        <button
                            onClick={reset}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline transition-colors"
                        >
                            Réinitialiser
                        </button>
                    </div>
                )}

                {/* ══ Finished ═══════════════════════════════════════════════ */}
                {phase === "finished" && (
                    <div className="text-center space-y-5 max-w-md">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-left bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 dark:text-slate-400">Catégories réussies</span>
                            <span className="font-bold text-teal-600 dark:text-teal-400">{rulesComp}</span>

                            <span className="text-slate-500 dark:text-slate-400">Réponses correctes</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{correct}</span>

                            <span className="text-slate-500 dark:text-slate-400">Erreurs totales</span>
                            <span className="font-bold text-red-500">{errors}</span>

                            <span className="text-slate-500 dark:text-slate-400">Erreurs persévératives</span>
                            <span className="font-bold text-orange-500">{persev}</span>

                            <span className="text-slate-500 dark:text-slate-400">Temps total</span>
                            <span className="font-bold">{formatTime(elapsed)}</span>
                        </div>

                        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                            Les <strong>erreurs persévératives</strong> indiquent la tendance à continuer
                            d&apos;appliquer une règle devenue obsolète après un changement.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Niveau : <strong className="capitalize">{difficulty}</strong>
                        </p>

                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Recommencer
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

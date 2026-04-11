"use client";

import { useState, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "trialFeedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface Item {
    id:       number;
    x:        number;       // centre % largeur arène
    y:        number;       // centre % hauteur arène
    isTarget: boolean;      // ★ = cible, ● = distracteur
    inWindow: boolean;      // position dans la fenêtre
    clicked:  boolean;
}

interface WindowZone {
    x: number;   // bord gauche %
    y: number;   // bord haut %
    w: number;   // largeur %
    h: number;   // hauteur %
}

interface TrialResult {
    trialNum:     number;
    hits:         number;
    misses:       number;
    falseAlarms:  number;
    validTargets: number;
    score:        number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TOTAL_TRIALS = 5;

const CONFIG: Record<Difficulty, {
    cols:            number;
    rows:            number;
    targetsInWindow: number;
    targetsOutside:  number;
    windowW:         number;
    windowH:         number;
    duration:        number;  // ms
    feedbackDur:     number;  // ms
    empan:           number;
}> = {
    facile:    { cols: 4, rows: 3, targetsInWindow: 4, targetsOutside: 2, windowW: 52, windowH: 56, duration: 8000, feedbackDur: 1500, empan: 3 },
    moyen:     { cols: 5, rows: 3, targetsInWindow: 4, targetsOutside: 3, windowW: 40, windowH: 44, duration: 6000, feedbackDur: 1200, empan: 5 },
    difficile: { cols: 5, rows: 4, targetsInWindow: 4, targetsOutside: 4, windowW: 28, windowH: 34, duration: 5000, feedbackDur: 1000, empan: 7 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArr<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function ptInWindow(px: number, py: number, z: WindowZone): boolean {
    return px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h;
}

function generateWindowZone(difficulty: Difficulty): WindowZone {
    const { windowW: w, windowH: h } = CONFIG[difficulty];
    if (difficulty === "facile") {
        return { x: (100 - w) / 2, y: (100 - h) / 2, w, h };
    }
    const mg = 6;
    return {
        x: mg + Math.random() * (100 - w - mg * 2),
        y: mg + Math.random() * (100 - h - mg * 2),
        w, h,
    };
}

function generateTrialData(difficulty: Difficulty): { items: Item[]; zone: WindowZone } {
    const { cols, rows, targetsInWindow, targetsOutside } = CONFIG[difficulty];
    const zone = generateWindowZone(difficulty);

    const JITTER = 0.35;
    const cw = 100 / cols;
    const ch = 100 / rows;

    const allPos = Array.from({ length: cols * rows }, (_, i) => ({
        x: Math.max(8, Math.min(92, ((i % cols) + 0.5) * cw + (Math.random() - 0.5) * cw * JITTER)),
        y: Math.max(8, Math.min(92, (Math.floor(i / cols) + 0.5) * ch + (Math.random() - 0.5) * ch * JITTER)),
    }));

    const insidePos  = shuffleArr(allPos.filter(p => ptInWindow(p.x, p.y, zone)));
    const outsidePos = shuffleArr(allPos.filter(p => !ptInWindow(p.x, p.y, zone)));

    const nTW = Math.min(targetsInWindow, Math.max(1, insidePos.length - 1));
    const nTO = Math.min(targetsOutside, outsidePos.length);

    let id = 0;
    const items: Item[] = [
        ...insidePos.map((p, i) => ({
            id: id++, x: p.x, y: p.y,
            isTarget: i < nTW, inWindow: true, clicked: false,
        })),
        ...outsidePos.map((p, i) => ({
            id: id++, x: p.x, y: p.y,
            isTarget: i < nTO, inWindow: false, clicked: false,
        })),
    ];

    return { items, zone };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FenetreAttention({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]     = useState<Phase>("idle");
    const [difficulty, setDifficulty]= useState<Difficulty>("facile");
    const [trialIdx,   setTrialIdx]  = useState(0);
    const [zone,       setZone]      = useState<WindowZone | null>(null);
    const [items,      setItems]     = useState<Item[]>([]);
    const [results,    setResults]   = useState<TrialResult[]>([]);
    const [timeLeft,   setTimeLeft]  = useState(0);

    // Three separate refs — never mix them (same bug pattern as Posner).
    // trialTimerRef   : fin du temps imparti par essai
    // feedbackTimerRef: durée d'affichage du feedback inter-essai
    // countdownRef    : intervalle de mise à jour du chrono affiché
    const trialTimerRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
    const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>  | null>(null);
    const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);
    const itemsRef         = useRef<Item[]>([]);
    const trialStartRef    = useRef(0);

    const clearTrialTimer    = () => { if (trialTimerRef.current)    { clearTimeout(trialTimerRef.current);    trialTimerRef.current    = null; } };
    const clearFeedbackTimer = () => { if (feedbackTimerRef.current) { clearTimeout(feedbackTimerRef.current); feedbackTimerRef.current = null; } };
    const clearCountdown     = () => { if (countdownRef.current)     { clearInterval(countdownRef.current);    countdownRef.current     = null; } };
    const clearAll           = () => { clearTrialTimer(); clearFeedbackTimer(); clearCountdown(); };

    // ── Pilotage d'essai (phase "playing") ────────────────────────────────────
    // La séparation des refs évite que le cleanup du useEffect n'annule
    // feedbackTimerRef (même bug que dans ParadigmePosner).

    useEffect(() => {
        if (phase !== "playing") return;

        const { duration, feedbackDur } = CONFIG[difficulty];
        const { items: newItems, zone: newZone } = generateTrialData(difficulty);

        itemsRef.current = newItems;
        setItems(newItems);
        setZone(newZone);
        setTimeLeft(duration);
        trialStartRef.current = Date.now();

        // Countdown display (mis à jour toutes les 100 ms)
        countdownRef.current = setInterval(() => {
            const left = Math.max(0, duration - (Date.now() - trialStartRef.current));
            setTimeLeft(left);
            if (left <= 0) clearCountdown();
        }, 100);

        // Fin du temps imparti — stocké dans trialTimerRef (nettoyé par le cleanup)
        trialTimerRef.current = setTimeout(() => {
            clearCountdown();
            const finalItems  = itemsRef.current;
            const validTargets = finalItems.filter(i => i.isTarget  && i.inWindow).length;
            const hits         = finalItems.filter(i => i.isTarget  && i.inWindow &&  i.clicked).length;
            const falseAlarms  = finalItems.filter(i => !(i.isTarget && i.inWindow) && i.clicked).length;
            const score        = Math.max(0, Math.round(((hits - falseAlarms) / (validTargets || 1)) * 100));

            setResults(prev => [...prev, {
                trialNum: trialIdx + 1,
                hits,
                misses:   validTargets - hits,
                falseAlarms,
                validTargets,
                score,
            }]);
            setItems([...finalItems]);
            setPhase("trialFeedback");

            // Stocké dans feedbackTimerRef — le cleanup du useEffect NE le touche PAS.
            feedbackTimerRef.current = setTimeout(() => {
                feedbackTimerRef.current = null;
                const nextIdx = trialIdx + 1;
                if (nextIdx >= TOTAL_TRIALS) {
                    setPhase("finished");
                } else {
                    setTrialIdx(nextIdx);
                    setPhase("playing");
                }
            }, feedbackDur);

        }, duration);

        // Cleanup : uniquement trialTimerRef et countdownRef
        return () => { clearTrialTimer(); clearCountdown(); };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, trialIdx]);

    useEffect(() => () => clearAll(), []); // eslint-disable-line

    // ── Click sur un item ─────────────────────────────────────────────────────

    const handleItemClick = (id: number) => {
        if (phase !== "playing") return;
        itemsRef.current = itemsRef.current.map(item =>
            item.id === id && !item.clicked ? { ...item, clicked: true } : item
        );
        setItems([...itemsRef.current]);
    };

    // ── Start / Reset ─────────────────────────────────────────────────────────

    const startGame = (diff: Difficulty) => {
        clearAll();
        setDifficulty(diff);
        setTrialIdx(0);
        setResults([]);
        setItems([]);
        setZone(null);
        setPhase("playing");
    };

    const reset = () => {
        clearAll();
        setPhase("idle");
        setTrialIdx(0);
        setResults([]);
        setItems([]);
        setZone(null);
    };

    // ── Save score ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || results.length === 0) return;
        const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Fenêtre attentionnelle",
                domaine:  "attention-selective",
                score:    avg,
                empan:    CONFIG[difficulty].empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // ── Stats (écran final) ───────────────────────────────────────────────────

    const finalScore        = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
    const totalHits         = results.reduce((s, r) => s + r.hits,         0);
    const totalMisses       = results.reduce((s, r) => s + r.misses,       0);
    const totalFalseAlarms  = results.reduce((s, r) => s + r.falseAlarms,  0);
    const totalValidTargets = results.reduce((s, r) => s + r.validTargets, 0);
    const progressPct       = CONFIG[difficulty].duration > 0
        ? (timeLeft / CONFIG[difficulty].duration) * 100
        : 0;

    // ── Styles des items ──────────────────────────────────────────────────────

    function itemClasses(item: Item): { wrap: string; icon: string } {
        const base  = "absolute w-9 h-9 rounded-lg border-2 flex items-center justify-center text-base transition-all duration-75 select-none ";
        const valid = item.isTarget && item.inWindow;

        if (phase === "trialFeedback") {
            if (valid && item.clicked)
                return { wrap: base + "bg-green-100  dark:bg-green-900/50  border-green-400",  icon: "text-green-600  dark:text-green-400" };
            if (valid && !item.clicked)
                return { wrap: base + "bg-amber-100  dark:bg-amber-900/40  border-amber-400",  icon: "text-amber-500  dark:text-amber-300" };
            if (!valid && item.clicked)
                return { wrap: base + "bg-red-100    dark:bg-red-900/40    border-red-400",    icon: "text-red-500" };
            return { wrap: base + "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-40", icon: "text-slate-400" };
        }

        if (item.clicked)
            return { wrap: base + "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 scale-90", icon: "text-emerald-600 dark:text-emerald-400" };
        if (item.isTarget)
            return { wrap: base + "bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-500 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-90", icon: "text-sky-600 dark:text-sky-300" };
        return { wrap: base + "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-90", icon: "text-slate-400 dark:text-slate-500" };
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-lg">
                        <p className="mb-2">
                            Un champ de symboles apparaît avec une{" "}
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">zone encadrée en vert</span>
                            {" "}— la <strong>fenêtre attentionnelle</strong>.<br />
                            Cliquez uniquement sur les{" "}
                            <strong className="text-sky-600 dark:text-sky-400">étoiles ★</strong>{" "}
                            qui se trouvent <strong>dans la zone</strong>.<br />
                            Ignorez les étoiles hors zone et les ronds ● partout.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {TOTAL_TRIALS} essais successifs — la fenêtre change de position à chaque essai.
                        </p>
                    </div>

                    {/* Difficulty cards */}
                    <div className="grid grid-cols-3 gap-3 text-xs text-left max-w-md w-full">
                        {([
                            { d: "facile",    label: "Facile",    desc: "Grande fenêtre · 8 s · 4 cibles",     n: "centrée" },
                            { d: "moyen",     label: "Moyen",     desc: "Fenêtre moyenne · 6 s · 4 cibles",    n: "aléatoire" },
                            { d: "difficile", label: "Difficile", desc: "Petite fenêtre · 5 s · 4 cibles",     n: "aléatoire" },
                        ] as const).map(({ d, label, desc, n }) => (
                            <div
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`rounded-lg border p-2 cursor-pointer transition-colors duration-150 ${
                                    difficulty === d
                                        ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600"
                                        : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-emerald-300"
                                }`}
                            >
                                <p className={`font-semibold mb-0.5 ${difficulty === d ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-200"}`}>
                                    {label}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">{desc}</p>
                                <p className="text-slate-400 dark:text-slate-500 mt-0.5">{n}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Playing / trialFeedback ── */}
            {(phase === "playing" || phase === "trialFeedback") && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Header : progression + chrono */}
                    <div className="px-4 pt-2 pb-1 shrink-0">
                        <div className="flex items-center justify-between mb-1 text-xs text-slate-400 dark:text-slate-500">
                            <span>Essai {trialIdx + 1}&nbsp;/&nbsp;{TOTAL_TRIALS}</span>
                            <span className={phase === "trialFeedback" ? "text-emerald-500 font-semibold" : ""}>
                                {phase === "trialFeedback" ? "✓" : `${Math.ceil(timeLeft / 1000)} s`}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    phase === "trialFeedback"
                                        ? "bg-emerald-400"
                                        : timeLeft < CONFIG[difficulty].duration * 0.25
                                        ? "bg-red-400"
                                        : "bg-emerald-400 dark:bg-emerald-500"
                                }`}
                                style={{ width: `${phase === "trialFeedback" ? 100 : progressPct}%` }}
                            />
                        </div>
                    </div>

                    {/* Consigne */}
                    <div className="px-4 py-1 text-xs text-center text-slate-500 dark:text-slate-400 shrink-0">
                        Cliquez sur les{" "}
                        <strong className="text-sky-600 dark:text-sky-400">★</strong>{" "}
                        dans la{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">zone verte</span>
                    </div>

                    {/* Arène */}
                    <div className="flex-1 relative overflow-hidden mx-4 mb-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/60">

                        {/* Zone fenêtre attentionnelle */}
                        {zone && (
                            <div
                                className="absolute border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-lg pointer-events-none"
                                style={{
                                    left:   `${zone.x}%`,
                                    top:    `${zone.y}%`,
                                    width:  `${zone.w}%`,
                                    height: `${zone.h}%`,
                                }}
                            />
                        )}

                        {/* Items */}
                        {items.map(item => {
                            const { wrap, icon } = itemClasses(item);
                            return (
                                <button
                                    key={item.id}
                                    disabled={phase !== "playing" || item.clicked}
                                    onClick={() => handleItemClick(item.id)}
                                    className={wrap}
                                    style={{
                                        left: `calc(${item.x}% - 18px)`,
                                        top:  `calc(${item.y}% - 18px)`,
                                    }}
                                    aria-label={item.isTarget ? "étoile" : "rond"}
                                >
                                    <span className={icon}>
                                        {item.isTarget ? "★" : "●"}
                                    </span>
                                </button>
                            );
                        })}

                        {/* Résultat flash après chaque essai */}
                        {phase === "trialFeedback" && results.length > 0 && (() => {
                            const r = results[results.length - 1];
                            return (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
                                    <div className="flex gap-4 bg-white/90 dark:bg-slate-800/90 rounded-xl px-4 py-2 shadow-lg text-xs font-medium">
                                        <span className="text-green-600 dark:text-green-400">✓ {r.hits}</span>
                                        <span className="text-amber-500">◌ {r.misses}</span>
                                        <span className="text-red-500">✗ {r.falseAlarms}</span>
                                        <span className={`font-bold ${r.score >= 80 ? "text-green-600" : r.score >= 50 ? "text-amber-500" : "text-red-500"}`}>
                                            {r.score} %
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Header score */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            <span className={`text-3xl font-extrabold ${
                                finalScore >= 80 ? "text-green-600 dark:text-green-400" :
                                finalScore >= 50 ? "text-amber-500" : "text-red-500"
                            }`}>
                                {finalScore}&nbsp;%
                            </span>
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                                <p className="text-green-600 dark:text-green-400">
                                    ✓ Hits&nbsp;: <strong>{totalHits}</strong>&nbsp;/&nbsp;{totalValidTargets}
                                </p>
                                <p className="text-amber-500">◌ Manqués&nbsp;: <strong>{totalMisses}</strong></p>
                                <p className="text-red-400">✗ Fausses alarmes&nbsp;: <strong>{totalFalseAlarms}</strong></p>
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

                        {/* Tableau par essai */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide grid grid-cols-5 gap-2">
                                <span>Essai</span>
                                <span>Cibles</span>
                                <span className="text-green-600 dark:text-green-400">Hits</span>
                                <span className="text-red-400">Fausses al.</span>
                                <span>Score</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {results.map(r => (
                                    <div key={r.trialNum} className="grid grid-cols-5 gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                                        <span>{r.trialNum}</span>
                                        <span>{r.validTargets}</span>
                                        <span className="text-green-600 dark:text-green-400 font-semibold">{r.hits}</span>
                                        <span className="text-red-400 font-semibold">{r.falseAlarms}</span>
                                        <span className={`font-bold ${r.score >= 80 ? "text-green-600 dark:text-green-400" : r.score >= 50 ? "text-amber-500" : "text-red-500"}`}>
                                            {r.score} %
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interprétation */}
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                            <p className="font-semibold mb-1 text-sm">Que mesure cet exercice ?</p>
                            <p>
                                La <strong>fenêtre attentionnelle</strong> désigne la portion de l&apos;espace visuel
                                activement surveillée à un moment donné. Cet exercice entraîne la capacité à{" "}
                                <strong>restreindre et maintenir</strong> le focus attentionnel dans une zone définie,
                                tout en inhibant les stimuli pertinents situés hors de cette zone — une compétence clé
                                dans la réhabilitation de l&apos;attention sélective spatiale.
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

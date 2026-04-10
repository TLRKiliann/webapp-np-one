"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface EventItem {
    id: number;       // stable identity
    icon: string;
    label: string;
    time: string;     // shown only in feedback
    order: number;    // 0-based correct chronological index within the scenario
}

interface RoundResult {
    correct: number;
    total: number;
    score: number;
}

// ─── Day scenarios (10 events each, in strict chronological order) ─────────────

const SCENARIOS: Array<{ name: string; events: Array<{ icon: string; label: string; time: string }> }> = [
    {
        name: "Journée en semaine",
        events: [
            { icon: "🌅", label: "Se réveiller",           time: "7h00"  },
            { icon: "🚿", label: "Prendre sa douche",      time: "7h20"  },
            { icon: "☕", label: "Petit déjeuner",          time: "7h45"  },
            { icon: "🚌", label: "Prendre le bus",          time: "8h30"  },
            { icon: "💼", label: "Arriver au travail",      time: "9h00"  },
            { icon: "🥗", label: "Déjeuner",                time: "12h30" },
            { icon: "🏠", label: "Rentrer à la maison",     time: "18h00" },
            { icon: "🍽️", label: "Préparer le dîner",       time: "19h00" },
            { icon: "📺", label: "Regarder la télévision",  time: "20h30" },
            { icon: "😴", label: "Se coucher",              time: "22h30" },
        ],
    },
    {
        name: "Journée médicale",
        events: [
            { icon: "🌅", label: "Se lever",                   time: "8h00"  },
            { icon: "💊", label: "Prendre les médicaments",    time: "8h15"  },
            { icon: "☕", label: "Petit déjeuner",              time: "8h30"  },
            { icon: "🏥", label: "Aller au rendez-vous médical", time: "10h00" },
            { icon: "🛒", label: "Faire les courses",           time: "11h30" },
            { icon: "🥗", label: "Déjeuner",                    time: "12h30" },
            { icon: "😴", label: "Faire une sieste",            time: "14h00" },
            { icon: "🚶", label: "Aller se promener",           time: "16h00" },
            { icon: "🍽️", label: "Dîner",                       time: "19h30" },
            { icon: "😴", label: "Se coucher",                  time: "21h00" },
        ],
    },
    {
        name: "Week-end en famille",
        events: [
            { icon: "🌅", label: "Réveil tardif",              time: "9h30"  },
            { icon: "☕", label: "Brunch",                      time: "10h30" },
            { icon: "🚗", label: "Partir rendre visite à la famille", time: "11h00" },
            { icon: "🥗", label: "Déjeuner en famille",         time: "13h00" },
            { icon: "🧁", label: "Goûter et gâteau",            time: "16h00" },
            { icon: "📸", label: "Photos de famille",            time: "17h30" },
            { icon: "🚗", label: "Rentrer à la maison",          time: "18h30" },
            { icon: "🍽️", label: "Dîner léger",                  time: "20h00" },
            { icon: "📚", label: "Lire avant de dormir",         time: "21h30" },
            { icon: "😴", label: "Se coucher",                   time: "22h30" },
        ],
    },
    {
        name: "Journée de repos",
        events: [
            { icon: "🌅", label: "Se lever sans réveil",        time: "9h00"  },
            { icon: "☕", label: "Café et lecture du journal",   time: "9h30"  },
            { icon: "🚿", label: "Douche matinale",              time: "10h30" },
            { icon: "🌳", label: "Promenade au parc",            time: "11h00" },
            { icon: "🥗", label: "Déjeuner",                     time: "13h00" },
            { icon: "🎵", label: "Écouter de la musique",        time: "14h30" },
            { icon: "☎️", label: "Appel téléphonique",           time: "16h00" },
            { icon: "🛒", label: "Petites courses",              time: "17h00" },
            { icon: "🍽️", label: "Dîner",                        time: "19h30" },
            { icon: "🎬", label: "Film en soirée",               time: "21h00" },
        ],
    },
    {
        name: "Matin chargé",
        events: [
            { icon: "⏰", label: "Réveil par l'alarme",          time: "6h30"  },
            { icon: "🏃", label: "Footing matinal",              time: "6h45"  },
            { icon: "🚿", label: "Douche",                       time: "7h30"  },
            { icon: "👔", label: "S'habiller",                   time: "7h45"  },
            { icon: "☕", label: "Petit déjeuner rapide",         time: "8h00"  },
            { icon: "🚌", label: "Prendre les transports",        time: "8h20"  },
            { icon: "📬", label: "Lire ses e-mails",             time: "9h00"  },
            { icon: "📋", label: "Réunion du matin",             time: "9h30"  },
            { icon: "☕", label: "Pause café",                    time: "11h00" },
            { icon: "🥗", label: "Déjeuner",                     time: "12h30" },
        ],
    },
];

const DIFFICULTY_CONFIG: Record<Difficulty, {
    eventsPerRound: number;
    rounds: number;
    empan: number;
}> = {
    facile:    { eventsPerRound: 4, rounds: 3, empan: 3 },
    moyen:     { eventsPerRound: 6, rounds: 4, empan: 5 },
    difficile: { eventsPerRound: 8, rounds: 5, empan: 7 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Pick `n` events spread across the scenario (start, middle, end) */
function pickEvents(scenario: typeof SCENARIOS[number], n: number): EventItem[] {
    const total = scenario.events.length;
    const step  = total / n;
    const items: EventItem[] = [];
    for (let i = 0; i < n; i++) {
        const idx = Math.min(Math.floor(i * step + step / 2), total - 1);
        const ev  = scenario.events[idx];
        items.push({ id: i, icon: ev.icon, label: ev.label, time: ev.time, order: i });
    }
    return items;
}

function buildRounds(diff: Difficulty): Array<{ correct: EventItem[]; shuffled: EventItem[] }> {
    const { eventsPerRound, rounds } = DIFFICULTY_CONFIG[diff];
    const scenarioPool = shuffle([...SCENARIOS]).slice(0, rounds);
    return scenarioPool.map(scenario => {
        const correct  = pickEvents(scenario, eventsPerRound);
        let shuffled = shuffle([...correct]);
        // Ensure shuffled !== correct at first position at least (avoid trivial start)
        while (shuffled.length > 1 && shuffled[0].id === correct[0].id) {
            shuffled = shuffle([...correct]);
        }
        return { correct, shuffled };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReorderEvents({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [rounds,     setRounds]     = useState<Array<{ correct: EventItem[]; shuffled: EventItem[] }>>([]);
    const [roundIdx,   setRoundIdx]   = useState(0);
    const [current,    setCurrent]    = useState<EventItem[]>([]);   // current ordering
    const [results,    setResults]    = useState<RoundResult[]>([]);
    const [feedback,   setFeedback]   = useState<boolean[] | null>(null); // per-card correct/wrong

    const totalRounds = rounds.length;

    // ── Start ──────────────────────────────────────────────────────────────────

    const startGame = (diff: Difficulty) => {
        const r = buildRounds(diff);
        setRounds(r);
        setRoundIdx(0);
        setCurrent(r[0].shuffled);
        setResults([]);
        setFeedback(null);
        setPhase("playing");
    };

    // ── Reorder helpers ────────────────────────────────────────────────────────

    const moveUp = useCallback((idx: number) => {
        if (idx === 0) return;
        setCurrent(prev => {
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    }, []);

    const moveDown = useCallback((idx: number) => {
        setCurrent(prev => {
            if (idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
    }, []);

    // ── Validate ───────────────────────────────────────────────────────────────

    const validate = useCallback(() => {
        const correct = rounds[roundIdx].correct;
        const fb = current.map((ev, i) => ev.id === correct[i].id);
        const correctCount = fb.filter(Boolean).length;
        const score = Math.round((correctCount / correct.length) * 100);
        setFeedback(fb);
        setResults(prev => [...prev, { correct: correctCount, total: correct.length, score }]);
        setPhase("feedback");
    }, [current, rounds, roundIdx]);

    // ── Next round ─────────────────────────────────────────────────────────────

    const nextRound = useCallback(() => {
        const next = roundIdx + 1;
        if (next >= totalRounds) {
            // Finished — save score
            const allResults = [...results];
            if (patientId && allResults.length > 0) {
                const avgScore = Math.round(allResults.reduce((s, r) => s + r.score, 0) / allResults.length);
                saveScore({
                    patientId,
                    exercice: "Remise en ordre d'événements",
                    domaine: "orientation-spatiale",
                    score: avgScore,
                    empan: DIFFICULTY_CONFIG[difficulty].empan,
                });
            }
            setPhase("finished");
        } else {
            setRoundIdx(next);
            setCurrent(rounds[next].shuffled);
            setFeedback(null);
            setPhase("playing");
        }
    }, [roundIdx, totalRounds, results, rounds, patientId, difficulty]);

    const reset = () => {
        setPhase("idle");
        setRounds([]);
        setRoundIdx(0);
        setCurrent([]);
        setResults([]);
        setFeedback(null);
    };

    // ── Final stats ────────────────────────────────────────────────────────────

    const finalScore   = results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
        : 0;
    const perfectRounds = results.filter(r => r.score === 100).length;

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full p-4 select-none items-center justify-start overflow-y-auto gap-4">

            {/* ── Écran d'accueil ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 max-w-md text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Des événements d'une journée sont présentés dans un <strong>ordre mélangé</strong>.<br />
                        Utilisez les flèches <span className="font-bold">↑ ↓</span> pour les remettre
                        dans le <strong>bon ordre chronologique</strong>, du matin jusqu'au soir.<br />
                        Validez quand vous êtes prêt.
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
                        Facile : 4 événements, 3 séquences · Moyen : 6 événements, 4 séquences · Difficile : 8 événements, 5 séquences
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Jeu + Feedback ── */}
            {(phase === "playing" || phase === "feedback") && (
                <div className="flex flex-col w-full max-w-sm gap-3">

                    {/* Progression */}
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                            {Array.from({ length: totalRounds }, (_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    i < roundIdx
                                        ? results[i]?.score === 100
                                            ? "bg-green-400 dark:bg-green-500"
                                            : results[i]?.score >= 50
                                                ? "bg-amber-400"
                                                : "bg-red-400 dark:bg-red-500"
                                        : i === roundIdx
                                        ? "bg-primary-400 dark:bg-primary-500"
                                        : "bg-slate-200 dark:bg-slate-700"
                                }`} />
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                            {roundIdx + 1}&nbsp;/&nbsp;{totalRounds}
                        </span>
                    </div>

                    {/* Instruction */}
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">
                        {phase === "playing"
                            ? "Remettez ces événements dans l'ordre chronologique ↓"
                            : feedback
                                ? `${results[roundIdx]?.correct}&nbsp;/&nbsp;${current.length} dans le bon ordre`
                                : ""}
                    </p>

                    {/* Event cards */}
                    <div className="flex flex-col gap-2">
                        {current.map((ev, idx) => {
                            const isCorrect = feedback ? feedback[idx] : null;
                            const correctEv = phase === "feedback" && rounds[roundIdx]
                                ? rounds[roundIdx].correct[idx]
                                : null;

                            let cardBg = "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600";
                            if (isCorrect === true)  cardBg = "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600";
                            if (isCorrect === false) cardBg = "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-500";

                            return (
                                <div key={ev.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors duration-200 ${cardBg}`}>

                                    {/* Position number */}
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-4 text-center shrink-0">
                                        {idx + 1}
                                    </span>

                                    {/* Icon */}
                                    <span className="text-2xl shrink-0">{ev.icon}</span>

                                    {/* Label + feedback info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                            {ev.label}
                                        </p>
                                        {phase === "feedback" && (
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                {ev.time}
                                                {isCorrect === false && correctEv && (
                                                    <span className="text-green-600 dark:text-green-400 ml-1">
                                                        → attendu&nbsp;: {correctEv.icon} {correctEv.label}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    {/* Feedback badge */}
                                    {phase === "feedback" && isCorrect !== null && (
                                        <span className={`text-base shrink-0 ${isCorrect ? "text-green-500" : "text-red-400"}`}>
                                            {isCorrect ? "✓" : "✗"}
                                        </span>
                                    )}

                                    {/* Up / Down arrows */}
                                    {phase === "playing" && (
                                        <div className="flex flex-col gap-0.5 shrink-0">
                                            <button
                                                onClick={() => moveUp(idx)}
                                                disabled={idx === 0}
                                                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-100 text-sm"
                                                aria-label="Monter"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveDown(idx)}
                                                disabled={idx === current.length - 1}
                                                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 disabled:opacity-20 disabled:cursor-not-allowed transition-colors duration-100 text-sm"
                                                aria-label="Descendre"
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Action buttons */}
                    {phase === "playing" && (
                        <button
                            onClick={validate}
                            className="mt-1 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm self-center"
                        >
                            Valider l'ordre
                        </button>
                    )}

                    {phase === "feedback" && (
                        <div className="flex flex-col items-center gap-2 mt-1">
                            <p className={`text-sm font-semibold ${
                                (results[roundIdx]?.score ?? 0) === 100
                                    ? "text-green-600 dark:text-green-400"
                                    : (results[roundIdx]?.score ?? 0) >= 50
                                    ? "text-amber-500"
                                    : "text-red-500"
                            }`}>
                                {(results[roundIdx]?.score ?? 0) === 100
                                    ? "Parfait ! Ordre correct !"
                                    : `Score : ${results[roundIdx]?.score ?? 0} %`}
                            </p>
                            <button
                                onClick={nextRound}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors duration-200"
                            >
                                {roundIdx + 1 >= totalRounds ? "Voir les résultats" : "Séquence suivante →"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Résultats ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-5 max-w-sm text-center w-full">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                    {/* Score circles */}
                    <div className="flex gap-2 justify-center flex-wrap">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                title={`Séquence ${i + 1} : ${r.correct}/${r.total}`}
                                className={`w-10 h-10 rounded-full flex flex-col items-center justify-center text-white text-xs font-bold ${
                                    r.score === 100 ? "bg-green-500" :
                                    r.score >= 50   ? "bg-amber-400" : "bg-red-400"
                                }`}
                            >
                                <span>{r.score}%</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Score moyen :{" "}
                        <strong className={
                            finalScore >= 80 ? "text-green-600 dark:text-green-400" :
                            finalScore >= 50 ? "text-amber-500" : "text-red-500"
                        }>
                            {finalScore}&nbsp;%
                        </strong>
                        {perfectRounds > 0 && (
                            <span className="ml-2 text-green-600 dark:text-green-400">
                                · {perfectRounds} séquence{perfectRounds > 1 ? "s" : ""} parfaite{perfectRounds > 1 ? "s" : ""}
                            </span>
                        )}
                    </p>

                    {/* Détail par séquence */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1.5 text-left w-full max-h-44 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={`shrink-0 font-bold ${r.score === 100 ? "text-green-500" : r.score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                                    {r.score === 100 ? "✓" : r.score >= 50 ? "~" : "✗"}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                    Séquence {i + 1}
                                </span>
                                <span className="ml-auto text-slate-400">
                                    {r.correct}&nbsp;/&nbsp;{r.total} correct{r.correct > 1 ? "s" : ""}
                                    {" "}— <strong>{r.score}&nbsp;%</strong>
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={reset}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Recommencer
                    </button>
                </div>
            )}

        </div>
    );
}

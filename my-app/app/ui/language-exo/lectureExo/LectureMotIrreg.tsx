"use client";

import { useState, useCallback, useEffect } from "react";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type Verdict    = "correct" | "erreur" | "passe";

interface Mot {
    mot:        string;
    phonetique: string;   // prononciation attendue, affichée à la demande
    irregularite: string; // explication courte de l'irrégularité
    niveau:     Difficulty;
}

interface RoundResult {
    mot:     Mot;
    verdict: Verdict;
}

// ─── Mots irréguliers ─────────────────────────────────────────────────────────
// Mots dont la prononciation NE peut PAS être déduite des règles
// graphème-phonème standard du français : ils exigent la voie lexicale.

const MOTS: Mot[] = [
    // ── Facile : mots irréguliers courts et très fréquents ───────────────────
    {
        mot: "FEMME",    phonetique: "/fam/",      niveau: "facile",
        irregularite: "em → /a/ (exception)",
    },
    {
        mot: "FILS",     phonetique: "/fis/",      niveau: "facile",
        irregularite: "l muet",
    },
    {
        mot: "DOIGT",    phonetique: "/dwa/",      niveau: "facile",
        irregularite: "igt muet, oi → /wa/",
    },
    {
        mot: "VINGT",    phonetique: "/vɛ̃/",       niveau: "facile",
        irregularite: "gt muet",
    },
    {
        mot: "AOÛT",     phonetique: "/u/",        niveau: "facile",
        irregularite: "ao → /u/, t muet",
    },
    {
        mot: "TABAC",    phonetique: "/taba/",     niveau: "facile",
        irregularite: "c final muet",
    },
    {
        mot: "CERF",     phonetique: "/sɛr/",      niveau: "facile",
        irregularite: "f final muet",
    },
    {
        mot: "NERF",     phonetique: "/nɛr/",      niveau: "facile",
        irregularite: "f final muet",
    },
    {
        mot: "CORPS",    phonetique: "/kɔr/",      niveau: "facile",
        irregularite: "ps muets",
    },
    {
        mot: "TEMPS",    phonetique: "/tɑ̃/",       niveau: "facile",
        irregularite: "mps muets, e → /ɑ̃/",
    },
    {
        mot: "CLEF",     phonetique: "/klɛ/",      niveau: "facile",
        irregularite: "f muet",
    },
    {
        mot: "ESTOMAC",  phonetique: "/ɛstɔma/",   niveau: "facile",
        irregularite: "c final muet",
    },
    {
        mot: "SOÛL",     phonetique: "/su/",       niveau: "facile",
        irregularite: "oul → /u/ (accent déguise la règle)",
    },
    {
        mot: "CHAMPS",   phonetique: "/ʃɑ̃/",       niveau: "facile",
        irregularite: "mps muets",
    },
    {
        mot: "PORC",     phonetique: "/pɔr/",      niveau: "facile",
        irregularite: "c final muet",
    },

    // ── Moyen : irréguliers moins fréquents ou plus longs ────────────────────
    {
        mot: "SECOND",    phonetique: "/səgɔ̃/",    niveau: "moyen",
        irregularite: "c → /g/ (assimilation sonore)",
    },
    {
        mot: "MONSIEUR",  phonetique: "/məsjø/",   niveau: "moyen",
        irregularite: "on → /ə/, ieu → /jø/",
    },
    {
        mot: "COMPTER",   phonetique: "/kɔ̃te/",    niveau: "moyen",
        irregularite: "p muet",
    },
    {
        mot: "BAPTÊME",   phonetique: "/batɛm/",   niveau: "moyen",
        irregularite: "p muet",
    },
    {
        mot: "OIGNON",    phonetique: "/ɔɲɔ̃/",     niveau: "moyen",
        irregularite: "oign → /ɔɲ/ (irrégulier)",
    },
    {
        mot: "MOELLE",    phonetique: "/mwal/",    niveau: "moyen",
        irregularite: "oell → /wal/",
    },
    {
        mot: "POÊLE",     phonetique: "/pwal/",    niveau: "moyen",
        irregularite: "oê → /wa/",
    },
    {
        mot: "PAON",      phonetique: "/pɑ̃/",      niveau: "moyen",
        irregularite: "ao → /ɑ̃/",
    },
    {
        mot: "FAON",      phonetique: "/fɑ̃/",      niveau: "moyen",
        irregularite: "ao → /ɑ̃/",
    },
    {
        mot: "DOMPTEUR",  phonetique: "/dɔ̃tœr/",   niveau: "moyen",
        irregularite: "p muet (dompter)",
    },
    {
        mot: "GEÔLE",     phonetique: "/ʒol/",     niveau: "moyen",
        irregularite: "ô → /o/, e muet final",
    },
    {
        mot: "FAISAN",    phonetique: "/fəzɑ̃/",    niveau: "moyen",
        irregularite: "ai → /ə/ (exception)",
    },
    {
        mot: "ALCOOL",    phonetique: "/alkɔl/",   niveau: "moyen",
        irregularite: "oo → /ɔ/ (emprunt)",
    },
    {
        mot: "CHAOS",     phonetique: "/kao/",     niveau: "moyen",
        irregularite: "ch → /k/, s final muet",
    },
    {
        mot: "RHUME",     phonetique: "/rym/",     niveau: "moyen",
        irregularite: "rh → /r/, u → /y/",
    },

    // ── Difficile : rares, irrégularités complexes ou cumulées ───────────────
    {
        mot: "CHRYSANTHÈME", phonetique: "/krizɑ̃tɛm/", niveau: "difficile",
        irregularite: "ch → /k/, y → /i/, th → /t/",
    },
    {
        mot: "SHAMPOOING",   phonetique: "/ʃɑ̃pwɛ̃/",    niveau: "difficile",
        irregularite: "sh → /ʃ/, oo → /w/, ing → /ɛ̃/ (emprunt)",
    },
    {
        mot: "YACHT",        phonetique: "/jat/",       niveau: "difficile",
        irregularite: "y → /j/, ch → /t/ (emprunt)",
    },
    {
        mot: "SOLENNEL",     phonetique: "/sɔlanɛl/",   niveau: "difficile",
        irregularite: "en → /a/ (position non nasale)",
    },
    {
        mot: "RESSUSCITER",  phonetique: "/rəsysite/",  niveau: "difficile",
        irregularite: "sc → /s/ avant i",
    },
    {
        mot: "INSTINCT",     phonetique: "/ɛ̃stɛ̃/",     niveau: "difficile",
        irregularite: "nct final muet",
    },
    {
        mot: "DISTINCT",     phonetique: "/distɛ̃/",    niveau: "difficile",
        irregularite: "ct final muet",
    },
    {
        mot: "ASPECT",       phonetique: "/aspɛ/",     niveau: "difficile",
        irregularite: "ct final muet",
    },
    {
        mot: "RESPECT",      phonetique: "/rɛspɛ/",    niveau: "difficile",
        irregularite: "ct final muet",
    },
    {
        mot: "ABCÈS",        phonetique: "/apsɛ/",     niveau: "difficile",
        irregularite: "b → /p/ (assimilation), c → /s/",
    },
    {
        mot: "TAON",         phonetique: "/tɑ̃/",       niveau: "difficile",
        irregularite: "ao → /ɑ̃/ (insecte — rare)",
    },
    {
        mot: "MONOCLE",      phonetique: "/mɔnɔkl/",   niveau: "difficile",
        irregularite: "c → /k/ devant 'l' (emprunt latin)",
    },
    {
        mot: "ARCHIPEL",     phonetique: "/arʃipɛl/",  niveau: "difficile",
        irregularite: "ch → /k/ (emprunt grec)",
    },
    {
        mot: "PSYCHOLOGIE",  phonetique: "/psikolɔʒi/", niveau: "difficile",
        irregularite: "ps → /ps/ prononcé (emprunt grec), ch → /k/",
    },
    {
        mot: "XENOPHOBIE",   phonetique: "/ksenɔfɔbi/", niveau: "difficile",
        irregularite: "x → /ks/ (emprunt grec), ph → /f/",
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const niveauBadge: Record<Difficulty, string> = {
    facile:    "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    moyen:     "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    difficile: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

const niveauCount: Record<Difficulty, number> = {
    facile:    15,
    moyen:     15,
    difficile: 15,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LectureMotIrreg() {
    const [phase,          setPhase]          = useState<Phase>("idle");
    const [difficulty,     setDifficulty]     = useState<Difficulty>("facile");
    const [items,          setItems]          = useState<Mot[]>([]);
    const [current,        setCurrent]        = useState(0);
    const [results,        setResults]        = useState<RoundResult[]>([]);
    const [showPhonetic,   setShowPhonetic]   = useState(false);
    const [lastVerdict,    setLastVerdict]    = useState<Verdict | null>(null);

    useEffect(() => {
        setShowPhonetic(false);
        setLastVerdict(null);
    }, [current]);

    // ── Start ─────────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        const pool    = MOTS.filter(m => m.niveau === diff);
        const count   = Math.min(niveauCount[diff], pool.length);
        const sampled = shuffle(pool).slice(0, count);
        setItems(sampled);
        setCurrent(0);
        setResults([]);
        setPhase("playing");
    }, []);

    // ── Verdict ───────────────────────────────────────────────────────────────

    const handleVerdict = useCallback((verdict: Verdict) => {
        if (phase !== "playing") return;
        const updated: RoundResult[] = [...results, { mot: items[current], verdict }];
        setResults(updated);
        setLastVerdict(verdict);

        setTimeout(() => {
            const next = current + 1;
            if (next >= items.length) {
                setPhase("finished");
            } else {
                setCurrent(next);
            }
        }, 350);
    }, [phase, items, current, results]);

    // ── Keyboard support ──────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "playing") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "c" || e.key === "C" || e.key === " ") handleVerdict("correct");
            if (e.key === "e" || e.key === "E")                  handleVerdict("erreur");
            if (e.key === "p" || e.key === "P")                  handleVerdict("passe");
            if (e.key === "s" || e.key === "S")                  setShowPhonetic(v => !v);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [phase, handleVerdict]);

    const reset = () => { setPhase("idle"); setItems([]); setCurrent(0); setResults([]); };

    // ── Stats ─────────────────────────────────────────────────────────────────

    const correctCount = results.filter(r => r.verdict === "correct").length;
    const erreurCount  = results.filter(r => r.verdict === "erreur").length;
    const passeCount   = results.filter(r => r.verdict === "passe").length;
    const evaluated    = correctCount + erreurCount;
    const pct          = evaluated > 0 ? Math.round((correctCount / evaluated) * 100) : 0;

    const currentMot  = items[current];
    const progressPct = items.length > 0 ? (current / items.length) * 100 : 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden select-none">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <div className="max-w-md space-y-3">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Le clinicien présente des <strong>mots irréguliers</strong> un à un.<br />
                            Le patient lit chaque mot à voix haute.<br />
                            Marquez la réponse : <strong>Correct</strong>, <strong>Erreur</strong> ou <strong>Passé</strong>.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Touche <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">S</kbd> pour afficher la prononciation attendue et l'irrégularité.
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                            Mots irréguliers : prononciation <em>non déductible</em> des règles graphème-phonème — voie lexicale requise.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {(["facile", "moyen", "difficile"] as Difficulty[]).map(d => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 capitalize ${
                                    difficulty === d
                                        ? "bg-teal-600 text-white border-teal-600"
                                        : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Facile&nbsp;: mots courants (FEMME, DOIGT…) · Moyen&nbsp;: irréguliers moins fréquents · Difficile&nbsp;: emprunts et irrégularités cumulées
                    </p>

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Playing ── */}
            {phase === "playing" && currentMot && (
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${niveauBadge[currentMot.niveau]}`}>
                            {currentMot.niveau}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                            {current + 1}&nbsp;/&nbsp;{items.length}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                            ✓&nbsp;{correctCount}&nbsp; ✗&nbsp;{erreurCount}&nbsp; →&nbsp;{passeCount}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 shrink-0">
                        <div
                            className="h-full bg-teal-500 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>

                    {/* Word display */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-8">

                        {/* Word card */}
                        <div className={`relative w-full max-w-sm mx-auto px-8 py-8 rounded-2xl border-2 text-center transition-all duration-200 ${
                            lastVerdict === "correct" ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                            : lastVerdict === "erreur" ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                            : lastVerdict === "passe"  ? "border-slate-300 bg-slate-50 dark:bg-slate-800"
                            : "border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10"
                        }`}>
                            <p className="text-5xl font-bold tracking-widest text-teal-800 dark:text-teal-200 font-mono">
                                {currentMot.mot}
                            </p>

                            {/* Phonetic hint */}
                            <div className="mt-4 min-h-10 flex flex-col items-center justify-center gap-1">
                                {showPhonetic ? (
                                    <>
                                        <p className="text-base font-mono text-orange-600 dark:text-orange-400 tracking-wide">
                                            {currentMot.phonetique}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                            {currentMot.irregularite}
                                        </p>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setShowPhonetic(true)}
                                        className="text-xs text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                                    >
                                        Afficher la prononciation (S)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Response buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleVerdict("correct")}
                                className="flex flex-col items-center w-28 py-3 rounded-xl border-2 border-green-400 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold transition-all duration-100 shadow"
                            >
                                <span className="text-xl">✓</span>
                                <span className="text-sm">Correct</span>
                                <span className="text-xs opacity-70 mt-0.5">C / Espace</span>
                            </button>
                            <button
                                onClick={() => handleVerdict("erreur")}
                                className="flex flex-col items-center w-28 py-3 rounded-xl border-2 border-red-400 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold transition-all duration-100 shadow"
                            >
                                <span className="text-xl">✗</span>
                                <span className="text-sm">Erreur</span>
                                <span className="text-xs opacity-70 mt-0.5">E</span>
                            </button>
                            <button
                                onClick={() => handleVerdict("passe")}
                                className="flex flex-col items-center w-28 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-500 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 active:scale-95 text-slate-700 dark:text-slate-200 font-bold transition-all duration-100 shadow"
                            >
                                <span className="text-xl">→</span>
                                <span className="text-sm">Passer</span>
                                <span className="text-xs opacity-70 mt-0.5">P</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Score header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex-wrap gap-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            Lecture de mots irréguliers — résultats
                        </span>
                        <div className="flex gap-4 text-sm">
                            <span className="text-green-600 dark:text-green-400 font-medium">✓ Correct&nbsp;: {correctCount}</span>
                            <span className="text-red-500 font-medium">✗ Erreur&nbsp;: {erreurCount}</span>
                            <span className="text-slate-400 font-medium">→ Passé&nbsp;: {passeCount}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-xl font-bold ${
                                pct >= 80 ? "text-green-600 dark:text-green-400"
                                : pct >= 50 ? "text-amber-500"
                                : "text-red-500"
                            }`}>
                                {pct}&nbsp;%
                            </span>
                            <span className="text-xs text-slate-400">({correctCount}/{evaluated} évalués)</span>
                            <button
                                onClick={reset}
                                className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                            >
                                Recommencer
                            </button>
                        </div>
                    </div>

                    {/* Word-by-word review */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-wrap gap-2">
                            {results.map((r, i) => {
                                const bg =
                                    r.verdict === "correct"
                                        ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
                                        : r.verdict === "erreur"
                                        ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                                        : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-400";
                                const icon =
                                    r.verdict === "correct" ? "✓"
                                    : r.verdict === "erreur" ? "✗"
                                    : "→";
                                return (
                                    <div
                                        key={i}
                                        title={`${r.mot.phonetique} — ${r.mot.irregularite}`}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-sm font-mono font-semibold ${bg}`}
                                    >
                                        <span className="text-xs">{icon}</span>
                                        {r.mot.mot}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                            Survolez un mot pour voir la prononciation attendue et l'irrégularité · Vert = correct · Rouge = erreur · Gris = passé
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}

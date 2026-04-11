"use client";

import { useState, useCallback, useEffect } from "react";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type Verdict    = "correct" | "erreur" | "passe";

interface Mot {
    mot:       string;
    syllabes:  string;   // découpage syllabique affiché à la demande
    niveau:    Difficulty;
}

interface RoundResult {
    mot:     Mot;
    verdict: Verdict;
}

// ─── Mots réguliers ───────────────────────────────────────────────────────────
// Mots dont la prononciation est entièrement déductible des règles
// graphème-phonème du français (sans exceptions ni lettres muettes imprévisibles)

const MOTS: Mot[] = [
    // ── Facile : monosyllabes et bisyllabes courts, haute fréquence ──────────
    { mot: "SOL",     syllabes: "SOL",        niveau: "facile" },
    { mot: "LAC",     syllabes: "LAC",        niveau: "facile" },
    { mot: "VENT",    syllabes: "VENT",       niveau: "facile" },
    { mot: "SEL",     syllabes: "SEL",        niveau: "facile" },
    { mot: "FIL",     syllabes: "FIL",        niveau: "facile" },
    { mot: "LIT",     syllabes: "LIT",        niveau: "facile" },
    { mot: "NID",     syllabes: "NID",        niveau: "facile" },
    { mot: "BOL",     syllabes: "BOL",        niveau: "facile" },
    { mot: "GEL",     syllabes: "GEL",        niveau: "facile" },
    { mot: "PIC",     syllabes: "PIC",        niveau: "facile" },
    { mot: "SAC",     syllabes: "SAC",        niveau: "facile" },
    { mot: "DUR",     syllabes: "DUR",        niveau: "facile" },
    { mot: "BAL",     syllabes: "BAL",        niveau: "facile" },
    { mot: "CRI",     syllabes: "CRI",        niveau: "facile" },
    { mot: "FOND",    syllabes: "FOND",       niveau: "facile" },
    { mot: "BRAS",    syllabes: "BRAS",       niveau: "facile" },
    { mot: "PONT",    syllabes: "PONT",       niveau: "facile" },
    { mot: "ROBE",    syllabes: "RO-BE",      niveau: "facile" },
    { mot: "TUBE",    syllabes: "TU-BE",      niveau: "facile" },
    { mot: "CAPE",    syllabes: "CA-PE",      niveau: "facile" },
    { mot: "PILE",    syllabes: "PI-LE",      niveau: "facile" },
    { mot: "NOTE",    syllabes: "NO-TE",      niveau: "facile" },
    { mot: "VIDE",    syllabes: "VI-DE",      niveau: "facile" },
    { mot: "DOSE",    syllabes: "DO-SE",      niveau: "facile" },
    { mot: "LUNE",    syllabes: "LU-NE",      niveau: "facile" },

    // ── Moyen : bisyllabes et trisyllabes, fréquence moyenne ─────────────────
    { mot: "JARDIN",   syllabes: "JAR-DIN",    niveau: "moyen" },
    { mot: "BOUTON",   syllabes: "BOU-TON",    niveau: "moyen" },
    { mot: "CARTON",   syllabes: "CAR-TON",    niveau: "moyen" },
    { mot: "CRAVATE",  syllabes: "CRA-VA-TE",  niveau: "moyen" },
    { mot: "LIMITE",   syllabes: "LI-MI-TE",   niveau: "moyen" },
    { mot: "TISSU",    syllabes: "TIS-SU",     niveau: "moyen" },
    { mot: "PELOTE",   syllabes: "PE-LO-TE",   niveau: "moyen" },
    { mot: "CULTURE",  syllabes: "CUL-TU-RE",  niveau: "moyen" },
    { mot: "LECTURE",  syllabes: "LEC-TU-RE",  niveau: "moyen" },
    { mot: "NATURE",   syllabes: "NA-TU-RE",   niveau: "moyen" },
    { mot: "COSTUME",  syllabes: "COS-TU-ME",  niveau: "moyen" },
    { mot: "ROUTINE",  syllabes: "ROU-TI-NE",  niveau: "moyen" },
    { mot: "BORDURE",  syllabes: "BOR-DU-RE",  niveau: "moyen" },
    { mot: "POSTURE",  syllabes: "POS-TU-RE",  niveau: "moyen" },
    { mot: "CAPTURE",  syllabes: "CAP-TU-RE",  niveau: "moyen" },
    { mot: "TEXTURE",  syllabes: "TEX-TU-RE",  niveau: "moyen" },
    { mot: "STATURE",  syllabes: "STA-TU-RE",  niveau: "moyen" },
    { mot: "TRIBUNE",  syllabes: "TRI-BU-NE",  niveau: "moyen" },
    { mot: "GRAVURE",  syllabes: "GRA-VU-RE",  niveau: "moyen" },
    { mot: "RUPTURE",  syllabes: "RUP-TU-RE",  niveau: "moyen" },

    // ── Difficile : mots longs, moins fréquents, structures régulières ────────
    { mot: "BRINDILLE",   syllabes: "BRIN-DIL-LE",      niveau: "difficile" },
    { mot: "CRISTALLIN",  syllabes: "CRIS-TAL-LIN",     niveau: "difficile" },
    { mot: "STRUCTURE",   syllabes: "STRUC-TU-RE",      niveau: "difficile" },
    { mot: "FONDEMENT",   syllabes: "FON-DE-MENT",      niveau: "difficile" },
    { mot: "LIBREMENT",   syllabes: "LI-BRE-MENT",      niveau: "difficile" },
    { mot: "SPLENDEUR",   syllabes: "SPLEN-DEUR",       niveau: "difficile" },
    { mot: "AMPLITUDE",   syllabes: "AM-PLI-TU-DE",     niveau: "difficile" },
    { mot: "TRIMESTRE",   syllabes: "TRI-MES-TRE",      niveau: "difficile" },
    { mot: "SEMESTRE",    syllabes: "SE-MES-TRE",       niveau: "difficile" },
    { mot: "REGISTRE",    syllabes: "RE-GIS-TRE",       niveau: "difficile" },
    { mot: "LUSTRE",      syllabes: "LUS-TRE",          niveau: "difficile" },
    { mot: "MONSTRE",     syllabes: "MONS-TRE",         niveau: "difficile" },
    { mot: "SPECTRE",     syllabes: "SPEC-TRE",         niveau: "difficile" },
    { mot: "VENDANGE",    syllabes: "VEN-DAN-GE",       niveau: "difficile" },
    { mot: "FRONTISPICE", syllabes: "FRON-TIS-PI-CE",   niveau: "difficile" },
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
    facile:    25,
    moyen:     20,
    difficile: 15,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LectureMotReg() {
    const [phase,        setPhase]        = useState<Phase>("idle");
    const [difficulty,   setDifficulty]   = useState<Difficulty>("facile");
    const [items,        setItems]        = useState<Mot[]>([]);
    const [current,      setCurrent]      = useState(0);
    const [results,      setResults]      = useState<RoundResult[]>([]);
    const [showSyllabes, setShowSyllabes] = useState(false);
    const [lastVerdict,  setLastVerdict]  = useState<Verdict | null>(null);

    // Reset syllabe display on each new word
    useEffect(() => {
        setShowSyllabes(false);
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
        const mot = items[current];
        const updated: RoundResult[] = [...results, { mot, verdict }];
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
            if (e.key === "s" || e.key === "S")                  setShowSyllabes(v => !v);
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

    const currentMot   = items[current];
    const progressPct  = items.length > 0 ? ((current) / items.length) * 100 : 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden select-none">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <div className="max-w-md space-y-3">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Le clinicien présente des <strong>mots réguliers</strong> un à un.<br />
                            Le patient lit chaque mot à voix haute.<br />
                            Marquez la réponse : <strong>Correct</strong>, <strong>Erreur</strong> ou <strong>Passé</strong>.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Touche <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 font-mono text-xs">S</kbd> pour afficher le découpage syllabique.
                        </p>
                        <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                            Mots réguliers : prononciation entièrement déductible des règles graphème-phonème.
                        </p>
                    </div>

                    {/* Difficulty */}
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
                        Facile&nbsp;: 25 mots monosyllabiques · Moyen&nbsp;: 20 mots bisyllabiques · Difficile&nbsp;: 15 mots longs
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
                            : "border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/10"
                        }`}>
                            <p className="text-5xl font-bold tracking-widest text-teal-800 dark:text-teal-200 font-mono">
                                {currentMot.mot}
                            </p>

                            {/* Syllabic breakdown */}
                            <div className="mt-3 h-7 flex items-center justify-center">
                                {showSyllabes ? (
                                    <p className="text-sm font-mono text-teal-600 dark:text-teal-400 tracking-[0.3em]">
                                        {currentMot.syllabes}
                                    </p>
                                ) : (
                                    <button
                                        onClick={() => setShowSyllabes(true)}
                                        className="text-xs text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                                    >
                                        Afficher les syllabes (S)
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
                            Lecture de mots réguliers — résultats
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
                                    r.verdict === "correct" ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300"
                                    : r.verdict === "erreur" ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                                    : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-400";
                                const icon =
                                    r.verdict === "correct" ? "✓"
                                    : r.verdict === "erreur" ? "✗"
                                    : "→";
                                return (
                                    <div
                                        key={i}
                                        title={`Syllabes : ${r.mot.syllabes}`}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-sm font-mono font-semibold ${bg}`}
                                    >
                                        <span className="text-xs">{icon}</span>
                                        {r.mot.mot}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                            Survolez un mot pour voir son découpage syllabique · Vert = correct · Rouge = erreur · Gris = passé
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface WordToken {
    id: number;
    word: string;      // mot extrait (lowercase, sans ponctuation)
    display: string;   // texte affiché (avec ponctuation attachée)
    isTarget: boolean;
    selected: boolean;
}

interface RawPassage {
    id: string;
    difficulty: Difficulty;
    category: string;
    instruction: string;
    text: string;
    targets: string[];
}

// ─── Passages ─────────────────────────────────────────────────────────────────

const RAW_PASSAGES: RawPassage[] = [
    // ── FACILE ──────────────────────────────────────────────────────────────────
    {
        id: "animaux",
        difficulty: "facile",
        category: "animaux",
        instruction: "Cliquez sur tous les mots désignant des animaux.",
        text: "Le matin, Marie se lève tôt. Elle entend le chant du coq depuis la cour. Son chien dort encore au pied du lit. Dans le jardin, un chat noir guette les oiseaux perchés sur la clôture. Une vache broute l'herbe fraîche du pré voisin. Marie prend son café et observe un lapin traverser l'allée. Elle pense à la ferme, avec ses chevaux et ses canards. Un renard rôde parfois le soir près des poules. La vie à la campagne lui manque vraiment beaucoup.",
        targets: ["coq", "chien", "chat", "oiseaux", "vache", "lapin", "chevaux", "canards", "renard", "poules"],
    },
    {
        id: "fruits",
        difficulty: "facile",
        category: "fruits",
        instruction: "Cliquez sur tous les mots désignant des fruits.",
        text: "Au marché du dimanche, Paul remplit son panier avec soin. Il choisit d'abord des pommes bien rondes, puis des poires dorées. Un peu plus loin, il trouve des figues fraîches et une grappe de raisins noirs. La vendeuse lui propose des fraises en barquette et des cerises brillantes. Paul ajoute des pêches parfumées et une barquette de framboises. Pour finir, il prend des kiwis et quelques noix pour le dessert du soir.",
        targets: ["pommes", "poires", "figues", "raisins", "fraises", "cerises", "pêches", "framboises", "kiwis", "noix"],
    },

    // ── MOYEN ───────────────────────────────────────────────────────────────────
    {
        id: "professions",
        difficulty: "moyen",
        category: "métiers",
        instruction: "Cliquez sur tous les mots désignant des métiers ou professions.",
        text: "La vie dans ce quartier animé réunit des gens de tous horizons. Chaque matin, le boulanger ouvre sa boutique avant l'aube et prépare ses croissants. La médecin de garde finit sa nuit de travail épuisée. Sur le chantier voisin, des maçons construisent un immeuble sous la surveillance d'un architecte exigeant. Au café du coin, la serveuse distribue les commandes avec le sourire. Un peu plus loin, le facteur termine sa tournée à vélo. Dans la rue, deux policiers discutent avec un plombier en bleu de travail. L'institutrice rentre chez elle après une longue journée de classe. Un musicien répète dans son studio, fenêtres ouvertes sur la rue animée. La ville ne s'arrête jamais complètement.",
        targets: ["boulanger", "médecin", "maçons", "architecte", "serveuse", "facteur", "policiers", "plombier", "institutrice", "musicien"],
    },
    {
        id: "transports",
        difficulty: "moyen",
        category: "moyens de transport",
        instruction: "Cliquez sur tous les mots désignant des moyens de transport.",
        text: "Chaque matin, des milliers de voyageurs parcourent la ville par tous les moyens possibles. Certains préfèrent le métro, rapide et ponctuel aux heures de pointe. D'autres montent dans le bus ou attendent leur tramway habituel. Les plus sportifs enfourcent leur vélo, casque sur la tête. Sur l'autoroute, une longue file de voitures avance lentement sous la pluie. Un camion de livraison double prudemment sur la file de gauche. Plus haut, un avion trace une ligne blanche dans le ciel. Au port, un ferry appareille lentement vers les îles du large. Des enfants observent le passage d'un train depuis la passerelle. Le soir, des scooters et des motos rentrent en zigzaguant entre les files.",
        targets: ["métro", "bus", "tramway", "vélo", "voitures", "camion", "avion", "ferry", "train", "scooters", "motos"],
    },

    // ── DIFFICILE ───────────────────────────────────────────────────────────────
    {
        id: "emotions",
        difficulty: "difficile",
        category: "émotions",
        instruction: "Cliquez sur tous les mots désignant des émotions ou des états intérieurs.",
        text: "Thomas revenait de loin. Pendant des mois, une tristesse profonde l'avait envahi, mêlée à une angoisse diffuse qu'il ne savait pas nommer. Ses proches sentaient sa mélancolie sans oser en parler. Puis, un matin, il ressentit une joie inattendue en observant le lever du soleil. Cette surprise agréable laissa place à une douce sérénité. La colère revenait par vagues, nourrie d'une vieille frustration. Il apprenait à reconnaître sa peur sans en être prisonnier. Une grande admiration pour certains amis l'aidait à avancer. Peu à peu, la confiance prenait le dessus sur le désespoir. Il gardait une nostalgie tenace, mais cet espoir demeurait intact.",
        targets: ["tristesse", "angoisse", "mélancolie", "joie", "surprise", "sérénité", "colère", "frustration", "peur", "admiration", "confiance", "désespoir", "nostalgie", "espoir"],
    },
    {
        id: "adjectifs",
        difficulty: "difficile",
        category: "adjectifs de caractère",
        instruction: "Cliquez sur tous les adjectifs décrivant le caractère ou la personnalité d'une personne.",
        text: "Dans la salle d'attente bondée, les visages racontaient des histoires silencieuses. Une femme élégante et discrète lisait un roman épais, en silence. Un homme imposant et nerveux tapait du pied sur le carrelage. Un adolescent timide observait les autres à la dérobée, l'air songeur. Un enfant curieux et turbulent dessinait sur son cahier à spirale. Un monsieur sévère consultait ses messages d'un air pressé. Une jeune femme créative portait des vêtements colorés qui attiraient les regards. Un vieux monsieur bienveillant souriait à tout le monde sans raison apparente. Une dame austère classait ses documents avec une attention méthodique. Chacun semblait à la fois proche et mystérieux dans cet espace partagé.",
        targets: ["élégante", "discrète", "imposant", "nerveux", "timide", "songeur", "curieux", "turbulent", "sévère", "pressé", "créative", "bienveillant", "austère", "méthodique", "mystérieux"],
    },
];

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    fontSize:   string;
    lineHeight: string;
    empan:      number;
}> = {
    facile:    { fontSize: "text-lg",   lineHeight: "leading-9",  empan: 3 },
    moyen:     { fontSize: "text-base", lineHeight: "leading-8",  empan: 5 },
    difficile: { fontSize: "text-sm",   lineHeight: "leading-7",  empan: 7 },
};

// ─── Tokenizer ────────────────────────────────────────────────────────────────

function buildTokens(text: string, targetWords: string[]): WordToken[] {
    const targetSet = new Set(targetWords.map(t => t.toLowerCase()));

    return text.split(/\s+/).filter(Boolean).map((part, idx) => {
        // Strip leading/trailing punctuation
        const stripped = part
            .replace(/^[.,!?;:«»"""'''\u2018\u2019()\[\]\u2014\-]+/, "")
            .replace(/[.,!?;:«»"""'''\u2018\u2019()\[\]\u2014\-]+$/, "")
            .toLowerCase();

        // Resolve French contractions: l'word, d'word, qu'word, etc.
        const apoMatch = stripped.match(/^([ldjcmnstq]u?)[\u2019'](.+)$/);
        const clean = apoMatch ? apoMatch[2] : stripped;

        return {
            id: idx,
            word: clean,
            display: part,
            isTarget: targetSet.has(clean),
            selected: false,
        };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LectureSelective({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [passage,    setPassage]    = useState<RawPassage | null>(null);
    const [tokens,     setTokens]     = useState<WordToken[]>([]);
    const [elapsed,    setElapsed]    = useState(0);

    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAt = useRef(0);

    const cfg = DIFFICULTY_CONFIG[difficulty];

    // ── Timer ──────────────────────────────────────────────────────────────────

    const stopTimer = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    useEffect(() => {
        if (phase !== "playing") return;
        startedAt.current = Date.now();
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
        }, 1000);
        return stopTimer;
    }, [phase]);

    useEffect(() => () => stopTimer(), []);

    // ── Start ──────────────────────────────────────────────────────────────────

    const startGame = (diff: Difficulty) => {
        const pool = RAW_PASSAGES.filter(p => p.difficulty === diff);
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setPassage(picked);
        setTokens(buildTokens(picked.text, picked.targets));
        setElapsed(0);
        setPhase("playing");
    };

    // ── Toggle word ────────────────────────────────────────────────────────────

    const toggleToken = (id: number) => {
        if (phase !== "playing") return;
        setTokens(prev => prev.map(t =>
            t.id === id ? { ...t, selected: !t.selected } : t
        ));
    };

    // ── Validate ───────────────────────────────────────────────────────────────

    const validate = () => {
        stopTimer();
        setPhase("finished");
    };

    // ── Save score ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "finished" || tokens.length === 0) return;
        const targets     = tokens.filter(t => t.isTarget);
        const hits        = targets.filter(t => t.selected).length;
        const falseAlarms = tokens.filter(t => !t.isTarget && t.selected).length;
        const total       = targets.length;
        const score       = Math.max(0, Math.round(((hits - falseAlarms) / total) * 100));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Lecture sélective",
                domaine:  "attention-selective",
                score,
                empan:    DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const reset = () => {
        stopTimer();
        setPhase("idle");
        setPassage(null);
        setTokens([]);
        setElapsed(0);
    };

    // ── Computed stats ─────────────────────────────────────────────────────────

    const targets     = tokens.filter(t => t.isTarget);
    const hits        = targets.filter(t => t.selected).length;
    const misses      = targets.filter(t => !t.selected).length;
    const falseAlarms = tokens.filter(t => !t.isTarget && t.selected).length;
    const selected    = tokens.filter(t => t.selected).length;
    const totalTargets = targets.length;
    const score       = Math.max(0, Math.round(((hits - falseAlarms) / (totalTargets || 1)) * 100));

    // ── Token styling ──────────────────────────────────────────────────────────

    function tokenClass(t: WordToken): string {
        const base = "rounded px-0.5 transition-colors duration-100 ";
        if (phase === "playing") {
            if (t.selected)
                return base + "bg-primary-500 text-white cursor-pointer";
            return base + "hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-800 dark:hover:text-primary-200 cursor-pointer";
        }
        // finished
        if (t.isTarget && t.selected)
            return base + "bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-100 font-semibold";
        if (t.isTarget && !t.selected)
            return base + "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 underline decoration-dotted underline-offset-2";
        if (!t.isTarget && t.selected)
            return base + "bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100";
        return base;
    }

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Un texte s'affiche avec une <strong>catégorie cible</strong>.<br />
                        Lisez le texte et <strong>cliquez sur tous les mots</strong> appartenant à cette catégorie.<br />
                        Cliquez à nouveau pour désélectionner. Validez quand vous avez terminé.<br />
                        <span className="text-xs text-slate-400">
                            Il n'y a pas de limite de temps — prenez le temps de bien lire.
                        </span>
                    </p>

                    {/* Category preview per difficulty */}
                    <div className="grid grid-cols-3 gap-3 text-xs text-left max-w-md w-full">
                        {([
                            { d: "facile",    label: "Facile",    cats: "Animaux · Fruits",                    n: "~10 mots cibles" },
                            { d: "moyen",     label: "Moyen",     cats: "Métiers · Transports",               n: "~11 mots cibles" },
                            { d: "difficile", label: "Difficile", cats: "Émotions · Adjectifs de caractère",  n: "~14 mots cibles" },
                        ] as const).map(({ d, label, cats, n }) => (
                            <div
                                key={d}
                                className={`rounded-lg border p-2 cursor-pointer transition-colors duration-150 ${
                                    difficulty === d
                                        ? "bg-primary-50 dark:bg-primary-900/30 border-primary-400 dark:border-primary-600"
                                        : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-primary-300"
                                }`}
                                onClick={() => setDifficulty(d)}
                            >
                                <p className={`font-semibold mb-0.5 ${difficulty === d ? "text-primary-700 dark:text-primary-300" : "text-slate-700 dark:text-slate-200"}`}>
                                    {label}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">{cats}</p>
                                <p className="text-slate-400 dark:text-slate-500 mt-0.5">{n}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Playing ── */}
            {phase === "playing" && passage && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
                                Catégorie&nbsp;:
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 capitalize">
                                {passage.category}
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 italic hidden sm:block flex-1 text-center">
                            {passage.instruction}
                        </p>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400 dark:text-slate-500">
                            <span className="tabular-nums font-mono">{formatTime(elapsed)}</span>
                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                {selected} sélectionné{selected > 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>

                    {/* Instruction (mobile) */}
                    <p className="sm:hidden px-4 pt-2 text-xs text-slate-500 dark:text-slate-400 italic shrink-0">
                        {passage.instruction}
                    </p>

                    {/* Text */}
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        <div className={`flex flex-wrap gap-x-1 ${cfg.fontSize} ${cfg.lineHeight} text-slate-800 dark:text-slate-200`}>
                            {tokens.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => toggleToken(t.id)}
                                    className={tokenClass(t)}
                                >
                                    {t.display}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            Cliquez sur les mots, puis validez.
                        </span>
                        <button
                            onClick={validate}
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Valider mes réponses
                        </button>
                    </div>
                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && passage && (
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Stats header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex-wrap gap-2">
                        {/* Score */}
                        <div className="flex items-center gap-3">
                            <span className={`text-2xl font-extrabold ${
                                score >= 80 ? "text-green-600 dark:text-green-400"
                                : score >= 50 ? "text-amber-500"
                                : "text-red-500"
                            }`}>
                                {score}&nbsp;%
                            </span>
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                                <p className="text-green-600 dark:text-green-400 font-medium">
                                    ✓ Trouvés&nbsp;: {hits}&nbsp;/&nbsp;{totalTargets}
                                </p>
                                <p className="text-amber-500 font-medium">
                                    ◌ Manqués&nbsp;: {misses}
                                </p>
                                <p className="text-red-400 font-medium">
                                    ✗ Erreurs&nbsp;: {falseAlarms}
                                </p>
                            </div>
                        </div>

                        {/* Time */}
                        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums font-mono">
                            ⏱ {formatTime(elapsed)}
                        </span>

                        <button
                            onClick={reset}
                            className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150"
                        >
                            Recommencer
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 px-4 py-1.5 text-xs border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-green-300 dark:bg-green-800 inline-block"/>&nbsp;Trouvé ✓
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-amber-300 dark:bg-amber-800 inline-block"/>&nbsp;Manqué (soulignement)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-red-300 dark:bg-red-800 inline-block"/>&nbsp;Erreur (non-cible sélectionnée)
                        </span>
                    </div>

                    {/* Scored text */}
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        <div className={`flex flex-wrap gap-x-1 ${cfg.fontSize} ${cfg.lineHeight} text-slate-800 dark:text-slate-200`}>
                            {tokens.map(t => (
                                <span key={t.id} className={tokenClass(t)}>
                                    {t.display}
                                </span>
                            ))}
                        </div>

                        {/* Missed words list */}
                        {misses > 0 && (
                            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
                                <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                                    Mots manqués ({misses})&nbsp;:
                                </p>
                                <p className="text-amber-800 dark:text-amber-200">
                                    {targets
                                        .filter(t => !t.selected)
                                        .map(t => t.display.replace(/[.,!?;:]+$/, ""))
                                        .join(", ")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

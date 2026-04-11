"use client";

import { useState, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface WordToken {
    id: number;
    word: string;         // mot nettoyé (lowercase, sans ponctuation)
    display: string;      // texte affiché (avec ponctuation)
    isDistractor: boolean;
    selected: boolean;
}

interface RawPassage {
    id: string;
    difficulty: Difficulty;
    theme: string;        // type de distracteurs
    instruction: string;
    // [[mot]] marque un distracteur ; ponctuation hors des crochets
    markedText: string;
}

// ─── Passages ─────────────────────────────────────────────────────────────────
// Convention : [[mot]] ou [[mot]], ou [[mot]]. — ponctuation hors des crochets.

const RAW_PASSAGES: RawPassage[] = [

    // ── FACILE — COULEURS DANS UN RÉCIT ──────────────────────────────────────
    {
        id: "couleurs-recit",
        difficulty: "facile",
        theme: "couleurs intrusives",
        instruction: "Des noms de couleurs ont été glissés dans ce texte. Cliquez sur chaque mot intrus.",
        markedText:
            "Le week-end dernier, Paul et sa sœur ont décidé de visiter [[rouge]] la vieille ville. " +
            "Ils ont garé leur voiture près de la place centrale [[bleu]] et ont commencé leur promenade. " +
            "Les rues pavées étaient animées [[vert]] et les terrasses des cafés étaient bondées. " +
            "Ils ont visité une petite [[jaune]] église datant du douzième siècle. " +
            "Au déjeuner, ils ont mangé dans un restaurant typique [[violet]] qui servait des spécialités locales. " +
            "L'après-midi, ils ont flâné dans les ruelles [[orange]] avant de rentrer chez eux satisfaits.",
    },

    // ── FACILE — CHIFFRES DANS UN DIALOGUE ───────────────────────────────────
    {
        id: "chiffres-dialogue",
        difficulty: "facile",
        theme: "nombres intrusifs",
        instruction: "Des mots désignant des nombres ont été insérés dans ce dialogue. Cliquez sur chaque intrus.",
        markedText:
            "Bonjour Marie, comment [[douze]] vas-tu aujourd'hui ? " +
            "Je vais bien merci, j'ai passé une bonne [[quatre]] nuit. " +
            "As-tu vu le film dont je t'avais parlé ? " +
            "Non, [[huit]] pas encore, mais j'aimerais le voir ce soir. " +
            "On pourrait aller au cinéma [[vingt]] ensemble si tu es libre. " +
            "C'est une excellente idée [[trois]], quelle heure te convient ? " +
            "Disons [[seize]] dix-neuf heures, devant l'entrée principale. " +
            "Parfait, je t'y retrouve [[sept]], à tout à l'heure.",
    },

    // ── MOYEN — SPORT DANS UNE RECETTE ───────────────────────────────────────
    {
        id: "sport-recette",
        difficulty: "moyen",
        theme: "vocabulaire sportif",
        instruction: "Des termes de sport ont été insérés dans cette recette de cuisine. Repérez et cliquez sur chaque intrus.",
        markedText:
            "Pour préparer une soupe de légumes, commencez par laver [[arbitre]] et éplucher trois carottes, " +
            "deux poireaux et une courgette. " +
            "Faites revenir un oignon émincé dans une [[sprint]] cocotte avec un peu d'huile d'olive. " +
            "Ajoutez ensuite les légumes coupés en dés avec deux [[penalty]] gousses d'ail. " +
            "Versez un litre de bouillon de légumes [[dribble]] et laissez mijoter à feu doux vingt minutes. " +
            "Mixez la préparation jusqu'à obtenir une texture [[podium]] lisse et onctueuse. " +
            "Assaisonnez avec du sel, du poivre [[carton]] et quelques herbes fraîches. " +
            "Servez bien chaud avec des croûtons dorés [[sifflet]] à la poêle.",
    },

    // ── MOYEN — MÉTÉO DANS UN RÉCIT DE BUREAU ────────────────────────────────
    {
        id: "meteo-bureau",
        difficulty: "moyen",
        theme: "termes météorologiques",
        instruction: "Des termes de météo ont été glissés dans ce texte de la vie au bureau. Cliquez sur chaque intrus.",
        markedText:
            "Ce matin, Sophie arrive [[brouillard]] au bureau avec dix minutes d'avance. " +
            "Elle allume son ordinateur et consulte ses messages [[averse]] en buvant son café. " +
            "Son responsable lui demande de préparer [[grêle]] un rapport pour la réunion de l'après-midi. " +
            "Elle rassemble ses données [[tempête]] et commence à rédiger. " +
            "À midi, elle déjeune rapidement à la cantine [[verglas]] avec ses collègues. " +
            "De retour à son poste, elle finalise [[rafale]] la présentation et l'envoie par courriel. " +
            "La réunion se passe bien [[canicule]] et ses propositions sont acceptées à l'unanimité.",
    },

    // ── DIFFICILE — TERMES SCIENTIFIQUES DANS UN RÉCIT HISTORIQUE ────────────
    {
        id: "sciences-histoire",
        difficulty: "difficile",
        theme: "vocabulaire scientifique",
        instruction:
            "Des termes scientifiques ont été dissimulés dans ce texte historique. " +
            "Lisez attentivement et cliquez sur chaque mot qui n'appartient pas au contexte.",
        markedText:
            "Au seizième siècle, les explorateurs européens partaient à la [[photosynthèse]] découverte de nouveaux continents. " +
            "Christophe Colomb, originaire de Gênes, fit voile vers l'ouest [[mitose]] en 1492 avec trois caravelles. " +
            "Après plusieurs semaines de navigation, son équipage aperçut [[chromosome]] les côtes américaines. " +
            "Cette découverte bouleversa la vision [[électrolyse]] du monde de l'époque " +
            "et ouvrit la voie aux grandes colonisations. " +
            "Les échanges commerciaux entre l'Europe et les Amériques [[catalyseur]] se développèrent rapidement, " +
            "notamment l'or et les épices. " +
            "Cette période historique [[isotope]] marqua le début de la mondialisation telle que nous la connaissons.",
    },

    // ── DIFFICILE — TERMES MÉDICAUX DANS UN RÉCIT QUOTIDIEN ──────────────────
    {
        id: "medical-quotidien",
        difficulty: "difficile",
        theme: "terminologie médicale",
        instruction:
            "Des termes médicaux ont été dissimulés dans ce récit du quotidien. " +
            "Lisez attentivement et cliquez sur chaque mot qui ne s'y trouve pas naturellement.",
        markedText:
            "Jean prépare sa valise [[diagnostic]] pour les vacances avec beaucoup de soin. " +
            "Il vérifie d'abord ses papiers et ses billets [[tachycardie]] avant de plier ses vêtements. " +
            "Sa fille l'aide à choisir les livres [[anesthésie]] qu'il emportera pour la plage. " +
            "Sa femme ajoute la crème solaire [[pronostic]] et les médicaments habituels. " +
            "Ils ferment la valise [[métastase]] après avoir vérifié que rien n'a été oublié. " +
            "La voiture est chargée et ils partent [[suture]] dans la bonne humeur. " +
            "Le voyage se passe sans encombre [[radiologie]] malgré les bouchons habituels du mois d'août.",
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
// Reconnaît [[mot]] ou [[mot]], ou [[mot]]. — ponctuation hors des crochets.

function buildTokens(markedText: string): WordToken[] {
    return markedText.split(/\s+/).filter(Boolean).map((part, idx) => {
        const m = part.match(/^\[\[(.+?)\]\]([.,!?;:]*)$/);
        const isDistractor = !!m;
        const rawDisplay   = isDistractor ? m![1] + m![2] : part;

        const stripped = rawDisplay
            .replace(/^[.,!?;:\u2014\-]+/, "")
            .replace(/[.,!?;:\u2014\-]+$/, "")
            .toLowerCase();

        const apoMatch = stripped.match(/^([ldjcmnstq]u?)[\u2019'](.+)$/);
        const clean    = apoMatch ? apoMatch[2] : stripped;

        return { id: idx, word: clean, display: rawDisplay, isDistractor, selected: false };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LectureAvecDistract({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [passage,    setPassage]    = useState<RawPassage | null>(null);
    const [tokens,     setTokens]     = useState<WordToken[]>([]);
    const [elapsed,    setElapsed]    = useState(0);

    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAt = useRef(0);
    const cfg       = DIFFICULTY_CONFIG[difficulty];

    // ── Timer ──────────────────────────────────────────────────────────────────

    const stopTimer = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    useEffect(() => {
        if (phase !== "playing") return;
        startedAt.current = Date.now();
        timerRef.current  = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
        }, 1000);
        return stopTimer;
    }, [phase]);

    useEffect(() => () => stopTimer(), []);

    // ── Start ──────────────────────────────────────────────────────────────────

    const startGame = (diff: Difficulty) => {
        const pool   = RAW_PASSAGES.filter(p => p.difficulty === diff);
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setPassage(picked);
        setTokens(buildTokens(picked.markedText));
        setElapsed(0);
        setPhase("playing");
    };

    // ── Toggle token ───────────────────────────────────────────────────────────

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
        const totalDist   = tokens.filter(t => t.isDistractor).length;
        const hits        = tokens.filter(t => t.isDistractor &&  t.selected).length;
        const falseAlarms = tokens.filter(t => !t.isDistractor && t.selected).length;
        const score       = Math.max(0, Math.round(((hits - falseAlarms) / (totalDist || 1)) * 100));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Lecture avec distracteurs",
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

    const totalDist   = tokens.filter(t => t.isDistractor).length;
    const hits        = tokens.filter(t => t.isDistractor &&  t.selected).length;
    const misses      = tokens.filter(t => t.isDistractor && !t.selected).length;
    const falseAlarms = tokens.filter(t => !t.isDistractor && t.selected).length;
    const selected    = tokens.filter(t => t.selected).length;
    const score       = Math.max(0, Math.round(((hits - falseAlarms) / (totalDist || 1)) * 100));

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    // ── Token styling ──────────────────────────────────────────────────────────

    function tokenClass(t: WordToken): string {
        const base = "rounded px-0.5 transition-colors duration-100 ";
        if (phase === "playing") {
            if (t.selected)
                return base + "bg-indigo-400 dark:bg-indigo-500 text-white cursor-pointer";
            return base + "hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-800 dark:hover:text-indigo-200 cursor-pointer";
        }
        // finished
        if (t.isDistractor && t.selected)
            return base + "bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-100 font-semibold";
        if (t.isDistractor && !t.selected)
            return base + "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 underline decoration-wavy decoration-red-400 underline-offset-2";
        if (!t.isDistractor && t.selected)
            return base + "bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100";
        return base;
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Un texte cohérent s'affiche, mais des <strong>mots intrus</strong> y ont été glissés.<br />
                        Lisez attentivement et <strong>cliquez sur chaque mot qui n'appartient pas</strong> au texte.<br />
                        <span className="text-xs text-slate-400">
                            Cliquez à nouveau pour désélectionner. Validez quand vous avez terminé.
                        </span>
                    </p>

                    {/* Difficulty cards */}
                    <div className="grid grid-cols-3 gap-3 text-xs text-left max-w-md w-full">
                        {([
                            { d: "facile",    label: "Facile",    types: "Couleurs · Nombres",                    n: "6–7 distracteurs" },
                            { d: "moyen",     label: "Moyen",     types: "Vocabulaire sportif · Météo",           n: "7 distracteurs" },
                            { d: "difficile", label: "Difficile", types: "Termes scientifiques · Termes médicaux", n: "6–7 distracteurs" },
                        ] as const).map(({ d, label, types, n }) => (
                            <div
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`rounded-lg border p-2 cursor-pointer transition-colors duration-150 ${
                                    difficulty === d
                                        ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600"
                                        : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-indigo-300"
                                }`}
                            >
                                <p className={`font-semibold mb-0.5 ${difficulty === d ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"}`}>
                                    {label}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">{types}</p>
                                <p className="text-slate-400 dark:text-slate-500 mt-0.5">{n}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors duration-200"
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
                                Intrus&nbsp;:
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 capitalize">
                                {passage.theme}
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 italic hidden sm:block flex-1 text-center">
                            {passage.instruction}
                        </p>

                        <div className="flex items-center gap-3 shrink-0 text-xs">
                            <span className="text-slate-400 dark:text-slate-500 tabular-nums font-mono">
                                {formatTime(elapsed)}
                            </span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                {selected} signalé{selected > 1 ? "s" : ""}
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
                            Cliquez sur les mots intrus, puis validez.
                        </span>
                        <button
                            onClick={validate}
                            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
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
                                    ✓ Trouvés&nbsp;: {hits}&nbsp;/&nbsp;{totalDist}
                                </p>
                                <p className="text-amber-500 font-medium">◌ Manqués&nbsp;: {misses}</p>
                                <p className="text-red-400 font-medium">✗ Fausses alarmes&nbsp;: {falseAlarms}</p>
                            </div>
                        </div>
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
                            <span className="w-4 h-3 rounded bg-green-300 dark:bg-green-800 inline-block"/>Intrus trouvé ✓
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-amber-300 dark:bg-amber-800 inline-block"/>Intrus manqué (soulignement)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-red-300 dark:bg-red-800 inline-block"/>Fausse alarme (mot normal signalé)
                        </span>
                    </div>

                    {/* Scored text */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                        <div className={`flex flex-wrap gap-x-1 ${cfg.fontSize} ${cfg.lineHeight} text-slate-800 dark:text-slate-200`}>
                            {tokens.map(t => (
                                <span key={t.id} className={tokenClass(t)}>
                                    {t.display}
                                </span>
                            ))}
                        </div>

                        {/* Missed distractors */}
                        {misses > 0 && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
                                <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                                    Distracteurs non détectés ({misses})&nbsp;:
                                </p>
                                <p className="text-amber-800 dark:text-amber-200 font-mono">
                                    {tokens
                                        .filter(t => t.isDistractor && !t.selected)
                                        .map(t => t.display.replace(/[.,!?;:]+$/, ""))
                                        .join(", ")}
                                </p>
                            </div>
                        )}

                        {/* False alarms */}
                        {falseAlarms > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm">
                                <p className="font-semibold text-red-700 dark:text-red-300 mb-1">
                                    Fausses alarmes ({falseAlarms}) — mots normaux signalés par erreur&nbsp;:
                                </p>
                                <p className="text-red-800 dark:text-red-200 font-mono">
                                    {tokens
                                        .filter(t => !t.isDistractor && t.selected)
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

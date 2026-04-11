"use client";

import { useState, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface WordToken {
    id: number;
    word: string;      // mot nettoyé (lowercase, sans ponctuation)
    display: string;   // texte affiché (avec ponctuation)
    isTarget: boolean; // ce token est une erreur
    selected: boolean; // le patient l'a signalé
}

interface ErrorInfo {
    word: string;        // le mot erroné (tel qu'il apparaît)
    correction: string;  // la forme correcte
    explanation: string; // explication courte
}

interface RawPassage {
    id: string;
    difficulty: Difficulty;
    errorType: string;
    instruction: string;
    // Texte avec [[mot]] pour marquer les erreurs, dans l'ordre des erreurs[]
    markedText: string;
    errors: ErrorInfo[];
}

// ─── Passages ─────────────────────────────────────────────────────────────────
// Convention : [[mot]] ou [[mot]], ou [[mot]]. — la ponctuation est hors des crochets.

const RAW_PASSAGES: RawPassage[] = [

    // ── FACILE — FAUTES D'ORTHOGRAPHE ─────────────────────────────────────────
    {
        id: "ortho-facile",
        difficulty: "facile",
        errorType: "fautes d'orthographe",
        instruction: "Signalez toutes les fautes d'orthographe en cliquant sur les mots incorrects.",
        markedText:
            "Hier matin, Lucie a décidé de faire une [[promennade]] dans le parc. " +
            "Elle a [[prit]] son sac et ses clés avant de sortir. " +
            "Le soleil brillait et le temps était [[agréabe]]. " +
            "En marchant, elle a rencontré son [[voizin]] qui promenait son [[chein]]. " +
            "Ils ont discuté quelques [[mintues]] puis chacun est reparti de son côté. " +
            "De retour chez elle, Lucie a préparé un bon repas pour toute la [[famillie]].",
        errors: [
            { word: "promennade", correction: "promenade",  explanation: "Un seul « n » dans promenade." },
            { word: "prit",       correction: "pris",       explanation: "Participe passé de prendre : pris (prit = passé simple)." },
            { word: "agréabe",    correction: "agréable",   explanation: "Il manque le « l » : a-g-r-é-a-b-l-e." },
            { word: "voizin",     correction: "voisin",     explanation: "S et non Z : voisin." },
            { word: "chein",      correction: "chien",      explanation: "Inversion de lettres : c-h-i-e-n." },
            { word: "mintues",    correction: "minutes",    explanation: "Inversion de lettres : m-i-n-u-t-e-s." },
            { word: "famillie",   correction: "famille",    explanation: "Un seul « l » dans famille." },
        ],
    },

    // ── FACILE — INCOHÉRENCES SÉMANTIQUES ────────────────────────────────────
    {
        id: "incoherences-facile",
        difficulty: "facile",
        errorType: "incohérences sémantiques",
        instruction: "Signalez les mots qui créent une incohérence ou une impossibilité logique.",
        markedText:
            "Ce soir, la famille Dupont regardait le journal télévisé. " +
            "Le présentateur rappelait que le soleil se lève toujours à [[l'ouest]]. " +
            "Le père parcourait le journal de [[demain]] pendant que le chien [[miaulait]] doucement dans son coin. " +
            "Les enfants faisaient leurs devoirs au soleil de [[minuit]]. " +
            "La mère prépara une boisson [[fraîche]] pour se réchauffer. " +
            "Puis toute la famille alla se coucher après avoir [[allumé]] les lumières.",
        errors: [
            { word: "l'ouest",  correction: "l'est",       explanation: "Le soleil se lève à l'est, pas à l'ouest." },
            { word: "demain",   correction: "aujourd'hui", explanation: "Le journal de demain n'est pas encore imprimé." },
            { word: "miaulait", correction: "aboyait",     explanation: "Un chien aboie ; ce sont les chats qui miaulent." },
            { word: "minuit",   correction: "midi",        explanation: "Le soleil brille en plein jour, pas à minuit." },
            { word: "fraîche",  correction: "chaude",      explanation: "On se réchauffe avec une boisson chaude, pas fraîche." },
            { word: "allumé",   correction: "éteint",      explanation: "On éteint les lumières avant d'aller se coucher." },
        ],
    },

    // ── MOYEN — ORTHOGRAPHE SUBTILE ───────────────────────────────────────────
    {
        id: "ortho-moyen",
        difficulty: "moyen",
        errorType: "orthographe — niveau avancé",
        instruction: "Signalez toutes les fautes d'orthographe ou d'accord, même les plus subtiles.",
        markedText:
            "La semaine dernière, Marie [[c'est]] rendue au marché pour acheter des légumes. " +
            "Elle a [[choisit]] des tomates bien [[mures]] et du persil [[fraîche]]. " +
            "En rentrant, elle a remarqué avoir [[oublier]] son porte-monnaie chez elle. " +
            "Par chance, le marchand lui a [[fais]] confiance. " +
            "Elle lui a promis de le [[rembourcer]] le lendemain. " +
            "Cette [[experience]] lui a appris à toujours vérifier ses affaires avant de sortir.",
        errors: [
            { word: "c'est",       correction: "s'est",       explanation: "Verbe pronominal : s'est rendue (confusion c'est / s'est)." },
            { word: "choisit",     correction: "choisi",      explanation: "Participe passé de choisir : choisi (choisit = passé simple)." },
            { word: "mures",       correction: "mûres",       explanation: "Accent circonflexe obligatoire : mûres." },
            { word: "fraîche",     correction: "frais",       explanation: "Persil est masculin : du persil frais." },
            { word: "oublier",     correction: "oublié",      explanation: "Participe passé : a oublié (avec accent)." },
            { word: "fais",        correction: "fait",        explanation: "Participe passé de faire : a fait." },
            { word: "rembourcer",  correction: "rembourser",  explanation: "Le verbe s'écrit rembourser (avec s, pas c)." },
            { word: "experience",  correction: "expérience",  explanation: "Accent obligatoire : expérience." },
        ],
    },

    // ── MOYEN — MÉLANGE ORTHOGRAPHE + INCOHÉRENCES ───────────────────────────
    {
        id: "melange-moyen",
        difficulty: "moyen",
        errorType: "orthographe et incohérences mélangées",
        instruction: "Signalez toutes les fautes d'orthographe ET les incohérences logiques.",
        markedText:
            "Pendant ses vacances en Espagne, Thomas a visité Madrid, connue pour ses [[magnifics]] monuments. " +
            "Il a pris l'avion depuis Paris et est arrivé en [[France]] le lendemain. " +
            "Installé dans son hôtel, il a mangé des tapas en écoutant des chansons en [[ittalien]]. " +
            "Il a aussi visité un musée qui exposait des tableaux [[ancians]]. " +
            "Le dernier jour, il a [[acheter]] des souvenirs pour sa famille. " +
            "Thomas garde un [[trés]] bon souvenir de ce voyage enrichissant.",
        errors: [
            { word: "magnifics",  correction: "magnifiques", explanation: "L'adjectif s'écrit magnifiques." },
            { word: "France",     correction: "Espagne",     explanation: "Il était en Espagne pour ses vacances, pas en France." },
            { word: "ittalien",   correction: "italien",     explanation: "Un seul « t » dans italien." },
            { word: "ancians",    correction: "anciens",     explanation: "L'adjectif s'écrit anciens." },
            { word: "acheter",    correction: "acheté",      explanation: "Participe passé : il a acheté (avec accent)." },
            { word: "trés",       correction: "très",        explanation: "Accent grave et non aigu : très." },
        ],
    },

    // ── DIFFICILE — HOMOPHONES ET ACCENTS ────────────────────────────────────
    {
        id: "homophones-difficile",
        difficulty: "difficile",
        errorType: "homophones et accents",
        instruction: "Repérez les homophones mal employés et les accents incorrects ou manquants.",
        markedText:
            "Claire est une photographe réputée. " +
            "Samedi, elle a été invitée [[a]] présenter son travail lors d'une exposition. " +
            "Elle ne savait pas [[ou]] se déroulerait l'événement, car le message reçu était peu clair. " +
            "En arrivant sur place, elle a [[trouver]] un bâtiment vide et désert. " +
            "Son assistante lui a alors [[confirmer]] que la salle avait [[changée]] au dernier moment. " +
            "Malgré ce contretemps, l'exposition a remporté un vif [[succées]].",
        errors: [
            { word: "a",        correction: "à",        explanation: "Préposition « à » (accent grave) devant l'infinitif — à ne pas confondre avec l'auxiliaire « a »." },
            { word: "ou",       correction: "où",       explanation: "Adverbe interrogatif de lieu : où (accent grave)." },
            { word: "trouver",  correction: "trouvé",   explanation: "Participe passé : elle a trouvé (avec accent)." },
            { word: "confirmer",correction: "confirmé", explanation: "Participe passé : a confirmé." },
            { word: "changée",  correction: "changé",   explanation: "Changer employé intransitivement : participe invariable — a changé." },
            { word: "succées",  correction: "succès",   explanation: "Le mot s'écrit succès (accent grave sur le premier e, accent grave sur le deuxième)." },
        ],
    },

    // ── DIFFICILE — INCOHÉRENCES LOGIQUES COMPLEXES ───────────────────────────
    {
        id: "incoherences-difficile",
        difficulty: "difficile",
        errorType: "incohérences logiques",
        instruction: "Repérez les mots qui créent des contradictions ou impossibilités dans le texte.",
        markedText:
            "Lors d'un dîner de gala, le chef présenta son nouveau menu. " +
            "En entrée, il servit une soupe [[glacée]] pour réchauffer les convives par ce soir d'hiver. " +
            "Le plat principal était un poisson pêché en plein [[désert]], accompagné de légumes frais. " +
            "Pour le dessert, il avait préparé un fondant au chocolat [[salé]] qui ravit les palais sucrés. " +
            "Le sommelier recommanda un vin [[rouge]] pour accompagner le poisson, mais apporta finalement du blanc. " +
            "Les convives exprimèrent leur enthousiasme en applaudissant [[silencieusement]]. " +
            "À [[minuit]], le chef sortit admirer le soleil levant avant de regagner ses cuisines.",
        errors: [
            { word: "glacée",           correction: "chaude",        explanation: "Une soupe glacée ne réchauffe pas les convives." },
            { word: "désert",           correction: "mer",           explanation: "Le poisson se pêche en mer ou en rivière, pas dans le désert." },
            { word: "salé",             correction: "sucré",         explanation: "Un dessert est normalement sucré, pas salé." },
            { word: "rouge",            correction: "blanc",         explanation: "On recommande un vin blanc pour le poisson — contradiction avec la bouteille de blanc apportée." },
            { word: "silencieusement",  correction: "bruyamment",    explanation: "Des applaudissements silencieux ne peuvent pas exprimer l'enthousiasme." },
            { word: "minuit",           correction: "l'aube",        explanation: "Le soleil levant se voit à l'aube, pas à minuit." },
        ],
    },
];

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    fontSize:   string;
    lineHeight: string;
    empan:      number;
}> = {
    facile:    { fontSize: "text-lg",   lineHeight: "leading-9", empan: 3 },
    moyen:     { fontSize: "text-base", lineHeight: "leading-8", empan: 5 },
    difficile: { fontSize: "text-sm",   lineHeight: "leading-7", empan: 7 },
};

// ─── Tokenizer ────────────────────────────────────────────────────────────────
// Reconnaît [[mot]], [[mot]], [[mot]]. — ponctuation hors des crochets.

function buildTokens(markedText: string): WordToken[] {
    return markedText.split(/\s+/).filter(Boolean).map((part, idx) => {
        const m = part.match(/^\[\[(.+?)\]\]([.,!?;:]*)$/);
        const isError   = !!m;
        const rawDisplay = isError ? m![1] + m![2] : part;

        const stripped = rawDisplay
            .replace(/^[.,!?;:\u2014\-]+/, "")
            .replace(/[.,!?;:\u2014\-]+$/, "")
            .toLowerCase();

        // Résoudre les contractions françaises (l', d', qu', etc.)
        const apoMatch = stripped.match(/^([ldjcmnstq]u?)[\u2019'](.+)$/);
        const clean    = apoMatch ? apoMatch[2] : stripped;

        return { id: idx, word: clean, display: rawDisplay, isTarget: isError, selected: false };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DetectionErreurs({ patientId }: { patientId: string | null }) {
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
        const totalErrors = tokens.filter(t => t.isTarget).length;
        const hits        = tokens.filter(t => t.isTarget  &&  t.selected).length;
        const falseAlarms = tokens.filter(t => !t.isTarget && t.selected).length;
        const score       = Math.max(0, Math.round(((hits - falseAlarms) / (totalErrors || 1)) * 100));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Détection d'erreurs",
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

    const totalErrors = tokens.filter(t => t.isTarget).length;
    const hits        = tokens.filter(t => t.isTarget &&  t.selected).length;
    const misses      = tokens.filter(t => t.isTarget && !t.selected).length;
    const falseAlarms = tokens.filter(t => !t.isTarget && t.selected).length;
    const selected    = tokens.filter(t => t.selected).length;
    const score       = Math.max(0, Math.round(((hits - falseAlarms) / (totalErrors || 1)) * 100));

    // Error tokens in order (aligned with passage.errors[])
    const errorTokens = tokens.filter(t => t.isTarget);

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    // ── Token styling ──────────────────────────────────────────────────────────

    function tokenClass(t: WordToken): string {
        const base = "rounded px-0.5 transition-colors duration-100 ";
        if (phase === "playing") {
            if (t.selected)
                return base + "bg-amber-400 dark:bg-amber-500 text-white cursor-pointer";
            return base + "hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer";
        }
        // finished
        if (t.isTarget && t.selected)
            return base + "bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-100 font-semibold";
        if (t.isTarget && !t.selected)
            return base + "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 underline decoration-wavy decoration-red-400 underline-offset-2";
        if (!t.isTarget && t.selected)
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
                        Un texte contenant des <strong>erreurs intentionnelles</strong> s'affiche.<br />
                        Lisez attentivement et <strong>cliquez sur chaque mot incorrect</strong>
                        — faute d'orthographe, d'accord, d'homophone ou incohérence logique.<br />
                        <span className="text-xs text-slate-400">
                            Cliquez à nouveau pour désélectionner. Validez quand vous avez terminé.
                        </span>
                    </p>

                    {/* Difficulty cards */}
                    <div className="grid grid-cols-3 gap-3 text-xs text-left max-w-md w-full">
                        {([
                            { d: "facile",    label: "Facile",    types: "Orthographe simple · Incohérences évidentes",      n: "6–7 erreurs" },
                            { d: "moyen",     label: "Moyen",     types: "Accords · Participes · Mélange orthographe/sens",  n: "6–8 erreurs" },
                            { d: "difficile", label: "Difficile", types: "Homophones · Accents · Contradictions subtiles",    n: "6 erreurs" },
                        ] as const).map(({ d, label, types, n }) => (
                            <div
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`rounded-lg border p-2 cursor-pointer transition-colors duration-150 ${
                                    difficulty === d
                                        ? "bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600"
                                        : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-amber-300"
                                }`}
                            >
                                <p className={`font-semibold mb-0.5 ${difficulty === d ? "text-amber-700 dark:text-amber-300" : "text-slate-700 dark:text-slate-200"}`}>
                                    {label}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">{types}</p>
                                <p className="text-slate-400 dark:text-slate-500 mt-0.5">{n}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors duration-200"
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
                                Type&nbsp;:
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 capitalize">
                                {passage.errorType}
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 italic hidden sm:block flex-1 text-center">
                            {passage.instruction}
                        </p>

                        <div className="flex items-center gap-3 shrink-0 text-xs">
                            <span className="text-slate-400 dark:text-slate-500 tabular-nums font-mono">
                                {formatTime(elapsed)}
                            </span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
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
                            Cliquez sur les mots erronés, puis validez.
                        </span>
                        <button
                            onClick={validate}
                            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
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
                                    ✓ Trouvées&nbsp;: {hits}&nbsp;/&nbsp;{totalErrors}
                                </p>
                                <p className="text-amber-500 font-medium">◌ Manquées&nbsp;: {misses}</p>
                                <p className="text-red-400 font-medium">✗ Erreurs de signal&nbsp;: {falseAlarms}</p>
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
                            <span className="w-4 h-3 rounded bg-green-300 dark:bg-green-800 inline-block"/>Erreur trouvée ✓
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-amber-300 dark:bg-amber-800 inline-block"/>Erreur manquée (soulignement)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-red-300 dark:bg-red-800 inline-block"/>Fausse alarme (non-erreur signalé)
                        </span>
                    </div>

                    {/* Scored text + explanations */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

                        {/* Text with colour-coded tokens */}
                        <div className={`flex flex-wrap gap-x-1 ${cfg.fontSize} ${cfg.lineHeight} text-slate-800 dark:text-slate-200`}>
                            {tokens.map(t => (
                                <span key={t.id} className={tokenClass(t)}>
                                    {t.display}
                                </span>
                            ))}
                        </div>

                        {/* Error correction table */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Corrections ({totalErrors} erreur{totalErrors > 1 ? "s" : ""})
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {passage.errors.map((err, i) => {
                                    const tok     = errorTokens[i];
                                    const found   = tok?.selected ?? false;
                                    return (
                                        <div key={i} className="flex items-start gap-3 px-3 py-2 text-sm">
                                            {/* Status icon */}
                                            <span className={`shrink-0 font-bold mt-0.5 ${found ? "text-green-500" : "text-amber-500"}`}>
                                                {found ? "✓" : "◌"}
                                            </span>
                                            {/* Error → correction */}
                                            <div className="flex-1 min-w-0">
                                                <span className="font-mono text-red-600 dark:text-red-400 font-semibold">
                                                    {err.word}
                                                </span>
                                                <span className="text-slate-400 mx-1.5">→</span>
                                                <span className="font-mono text-green-700 dark:text-green-400 font-semibold">
                                                    {err.correction}
                                                </span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {err.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* False alarm list */}
                        {falseAlarms > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm">
                                <p className="font-semibold text-red-700 dark:text-red-300 mb-1">
                                    Fausses alarmes ({falseAlarms}) — mots corrects signalés par erreur&nbsp;:
                                </p>
                                <p className="text-red-800 dark:text-red-200 font-mono">
                                    {tokens
                                        .filter(t => !t.isTarget && t.selected)
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

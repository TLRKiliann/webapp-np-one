"use client";

import { useState, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface WordToken {
    id: number;
    word: string;      // mot nettoyé (lowercase, sans ponctuation)
    display: string;   // texte affiché (avec ponctuation)
    isTarget: boolean; // ce token est une information pertinente
    selected: boolean; // le patient l'a surligné
}

interface RawPassage {
    id: string;
    difficulty: Difficulty;
    objective: string;  // question / objectif de lecture
    context: string;    // contexte donné au patient
    text: string;
    targets: string[];  // mots porteurs d'information pertinente
}

// ─── Passages ─────────────────────────────────────────────────────────────────

const RAW_PASSAGES: RawPassage[] = [

    // ── FACILE ──────────────────────────────────────────────────────────────────
    {
        id: "rendez-vous",
        difficulty: "facile",
        context: "Vous avez reçu un message de votre médecin.",
        objective: "Surlignez toutes les informations utiles pour vous rendre au rendez-vous (heure, lieu, préparation).",
        text:
            "Bonjour, votre rendez-vous est fixé au jeudi 15 mai à neuf heures trente. " +
            "Le cabinet se trouve au douze rue des Lilas, au deuxième étage, sonnette Docteur Bernard. " +
            "Merci de venir à jeun et de prévoir votre carte vitale ainsi que votre ordonnance. " +
            "En cas d'empêchement, merci d'annuler avant la veille au numéro indiqué. " +
            "La consultation durera environ trente minutes. " +
            "Le parking le plus proche est situé rue du Marché.",
        targets: [
            "jeudi", "15", "mai", "neuf", "heures", "trente",
            "douze", "rue", "des", "Lilas", "deuxième", "étage",
            "jeun", "carte", "vitale", "ordonnance",
        ],
    },
    {
        id: "recette",
        difficulty: "facile",
        context: "Vous lisez une recette de cuisine.",
        objective: "Surlignez uniquement les ingrédients et leurs quantités.",
        text:
            "La tarte aux pommes est un dessert classique apprécié de tous. " +
            "Pour la réaliser, il vous faut une pâte brisée, six pommes, " +
            "cinquante grammes de beurre, trois cuillères de sucre et une pincée de cannelle. " +
            "Préchauffez votre four à cent quatre-vingts degrés. " +
            "Pelez et coupez les pommes en fines lamelles. " +
            "Étalez la pâte dans un moule, disposez les pommes, " +
            "parsemez de beurre en morceaux et saupoudrez de sucre et de cannelle. " +
            "Faites cuire pendant trente-cinq minutes jusqu'à obtenir une belle dorure.",
        targets: [
            "pâte", "brisée", "six", "pommes",
            "cinquante", "grammes", "beurre",
            "trois", "cuillères", "sucre",
            "pincée", "cannelle",
        ],
    },

    // ── MOYEN ───────────────────────────────────────────────────────────────────
    {
        id: "annonce-location",
        difficulty: "moyen",
        context: "Vous cherchez un appartement à louer.",
        objective: "Surlignez toutes les informations pratiques importantes (surface, loyer, charges, localisation, contact).",
        text:
            "À louer : bel appartement de type trois pièces, situé au quatrième étage avec ascenseur, " +
            "dans le quartier Saint-Michel, à deux minutes du métro. " +
            "Surface habitable de soixante-douze mètres carrés, comprenant un séjour lumineux, " +
            "deux chambres, une cuisine équipée et une salle de bain avec baignoire. " +
            "La copropriété est récente et bien entretenue, avec un digicode à l'entrée. " +
            "Loyer mensuel de neuf cent cinquante euros, charges comprises, " +
            "soit cent vingt euros de charges mensuelles incluant l'eau chaude et le chauffage collectif. " +
            "Dépôt de garantie équivalent à deux mois de loyer. " +
            "Disponible à partir du premier juillet. " +
            "Pour visiter, contacter Madame Renaud au zéro six quarante-deux dix-sept quatre-vingt-cinq.",
        targets: [
            "trois", "pièces", "quatrième", "étage",
            "Saint-Michel", "deux", "minutes", "métro",
            "soixante-douze", "mètres", "carrés",
            "neuf", "cent", "cinquante", "euros",
            "charges", "comprises",
            "premier", "juillet",
            "zéro", "six", "quarante-deux", "dix-sept", "quatre-vingt-cinq",
        ],
    },
    {
        id: "programme-formation",
        difficulty: "moyen",
        context: "Vous envisagez de suivre une formation professionnelle.",
        objective: "Surlignez les informations importantes pour vous inscrire (dates, durée, lieu, coût, conditions).",
        text:
            "Nous vous proposons une formation en bureautique avancée, ouverte à tous les demandeurs d'emploi. " +
            "La session débutera le lundi trois mars et se terminera le vendredi vingt-huit mars. " +
            "Les cours se tiennent du lundi au vendredi, de neuf heures à seize heures trente, " +
            "dans nos locaux au vingt-deux avenue de la République, salle B. " +
            "La formation est entièrement gratuite pour les personnes bénéficiaires du RSA ou d'une allocation chômage. " +
            "Pour les autres participants, le tarif est de quatre cent cinquante euros. " +
            "Les places sont limitées à douze participants. " +
            "Aucun prérequis n'est nécessaire, mais une maîtrise de base de l'outil informatique est recommandée. " +
            "Les inscriptions sont ouvertes jusqu'au vendredi vingt et un février " +
            "par e-mail à formation@centreformation.fr ou par téléphone au zéro un quarante-cinq vingt-deux trente.",
        targets: [
            "trois", "mars", "vendredi", "vingt-huit",
            "neuf", "heures", "seize", "heures", "trente",
            "vingt-deux", "avenue", "de", "la", "République", "salle", "B",
            "gratuite",
            "quatre", "cent", "cinquante", "euros",
            "douze", "participants",
            "vingt", "et", "un", "février",
            "formation@centreformation.fr",
        ],
    },

    // ── DIFFICILE ───────────────────────────────────────────────────────────────
    {
        id: "article-presse",
        difficulty: "difficile",
        context: "Vous lisez un article de journal sur un accident de la route.",
        objective: "Surlignez uniquement les faits objectifs (qui, quoi, où, quand, bilan), en ignorant les opinions et commentaires.",
        text:
            "Un grave accident de la circulation s'est produit hier soir, vers vingt-deux heures, " +
            "sur la route nationale sept au niveau du lieu-dit Les Quatre-Chemins, commune de Valbonne. " +
            "Deux véhicules sont entrés en collision frontale après qu'une voiture a déboîté sur la voie opposée. " +
            "Le conducteur du premier véhicule, un homme de quarante-trois ans, " +
            "a été hélitreuillé et transporté au CHU de Nice dans un état grave. " +
            "Les deux passagères du second véhicule, légèrement blessées, ont été prises en charge par le SAMU. " +
            "Les secours ont mobilisé trois pompiers et deux équipes du SAMU. " +
            "La route a été fermée à la circulation pendant deux heures. " +
            "Les autorités rappellent que la prudence est de mise sur ce tronçon réputé dangereux, " +
            "et que les comportements irresponsables au volant restent inacceptables.",
        targets: [
            "hier", "soir", "vingt-deux", "heures",
            "nationale", "sept", "Les", "Quatre-Chemins", "Valbonne",
            "Deux", "véhicules", "collision", "frontale",
            "quarante-trois", "ans",
            "CHU", "de", "Nice", "état", "grave",
            "deux", "passagères", "légèrement", "blessées",
            "trois", "pompiers", "deux", "équipes", "SAMU",
            "fermée", "deux", "heures",
        ],
    },
    {
        id: "notice-medicament",
        difficulty: "difficile",
        context: "Vous lisez la notice d'un médicament.",
        objective: "Surlignez uniquement les informations essentielles à la prise du médicament (posologie, contre-indications, effets indésirables graves).",
        text:
            "Ce médicament est indiqué dans le traitement des douleurs légères à modérées. " +
            "La posologie recommandée est d'un comprimé toutes les six heures, sans dépasser quatre comprimés par jour. " +
            "Ne pas écraser le comprimé. L'avaler avec un grand verre d'eau, de préférence au moment des repas. " +
            "Ce médicament est contre-indiqué chez les patients souffrant d'insuffisance rénale sévère, " +
            "d'allergie au paracétamol ou ayant des antécédents d'ulcère gastrique. " +
            "Les effets indésirables les plus fréquents sont des maux de tête et des nausées légères. " +
            "En cas de réaction allergique grave, d'essoufflement ou d'œdème du visage, " +
            "arrêtez immédiatement le traitement et consultez un médecin en urgence. " +
            "Conservez ce médicament à l'abri de la lumière et de l'humidité, à température ambiante. " +
            "Tenir hors de portée des enfants. " +
            "Ce produit est fabriqué selon les normes ISO 9001 et bénéficie d'un label de qualité européen.",
        targets: [
            "un", "comprimé", "toutes", "les", "six", "heures",
            "quatre", "comprimés", "par", "jour",
            "insuffisance", "rénale", "sévère",
            "allergie", "paracétamol",
            "ulcère", "gastrique",
            "réaction", "allergique", "grave", "essoufflement", "œdème",
            "arrêtez", "immédiatement", "médecin", "urgence",
        ],
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
        const stripped = part
            .replace(/^[.,!?;:«»"""'''\u2018\u2019()\[\]\u2014\-]+/, "")
            .replace(/[.,!?;:«»"""'''\u2018\u2019()\[\]\u2014\-]+$/, "")
            .toLowerCase();

        // Résoudre les contractions françaises : l'word, d'word, qu'word…
        const apoMatch = stripped.match(/^([ldjcmnstq]u?)[\u2019'](.+)$/);
        const clean    = apoMatch ? apoMatch[2] : stripped;

        return {
            id:       idx,
            word:     clean,
            display:  part,
            isTarget: targetSet.has(clean),
            selected: false,
        };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SurlignageSelectif({ patientId }: { patientId: string | null }) {
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
        setTokens(buildTokens(picked.text, picked.targets));
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
        const totalTargets = tokens.filter(t => t.isTarget).length;
        const hits         = tokens.filter(t => t.isTarget  &&  t.selected).length;
        const falseAlarms  = tokens.filter(t => !t.isTarget && t.selected).length;
        const score        = Math.max(0, Math.round(((hits - falseAlarms) / (totalTargets || 1)) * 100));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Surlignage sélectif",
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

    const totalTargets = tokens.filter(t => t.isTarget).length;
    const hits         = tokens.filter(t => t.isTarget  &&  t.selected).length;
    const misses       = tokens.filter(t => t.isTarget  && !t.selected).length;
    const falseAlarms  = tokens.filter(t => !t.isTarget &&  t.selected).length;
    const selected     = tokens.filter(t => t.selected).length;
    const score        = Math.max(0, Math.round(((hits - falseAlarms) / (totalTargets || 1)) * 100));

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    // ── Token styling ──────────────────────────────────────────────────────────

    function tokenClass(t: WordToken): string {
        const base = "rounded px-0.5 transition-colors duration-100 ";
        if (phase === "playing") {
            if (t.selected)
                return base + "bg-yellow-300 dark:bg-yellow-500/70 text-yellow-900 dark:text-yellow-100 cursor-pointer";
            return base + "hover:bg-yellow-100 dark:hover:bg-yellow-900/40 hover:text-yellow-800 dark:hover:text-yellow-200 cursor-pointer";
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

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Un texte s'affiche avec un <strong>objectif de lecture</strong>.<br />
                        Lisez le texte et <strong>surlignez les mots porteurs d'information pertinente</strong>
                        {" "}en cliquant dessus — comme un surligneur jaune.<br />
                        <span className="text-xs text-slate-400">
                            Cliquez à nouveau pour désurlignier. Validez quand vous avez terminé.
                        </span>
                    </p>

                    {/* Difficulty cards */}
                    <div className="grid grid-cols-3 gap-3 text-xs text-left max-w-md w-full">
                        {([
                            { d: "facile",    label: "Facile",    desc: "Rendez-vous · Recette",             n: "~12 mots cibles" },
                            { d: "moyen",     label: "Moyen",     desc: "Annonce · Programme",               n: "~20 mots cibles" },
                            { d: "difficile", label: "Difficile", desc: "Article de presse · Notice médicale", n: "~18 mots cibles" },
                        ] as const).map(({ d, label, desc, n }) => (
                            <div
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`rounded-lg border p-2 cursor-pointer transition-colors duration-150 ${
                                    difficulty === d
                                        ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600"
                                        : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-yellow-300"
                                }`}
                            >
                                <p className={`font-semibold mb-0.5 ${difficulty === d ? "text-yellow-700 dark:text-yellow-300" : "text-slate-700 dark:text-slate-200"}`}>
                                    {label}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">{desc}</p>
                                <p className="text-slate-400 dark:text-slate-500 mt-0.5">{n}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg font-medium transition-colors duration-200"
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
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
                                Contexte&nbsp;:
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 truncate">
                                {passage.context}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs">
                            <span className="text-slate-400 dark:text-slate-500 tabular-nums font-mono">
                                {formatTime(elapsed)}
                            </span>
                            <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                                {selected} surligné{selected > 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>

                    {/* Objective banner */}
                    <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 shrink-0">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            <span className="font-bold">Objectif :</span> {passage.objective}
                        </p>
                    </div>

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
                            Cliquez sur les mots pertinents, puis validez.
                        </span>
                        <button
                            onClick={validate}
                            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Valider mes surlignages
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
                                    ✓ Trouvés&nbsp;: {hits}&nbsp;/&nbsp;{totalTargets}
                                </p>
                                <p className="text-amber-500 font-medium">◌ Manqués&nbsp;: {misses}</p>
                                <p className="text-red-400 font-medium">✗ Hors sujet&nbsp;: {falseAlarms}</p>
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

                    {/* Objective reminder */}
                    <div className="px-4 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 shrink-0">
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 italic">
                            <span className="font-semibold">Objectif :</span> {passage.objective}
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 px-4 py-1.5 text-xs border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-green-300 dark:bg-green-800 inline-block"/>Pertinent trouvé ✓
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-amber-300 dark:bg-amber-800 inline-block"/>Pertinent manqué (soulignement)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-3 rounded bg-red-300 dark:bg-red-800 inline-block"/>Hors sujet surligné
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

                        {/* Missed targets */}
                        {misses > 0 && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
                                <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                                    Informations pertinentes non surlignées ({misses})&nbsp;:
                                </p>
                                <p className="text-amber-800 dark:text-amber-200">
                                    {tokens
                                        .filter(t => t.isTarget && !t.selected)
                                        .map(t => t.display.replace(/[.,!?;:]+$/, ""))
                                        .join(", ")}
                                </p>
                            </div>
                        )}

                        {/* False alarms */}
                        {falseAlarms > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm">
                                <p className="font-semibold text-red-700 dark:text-red-300 mb-1">
                                    Mots hors sujet surlignés ({falseAlarms})&nbsp;:
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

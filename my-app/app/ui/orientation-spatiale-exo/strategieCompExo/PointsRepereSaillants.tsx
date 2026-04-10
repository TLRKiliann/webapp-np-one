"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

// ─── Data types ───────────────────────────────────────────────────────────────

interface Element {
    id: number;
    icon: string;
    name: string;
    isSalient: boolean;
    reason: string;   // educational feedback shown after validation
}

interface Scenario {
    name: string;
    sceneIcon: string;
    description: string;
    elements: Element[];  // first 4 are salient, remaining are non-salient
}

// ─── Scenarios (4 salient + 4 non-salient each) ───────────────────────────────

const SCENARIOS: Scenario[] = [
    {
        name: "Rue du marché",
        sceneIcon: "🏘️",
        description: "Vous traversez une rue animée avec commerces et habitations.",
        elements: [
            { id: 0, icon: "⛪", name: "Clocher d'église", isSalient: true,  reason: "👁️ Visible de très loin — repère idéal pour s'orienter de loin." },
            { id: 1, icon: "🏪", name: "Boulangerie enseigne rouge", isSalient: true,  reason: "🎯 Couleur distinctive, permanent — facile à reconnaître." },
            { id: 2, icon: "🌳", name: "Vieux chêne centenaire", isSalient: true,  reason: "🎯 Unique dans l'environnement — ne ressemble à aucun autre arbre." },
            { id: 3, icon: "🚦", name: "Carrefour avec feux tricolores", isSalient: true,  reason: "🗺️ Point de décision stratégique — toujours présent, visible." },
            { id: 4, icon: "🚗", name: "Voiture bleue garée", isSalient: false, reason: "🔄 Mobile — les voitures se déplacent, ne pas s'y fier." },
            { id: 5, icon: "🪑", name: "Banc de bois", isSalient: false, reason: "😶 Trop générique et discret — difficile à distinguer des autres." },
            { id: 6, icon: "🏠", name: "Maison grise ordinaire", isSalient: false, reason: "😶 Trop commun — ressemble à des dizaines d'autres maisons." },
            { id: 7, icon: "📦", name: "Carton d'emballage au sol", isSalient: false, reason: "🚫 Temporaire — sera enlevé, pas fiable comme repère." },
        ],
    },
    {
        name: "Couloir d'hôpital",
        sceneIcon: "🏥",
        description: "Vous vous orientez dans les couloirs d'un grand hôpital.",
        elements: [
            { id: 0, icon: "🔵", name: "Grand panneau bleu URGENCES", isSalient: true,  reason: "🎯 Couleur et taille distinctives — visible depuis loin, permanent." },
            { id: 1, icon: "✝️", name: "Croix rouge au mur (pharmacie)", isSalient: true,  reason: "🎯 Symbole unique — incontournable, toujours présent." },
            { id: 2, icon: "🪟", name: "Grande fenêtre panoramique", isSalient: true,  reason: "👁️ Repère architectural unique — visible depuis plusieurs couloirs." },
            { id: 3, icon: "🚪", name: "Porte jaune 'Bloc A'", isSalient: true,  reason: "🎯 Couleur distinctive + numéro — repère double, très fiable." },
            { id: 4, icon: "🗑️", name: "Poubelle grise", isSalient: false, reason: "😶 Trop générique — il y en a partout, ne se distingue pas." },
            { id: 5, icon: "💡", name: "Luminaire de plafond standard", isSalient: false, reason: "😶 Identique dans tout le couloir — aucune valeur d'orientation." },
            { id: 6, icon: "🪑", name: "Chaise en plastique", isSalient: false, reason: "🔄 Peut être déplacée — pas fiable, trop commune." },
            { id: 7, icon: "📋", name: "Feuille affichée au mur", isSalient: false, reason: "🚫 Temporaire — les affiches changent régulièrement." },
        ],
    },
    {
        name: "Gare ferroviaire",
        sceneIcon: "🚉",
        description: "Vous cherchez votre quai dans une grande gare.",
        elements: [
            { id: 0, icon: "🕰️", name: "Grande horloge centrale", isSalient: true,  reason: "👁️ Visible depuis tout le hall — point de repère central classique." },
            { id: 1, icon: "📋", name: "Tableau électronique des départs", isSalient: true,  reason: "🗺️ Point de convergence stratégique — tout le monde s'y réfère." },
            { id: 2, icon: "☕", name: "Café avec terrasse rouge", isSalient: true,  reason: "🎯 Couleur et position distinctives — permanent, facilement mémorisable." },
            { id: 3, icon: "🗽", name: "Statue de bronze à l'entrée", isSalient: true,  reason: "🎯 Unique dans la gare — aucune confusion possible." },
            { id: 4, icon: "🧳", name: "Valises abandonnées sur un chariot", isSalient: false, reason: "🚫 Temporaire — disparaîtra dès que le voyageur repart." },
            { id: 5, icon: "🗑️", name: "Poubelle bleue", isSalient: false, reason: "😶 Trop générique — identique à des dizaines d'autres poubelles." },
            { id: 6, icon: "🚶", name: "Groupe de voyageurs debout", isSalient: false, reason: "🔄 Mobile — les personnes se déplacent, inutile comme repère fixe." },
            { id: 7, icon: "📰", name: "Kiosque à journaux (fermé le soir)", isSalient: false, reason: "🚫 Pas toujours présent — fermé selon les horaires, peu fiable." },
        ],
    },
    {
        name: "Quartier résidentiel",
        sceneIcon: "🌆",
        description: "Vous vous promenez dans un quartier que vous ne connaissez pas bien.",
        elements: [
            { id: 0, icon: "🏛️", name: "Mairie avec drapeau tricolore", isSalient: true,  reason: "🎯 Bâtiment officiel distinctif — permanent, souvent en hauteur." },
            { id: 1, icon: "🏫", name: "École avec grandes grilles bleues", isSalient: true,  reason: "🎯 Grand bâtiment reconnaissable — grilles colorées distinctives." },
            { id: 2, icon: "⛲", name: "Fontaine de la place centrale", isSalient: true,  reason: "🗺️ Au centre géographique — point de navigation stratégique." },
            { id: 3, icon: "🌳", name: "Double rangée de platanes taillés", isSalient: true,  reason: "👁️ Alignement visible de loin — structure végétale distinctive." },
            { id: 4, icon: "🏗️", name: "Échafaudage de chantier", isSalient: false, reason: "🚫 Temporaire — sera démonté à la fin des travaux." },
            { id: 5, icon: "📫", name: "Boîtes aux lettres jaunes", isSalient: false, reason: "😶 Trop petit et générique — plusieurs dans chaque rue." },
            { id: 6, icon: "🏠", name: "Pavillon avec jardin fleuri", isSalient: false, reason: "😶 Trop commun — ressemble à beaucoup d'autres pavillons." },
            { id: 7, icon: "🚐", name: "Camion de livraison garé", isSalient: false, reason: "🔄 Mobile — repartira après la livraison, non fiable." },
        ],
    },
    {
        name: "Centre commercial",
        sceneIcon: "🛍️",
        description: "Vous cherchez votre chemin dans un grand centre commercial.",
        elements: [
            { id: 0, icon: "🎠", name: "Manège central visible de partout", isSalient: true,  reason: "👁️ Visible depuis toutes les allées — repère central idéal." },
            { id: 1, icon: "📍", name: "Plan interactif 'Vous êtes ici'", isSalient: true,  reason: "🗺️ Point de navigation stratégique — conçu pour s'orienter." },
            { id: 2, icon: "⛲", name: "Fontaine avec jets d'eau lumineux", isSalient: true,  reason: "🎯 Visible et audible — repère multi-sensoriel très mémorable." },
            { id: 3, icon: "🏦", name: "Façade vitrée de la banque (angle)", isSalient: true,  reason: "🎯 Position angulaire distinctive — permanent, bien visible." },
            { id: 4, icon: "🪑", name: "Banc sous les escalators", isSalient: false, reason: "😶 Générique et discret — plusieurs bancs identiques dans le centre." },
            { id: 5, icon: "🗑️", name: "Corbeille à papier", isSalient: false, reason: "😶 Trop commun — ne se distingue pas des autres corbeilles." },
            { id: 6, icon: "🎄", name: "Sapin de Noël décoratif", isSalient: false, reason: "🚫 Saisonnier — présent seulement quelques semaines par an." },
            { id: 7, icon: "🎈", name: "Ballons publicitaires d'un magasin", isSalient: false, reason: "🚫 Temporaire — campagne promotionnelle, disparaît rapidement." },
        ],
    },
    {
        name: "Parc naturel",
        sceneIcon: "🌲",
        description: "Vous faites une promenade dans un grand parc forestier.",
        elements: [
            { id: 0, icon: "🗼", name: "Pylône électrique au sommet", isSalient: true,  reason: "👁️ Visible de très loin — permanent, unique dans le paysage." },
            { id: 1, icon: "🏠", name: "Kiosque en pierre du 19e siècle", isSalient: true,  reason: "🎯 Architecture unique — seul bâtiment en pierre, permanent." },
            { id: 2, icon: "⛲", name: "Fontaine aux lions à l'entrée", isSalient: true,  reason: "🎯 Sculpture unique, point d'entrée — repère de départ fiable." },
            { id: 3, icon: "🌉", name: "Pont de pierre sur le ruisseau", isSalient: true,  reason: "🗺️ Point de passage obligatoire — structure permanente distinctive." },
            { id: 4, icon: "🌸", name: "Massif de fleurs printanières", isSalient: false, reason: "🚫 Saisonnier — absent en automne et hiver, peu fiable." },
            { id: 5, icon: "🍄", name: "Gros rocher mouillé", isSalient: false, reason: "😶 Ressemble à beaucoup d'autres rochers — trop générique." },
            { id: 6, icon: "🌿", name: "Haie taillée en carré", isSalient: false, reason: "😶 Très commun dans le parc — plusieurs haies identiques." },
            { id: 7, icon: "🐕", name: "Promeneur avec son chien", isSalient: false, reason: "🔄 Mobile — les promeneurs bougent, inutilisable comme repère." },
        ],
    },
];

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    rounds: number;
    salientCount: number;
    nonSalientCount: number;
    empan: number;
}> = {
    facile:    { rounds: 3, salientCount: 3, nonSalientCount: 3, empan: 3 },
    moyen:     { rounds: 4, salientCount: 4, nonSalientCount: 3, empan: 5 },
    difficile: { rounds: 5, salientCount: 4, nonSalientCount: 4, empan: 7 },
};

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildRound(scenario: Scenario, diff: Difficulty): Element[] {
    const { salientCount, nonSalientCount } = DIFFICULTY_CONFIG[diff];
    const salient    = shuffle(scenario.elements.filter(e => e.isSalient)).slice(0, salientCount);
    const nonSalient = shuffle(scenario.elements.filter(e => !e.isSalient)).slice(0, nonSalientCount);
    return shuffle([...salient, ...nonSalient]);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PointsRepereSaillants({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [scenarios,  setScenarios]  = useState<Scenario[]>([]);
    const [roundElements, setRoundElements] = useState<Element[][]>([]);
    const [roundIdx,   setRoundIdx]   = useState(0);
    const [selected,   setSelected]   = useState<Set<number>>(new Set());
    const [results,    setResults]    = useState<number[]>([]); // score per round

    const cfg         = DIFFICULTY_CONFIG[difficulty];
    const totalRounds = cfg.rounds;
    const curScenario = scenarios[roundIdx];
    const curElements = roundElements[roundIdx] ?? [];

    // ── Start ──────────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        const shuffled = shuffle([...SCENARIOS]).slice(0, DIFFICULTY_CONFIG[diff].rounds);
        const elementsPerRound = shuffled.map(sc => buildRound(sc, diff));
        setScenarios(shuffled);
        setRoundElements(elementsPerRound);
        setRoundIdx(0);
        setSelected(new Set());
        setResults([]);
        setPhase("playing");
    }, []);

    // ── Toggle selection ───────────────────────────────────────────────────────

    const toggle = useCallback((id: number) => {
        if (phase !== "playing") return;
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, [phase]);

    // ── Validate ───────────────────────────────────────────────────────────────

    const validate = useCallback(() => {
        if (phase !== "playing") return;
        // Score: 1 point per correctly classified element
        const correct = curElements.filter(el =>
            el.isSalient ? selected.has(el.id) : !selected.has(el.id)
        ).length;
        const score = Math.round((correct / curElements.length) * 100);
        setResults(prev => [...prev, score]);
        setPhase("feedback");
    }, [phase, curElements, selected]);

    // ── Next round ─────────────────────────────────────────────────────────────

    const nextRound = useCallback(() => {
        const next = roundIdx + 1;
        if (next >= totalRounds) {
            const allResults = [...results];
            if (patientId && allResults.length > 0) {
                const avg = Math.round(allResults.reduce((s, r) => s + r, 0) / allResults.length);
                saveScore({
                    patientId,
                    exercice: "Points de repère saillants",
                    domaine: "orientation-spatiale",
                    score: avg,
                    empan: cfg.empan,
                });
            }
            setPhase("finished");
        } else {
            setRoundIdx(next);
            setSelected(new Set());
            setPhase("playing");
        }
    }, [roundIdx, totalRounds, results, patientId, cfg.empan]);

    const reset = () => {
        setPhase("idle");
        setScenarios([]);
        setRoundElements([]);
        setRoundIdx(0);
        setSelected(new Set());
        setResults([]);
    };

    // ── Computed ───────────────────────────────────────────────────────────────

    const lastScore   = results[results.length - 1] ?? 0;
    const finalScore  = results.length > 0
        ? Math.round(results.reduce((s, r) => s + r, 0) / results.length)
        : 0;
    const perfectRounds = results.filter(r => r === 100).length;

    function cardStyle(el: Element): string {
        const base = "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors duration-150 text-center ";
        if (phase === "playing") {
            return base + (selected.has(el.id)
                ? "bg-primary-50 dark:bg-primary-900/30 border-primary-400 dark:border-primary-500"
                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 cursor-pointer");
        }
        // Feedback colors
        if (el.isSalient && selected.has(el.id))   return base + "bg-green-50 dark:bg-green-900/25 border-green-400 dark:border-green-500";
        if (el.isSalient && !selected.has(el.id))  return base + "bg-amber-50 dark:bg-amber-900/25 border-amber-400 dark:border-amber-500";
        if (!el.isSalient && selected.has(el.id))  return base + "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500";
        return base + "bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 opacity-70";
    }

    function cardBadge(el: Element): { symbol: string; label: string } | null {
        if (phase !== "feedback") return null;
        if (el.isSalient && selected.has(el.id))   return { symbol: "✓", label: "Bon repère" };
        if (el.isSalient && !selected.has(el.id))  return { symbol: "!", label: "À sélectionner" };
        if (!el.isSalient && selected.has(el.id))  return { symbol: "✗", label: "Mauvais repère" };
        return { symbol: "✓", label: "Bien évité" };
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full p-4 select-none items-center overflow-y-auto gap-4">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center gap-5 max-w-lg text-center justify-center flex-1">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Un <strong>bon repère visuel</strong> doit répondre à ces 4 critères :<br />
                    </p>

                    {/* Criteria cards */}
                    <div className="grid grid-cols-2 gap-2 w-full text-left">
                        {[
                            { icon: "🎯", label: "Distinctif",      desc: "Unique dans l'environnement, facile à reconnaître" },
                            { icon: "🔒", label: "Permanent",       desc: "Toujours présent — ne bouge pas et ne disparaît pas" },
                            { icon: "👁️", label: "Visible de loin", desc: "Grand, coloré ou en hauteur — repérable depuis loin" },
                            { icon: "🗺️", label: "Stratégique",     desc: "Placé à un carrefour ou point de décision du trajet" },
                        ].map(c => (
                            <div key={c.label} className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                                <span className="text-xl shrink-0">{c.icon}</span>
                                <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.label}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Pour chaque scène, <strong>sélectionnez</strong> les éléments qui feraient de bons repères.
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
                        Facile&nbsp;: 3 scènes, 6 éléments · Moyen&nbsp;: 4 scènes, 7 éléments · Difficile&nbsp;: 5 scènes, 8 éléments
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Playing + Feedback ── */}
            {(phase === "playing" || phase === "feedback") && curScenario && (
                <div className="flex flex-col w-full max-w-lg gap-3">

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                            {Array.from({ length: totalRounds }, (_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    i < roundIdx
                                        ? results[i] === 100 ? "bg-green-400"
                                        : results[i] >= 70   ? "bg-amber-400"
                                        : "bg-red-400"
                                        : i === roundIdx ? "bg-primary-400" : "bg-slate-200 dark:bg-slate-700"
                                }`} />
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">
                            {roundIdx + 1}&nbsp;/&nbsp;{totalRounds}
                        </span>
                    </div>

                    {/* Scene header */}
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-600">
                        <span className="text-2xl">{curScenario.sceneIcon}</span>
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{curScenario.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{curScenario.description}</p>
                        </div>
                    </div>

                    {/* Instruction */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                        {phase === "playing"
                            ? "Cliquez sur les éléments qui feraient de bons repères visuels."
                            : `Score : ${lastScore} % — voici les explications :`}
                    </p>

                    {/* Element grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {curElements.map(el => {
                            const badge = cardBadge(el);
                            return (
                                <button
                                    key={el.id}
                                    onClick={() => toggle(el.id)}
                                    disabled={phase === "feedback"}
                                    className={cardStyle(el)}
                                >
                                    <div className="relative w-full flex justify-center">
                                        <span className="text-3xl">{el.icon}</span>
                                        {selected.has(el.id) && phase === "playing" && (
                                            <span className="absolute top-0 right-1 text-primary-500 font-bold text-sm">✓</span>
                                        )}
                                        {badge && (
                                            <span className={`absolute top-0 right-1 text-xs font-bold ${
                                                badge.symbol === "✓" ? "text-green-500"
                                                : badge.symbol === "!" ? "text-amber-500"
                                                : "text-red-400"
                                            }`}>
                                                {badge.symbol}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">
                                        {el.name}
                                    </p>
                                    {phase === "feedback" && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                            {el.reason}
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend (feedback only) */}
                    {phase === "feedback" && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs justify-center text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-green-400 bg-green-50 inline-block"/>&nbsp;Sélectionné ✓</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-amber-400 bg-amber-50 inline-block"/>&nbsp;Manqué&nbsp;!</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-red-400 bg-red-50 inline-block"/>&nbsp;Mauvais choix ✗</span>
                        </div>
                    )}

                    {/* Buttons */}
                    {phase === "playing" && (
                        <button
                            onClick={validate}
                            disabled={selected.size === 0}
                            className="self-center px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors duration-200"
                        >
                            Valider ma sélection
                        </button>
                    )}
                    {phase === "feedback" && (
                        <button
                            onClick={nextRound}
                            className="self-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors duration-200"
                        >
                            {roundIdx + 1 >= totalRounds ? "Voir les résultats" : "Scène suivante →"}
                        </button>
                    )}
                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-5 max-w-sm text-center w-full">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                    {/* Score dots */}
                    <div className="flex gap-2 justify-center flex-wrap">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                title={`Scène ${i + 1} : ${r} %`}
                                className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                    r === 100 ? "bg-green-500"
                                    : r >= 70  ? "bg-amber-400"
                                    : "bg-red-400"
                                }`}
                            >
                                {r}%
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Score moyen :{" "}
                        <strong className={
                            finalScore >= 80 ? "text-green-600 dark:text-green-400"
                            : finalScore >= 60 ? "text-amber-500"
                            : "text-red-500"
                        }>
                            {finalScore}&nbsp;%
                        </strong>
                        {perfectRounds > 0 && (
                            <span className="ml-2 text-green-600 dark:text-green-400">
                                · {perfectRounds} scène{perfectRounds > 1 ? "s" : ""} parfaite{perfectRounds > 1 ? "s" : ""}
                            </span>
                        )}
                    </p>

                    {/* Detail per scene */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1.5 text-left w-full max-h-36 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={`font-bold shrink-0 ${r === 100 ? "text-green-500" : r >= 70 ? "text-amber-400" : "text-red-400"}`}>
                                    {r === 100 ? "✓" : r >= 70 ? "~" : "✗"}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                    {scenarios[i]?.sceneIcon}&nbsp;{scenarios[i]?.name}
                                </span>
                                <span className="ml-auto font-bold text-slate-500 dark:text-slate-400">{r}&nbsp;%</span>
                            </div>
                        ))}
                    </div>

                    {/* Strategy reminder */}
                    <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-3 text-xs text-left w-full">
                        <p className="font-bold text-primary-700 dark:text-primary-300 mb-1">💡 Rappel stratégique</p>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Dans la vraie vie, cherchez les repères <strong>distinctifs</strong>, <strong>permanents</strong>,
                            <strong> visibles de loin</strong> et situés aux <strong>carrefours clés</strong>.
                            Évitez les éléments mobiles, temporaires ou trop génériques.
                        </p>
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

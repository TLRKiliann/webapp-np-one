"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "feedback" | "finished";
type Niveau = "facile" | "moyen" | "difficile";

interface Item {
    id: number;
    emoji: string;
    motCible: string;
    niveau: Niveau;
    distracteurs: string[]; // 3 distracteurs
}

interface RoundResult {
    item: Item;
    selected: string;
    correct: boolean;
}

// Distracteurs faciles  = catégories très différentes
// Distracteurs moyens   = même catégorie sémantique
// Distracteurs difficiles = proches phonologiquement
const ITEMS: Item[] = [
    // === FACILE ===
    { id:  1, emoji: "🐱", motCible: "chat",     niveau: "facile",    distracteurs: ["maison",    "crayon",    "soleil"]   },
    { id:  2, emoji: "🌳", motCible: "arbre",    niveau: "facile",    distracteurs: ["voiture",   "livre",     "assiette"] },
    { id:  3, emoji: "🍎", motCible: "pomme",    niveau: "facile",    distracteurs: ["chien",     "chaise",    "stylo"]    },
    { id:  4, emoji: "🚗", motCible: "voiture",  niveau: "facile",    distracteurs: ["fleur",     "poisson",   "nuage"]    },
    { id:  5, emoji: "✏️", motCible: "crayon",   niveau: "facile",    distracteurs: ["chat",      "orange",    "fenêtre"]  },
    // === MOYEN ===
    { id:  6, emoji: "🐶", motCible: "chien",    niveau: "moyen",     distracteurs: ["chat",      "cheval",    "lapin"]    },
    { id:  7, emoji: "🍌", motCible: "banane",   niveau: "moyen",     distracteurs: ["pomme",     "poire",     "orange"]   },
    { id:  8, emoji: "🪑", motCible: "chaise",   niveau: "moyen",     distracteurs: ["table",     "lit",       "canapé"]   },
    { id:  9, emoji: "🌹", motCible: "rose",     niveau: "moyen",     distracteurs: ["tulipe",    "violette",  "jonquille"] },
    { id: 10, emoji: "✂️", motCible: "ciseaux",  niveau: "moyen",     distracteurs: ["couteau",   "scie",      "pince"]    },
    // === DIFFICILE (distracteurs phonologiquement proches) ===
    { id: 11, emoji: "🦊", motCible: "renard",   niveau: "difficile", distracteurs: ["canard",    "léopard",   "renfort"]  },
    { id: 12, emoji: "🌂", motCible: "parapluie",niveau: "difficile", distracteurs: ["parasol",   "parachute", "paravent"] },
    { id: 13, emoji: "🍇", motCible: "raisin",   niveau: "difficile", distracteurs: ["citron",    "raison",    "cousin"]   },
    { id: 14, emoji: "🔔", motCible: "cloche",   niveau: "difficile", distracteurs: ["clé",       "proche",    "cloque"]   },
    { id: 15, emoji: "🐸", motCible: "grenouille",niveau:"difficile", distracteurs: ["groseille", "genou",     "grelot"]   },
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const niveauBadge: Record<Niveau, string> = {
    facile:    "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    moyen:     "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    difficile: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

export default function DenoConfroVisu({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [items, setItems] = useState<Item[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [choices, setChoices] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [results, setResults] = useState<RoundResult[]>([]);

    const loadItem = useCallback((index: number, itemList: Item[]) => {
        const item = itemList[index];
        setChoices(shuffle([item.motCible, ...item.distracteurs]));
        setSelected(null);
    }, []);

    const startGame = () => {
        const shuffled = shuffle(ITEMS);
        setItems(shuffled);
        setCurrentIndex(0);
        setResults([]);
        setPhase("playing");
        loadItem(0, shuffled);
    };

    const handleSelect = (mot: string) => {
        if (selected) return;
        const item = items[currentIndex];
        const correct = mot === item.motCible;
        const updated: RoundResult[] = [...results, { item, selected: mot, correct }];

        setSelected(mot);
        setResults(updated);
        setPhase("feedback");

        if (currentIndex + 1 >= items.length && patientId) {
            const correctCount = updated.filter(r => r.correct).length;
            const score = Math.round((correctCount / updated.length) * 100);
            const difficiles = updated.filter(r => r.item.niveau === "difficile" && r.correct).length;
            const empan = difficiles >= 3 ? 6
                : updated.filter(r => r.item.niveau === "moyen" && r.correct).length >= 3 ? 4
                : 2;
            saveScore({
                patientId,
                exercice: "Dénomination sur confrontation visuelle",
                domaine: "language",
                score,
                empan,
            }).catch(console.error);
        }
    };

    const handleNext = () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) {
            setPhase("finished");
        } else {
            setCurrentIndex(nextIndex);
            loadItem(nextIndex, items);
            setPhase("playing");
        }
    };

    const currentItem = items[currentIndex];
    const correctCount = results.filter(r => r.correct).length;

    return (
        <div className="flex flex-col h-full p-6 gap-4 select-none items-center justify-center">

            {/* --- Écran d'accueil --- */}
            {phase === "idle" && (
                <div className="text-center space-y-6 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Une image va s'afficher. Trouvez le <strong>nom</strong> qui lui correspond
                        parmi les 4 propositions.<br />
                        Les distracteurs vont progressivement se rapprocher du mot cible.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {ITEMS.length} images · distracteurs sémantiques puis phonologiques
                    </p>
                    <button
                        onClick={startGame}
                        className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* --- Exercice en cours --- */}
            {(phase === "playing" || phase === "feedback") && currentItem && (
                <div className="flex flex-col items-center gap-5 w-full max-w-sm">

                    {/* Progression */}
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                            {currentIndex + 1} / {items.length}
                        </span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                                className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                            />
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${niveauBadge[currentItem.niveau]}`}>
                            {currentItem.niveau}
                        </span>
                    </div>

                    {/* Image */}
                    <div className="w-36 h-36 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center">
                        <span className="text-7xl">{currentItem.emoji}</span>
                    </div>

                    {/* Choix */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        {choices.map((mot) => {
                            let cls = "py-3 px-4 rounded-xl border-2 text-base font-semibold transition-all duration-150 ";
                            if (phase === "playing") {
                                cls += "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white hover:border-teal-300 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer";
                            } else {
                                if (mot === currentItem.motCible) {
                                    cls += "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default";
                                } else if (mot === selected) {
                                    cls += "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 cursor-default";
                                } else {
                                    cls += "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-500 opacity-40 cursor-default";
                                }
                            }
                            return (
                                <button
                                    key={mot}
                                    onClick={() => handleSelect(mot)}
                                    disabled={phase === "feedback"}
                                    className={cls}
                                >
                                    {mot}
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback */}
                    {phase === "feedback" && (
                        <div className="flex flex-col items-center gap-3">
                            <p className={`text-base font-semibold ${
                                selected === currentItem.motCible
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                            }`}>
                                {selected === currentItem.motCible
                                    ? "✓ Correct !"
                                    : `✗ Incorrect — c'était « ${currentItem.motCible} »`}
                            </p>
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition-colors duration-200"
                            >
                                {currentIndex + 1 < items.length ? "Image suivante →" : "Voir les résultats"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- Résultats finaux --- */}
            {phase === "finished" && (
                <div className="text-center space-y-5 max-w-sm">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p>
                            Score :{" "}
                            <strong className="text-teal-600 dark:text-teal-300 text-lg">
                                {correctCount} / {results.length}
                            </strong>
                        </p>
                        <p>({Math.round((correctCount / results.length) * 100)} %)</p>
                    </div>

                    {/* Détail */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-2 text-left max-h-52 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={`shrink-0 ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className="text-lg shrink-0">{r.item.emoji}</span>
                                <span className={`shrink-0 text-xs px-1 rounded border font-medium ${niveauBadge[r.item.niveau]}`}>
                                    {r.item.niveau}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    {r.item.motCible}
                                </span>
                                {!r.correct && (
                                    <span className="text-red-400">→ dit : « {r.selected} »</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={startGame}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Recommencer
                    </button>
                </div>
            )}

        </div>
    );
}

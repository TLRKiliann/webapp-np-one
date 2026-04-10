"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase  = "idle" | "playing" | "feedback" | "finished";
type Niveau = "facile" | "moyen" | "difficile";

interface Choice {
    emoji: string;
    label: string;
    correct: boolean;
}

interface Item {
    id: number;
    mot: string;
    niveau: Niveau;
    choices: Choice[];
}

interface RoundResult {
    item: Item;
    selectedLabel: string;
    correct: boolean;
}

// ─── Stimulus bank ────────────────────────────────────────────────────────────

const ITEMS: Item[] = [
    // ── FACILE : mots courts fréquents, distracteurs clairement différents ──────
    {
        id: 1, mot: "CHAT", niveau: "facile",
        choices: [
            { emoji: "🐱", label: "un chat",       correct: true  },
            { emoji: "🚗", label: "une voiture",   correct: false },
            { emoji: "🍎", label: "une pomme",     correct: false },
            { emoji: "🌳", label: "un arbre",      correct: false },
        ],
    },
    {
        id: 2, mot: "SOLEIL", niveau: "facile",
        choices: [
            { emoji: "☀️", label: "le soleil",     correct: true  },
            { emoji: "🌊", label: "la mer",        correct: false },
            { emoji: "🏠", label: "une maison",    correct: false },
            { emoji: "🎵", label: "de la musique", correct: false },
        ],
    },
    {
        id: 3, mot: "POMME", niveau: "facile",
        choices: [
            { emoji: "🍎", label: "une pomme",     correct: true  },
            { emoji: "🐶", label: "un chien",      correct: false },
            { emoji: "⚽", label: "un ballon",     correct: false },
            { emoji: "🎩", label: "un chapeau",    correct: false },
        ],
    },
    {
        id: 4, mot: "MAISON", niveau: "facile",
        choices: [
            { emoji: "🏠", label: "une maison",    correct: true  },
            { emoji: "🐠", label: "un poisson",    correct: false },
            { emoji: "🌺", label: "une fleur",     correct: false },
            { emoji: "📚", label: "des livres",    correct: false },
        ],
    },
    {
        id: 5, mot: "LUNE", niveau: "facile",
        choices: [
            { emoji: "🌙", label: "la lune",       correct: true  },
            { emoji: "🍋", label: "un citron",     correct: false },
            { emoji: "🐸", label: "une grenouille",correct: false },
            { emoji: "🎸", label: "une guitare",   correct: false },
        ],
    },
    // ── MOYEN : distracteurs de la même catégorie sémantique ─────────────────
    {
        id: 6, mot: "CHIEN", niveau: "moyen",
        choices: [
            { emoji: "🐕", label: "un chien",      correct: true  },
            { emoji: "🐱", label: "un chat",       correct: false },
            { emoji: "🐰", label: "un lapin",      correct: false },
            { emoji: "🐦", label: "un oiseau",     correct: false },
        ],
    },
    {
        id: 7, mot: "BANANE", niveau: "moyen",
        choices: [
            { emoji: "🍌", label: "une banane",    correct: true  },
            { emoji: "🍊", label: "une orange",    correct: false },
            { emoji: "🍇", label: "du raisin",     correct: false },
            { emoji: "🍓", label: "une fraise",    correct: false },
        ],
    },
    {
        id: 8, mot: "AVION", niveau: "moyen",
        choices: [
            { emoji: "✈️", label: "un avion",      correct: true  },
            { emoji: "🚂", label: "un train",      correct: false },
            { emoji: "🚗", label: "une voiture",   correct: false },
            { emoji: "🚢", label: "un bateau",     correct: false },
        ],
    },
    {
        id: 9, mot: "CHAISE", niveau: "moyen",
        choices: [
            { emoji: "🪑", label: "une chaise",    correct: true  },
            { emoji: "🛋️", label: "un canapé",     correct: false },
            { emoji: "🛏️", label: "un lit",        correct: false },
            { emoji: "🚪", label: "une porte",     correct: false },
        ],
    },
    {
        id: 10, mot: "MANTEAU", niveau: "moyen",
        choices: [
            { emoji: "🧥", label: "un manteau",    correct: true  },
            { emoji: "👕", label: "un t-shirt",    correct: false },
            { emoji: "👖", label: "un pantalon",   correct: false },
            { emoji: "🧤", label: "des gants",     correct: false },
        ],
    },
    // ── DIFFICILE : distracteurs très proches sémantiquement ─────────────────
    {
        id: 11, mot: "BOUCHE", niveau: "difficile",
        choices: [
            { emoji: "👄", label: "une bouche",    correct: true  },
            { emoji: "👃", label: "un nez",        correct: false },
            { emoji: "👂", label: "une oreille",   correct: false },
            { emoji: "👁️", label: "un œil",        correct: false },
        ],
    },
    {
        id: 12, mot: "MARTEAU", niveau: "difficile",
        choices: [
            { emoji: "🔨", label: "un marteau",    correct: true  },
            { emoji: "🪛", label: "un tournevis",  correct: false },
            { emoji: "🔧", label: "une clé",       correct: false },
            { emoji: "🪚", label: "une scie",      correct: false },
        ],
    },
    {
        id: 13, mot: "TROMPETTE", niveau: "difficile",
        choices: [
            { emoji: "🎺", label: "une trompette", correct: true  },
            { emoji: "🎷", label: "un saxophone",  correct: false },
            { emoji: "🎻", label: "un violon",     correct: false },
            { emoji: "🥁", label: "une batterie",  correct: false },
        ],
    },
    {
        id: 14, mot: "HIBOU", niveau: "difficile",
        choices: [
            { emoji: "🦉", label: "un hibou",      correct: true  },
            { emoji: "🐧", label: "un pingouin",   correct: false },
            { emoji: "🦜", label: "un perroquet",  correct: false },
            { emoji: "🦚", label: "un paon",       correct: false },
        ],
    },
    {
        id: 15, mot: "SERRURE", niveau: "difficile",
        choices: [
            { emoji: "🔒", label: "une serrure",   correct: true  },
            { emoji: "🔑", label: "une clé",       correct: false },
            { emoji: "🔓", label: "un cadenas ouvert", correct: false },
            { emoji: "🗝️", label: "une vieille clé",   correct: false },
        ],
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

const niveauBadge: Record<Niveau, string> = {
    facile:    "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    moyen:     "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    difficile: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppariementMot({ patientId }: { patientId: string | null }) {
    const [phase,          setPhase]          = useState<Phase>("idle");
    const [items,          setItems]          = useState<Item[]>([]);
    const [currentIndex,   setCurrentIndex]   = useState(0);
    const [shuffledChoices,setShuffledChoices]= useState<Choice[]>([]);
    const [selected,       setSelected]       = useState<Choice | null>(null);
    const [results,        setResults]        = useState<RoundResult[]>([]);

    const loadItem = useCallback((index: number, itemList: Item[]) => {
        setShuffledChoices(shuffle(itemList[index].choices));
        setSelected(null);
    }, []);

    const startGame = () => {
        const shuffledItems = shuffle(ITEMS);
        setItems(shuffledItems);
        setCurrentIndex(0);
        setResults([]);
        setPhase("playing");
        loadItem(0, shuffledItems);
    };

    const handleSelect = (choice: Choice) => {
        if (selected) return;

        const updated: RoundResult[] = [
            ...results,
            { item: items[currentIndex], selectedLabel: choice.label, correct: choice.correct },
        ];

        setSelected(choice);
        setResults(updated);
        setPhase("feedback");

        // Sauvegarder au dernier item
        if (currentIndex + 1 >= items.length && patientId) {
            const correctCount = updated.filter(r => r.correct).length;
            const score = Math.round((correctCount / updated.length) * 100);
            const difficiles = updated.filter(r => r.item.niveau === "difficile" && r.correct).length;
            const empan = difficiles >= 3 ? 6
                : updated.filter(r => r.item.niveau === "moyen" && r.correct).length >= 3 ? 4
                : 2;
            saveScore({
                patientId,
                exercice: "Appariement mot-image",
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

    const currentItem  = items[currentIndex];
    const correctCount = results.filter(r => r.correct).length;

    return (
        <div className="flex flex-col h-full p-6 gap-4 select-none items-center justify-center">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="text-center space-y-6 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Un <strong>mot écrit</strong> s'affiche. Choisissez l'<strong>image</strong> qui lui correspond
                        parmi les 4 propositions.<br />
                        Les mots progressent du plus courant au plus difficile.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {ITEMS.length} mots · niveaux facile, moyen et difficile
                    </p>
                    <button
                        onClick={startGame}
                        className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Playing / Feedback ── */}
            {(phase === "playing" || phase === "feedback") && currentItem && (
                <div className="flex flex-col items-center gap-5 w-full max-w-lg">

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

                    {/* Mot stimulus */}
                    <div className="w-full bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-200 dark:border-teal-700 rounded-2xl px-6 py-5 text-center">
                        <p className="text-4xl font-bold tracking-widest text-teal-800 dark:text-teal-200 font-mono">
                            {currentItem.mot}
                        </p>
                    </div>

                    {/* Grille des choix */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        {shuffledChoices.map((choice, i) => {
                            let cls = "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-teal-300 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20";
                            if (phase === "feedback") {
                                if (choice.correct) {
                                    cls = "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/30";
                                } else if (choice === selected) {
                                    cls = "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/30";
                                } else {
                                    cls = "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 opacity-40";
                                }
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(choice)}
                                    disabled={phase === "feedback"}
                                    aria-label={choice.label}
                                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 min-h-28 transition-all duration-150 ${cls} ${
                                        phase === "playing" ? "cursor-pointer active:scale-95" : "cursor-default"
                                    }`}
                                >
                                    <span className="text-5xl leading-none">
                                        {choice.emoji}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 text-center leading-snug">
                                        {choice.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback + bouton suivant */}
                    {phase === "feedback" && (
                        <div className="flex flex-col items-center gap-3">
                            <p className={`text-base font-semibold ${
                                selected?.correct
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                            }`}>
                                {selected?.correct ? "✓ Correct !" : "✗ Incorrect"}
                            </p>
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                            >
                                {currentIndex + 1 < items.length ? "Mot suivant →" : "Voir les résultats"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Finished ── */}
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

                    {/* Détail par mot */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-2 text-left max-h-52 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={`shrink-0 font-bold ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-semibold font-mono ${niveauBadge[r.item.niveau]}`}>
                                    {r.item.mot}
                                </span>
                                {!r.correct && (
                                    <span className="text-slate-500 dark:text-slate-400 italic">
                                        → {r.selectedLabel}
                                    </span>
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

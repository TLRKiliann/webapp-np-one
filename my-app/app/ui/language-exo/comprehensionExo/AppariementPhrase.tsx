"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "feedback" | "finished";
type Niveau = "facile" | "moyen" | "difficile";

interface Choice {
    scene: string;
    label: string;
    correct: boolean;
}

interface Item {
    id: number;
    phrase: string;
    niveau: Niveau;
    choices: Choice[];
}

interface RoundResult {
    item: Item;
    selectedLabel: string;
    correct: boolean;
}

const ITEMS: Item[] = [
    // === FACILE ===
    {
        id: 1,
        phrase: "Le chat dort sur le canapé.",
        niveau: "facile",
        choices: [
            { scene: "🐱\n🛋️", label: "Un chat dort sur un canapé", correct: true },
            { scene: "🐶\n🛋️", label: "Un chien dort sur un canapé", correct: false },
            { scene: "🐱\n🛏️", label: "Un chat dort dans un lit", correct: false },
            { scene: "🐱\n🪑", label: "Un chat est assis sur une chaise", correct: false },
        ],
    },
    {
        id: 2,
        phrase: "L'enfant mange une pomme.",
        niveau: "facile",
        choices: [
            { scene: "👦\n🍎", label: "Un enfant mange une pomme", correct: true },
            { scene: "👦\n🍌", label: "Un enfant mange une banane", correct: false },
            { scene: "👩\n🍎", label: "Une femme mange une pomme", correct: false },
            { scene: "👦\n⚽", label: "Un enfant joue au ballon", correct: false },
        ],
    },
    {
        id: 3,
        phrase: "Le chien court dans le jardin.",
        niveau: "facile",
        choices: [
            { scene: "🐶💨\n🌳", label: "Un chien court dans le jardin", correct: true },
            { scene: "🐱💨\n🌳", label: "Un chat court dans le jardin", correct: false },
            { scene: "🐶💤\n🌳", label: "Un chien dort dans le jardin", correct: false },
            { scene: "🐶💨\n🏠", label: "Un chien court vers la maison", correct: false },
        ],
    },
    {
        id: 4,
        phrase: "La femme porte un chapeau rouge.",
        niveau: "facile",
        choices: [
            { scene: "👩\n🔴🎩", label: "Une femme porte un chapeau rouge", correct: true },
            { scene: "👨\n🔴🎩", label: "Un homme porte un chapeau rouge", correct: false },
            { scene: "👩\n🔵🎩", label: "Une femme porte un chapeau bleu", correct: false },
            { scene: "👩\n🔴👜", label: "Une femme porte un sac rouge", correct: false },
        ],
    },
    // === MOYEN ===
    {
        id: 5,
        phrase: "Le livre est posé sous la chaise.",
        niveau: "moyen",
        choices: [
            { scene: "🪑\n📗", label: "Un livre est posé sous une chaise", correct: true },
            { scene: "📗\n🪑", label: "Un livre est posé sur une chaise", correct: false },
            { scene: "🪑 📗", label: "Un livre est à côté d'une chaise", correct: false },
            { scene: "📗 🪑⬆️", label: "Un livre est au-dessus d'une chaise", correct: false },
        ],
    },
    {
        id: 6,
        phrase: "La fille donne une fleur au garçon.",
        niveau: "moyen",
        choices: [
            { scene: "👧🌸➡️👦", label: "Une fille donne une fleur à un garçon", correct: true },
            { scene: "👦🌸➡️👧", label: "Un garçon donne une fleur à une fille", correct: false },
            { scene: "👧🌸👦", label: "Une fille et un garçon tiennent une fleur", correct: false },
            { scene: "👧➡️👦\n(pas 🌸)", label: "Une fille marche vers un garçon", correct: false },
        ],
    },
    {
        id: 7,
        phrase: "Le chat est entre la table et la chaise.",
        niveau: "moyen",
        choices: [
            { scene: "🍽️🐱🪑", label: "Un chat est entre la table et la chaise", correct: true },
            { scene: "🐱🍽️🪑", label: "Un chat est devant la table et la chaise", correct: false },
            { scene: "🍽️\n🐱", label: "Un chat est sous la table", correct: false },
            { scene: "🐱\n🍽️🪑", label: "Un chat est au-dessus de la table", correct: false },
        ],
    },
    {
        id: 8,
        phrase: "L'homme lit le journal avant de déjeuner.",
        niveau: "moyen",
        choices: [
            { scene: "👨📰\n⬇️\n🍽️", label: "Un homme lit puis mange", correct: true },
            { scene: "🍽️\n⬇️\n👨📰", label: "Un homme mange puis lit", correct: false },
            { scene: "👨📰\n+\n🍽️", label: "Un homme lit et mange en même temps", correct: false },
            { scene: "👨📰\n(pas 🍽️)", label: "Un homme lit seulement", correct: false },
        ],
    },
    // === DIFFICILE ===
    {
        id: 9,
        phrase: "Le garçon ne porte pas de lunettes.",
        niveau: "difficile",
        choices: [
            { scene: "👦\n❌👓", label: "Un garçon sans lunettes", correct: true },
            { scene: "👦👓", label: "Un garçon avec des lunettes", correct: false },
            { scene: "👧\n❌👓", label: "Une fille sans lunettes", correct: false },
            { scene: "👧👓", label: "Une fille avec des lunettes", correct: false },
        ],
    },
    {
        id: 10,
        phrase: "La souris est poursuivie par le chat.",
        niveau: "difficile",
        choices: [
            { scene: "🐱💨➡️🐭", label: "Un chat court après une souris", correct: true },
            { scene: "🐭💨➡️🐱", label: "Une souris court après un chat", correct: false },
            { scene: "🐱🐭\n😊", label: "Un chat et une souris sont ensemble", correct: false },
            { scene: "🐶💨➡️🐭", label: "Un chien court après une souris", correct: false },
        ],
    },
    {
        id: 11,
        phrase: "C'est la mère de la fille qui porte le panier.",
        niveau: "difficile",
        choices: [
            { scene: "👩🧺\n(mère de 👧)", label: "La mère porte le panier", correct: true },
            { scene: "👧🧺", label: "La fille porte le panier", correct: false },
            { scene: "👨🧺\n(père de 👧)", label: "Le père porte le panier", correct: false },
            { scene: "👩👧\n🧺", label: "La mère et la fille portent le panier ensemble", correct: false },
        ],
    },
    {
        id: 12,
        phrase: "Le verre est plus grand que la tasse.",
        niveau: "difficile",
        choices: [
            { scene: "🥛 > ☕", label: "Le verre est plus grand que la tasse", correct: true },
            { scene: "☕ > 🥛", label: "La tasse est plus grande que le verre", correct: false },
            { scene: "🥛 = ☕", label: "Le verre et la tasse ont la même taille", correct: false },
            { scene: "🥛 < ☕", label: "Le verre est plus petit que la tasse", correct: false },
        ],
    },
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
    facile: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    moyen: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    difficile: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

export default function AppariementPhrase({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [items, setItems] = useState<Item[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([]);
    const [selected, setSelected] = useState<Choice | null>(null);
    const [results, setResults] = useState<RoundResult[]>([]);

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

        // Sauvegarder ici avec `updated` (liste fraîche) sur la dernière phrase
        if (currentIndex + 1 >= items.length && patientId) {
            const correctCount = updated.filter(r => r.correct).length;
            const score = Math.round((correctCount / updated.length) * 100);
            const difficiles = updated.filter(r => r.item.niveau === "difficile" && r.correct).length;
            const empan = difficiles >= 3 ? 6
                : updated.filter(r => r.item.niveau === "moyen" && r.correct).length >= 3 ? 4
                : 2;
            saveScore({
                patientId,
                exercice: "Appariement phrase-image",
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
                        Une phrase va s'afficher. Choisissez l'<strong>image</strong> qui lui correspond
                        parmi les 4 propositions.<br />
                        Les phrases vont progressivement devenir plus complexes.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {ITEMS.length} phrases · niveaux facile, moyen et difficile
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

                    {/* Phrase */}
                    <div className="w-full bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-2xl px-6 py-4 text-center">
                        <p className="text-lg font-semibold text-teal-800 dark:text-teal-200 leading-relaxed">
                            {currentItem.phrase}
                        </p>
                    </div>

                    {/* Grille des images */}
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
                                        phase === "playing" ? "cursor-pointer" : "cursor-default"
                                    }`}
                                >
                                    <span className="text-3xl leading-tight whitespace-pre-line text-center">
                                        {choice.scene}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 text-center leading-snug">
                                        {choice.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback */}
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
                                {currentIndex + 1 < items.length ? "Phrase suivante →" : "Voir les résultats"}
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

                    {/* Détail des réponses */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-2 text-left max-h-48 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className={`shrink-0 mt-0.5 ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className={`shrink-0 text-xs px-1 rounded border font-medium ${niveauBadge[r.item.niveau]}`}>
                                    {r.item.niveau}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300">{r.item.phrase}</span>
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

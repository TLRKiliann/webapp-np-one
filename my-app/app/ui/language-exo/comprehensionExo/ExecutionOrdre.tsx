"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "feedback" | "finished";
type Niveau = "facile" | "moyen" | "difficile";

interface Objet {
    id: string;
    emoji: string;
    label: string;
}

interface OrdreItem {
    id: number;
    consigne: string;
    niveau: Niveau;
    objetIds: string[];          // tous les objets affichés (6)
    sequenceCorrecte: string[];  // ids dans le bon ordre
}

interface RoundResult {
    item: OrdreItem;
    clicked: string[];
    correct: boolean;
}

const OBJETS: Record<string, Objet> = {
    crayon:  { id: "crayon",  emoji: "✏️",  label: "crayon"  },
    verre:   { id: "verre",   emoji: "🥛",  label: "verre"   },
    livre:   { id: "livre",   emoji: "📗",  label: "livre"   },
    cle:     { id: "cle",     emoji: "🔑",  label: "clé"     },
    chapeau: { id: "chapeau", emoji: "🎩",  label: "chapeau" },
    fleur:   { id: "fleur",   emoji: "🌸",  label: "fleur"   },
    montre:  { id: "montre",  emoji: "⌚",  label: "montre"  },
    ciseaux: { id: "ciseaux", emoji: "✂️",  label: "ciseaux" },
};

const ITEMS: OrdreItem[] = [
    // === FACILE — consigne à un seul objet ===
    {
        id: 1,
        consigne: "Touche le crayon.",
        niveau: "facile",
        objetIds: ["crayon", "verre", "livre", "cle", "chapeau", "fleur"],
        sequenceCorrecte: ["crayon"],
    },
    {
        id: 2,
        consigne: "Touche le verre.",
        niveau: "facile",
        objetIds: ["crayon", "verre", "livre", "cle", "montre", "ciseaux"],
        sequenceCorrecte: ["verre"],
    },
    {
        id: 3,
        consigne: "Touche la clé.",
        niveau: "facile",
        objetIds: ["crayon", "verre", "cle", "chapeau", "fleur", "montre"],
        sequenceCorrecte: ["cle"],
    },
    {
        id: 4,
        consigne: "Touche la fleur.",
        niveau: "facile",
        objetIds: ["verre", "livre", "cle", "chapeau", "fleur", "ciseaux"],
        sequenceCorrecte: ["fleur"],
    },
    // === MOYEN — consignes séquentielles à deux objets ===
    {
        id: 5,
        consigne: "Touche le crayon, puis le verre.",
        niveau: "moyen",
        objetIds: ["crayon", "verre", "livre", "cle", "chapeau", "fleur"],
        sequenceCorrecte: ["crayon", "verre"],
    },
    {
        id: 6,
        consigne: "Touche la clé, puis le livre.",
        niveau: "moyen",
        objetIds: ["crayon", "verre", "livre", "cle", "montre", "ciseaux"],
        sequenceCorrecte: ["cle", "livre"],
    },
    {
        id: 7,
        consigne: "D'abord touche le chapeau, ensuite touche la fleur.",
        niveau: "moyen",
        objetIds: ["crayon", "verre", "cle", "chapeau", "fleur", "montre"],
        sequenceCorrecte: ["chapeau", "fleur"],
    },
    {
        id: 8,
        consigne: "Touche la montre, puis les ciseaux.",
        niveau: "moyen",
        objetIds: ["livre", "cle", "chapeau", "fleur", "montre", "ciseaux"],
        sequenceCorrecte: ["montre", "ciseaux"],
    },
    // === DIFFICILE — syntaxe inversée ou description sémantique ===
    {
        id: 9,
        consigne: "Avant de toucher le livre, touche le crayon.",
        niveau: "difficile",
        objetIds: ["crayon", "verre", "livre", "cle", "chapeau", "fleur"],
        sequenceCorrecte: ["crayon", "livre"],   // ordre inverse de l'énoncé
    },
    {
        id: 10,
        consigne: "Touche le verre, mais seulement après avoir touché la clé.",
        niveau: "difficile",
        objetIds: ["crayon", "verre", "livre", "cle", "montre", "ciseaux"],
        sequenceCorrecte: ["cle", "verre"],      // ordre inverse de l'énoncé
    },
    {
        id: 11,
        consigne: "Touche l'objet qui sert à écrire, puis celui qui sert à couper.",
        niveau: "difficile",
        objetIds: ["crayon", "verre", "livre", "cle", "chapeau", "ciseaux"],
        sequenceCorrecte: ["crayon", "ciseaux"], // identification sémantique
    },
    {
        id: 12,
        consigne: "Touche l'objet avec lequel on lit, mais avant ça touche celui avec lequel on boit.",
        niveau: "difficile",
        objetIds: ["crayon", "verre", "livre", "cle", "chapeau", "montre"],
        sequenceCorrecte: ["verre", "livre"],    // ordre inverse + identification sémantique
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
    facile:    "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    moyen:     "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    difficile: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
};

export default function ExecutionOrdre({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [items, setItems] = useState<OrdreItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayObjets, setDisplayObjets] = useState<Objet[]>([]);
    const [clicked, setClicked] = useState<string[]>([]);
    const [results, setResults] = useState<RoundResult[]>([]);

    const loadItem = useCallback((index: number, itemList: OrdreItem[]) => {
        const item = itemList[index];
        setDisplayObjets(shuffle(item.objetIds.map(id => OBJETS[id])));
        setClicked([]);
    }, []);

    const startGame = () => {
        const shuffled = shuffle(ITEMS);
        setItems(shuffled);
        setCurrentIndex(0);
        setResults([]);
        setPhase("playing");
        loadItem(0, shuffled);
    };

    const handleClickObjet = (id: string) => {
        if (clicked.includes(id)) return;
        setClicked(prev => [...prev, id]);
    };

    const handleUndo = () => {
        setClicked(prev => prev.slice(0, -1));
    };

    const handleValider = () => {
        const item = items[currentIndex];
        const correct =
            clicked.length === item.sequenceCorrecte.length &&
            clicked.every((id, i) => id === item.sequenceCorrecte[i]);

        const updated: RoundResult[] = [...results, { item, clicked: [...clicked], correct }];
        setResults(updated);
        setPhase("feedback");

        // Sauvegarder sur la dernière consigne avec la liste fraîche
        if (currentIndex + 1 >= items.length && patientId) {
            const correctCount = updated.filter(r => r.correct).length;
            const score = Math.round((correctCount / updated.length) * 100);
            const difficiles = updated.filter(r => r.item.niveau === "difficile" && r.correct).length;
            const empan = difficiles >= 3 ? 6
                : updated.filter(r => r.item.niveau === "moyen" && r.correct).length >= 3 ? 4
                : 2;
            saveScore({
                patientId,
                exercice: "Exécution d'ordres",
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
    const maxExpected = currentItem?.sequenceCorrecte.length ?? 0;

    return (
        <div className="flex flex-col h-full p-6 gap-4 select-none items-center justify-center">

            {/* --- Écran d'accueil --- */}
            {phase === "idle" && (
                <div className="text-center space-y-6 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Une consigne va s'afficher. Touchez les objets dans l'ordre indiqué.<br />
                        Les consignes vont progressivement devenir plus complexes — attention à la syntaxe !
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {ITEMS.length} consignes · niveaux facile, moyen et difficile
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
            {phase === "playing" && currentItem && (
                <div className="flex flex-col items-center gap-4 w-full max-w-lg">

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

                    {/* Consigne */}
                    <div className="w-full bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-2xl px-6 py-4 text-center">
                        <p className="text-lg font-semibold text-teal-800 dark:text-teal-200 leading-relaxed">
                            {currentItem.consigne}
                        </p>
                    </div>

                    {/* Séquence cliquée */}
                    <div className="flex gap-2 min-h-8 items-center justify-center flex-wrap">
                        {clicked.length === 0 ? (
                            <span className="text-xs text-slate-300 dark:text-slate-600">
                                Sélectionnez les objets dans l'ordre…
                            </span>
                        ) : (
                            clicked.map((id, i) => (
                                <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300 text-sm font-medium">
                                    <span className="text-xs text-teal-400">{i + 1}.</span>
                                    {OBJETS[id].emoji} {OBJETS[id].label}
                                </span>
                            ))
                        )}
                    </div>

                    {/* Grille des objets */}
                    <div className="grid grid-cols-3 gap-3 w-full">
                        {displayObjets.map((obj) => {
                            const pos = clicked.indexOf(obj.id);
                            const isClicked = pos !== -1;
                            return (
                                <button
                                    key={obj.id}
                                    onClick={() => handleClickObjet(obj.id)}
                                    disabled={isClicked}
                                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 py-4 transition-all duration-150 ${
                                        isClicked
                                            ? "border-teal-300 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/30 opacity-60 cursor-default"
                                            : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-teal-300 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer"
                                    }`}
                                >
                                    {isClicked && (
                                        <span className="text-xs font-bold text-teal-500">{pos + 1}</span>
                                    )}
                                    <span className="text-3xl">{obj.emoji}</span>
                                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                        {obj.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleUndo}
                            disabled={clicked.length === 0}
                            className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ← Annuler dernier
                        </button>
                        <button
                            onClick={handleValider}
                            disabled={clicked.length === 0 || clicked.length > maxExpected}
                            className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Valider
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {clicked.length} objet{clicked.length !== 1 ? "s" : ""} sélectionné{clicked.length !== 1 ? "s" : ""}
                    </p>
                </div>
            )}

            {/* --- Feedback --- */}
            {phase === "feedback" && currentItem && (() => {
                const lastResult = results[results.length - 1];
                return (
                    <div className="flex flex-col items-center gap-4 w-full max-w-lg">

                        <p className={`text-base font-semibold ${lastResult.correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {lastResult.correct ? "✓ Correct !" : "✗ Incorrect"}
                        </p>

                        {/* Comparaison attendu / donné */}
                        <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <span className="shrink-0 text-slate-400 w-24">Attendu :</span>
                                <span className="flex gap-1.5 flex-wrap">
                                    {currentItem.sequenceCorrecte.map((id, i) => (
                                        <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                                            <span className="text-xs text-green-400">{i + 1}.</span>
                                            {OBJETS[id].emoji} {OBJETS[id].label}
                                        </span>
                                    ))}
                                </span>
                            </div>
                            {!lastResult.correct && (
                                <div className="flex items-start gap-2">
                                    <span className="shrink-0 text-slate-400 w-24">Donné :</span>
                                    <span className="flex gap-1.5 flex-wrap">
                                        {lastResult.clicked.length === 0 ? (
                                            <span className="text-slate-400 italic">aucun objet</span>
                                        ) : lastResult.clicked.map((id, i) => {
                                            const isCorrectPos = currentItem.sequenceCorrecte[i] === id;
                                            return (
                                                <span key={i} className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-medium ${
                                                    isCorrectPos
                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                                }`}>
                                                    <span className="text-xs opacity-70">{i + 1}.</span>
                                                    {OBJETS[id].emoji} {OBJETS[id].label}
                                                </span>
                                            );
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition-colors duration-200"
                        >
                            {currentIndex + 1 < items.length ? "Consigne suivante →" : "Voir les résultats"}
                        </button>
                    </div>
                );
            })()}

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
                            <div key={i} className="flex items-start gap-2">
                                <span className={`shrink-0 mt-0.5 ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className={`shrink-0 text-xs px-1 rounded border font-medium ${niveauBadge[r.item.niveau]}`}>
                                    {r.item.niveau}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 flex-1">{r.item.consigne}</span>
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

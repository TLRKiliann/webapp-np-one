"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "question" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface SeriesQuestion {
    id: string;
    series: string[];   // contains "___" at the blank position
    blankIdx: number;
    category: string;
    correct: string;
    distractors: string[];
}

interface Result {
    question: SeriesQuestion;
    answer: string;
    correct: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const BASE_QUESTIONS: Record<Difficulty, SeriesQuestion[]> = {
    facile: [
        { id: "f1", series: ["chien", "chat", "lapin", "___"],        blankIdx: 3, category: "Animaux familiers",      correct: "perroquet", distractors: ["tomate",  "chaise",    "bleu"]       },
        { id: "f2", series: ["pomme", "poire", "banane", "___"],       blankIdx: 3, category: "Fruits",                correct: "cerise",    distractors: ["carotte", "soleil",    "fenêtre"]    },
        { id: "f3", series: ["rouge", "bleu", "vert", "___"],          blankIdx: 3, category: "Couleurs",              correct: "jaune",     distractors: ["nuage",   "livre",     "chat"]        },
        { id: "f4", series: ["table", "chaise", "canapé", "___"],      blankIdx: 3, category: "Mobilier",              correct: "armoire",   distractors: ["fleur",   "crayon",    "chien"]       },
        { id: "f5", series: ["carotte", "___", "haricot", "poireau"],  blankIdx: 1, category: "Légumes",               correct: "navet",     distractors: ["pomme",   "chien",     "vent"]        },
        { id: "f6", series: ["t-shirt", "pantalon", "___", "chaussette"], blankIdx: 2, category: "Vêtements",          correct: "pull",      distractors: ["table",   "crayon",    "mer"]         },
        { id: "f7", series: ["___", "lion", "tigre", "panthère"],      blankIdx: 0, category: "Félins",                correct: "guépard",   distractors: ["saumon",  "tulipe",    "nuage"]       },
        { id: "f8", series: ["lundi", "mardi", "mercredi", "___"],     blankIdx: 3, category: "Jours de la semaine",   correct: "jeudi",     distractors: ["janvier", "soleil",    "rouge"]       },
    ],
    moyen: [
        { id: "m1",  series: ["piano", "guitare", "violon", "___"],             blankIdx: 3, category: "Instruments de musique",    correct: "flûte",       distractors: ["marteau",   "cerise",     "fenêtre"]   },
        { id: "m2",  series: ["marteau", "tournevis", "scie", "___"],            blankIdx: 3, category: "Outils",                   correct: "perceuse",    distractors: ["guitare",   "fleur",      "livre"]      },
        { id: "m3",  series: ["vélo", "moto", "voiture", "___"],                 blankIdx: 3, category: "Véhicules",                correct: "camion",      distractors: ["maison",    "cerise",     "livre"]      },
        { id: "m4",  series: ["football", "tennis", "___", "volleyball"],        blankIdx: 2, category: "Sports collectifs",        correct: "basketball",  distractors: ["lecture",   "peinture",   "marteau"]   },
        { id: "m5",  series: ["genou", "coude", "___", "cheville"],              blankIdx: 2, category: "Articulations",            correct: "poignet",     distractors: ["crayon",    "nuage",      "porte"]      },
        { id: "m6",  series: ["crayon", "stylo", "___", "marqueur"],             blankIdx: 2, category: "Instruments d'écriture",   correct: "feutre",      distractors: ["chaise",    "lion",       "soleil"]     },
        { id: "m7",  series: ["printemps", "été", "___", "hiver"],               blankIdx: 2, category: "Saisons",                  correct: "automne",     distractors: ["janvier",   "mardi",      "rouge"]      },
        { id: "m8",  series: ["janvier", "___", "mars", "avril"],                blankIdx: 1, category: "Mois de l'année",          correct: "février",     distractors: ["lundi",     "printemps",  "midi"]       },
        { id: "m9",  series: ["boulangerie", "pharmacie", "___", "librairie"],   blankIdx: 2, category: "Commerces",                correct: "épicerie",    distractors: ["autoroute", "nuage",      "montagne"]  },
        { id: "m10", series: ["médecin", "infirmier", "___", "chirurgien"],      blankIdx: 2, category: "Professions de santé",     correct: "pharmacien",  distractors: ["plombier",  "livre",      "soleil"]     },
    ],
    difficile: [
        { id: "d1",  series: ["colère", "tristesse", "___", "joie"],                      blankIdx: 2, category: "Émotions",                    correct: "peur",             distractors: ["rouge",        "musique",      "forêt"]        },
        { id: "d2",  series: ["soprano", "mezzo", "___", "basse"],                        blankIdx: 2, category: "Tessitures vocales",           correct: "ténor",            distractors: ["piano",        "flûte",        "violon"]        },
        { id: "d3",  series: ["thym", "romarin", "origan", "___"],                        blankIdx: 3, category: "Herbes aromatiques",           correct: "basilic",          distractors: ["tulipe",       "cactus",       "sapin"]         },
        { id: "d4",  series: ["Afrique", "Asie", "Europe", "Amérique", "___"],            blankIdx: 4, category: "Continents",                   correct: "Océanie",          distractors: ["France",       "Sahara",       "Atlantique"]    },
        { id: "d5",  series: ["bouleau", "chêne", "hêtre", "___"],                        blankIdx: 3, category: "Arbres à feuilles caduques",   correct: "frêne",            distractors: ["lilas",        "pivoine",      "cerise"]        },
        { id: "d6",  series: ["trombone", "trompette", "cor", "___"],                     blankIdx: 3, category: "Instruments à vent (cuivres)", correct: "tuba",             distractors: ["piano",        "violon",       "flûte"]         },
        { id: "d7",  series: ["cathédrale", "mosquée", "___", "synagogue"],               blankIdx: 2, category: "Lieux de culte",               correct: "temple",           distractors: ["mairie",       "château",      "école"]         },
        { id: "d8",  series: ["aigle", "faucon", "hibou", "___"],                         blankIdx: 3, category: "Oiseaux rapaces",              correct: "vautour",          distractors: ["carpe",        "lapin",        "chien"]         },
        { id: "d9",  series: ["vue", "ouïe", "odorat", "goût", "___"],                    blankIdx: 4, category: "Cinq sens",                    correct: "toucher",          distractors: ["parole",       "mémoire",      "raison"]        },
        { id: "d10", series: ["Mercure", "Vénus", "Terre", "Mars", "___"],                blankIdx: 4, category: "Planètes (ordre)",             correct: "Jupiter",          distractors: ["Lune",         "Soleil",       "Comète"]        },
        { id: "d11", series: ["triangle", "carré", "pentagone", "___"],                   blankIdx: 3, category: "Polygones",                    correct: "hexagone",         distractors: ["cercle",       "ovale",        "sphère"]        },
        { id: "d12", series: ["impressionnisme", "cubisme", "surréalisme", "___"],        blankIdx: 3, category: "Courants artistiques modernes", correct: "expressionnisme",  distractors: ["baroque",      "renaissance",  "classicisme"]   },
    ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildQuestions(diff: Difficulty): (SeriesQuestion & { choices: string[] })[] {
    return shuffle(BASE_QUESTIONS[diff]).map(q => ({
        ...q,
        choices: shuffle([q.correct, ...q.distractors]),
    }));
}

// ─── Series display ───────────────────────────────────────────────────────────

function SeriesDisplay({ series, answered }: { series: string[]; answered: boolean }) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
            {series.map((word, i) => (
                <span key={i} className="flex items-center gap-x-1.5">
                    {word === "___" ? (
                        <span className={`inline-block min-w-[3.5rem] border-b-2 text-center ${
                            answered
                                ? "border-primary-400 text-primary-600 dark:text-primary-300"
                                : "border-slate-400 dark:border-slate-500 text-transparent"
                        }`}>
                            {"___"}
                        </span>
                    ) : (
                        <span>{word}</span>
                    )}
                    {i < series.length - 1 && <span className="text-slate-400 dark:text-slate-500">,</span>}
                </span>
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Question = SeriesQuestion & { choices: string[] };

export default function AssociationSemantic({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [questions,  setQuestions]  = useState<Question[]>([]);
    const [qIdx,       setQIdx]       = useState(0);
    const [selected,   setSelected]   = useState<string | null>(null);
    const [results,    setResults]    = useState<Result[]>([]);

    const question  = questions[qIdx];
    const isLastQ   = qIdx === questions.length - 1;
    const isCorrect = selected !== null && selected === question?.correct;

    const startGame = (diff: Difficulty) => {
        setQuestions(buildQuestions(diff));
        setQIdx(0);
        setSelected(null);
        setResults([]);
        setPhase("question");
    };

    const handleChoice = useCallback((choice: string) => {
        if (selected !== null || phase !== "question") return;
        setSelected(choice);
        setPhase("feedback");
    }, [selected, phase]);

    const handleNext = useCallback(() => {
        if (!question || selected === null) return;

        const result: Result = {
            question,
            answer: selected,
            correct: selected === question.correct,
        };
        const updated = [...results, result];
        setResults(updated);

        if (isLastQ) {
            const correctCount = updated.filter(r => r.correct).length;
            const score = Math.round((correctCount / updated.length) * 100);
            setPhase("finished");
            if (patientId) {
                saveScore({
                    patientId,
                    exercice: "Associations sémantiques",
                    domaine: "language",
                    score,
                    empan: correctCount,
                });
            }
        } else {
            setQIdx(qIdx + 1);
            setSelected(null);
            setPhase("question");
        }
    }, [question, selected, results, isLastQ, qIdx, patientId]);

    const reset = () => {
        setPhase("idle");
        setQuestions([]);
        setQIdx(0);
        setSelected(null);
        setResults([]);
    };

    const correctCount = results.filter(r => r.correct).length;

    const choiceStyle = (choice: string): string => {
        const base = "w-full px-4 py-2.5 rounded-xl text-sm font-medium border text-left transition-colors duration-150 ";
        if (phase !== "feedback") {
            return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 cursor-pointer";
        }
        if (choice === question?.correct) {
            return base + "bg-green-100 dark:bg-green-900/30 border-green-400 text-green-800 dark:text-green-200 cursor-default";
        }
        if (choice === selected) {
            return base + "bg-red-100 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-300 cursor-default";
        }
        return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-default opacity-50";
    };

    return (
        <div className="flex flex-col h-full p-4 select-none overflow-y-auto">

            {/* --- Idle --- */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
                    <div className="space-y-3 max-w-md">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Une série de mots appartenant à la même catégorie vous est présentée,{" "}
                            avec <strong>un mot manquant</strong>.<br />
                            Choisissez le mot qui complète la série.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Facile : 8 questions · Moyen : 10 · Difficile : 12
                        </p>
                    </div>

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

                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* --- Question / Feedback --- */}
            {(phase === "question" || phase === "feedback") && question && (
                <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">

                    {/* Progression */}
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                            {questions.map((_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    i < qIdx
                                        ? results[i]?.correct ? "bg-green-400" : "bg-red-400"
                                        : i === qIdx ? "bg-primary-400" : "bg-slate-200 dark:bg-slate-700"
                                }`} />
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{qIdx + 1} / {questions.length}</span>
                    </div>

                    {/* Catégorie */}
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 text-center">
                        {question.category}
                    </p>

                    {/* Série */}
                    <div className={`rounded-xl px-4 py-4 border ${
                        phase === "feedback"
                            ? isCorrect
                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}>
                        <SeriesDisplay series={question.series} answered={phase === "feedback"} />
                    </div>

                    {/* Choix */}
                    <div className="flex flex-col gap-2">
                        {question.choices.map((c, i) => (
                            <button key={i} onClick={() => handleChoice(c)} className={choiceStyle(c)}>
                                <span className="flex items-center gap-2">
                                    {phase === "feedback" && c === question.correct && (
                                        <span className="text-green-500 shrink-0">✓</span>
                                    )}
                                    {phase === "feedback" && c === selected && c !== question.correct && (
                                        <span className="text-red-500 shrink-0">✗</span>
                                    )}
                                    {c}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Feedback message + next */}
                    {phase === "feedback" && (
                        <div className="flex items-center justify-between gap-3 mt-1">
                            <p className={`text-sm font-medium ${isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                {isCorrect ? "Bonne réponse !" : `Correct : ${question.correct}`}
                            </p>
                            <button
                                onClick={handleNext}
                                className="px-5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 shrink-0"
                            >
                                {isLastQ ? "Résultats" : "Suivante →"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- Finished --- */}
            {phase === "finished" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                    <div className="flex flex-wrap justify-center gap-1">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                title={r.question.series.join(", ").replace("___", "?")}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs ${r.correct ? "bg-green-500" : "bg-red-400"}`}
                            >
                                {r.correct ? "✓" : "✗"}
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Score :{" "}
                        <strong className={
                            correctCount >= results.length * 0.8 ? "text-green-600 dark:text-green-400" :
                            correctCount >= results.length * 0.6 ? "text-amber-500" : "text-red-500"
                        }>
                            {correctCount} / {results.length}
                        </strong>
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-2 text-left w-full max-w-sm max-h-48 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className={`shrink-0 mt-0.5 ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-500 dark:text-slate-400">{r.question.category}</p>
                                    <p className="text-slate-700 dark:text-slate-200">
                                        {r.question.series.join(", ")}
                                    </p>
                                    {!r.correct && (
                                        <p className="text-red-400">
                                            Votre réponse : <strong>{r.answer}</strong>
                                            {" → "}<strong className="text-green-500">{r.question.correct}</strong>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
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

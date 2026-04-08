"use client";

import { useState, useCallback, useMemo } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "question" | "feedback" | "finished";

interface Question {
    id: string;
    icon: string;
    text: string;
    choices: string[];
    correct: string;
}

interface RoundResult {
    question: Question;
    answer: string;
    correct: boolean;
}

const DAYS_FR   = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                   "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const SEASONS   = ["Printemps", "Été", "Automne", "Hiver"];
const TRIMESTRES = ["1er trimestre", "2e trimestre", "3e trimestre", "4e trimestre"];

function getSeason(month: number, day: number): string {
    if ((month === 2 && day >= 20) || month === 3 || month === 4 || (month === 5 && day < 21)) return "Printemps";
    if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day < 23)) return "Été";
    if ((month === 8 && day >= 23) || month === 9 || month === 10 || (month === 11 && day < 21)) return "Automne";
    return "Hiver";
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function makeChoices(correct: string, pool: string[]): string[] {
    const distractors = shuffle(pool.filter(p => p !== correct)).slice(0, 3);
    return shuffle([correct, ...distractors]);
}

function buildQuestions(): Question[] {
    const now  = new Date();
    const dow   = now.getDay();
    const date  = now.getDate();
    const month = now.getMonth();
    const year  = now.getFullYear();
    const season = getSeason(month, date);
    const tri    = Math.ceil((month + 1) / 3) - 1;

    // Distracteurs pour la date : ±1 à ±7 autour de la vraie date
    const datePool: string[] = [];
    for (let d = 1; d <= 31; d++) {
        if (d !== date) datePool.push(String(d));
    }

    return [
        {
            id: "day",
            icon: "📅",
            text: "Quel jour de la semaine sommes-nous ?",
            choices: makeChoices(DAYS_FR[dow], DAYS_FR.filter((_, i) => i !== dow)),
            correct: DAYS_FR[dow],
        },
        {
            id: "date",
            icon: "🔢",
            text: "Quelle est la date d'aujourd'hui ?",
            choices: makeChoices(String(date), shuffle(datePool)),
            correct: String(date),
        },
        {
            id: "month",
            icon: "🗓️",
            text: "Dans quel mois sommes-nous ?",
            choices: makeChoices(MONTHS_FR[month], MONTHS_FR.filter((_, i) => i !== month)),
            correct: MONTHS_FR[month],
        },
        {
            id: "year",
            icon: "📆",
            text: "En quelle année sommes-nous ?",
            choices: makeChoices(String(year),
                [year - 2, year - 1, year + 1, year + 2].map(String)),
            correct: String(year),
        },
        {
            id: "season",
            icon: "🌿",
            text: "Dans quelle saison sommes-nous ?",
            choices: makeChoices(season, SEASONS.filter(s => s !== season)),
            correct: season,
        },
        {
            id: "trimestre",
            icon: "📊",
            text: "Dans quel trimestre de l'année sommes-nous ?",
            choices: makeChoices(TRIMESTRES[tri], TRIMESTRES.filter((_, i) => i !== tri)),
            correct: TRIMESTRES[tri],
        },
        {
            id: "period",
            icon: "🕐",
            text: "Quelle période de la journée est-il en ce moment ?",
            choices: shuffle(["Matin (6h–12h)", "Après-midi (12h–18h)", "Soirée (18h–22h)", "Nuit (22h–6h)"]),
            correct: (() => {
                const h = now.getHours();
                if (h >= 6  && h < 12) return "Matin (6h–12h)";
                if (h >= 12 && h < 18) return "Après-midi (12h–18h)";
                if (h >= 18 && h < 22) return "Soirée (18h–22h)";
                return "Nuit (22h–6h)";
            })(),
        },
    ];
}

export default function OrientTemporoSpatiale({ patientId }: { patientId: string | null }) {
    const [phase, setPhase]         = useState<Phase>("idle");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [qIdx, setQIdx]           = useState(0);
    const [selected, setSelected]   = useState<string | null>(null);
    const [results, setResults]     = useState<RoundResult[]>([]);

    const question    = questions[qIdx];
    const isLastQ     = qIdx === questions.length - 1;
    const isCorrect   = selected !== null && selected === question?.correct;

    const startGame = () => {
        const qs = buildQuestions();
        setQuestions(qs);
        setQIdx(0);
        setSelected(null);
        setResults([]);
        setPhase("question");
    };

    const handleChoice = useCallback((choice: string) => {
        if (selected !== null) return;
        setSelected(choice);
        setPhase("feedback");
    }, [selected]);

    const handleNext = useCallback(() => {
        if (!question || selected === null) return;

        const result: RoundResult = {
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
                    exercice: "Orientation temporo-spatiale",
                    domaine: "orientation-spatiale",
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

    const correctCount = results.filter(r => r.correct).length;

    const choiceStyle = (choice: string): string => {
        const base = "w-full px-4 py-3 rounded-xl text-sm font-medium border text-left transition-colors duration-150 ";
        if (phase !== "feedback") {
            return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-300 dark:hover:border-sky-600 cursor-pointer";
        }
        if (choice === question?.correct) {
            return base + "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500 text-green-800 dark:text-green-200 cursor-default";
        }
        if (choice === selected) {
            return base + "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 cursor-default";
        }
        return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-default opacity-50";
    };

    return (
        <div className="flex flex-col h-full p-6 select-none items-center justify-center">

            {/* --- Écran d'accueil --- */}
            {phase === "idle" && (
                <div className="text-center space-y-6 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Répondez à des questions sur <strong>la date</strong>, <strong>le moment</strong>{" "}
                        et <strong>la période</strong> de l'année.<br />
                        Choisissez la bonne réponse parmi les propositions.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        7 questions · réponses basées sur la date d'aujourd'hui
                    </p>
                    <button
                        onClick={startGame}
                        className="px-8 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* --- Question --- */}
            {(phase === "question" || phase === "feedback") && question && (
                <div className="flex flex-col gap-5 w-full max-w-sm">

                    {/* Progression */}
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1 flex-1">
                            {questions.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                        i < qIdx
                                            ? results[i]?.correct
                                                ? "bg-green-400 dark:bg-green-500"
                                                : "bg-red-400 dark:bg-red-500"
                                            : i === qIdx
                                            ? "bg-sky-400 dark:bg-sky-500"
                                            : "bg-slate-200 dark:bg-slate-700"
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                            {qIdx + 1} / {questions.length}
                        </span>
                    </div>

                    {/* Question */}
                    <div className="text-center space-y-2">
                        <span className="text-4xl">{question.icon}</span>
                        <p className="text-base font-semibold text-slate-800 dark:text-white leading-snug">
                            {question.text}
                        </p>
                    </div>

                    {/* Choix */}
                    <div className="flex flex-col gap-2">
                        {question.choices.map((choice, i) => (
                            <button
                                key={i}
                                onClick={() => handleChoice(choice)}
                                className={choiceStyle(choice)}
                            >
                                <span className="flex items-center gap-2">
                                    {phase === "feedback" && choice === question.correct && (
                                        <span className="text-green-500">✓</span>
                                    )}
                                    {phase === "feedback" && choice === selected && choice !== question.correct && (
                                        <span className="text-red-500">✗</span>
                                    )}
                                    {choice}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Feedback + bouton suivant */}
                    {phase === "feedback" && (
                        <div className="flex flex-col items-center gap-3 mt-1">
                            <p className={`text-sm font-medium ${isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                {isCorrect
                                    ? "Bonne réponse !"
                                    : `La bonne réponse était : ${question.correct}`}
                            </p>
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-sm transition-colors duration-200"
                            >
                                {isLastQ ? "Voir les résultats" : "Question suivante →"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- Résultats --- */}
            {phase === "finished" && (
                <div className="text-center space-y-5 max-w-sm">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                        Exercice terminé !
                    </p>

                    {/* Score visuel */}
                    <div className="flex items-center justify-center gap-1">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                title={r.question.text}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-base ${
                                    r.correct ? "bg-green-500" : "bg-red-400"
                                }`}
                            >
                                {r.correct ? "✓" : "✗"}
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Score :{" "}
                        <strong className={
                            correctCount >= 6 ? "text-green-600 dark:text-green-400" :
                            correctCount >= 4 ? "text-amber-500" : "text-red-500"
                        }>
                            {correctCount} / {results.length}
                        </strong>
                    </p>

                    {/* Détail */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-2 text-left">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className={`shrink-0 mt-0.5 ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-600 dark:text-slate-300">{r.question.text}</p>
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

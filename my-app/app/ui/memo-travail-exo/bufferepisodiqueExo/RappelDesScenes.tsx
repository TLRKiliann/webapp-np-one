"use client";

import { useState } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "study" | "recall" | "result" | "finished";

const SCENES = [
    {
        title: "La place du marché",
        description:
            "Il est 9h du matin sur la place du marché d'un village provençal. " +
            "Une femme en robe jaune achète des tomates à un vendeur portant une casquette bleue. " +
            "À gauche, un vieil homme lit le journal sur un banc en bois. " +
            "Trois enfants jouent avec un ballon rouge près de la fontaine en pierre. " +
            "Un chien blanc dort à l'ombre d'un platane. " +
            "Au fond, une boulangerie affiche « Pain frais » sur sa vitrine verte.",
        questions: [
            { q: "Quelle heure est-il ?", options: ["7h", "9h", "11h", "14h"], answer: 1 },
            { q: "De quelle couleur est la robe de la femme ?", options: ["Rouge", "Bleue", "Jaune", "Verte"], answer: 2 },
            { q: "Que fait le vieil homme sur le banc ?", options: ["Il mange", "Il lit le journal", "Il dort", "Il discute"], answer: 1 },
            { q: "Combien d'enfants jouent près de la fontaine ?", options: ["2", "3", "4", "5"], answer: 1 },
            { q: "De quelle couleur est le chien ?", options: ["Noir", "Marron", "Blanc", "Gris"], answer: 2 },
            { q: "De quelle couleur est la vitrine de la boulangerie ?", options: ["Rouge", "Jaune", "Bleue", "Verte"], answer: 3 },
        ],
    },
    {
        title: "La bibliothèque",
        description:
            "Dans une grande bibliothèque silencieuse, il est 14h30. " +
            "Un jeune homme aux cheveux noirs porte des lunettes rondes et lit un livre de géographie. " +
            "À côté de lui, une femme aux cheveux roux tape sur un ordinateur portable argenté. " +
            "Sur la table, une tasse de café, un stylo vert et un carnet à spirale sont posés. " +
            "Une bibliothécaire en chemise à rayures bleues range des livres sur l'étagère du fond. " +
            "Par la fenêtre, on aperçoit un jardin avec un grand sapin.",
        questions: [
            { q: "Quelle heure est-il ?", options: ["10h30", "12h00", "14h30", "17h00"], answer: 2 },
            { q: "Que lit le jeune homme ?", options: ["Un roman", "Un livre de géographie", "Un magazine", "Un dictionnaire"], answer: 1 },
            { q: "De quelle couleur est l'ordinateur portable ?", options: ["Noir", "Blanc", "Argenté", "Rouge"], answer: 2 },
            { q: "Quel objet est posé sur la table avec le carnet ?", options: ["Une gomme", "Un stylo vert", "Une règle", "Des ciseaux"], answer: 1 },
            { q: "Quelle est la tenue de la bibliothécaire ?", options: ["Robe noire", "Chemise à rayures bleues", "Pull rouge", "Veste grise"], answer: 1 },
            { q: "Que voit-on par la fenêtre ?", options: ["Une rue animée", "Un lac", "Un jardin avec un sapin", "Une montagne"], answer: 2 },
        ],
    },
    {
        title: "La gare",
        description:
            "Il est 18h00 à la gare centrale d'une grande ville. " +
            "Un train bleu et blanc vient d'arriver sur le quai numéro 5. " +
            "Une famille de quatre personnes attend avec deux valises rouges et un sac à dos jaune. " +
            "Un homme en costume gris court vers le guichet en tenant un journal. " +
            "Une jeune femme en manteau orange mange un sandwich assis sur un banc métallique. " +
            "Au tableau des départs, le prochain train pour Lyon est prévu à 18h42.",
        questions: [
            { q: "Quelle heure est-il ?", options: ["16h00", "17h30", "18h00", "19h00"], answer: 2 },
            { q: "Sur quel quai le train arrive-t-il ?", options: ["Quai 2", "Quai 3", "Quai 5", "Quai 7"], answer: 2 },
            { q: "De quelle couleur sont les valises de la famille ?", options: ["Bleues", "Noires", "Rouges", "Vertes"], answer: 2 },
            { q: "Que tient l'homme en costume gris ?", options: ["Un téléphone", "Un journal", "Une valise", "Un billet"], answer: 1 },
            { q: "De quelle couleur est le manteau de la jeune femme ?", options: ["Rouge", "Bleu", "Orange", "Beige"], answer: 2 },
            { q: "À quelle heure est le prochain train pour Lyon ?", options: ["18h15", "18h42", "19h00", "19h20"], answer: 1 },
        ],
    },
];

export default function RappelDesScenes({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [sceneIndex, setSceneIndex] = useState(0);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [sceneResults, setSceneResults] = useState<boolean[]>([]);
    const [totalScore, setTotalScore] = useState(0);
    const [record, setRecord] = useState(0);
    const [lastAnswer, setLastAnswer] = useState<number | null>(null);

    const scene = SCENES[sceneIndex];
    const question = scene?.questions[questionIndex];

    const startStudy = () => {
        setSceneResults([]);
        setQuestionIndex(0);
        setLastAnswer(null);
        setPhase("study");
    };

    const handleAnswer = (idx: number) => {
        if (lastAnswer !== null) return;
        setLastAnswer(idx);
        const correct = idx === question.answer;
        const newResults = [...sceneResults, correct];
        setSceneResults(newResults);

        setTimeout(() => {
            if (questionIndex + 1 < scene.questions.length) {
                setQuestionIndex(q => q + 1);
                setLastAnswer(null);
            } else {
                const sceneScore = newResults.filter(Boolean).length;
                const newTotal = totalScore + sceneScore;
                const newRecord = Math.max(record, sceneScore);
                setTotalScore(newTotal);
                setRecord(newRecord);
                setPhase("result");

                if (sceneIndex + 1 >= SCENES.length && patientId) {
                    saveScore({
                        patientId,
                        exercice: "Rappel de scènes",
                        domaine: "memo-travail",
                        score: newTotal,
                        empan: newRecord,
                    });
                }
            }
        }, 900);
    };

    const nextScene = () => {
        if (sceneIndex + 1 >= SCENES.length) {
            setPhase("finished");
        } else {
            setSceneIndex(i => i + 1);
            startStudy();
        }
    };

    const reset = () => {
        setPhase("idle");
        setSceneIndex(0);
        setQuestionIndex(0);
        setSceneResults([]);
        setTotalScore(0);
        setRecord(0);
        setLastAnswer(null);
    };

    const sceneScore = sceneResults.filter(Boolean).length;

    return (
        <div className="flex flex-col h-full p-4 gap-3 select-none">

            {/* Stats */}
            <div className="flex gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Scène : <strong className="text-indigo-600 dark:text-indigo-300">{sceneIndex + 1} / {SCENES.length}</strong></span>
                <span>Score : <strong className="text-emerald-600 dark:text-green-400">{totalScore}</strong></span>
                <span>Record : <strong className="text-yellow-600 dark:text-yellow-400">{record} / {scene?.questions.length}</strong></span>
            </div>

            {/* Zone principale */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">

                {phase === "idle" && (
                    <div className="text-center space-y-5 max-w-lg">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Une scène va être décrite. Lisez-la attentivement et mémorisez un maximum de détails.<br />
                            Vous devrez ensuite répondre à des questions sur ce que vous avez lu.
                        </p>
                        <button
                            onClick={startStudy}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {phase === "study" && (
                    <div className="w-full max-w-xl space-y-6 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            Scène {sceneIndex + 1} — {scene.title}
                        </p>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-8 py-6 shadow-sm text-left">
                            <p className="text-base text-slate-800 dark:text-white leading-relaxed">
                                {scene.description}
                            </p>
                        </div>
                        <button
                            onClick={() => setPhase("recall")}
                            className="px-8 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            J'ai mémorisé →
                        </button>
                    </div>
                )}

                {phase === "recall" && question && (
                    <div className="w-full max-w-md space-y-5">
                        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                            Question {questionIndex + 1} / {scene.questions.length}
                        </p>
                        <p className="text-center font-semibold text-slate-800 dark:text-slate-100 text-lg">
                            {question.q}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {question.options.map((opt, idx) => {
                                let style = "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900 text-slate-800 dark:text-white cursor-pointer";
                                if (lastAnswer !== null) {
                                    if (idx === question.answer) style = "bg-green-100 dark:bg-green-900 border-green-500 text-green-800 dark:text-green-200 cursor-default";
                                    else if (idx === lastAnswer) style = "bg-red-100 dark:bg-red-900 border-red-400 text-red-700 dark:text-red-200 cursor-default";
                                    else style = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-default";
                                }
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={lastAnswer !== null}
                                        className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors duration-150 ${style}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {phase === "result" && (
                    <div className="text-center space-y-4 max-w-sm">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                            Scène {sceneIndex + 1} terminée
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                            {sceneScore} / {scene.questions.length} bonnes réponses
                        </p>
                        <div className="flex gap-2 justify-center">
                            {sceneResults.map((ok, i) => (
                                <span key={i} className={`text-xl ${ok ? "text-emerald-500" : "text-red-400"}`}>
                                    {ok ? "✓" : "✗"}
                                </span>
                            ))}
                        </div>
                        {sceneIndex + 1 < SCENES.length ? (
                            <button
                                onClick={nextScene}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                            >
                                Scène suivante →
                            </button>
                        ) : (
                            <button
                                onClick={() => setPhase("finished")}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                            >
                                Voir le résultat final →
                            </button>
                        )}
                    </div>
                )}

                {phase === "finished" && (
                    <div className="text-center space-y-4">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé</p>
                        <p className="text-slate-600 dark:text-slate-400">
                            Score total : <strong>{totalScore}</strong> / {SCENES.reduce((acc, s) => acc + s.questions.length, 0)}
                        </p>
                        <p className="text-slate-500 dark:text-slate-500 text-sm">
                            Meilleure scène : <strong>{record}</strong> / {scene.questions.length} bonnes réponses
                        </p>
                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Recommencer
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Sentence = {
    text: string;
    correct: boolean;
    lastWord: string;
};

const SENTENCES: Sentence[] = [
    { text: "Le soleil se lève à l'est chaque matin.", correct: true, lastWord: "matin" },
    { text: "Les chats aboient quand ils ont faim.", correct: false, lastWord: "faim" },
    { text: "La neige est froide en hiver.", correct: true, lastWord: "hiver" },
    { text: "Les oiseaux nagent sous l'eau.", correct: false, lastWord: "eau" },
    { text: "Le pain est cuit dans un four.", correct: true, lastWord: "four" },
    { text: "Les voitures poussent dans les jardins.", correct: false, lastWord: "jardins" },
    { text: "La lune éclaire la nuit.", correct: true, lastWord: "nuit" },
    { text: "Les fleurs chantent au printemps.", correct: false, lastWord: "printemps" },
    { text: "Le médecin soigne les malades.", correct: true, lastWord: "malades" },
    { text: "Les livres se mangent au petit-déjeuner.", correct: false, lastWord: "déjeuner" },
    { text: "L'eau bout à cent degrés.", correct: true, lastWord: "degrés" },
    { text: "Les poissons vivent dans les arbres.", correct: false, lastWord: "arbres" },
    { text: "Le boulanger pétrit la pâte à pain.", correct: true, lastWord: "pain" },
    { text: "Les avions naviguent sur la mer.", correct: false, lastWord: "mer" },
    { text: "Les enfants jouent dans la cour.", correct: true, lastWord: "cour" },
    { text: "Le feu est chaud et brûlant.", correct: true, lastWord: "brûlant" },
    { text: "Les vaches volent au-dessus des nuages.", correct: false, lastWord: "nuages" },
    { text: "Le chat dort sur le canapé.", correct: true, lastWord: "canapé" },
    { text: "Les arbres poussent vers le ciel.", correct: true, lastWord: "ciel" },
    { text: "La pluie tombe toujours vers le haut.", correct: false, lastWord: "haut" },
    { text: "Le musicien joue de la guitare.", correct: true, lastWord: "guitare" },
    { text: "Les éléphants sont de petits insectes.", correct: false, lastWord: "insectes" },
    { text: "La maison a des fenêtres et des portes.", correct: true, lastWord: "portes" },
    { text: "Les montres poussent dans les champs.", correct: false, lastWord: "champs" },
];

const DISTRACTORS = ["table", "route", "lampe", "stylo", "forêt", "école", "rivière", "nuage", "miroir", "cloche"];

type Phase = "idle" | "reading" | "recall" | "correct" | "wrong" | "finished";

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

export default function EmpanLecture({ patientId }: { patientId: string | null }) {
    const [span, setSpan] = useState(2);
    const [errors, setErrors] = useState(0);
    const [score, setScore] = useState(0);
    const [record, setRecord] = useState(0);
    const [phase, setPhase] = useState<Phase>("idle");

    const [seriesSentences, setSeriesSentences] = useState<Sentence[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [judgeFeedback, setJudgeFeedback] = useState<"correct" | "wrong" | null>(null);
    const [processingScore, setProcessingScore] = useState(0);

    const [wordBank, setWordBank] = useState<string[]>([]);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);

    const buildWordBank = (sentences: Sentence[]): string[] => {
        const targets = sentences.map(s => s.lastWord);
        const available = DISTRACTORS.filter(d => !targets.includes(d));
        const distractors = shuffle(available).slice(0, 3);
        return shuffle([...targets, ...distractors]);
    };

    const startRound = useCallback((currentSpan: number) => {
        const picked = shuffle(SENTENCES).slice(0, currentSpan);
        setSeriesSentences(picked);
        setCurrentIndex(0);
        setSelectedWords([]);
        setJudgeFeedback(null);
        setProcessingScore(0);
        setPhase("reading");
    }, []);

    const handleJudge = (answer: boolean) => {
        const sentence = seriesSentences[currentIndex];
        const isCorrect = answer === sentence.correct;
        setJudgeFeedback(isCorrect ? "correct" : "wrong");
        setProcessingScore(prev => prev + (isCorrect ? 1 : 0));

        setTimeout(() => {
            setJudgeFeedback(null);
            if (currentIndex + 1 >= seriesSentences.length) {
                setWordBank(buildWordBank(seriesSentences));
                setPhase("recall");
            } else {
                setCurrentIndex(i => i + 1);
            }
        }, 700);
    };

    const handleWordSelect = (word: string) => {
        if (selectedWords.includes(word)) return;
        const newSelected = [...selectedWords, word];
        setSelectedWords(newSelected);

        if (newSelected.length < seriesSentences.length) return;

        const targets = seriesSentences.map(s => s.lastWord);
        const recallOk = targets.every((w, i) => newSelected[i] === w);

        if (recallOk) {
            const newSpan = Math.min(8, span + 1);
            setScore(s => s + span + processingScore);
            setRecord(r => Math.max(r, span));
            setSpan(newSpan);
            setPhase("correct");
            setTimeout(() => startRound(newSpan), 1400);
        } else {
            const newErrors = errors + 1;
            setErrors(newErrors);
            if (newErrors >= 3) {
                setPhase("finished");
                if (patientId) {
                    saveScore({ patientId, exercice: "Empan de lecture", domaine: "admin-central", score, empan: record });
                }
            } else {
                const newSpan = Math.max(2, span - 1);
                setSpan(newSpan);
                setPhase("wrong");
                setTimeout(() => startRound(newSpan), 1400);
            }
        }
    };

    const reset = () => {
        setSpan(2);
        setErrors(0);
        setScore(0);
        setRecord(0);
        setPhase("idle");
        setSeriesSentences([]);
        setCurrentIndex(0);
        setSelectedWords([]);
        setProcessingScore(0);
    };

    const targets = seriesSentences.map(s => s.lastWord);
    const currentSentence = seriesSentences[currentIndex];

    return (
        <div className="flex flex-col h-full p-4 gap-3 select-none">

            {/* Stats */}
            <div className="flex gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Empan : <strong className="text-indigo-600 dark:text-indigo-300">{span}</strong></span>
                <span>Score : <strong className="text-green-600 dark:text-green-400">{score}</strong></span>
                <span>Erreurs : <strong className={errors >= 2 ? "text-red-600" : ""}>{errors}</strong> / 3</span>
                <span>Record : <strong className="text-yellow-600 dark:text-yellow-400">{record}</strong></span>
            </div>

            {/* Zone principale */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">

                {phase === "idle" && (
                    <div className="text-center space-y-5 max-w-md">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Lisez chaque phrase et indiquez si elle a du sens.<br />
                            Mémorisez le <strong>dernier mot</strong> de chaque phrase.<br />
                            À la fin, rappellez les mots dans l'ordre.
                        </p>
                        <button
                            onClick={() => startRound(span)}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {phase === "reading" && currentSentence && (
                    <div className="w-full max-w-lg space-y-5 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Phrase {currentIndex + 1} / {seriesSentences.length}
                        </p>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-8 py-6 shadow-sm">
                            <p className="text-lg font-medium text-slate-800 dark:text-white leading-relaxed">
                                {currentSentence.text}
                            </p>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Cette phrase a-t-elle du sens ?
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => handleJudge(true)}
                                disabled={judgeFeedback !== null}
                                className="px-10 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors duration-200"
                            >
                                Oui
                            </button>
                            <button
                                onClick={() => handleJudge(false)}
                                disabled={judgeFeedback !== null}
                                className="px-10 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors duration-200"
                            >
                                Non
                            </button>
                        </div>
                        {judgeFeedback && (
                            <p className={`text-sm font-semibold ${judgeFeedback === "correct" ? "text-green-500" : "text-red-500"}`}>
                                {judgeFeedback === "correct" ? "Correct !" : "Incorrect"}
                            </p>
                        )}
                    </div>
                )}

                {phase === "recall" && (
                    <div className="w-full max-w-lg space-y-5">
                        <p className="text-center font-semibold text-slate-700 dark:text-slate-200">
                            Rappellez les derniers mots dans l'ordre
                        </p>

                        {/* Cases de réponse */}
                        <div className="flex gap-2 flex-wrap justify-center">
                            {targets.map((_, i) => (
                                <div
                                    key={i}
                                    className="px-4 py-2 min-w-24 text-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200"
                                >
                                    {selectedWords[i] ?? ""}
                                </div>
                            ))}
                        </div>

                        {/* Banque de mots */}
                        <div className="flex gap-2 flex-wrap justify-center mt-2">
                            {wordBank.map((word) => {
                                const used = selectedWords.includes(word);
                                return (
                                    <button
                                        key={word}
                                        onClick={() => handleWordSelect(word)}
                                        disabled={used}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 ${
                                            used
                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-default"
                                                : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900 cursor-pointer text-slate-800 dark:text-white"
                                        }`}
                                    >
                                        {word}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {phase === "correct" && (
                    <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                        Excellent ! Niveau suivant...
                    </p>
                )}

                {phase === "wrong" && (
                    <p className="text-red-600 dark:text-red-400 font-bold text-lg">
                        Incorrect. On recommence...
                    </p>
                )}

                {phase === "finished" && (
                    <div className="text-center space-y-4">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                            Exercice terminé
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                            Score final : <strong>{score}</strong> — Record : empan <strong>{record}</strong>
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

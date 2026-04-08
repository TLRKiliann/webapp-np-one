"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "presenting" | "recall" | "feedback" | "finished";

interface RoundResult {
    span: number;
    sequence: string[];
    answer: string[];
    correct: boolean;
}

const MIN_SPAN = 3;
const MAX_SPAN = 7;
const WORD_DISPLAY_MS = 1100;
const INTER_WORD_MS = 350;
const DISTRACTORS_COUNT = 4;

// Pool de mots simples, sans relation sémantique entre catégories
const WORD_POOL: string[] = [
    "chien", "table", "soleil", "livre", "pomme",
    "chaise", "lune", "porte", "cerise", "stylo",
    "oiseau", "lampe", "nuage", "fenêtre", "poire",
    "tigre", "botte", "étoile", "cahier", "citron",
    "lapin", "mur", "rivière", "crayon", "fraise",
    "cheval", "tasse", "montagne", "journal", "raisin",
    "renard", "assiette", "forêt", "règle", "melon",
    "cochon", "bougie", "plage", "cartable", "orange",
    "mouton", "clé", "désert", "agenda", "banane",
    "corbeau", "miroir", "colline", "enveloppe", "cerise",
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateSequence(length: number): string[] {
    return shuffle(WORD_POOL).slice(0, length);
}

function generateChoices(sequence: string[]): string[] {
    const distractors = shuffle(
        WORD_POOL.filter(w => !sequence.includes(w))
    ).slice(0, DISTRACTORS_COUNT);
    return shuffle([...sequence, ...distractors]);
}

export default function EmpanMots({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [span, setSpan] = useState(MIN_SPAN);
    const [sequence, setSequence] = useState<string[]>([]);
    const [choices, setChoices] = useState<string[]>([]);
    const [visibleIdx, setVisibleIdx] = useState(-1);
    const [answer, setAnswer] = useState<string[]>([]);
    const [results, setResults] = useState<RoundResult[]>([]);
    const [errorsAtSpan, setErrorsAtSpan] = useState(0);
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const presentSequence = useCallback((seq: string[]) => {
        setPhase("presenting");
        setVisibleIdx(-1);
        setAnswer([]);

        let i = 0;
        const showNext = () => {
            if (i < seq.length) {
                setVisibleIdx(i);
                i++;
                timeoutRef.current = setTimeout(() => {
                    setVisibleIdx(-1);
                    timeoutRef.current = setTimeout(showNext, INTER_WORD_MS);
                }, WORD_DISPLAY_MS);
            } else {
                setVisibleIdx(-1);
                setPhase("recall");
            }
        };

        timeoutRef.current = setTimeout(showNext, 400);
    }, []);

    const startRound = useCallback((currentSpan: number) => {
        const seq = generateSequence(currentSpan);
        const ch = generateChoices(seq);
        setSequence(seq);
        setChoices(ch);
        presentSequence(seq);
    }, [presentSequence]);

    const startGame = () => {
        setSpan(MIN_SPAN);
        setResults([]);
        setErrorsAtSpan(0);
        setLastCorrect(null);
        startRound(MIN_SPAN);
    };

    const handleWordClick = useCallback((word: string) => {
        if (answer.includes(word) || answer.length >= span) return;
        setAnswer(prev => [...prev, word]);
    }, [answer, span]);

    const handleDelete = useCallback(() => {
        setAnswer(prev => prev.slice(0, -1));
    }, []);

    const finishGame = useCallback((allResults: RoundResult[], maxSpanReached: number) => {
        setPhase("finished");
        if (patientId) {
            const correctCount = allResults.filter(r => r.correct).length;
            const score = Math.round((correctCount / allResults.length) * 100);
            saveScore({
                patientId,
                exercice: "Empan de mots",
                domaine: "memo-travail",
                score,
                empan: maxSpanReached,
            });
        }
    }, [patientId]);

    const handleValidate = useCallback(() => {
        const correct =
            answer.length === sequence.length &&
            answer.every((w, i) => w === sequence[i]);

        const result: RoundResult = { span, sequence, answer, correct };
        const updated = [...results, result];

        setLastCorrect(correct);
        setPhase("feedback");
        setResults(updated);

        if (correct) {
            if (span < MAX_SPAN) {
                setTimeout(() => {
                    setErrorsAtSpan(0);
                    setSpan(span + 1);
                    startRound(span + 1);
                }, 1800);
            } else {
                setTimeout(() => finishGame(updated, span), 1800);
            }
        } else {
            const newErrors = errorsAtSpan + 1;
            setErrorsAtSpan(newErrors);
            if (newErrors >= 2) {
                setTimeout(() => finishGame(updated, span), 1800);
            } else {
                setTimeout(() => startRound(span), 1800);
            }
        }
    }, [answer, sequence, span, errorsAtSpan, results, startRound, finishGame]);

    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    const currentWord = visibleIdx >= 0 ? sequence[visibleIdx] : null;
    const totalRounds = results.length;
    const correctRounds = results.filter(r => r.correct).length;
    const maxSpanAchieved = results.filter(r => r.correct).reduce(
        (m, r) => Math.max(m, r.span), MIN_SPAN - 1
    );

    return (
        <div className="flex flex-col h-full p-6 gap-4 select-none items-center justify-center">

            {/* --- Écran d'accueil --- */}
            {phase === "idle" && (
                <div className="text-center space-y-6 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Des mots vont s'afficher <strong>un par un</strong>.<br />
                        Mémorisez-les puis retrouvez-les <strong>dans le même ordre</strong>{" "}
                        parmi les propositions affichées.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Empan initial : {MIN_SPAN} mots · Maximum : {MAX_SPAN} mots
                    </p>
                    <button
                        onClick={startGame}
                        className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* --- Présentation des mots --- */}
            {phase === "presenting" && (
                <div className="flex flex-col items-center gap-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mémorisez la séquence… ({span} mots)
                    </p>
                    <div className="min-w-44 px-8 h-20 rounded-2xl bg-teal-50 dark:bg-teal-900/30 border-2 border-teal-200 dark:border-teal-700 flex items-center justify-center">
                        {currentWord !== null ? (
                            <span className="text-3xl font-bold text-teal-700 dark:text-teal-300 tracking-wide">
                                {currentWord}
                            </span>
                        ) : (
                            <span className="text-3xl text-slate-300 dark:text-slate-600">·</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {sequence.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                                    i < visibleIdx
                                        ? "bg-teal-400 dark:bg-teal-500"
                                        : i === visibleIdx
                                        ? "bg-teal-600 dark:bg-teal-300 scale-125"
                                        : "bg-slate-200 dark:bg-slate-700"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* --- Rappel (sélection parmi les choix) --- */}
            {phase === "recall" && (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        Sélectionnez les mots <span className="text-teal-600 dark:text-teal-400">dans l'ordre</span>
                    </p>

                    {/* Réponse en cours */}
                    <div className="flex flex-wrap gap-2 min-h-[2.75rem] items-center justify-center w-full px-2">
                        {answer.length === 0 ? (
                            <span className="text-slate-300 dark:text-slate-600 text-base">—</span>
                        ) : (
                            answer.map((w, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold text-sm border border-teal-200 dark:border-teal-700"
                                >
                                    {i + 1}. {w}
                                </span>
                            ))
                        )}
                    </div>

                    {/* Grille de mots */}
                    <div className="grid grid-cols-3 gap-2 w-full">
                        {choices.map((word, i) => {
                            const selected = answer.includes(word);
                            const pos = answer.indexOf(word);
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleWordClick(word)}
                                    disabled={selected}
                                    className={`py-2 px-1 rounded-xl text-sm font-medium border transition-colors duration-150 ${
                                        selected
                                            ? "bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-600 text-teal-600 dark:text-teal-400 cursor-default"
                                            : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:border-teal-300 dark:hover:border-teal-600"
                                    }`}
                                >
                                    {selected ? `${pos + 1}. ${word}` : word}
                                </button>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleDelete}
                            disabled={answer.length === 0}
                            className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ← Annuler dernier
                        </button>
                        <button
                            onClick={handleValidate}
                            disabled={answer.length !== span}
                            className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Valider
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {answer.length} / {span} mots sélectionnés
                    </p>
                </div>
            )}

            {/* --- Feedback --- */}
            {phase === "feedback" && (
                <div className="flex flex-col items-center gap-5 text-center">
                    <div className={`text-5xl ${lastCorrect ? "text-green-500" : "text-red-500"}`}>
                        {lastCorrect ? "✓" : "✗"}
                    </div>
                    <p className={`text-lg font-semibold ${lastCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {lastCorrect ? "Correct !" : "Incorrect"}
                    </p>
                    <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5">
                        <p>
                            Séquence :{" "}
                            <strong className="text-slate-700 dark:text-slate-200">
                                {sequence.join(" – ")}
                            </strong>
                        </p>
                        {!lastCorrect && (
                            <p>
                                Votre réponse :{" "}
                                <strong className="text-red-500">
                                    {answer.join(" – ")}
                                </strong>
                            </p>
                        )}
                    </div>
                    {lastCorrect && span < MAX_SPAN && (
                        <p className="text-xs text-slate-400">Empan suivant : {span + 1} mots…</p>
                    )}
                    {!lastCorrect && errorsAtSpan < 2 && (
                        <p className="text-xs text-amber-500">Nouvel essai au même empan…</p>
                    )}
                </div>
            )}

            {/* --- Résultats finaux --- */}
            {phase === "finished" && (
                <div className="text-center space-y-5 max-w-sm">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                        <p>
                            Empan maximum atteint :{" "}
                            <strong className="text-teal-600 dark:text-teal-300 text-base">
                                {maxSpanAchieved > 0 ? maxSpanAchieved : MIN_SPAN - 1} mots
                            </strong>
                        </p>
                        <p>Réussites : <strong>{correctRounds} / {totalRounds}</strong></p>
                    </div>

                    {/* Détail des essais */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1.5 text-left max-h-44 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className={`mt-0.5 shrink-0 ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">
                                    Empan {r.span} :
                                </span>
                                <span className="text-slate-700 dark:text-slate-300">
                                    {r.sequence.join(" – ")}
                                </span>
                                {!r.correct && (
                                    <span className="text-red-400 shrink-0">
                                        → {r.answer.join(" – ")}
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

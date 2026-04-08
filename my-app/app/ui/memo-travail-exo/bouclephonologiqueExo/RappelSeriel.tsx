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
const MAX_SPAN = 8;
const LETTER_DISPLAY_MS = 900;
const INTER_LETTER_MS = 300;

// Consonnes uniquement — évite la formation de mots mémorisables
const CONSONANTS = ["B", "D", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "V", "Z"];

// Disposition clavier alphabétique sur 4 rangées
const KEYBOARD_ROWS = [
    ["B", "D", "F", "G", "H"],
    ["J", "K", "L", "M", "N"],
    ["P", "R", "S", "T", "V"],
    ["Z"],
];

function generateSequence(length: number): string[] {
    const seq: string[] = [];
    let prev = "";
    for (let i = 0; i < length; i++) {
        let l: string;
        do { l = CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]; }
        while (l === prev);
        seq.push(l);
        prev = l;
    }
    return seq;
}

export default function RappelSeriel({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [span, setSpan] = useState(MIN_SPAN);
    const [sequence, setSequence] = useState<string[]>([]);
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
                    timeoutRef.current = setTimeout(showNext, INTER_LETTER_MS);
                }, LETTER_DISPLAY_MS);
            } else {
                setVisibleIdx(-1);
                setPhase("recall");
            }
        };

        timeoutRef.current = setTimeout(showNext, 400);
    }, []);

    const startRound = useCallback((currentSpan: number) => {
        const seq = generateSequence(currentSpan);
        setSequence(seq);
        presentSequence(seq);
    }, [presentSequence]);

    const startGame = () => {
        setSpan(MIN_SPAN);
        setResults([]);
        setErrorsAtSpan(0);
        setLastCorrect(null);
        startRound(MIN_SPAN);
    };

    const handleLetterClick = useCallback((letter: string) => {
        if (answer.length >= span) return;
        setAnswer(prev => [...prev, letter]);
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
                exercice: "Rappel sériel de lettres",
                domaine: "memo-travail",
                score,
                empan: maxSpanReached,
            });
        }
    }, [patientId]);

    const handleValidate = useCallback(() => {
        const correct =
            answer.length === sequence.length &&
            answer.every((l, i) => l === sequence[i]);

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
                }, 1600);
            } else {
                setTimeout(() => finishGame(updated, span), 1600);
            }
        } else {
            const newErrors = errorsAtSpan + 1;
            setErrorsAtSpan(newErrors);
            if (newErrors >= 2) {
                setTimeout(() => finishGame(updated, span), 1600);
            } else {
                setTimeout(() => startRound(span), 1600);
            }
        }
    }, [answer, sequence, span, errorsAtSpan, results, startRound, finishGame]);

    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    const currentLetter = visibleIdx >= 0 ? sequence[visibleIdx] : null;
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
                        Des <strong>lettres</strong> vont s'afficher une par une.<br />
                        Mémorisez-les puis saisissez-les <strong>dans le même ordre</strong>.<br />
                        La séquence s'allonge à chaque bonne réponse.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Empan initial : {MIN_SPAN} lettres · Maximum : {MAX_SPAN} lettres
                    </p>
                    <button
                        onClick={startGame}
                        className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* --- Présentation des lettres --- */}
            {phase === "presenting" && (
                <div className="flex flex-col items-center gap-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mémorisez la séquence… ({span} lettres)
                    </p>
                    <div className="w-28 h-28 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 flex items-center justify-center">
                        {currentLetter !== null ? (
                            <span className="text-6xl font-bold text-orange-600 dark:text-orange-300 font-mono">
                                {currentLetter}
                            </span>
                        ) : (
                            <span className="text-4xl text-slate-300 dark:text-slate-600">·</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {sequence.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                                    i < visibleIdx
                                        ? "bg-orange-400 dark:bg-orange-500"
                                        : i === visibleIdx
                                        ? "bg-orange-500 dark:bg-orange-300 scale-125"
                                        : "bg-slate-200 dark:bg-slate-700"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* --- Rappel (clavier de lettres) --- */}
            {phase === "recall" && (
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        Saisissez les lettres dans l'ordre
                    </p>

                    {/* Réponse en cours */}
                    <div className="flex gap-1.5 min-h-[3rem] items-center justify-center flex-wrap">
                        {answer.length === 0 ? (
                            <span className="text-slate-300 dark:text-slate-600 text-lg">—</span>
                        ) : (
                            answer.map((l, i) => (
                                <span
                                    key={i}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-bold text-xl border border-orange-200 dark:border-orange-700 font-mono"
                                >
                                    {l}
                                </span>
                            ))
                        )}
                    </div>

                    {/* Clavier de consonnes */}
                    <div className="flex flex-col gap-2 w-full">
                        {KEYBOARD_ROWS.map((row, ri) => (
                            <div key={ri} className="flex gap-2 justify-center">
                                {row.map((letter) => (
                                    <button
                                        key={letter}
                                        onClick={() => handleLetterClick(letter)}
                                        disabled={answer.length >= span}
                                        className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white font-bold text-lg font-mono hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:border-orange-300 dark:hover:border-orange-600 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {letter}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleDelete}
                            disabled={answer.length === 0}
                            className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ← Effacer
                        </button>
                        <button
                            onClick={handleValidate}
                            disabled={answer.length !== span}
                            className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Valider
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {answer.length} / {span} lettres saisies
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
                    <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                        <p>
                            Séquence :{" "}
                            <strong className="text-slate-700 dark:text-slate-200 font-mono tracking-widest">
                                {sequence.join(" – ")}
                            </strong>
                        </p>
                        {!lastCorrect && (
                            <p>
                                Votre réponse :{" "}
                                <strong className="text-red-500 font-mono tracking-widest">
                                    {answer.join(" – ")}
                                </strong>
                            </p>
                        )}
                    </div>
                    {lastCorrect && span < MAX_SPAN && (
                        <p className="text-xs text-slate-400">Empan suivant : {span + 1} lettres…</p>
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
                            <strong className="text-orange-500 dark:text-orange-300 text-base">
                                {maxSpanAchieved > 0 ? maxSpanAchieved : MIN_SPAN - 1} lettres
                            </strong>
                        </p>
                        <p>Réussites : <strong>{correctRounds} / {totalRounds}</strong></p>
                    </div>

                    {/* Détail des essais */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1 text-left max-h-40 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={`shrink-0 ${r.correct ? "text-green-500" : "text-red-500"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 shrink-0">
                                    Empan {r.span} :
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 font-mono tracking-widest">
                                    {r.sequence.join("-")}
                                </span>
                                {!r.correct && (
                                    <span className="text-red-400 font-mono tracking-widest shrink-0">
                                        → {r.answer.join("-")}
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

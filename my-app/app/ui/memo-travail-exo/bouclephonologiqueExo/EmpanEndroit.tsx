"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "presenting" | "recall" | "feedback" | "finished";

interface RoundResult {
    span: number;
    sequence: number[];
    answer: number[];
    correct: boolean;
}

const MIN_SPAN = 3;
const MAX_SPAN = 9;
const DIGIT_DISPLAY_MS = 900;
const INTER_DIGIT_MS = 300;

function generateSequence(length: number): number[] {
    const seq: number[] = [];
    let prev = -1;
    for (let i = 0; i < length; i++) {
        let d: number;
        do { d = Math.floor(Math.random() * 10); } while (d === prev);
        seq.push(d);
        prev = d;
    }
    return seq;
}

export default function EmpanEndroit({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [span, setSpan] = useState(MIN_SPAN);
    const [sequence, setSequence] = useState<number[]>([]);
    const [visibleIdx, setVisibleIdx] = useState(-1); // index du chiffre affiché
    const [answer, setAnswer] = useState<number[]>([]);
    const [results, setResults] = useState<RoundResult[]>([]);
    const [errorsAtSpan, setErrorsAtSpan] = useState(0);
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Séquence de présentation des chiffres
    const presentSequence = useCallback((seq: number[]) => {
        setPhase("presenting");
        setVisibleIdx(-1);
        setAnswer([]);

        let i = 0;
        const showNext = () => {
            if (i < seq.length) {
                setVisibleIdx(i);
                i++;
                timeoutRef.current = setTimeout(() => {
                    setVisibleIdx(-1); // masquer entre deux chiffres
                    timeoutRef.current = setTimeout(showNext, INTER_DIGIT_MS);
                }, DIGIT_DISPLAY_MS);
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

    // Clic sur un chiffre pendant le rappel
    const handleDigitClick = useCallback((digit: number) => {
        setAnswer(prev => {
            const next = [...prev, digit];
            return next;
        });
    }, []);

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
                exercice: "Empan de chiffres endroit",
                domaine: "memo-travail",
                score,
                empan: maxSpanReached,
            });
        }
    }, [patientId]);

    // Validation de la réponse
    const handleValidate = useCallback(() => {
        const correct = answer.length === sequence.length &&
            answer.every((d, i) => d === sequence[i]);

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
                }, 1500);
            } else {
                setTimeout(() => finishGame(updated, span), 1500);
            }
        } else {
            const newErrors = errorsAtSpan + 1;
            setErrorsAtSpan(newErrors);
            if (newErrors >= 2) {
                setTimeout(() => finishGame(updated, span), 1500);
            } else {
                setTimeout(() => startRound(span), 1500);
            }
        }
    }, [answer, sequence, span, errorsAtSpan, results, startRound, finishGame]);

    // Nettoyage des timeouts
    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    const currentDigit = visibleIdx >= 0 ? sequence[visibleIdx] : null;
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
                        Des chiffres vont s'afficher <strong>un par un</strong>.<br />
                        Mémorisez-les puis saisissez-les <strong>dans le même ordre</strong>.<br />
                        La séquence s'allonge à chaque bonne réponse.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Empan initial : {MIN_SPAN} chiffres · Maximum : {MAX_SPAN} chiffres
                    </p>
                    <button
                        onClick={startGame}
                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* --- Présentation des chiffres --- */}
            {phase === "presenting" && (
                <div className="flex flex-col items-center gap-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mémorisez la séquence… ({span} chiffres)
                    </p>
                    <div className="w-28 h-28 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 flex items-center justify-center">
                        {currentDigit !== null ? (
                            <span className="text-6xl font-bold text-indigo-600 dark:text-indigo-300">
                                {currentDigit}
                            </span>
                        ) : (
                            <span className="text-4xl text-slate-300 dark:text-slate-600">·</span>
                        )}
                    </div>
                    {/* Points de progression */}
                    <div className="flex gap-2">
                        {sequence.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                                    i < visibleIdx
                                        ? "bg-indigo-400 dark:bg-indigo-500"
                                        : i === visibleIdx
                                        ? "bg-indigo-600 dark:bg-indigo-300 scale-125"
                                        : "bg-slate-200 dark:bg-slate-700"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* --- Rappel (saisie) --- */}
            {phase === "recall" && (
                <div className="flex flex-col items-center gap-5 w-full max-w-xs">
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        Saisissez les chiffres dans l'ordre
                    </p>

                    {/* Affichage de la réponse en cours */}
                    <div className="flex gap-2 min-h-[3rem] items-center justify-center flex-wrap">
                        {answer.length === 0 ? (
                            <span className="text-slate-300 dark:text-slate-600 text-lg">—</span>
                        ) : (
                            answer.map((d, i) => (
                                <span
                                    key={i}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xl border border-indigo-200 dark:border-indigo-700"
                                >
                                    {d}
                                </span>
                            ))
                        )}
                    </div>

                    {/* Clavier numérique */}
                    <div className="grid grid-cols-3 gap-2 w-full">
                        {[1,2,3,4,5,6,7,8,9,null,0,null].map((d, i) => {
                            if (d === null) return <div key={i} />;
                            return (
                                <button
                                    key={i}
                                    onClick={() => answer.length < span && handleDigitClick(d)}
                                    disabled={answer.length >= span}
                                    className="h-12 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white font-bold text-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {d}
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
                            ← Effacer
                        </button>
                        <button
                            onClick={handleValidate}
                            disabled={answer.length !== span}
                            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Valider
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {answer.length} / {span} chiffres saisis
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
                        <p>Séquence : <strong className="text-slate-700 dark:text-slate-200">{sequence.join(" – ")}</strong></p>
                        {!lastCorrect && (
                            <p>Votre réponse : <strong className="text-red-500">{answer.join(" – ")}</strong></p>
                        )}
                    </div>
                    {lastCorrect && span < MAX_SPAN && (
                        <p className="text-xs text-slate-400">Empan suivant : {span + 1} chiffres…</p>
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
                            <strong className="text-indigo-600 dark:text-indigo-300 text-base">
                                {maxSpanAchieved > 0 ? maxSpanAchieved : MIN_SPAN - 1} chiffres
                            </strong>
                        </p>
                        <p>
                            Réussites : <strong>{correctRounds} / {totalRounds}</strong>
                        </p>
                    </div>

                    {/* Détail des essais */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1 text-left max-h-40 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={r.correct ? "text-green-500" : "text-red-500"}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                    Empan {r.span} :
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 font-mono">
                                    {r.sequence.join("-")}
                                </span>
                                {!r.correct && (
                                    <span className="text-red-400 font-mono">
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

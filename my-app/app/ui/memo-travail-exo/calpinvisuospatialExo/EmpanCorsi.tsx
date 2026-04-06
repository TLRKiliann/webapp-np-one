"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

// Positions classiques du test de Corsi (en %)
const BLOCKS = [
    { id: 0, x: 8,  y: 55 },
    { id: 1, x: 22, y: 15 },
    { id: 2, x: 42, y: 65 },
    { id: 3, x: 58, y: 8  },
    { id: 4, x: 28, y: 42 },
    { id: 5, x: 72, y: 48 },
    { id: 6, x: 12, y: 28 },
    { id: 7, x: 52, y: 30 },
    { id: 8, x: 78, y: 18 },
];

type Phase = "idle" | "showing" | "input" | "correct" | "wrong" | "finished";

export default function EmpanCorsi({ patientId }: { patientId: string | null }) {
    const [span, setSpan] = useState(2);
    const [sequence, setSequence] = useState<number[]>([]);
    const [userInput, setUserInput] = useState<number[]>([]);
    const [activeBlock, setActiveBlock] = useState<number | null>(null);
    const [phase, setPhase] = useState<Phase>("idle");
    const [score, setScore] = useState(0);
    const [errors, setErrors] = useState(0);
    const [record, setRecord] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const generateSequence = (length: number): number[] => {
        const seq: number[] = [];
        for (let i = 0; i < length; i++) {
            let next: number;
            do {
                next = Math.floor(Math.random() * BLOCKS.length);
            } while (seq[seq.length - 1] === next);
            seq.push(next);
        }
        return seq;
    };

    const startRound = useCallback((currentSpan: number) => {
        const seq = generateSequence(currentSpan);
        setSequence(seq);
        setUserInput([]);
        setPhase("showing");
    }, []);

    // Affichage de la séquence
    useEffect(() => {
        if (phase !== "showing" || sequence.length === 0) return;

        let i = 0;

        const showNext = () => {
            if (i >= sequence.length) {
                setActiveBlock(null);
                timerRef.current = setTimeout(() => setPhase("input"), 400);
                return;
            }
            setActiveBlock(sequence[i]);
            i++;
            timerRef.current = setTimeout(() => {
                setActiveBlock(null);
                timerRef.current = setTimeout(showNext, 350);
            }, 750);
        };

        timerRef.current = setTimeout(showNext, 600);

        return clearTimer;
    }, [phase, sequence]);

    const handleBlockClick = (id: number) => {
        if (phase !== "input") return;

        const newInput = [...userInput, id];
        setUserInput(newInput);

        const step = newInput.length - 1;

        if (newInput[step] !== sequence[step]) {
            const newErrors = errors + 1;
            setErrors(newErrors);
            setPhase("wrong");
            timerRef.current = setTimeout(() => {
                if (newErrors >= 3) {
                    setPhase("finished");
                    if (patientId) {
                        saveScore({ patientId, score, empan: record });
                    }
                } else {
                    const newSpan = Math.max(2, span - 1);
                    setSpan(newSpan);
                    setUserInput([]);
                    startRound(newSpan);
                }
            }, 1500);
            return;
        }

        if (newInput.length === sequence.length) {
            const newSpan = Math.min(9, span + 1);
            const newScore = score + span;
            setScore(newScore);
            setRecord(r => Math.max(r, span));
            setPhase("correct");
            timerRef.current = setTimeout(() => {
                setSpan(newSpan);
                startRound(newSpan);
            }, 1200);
        }
    };

    const reset = () => {
        clearTimer();
        setSpan(2);
        setSequence([]);
        setUserInput([]);
        setActiveBlock(null);
        setPhase("idle");
        setScore(0);
        setErrors(0);
    };

    const statusMessages: Record<Phase, { text: string; color: string }> = {
        idle:     { text: "Appuyez sur Démarrer pour commencer",                              color: "text-slate-500 dark:text-slate-400" },
        showing:  { text: "Mémorisez la séquence...",                                          color: "text-blue-600 dark:text-blue-400" },
        input:    { text: `Reproduisez la séquence (${userInput.length} / ${sequence.length})`, color: "text-indigo-600 dark:text-indigo-300" },
        correct:  { text: "Correct ! Niveau suivant...",                                        color: "text-green-600 dark:text-green-400" },
        wrong:    { text: "Erreur ! On recommence...",                                          color: "text-red-600 dark:text-red-400" },
        finished: { text: `Exercice terminé — Score final : ${score}`,                          color: "text-red-700 dark:text-red-400 font-bold" },
    };

    const status = statusMessages[phase];

    return (
        <div className="flex flex-col items-center h-full p-4 gap-4 select-none">

            {/* Stats */}
            <div className="flex gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Empan : <strong className="text-indigo-600 dark:text-indigo-300">{span}</strong></span>
                <span>Score : <strong className="text-green-600 dark:text-green-400">{score}</strong></span>
                <span>Erreurs : <strong className={errors >= 2 ? "text-red-600" : "text-slate-700 dark:text-slate-300"}>{errors}</strong> / 3</span>
                <span>Record : <strong className="text-yellow-600 dark:text-yellow-400">{record}</strong></span>
            </div>

            {/* Message d'état */}
            <div className={`h-7 text-sm font-semibold ${status.color}`}>
                {status.text}
            </div>

            {/* Zone de jeu */}
            <div className="relative flex-1 w-full max-w-xl rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                {BLOCKS.map((block) => {
                    const isActive = activeBlock === block.id;
                    const isClicked = phase === "input" && userInput.includes(block.id);

                    return (
                        <button
                            key={block.id}
                            onClick={() => handleBlockClick(block.id)}
                            disabled={phase !== "input"}
                            style={{
                                position: "absolute",
                                left: `${block.x}%`,
                                top: `${block.y}%`,
                                width: "56px",
                                height: "56px",
                            }}
                            className={`
                                rounded-lg border-2 transition-all duration-150 outline-none
                                ${isActive
                                    ? "bg-yellow-400 border-yellow-500 scale-115 shadow-lg"
                                    : isClicked
                                    ? "bg-blue-400 dark:bg-blue-500 border-blue-500 scale-105"
                                    : phase === "input"
                                    ? "bg-indigo-300 dark:bg-indigo-600 border-indigo-400 dark:border-indigo-500 hover:bg-indigo-400 dark:hover:bg-indigo-500 cursor-pointer"
                                    : "bg-indigo-200 dark:bg-indigo-700 border-indigo-300 dark:border-indigo-600 cursor-default"
                                }
                            `}
                        />
                    );
                })}
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pb-2">
                {phase === "finished" && (
                    <button
                        onClick={reset}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Recommencer
                    </button>
                )}
                {phase === "idle" && (
                    <button
                        onClick={() => startRound(span)}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                )}
            </div>

        </div>
    );
}

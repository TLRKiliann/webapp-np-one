"use client";

import { useState, useRef, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "result" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface LineData {
    x1: number;
    x2: number;
    y: number;
    midX: number;
    length: number;
}

interface Attempt {
    line: LineData;
    clickedX: number;
    error: number;
    bias: number; // négatif = gauche, positif = droite
}

const VW = 700;
const VH = 420;
const MARGIN = 50;

const DIFFICULTY_CONFIG: Record<Difficulty, { count: number; minLen: number; maxLen: number; empan: number }> = {
    facile:    { count: 5,  minLen: 220, maxLen: 380, empan: 3 },
    moyen:     { count: 8,  minLen: 160, maxLen: 500, empan: 5 },
    difficile: { count: 12, minLen: 100, maxLen: 580, empan: 8 },
};

function generateLine(index: number, total: number, minLen: number, maxLen: number): LineData {
    const length = minLen + Math.random() * (maxLen - minLen);
    const availableX = VW - 2 * MARGIN - length;
    const x1 = MARGIN + Math.random() * Math.max(0, availableX);
    const x2 = x1 + length;
    const yStep = (VH - 2 * MARGIN) / total;
    const y = MARGIN + yStep * index + yStep / 2;
    return { x1, x2, y, midX: (x1 + x2) / 2, length };
}

export default function BissectionDesLignes({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [lines, setLines] = useState<LineData[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [lastClickX, setLastClickX] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const startGame = useCallback((diff: Difficulty) => {
        const { count, minLen, maxLen } = DIFFICULTY_CONFIG[diff];
        const newLines = Array.from({ length: count }, (_, i) =>
            generateLine(i, count, minLen, maxLen)
        );
        setLines(newLines);
        setCurrentIdx(0);
        setAttempts([]);
        setLastClickX(null);
        setPhase("playing");
    }, []);

    const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (phase !== "playing") return;
        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const clickedX = ((e.clientX - rect.left) / rect.width) * VW;

        const line = lines[currentIdx];
        const bias = clickedX - line.midX;
        const error = Math.abs(bias);

        setLastClickX(clickedX);
        setAttempts(prev => [...prev, { line, clickedX, error, bias }]);
        setPhase("result");
    }, [phase, lines, currentIdx]);

    const handleNext = useCallback(() => {
        const nextIdx = currentIdx + 1;
        if (nextIdx >= lines.length) {
            const allAttempts = [...attempts];
            if (allAttempts.length > 0) {
                const avgError = allAttempts.reduce((s, a) => s + a.error, 0) / allAttempts.length;
                const maxPossibleError = 250;
                const score = Math.max(0, Math.round(100 * (1 - avgError / maxPossibleError)));
                if (patientId) {
                    saveScore({
                        patientId,
                        exercice: "Bissection de lignes",
                        domaine: "orientation-spatiale",
                        score,
                        empan: DIFFICULTY_CONFIG[difficulty].empan,
                    });
                }
            }
            setPhase("finished");
        } else {
            setCurrentIdx(nextIdx);
            setLastClickX(null);
            setPhase("playing");
        }
    }, [currentIdx, lines.length, attempts, patientId, difficulty]);

    const reset = () => {
        setPhase("idle");
        setLines([]);
        setCurrentIdx(0);
        setAttempts([]);
        setLastClickX(null);
    };

    const currentLine = lines[currentIdx];
    const avgError = attempts.length > 0
        ? attempts.reduce((s, a) => s + a.error, 0) / attempts.length
        : 0;
    const avgBias = attempts.length > 0
        ? attempts.reduce((s, a) => s + a.bias, 0) / attempts.length
        : 0;

    const biasLabel =
        avgBias > 10  ? `${Math.round(avgBias)}px vers la droite` :
        avgBias < -10 ? `${Math.round(Math.abs(avgBias))}px vers la gauche` :
        "centré";

    return (
        <div className="flex flex-col h-full p-4 gap-3 select-none">

            {/* Barre de stats */}
            {(phase === "playing" || phase === "result") && (
                <div className="flex gap-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span>
                        Ligne :{" "}
                        <strong className="text-indigo-600 dark:text-indigo-300">
                            {currentIdx + 1} / {lines.length}
                        </strong>
                    </span>
                    {attempts.length > 0 && (
                        <span>Erreur moy. : <strong>{Math.round(avgError)} px</strong></span>
                    )}
                    <span className="ml-auto capitalize text-slate-400">{difficulty}</span>
                </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center">

                {/* --- Écran d'accueil --- */}
                {phase === "idle" && (
                    <div className="text-center space-y-6 max-w-md">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Cliquez sur le <strong>milieu exact</strong> de chaque ligne horizontale.<br />
                            Essayez d'être aussi précis que possible, sans utiliser de règle.
                        </p>
                        <div className="flex gap-3 justify-center">
                            {(["facile", "moyen", "difficile"] as Difficulty[]).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 capitalize ${
                                        difficulty === d
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                                    }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Facile : 5 lignes · Moyen : 8 lignes · Difficile : 12 lignes
                        </p>
                        <button
                            onClick={() => startGame(difficulty)}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {/* --- Zone SVG (playing + result) --- */}
                {(phase === "playing" || phase === "result") && currentLine && (
                    <div className="w-full h-full flex flex-col gap-2">

                        {/* Légende feedback */}
                        {phase === "playing" && (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                                Cliquez sur le milieu de la ligne
                            </p>
                        )}
                        {phase === "result" && lastClickX !== null && (
                            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block w-3 h-0.5 bg-blue-500" style={{ height: 3 }} />
                                    <span className="text-slate-600 dark:text-slate-300">Votre réponse</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block w-3 bg-green-500" style={{ height: 3 }} />
                                    <span className="text-slate-600 dark:text-slate-300">Vrai milieu</span>
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                    Écart :{" "}
                                    <strong className={Math.abs(lastClickX - currentLine.midX) > 25 ? "text-red-500" : "text-green-600"}>
                                        {Math.round(Math.abs(lastClickX - currentLine.midX))} px
                                    </strong>
                                    {lastClickX - currentLine.midX > 8 && " · trop à droite"}
                                    {lastClickX - currentLine.midX < -8 && " · trop à gauche"}
                                    {Math.abs(lastClickX - currentLine.midX) <= 8 && " · parfait !"}
                                </span>
                            </div>
                        )}

                        <svg
                            ref={svgRef}
                            viewBox={`0 0 ${VW} ${VH}`}
                            className={`w-full flex-1 ${phase === "playing" ? "cursor-crosshair" : ""}`}
                            onClick={phase === "playing" ? handleSvgClick : undefined}
                        >
                            {/* Fond cliquable transparent */}
                            <rect x={0} y={0} width={VW} height={VH} fill="transparent" />

                            {/* Ligne horizontale */}
                            <line
                                x1={currentLine.x1}
                                y1={currentLine.y}
                                x2={currentLine.x2}
                                y2={currentLine.y}
                                stroke="#1e293b"
                                className="dark:stroke-slate-200"
                                strokeWidth={3}
                                strokeLinecap="round"
                            />
                            {/* Embouts verticaux */}
                            <line
                                x1={currentLine.x1} y1={currentLine.y - 12}
                                x2={currentLine.x1} y2={currentLine.y + 12}
                                stroke="#1e293b"
                                className="dark:stroke-slate-200"
                                strokeWidth={2.5}
                            />
                            <line
                                x1={currentLine.x2} y1={currentLine.y - 12}
                                x2={currentLine.x2} y2={currentLine.y + 12}
                                stroke="#1e293b"
                                className="dark:stroke-slate-200"
                                strokeWidth={2.5}
                            />

                            {/* Feedback après clic */}
                            {phase === "result" && lastClickX !== null && (
                                <>
                                    {/* Segment de distance */}
                                    <line
                                        x1={Math.min(lastClickX, currentLine.midX)}
                                        y1={currentLine.y}
                                        x2={Math.max(lastClickX, currentLine.midX)}
                                        y2={currentLine.y}
                                        stroke="#f97316"
                                        strokeWidth={2}
                                        opacity={0.55}
                                    />
                                    {/* Marqueur vrai milieu — vert */}
                                    <line
                                        x1={currentLine.midX} y1={currentLine.y - 20}
                                        x2={currentLine.midX} y2={currentLine.y + 20}
                                        stroke="#22c55e"
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                    />
                                    {/* Marqueur réponse — bleu tirets */}
                                    <line
                                        x1={lastClickX} y1={currentLine.y - 20}
                                        x2={lastClickX} y2={currentLine.y + 20}
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                        strokeDasharray="5,3"
                                    />
                                </>
                            )}
                        </svg>

                        {phase === "result" && (
                            <div className="flex justify-center pb-2">
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                                >
                                    {currentIdx + 1 >= lines.length ? "Voir les résultats" : "Ligne suivante →"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- Résultats finaux --- */}
                {phase === "finished" && (
                    <div className="text-center space-y-5 max-w-sm">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                            Exercice terminé !
                        </p>
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                            <p>
                                Erreur moyenne :{" "}
                                <strong className={avgError > 30 ? "text-red-500" : "text-green-600"}>
                                    {Math.round(avgError)} px
                                </strong>
                            </p>
                            <p>
                                Biais :{" "}
                                <strong className={Math.abs(avgBias) > 20 ? "text-amber-500" : "text-green-600"}>
                                    {biasLabel}
                                </strong>
                            </p>
                            <p className="text-slate-400 dark:text-slate-500 text-xs capitalize">
                                Niveau : <strong>{difficulty}</strong> · {lines.length} lignes
                            </p>
                        </div>

                        {Math.abs(avgBias) > 30 && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3 leading-relaxed">
                                Un biais latéralisé important peut être un indicateur
                                d'héminégligence spatiale à explorer cliniquement.
                            </p>
                        )}

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

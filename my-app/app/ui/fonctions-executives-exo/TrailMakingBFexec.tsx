"use client";

import { useState, useRef, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

const FULL_SEQUENCE = [
    "1","A","2","B","3","C","4","D","5","E",
    "6","F","7","G","8","H","9","I","10","J",
    "11","K","12","L","13",
];

const DIFFICULTY_LENGTHS: Record<Difficulty, number> = {
    facile: 9,
    moyen: 15,
    difficile: 25,
};

const VW = 700, VH = 430, R = 22;

function generatePositions(count: number) {
    const MIN_DIST = R * 2.9;
    const MARGIN = R + 10;
    const positions: { x: number; y: number }[] = [];
    let attempts = 0;
    while (positions.length < count && attempts < 30000) {
        attempts++;
        const x = MARGIN + Math.random() * (VW - 2 * MARGIN);
        const y = MARGIN + Math.random() * (VH - 2 * MARGIN);
        if (positions.every(p => Math.hypot(p.x - x, p.y - y) >= MIN_DIST)) {
            positions.push({ x, y });
        }
    }
    return positions;
}

type NodeData = { label: string; x: number; y: number };
type Line = { x1: number; y1: number; x2: number; y2: number };

export default function TrailMakingBFexec({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [nodes, setNodes] = useState<NodeData[]>([]);
    const [nextIdx, setNextIdx] = useState(0);
    const [lines, setLines] = useState<Line[]>([]);
    const [errors, setErrors] = useState(0);
    const [flashNode, setFlashNode] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef = useRef(0);
    const errorsRef = useRef(0);

    const startGame = useCallback((diff: Difficulty) => {
        const seq = FULL_SEQUENCE.slice(0, DIFFICULTY_LENGTHS[diff]);
        const positions = generatePositions(seq.length);
        const newNodes: NodeData[] = seq.map((label, i) => ({
            label,
            x: positions[i]?.x ?? 50 + (i % 5) * 120,
            y: positions[i]?.y ?? 50 + Math.floor(i / 5) * 100,
        }));
        // Shuffle display order so label order doesn't hint positions
        newNodes.sort(() => Math.random() - 0.5);
        setNodes(newNodes);
        setNextIdx(0);
        setLines([]);
        setErrors(0);
        errorsRef.current = 0;
        setElapsed(0);
        setFlashNode(null);
        setPhase("playing");
        startRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 500);
    }, []);

    const handleNodeClick = useCallback((label: string, allNodes: NodeData[], currentNextIdx: number, currentDiff: Difficulty) => {
        const seq = FULL_SEQUENCE.slice(0, DIFFICULTY_LENGTHS[currentDiff]);
        const expected = seq[currentNextIdx];

        if (label === expected) {
            const newNextIdx = currentNextIdx + 1;

            if (currentNextIdx > 0) {
                const prevLabel = seq[currentNextIdx - 1];
                const prevNode = allNodes.find(n => n.label === prevLabel)!;
                const currNode = allNodes.find(n => n.label === label)!;
                setLines(ls => [...ls, { x1: prevNode.x, y1: prevNode.y, x2: currNode.x, y2: currNode.y }]);
            }

            setNextIdx(newNextIdx);

            if (newNextIdx >= seq.length) {
                if (timerRef.current) clearInterval(timerRef.current);
                const finalTime = Math.floor((Date.now() - startRef.current) / 1000);
                setElapsed(finalTime);
                setPhase("finished");
                if (patientId) {
                    const score = Math.max(0, 1000 - finalTime * 3 - errorsRef.current * 50);
                    saveScore({
                        patientId,
                        exercice: "Trail Making B",
                        domaine: "fonctions-executives",
                        score,
                        empan: DIFFICULTY_LENGTHS[currentDiff],
                    });
                }
            }
        } else {
            errorsRef.current += 1;
            setErrors(errorsRef.current);
            setFlashNode(label);
            setTimeout(() => setFlashNode(null), 600);
        }
    }, [patientId]);

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("idle");
        setNodes([]);
        setNextIdx(0);
        setLines([]);
        setErrors(0);
        errorsRef.current = 0;
        setElapsed(0);
        setFlashNode(null);
    };

    const sequence = FULL_SEQUENCE.slice(0, DIFFICULTY_LENGTHS[difficulty]);
    const nextTarget = sequence[nextIdx];
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    return (
        <div className="flex flex-col h-full p-4 gap-3 select-none">

            {/* Stats */}
            <div className="flex gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Temps : <strong className="text-indigo-600 dark:text-indigo-300">{formatTime(elapsed)}</strong></span>
                <span>Erreurs : <strong className={errors >= 3 ? "text-red-500" : ""}>{errors}</strong></span>
                {phase === "playing" && (
                    <span>Prochain : <strong className="text-emerald-600 dark:text-green-400">{nextTarget}</strong></span>
                )}
                <span className="ml-auto text-slate-400 capitalize">{difficulty}</span>
            </div>

            {/* Zone principale */}
            <div className="flex-1 flex flex-col items-center justify-center">

                {phase === "idle" && (
                    <div className="text-center space-y-6 max-w-md">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Reliez les cercles en alternant chiffres et lettres dans l'ordre :<br />
                            <strong>1 → A → 2 → B → 3 → C…</strong><br />
                            Allez le plus vite possible en faisant le moins d'erreurs.
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
                            Facile : 9 nœuds · Moyen : 15 nœuds · Difficile : 25 nœuds
                        </p>
                        <button
                            onClick={() => startGame(difficulty)}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {phase === "playing" && (
                    <svg
                        viewBox={`0 0 ${VW} ${VH}`}
                        className="w-full h-full"
                    >
                        {/* Lignes tracées */}
                        {lines.map((l, i) => (
                            <line
                                key={i}
                                x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                                stroke="#6366f1"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                opacity={0.7}
                            />
                        ))}

                        {/* Nœuds */}
                        {nodes.map((node) => {
                            const seqIdx = sequence.indexOf(node.label);
                            const completed = seqIdx < nextIdx;
                            const isTarget = node.label === nextTarget;
                            const isError = node.label === flashNode;

                            let fill = "#f1f5f9";
                            let stroke = "#94a3b8";
                            let textFill = "#334155";
                            let strokeWidth = 1.5;

                            if (completed) {
                                fill = "#dcfce7"; stroke = "#22c55e"; textFill = "#166534";
                            } else if (isError) {
                                fill = "#fee2e2"; stroke = "#ef4444"; textFill = "#991b1b";
                            } else if (isTarget) {
                                fill = "#e0e7ff"; stroke = "#6366f1"; textFill = "#3730a3"; strokeWidth = 2.5;
                            }

                            return (
                                <g
                                    key={node.label}
                                    onClick={() => !completed && handleNodeClick(node.label, nodes, nextIdx, difficulty)}
                                    style={{ cursor: completed ? "default" : "pointer" }}
                                >
                                    <circle
                                        cx={node.x} cy={node.y} r={R}
                                        fill={fill}
                                        stroke={stroke}
                                        strokeWidth={strokeWidth}
                                    />
                                    <text
                                        x={node.x} y={node.y}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fontSize={node.label.length > 1 ? 11 : 14}
                                        fontWeight="600"
                                        fill={textFill}
                                        style={{ userSelect: "none", pointerEvents: "none" }}
                                    >
                                        {node.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                )}

                {phase === "finished" && (
                    <div className="text-center space-y-4">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>
                        <p className="text-slate-600 dark:text-slate-400">
                            Temps : <strong>{formatTime(elapsed)}</strong> — Erreurs : <strong>{errors}</strong>
                        </p>
                        <p className="text-slate-500 dark:text-slate-500 text-sm capitalize">
                            Niveau : <strong>{difficulty}</strong>
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

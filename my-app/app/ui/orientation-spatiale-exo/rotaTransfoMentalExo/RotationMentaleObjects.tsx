"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "playing" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type Angle      = 0 | 90 | 180 | 270;

type Cell = readonly [number, number]; // [row, col] in 0–3

// ─── Shape library — 8 distinct asymmetric shapes on a 4×4 grid ──────────────
// Each shape is verified to look different from all of its own rotations & mirror.

const SHAPES: Cell[][] = [
    // 0 — F-like
    [[0,0],[0,1],[0,2],[1,0],[1,1],[2,0],[3,0]],
    // 1 — Hook-right
    [[0,2],[1,2],[1,3],[2,1],[2,2],[3,1]],
    // 2 — S-staircase
    [[0,2],[0,3],[1,1],[1,2],[2,0],[2,1],[3,0]],
    // 3 — T-angled
    [[0,1],[0,2],[1,0],[1,1],[2,0],[3,0],[3,1]],
    // 4 — L-step
    [[0,0],[1,0],[2,0],[2,1],[3,1],[3,2]],
    // 5 — Corner-hook
    [[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[3,1]],
    // 6 — Z-bump
    [[0,1],[0,2],[1,0],[1,1],[2,0],[3,0],[3,1]],
    // 7 — Arrow-cross
    [[0,1],[1,0],[1,1],[1,2],[2,1],[3,1],[3,2]],
];

const DIFFICULTY_CONFIG: Record<Difficulty, {
    rounds: number;
    mirrorDistractors: number;
    empan: number;
}> = {
    facile:    { rounds: 8,  mirrorDistractors: 0, empan: 3 },
    moyen:     { rounds: 10, mirrorDistractors: 1, empan: 5 },
    difficile: { rounds: 12, mirrorDistractors: 2, empan: 7 },
};

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function rotateCells(cells: Cell[], angle: Angle): Cell[] {
    return cells.map(([r, c]) => {
        switch (angle) {
            case  90: return [c, 3 - r] as const;
            case 180: return [3 - r, 3 - c] as const;
            case 270: return [3 - c, r] as const;
            default:  return [r, c] as const;
        }
    });
}

function mirrorCells(cells: Cell[]): Cell[] {
    return cells.map(([r, c]) => [r, 3 - c] as const);
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Question types ───────────────────────────────────────────────────────────

interface Choice {
    cells: Cell[];
    isCorrect: boolean;
}

interface Question {
    refCells: Cell[];
    choices: Choice[];
    shapeIdx: number;
    correctAngle: Angle;
}

function buildQuestion(diff: Difficulty, lastShapeIdx: number): Question {
    // Pick shape (avoid repeating)
    let shapeIdx: number;
    do { shapeIdx = Math.floor(Math.random() * SHAPES.length); }
    while (SHAPES.length > 1 && shapeIdx === lastShapeIdx);

    const shape = SHAPES[shapeIdx];
    const { mirrorDistractors } = DIFFICULTY_CONFIG[diff];

    // Correct answer angle (never 0 — would be identical to reference)
    const angles: Angle[] = [90, 180, 270];
    const correctAngle = angles[Math.floor(Math.random() * angles.length)];
    const correctCells = rotateCells(shape, correctAngle);

    // Build distractors
    const distractors: Cell[][] = [];

    // Mirror distractors (same shape mirrored + random rotation)
    const mirroredBase = mirrorCells(shape);
    const usedMirrorAngles = new Set<number>();
    for (let m = 0; m < mirrorDistractors; m++) {
        let mAngle: Angle;
        do { mAngle = ([0, 90, 180, 270] as Angle[])[Math.floor(Math.random() * 4)]; }
        while (usedMirrorAngles.has(mAngle));
        usedMirrorAngles.add(mAngle);
        distractors.push(rotateCells(mirroredBase, mAngle));
    }

    // Different-shape distractors
    const otherIdxs = shuffle(SHAPES.map((_, i) => i).filter(i => i !== shapeIdx));
    for (let i = 0; i < 3 - mirrorDistractors; i++) {
        const otherShape = SHAPES[otherIdxs[i]];
        const rAngle = ([0, 90, 180, 270] as Angle[])[Math.floor(Math.random() * 4)];
        distractors.push(rotateCells(otherShape, rAngle));
    }

    const choices: Choice[] = shuffle([
        { cells: correctCells, isCorrect: true },
        ...distractors.map(cells => ({ cells, isCorrect: false })),
    ]);

    return { refCells: shape, choices, shapeIdx, correctAngle };
}

// ─── SVG shape renderer ───────────────────────────────────────────────────────

// ViewBox 0 0 100 100. Grid 4×4 cells (22px each, 2px gap), offset from (3,3).
const CELL = 22;
const GAP  = 2;
const OFF  = 3;

function cellToXY(r: number, c: number) {
    return { x: OFF + c * (CELL + GAP), y: OFF + r * (CELL + GAP) };
}

interface ShapeProps {
    cells: Cell[];
    fill: string;
    size?: number; // rendered size in px
}

function ShapeSVG({ cells, fill, size = 96 }: ShapeProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            aria-hidden="true"
        >
            {cells.map(([r, c], i) => {
                const { x, y } = cellToXY(r, c);
                return (
                    <rect key={i} x={x} y={y} width={CELL} height={CELL} rx={3} fill={fill} />
                );
            })}
        </svg>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RotationMentaleObjects({ patientId }: { patientId: string | null }) {
    const [phase,       setPhase]       = useState<Phase>("idle");
    const [difficulty,  setDifficulty]  = useState<Difficulty>("facile");
    const [question,    setQuestion]    = useState<Question | null>(null);
    const [lastShapeIdx, setLastShapeIdx] = useState(-1);
    const [selected,    setSelected]    = useState<number | null>(null); // choice index
    const [roundIdx,    setRoundIdx]    = useState(0);
    const [results,     setResults]     = useState<boolean[]>([]);
    const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cfg       = DIFFICULTY_CONFIG[difficulty];
    const totalRounds = cfg.rounds;
    const isCorrect   = selected !== null && question?.choices[selected].isCorrect;

    useEffect(() => () => { if (feedbackRef.current) clearTimeout(feedbackRef.current); }, []);

    // ── Start ──────────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        const q = buildQuestion(diff, -1);
        setQuestion(q);
        setLastShapeIdx(q.shapeIdx);
        setRoundIdx(0);
        setResults([]);
        setSelected(null);
        setPhase("playing");
    }, []);

    // ── Answer ─────────────────────────────────────────────────────────────────

    const handleChoice = useCallback((idx: number) => {
        if (phase !== "playing" || !question) return;
        setSelected(idx);
        const correct = question.choices[idx].isCorrect;
        const updated = [...results, correct];
        setResults(updated);
        setPhase("feedback");

        const next = roundIdx + 1;
        feedbackRef.current = setTimeout(() => {
            if (next >= totalRounds) {
                const score = Math.round(updated.filter(Boolean).length / updated.length * 100);
                if (patientId) {
                    saveScore({
                        patientId,
                        exercice: "Rotation mentale d'objets",
                        domaine: "orientation-spatiale",
                        score,
                        empan: cfg.empan,
                    });
                }
                setPhase("finished");
            } else {
                const q = buildQuestion(difficulty, question.shapeIdx);
                setQuestion(q);
                setLastShapeIdx(q.shapeIdx);
                setRoundIdx(next);
                setSelected(null);
                setPhase("playing");
            }
        }, 1200);
    }, [phase, question, results, roundIdx, totalRounds, difficulty, patientId, cfg.empan]);

    const reset = () => {
        if (feedbackRef.current) clearTimeout(feedbackRef.current);
        setPhase("idle");
        setQuestion(null);
        setLastShapeIdx(-1);
        setRoundIdx(0);
        setResults([]);
        setSelected(null);
    };

    // ── Helpers ────────────────────────────────────────────────────────────────

    const correctCount = results.filter(Boolean).length;
    const finalScore   = results.length > 0
        ? Math.round(correctCount / results.length * 100)
        : 0;

    function choiceBg(idx: number): string {
        if (phase !== "feedback" || !question) {
            return "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer";
        }
        const ch = question.choices[idx];
        if (ch.isCorrect)  return "bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-500";
        if (idx === selected) return "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500";
        return "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-50";
    }

    function choiceFill(idx: number): string {
        if (phase !== "feedback" || !question) return "#94a3b8"; // slate-400
        const ch = question.choices[idx];
        if (ch.isCorrect)  return "#22c55e"; // green-500
        if (idx === selected) return "#f87171"; // red-400
        return "#cbd5e1"; // slate-300
    }

    const angleLabel: Record<Angle, string> = {
        0: "0°", 90: "90° ↻", 180: "180°", 270: "270° ↻",
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full p-4 select-none items-center justify-center overflow-y-auto gap-4">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center gap-6 max-w-md text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Une <strong>forme de référence</strong> est présentée à gauche.<br />
                        Parmi les 4 propositions, identifiez celle qui est
                        la <strong>même forme</strong> — simplement <strong>tournée</strong> (90°, 180° ou 270°).<br />
                        Attention : certaines propositions sont le <em>miroir</em> de la forme, pas une rotation.
                    </p>
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
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Facile&nbsp;: 8 questions, distracteurs différents ·
                        Moyen&nbsp;: 10 questions, 1 miroir ·
                        Difficile&nbsp;: 12 questions, 2 miroirs
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Playing + Feedback ── */}
            {(phase === "playing" || phase === "feedback") && question && (
                <div className="flex flex-col items-center gap-4 w-full max-w-lg">

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 w-full">
                        <div className="flex gap-1 flex-1">
                            {Array.from({ length: totalRounds }, (_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    i < roundIdx
                                        ? results[i] ? "bg-green-400 dark:bg-green-500" : "bg-red-400 dark:bg-red-500"
                                        : i === roundIdx ? "bg-primary-400" : "bg-slate-200 dark:bg-slate-700"
                                }`} />
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">
                            {roundIdx + 1}&nbsp;/&nbsp;{totalRounds}
                        </span>
                    </div>

                    {/* Question layout */}
                    <div className="flex items-center gap-6 w-full justify-center">

                        {/* Reference shape */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Référence
                            </p>
                            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-300 dark:border-primary-600 rounded-xl">
                                <ShapeSVG
                                    cells={question.refCells}
                                    fill="#3b82f6"
                                    size={112}
                                />
                            </div>
                            {phase === "feedback" && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Réponse&nbsp;: {angleLabel[question.correctAngle]}
                                </p>
                            )}
                        </div>

                        {/* Arrow separator */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <span className="text-2xl text-slate-300 dark:text-slate-600">→</span>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Laquelle est la même forme tournée ?
                            </p>
                        </div>

                        {/* 2×2 choice grid */}
                        <div className="grid grid-cols-2 gap-2 shrink-0">
                            {question.choices.map((ch, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleChoice(idx)}
                                    disabled={phase === "feedback"}
                                    className={`p-2 rounded-xl border-2 transition-colors duration-150 flex items-center justify-center ${choiceBg(idx)}`}
                                >
                                    <div className="relative">
                                        <ShapeSVG
                                            cells={ch.cells}
                                            fill={choiceFill(idx)}
                                            size={88}
                                        />
                                        {phase === "feedback" && ch.isCorrect && (
                                            <span className="absolute -top-1 -right-1 text-sm text-green-500">✓</span>
                                        )}
                                        {phase === "feedback" && idx === selected && !ch.isCorrect && (
                                            <span className="absolute -top-1 -right-1 text-sm text-red-400">✗</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inline feedback message */}
                    {phase === "feedback" && (
                        <p className={`text-sm font-semibold ${isCorrect ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                            {isCorrect ? "Bonne réponse !" : "Incorrect — la bonne réponse est en vert"}
                        </p>
                    )}

                    {/* Live score */}
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {correctCount}&nbsp;bonne{correctCount !== 1 ? "s" : ""} réponse{correctCount !== 1 ? "s" : ""}
                        {" "}sur {roundIdx + (phase === "feedback" ? 1 : 0)} essai{roundIdx > 0 ? "s" : ""}
                    </p>
                </div>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center gap-5 max-w-sm text-center w-full">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                    {/* Circle indicators */}
                    <div className="flex gap-1.5 flex-wrap justify-center">
                        {results.map((ok, i) => (
                            <div
                                key={i}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                    ok ? "bg-green-500" : "bg-red-400"
                                }`}
                            >
                                {ok ? "✓" : "✗"}
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Score :{" "}
                        <strong className={
                            finalScore >= 80 ? "text-green-600 dark:text-green-400" :
                            finalScore >= 50 ? "text-amber-500" : "text-red-500"
                        }>
                            {correctCount}&nbsp;/&nbsp;{results.length}
                        </strong>
                        {" "}— <strong>{finalScore}&nbsp;%</strong>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                        Niveau&nbsp;: <strong>{difficulty}</strong>
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
    );
}

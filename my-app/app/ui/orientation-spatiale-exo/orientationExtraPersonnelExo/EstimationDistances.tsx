"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type Choice = "A" | "B";

interface Point { x: number; y: number; }

interface Round {
    pathA: Point[];
    pathB: Point[];
    longer: Choice;      // which is actually longer
    chosen: Choice | null;
    correct: boolean;
    lenA: number;
    lenB: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, {
    rounds: number;
    minRatio: number;
    maxRatio: number;
    minSteps: number;
    maxSteps: number;
    empan: number;
}> = {
    facile:    { rounds: 8,  minRatio: 1.6, maxRatio: 2.8, minSteps: 3, maxSteps: 5,  empan: 3 },
    moyen:     { rounds: 10, minRatio: 1.2, maxRatio: 1.7, minSteps: 4, maxSteps: 7,  empan: 5 },
    difficile: { rounds: 12, minRatio: 1.05, maxRatio: 1.35, minSteps: 5, maxSteps: 9, empan: 8 },
};

// SVG canvas dimensions (logical px)
const W = 220;
const H = 160;
const STEP = 20; // grid step size

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function generatePath(minSteps: number, maxSteps: number): Point[] {
    const steps = minSteps + Math.floor(Math.random() * (maxSteps - minSteps + 1));
    const cols = Math.floor(W / STEP);
    const rows = Math.floor(H / STEP);
    const dirs = [
        { dx: STEP, dy: 0 }, { dx: -STEP, dy: 0 },
        { dx: 0, dy: STEP }, { dx: 0, dy: -STEP },
    ];
    const used = new Set<string>();
    const startX = (1 + Math.floor(Math.random() * (cols - 2))) * STEP;
    const startY = (1 + Math.floor(Math.random() * (rows - 2))) * STEP;
    const path: Point[] = [{ x: startX, y: startY }];
    used.add(`${startX},${startY}`);

    for (let s = 0; s < steps; s++) {
        const cur = path[path.length - 1];
        const shuffled = [...dirs].sort(() => Math.random() - 0.5);
        let moved = false;
        for (const d of shuffled) {
            const nx = cur.x + d.dx;
            const ny = cur.y + d.dy;
            if (nx < STEP || nx > W - STEP || ny < STEP || ny > H - STEP) continue;
            if (used.has(`${nx},${ny}`)) continue;
            path.push({ x: nx, y: ny });
            used.add(`${nx},${ny}`);
            moved = true;
            break;
        }
        if (!moved) break;
    }
    return path;
}

function pathLength(pts: Point[]): number {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
        len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    return len;
}

function polylinePoints(pts: Point[]): string {
    return pts.map(p => `${p.x},${p.y}`).join(" ");
}

function generateRound(cfg: typeof DIFFICULTY_CONFIG[Difficulty]): Omit<Round, "chosen" | "correct"> {
    let pathA: Point[], pathB: Point[], lenA: number, lenB: number;
    let attempts = 0;
    do {
        pathA = generatePath(cfg.minSteps, cfg.maxSteps);
        pathB = generatePath(cfg.minSteps, cfg.maxSteps);
        lenA = pathLength(pathA);
        lenB = pathLength(pathB);
        const ratio = lenA > lenB ? lenA / lenB : lenB / lenA;
        if (ratio >= cfg.minRatio && ratio <= cfg.maxRatio) break;
        attempts++;
    } while (attempts < 200);

    const longer: Choice = lenA >= lenB ? "A" : "B";
    return { pathA, pathB, longer, lenA, lenB };
}

export default function EstimationDistances({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [rounds, setRounds] = useState<Round[]>([]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
    const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cfg = DIFFICULTY_CONFIG[difficulty];

    const clearFeedback = () => {
        if (feedbackTimerRef.current) { clearTimeout(feedbackTimerRef.current); feedbackTimerRef.current = null; }
    };

    useEffect(() => () => clearFeedback(), []);

    const startGame = useCallback((diff: Difficulty) => {
        const dcfg = DIFFICULTY_CONFIG[diff];
        const newRounds: Round[] = Array.from({ length: dcfg.rounds }, () => {
            const r = generateRound(dcfg);
            return { ...r, chosen: null, correct: false };
        });
        setRounds(newRounds);
        setRoundIdx(0);
        setLastCorrect(null);
        setPhase("playing");
    }, []);

    const handleChoice = useCallback((choice: Choice) => {
        if (phase !== "playing") return;

        setRounds(prev => {
            const updated = [...prev];
            const cur = updated[roundIdx];
            const correct = choice === cur.longer;
            updated[roundIdx] = { ...cur, chosen: choice, correct };
            return updated;
        });
        const correct = choice === rounds[roundIdx].longer;
        setLastCorrect(correct);
        setPhase("feedback");

        const next = roundIdx + 1;
        feedbackTimerRef.current = setTimeout(() => {
            if (next >= cfg.rounds) {
                setPhase("finished");
            } else {
                setRoundIdx(next);
                setLastCorrect(null);
                setPhase("playing");
            }
        }, 1000);
    }, [phase, rounds, roundIdx, cfg.rounds]);

    useEffect(() => {
        if (phase !== "finished") return;
        const all = rounds.filter(r => r.chosen !== null);
        if (all.length === 0 || !patientId) return;
        const correctCount = all.filter(r => r.correct).length;
        const score = Math.round((correctCount / all.length) * 100);
        saveScore({
            patientId,
            exercice: "Estimation de distances",
            domaine: "orientation-spatiale",
            score,
            empan: DIFFICULTY_CONFIG[difficulty].empan,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const reset = () => {
        clearFeedback();
        setPhase("idle");
        setRounds([]);
        setRoundIdx(0);
        setLastCorrect(null);
    };

    const currentRound = rounds[roundIdx];
    const correctCount = rounds.filter(r => r.correct).length;
    const answeredCount = rounds.filter(r => r.chosen !== null).length;

    // ── Render helpers ────────────────────────────────────────────────────────

    function PathSVG({
        points, color, isChosen, isLonger, showResult,
    }: {
        points: Point[];
        color: string;
        isChosen: boolean;
        isLonger: boolean;
        showResult: boolean;
    }) {
        let stroke = color;
        if (showResult) {
            stroke = isLonger ? "#22c55e" : "#ef4444";
        }
        const dotR = 4;
        return (
            <svg
                width={W}
                height={H}
                viewBox={`0 0 ${W} ${H}`}
                className="block"
            >
                {/* Grid dots */}
                {Array.from({ length: Math.floor(W / STEP) + 1 }, (_, ci) =>
                    Array.from({ length: Math.floor(H / STEP) + 1 }, (_, ri) => (
                        <circle
                            key={`${ci}-${ri}`}
                            cx={ci * STEP}
                            cy={ri * STEP}
                            r={1}
                            fill="#cbd5e1"
                            opacity={0.5}
                        />
                    ))
                )}
                {/* Path line */}
                {points.length > 1 && (
                    <polyline
                        points={polylinePoints(points)}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.9}
                    />
                )}
                {/* Start dot */}
                <circle cx={points[0].x} cy={points[0].y} r={dotR} fill={stroke} />
                {/* End marker */}
                <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r={dotR + 1}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={2}
                />
                <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r={dotR - 1}
                    fill={stroke}
                />
            </svg>
        );
    }

    function PathCard({
        label, points, color, isChosen, isLonger, showResult, onClick, disabled,
    }: {
        label: string;
        points: Point[];
        color: string;
        isChosen: boolean;
        isLonger: boolean;
        showResult: boolean;
        onClick: () => void;
        disabled: boolean;
    }) {
        let ring = "ring-2 ring-transparent";
        let bg = "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80";
        if (isChosen && !showResult) ring = "ring-2 ring-primary-400";
        if (showResult) {
            if (isLonger) {
                ring = "ring-2 ring-green-500";
                bg = "bg-green-50 dark:bg-green-900/20";
            } else {
                ring = "ring-2 ring-red-300";
                bg = "bg-red-50 dark:bg-red-900/10";
            }
        }

        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-600 transition-all duration-200 ${bg} ${ring} ${disabled ? "cursor-default" : "cursor-pointer active:scale-95"}`}
            >
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    Trajet {label}
                </span>
                <div className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                    <PathSVG
                        points={points}
                        color={color}
                        isChosen={isChosen}
                        isLonger={isLonger}
                        showResult={showResult}
                    />
                </div>
                {showResult && (
                    <span className={`text-xs font-semibold ${isLonger ? "text-green-600 dark:text-green-400" : "text-red-400 dark:text-red-400"}`}>
                        {isLonger ? "✓ Plus long" : "✗ Plus court"}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 gap-4 select-none items-center justify-center overflow-y-auto">

            {/* ── Écran d'accueil ── */}
            {phase === "idle" && (
                <div className="text-center space-y-5 max-w-sm">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Deux trajets s'affichent côte à côte.<br />
                        Cliquez sur celui qui vous semble <strong>le plus long</strong>.<br />
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            Le point plein est le départ, le cercle l'arrivée.
                        </span>
                    </p>
                    <div className="flex gap-3 justify-center">
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
                        Facile : 8 essais, différence marquée · Moyen : 10 essais · Difficile : 12 essais, différence subtile
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Jeu + Feedback ── */}
            {(phase === "playing" || phase === "feedback") && currentRound && (
                <div className="flex flex-col items-center gap-3 w-full">

                    {/* Progression */}
                    <div className="flex items-center justify-between w-full max-w-xs text-xs text-slate-500 dark:text-slate-400">
                        <span>{roundIdx + 1} / {cfg.rounds}</span>
                        <span>{correctCount} ✓</span>
                    </div>

                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Quel trajet est le plus long ?
                    </p>

                    {/* Feedback inline */}
                    {phase === "feedback" && (
                        <p className={`text-sm font-semibold ${lastCorrect ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                            {lastCorrect ? "Bonne réponse !" : "Incorrect — le trajet correct est en vert"}
                        </p>
                    )}

                    {/* Deux cartes */}
                    <div className="flex gap-4 flex-wrap justify-center">
                        {(["A", "B"] as Choice[]).map(label => {
                            const pts = label === "A" ? currentRound.pathA : currentRound.pathB;
                            const color = label === "A" ? "#3b82f6" : "#f97316";
                            const isChosen = currentRound.chosen === label;
                            const isLonger = currentRound.longer === label;
                            return (
                                <PathCard
                                    key={label}
                                    label={label}
                                    points={pts}
                                    color={color}
                                    isChosen={isChosen}
                                    isLonger={isLonger}
                                    showResult={phase === "feedback"}
                                    onClick={() => handleChoice(label)}
                                    disabled={phase === "feedback"}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Résultats ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 text-center">
                        <p>
                            Réussite :{" "}
                            <strong className={
                                correctCount === answeredCount ? "text-green-600" :
                                correctCount / answeredCount >= 0.7 ? "text-amber-500" : "text-red-500"
                            }>
                                {correctCount} / {answeredCount}
                            </strong>
                            {" "}— Score :{" "}
                            <strong>{Math.round((correctCount / answeredCount) * 100)} %</strong>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                            Niveau : <strong>{difficulty}</strong>
                        </p>
                    </div>

                    {/* Détail des essais */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1 w-full max-h-48 overflow-y-auto">
                        {rounds.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={`shrink-0 font-bold ${r.correct ? "text-green-500" : "text-red-400"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                    Essai {i + 1}
                                </span>
                                <span className="text-slate-400">
                                    Réponse : <strong>{r.chosen}</strong>
                                </span>
                                <span className="ml-auto text-slate-400">
                                    Correct : <strong>{r.longer}</strong>
                                </span>
                            </div>
                        ))}
                    </div>

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

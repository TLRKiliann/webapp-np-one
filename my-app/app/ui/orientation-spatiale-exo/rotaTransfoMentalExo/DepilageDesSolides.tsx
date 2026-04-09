"use client";

import { useState, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase      = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type FaceId     = "top" | "front" | "right" | "back" | "left" | "bottom";

// A cube question: 6 face colors + 4 net options (index of correct net)
interface CubeQuestion {
    faces: Record<FaceId, string>;   // CSS color per face
    nets: NetOption[];               // 4 candidate nets
    correctIdx: number;              // 0-3
}

// A net is a cross-shaped unfolding: 6 cells each with a color and position
interface NetCell {
    col: number;   // grid column (0-based)
    row: number;   // grid row (0-based)
    color: string;
    faceId: FaceId;
}
interface NetOption { cells: NetCell[] }

// ── Colors ────────────────────────────────────────────────────────────────────

const FACE_COLORS: Record<FaceId, string> = {
    top:    "#f87171",   // red-400
    front:  "#60a5fa",   // blue-400
    right:  "#4ade80",   // green-400
    back:   "#fbbf24",   // amber-400
    left:   "#c084fc",   // purple-400
    bottom: "#fb923c",   // orange-400
};

// ── Net layouts ───────────────────────────────────────────────────────────────
// Standard cross net (one of many valid nets for a cube):
//        [top]          row=0, col=1
// [left][front][right]  row=1, col=0,1,2
//        [bottom]       row=2, col=1
//        [back]         row=3, col=1

function standardNet(faces: Record<FaceId, string>): NetOption {
    return {
        cells: [
            { col: 1, row: 0, color: faces.top,    faceId: "top"    },
            { col: 0, row: 1, color: faces.left,   faceId: "left"   },
            { col: 1, row: 1, color: faces.front,  faceId: "front"  },
            { col: 2, row: 1, color: faces.right,  faceId: "right"  },
            { col: 1, row: 2, color: faces.bottom, faceId: "bottom" },
            { col: 1, row: 3, color: faces.back,   faceId: "back"   },
        ]
    };
}

// Alt net: T-shape variant
//        [top]           row=0, col=1
// [left][front][right]   row=1, col=0,1,2
//        [bottom]        row=2, col=1
//  [back]                row=2, col=0  ← moved
function altNet1(faces: Record<FaceId, string>): NetOption {
    return {
        cells: [
            { col: 1, row: 0, color: faces.top,    faceId: "top"    },
            { col: 0, row: 1, color: faces.left,   faceId: "left"   },
            { col: 1, row: 1, color: faces.front,  faceId: "front"  },
            { col: 2, row: 1, color: faces.right,  faceId: "right"  },
            { col: 1, row: 2, color: faces.bottom, faceId: "bottom" },
            { col: 0, row: 2, color: faces.back,   faceId: "back"   },
        ]
    };
}

// Alt net 2: L-shape variant
// [top][front][right][back]  row=0, col=0..3
//      [bottom]               row=1, col=1
//      [left]                 row=2, col=1
function altNet2(faces: Record<FaceId, string>): NetOption {
    return {
        cells: [
            { col: 0, row: 0, color: faces.top,    faceId: "top"    },
            { col: 1, row: 0, color: faces.front,  faceId: "front"  },
            { col: 2, row: 0, color: faces.right,  faceId: "right"  },
            { col: 3, row: 0, color: faces.back,   faceId: "back"   },
            { col: 1, row: 1, color: faces.bottom, faceId: "bottom" },
            { col: 1, row: 2, color: faces.left,   faceId: "left"   },
        ]
    };
}

// ── Distractors: swap two face colors to make an invalid net ──────────────────

function swapColors(net: NetOption, a: FaceId, b: FaceId): NetOption {
    return {
        cells: net.cells.map(c => {
            if (c.faceId === a) return { ...c, color: net.cells.find(x => x.faceId === b)!.color, faceId: b };
            if (c.faceId === b) return { ...c, color: net.cells.find(x => x.faceId === a)!.color, faceId: a };
            return c;
        })
    };
}

// ── Question bank ─────────────────────────────────────────────────────────────

function buildQuestion(faces: Record<FaceId, string>, correctNetFn: (f: Record<FaceId, string>) => NetOption): CubeQuestion {
    const correct = correctNetFn(faces);

    // Build 3 distractors by swapping pairs of faces
    const swapPairs: [FaceId, FaceId][] = [
        ["top", "front"],
        ["right", "left"],
        ["top", "bottom"],
    ];
    const distractors = swapPairs.map(([a, b]) => swapColors(correct, a, b));

    // Shuffle: place correct net at a random index
    const correctIdx = Math.floor(Math.random() * 4);
    const nets: NetOption[] = [];
    let di = 0;
    for (let i = 0; i < 4; i++) {
        if (i === correctIdx) nets.push(correct);
        else nets.push(distractors[di++]);
    }
    return { faces, nets, correctIdx };
}

const FACE_SETS: Record<Difficulty, Record<FaceId, string>[]> = {
    facile: [
        FACE_COLORS, // standard colors
        { top: "#f87171", front: "#60a5fa", right: "#fbbf24", back: "#4ade80", left: "#c084fc", bottom: "#fb923c" },
        { top: "#38bdf8", front: "#f472b6", right: "#a3e635", back: "#fb923c", left: "#818cf8", bottom: "#fde68a" },
    ],
    moyen: [
        { top: "#f87171", front: "#60a5fa", right: "#4ade80", back: "#fbbf24", left: "#c084fc", bottom: "#fb923c" },
        { top: "#818cf8", front: "#f472b6", right: "#34d399", back: "#fbbf24", left: "#f87171", bottom: "#60a5fa" },
        { top: "#fde68a", front: "#a3e635", right: "#38bdf8", back: "#f87171", left: "#c084fc", bottom: "#fb923c" },
        { top: "#60a5fa", front: "#f87171", right: "#fbbf24", back: "#4ade80", left: "#fb923c", bottom: "#c084fc" },
    ],
    difficile: [
        { top: "#f87171", front: "#60a5fa", right: "#4ade80", back: "#fbbf24", left: "#c084fc", bottom: "#fb923c" },
        { top: "#34d399", front: "#f472b6", right: "#60a5fa", back: "#fb923c", left: "#fbbf24", bottom: "#818cf8" },
        { top: "#fde68a", front: "#a3e635", right: "#f87171", back: "#38bdf8", left: "#c084fc", bottom: "#fb923c" },
        { top: "#60a5fa", front: "#f87171", right: "#c084fc", back: "#4ade80", left: "#fb923c", bottom: "#fbbf24" },
        { top: "#818cf8", front: "#34d399", right: "#fbbf24", back: "#f87171", left: "#f472b6", bottom: "#60a5fa" },
    ],
};

const NET_FNS = [standardNet, altNet1, altNet2];

function generateQuestions(diff: Difficulty): CubeQuestion[] {
    const sets = FACE_SETS[diff];
    return sets.map((faces, i) => buildQuestion(faces, NET_FNS[i % NET_FNS.length]));
}

const TOTAL_PER_DIFF: Record<Difficulty, number> = { facile: 3, moyen: 4, difficile: 5 };

// ── SVG: isometric cube ───────────────────────────────────────────────────────

function IsoCube({ faces }: { faces: Record<FaceId, string> }) {
    // Isometric projection constants
    const cx = 80, cy = 90;
    const s  = 44; // half-width of cube face in iso

    // Top face
    const topPts = `${cx},${cy - s} ${cx + s * 1.73},${cy - s / 2} ${cx},${cy} ${cx - s * 1.73},${cy - s / 2}`;
    // Front-left face
    const leftPts = `${cx - s * 1.73},${cy - s / 2} ${cx},${cy} ${cx},${cy + s} ${cx - s * 1.73},${cy + s / 2}`;
    // Front-right face
    const rightPts = `${cx + s * 1.73},${cy - s / 2} ${cx},${cy} ${cx},${cy + s} ${cx + s * 1.73},${cy + s / 2}`;

    return (
        <svg viewBox="0 0 160 160" width="160" height="160">
            <polygon points={topPts}   fill={faces.top}   stroke="#1e293b" strokeWidth="1.5" />
            <polygon points={leftPts}  fill={faces.front} stroke="#1e293b" strokeWidth="1.5" />
            <polygon points={rightPts} fill={faces.right} stroke="#1e293b" strokeWidth="1.5" />
        </svg>
    );
}

// ── SVG: flat net ─────────────────────────────────────────────────────────────

function NetGrid({ net, highlight, onClick, selected }: {
    net: NetOption;
    highlight?: "correct" | "wrong";
    onClick?: () => void;
    selected?: boolean;
}) {
    const cell = 36;
    const pad  = 4;
    const maxC = Math.max(...net.cells.map(c => c.col)) + 1;
    const maxR = Math.max(...net.cells.map(c => c.row)) + 1;
    const w = maxC * cell + pad * 2;
    const h = maxR * cell + pad * 2;

    const borderCls = highlight === "correct"
        ? "ring-4 ring-emerald-400"
        : highlight === "wrong"
        ? "ring-4 ring-red-400"
        : selected
        ? "ring-2 ring-indigo-400"
        : "ring-1 ring-slate-200 dark:ring-slate-600 hover:ring-2 hover:ring-indigo-300";

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer rounded-xl bg-white dark:bg-slate-800 p-2 transition-all duration-150 ${borderCls}`}
        >
            <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
                {net.cells.map((c, i) => (
                    <rect
                        key={i}
                        x={pad + c.col * cell + 1}
                        y={pad + c.row * cell + 1}
                        width={cell - 2}
                        height={cell - 2}
                        fill={c.color}
                        rx="3"
                        stroke="#1e293b"
                        strokeWidth="1"
                    />
                ))}
            </svg>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DepilageDesSolides({ patientId }: { patientId: string | null }) {
    const [phase, setPhase]           = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [questions, setQuestions]   = useState<CubeQuestion[]>([]);
    const [qIdx, setQIdx]             = useState(0);
    const [selected, setSelected]     = useState<number | null>(null);
    const [feedback, setFeedback]     = useState<"correct" | "wrong" | null>(null);
    const [score, setScore]           = useState(0);
    const [errors, setErrors]         = useState(0);
    const [elapsed, setElapsed]       = useState(0);
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef  = useRef(0);
    const scoreRef  = useRef(0);
    const errorsRef = useRef(0);
    const lockRef   = useRef(false);

    const startGame = (diff: Difficulty) => {
        const qs = generateQuestions(diff);
        scoreRef.current  = 0;
        errorsRef.current = 0;
        lockRef.current   = false;
        setQuestions(qs);
        setQIdx(0);
        setSelected(null);
        setFeedback(null);
        setScore(0);
        setErrors(0);
        setElapsed(0);
        setPhase("playing");
        startRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 500);
    };

    const endGame = (finalScore: number, finalErrors: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalTime = Math.floor((Date.now() - startRef.current) / 1000);
        setElapsed(finalTime);
        setPhase("finished");
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Dépliage de solides",
                domaine:  "orientation-spatiale",
                score:    Math.max(0, finalScore * 100 - finalErrors * 20 - Math.floor(finalTime / 10) * 5),
                empan:    TOTAL_PER_DIFF[difficulty],
            });
        }
    };

    const handleChoice = (netIdx: number) => {
        if (lockRef.current || feedback !== null) return;
        lockRef.current = true;
        const q = questions[qIdx];
        setSelected(netIdx);

        if (netIdx === q.correctIdx) {
            scoreRef.current++;
            setScore(scoreRef.current);
            setFeedback("correct");
        } else {
            errorsRef.current++;
            setErrors(errorsRef.current);
            setFeedback("wrong");
        }

        setTimeout(() => {
            setFeedback(null);
            setSelected(null);
            lockRef.current = false;
            const next = qIdx + 1;
            if (next >= questions.length) {
                endGame(scoreRef.current, errorsRef.current);
            } else {
                setQIdx(next);
            }
        }, 1400);
    };

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        lockRef.current = false;
        setPhase("idle");
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    const total = questions.length;
    const q     = questions[qIdx];

    return (
        <div className="flex flex-col h-full p-4 gap-3 select-none">

            {/* ── Stats bar ─────────────────────────────────────────────────── */}
            <div className="flex gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>Temps : <strong className="text-indigo-600 dark:text-indigo-300">{formatTime(elapsed)}</strong></span>
                <span>Corrects : <strong className="text-emerald-600 dark:text-emerald-400">{score}</strong></span>
                <span>Erreurs : <strong className={errors >= 3 ? "text-red-500" : ""}>{errors}</strong></span>
                {phase === "playing" && (
                    <span className="ml-auto text-slate-400">{qIdx + 1} / {total}</span>
                )}
            </div>

            {/* ── Main zone ─────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">

                {/* ══ Idle ════════════════════════════════════════════════════ */}
                {phase === "idle" && (
                    <div className="text-center space-y-5 max-w-md">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Un cube est affiché avec ses faces colorées.<br />
                            Parmi les 4 patrons proposés, identifiez celui qui correspond
                            exactement au cube — en tenant compte de la position de chaque couleur.
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
                            Facile : {TOTAL_PER_DIFF.facile} questions · Moyen : {TOTAL_PER_DIFF.moyen} · Difficile : {TOTAL_PER_DIFF.difficile}
                        </p>
                        <button
                            onClick={() => startGame(difficulty)}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {/* ══ Playing ════════════════════════════════════════════════ */}
                {phase === "playing" && q && (
                    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Quel patron correspond à ce cube ?
                        </p>

                        {/* Cube display */}
                        <div className="flex flex-col items-center gap-1">
                            <IsoCube faces={q.faces} />
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Vue de dessus + 2 faces visibles
                            </p>
                        </div>

                        {/* 4 net options */}
                        <div className="grid grid-cols-2 gap-4">
                            {q.nets.map((net, i) => {
                                const hi = feedback !== null && i === q.correctIdx
                                    ? "correct"
                                    : feedback === "wrong" && i === selected
                                    ? "wrong"
                                    : undefined;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                            {["A", "B", "C", "D"][i]}
                                        </span>
                                        <NetGrid
                                            net={net}
                                            highlight={hi}
                                            selected={selected === i && feedback === null}
                                            onClick={() => handleChoice(i)}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Feedback */}
                        <div className="h-6 flex items-center justify-center">
                            {feedback === "correct" && (
                                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Correct !</p>
                            )}
                            {feedback === "wrong" && (
                                <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                                    Incorrect — la bonne réponse est surlignée en vert
                                </p>
                            )}
                        </div>

                        <button
                            onClick={reset}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline transition-colors"
                        >
                            Réinitialiser
                        </button>
                    </div>
                )}

                {/* ══ Finished ═══════════════════════════════════════════════ */}
                {phase === "finished" && (
                    <div className="text-center space-y-4 max-w-sm">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-left bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 dark:text-slate-400">Réponses correctes</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{score} / {total}</span>
                            <span className="text-slate-500 dark:text-slate-400">Erreurs</span>
                            <span className="font-bold text-red-500">{errors}</span>
                            <span className="text-slate-500 dark:text-slate-400">Temps</span>
                            <span className="font-bold">{formatTime(elapsed)}</span>
                            <span className="text-slate-500 dark:text-slate-400">Niveau</span>
                            <span className="font-bold capitalize">{difficulty}</span>
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
        </div>
    );
}

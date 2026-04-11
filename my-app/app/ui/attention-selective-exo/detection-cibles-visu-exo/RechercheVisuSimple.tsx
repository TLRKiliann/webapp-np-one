"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase           = "idle" | "playing" | "finished";
type Difficulty      = "facile" | "moyen" | "difficile";
type ShapeType       = "circle" | "square" | "triangle" | "diamond" | "star";
type ColorType       = "red" | "blue" | "green" | "yellow" | "purple" | "orange";
type TargetAttr      = "color" | "shape";

interface GridItem {
    id: number;
    shape: ShapeType;
    color: ColorType;
    isTarget: boolean;
    clicked: boolean;
}

// ─── Color & shape helpers ────────────────────────────────────────────────────

const COLOR_HEX: Record<ColorType, string> = {
    red:    "#ef4444",
    blue:   "#3b82f6",
    green:  "#22c55e",
    yellow: "#eab308",
    purple: "#a855f7",
    orange: "#f97316",
};

const COLOR_FR: Record<ColorType, string> = {
    red:    "rouges",
    blue:   "bleus",
    green:  "verts",
    yellow: "jaunes",
    purple: "violets",
    orange: "oranges",
};

const SHAPE_FR: Record<ShapeType, string> = {
    circle:   "cercles",
    square:   "carrés",
    triangle: "triangles",
    diamond:  "losanges",
    star:     "étoiles",
};

const ALL_COLORS: ColorType[] = ["red", "blue", "green", "yellow", "purple", "orange"];
const ALL_SHAPES: ShapeType[] = ["circle", "square", "triangle", "diamond", "star"];

function ShapeIcon({ shape, color, size }: { shape: ShapeType; color: ColorType; size: number }) {
    const fill = COLOR_HEX[color];
    const s = size;
    switch (shape) {
        case "circle":
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill={fill} />
                </svg>
            );
        case "square":
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <rect x="10" y="10" width="80" height="80" rx="6" fill={fill} />
                </svg>
            );
        case "triangle":
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <polygon points="50,8 94,92 6,92" fill={fill} />
                </svg>
            );
        case "diamond":
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <polygon points="50,6 94,50 50,94 6,50" fill={fill} />
                </svg>
            );
        case "star":
            return (
                <svg width={s} height={s} viewBox="0 0 100 100">
                    <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={fill} />
                </svg>
            );
    }
}

// ─── Difficulty config ────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG: Record<Difficulty, {
    cols: number;
    rows: number;
    targetRatio: number;
    timeSec: number;
    cellPx: number;
    empan: number;
    attrType: TargetAttr;   // "color" = facile, "shape" = difficile, random for moyen
}> = {
    facile: {
        cols: 5,  rows: 6,  targetRatio: 0.25, timeSec: 90, cellPx: 64, empan: 3,
        attrType: "color",
    },
    moyen: {
        cols: 7,  rows: 8,  targetRatio: 0.20, timeSec: 60, cellPx: 52, empan: 5,
        attrType: "color",   // overridden randomly at build time
    },
    difficile: {
        cols: 9,  rows: 9,  targetRatio: 0.15, timeSec: 45, cellPx: 42, empan: 7,
        attrType: "shape",
    },
};

function rand<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Grid builder ─────────────────────────────────────────────────────────────

interface BuildResult {
    grid: GridItem[];
    attrType: TargetAttr;
    targetColor: ColorType | null;
    targetShape: ShapeType | null;
}

function buildGrid(diff: Difficulty): BuildResult {
    const cfg   = DIFFICULTY_CONFIG[diff];
    const total = cfg.cols * cfg.rows;
    const targetCount = Math.round(total * cfg.targetRatio);

    // For moyen, randomly pick color or shape
    const attrType: TargetAttr =
        diff === "moyen" ? (Math.random() < 0.5 ? "color" : "shape") : cfg.attrType;

    let targetColor: ColorType | null = null;
    let targetShape: ShapeType | null = null;

    const items: Array<{ shape: ShapeType; color: ColorType; isTarget: boolean }> = [];

    if (attrType === "color") {
        targetColor = rand(ALL_COLORS);
        const otherColors = ALL_COLORS.filter(c => c !== targetColor);

        // Targets: any shape, target color
        for (let i = 0; i < targetCount; i++) {
            items.push({ shape: rand(ALL_SHAPES), color: targetColor!, isTarget: true });
        }
        // Distractors: any shape, any other color
        for (let i = targetCount; i < total; i++) {
            items.push({ shape: rand(ALL_SHAPES), color: rand(otherColors), isTarget: false });
        }
    } else {
        targetShape = rand(ALL_SHAPES);
        const otherShapes = ALL_SHAPES.filter(s => s !== targetShape);

        // Targets: target shape, any color
        for (let i = 0; i < targetCount; i++) {
            items.push({ shape: targetShape!, color: rand(ALL_COLORS), isTarget: true });
        }
        // Distractors: any other shape, any color
        for (let i = targetCount; i < total; i++) {
            items.push({ shape: rand(otherShapes), color: rand(ALL_COLORS), isTarget: false });
        }
    }

    // Shuffle
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    return {
        grid: items.map((it, id) => ({ ...it, id, clicked: false })),
        attrType,
        targetColor,
        targetShape,
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RechercheVisuSimple({ patientId }: { patientId: string | null }) {
    const [phase,        setPhase]        = useState<Phase>("idle");
    const [difficulty,   setDifficulty]   = useState<Difficulty>("facile");
    const [grid,         setGrid]         = useState<GridItem[]>([]);
    const [attrType,     setAttrType]     = useState<TargetAttr>("color");
    const [targetColor,  setTargetColor]  = useState<ColorType | null>(null);
    const [targetShape,  setTargetShape]  = useState<ShapeType | null>(null);
    const [timeLeft,     setTimeLeft]     = useState(0);
    const [elapsed,      setElapsed]      = useState(0);
    const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAt = useRef<number>(0);

    const cfg = DIFFICULTY_CONFIG[difficulty];

    // ── Timer ──────────────────────────────────────────────────────────────────

    const stopTimer = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    useEffect(() => {
        if (phase !== "playing") return;
        stopTimer();
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    useEffect(() => {
        if (phase === "playing" && timeLeft === 0) {
            stopTimer();
            finishGame();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, phase]);

    useEffect(() => () => stopTimer(), []);

    // ── Start ──────────────────────────────────────────────────────────────────

    const startGame = useCallback((diff: Difficulty) => {
        const result = buildGrid(diff);
        setGrid(result.grid);
        setAttrType(result.attrType);
        setTargetColor(result.targetColor);
        setTargetShape(result.targetShape);
        setTimeLeft(DIFFICULTY_CONFIG[diff].timeSec);
        setElapsed(0);
        startedAt.current = Date.now();
        setPhase("playing");
    }, []);

    // ── Click cell ─────────────────────────────────────────────────────────────

    const handleClick = useCallback((id: number) => {
        if (phase !== "playing") return;
        setGrid(prev => prev.map(item =>
            item.id === id && !item.clicked ? { ...item, clicked: true } : item
        ));
    }, [phase]);

    // ── Finish ─────────────────────────────────────────────────────────────────

    const finishGame = useCallback(() => {
        stopTimer();
        const secs = Math.round((Date.now() - startedAt.current) / 1000);
        setElapsed(secs);
        setPhase("finished");
    }, []);

    // Save score after finishing
    useEffect(() => {
        if (phase !== "finished" || grid.length === 0) return;
        const targets      = grid.filter(i => i.isTarget);
        const hits         = targets.filter(i => i.clicked).length;
        const falseAlarms  = grid.filter(i => !i.isTarget && i.clicked).length;
        const totalTargets = targets.length;
        const raw          = ((hits - falseAlarms) / totalTargets) * 100;
        const score        = Math.max(0, Math.round(raw));
        if (patientId) {
            saveScore({
                patientId,
                exercice: "Recherche visuelle simple",
                domaine: "attention-selective",
                score,
                empan: DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const reset = () => {
        stopTimer();
        setPhase("idle");
        setGrid([]);
        setTargetColor(null);
        setTargetShape(null);
        setTimeLeft(0);
    };

    // ── Computed stats ─────────────────────────────────────────────────────────

    const totalTargets = grid.filter(i => i.isTarget).length;
    const hits         = grid.filter(i => i.isTarget && i.clicked).length;
    const misses       = totalTargets - hits;
    const falseAlarms  = grid.filter(i => !i.isTarget && i.clicked).length;
    const score        = Math.max(0, Math.round(((hits - falseAlarms) / (totalTargets || 1)) * 100));
    const timerPct     = (timeLeft / cfg.timeSec) * 100;

    // Target label shown in header
    const targetLabel =
        attrType === "color" && targetColor
            ? `éléments ${COLOR_FR[targetColor]}`
            : targetShape
            ? SHAPE_FR[targetShape]
            : "";

    // Target preview icon (for color: any shape; for shape: target shape in neutral gray)
    const previewColor: ColorType = targetColor ?? "blue";
    const previewShape: ShapeType = targetShape ?? "circle";

    // ── Cell appearance ────────────────────────────────────────────────────────

    function cellClass(item: GridItem): string {
        const base = "flex items-center justify-center rounded select-none transition-colors duration-100 ";
        if (phase === "playing") {
            if (item.clicked) return base + "bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500 cursor-default opacity-60";
            return base + "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400 cursor-pointer active:scale-95";
        }
        // finished
        if (item.isTarget && item.clicked)  return base + "bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500";
        if (item.isTarget && !item.clicked) return base + "bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-400";
        if (!item.isTarget && item.clicked) return base + "bg-red-100 dark:bg-red-900/40 ring-2 ring-red-400";
        return base + "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-60";
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Idle ── */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 text-center">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-md">
                        Une grille de formes colorées s'affiche. Une <strong>cible unique</strong> est définie
                        par <strong>un seul attribut</strong> (couleur <em>ou</em> forme).<br />
                        Cliquez sur <strong>tous les éléments</strong> correspondant à cet attribut
                        avant la fin du temps imparti.<br />
                        <span className="text-xs text-slate-400">Ne cliquez pas les autres formes !</span>
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
                        Facile&nbsp;: 30 items, couleur cible, 90&nbsp;s&nbsp;·
                        Moyen&nbsp;: 56 items, couleur ou forme, 60&nbsp;s&nbsp;·
                        Difficile&nbsp;: 81 items, forme cible, 45&nbsp;s
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Playing ── */}
            {phase === "playing" && (
                <>
                    {/* Sticky header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 gap-4">
                        {/* Target */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
                                Cible&nbsp;:
                            </span>
                            <div className="flex items-center gap-2">
                                <ShapeIcon shape={previewShape} color={previewColor} size={32} />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                                    {attrType === "color"
                                        ? `tous les ${targetLabel}`
                                        : `tous les ${targetLabel}`
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Progress hint */}
                        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                            Trouvées&nbsp;: {hits}&nbsp;/ {totalTargets}
                        </span>

                        {/* Timer */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                        timerPct > 50 ? "bg-green-400"
                                        : timerPct > 20 ? "bg-amber-400"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${timerPct}%` }}
                                />
                            </div>
                            <span className={`text-lg font-bold tabular-nums w-10 text-right ${
                                timeLeft <= 10 ? "text-red-500" : "text-slate-700 dark:text-slate-200"
                            }`}>
                                {timeLeft}s
                            </span>
                        </div>

                        {/* Finish button */}
                        <button
                            onClick={finishGame}
                            className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150 shrink-0"
                        >
                            Terminer
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-3">
                        <div
                            className="grid gap-2 mx-auto"
                            style={{
                                gridTemplateColumns: `repeat(${cfg.cols}, ${cfg.cellPx}px)`,
                                width: `${cfg.cols * (cfg.cellPx + 8)}px`,
                            }}
                        >
                            {grid.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleClick(item.id)}
                                    disabled={item.clicked}
                                    className={cellClass(item)}
                                    style={{ width: cfg.cellPx, height: cfg.cellPx }}
                                >
                                    <ShapeIcon shape={item.shape} color={item.color} size={cfg.cellPx - 12} />
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ── Finished ── */}
            {phase === "finished" && (
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Stats header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <ShapeIcon shape={previewShape} color={previewColor} size={28} />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                                {targetLabel}
                            </span>
                        </div>
                        <div className="flex gap-4 text-sm flex-wrap">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                                ✓ Trouvées&nbsp;: {hits}/{totalTargets}
                            </span>
                            <span className="text-amber-500 font-medium">
                                ◌ Manquées&nbsp;: {misses}
                            </span>
                            <span className="text-red-400 font-medium">
                                ✗ Erreurs&nbsp;: {falseAlarms}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                ⏱ {elapsed}s
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-lg font-bold ${
                                score >= 80 ? "text-green-600 dark:text-green-400"
                                : score >= 50 ? "text-amber-500"
                                : "text-red-500"
                            }`}>
                                {score}&nbsp;%
                            </span>
                            <button
                                onClick={reset}
                                className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150"
                            >
                                Recommencer
                            </button>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 px-4 py-1.5 text-xs border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-green-500 inline-block"/>&nbsp;Trouvée ✓
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-amber-400 inline-block"/>&nbsp;Manquée
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-red-400 inline-block"/>&nbsp;Erreur (non-cible)
                        </span>
                    </div>

                    {/* Result grid */}
                    <div className="flex-1 overflow-y-auto p-3">
                        <div
                            className="grid gap-2 mx-auto"
                            style={{
                                gridTemplateColumns: `repeat(${cfg.cols}, ${cfg.cellPx}px)`,
                                width: `${cfg.cols * (cfg.cellPx + 8)}px`,
                            }}
                        >
                            {grid.map(item => (
                                <div
                                    key={item.id}
                                    className={cellClass(item)}
                                    style={{ width: cfg.cellPx, height: cfg.cellPx }}
                                >
                                    <ShapeIcon shape={item.shape} color={item.color} size={cfg.cellPx - 12} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

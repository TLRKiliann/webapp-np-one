"use client";

import { useState, useRef, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "playing" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type ShapeKind = "star" | "circle" | "triangle" | "diamond" | "cross";

interface ShapeItem {
    id: number;
    x: number;
    y: number;
    isTarget: boolean;
    kind: ShapeKind;
    clicked: boolean;
}

const VW = 720;
const VH = 400;
const ITEM_R = 18;
const MIN_DIST = ITEM_R * 2.8;
const MARGIN = ITEM_R + 8;

const DIFFICULTY_CONFIG: Record<Difficulty, { total: number; targets: number; empan: number }> = {
    facile:    { total: 30,  targets: 8,  empan: 3 },
    moyen:     { total: 55,  targets: 14, empan: 5 },
    difficile: { total: 80,  targets: 20, empan: 8 },
};

const DISTRACTORS: ShapeKind[] = ["circle", "triangle", "diamond", "cross"];

function starPath(cx: number, cy: number, r: number): string {
    const outer = r;
    const inner = r * 0.42;
    const points: string[] = [];
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? outer : inner;
        points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
    }
    return `M ${points.join(" L ")} Z`;
}

function generateItems(total: number, targets: number): ShapeItem[] {
    const positions: { x: number; y: number }[] = [];
    let attempts = 0;
    while (positions.length < total && attempts < 50000) {
        attempts++;
        const x = MARGIN + Math.random() * (VW - 2 * MARGIN);
        const y = MARGIN + Math.random() * (VH - 2 * MARGIN);
        if (positions.every(p => Math.hypot(p.x - x, p.y - y) >= MIN_DIST)) {
            positions.push({ x, y });
        }
    }

    return positions.map((pos, i) => ({
        id: i,
        x: pos.x,
        y: pos.y,
        isTarget: i < targets,
        kind: i < targets ? "star" : DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)],
        clicked: false,
    })).sort(() => Math.random() - 0.5);
}

function ShapeRenderer({ item }: { item: ShapeItem }) {
    const { x, y, kind, isTarget, clicked } = item;
    const r = ITEM_R - 2;

    let fill = "#e2e8f0";
    let stroke = "#94a3b8";
    let strokeWidth = 1.5;

    if (clicked && isTarget) {
        fill = "#bbf7d0"; stroke = "#16a34a"; strokeWidth = 2.5;
    } else if (clicked && !isTarget) {
        fill = "#fee2e2"; stroke = "#ef4444"; strokeWidth = 2.5;
    }

    if (kind === "star") {
        return (
            <path
                d={starPath(x, y, r)}
                fill={clicked ? fill : "#fde68a"}
                stroke={clicked ? stroke : "#d97706"}
                strokeWidth={strokeWidth}
            />
        );
    }
    if (kind === "circle") {
        return <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    }
    if (kind === "triangle") {
        const h = r * Math.sqrt(3);
        const pts = `${x},${y - r * 1.1} ${x - r},${y + h * 0.55} ${x + r},${y + h * 0.55}`;
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    }
    if (kind === "diamond") {
        const pts = `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`;
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
    }
    // cross
    const t = r * 0.35;
    return (
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth}>
            <rect x={x - t} y={y - r} width={t * 2} height={r * 2} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            <rect x={x - r} y={y - t} width={r * 2} height={t * 2} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </g>
    );
}

export default function BarrageDesCibles({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [items, setItems] = useState<ShapeItem[]>([]);
    const [elapsed, setElapsed] = useState(0);
    const [falsePositives, setFalsePositives] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef = useRef(0);
    const fpRef = useRef(0);

    const targetCount = DIFFICULTY_CONFIG[difficulty].targets;

    const startGame = useCallback((diff: Difficulty) => {
        const { total, targets } = DIFFICULTY_CONFIG[diff];
        const newItems = generateItems(total, targets);
        setItems(newItems);
        setElapsed(0);
        setFalsePositives(0);
        fpRef.current = 0;
        setPhase("playing");
        startRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 500);
    }, []);

    const handleItemClick = useCallback((id: number) => {
        const item = items.find(it => it.id === id);
        if (!item || item.clicked) return;

        if (!item.isTarget) {
            fpRef.current += 1;
            setFalsePositives(fpRef.current);
        }

        const updatedItems = items.map(it =>
            it.id === id ? { ...it, clicked: true } : it
        );
        setItems(updatedItems);

        const allTargetsFound = updatedItems
            .filter(it => it.isTarget)
            .every(it => it.clicked);

        if (allTargetsFound) {
            if (timerRef.current) clearInterval(timerRef.current);
            const finalTime = Math.floor((Date.now() - startRef.current) / 1000);
            setElapsed(finalTime);
            setPhase("finished");
            if (patientId) {
                const found = updatedItems.filter(it => it.isTarget && it.clicked).length;
                const score = Math.max(0, Math.round(
                    (found / DIFFICULTY_CONFIG[difficulty].targets) * 100
                    - fpRef.current * 5
                    - Math.max(0, finalTime - 60) * 0.3
                ));
                saveScore({
                    patientId,
                    exercice: "Barrage de cibles",
                    domaine: "orientation-spatiale",
                    score,
                    empan: DIFFICULTY_CONFIG[difficulty].empan,
                });
            }
        }
    }, [items, patientId, difficulty]);

    const handleFinish = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalTime = Math.floor((Date.now() - startRef.current) / 1000);
        setElapsed(finalTime);
        setPhase("finished");

        const found = items.filter(it => it.isTarget && it.clicked).length;
        if (patientId) {
            const score = Math.max(0, Math.round(
                (found / DIFFICULTY_CONFIG[difficulty].targets) * 100
                - fpRef.current * 5
                - Math.max(0, finalTime - 60) * 0.3
            ));
            saveScore({
                patientId,
                exercice: "Barrage de cibles",
                domaine: "orientation-spatiale",
                score,
                empan: DIFFICULTY_CONFIG[difficulty].empan,
            });
        }
    }, [items, patientId, difficulty]);

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("idle");
        setItems([]);
        setElapsed(0);
        setFalsePositives(0);
        fpRef.current = 0;
    };

    const found = items.filter(it => it.isTarget && it.clicked).length;
    const missed = items.filter(it => it.isTarget && !it.clicked).length;

    // Analyse spatiale (tiers gauche / centre / droite)
    const thirdW = VW / 3;
    const missedLeft   = items.filter(it => it.isTarget && !it.clicked && it.x < thirdW).length;
    const missedCenter = items.filter(it => it.isTarget && !it.clicked && it.x >= thirdW && it.x < thirdW * 2).length;
    const missedRight  = items.filter(it => it.isTarget && !it.clicked && it.x >= thirdW * 2).length;

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    return (
        <div className="flex flex-col h-full p-4 gap-3 select-none">

            {/* Barre de stats */}
            {phase === "playing" && (
                <div className="flex gap-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span>Temps : <strong className="text-indigo-600 dark:text-indigo-300">{formatTime(elapsed)}</strong></span>
                    <span>Trouvées : <strong className="text-green-600 dark:text-green-400">{found} / {targetCount}</strong></span>
                    {falsePositives > 0 && (
                        <span>Erreurs : <strong className="text-red-500">{falsePositives}</strong></span>
                    )}
                    <span className="ml-auto capitalize text-slate-400">{difficulty}</span>
                </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center">

                {/* --- Écran d'accueil --- */}
                {phase === "idle" && (
                    <div className="text-center space-y-6 max-w-md">
                        <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <svg viewBox="0 0 40 40" width={32} height={32}>
                                <path d={starPath(20, 20, 14)} fill="#fde68a" stroke="#d97706" strokeWidth={1.5} />
                            </svg>
                            <span>= cible à trouver</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Cliquez sur toutes les <strong>étoiles</strong> en ignorant les autres formes.<br />
                            Explorez la feuille de façon systématique, de gauche à droite.
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
                            Facile : 8 cibles / 30 items · Moyen : 14 / 55 · Difficile : 20 / 80
                        </p>
                        <button
                            onClick={() => startGame(difficulty)}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                            Démarrer
                        </button>
                    </div>
                )}

                {/* --- Zone de jeu SVG --- */}
                {phase === "playing" && (
                    <div className="w-full h-full flex flex-col gap-2">
                        <svg
                            viewBox={`0 0 ${VW} ${VH}`}
                            className="w-full flex-1"
                        >
                            {items.map(item => (
                                <g
                                    key={item.id}
                                    onClick={() => !item.clicked && handleItemClick(item.id)}
                                    style={{ cursor: item.clicked ? "default" : "pointer" }}
                                >
                                    <ShapeRenderer item={item} />
                                    {item.clicked && item.isTarget && (
                                        <line
                                            x1={item.x - ITEM_R + 4} y1={item.y - ITEM_R + 4}
                                            x2={item.x + ITEM_R - 4} y2={item.y + ITEM_R - 4}
                                            stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round"
                                        />
                                    )}
                                    {item.clicked && !item.isTarget && (
                                        <>
                                            <line
                                                x1={item.x - 8} y1={item.y - 8}
                                                x2={item.x + 8} y2={item.y + 8}
                                                stroke="#ef4444" strokeWidth={2} strokeLinecap="round"
                                            />
                                            <line
                                                x1={item.x + 8} y1={item.y - 8}
                                                x2={item.x - 8} y2={item.y + 8}
                                                stroke="#ef4444" strokeWidth={2} strokeLinecap="round"
                                            />
                                        </>
                                    )}
                                </g>
                            ))}
                        </svg>
                        <div className="flex justify-center pb-2">
                            <button
                                onClick={handleFinish}
                                className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-sm rounded-lg font-medium transition-colors duration-200"
                            >
                                Terminer
                            </button>
                        </div>
                    </div>
                )}

                {/* --- Résultats --- */}
                {phase === "finished" && (
                    <div className="text-center space-y-5 max-w-sm">
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                            Exercice terminé !
                        </p>
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
                            <p>Temps : <strong>{formatTime(elapsed)}</strong></p>
                            <p>
                                Cibles trouvées :{" "}
                                <strong className={missed > 0 ? "text-amber-500" : "text-green-600"}>
                                    {found} / {targetCount}
                                </strong>
                            </p>
                            {falsePositives > 0 && (
                                <p>Fausses alarmes : <strong className="text-red-500">{falsePositives}</strong></p>
                            )}
                        </div>

                        {missed > 0 && (
                            <div className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 space-y-1.5">
                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                    Cibles manquées par zone
                                </p>
                                <div className="flex justify-around text-xs text-slate-600 dark:text-slate-400">
                                    <span>
                                        Gauche :{" "}
                                        <strong className={missedLeft > 0 ? "text-red-500" : "text-green-600"}>
                                            {missedLeft}
                                        </strong>
                                    </span>
                                    <span>
                                        Centre :{" "}
                                        <strong className={missedCenter > 0 ? "text-amber-500" : "text-green-600"}>
                                            {missedCenter}
                                        </strong>
                                    </span>
                                    <span>
                                        Droite :{" "}
                                        <strong className={missedRight > 0 ? "text-red-500" : "text-green-600"}>
                                            {missedRight}
                                        </strong>
                                    </span>
                                </div>
                                {(missedLeft > missedRight + 1 || missedRight > missedLeft + 1) && (
                                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-2 leading-relaxed mt-1">
                                        Asymétrie latérale détectée — peut indiquer une héminégligence
                                        {missedLeft > missedRight ? " gauche" : " droite"}.
                                    </p>
                                )}
                            </div>
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

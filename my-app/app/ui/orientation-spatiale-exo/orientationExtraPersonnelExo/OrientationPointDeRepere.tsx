"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "study" | "answer" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface Cell { r: number; c: number; }

interface Landmark {
    cell: Cell;
    icon: string;
    label: string;
}

interface Clue {
    landmark: Landmark;
    direction: string;
    distance: number;
}

interface Round {
    landmarks: Landmark[];
    playerPos: Cell;
    clues: Clue[];
    guess: Cell | null;
    correct: boolean;
    distanceOff: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, {
    size: number;
    numLandmarks: number;
    studySec: number;
    rounds: number;
    empan: number;
    maxClueDistance: number;
}> = {
    facile:    { size: 4, numLandmarks: 4, studySec: 8,  rounds: 5, empan: 3, maxClueDistance: 3 },
    moyen:     { size: 5, numLandmarks: 5, studySec: 6,  rounds: 6, empan: 5, maxClueDistance: 3 },
    difficile: { size: 6, numLandmarks: 6, studySec: 5,  rounds: 7, empan: 7, maxClueDistance: 4 },
};

const LANDMARK_POOL = [
    { icon: "🏠", label: "Maison" },
    { icon: "🏪", label: "Épicerie" },
    { icon: "🏫", label: "École" },
    { icon: "🌳", label: "Parc" },
    { icon: "⛪", label: "Église" },
    { icon: "🏥", label: "Pharmacie" },
    { icon: "🚌", label: "Arrêt de bus" },
    { icon: "☕", label: "Café" },
    { icon: "📮", label: "Poste" },
    { icon: "🍞", label: "Boulangerie" },
    { icon: "🏦", label: "Banque" },
    { icon: "🎭", label: "Théâtre" },
];

function cellKey(c: Cell) { return `${c.r}-${c.c}`; }
function cellEq(a: Cell, b: Cell) { return a.r === b.r && a.c === b.c; }
function manhattanDist(a: Cell, b: Cell) { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c); }

function getDirection(from: Cell, to: Cell): string {
    const dr = to.r - from.r;
    const dc = to.c - from.c;
    const adR = Math.abs(dr);
    const adC = Math.abs(dc);

    const isNorth = dr < 0;
    const isSouth = dr > 0;
    const isEast  = dc > 0;
    const isWest  = dc < 0;

    // Purely cardinal if one axis is 0, else diagonal
    if (dr === 0) return isEast ? "à l'Est" : "à l'Ouest";
    if (dc === 0) return isSouth ? "au Sud" : "au Nord";

    // Prefer the dominant axis for diagonal
    if (adR > adC * 2) return isSouth ? "au Sud" : "au Nord";
    if (adC > adR * 2) return isEast ? "à l'Est" : "à l'Ouest";

    const ns = isNorth ? "Nord" : "Sud";
    const ew = isEast  ? "Est"  : "Ouest";
    return `au ${ns}-${ew}`;
}

function generateRound(difficulty: Difficulty): Omit<Round, "guess" | "correct" | "distanceOff"> {
    const { size, numLandmarks, maxClueDistance } = DIFFICULTY_CONFIG[difficulty];
    const pool = [...LANDMARK_POOL].sort(() => Math.random() - 0.5);
    const usedKeys = new Set<string>();
    const landmarks: Landmark[] = [];

    for (let i = 0; i < numLandmarks; i++) {
        let cell: Cell;
        let attempts = 0;
        do {
            cell = { r: Math.floor(Math.random() * size), c: Math.floor(Math.random() * size) };
            attempts++;
        } while (usedKeys.has(cellKey(cell)) && attempts < 100);
        usedKeys.add(cellKey(cell));
        landmarks.push({ cell, icon: pool[i].icon, label: pool[i].label });
    }

    // Pick player position (not on a landmark)
    let playerPos: Cell;
    let attempts = 0;
    do {
        playerPos = { r: Math.floor(Math.random() * size), c: Math.floor(Math.random() * size) };
        attempts++;
    } while (usedKeys.has(cellKey(playerPos)) && attempts < 100);

    // Compute clues: closest landmarks within maxClueDistance
    const allClues: Clue[] = landmarks
        .map(lm => ({
            landmark: lm,
            direction: getDirection(playerPos, lm.cell),
            distance: manhattanDist(playerPos, lm.cell),
        }))
        .filter(c => c.distance <= maxClueDistance)
        .sort((a, b) => a.distance - b.distance);

    // Guarantee at least 2 clues; if not, recurse
    if (allClues.length < 2) {
        return generateRound(difficulty);
    }

    return { landmarks, playerPos, clues: allClues };
}

export default function OrientationPointDeRepere({ patientId }: { patientId: string | null }) {
    const [phase, setPhase]         = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [rounds, setRounds]       = useState<Round[]>([]);
    const [roundIdx, setRoundIdx]   = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [pendingGuess, setPendingGuess] = useState<Cell | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cfg = DIFFICULTY_CONFIG[difficulty];

    const clearTimer  = () => { if (timerRef.current)   { clearInterval(timerRef.current);  timerRef.current  = null; } };
    const clearFeedback = () => { if (feedbackRef.current) { clearTimeout(feedbackRef.current); feedbackRef.current = null; } };

    useEffect(() => () => { clearTimer(); clearFeedback(); }, []);

    // Study countdown
    useEffect(() => {
        if (phase !== "study") return;
        clearTimer();
        timerRef.current = setInterval(() => {
            setCountdown(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, roundIdx]);

    useEffect(() => {
        if (phase === "study" && countdown === 0) {
            clearTimer();
            setPendingGuess(null);
            setPhase("answer");
        }
    }, [countdown, phase]);

    const startGame = useCallback((diff: Difficulty) => {
        const dcfg = DIFFICULTY_CONFIG[diff];
        const newRounds: Round[] = Array.from({ length: dcfg.rounds }, () => {
            const r = generateRound(diff);
            return { ...r, guess: null, correct: false, distanceOff: 0 };
        });
        setRounds(newRounds);
        setRoundIdx(0);
        setCountdown(dcfg.studySec);
        setPendingGuess(null);
        setPhase("study");
    }, []);

    const handleCellClick = useCallback((cell: Cell) => {
        if (phase !== "answer") return;
        const cur = rounds[roundIdx];
        if (!cur) return;
        // Cannot click on a landmark cell
        if (cur.landmarks.some(lm => cellEq(lm.cell, cell))) return;
        setPendingGuess(cell);
    }, [phase, rounds, roundIdx]);

    const submitGuess = useCallback(() => {
        if (!pendingGuess || phase !== "answer") return;
        const cur = rounds[roundIdx];
        const d = manhattanDist(pendingGuess, cur.playerPos);
        const correct = d === 0;
        setRounds(prev => {
            const updated = [...prev];
            updated[roundIdx] = { ...updated[roundIdx], guess: pendingGuess, correct, distanceOff: d };
            return updated;
        });
        setPhase("feedback");

        const next = roundIdx + 1;
        feedbackRef.current = setTimeout(() => {
            if (next >= cfg.rounds) {
                setPhase("finished");
            } else {
                setRoundIdx(next);
                setCountdown(cfg.studySec);
                setPendingGuess(null);
                setPhase("study");
            }
        }, 1800);
    }, [pendingGuess, phase, rounds, roundIdx, cfg.rounds, cfg.studySec]);

    // Save score on finish
    useEffect(() => {
        if (phase !== "finished" || !patientId) return;
        const answered = rounds.filter(r => r.guess !== null);
        if (answered.length === 0) return;
        const exactCount = answered.filter(r => r.correct).length;
        const score = Math.round((exactCount / answered.length) * 100);
        saveScore({
            patientId,
            exercice: "Orientation par points de repère",
            domaine: "orientation-spatiale",
            score,
            empan: DIFFICULTY_CONFIG[difficulty].empan,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const reset = () => {
        clearTimer();
        clearFeedback();
        setPhase("idle");
        setRounds([]);
        setRoundIdx(0);
        setPendingGuess(null);
    };

    // ── Grid renderer ─────────────────────────────────────────────────────────

    const currentRound = rounds[roundIdx] as Round | undefined;

    function getCellStyle(r: number, c: number): { bg: string; content: React.ReactNode } {
        if (!currentRound) return { bg: "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600", content: null };

        const cell: Cell = { r, c };
        const lm = currentRound.landmarks.find(l => cellEq(l.cell, cell));
        const isPlayer = cellEq(currentRound.playerPos, cell);
        const isGuess  = pendingGuess && cellEq(pendingGuess, cell);
        const isCorrectAnswer = cellEq(currentRound.playerPos, cell);

        if (phase === "study") {
            if (lm) return {
                bg: "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-600",
                content: (
                    <span className="flex flex-col items-center leading-tight">
                        <span className="text-lg">{lm.icon}</span>
                        <span className="text-[9px] font-medium text-amber-700 dark:text-amber-300 leading-tight max-w-[52px] text-center">{lm.label}</span>
                    </span>
                ),
            };
            if (isPlayer) return {
                bg: "bg-primary-200 dark:bg-primary-800/60 border-primary-400",
                content: <span className="text-xl">📍</span>,
            };
            return { bg: "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600", content: null };
        }

        if (phase === "answer") {
            if (lm) return {
                bg: "bg-amber-100 dark:bg-amber-900/40 border-amber-300",
                content: (
                    <span className="flex flex-col items-center leading-tight">
                        <span className="text-lg">{lm.icon}</span>
                        <span className="text-[9px] font-medium text-amber-700 dark:text-amber-300 leading-tight max-w-[52px] text-center">{lm.label}</span>
                    </span>
                ),
            };
            if (isGuess) return {
                bg: "bg-primary-200 dark:bg-primary-800/60 border-primary-400",
                content: <span className="text-xl">📍</span>,
            };
            return {
                bg: "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20",
                content: null,
            };
        }

        if (phase === "feedback") {
            if (lm) return {
                bg: "bg-amber-100 dark:bg-amber-900/40 border-amber-300",
                content: (
                    <span className="flex flex-col items-center leading-tight">
                        <span className="text-lg">{lm.icon}</span>
                        <span className="text-[9px] font-medium text-amber-700 dark:text-amber-300 leading-tight max-w-[52px] text-center">{lm.label}</span>
                    </span>
                ),
            };
            const guessedHere  = currentRound.guess && cellEq(currentRound.guess, cell);
            if (isCorrectAnswer && guessedHere) return {
                bg: "bg-green-200 dark:bg-green-800/60 border-green-400",
                content: <span className="text-xl">📍✓</span>,
            };
            if (isCorrectAnswer) return {
                bg: "bg-green-200 dark:bg-green-800/60 border-green-400",
                content: <span className="text-xl">✓</span>,
            };
            if (guessedHere) return {
                bg: "bg-red-100 dark:bg-red-900/30 border-red-400",
                content: <span className="text-xl">📍✗</span>,
            };
            return { bg: "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600", content: null };
        }

        return { bg: "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600", content: null };
    }

    const size     = cfg.size;
    const maxPx    = size <= 4 ? 272 : size <= 5 ? 320 : 360;
    const cellSize = Math.floor(maxPx / size);

    const correctCount  = rounds.filter(r => r.correct).length;
    const answeredCount = rounds.filter(r => r.guess !== null).length;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full p-4 gap-4 select-none items-center justify-center overflow-y-auto">

            {/* ── Écran d'accueil ── */}
            {phase === "idle" && (
                <div className="text-center space-y-5 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Une carte avec des <strong>points de repère</strong> s'affiche.<br />
                        Votre position 📍 est indiquée brièvement.<br />
                        La position disparaît ensuite, et des <strong>indices directionnels</strong>
                        {" "}vous décrivent les repères proches (ex. : «&nbsp;Café au Nord&nbsp;»).<br />
                        Cliquez sur la carte pour indiquer où vous pensez vous trouver.
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
                        Facile&nbsp;: grille 4×4, 4 repères, 8&nbsp;s · Moyen&nbsp;: 5×5, 5 repères, 6&nbsp;s · Difficile&nbsp;: 6×6, 6 repères, 5&nbsp;s
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Phase mémorisation ── */}
            {phase === "study" && currentRound && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex items-center justify-between w-full max-w-xs">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Mémorisez votre position 📍 — {roundIdx + 1}&nbsp;/&nbsp;{cfg.rounds}
                        </p>
                        <span className={`text-xl font-bold tabular-nums ${countdown <= 3 ? "text-red-500" : "text-primary-600 dark:text-primary-400"}`}>
                            {countdown}s
                        </span>
                    </div>

                    <Grid size={size} cellSize={cellSize} getCellStyle={getCellStyle} onCellClick={() => {}} clickable={false} />
                </div>
            )}

            {/* ── Phase réponse ── */}
            {phase === "answer" && currentRound && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">
                        Où êtes-vous ? — {roundIdx + 1}&nbsp;/&nbsp;{cfg.rounds}
                    </p>

                    {/* Clues box */}
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-sm max-w-xs w-full">
                        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2 text-xs uppercase tracking-wide">
                            Points de repère visibles :
                        </p>
                        <ul className="space-y-1">
                            {currentRound.clues.map((clue, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <span className="text-base">{clue.landmark.icon}</span>
                                    <span className="font-medium">{clue.landmark.label}</span>
                                    <span className="text-slate-400 dark:text-slate-500">—</span>
                                    <span className="text-primary-600 dark:text-primary-400 font-medium">{clue.direction}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Grid size={size} cellSize={cellSize} getCellStyle={getCellStyle} onCellClick={handleCellClick} clickable />

                    {pendingGuess && (
                        <button
                            onClick={submitGuess}
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                        >
                            Valider ma position
                        </button>
                    )}
                </div>
            )}

            {/* ── Feedback ── */}
            {phase === "feedback" && currentRound && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <p className={`text-base font-semibold ${currentRound.correct ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                        {currentRound.correct
                            ? "Bonne position !"
                            : currentRound.distanceOff === 1
                                ? `Presque ! À 1 case de distance.`
                                : `Incorrect — position correcte en vert (${currentRound.distanceOff} cases)`}
                    </p>
                    <Grid size={size} cellSize={cellSize} getCellStyle={getCellStyle} onCellClick={() => {}} clickable={false} />
                </div>
            )}

            {/* ── Résultats ── */}
            {phase === "finished" && (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 text-center">
                        <p>
                            Positions correctes&nbsp;:{" "}
                            <strong className={
                                correctCount === answeredCount ? "text-green-600" :
                                correctCount / (answeredCount || 1) >= 0.7 ? "text-amber-500" : "text-red-500"
                            }>
                                {correctCount}&nbsp;/&nbsp;{answeredCount}
                            </strong>
                            {" "}— Score&nbsp;:{" "}
                            <strong>{Math.round((correctCount / (answeredCount || 1)) * 100)}&nbsp;%</strong>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                            Niveau&nbsp;: <strong>{difficulty}</strong>
                        </p>
                    </div>

                    {/* Détail des essais */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1 w-full max-h-40 overflow-y-auto">
                        {rounds.map((r, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={`shrink-0 font-bold ${r.correct ? "text-green-500" : "text-red-400"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">Essai {i + 1}</span>
                                {!r.correct && r.guess && (
                                    <span className="ml-auto text-slate-400">
                                        Écart : {r.distanceOff} case{r.distanceOff > 1 ? "s" : ""}
                                    </span>
                                )}
                                {r.correct && (
                                    <span className="ml-auto text-green-500 dark:text-green-400">Exact !</span>
                                )}
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

// ── Sub-component: Grid ──────────────────────────────────────────────────────

interface GridProps {
    size: number;
    cellSize: number;
    clickable: boolean;
    getCellStyle: (r: number, c: number) => { bg: string; content: React.ReactNode };
    onCellClick: (cell: Cell) => void;
}

function Grid({ size, cellSize, clickable, getCellStyle, onCellClick }: GridProps) {
    return (
        <div
            className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden"
            style={{ width: cellSize * size, height: cellSize * size }}
        >
            {Array.from({ length: size }, (_, r) => (
                <div key={r} className="flex">
                    {Array.from({ length: size }, (_, c) => {
                        const { bg, content } = getCellStyle(r, c);
                        return (
                            <div
                                key={c}
                                onClick={() => onCellClick({ r, c })}
                                className={`flex items-center justify-center border border-slate-200/60 dark:border-slate-600/60 transition-colors duration-150 ${bg} ${clickable ? "active:scale-95" : "cursor-default"}`}
                                style={{ width: cellSize, height: cellSize }}
                            >
                                {content}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

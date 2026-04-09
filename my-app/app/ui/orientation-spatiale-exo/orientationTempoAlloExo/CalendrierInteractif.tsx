"use client";

import { useState, useCallback } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase      = "idle" | "question" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";
type QType      = "locate" | "dayofweek" | "interval" | "adddays";

interface Question {
    id: string;
    type: QType;
    year: number;
    month: number;
    text: string;
    // locate / adddays → patient clicks a date on the calendar
    targetDate?: number;        // correct date to click
    // interval / adddays → highlight two dates
    highlightA?: number;
    highlightB?: number;
    // dayofweek / interval → MCQ
    choices?: string[];
    correct: string;
}

interface Result {
    question: Question;
    answer: string;
    correct: boolean;
}

// ─── Date helpers ────────────────────────────────────────────────────────────

const MONTHS_FR   = ["Janvier","Février","Mars","Avril","Mai","Juin",
                     "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_HEADER = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const DAYS_FULL   = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
// Returns 0=Lun … 6=Dim
function getFirstDow(y: number, m: number)   { return (new Date(y, m, 1).getDay() + 6) % 7; }
function getDow(y: number, m: number, d: number) { return (new Date(y, m, d).getDay() + 6) % 7; }
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function makeMCQ(correct: string, pool: string[]): string[] {
    return shuffle([correct, ...shuffle(pool.filter(p => p !== correct)).slice(0, 3)]);
}

function randDate(days: number, excludes: number[] = []): number {
    let d: number;
    do { d = 1 + Math.floor(Math.random() * days); } while (excludes.includes(d));
    return d;
}

// ─── Question builder ────────────────────────────────────────────────────────

function buildQuestions(diff: Difficulty): Question[] {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();
    const days  = getDaysInMonth(year, month);

    const qs: Question[] = [];

    const counts: Record<Difficulty, Record<QType, number>> = {
        facile:    { locate: 4, dayofweek: 4, interval: 0, adddays: 0 },
        moyen:     { locate: 3, dayofweek: 3, interval: 4, adddays: 0 },
        difficile: { locate: 2, dayofweek: 3, interval: 4, adddays: 3 },
    };

    const used: number[] = [];

    // --- locate ---
    for (let i = 0; i < counts[diff].locate; i++) {
        const d = randDate(days, used);
        used.push(d);
        const dow = DAYS_FULL[getDow(year, month, d)];
        qs.push({
            id: `locate-${i}`,
            type: "locate",
            year, month,
            text: `Cliquez sur le ${dow.toLowerCase()} ${d} ${MONTHS_FR[month].toLowerCase()}.`,
            targetDate: d,
            correct: String(d),
        });
    }

    // --- dayofweek ---
    for (let i = 0; i < counts[diff].dayofweek; i++) {
        const d = randDate(days, used);
        used.push(d);
        const dow = getDow(year, month, d);
        const correct = DAYS_FULL[dow];
        qs.push({
            id: `dow-${i}`,
            type: "dayofweek",
            year, month,
            text: `Quel jour de la semaine est le ${d} ${MONTHS_FR[month]} ${year} ?`,
            highlightA: d,
            choices: makeMCQ(correct, DAYS_FULL),
            correct,
        });
    }

    // --- interval ---
    for (let i = 0; i < counts[diff].interval; i++) {
        const d1 = randDate(days - 3, used);
        used.push(d1);
        const minGap = diff === "difficile" ? 5 : 3;
        const maxGap = diff === "difficile" ? 18 : 10;
        const gap = minGap + Math.floor(Math.random() * (maxGap - minGap + 1));
        const d2  = Math.min(d1 + gap, days);
        const realGap = d2 - d1;
        const correct = String(realGap);
        const pool = [realGap - 2, realGap - 1, realGap + 1, realGap + 2]
            .filter(n => n > 0)
            .map(String);
        qs.push({
            id: `interval-${i}`,
            type: "interval",
            year, month,
            text: `Combien de jours y a-t-il entre le ${d1} et le ${d2} ${MONTHS_FR[month]} ?`,
            highlightA: d1,
            highlightB: d2,
            choices: makeMCQ(correct, pool),
            correct,
        });
    }

    // --- adddays ---
    for (let i = 0; i < counts[diff].adddays; i++) {
        const d1 = randDate(days - 10, used);
        used.push(d1);
        const add = 3 + Math.floor(Math.random() * 12);
        const d2 = d1 + add;
        if (d2 > days) { i--; continue; }
        const correct = String(d2);
        const pool = [d2 - 2, d2 - 1, d2 + 1, d2 + 2]
            .filter(n => n >= 1 && n <= days)
            .map(String);
        qs.push({
            id: `add-${i}`,
            type: "adddays",
            year, month,
            text: `En partant du ${d1}, quelle date sera-t-on dans ${add} jours ?`,
            highlightA: d1,
            targetDate: d2,
            correct,
        });
    }

    return shuffle(qs);
}

// ─── Calendar grid ───────────────────────────────────────────────────────────

interface CalProps {
    year: number;
    month: number;
    highlightA?: number;
    highlightB?: number;
    targetDate?: number;
    clickable: boolean;
    feedbackDate?: number | null;
    correctDate?: number | null;
    onDateClick?: (d: number) => void;
}

function CalendarGrid({ year, month, highlightA, highlightB, targetDate, clickable, feedbackDate, correctDate, onDateClick }: CalProps) {
    const today     = new Date();
    const firstDow  = getFirstDow(year, month);
    const daysInMo  = getDaysInMonth(year, month);
    const blanks    = Array(firstDow).fill(null);
    const dated     = Array.from({ length: daysInMo }, (_, i) => i + 1);
    const cells     = [...blanks, ...dated];
    while (cells.length % 7 !== 0) cells.push(null);

    const isToday = (d: number) =>
        year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

    const cellClass = (d: number | null): string => {
        if (d === null) return "";
        const base = "w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium border transition-colors duration-150 ";

        // Feedback state
        if (feedbackDate !== undefined && feedbackDate !== null) {
            if (d === correctDate) return base + "bg-green-100 dark:bg-green-900/40 border-green-400 text-green-700 dark:text-green-300";
            if (d === feedbackDate && d !== correctDate) return base + "bg-red-100 dark:bg-red-900/40 border-red-400 text-red-600 dark:text-red-400";
        }

        // Highlights (interval / adddays question)
        if (d === highlightA && highlightB === undefined) return base + "bg-primary-100 dark:bg-primary-900/40 border-primary-400 text-primary-700 dark:text-primary-300 ring-2 ring-primary-400";
        if (d === highlightA || d === highlightB) return base + "bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-300 font-bold";

        // Today
        if (isToday(d)) return base + "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold";

        if (clickable) return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 cursor-pointer";
        return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400";
    };

    return (
        <div className="w-full">
            {/* Month header */}
            <p className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {MONTHS_FR[month]} {year}
            </p>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS_HEADER.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 py-0.5">
                        {d}
                    </div>
                ))}
            </div>
            {/* Weeks */}
            {Array.from({ length: cells.length / 7 }, (_, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
                    {cells.slice(wi * 7, wi * 7 + 7).map((d, di) => (
                        <div key={di}>
                            {d !== null ? (
                                <button
                                    onClick={() => clickable && onDateClick?.(d)}
                                    disabled={!clickable}
                                    className={cellClass(d)}
                                >
                                    {d}
                                </button>
                            ) : (
                                <div className="w-full aspect-square" />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalendrierInteractif({ patientId }: { patientId: string | null }) {
    const [phase,      setPhase]      = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [questions,  setQuestions]  = useState<Question[]>([]);
    const [qIdx,       setQIdx]       = useState(0);
    const [results,    setResults]    = useState<Result[]>([]);
    const [selected,   setSelected]   = useState<string | null>(null); // MCQ
    const [clickedDate, setClickedDate] = useState<number | null>(null); // locate/adddays

    const question   = questions[qIdx];
    const isLastQ    = qIdx === questions.length - 1;
    const isClickQ   = question?.type === "locate" || question?.type === "adddays";
    const isCorrect  = selected !== null
        ? selected === question?.correct
        : clickedDate !== null
        ? String(clickedDate) === question?.correct
        : false;

    const startGame = (diff: Difficulty) => {
        setQuestions(buildQuestions(diff));
        setQIdx(0);
        setResults([]);
        setSelected(null);
        setClickedDate(null);
        setPhase("question");
    };

    const submitAnswer = useCallback((answer: string) => {
        if (!question) return;
        const correct = answer === question.correct;
        const result: Result = { question, answer, correct };
        const updated = [...results, result];

        setResults(updated);
        setPhase("feedback");

        const isClickType = question.type === "locate" || question.type === "adddays";
        if (isClickType) setClickedDate(Number(answer));
        else setSelected(answer);

        if (isLastQ) {
            const score = Math.round(updated.filter(r => r.correct).length / updated.length * 100);
            if (patientId) {
                saveScore({
                    patientId,
                    exercice: "Calendrier interactif",
                    domaine: "orientation-spatiale",
                    score,
                    empan: updated.filter(r => r.correct).length,
                });
            }
        }
    }, [question, results, isLastQ, patientId]);

    const handleDateClick = useCallback((d: number) => {
        if (phase !== "question" || !isClickQ) return;
        setClickedDate(d);
        submitAnswer(String(d));
    }, [phase, isClickQ, submitAnswer]);

    const handleChoice = useCallback((choice: string) => {
        if (phase !== "question") return;
        setSelected(choice);
        submitAnswer(choice);
    }, [phase, submitAnswer]);

    const handleNext = () => {
        if (isLastQ) {
            setPhase("finished");
        } else {
            setQIdx(qIdx + 1);
            setSelected(null);
            setClickedDate(null);
            setPhase("question");
        }
    };

    const reset = () => {
        setPhase("idle");
        setQuestions([]);
        setQIdx(0);
        setResults([]);
        setSelected(null);
        setClickedDate(null);
    };

    const correctCount = results.filter(r => r.correct).length;

    const choiceClass = (choice: string): string => {
        const base = "flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 ";
        if (phase !== "feedback") return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400 cursor-pointer";
        if (choice === question?.correct) return base + "bg-green-100 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-200 cursor-default";
        if (choice === selected) return base + "bg-red-100 dark:bg-red-900/30 border-red-400 text-red-600 dark:text-red-300 cursor-default";
        return base + "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-500 text-slate-400 dark:text-slate-500 cursor-default opacity-50";
    };

    return (
        <div className="flex flex-col h-full p-4 select-none overflow-y-auto">

            {/* --- Idle --- */}
            {phase === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6">
                    <div className="text-center space-y-3 max-w-md">
                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            Interagissez avec le calendrier du mois en cours.<br />
                            Localisez des dates, identifiez des jours de la semaine{" "}
                            et calculez des intervalles.
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Facile : 8 questions · Moyen : 10 · Difficile : 12
                        </p>
                    </div>
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
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* --- Question / Feedback --- */}
            {(phase === "question" || phase === "feedback") && question && (
                <div className="flex flex-col gap-3">

                    {/* Progression */}
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                            {questions.map((_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                    i < qIdx
                                        ? results[i]?.correct ? "bg-green-400" : "bg-red-400"
                                        : i === qIdx ? "bg-primary-400" : "bg-slate-200 dark:bg-slate-700"
                                }`} />
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{qIdx + 1}/{questions.length}</span>
                    </div>

                    {/* Question */}
                    <div className={`text-center text-sm font-semibold px-2 py-2 rounded-lg ${
                        phase === "feedback"
                            ? isCorrect
                                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            : "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                    }`}>
                        {question.text}
                    </div>

                    {/* Calendrier */}
                    <CalendarGrid
                        year={question.year}
                        month={question.month}
                        highlightA={question.highlightA}
                        highlightB={question.highlightB}
                        targetDate={question.targetDate}
                        clickable={phase === "question" && isClickQ}
                        feedbackDate={phase === "feedback" && isClickQ ? clickedDate : null}
                        correctDate={phase === "feedback" && isClickQ ? Number(question.correct) : null}
                        onDateClick={handleDateClick}
                    />

                    {/* MCQ choices */}
                    {question.choices && (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {question.choices.map((c, i) => (
                                <button key={i} onClick={() => handleChoice(c)} className={choiceClass(c)}>
                                    {phase === "feedback" && c === question.correct && <span className="text-green-500 mr-1">✓</span>}
                                    {phase === "feedback" && c === selected && c !== question.correct && <span className="text-red-500 mr-1">✗</span>}
                                    {c}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Feedback message + next */}
                    {phase === "feedback" && (
                        <div className="flex items-center justify-between gap-3 mt-1">
                            <p className={`text-sm font-medium ${isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                {isCorrect
                                    ? "Bonne réponse !"
                                    : `Correct : ${
                                        isClickQ
                                            ? `le ${question.correct} ${MONTHS_FR[question.month]}`
                                            : question.correct
                                    }`}
                            </p>
                            <button
                                onClick={handleNext}
                                className="px-5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 shrink-0"
                            >
                                {isLastQ ? "Résultats" : "Suivante →"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- Finished --- */}
            {phase === "finished" && (
                <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center">
                    <p className="text-xl font-bold text-slate-800 dark:text-white">Exercice terminé !</p>

                    <div className="flex gap-1">
                        {results.map((r, i) => (
                            <div key={i} title={r.question.text}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs ${r.correct ? "bg-green-500" : "bg-red-400"}`}>
                                {r.correct ? "✓" : "✗"}
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Score :{" "}
                        <strong className={correctCount >= results.length * 0.8 ? "text-green-600 dark:text-green-400" : correctCount >= results.length * 0.6 ? "text-amber-500" : "text-red-500"}>
                            {correctCount} / {results.length}
                        </strong>
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1.5 text-left w-full max-w-sm max-h-44 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className={`shrink-0 mt-0.5 ${r.correct ? "text-green-500" : "text-red-500"}`}>{r.correct ? "✓" : "✗"}</span>
                                <span className="text-slate-600 dark:text-slate-300 flex-1">{r.question.text}</span>
                                {!r.correct && (
                                    <span className="text-red-400 shrink-0">→ <strong>{r.question.correct}</strong></span>
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

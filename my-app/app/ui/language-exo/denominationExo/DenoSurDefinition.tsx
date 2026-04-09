"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { saveScore } from "@/app/actions/scores";

type Phase = "idle" | "question" | "feedback" | "finished";
type Difficulty = "facile" | "moyen" | "difficile";

interface Item {
    id: string;
    definition: string;
    correct: string;
    distractors: string[];
    category: string;
}

interface Result {
    item: Item;
    chosen: string;
    correct: boolean;
    timeMs: number;
}

// ── Banque de données ─────────────────────────────────────────────────────────

const ITEMS: Record<Difficulty, Item[]> = {
    facile: [
        { id: "f01", category: "Ustensile", definition: "On l'utilise pour manger la soupe. Il a un long manche et une partie creuse.", correct: "cuillère", distractors: ["fourchette", "couteau", "assiette"] },
        { id: "f02", category: "Animal",    definition: "Gros animal marin gris qui souffle de l'eau par le dessus de sa tête.", correct: "baleine", distractors: ["dauphin", "requin", "phoque"] },
        { id: "f03", category: "Objet",     definition: "On s'en sert pour couper le pain ou les légumes en cuisine. Il a une lame et un manche.", correct: "couteau", distractors: ["ciseaux", "scie", "hache"] },
        { id: "f04", category: "Meuble",    definition: "Meuble dans lequel on range ses vêtements, souvent avec des portes.", correct: "armoire", distractors: ["commode", "étagère", "table"] },
        { id: "f05", category: "Transport", definition: "Véhicule à deux roues sans moteur que l'on fait avancer en pédalant.", correct: "vélo", distractors: ["moto", "trottinette", "scooter"] },
        { id: "f06", category: "Aliment",   definition: "Fruit jaune et courbé que les singes adorent manger.", correct: "banane", distractors: ["citron", "mangue", "ananas"] },
        { id: "f07", category: "Vêtement",  definition: "Couvre-chef porté en hiver pour se protéger du froid. Il recouvre la tête et les oreilles.", correct: "bonnet", distractors: ["casquette", "chapeau", "écharpe"] },
        { id: "f08", category: "Outil",     definition: "Outil que l'on utilise pour enfoncer des clous dans le bois.", correct: "marteau", distractors: ["tournevis", "pince", "clé"] },
        { id: "f09", category: "Animal",    definition: "Oiseau qui ne peut pas voler, vit dans les régions très froides et porte un costume noir et blanc.", correct: "pingouin", distractors: ["perroquet", "autruche", "flamant"] },
        { id: "f10", category: "Lieu",      definition: "Endroit où l'on va pour emprunter des livres et les ramener plus tard.", correct: "bibliothèque", distractors: ["librairie", "musée", "école"] },
        { id: "f11", category: "Objet",     definition: "Instrument que l'on utilise pour mesurer la température du corps.", correct: "thermomètre", distractors: ["tensiomètre", "stéthoscope", "baromètre"] },
        { id: "f12", category: "Aliment",   definition: "Légume rouge et rond que l'on met souvent dans les salades et les pizzas.", correct: "tomate", distractors: ["poivron", "radis", "cerise"] },
    ],
    moyen: [
        { id: "m01", category: "Instrument",   definition: "Instrument à cordes que l'on pince, avec une caisse de résonance en forme de 8.", correct: "guitare", distractors: ["violon", "harpe", "mandoline"] },
        { id: "m02", category: "Métier",        definition: "Professionnel qui construit ou répare les canalisations d'eau dans les maisons.", correct: "plombier", distractors: ["électricien", "menuisier", "maçon"] },
        { id: "m03", category: "Objet",         definition: "Appareil optique grossissant utilisé pour observer de très petits objets invisibles à l'œil nu.", correct: "microscope", distractors: ["télescope", "jumelles", "loupe"] },
        { id: "m04", category: "Géographie",    definition: "Masse de terre entourée d'eau de tous côtés, plus petite qu'un continent.", correct: "île", distractors: ["péninsule", "archipel", "atoll"] },
        { id: "m05", category: "Bâtiment",      definition: "Édifice religieux chrétien de grande taille, siège d'un évêque.", correct: "cathédrale", distractors: ["chapelle", "abbaye", "basilique"] },
        { id: "m06", category: "Phénomène",     definition: "Phénomène météorologique formé d'un arc de couleurs dans le ciel après la pluie.", correct: "arc-en-ciel", distractors: ["aurore boréale", "halo", "mirage"] },
        { id: "m07", category: "Outil médical", definition: "Appareil que le médecin pose sur la poitrine pour écouter les battements du cœur.", correct: "stéthoscope", distractors: ["tensiomètre", "otoscope", "thermomètre"] },
        { id: "m08", category: "Animal",        definition: "Mammifère marin dont le corps est en forme de fuseau, reconnaissable à son aileron dorsal et ses claquements joyeux.", correct: "dauphin", distractors: ["marsouin", "otarie", "baleine"] },
        { id: "m09", category: "Objet cuisine", definition: "Ustensile de cuisine utilisé pour passer les aliments afin de séparer les solides des liquides.", correct: "passoire", distractors: ["écumoire", "spatule", "entonnoir"] },
        { id: "m10", category: "Littérature",   definition: "Courte histoire en prose ou en vers dont les personnages sont souvent des animaux et qui se termine par une morale.", correct: "fable", distractors: ["conte", "poème", "apologue"] },
        { id: "m11", category: "Architecture",  definition: "Ouverture pratiquée dans un toit pour éclairer les combles, souvent en saillie.", correct: "lucarne", distractors: ["fenêtre", "soupirail", "tabatière"] },
        { id: "m12", category: "Sport",         definition: "Sport nautique qui consiste à glisser sur les vagues debout sur une planche.", correct: "surf", distractors: ["wakeboard", "kitesurf", "bodyboard"] },
    ],
    difficile: [
        { id: "d01", category: "Médecine",      definition: "Inflammation de l'appendice, petit organe appendu au début du gros intestin.", correct: "appendicite", distractors: ["péritonite", "colite", "diverticulite"] },
        { id: "d02", category: "Rhétorique",    definition: "Figure de style qui consiste à atténuer une idée en disant le contraire de ce qu'on entend (ex : 'ce n'est pas mauvais').", correct: "litote", distractors: ["euphémisme", "antiphrase", "hyperbole"] },
        { id: "d03", category: "Botanique",     definition: "Partie de la fleur qui contient les cellules reproductrices mâles sous forme de poudre fine souvent jaune.", correct: "pollen", distractors: ["étamine", "pistil", "pétale"] },
        { id: "d04", category: "Géologie",      definition: "Roche formée par la consolidation de matériaux volcaniques projetés lors d'une éruption et refroidis à la surface.", correct: "basalte", distractors: ["granite", "obsidienne", "ponce"] },
        { id: "d05", category: "Droit",         definition: "Document officiel délivré par un tribunal qui oblige quelqu'un à comparaître ou à effectuer une action.", correct: "injonction", distractors: ["assignation", "sommation", "ordonnance"] },
        { id: "d06", category: "Philosophie",   definition: "Raisonnement fallacieux qui paraît valide mais contient une erreur logique cachée.", correct: "sophisme", distractors: ["paralogisme", "syllogisme", "dilemme"] },
        { id: "d07", category: "Musique",       definition: "Composition musicale pour un soliste et un orchestre, généralement en trois mouvements.", correct: "concerto", distractors: ["sonate", "symphonie", "suite"] },
        { id: "d08", category: "Neurologie",    definition: "Trouble caractérisé par l'incapacité à reconnaître les visages familiers malgré une vision intacte.", correct: "prosopagnosie", distractors: ["agnosie", "aphasie", "alexie"] },
        { id: "d09", category: "Météorologie",  definition: "Brouillard mélangé à des fumées industrielles ou à des polluants, formant un nuage de pollution urbaine.", correct: "smog", distractors: ["brume", "brouillard", "haze"] },
        { id: "d10", category: "Architecture",  definition: "Galerie voûtée à arcades constituant le porche d'une église ou d'un cloître.", correct: "narthex", distractors: ["transept", "déambulatoire", "portique"] },
        { id: "d11", category: "Linguistique",  definition: "Phénomène par lequel un mot emprunte le sens ou la forme d'un autre mot d'une langue étrangère.", correct: "calque", distractors: ["emprunt", "néologisme", "archaïsme"] },
        { id: "d12", category: "Biologie",      definition: "Processus par lequel une cellule ingère et détruit des particules étrangères ou des microorganismes.", correct: "phagocytose", distractors: ["endocytose", "pinocytose", "lyse"] },
    ],
};

const DIFFICULTY_CONFIG: Record<Difficulty, { rounds: number; empan: number }> = {
    facile:    { rounds: 8,  empan: 3 },
    moyen:     { rounds: 10, empan: 5 },
    difficile: { rounds: 10, empan: 8 },
};

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

function buildOptions(item: Item): string[] {
    return shuffle([item.correct, ...item.distractors.slice(0, 3)]);
}

function pickItems(difficulty: Difficulty, count: number): Item[] {
    return shuffle(ITEMS[difficulty]).slice(0, count);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DenoSurDefinition({ patientId }: { patientId: string | null }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [difficulty, setDifficulty] = useState<Difficulty>("facile");
    const [items, setItems] = useState<Item[]>([]);
    const [options, setOptions] = useState<string[][]>([]);
    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState<Result[]>([]);
    const [chosen, setChosen] = useState<string | null>(null);
    const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
    const startTimeRef = useRef(0);
    const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearFeedback = () => {
        if (feedbackTimerRef.current) { clearTimeout(feedbackTimerRef.current); feedbackTimerRef.current = null; }
    };

    useEffect(() => () => clearFeedback(), []);

    const startGame = useCallback((diff: Difficulty) => {
        const cfg = DIFFICULTY_CONFIG[diff];
        const picked = pickItems(diff, cfg.rounds);
        const opts = picked.map(item => buildOptions(item));
        setItems(picked);
        setOptions(opts);
        setIdx(0);
        setResults([]);
        setChosen(null);
        setLastCorrect(null);
        startTimeRef.current = Date.now();
        setPhase("question");
    }, []);

    const handleChoice = useCallback((choice: string) => {
        if (phase !== "question") return;
        const timeMs = Date.now() - startTimeRef.current;
        const item = items[idx];
        const correct = choice === item.correct;

        setChosen(choice);
        setLastCorrect(correct);
        setPhase("feedback");

        const newResult: Result = { item, chosen: choice, correct, timeMs };
        const updated = [...results, newResult];
        setResults(updated);

        const nextIdx = idx + 1;
        feedbackTimerRef.current = setTimeout(() => {
            if (nextIdx >= items.length) {
                setPhase("finished");
            } else {
                setIdx(nextIdx);
                setChosen(null);
                setLastCorrect(null);
                startTimeRef.current = Date.now();
                setPhase("question");
            }
        }, 1500);
    }, [phase, items, idx, results]);

    useEffect(() => {
        if (phase !== "finished" || !patientId || results.length === 0) return;
        const correctCount = results.filter(r => r.correct).length;
        const score = Math.round((correctCount / results.length) * 100);
        saveScore({
            patientId,
            exercice: "Dénomination sur définition",
            domaine: "language",
            score,
            empan: DIFFICULTY_CONFIG[difficulty].empan,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const reset = () => {
        clearFeedback();
        setPhase("idle");
        setItems([]);
        setOptions([]);
        setIdx(0);
        setResults([]);
        setChosen(null);
        setLastCorrect(null);
    };

    const correctCount = results.filter(r => r.correct).length;
    const currentItem = items[idx];
    const currentOptions = options[idx] ?? [];

    // ── Option button ────────────────────────────────────────────────────────

    function OptionBtn({ word }: { word: string }) {
        const isChosen = chosen === word;
        const isCorrect = currentItem && word === currentItem.correct;
        const showResult = phase === "feedback";

        let style = "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-800 dark:text-slate-100 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400";
        if (showResult) {
            if (isCorrect) style = "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-200 ring-2 ring-green-400";
            else if (isChosen) style = "bg-red-100 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-300";
            else style = "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 opacity-60";
        } else if (isChosen) {
            style = "bg-primary-100 dark:bg-primary-900/40 border-primary-500 text-primary-800 dark:text-primary-200 ring-2 ring-primary-400";
        }

        return (
            <button
                onClick={() => handleChoice(word)}
                disabled={phase === "feedback"}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 text-left ${style} ${phase === "feedback" ? "cursor-default" : "cursor-pointer active:scale-95"}`}
            >
                {word}
            </button>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 gap-4 select-none items-center justify-center overflow-y-auto">

            {/* ── Accueil ── */}
            {phase === "idle" && (
                <div className="text-center space-y-5 max-w-md">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                        Une <strong>définition</strong> s'affiche.<br />
                        Trouvez le mot qui correspond parmi les quatre propositions.
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
                        Facile : objets courants (8 items) · Moyen : vocabulaire varié (10 items) · Difficile : termes spécialisés (10 items)
                    </p>
                    <button
                        onClick={() => startGame(difficulty)}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Démarrer
                    </button>
                </div>
            )}

            {/* ── Question + Feedback ── */}
            {(phase === "question" || phase === "feedback") && currentItem && (
                <div className="flex flex-col gap-4 w-full max-w-md">

                    {/* Progression */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{idx + 1} / {items.length}</span>
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            {currentItem.category}
                        </span>
                        <span>{correctCount} ✓</span>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                            className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${((idx) / items.length) * 100}%` }}
                        />
                    </div>

                    {/* Définition */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-5 shadow-sm border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-2">
                            Définition
                        </p>
                        <p className="text-base text-slate-800 dark:text-slate-100 leading-relaxed">
                            {currentItem.definition}
                        </p>
                    </div>

                    {/* Feedback */}
                    {phase === "feedback" && (
                        <p className={`text-sm font-semibold text-center ${lastCorrect ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                            {lastCorrect
                                ? "Bonne réponse !"
                                : `Incorrect — la réponse était : « ${currentItem.correct} »`}
                        </p>
                    )}

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-3">
                        {currentOptions.map(word => (
                            <OptionBtn key={word} word={word} />
                        ))}
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
                                correctCount === results.length ? "text-green-600" :
                                correctCount / results.length >= 0.7 ? "text-amber-500" : "text-red-500"
                            }>
                                {correctCount} / {results.length}
                            </strong>
                            {" "}— Score :{" "}
                            <strong>{Math.round((correctCount / results.length) * 100)} %</strong>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                            Niveau : <strong>{difficulty}</strong> · Temps moyen :{" "}
                            <strong>{(results.reduce((s, r) => s + r.timeMs, 0) / results.length / 1000).toFixed(1)} s</strong>
                        </p>
                    </div>

                    {/* Récapitulatif */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 text-xs space-y-1.5 w-full max-h-52 overflow-y-auto">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className={`shrink-0 font-bold mt-0.5 ${r.correct ? "text-green-500" : "text-red-400"}`}>
                                    {r.correct ? "✓" : "✗"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-slate-500 dark:text-slate-400 line-clamp-1">
                                        {r.item.definition.slice(0, 55)}…
                                    </span>
                                    <span className="block font-semibold text-slate-700 dark:text-slate-200">
                                        {r.correct
                                            ? r.item.correct
                                            : <><span className="line-through text-red-400">{r.chosen}</span>{" → "}<span className="text-green-600">{r.item.correct}</span></>
                                        }
                                    </span>
                                </div>
                                <span className="ml-auto text-slate-400 shrink-0">{(r.timeMs / 1000).toFixed(1)}s</span>
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

"use client";

import { useState } from "react";
import {
    LineChart, Line,
    BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine,
    ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScoreEntry = {
    id: string;
    exercice: string;
    domaine: string;
    score: number;
    niveauDifficulte: string;
    date: string; // ISO string
};

export type PatientData = {
    patientId: string;
    nom: string;
    prenom: string;
    scores: ScoreEntry[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAIN_META: Record<string, { label: string; color: string }> = {
    "orientation-spatiale":   { label: "Orientation spatiale",    color: "#3b82f6" },
    "language":               { label: "Langage",                 color: "#10b981" },
    "memo-travail":           { label: "Mémoire de travail",      color: "#8b5cf6" },
    "fonctions-executives":   { label: "Fonctions exécutives",    color: "#f59e0b" },
};

function domainColor(d: string)  { return DOMAIN_META[d]?.color  ?? "#64748b"; }
function domainLabel(d: string)  { return DOMAIN_META[d]?.label  ?? d; }

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

// ─── Tooltip custom ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: { value: number; name: string; color: string }[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 shadow text-xs">
            <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name} : <strong>{p.value} %</strong>
                </p>
            ))}
        </div>
    );
}

// ─── Per-domain line chart ────────────────────────────────────────────────────

function DomainLineChart({ domaine, entries }: { domaine: string; entries: ScoreEntry[] }) {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const data = sorted.map((s, i) => ({
        name: `${i + 1} · ${fmtDate(s.date)}`,
        score: s.score,
        exercice: s.exercice,
    }));
    const color = domainColor(domaine);
    const avg = Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {domainLabel(domaine)}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: color + "22", color }}>
                    Moy. {avg} %
                </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <ReferenceLine y={avg} stroke={color} strokeDasharray="4 4" opacity={0.5} />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const p = payload[0];
                            const exo = data.find(d => d.name === label)?.exercice ?? "";
                            return (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 shadow text-xs">
                                    <p className="font-semibold text-slate-600 dark:text-slate-300">{exo}</p>
                                    <p style={{ color }}>Score : <strong>{p.value} %</strong></p>
                                </div>
                            );
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 4, fill: color, strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                        name="Score"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Average by exercice bar chart ────────────────────────────────────────────

function ExerciceBarChart({ scores }: { scores: ScoreEntry[] }) {
    const map = new Map<string, { scores: number[]; domaine: string }>();
    for (const s of scores) {
        if (!map.has(s.exercice)) map.set(s.exercice, { scores: [], domaine: s.domaine });
        map.get(s.exercice)!.scores.push(s.score);
    }
    const data = [...map.entries()]
        .map(([exercice, { scores, domaine }]) => ({
            exercice: exercice.length > 24 ? exercice.slice(0, 22) + "…" : exercice,
            moyenne: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            domaine,
            full: exercice,
            n: scores.length,
        }))
        .sort((a, b) => b.moyenne - a.moyenne);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                Score moyen par exercice
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38)}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit=" %" />
                    <YAxis type="category" dataKey="exercice" tick={{ fontSize: 10 }} width={140} />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 shadow text-xs">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200 mb-0.5">{d.full}</p>
                                    <p style={{ color: domainColor(d.domaine) }}>
                                        {domainLabel(d.domaine)}
                                    </p>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Moyenne : <strong>{d.moyenne} %</strong> ({d.n} session{d.n > 1 ? "s" : ""})
                                    </p>
                                </div>
                            );
                        }}
                    />
                    <Bar
                        dataKey="moyenne"
                        radius={[0, 4, 4, 0]}
                        name="Moyenne"
                        label={{ position: "right", fontSize: 10, formatter: (v: unknown) => `${v} %` }}
                    >
                        {data.map((entry, i) => (
                            <Cell key={i} fill={domainColor(entry.domaine)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Légende domaines */}
            <div className="flex flex-wrap gap-3 mt-3">
                {[...new Set(data.map(d => d.domaine))].map(d => (
                    <span key={d} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: domainColor(d) }} />
                        {domainLabel(d)}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Global progress line (all domains combined) ──────────────────────────────

function GlobalProgressChart({ scores }: { scores: ScoreEntry[] }) {
    const sorted = [...scores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const data = sorted.map((s, i) => ({
        name: `${fmtDate(s.date)}`,
        score: s.score,
        domaine: domainLabel(s.domaine),
        exercice: s.exercice,
        color: domainColor(s.domaine),
        i,
    }));

    // Group by date to show daily average
    const byDate = new Map<string, number[]>();
    for (const s of sorted) {
        const k = fmtDate(s.date);
        if (!byDate.has(k)) byDate.set(k, []);
        byDate.get(k)!.push(s.score);
    }
    const avgData = [...byDate.entries()].map(([date, vals]) => ({
        date,
        moyenne: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));

    const overall = Math.round(data.reduce((a, b) => a + b.score, 0) / data.length);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Progression globale (moyenne quotidienne)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    Moy. générale {overall} %
                </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={avgData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <ReferenceLine y={overall} stroke="#94a3b8" strokeDasharray="4 4" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="moyenne"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                        name="Moyenne"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Stats summary cards ──────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-col gap-0.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-2xl font-bold" style={{ color: color ?? "#1e293b" }}>{value}</p>
            {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScoresCharts({ patients }: { patients: PatientData[] }) {
    const [selectedId, setSelectedId] = useState<string>(patients[0]?.patientId ?? "");

    const patient = patients.find(p => p.patientId === selectedId);
    const scores  = patient?.scores ?? [];

    const domaines   = [...new Set(scores.map(s => s.domaine))];
    const avgScore   = scores.length ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;
    const best       = scores.length ? Math.max(...scores.map(s => s.score)) : 0;
    const sessions   = scores.length;
    const lastDate   = scores.length
        ? new Date(Math.max(...scores.map(s => new Date(s.date).getTime())))
            .toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
        : "—";

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold dark:text-white">Graphiques — Scores</h1>
                <a
                    href="/scores"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline underline-offset-2"
                >
                    ← Retour au tableau
                </a>
            </div>

            {patients.length === 0 ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                    Aucun score enregistré pour l'instant.
                </div>
            ) : (
                <>
                    {/* Patient selector */}
                    <div className="flex flex-wrap gap-2">
                        {patients.map(p => (
                            <button
                                key={p.patientId}
                                onClick={() => setSelectedId(p.patientId)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150 ${
                                    selectedId === p.patientId
                                        ? "bg-primary-600 text-white border-primary-600"
                                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                                }`}
                            >
                                {p.prenom} {p.nom}
                                <span className="ml-1.5 text-xs opacity-70">({p.scores.length})</span>
                            </button>
                        ))}
                    </div>

                    {scores.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                            Aucun score enregistré pour ce patient.
                        </div>
                    ) : (
                        <>
                            {/* Stat cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard
                                    label="Score moyen"
                                    value={`${avgScore} %`}
                                    color={avgScore >= 80 ? "#16a34a" : avgScore >= 60 ? "#d97706" : "#dc2626"}
                                />
                                <StatCard
                                    label="Meilleur score"
                                    value={`${best} %`}
                                    color="#2563eb"
                                />
                                <StatCard
                                    label="Sessions"
                                    value={String(sessions)}
                                    sub={`${domaines.length} domaine${domaines.length > 1 ? "s" : ""}`}
                                />
                                <StatCard
                                    label="Dernière session"
                                    value={lastDate}
                                />
                            </div>

                            {/* Global progression */}
                            {scores.length >= 2 && (
                                <GlobalProgressChart scores={scores} />
                            )}

                            {/* Per-domain line charts */}
                            {domaines.length > 0 && (
                                <div>
                                    <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
                                        Progression par domaine
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {domaines.map(d => (
                                            <DomainLineChart
                                                key={d}
                                                domaine={d}
                                                entries={scores.filter(s => s.domaine === d)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Average by exercice */}
                            <ExerciceBarChart scores={scores} />
                        </>
                    )}
                </>
            )}
        </div>
    );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md w-full text-center">
                <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                    Une erreur est survenue
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                    {error.message || "Quelque chose s'est mal passé."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-5 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Réessayer
                    </button>
                    <Link
                        href="/"
                        className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}

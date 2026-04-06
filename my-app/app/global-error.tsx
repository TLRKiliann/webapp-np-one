"use client";

import { useEffect } from "react";

export default function GlobalError({
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
        <html lang="fr">
            <body className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
                        Erreur critique
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                        {error.message || "Une erreur inattendue s'est produite."}
                    </p>
                    <button
                        onClick={reset}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                        Réessayer
                    </button>
                </div>
            </body>
        </html>
    );
}

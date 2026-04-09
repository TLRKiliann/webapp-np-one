export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-teal-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 dark:text-indigo-300 font-medium">Chargement...</p>
        </div>
    );
}

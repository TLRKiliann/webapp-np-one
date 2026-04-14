import Link from "next/link";

export default function SecondMenu() {
    return (
        <nav className="bg-teal-600 dark:bg-slate-800 border-b border-teal-700 dark:border-slate-700">
            <ul className="list-none flex flex-row items-center justify-around text-base font-semibold text-teal-50 dark:text-slate-200 tracking-wide py-3">
                <li className="relative group">
                    <span className="cursor-default select-none border-b-2 border-transparent group-hover:text-teal-200 group-hover:border-teal-300 dark:group-hover:text-indigo-400 dark:group-hover:border-indigo-400 pb-0.5 transition-all duration-200">
                        Mémoire ▾
                    </span>
                    <ul className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:flex flex-col bg-teal-600 dark:bg-slate-900 border border-teal-500 dark:border-slate-700 rounded-lg shadow-xl min-w-max z-50 overflow-hidden">
                        <li>
                            <Link href="/memo-visio-space" className="block px-5 py-2.5 text-teal-50 dark:text-slate-200 hover:bg-teal-500 dark:hover:bg-indigo-600/20 hover:text-white dark:hover:text-indigo-300 transition-colors duration-150 whitespace-nowrap">
                                <s className="text-red-600">Mémoire et Attention Visuo-Spatiale</s>
                            </Link>
                        </li>
                        <li className="border-t border-teal-500 dark:border-slate-700">
                            <Link href="/memo-verbale" className="block px-5 py-2.5 text-teal-50 dark:text-slate-200 hover:bg-teal-500 dark:hover:bg-indigo-600/20 hover:text-white dark:hover:text-indigo-300 transition-colors duration-150 whitespace-nowrap">
                                <s className="text-red-600">Mémoire Verbale</s>
                            </Link>
                        </li>
                        <li className="border-t border-teal-500 dark:border-slate-700">
                            <Link href="/memo-travail" className="block px-5 py-2.5 text-teal-50 dark:text-slate-200 hover:bg-teal-500 dark:hover:bg-indigo-600/20 hover:text-white dark:hover:text-indigo-300 transition-colors duration-150 whitespace-nowrap">
                                Mémoire de Travail
                            </Link>
                        </li>
                    </ul>
                </li>
                <li>
                    <Link
                        href="/praxies"
                        className="hover:text-teal-200 dark:hover:text-indigo-400 border-b-2 border-transparent hover:border-teal-300 dark:hover:border-indigo-400 pb-0.5 transition-all duration-200"
                    >
                        <s className="text-red-600">Praxies</s>
                    </Link>
                </li>
                <li>
                    <Link
                        href="/language"
                        className="hover:text-teal-200 dark:hover:text-indigo-400 border-b-2 border-transparent hover:border-teal-300 dark:hover:border-indigo-400 pb-0.5 transition-all duration-200"
                    >
                        Language
                    </Link>
                </li>
                <li>
                    <Link
                        href="/aphasie"
                        className="hover:text-teal-200 dark:hover:text-indigo-400 border-b-2 border-transparent hover:border-teal-300 dark:hover:border-indigo-400 pb-0.5 transition-all duration-200"
                    >
                        <s className="text-red-600">Aphasie</s>
                    </Link>
                </li>
                <li>
                    <Link
                        href="/fonctions-executives"
                        className="hover:text-teal-200 dark:hover:text-indigo-400 border-b-2 border-transparent hover:border-teal-300 dark:hover:border-indigo-400 pb-0.5 transition-all duration-200"
                    >
                        Fonctions Executives
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

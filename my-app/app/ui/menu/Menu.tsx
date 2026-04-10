import Link from "next/link";

export default function Menu() {
    return (
        <nav className="bg-teal-700 dark:bg-slate-900 border-b border-teal-800 dark:border-slate-700">
            <ul className="list-none flex flex-row items-center justify-around text-sm text-teal-50 dark:text-slate-200 font-semibold tracking-wide py-3">
                <li>
                    <Link
                        href="/orientation-spatiale"
                        className="hover:text-teal-200 dark:hover:text-indigo-400 border-b-2 border-transparent hover:border-teal-300 dark:hover:border-indigo-400 pb-0.5 transition-all duration-200"
                    >
                        Orientation spatiale
                    </Link>
                </li>
                <li className="relative group">
                    <span className="cursor-default select-none border-b-2 border-transparent group-hover:text-teal-200 group-hover:border-teal-300 dark:group-hover:text-indigo-400 dark:group-hover:border-indigo-400 pb-0.5 transition-all duration-200">
                        Attention ▾
                    </span>
                    <ul className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:flex flex-col bg-teal-700 dark:bg-slate-800 border border-teal-400 dark:border-slate-700 rounded-lg shadow-xl min-w-max z-50 overflow-hidden">
                        <li>
                            <Link href="/attention-divisee" className="block px-5 py-2.5 text-teal-50 dark:text-slate-200 hover:bg-teal-600 dark:hover:bg-indigo-600/20 hover:text-white dark:hover:text-indigo-300 transition-colors duration-150 whitespace-nowrap">
                                Attention divisée
                            </Link>
                        </li>
                        <li className="border-t border-teal-400 dark:border-slate-700">
                            <Link href="/attention-soutenue" className="block px-5 py-2.5 text-teal-50 dark:text-slate-200 hover:bg-teal-600 dark:hover:bg-indigo-600/20 hover:text-white dark:hover:text-indigo-300 transition-colors duration-150 whitespace-nowrap">
                                Attention soutenue
                            </Link>
                        </li>
                        <li className="border-t border-teal-400 dark:border-slate-700">
                            <Link href="/attention-selective" className="block px-5 py-2.5 text-teal-50 dark:text-slate-200 hover:bg-teal-600 dark:hover:bg-indigo-600/20 hover:text-white dark:hover:text-indigo-300 transition-colors duration-150 whitespace-nowrap">
                                Attention sélective
                            </Link>
                        </li>
                    </ul>
                </li>
                <li>
                    <Link
                        href="/vitesse-traitement"
                        className="hover:text-teal-200 dark:hover:text-indigo-400 border-b-2 border-transparent hover:border-teal-300 dark:hover:border-indigo-400 pb-0.5 transition-all duration-200"
                    >
                        Vitesse de Traitement de l'Information
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

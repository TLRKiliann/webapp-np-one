import Link from "next/link";

export default function Menu() {
    return (
        <nav className="bg-green-700 dark:bg-indigo-900 border-b border-green-700 dark:border-indigo-700">
            <ul className="list-none flex flex-row items-center justify-evenly text-sm text-indigo-100 font-semibold tracking-wide py-3">
                <li>
                    <Link
                        href="/fonctions-executives"
                        className="hover:text-violet-300 border-b-2 border-transparent hover:border-violet-300 pb-0.5 transition-all duration-200"
                    >
                        Fonctions Executives
                    </Link>
                </li>
                <li className="relative group">
                    <span className="cursor-default select-none border-b-2 border-transparent group-hover:text-violet-300 group-hover:border-violet-300 pb-0.5 transition-all duration-200">
                        Mémoire ▾
                    </span>
                    <ul className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:flex flex-col bg-indigo-950 dark:bg-indigo-950 border border-indigo-700 rounded-lg shadow-xl min-w-max z-50 overflow-hidden">
                        <li>
                            <Link href="/memo-visio-space" className="block px-5 py-2.5 text-indigo-100 hover:bg-violet-700 hover:text-white transition-colors duration-150 whitespace-nowrap">
                                Mémoire et Attention Visuo-Spatiale
                            </Link>
                        </li>
                        <li className="border-t border-indigo-700">
                            <Link href="/memo-verbale" className="block px-5 py-2.5 text-indigo-100 hover:bg-violet-700 hover:text-white transition-colors duration-150 whitespace-nowrap">
                                Mémoire Verbale
                            </Link>
                        </li>
                        <li className="border-t border-indigo-700">
                            <Link href="/memo-travail" className="block px-5 py-2.5 text-indigo-100 hover:bg-violet-700 hover:text-white transition-colors duration-150 whitespace-nowrap">
                                Mémoire de Travail
                            </Link>
                        </li>
                    </ul>
                </li>
                <li>
                    <Link
                        href="/vitesse-traitement"
                        className="hover:text-violet-300 border-b-2 border-transparent hover:border-violet-300 pb-0.5 transition-all duration-200"
                    >
                        Vitesse de Traitement de l'Info
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

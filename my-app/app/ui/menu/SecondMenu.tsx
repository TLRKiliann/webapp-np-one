import Link from "next/link";

export default function SecondMenu() {
    return (
        <nav className="bg-green-600 dark:bg-indigo-800 border-b border-green-600 dark:border-indigo-700">
            <ul className="list-none flex flex-row items-center justify-evenly text-sm text-indigo-100 font-semibold tracking-wide py-3">
                <li>
                    <Link
                        href="/language"
                        className="hover:text-violet-300 border-b-2 border-transparent hover:border-violet-300 pb-0.5 transition-all duration-200"
                    >
                        Language
                    </Link>
                </li>
                <li>
                    <Link
                        href="/aphasie"
                        className="hover:text-violet-300 border-b-2 border-transparent hover:border-violet-300 pb-0.5 transition-all duration-200"
                    >
                        Aphasie
                    </Link>
                </li>
                <li className="relative group">
                    <span className="cursor-default select-none border-b-2 border-transparent group-hover:text-violet-300 group-hover:border-violet-300 pb-0.5 transition-all duration-200">
                        Attention ▾
                    </span>
                    <ul className="absolute left-1/2 -translate-x-1/2 top-full pt-2 hidden group-hover:flex flex-col bg-indigo-950 dark:bg-indigo-950 border border-indigo-700 rounded-lg shadow-xl min-w-max z-50 overflow-hidden">
                        <li>
                            <Link href="/attention-divisee" className="block px-5 py-2.5 text-indigo-100 hover:bg-violet-700 hover:text-white transition-colors duration-150 whitespace-nowrap">
                                Attention divisée
                            </Link>
                        </li>
                        <li className="border-t border-indigo-700">
                            <Link href="/attention-soutenue" className="block px-5 py-2.5 text-indigo-100 hover:bg-violet-700 hover:text-white transition-colors duration-150 whitespace-nowrap">
                                Attention soutenue
                            </Link>
                        </li>
                        <li className="border-t border-indigo-700">
                            <Link href="/attention-selective" className="block px-5 py-2.5 text-indigo-100 hover:bg-violet-700 hover:text-white transition-colors duration-150 whitespace-nowrap">
                                Attention sélective
                            </Link>
                        </li>
                    </ul>
                </li>
                <li>
                    <Link
                        href="/orientation-spatiale"
                        className="hover:text-violet-300 border-b-2 border-transparent hover:border-violet-300 pb-0.5 transition-all duration-200"
                    >
                        Orientation spatiale
                    </Link>
                </li>
                <li>
                    <Link
                        href="/praxies"
                        className="hover:text-violet-300 border-b-2 border-transparent hover:border-violet-300 pb-0.5 transition-all duration-200"
                    >
                        Praxies
                    </Link>
                </li>
            </ul>
        </nav>
    )
}

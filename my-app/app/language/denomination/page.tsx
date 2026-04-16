import Link from "next/link";

export default function DenominationPage() {

    return (
        <div>

            <h1 className="text-2xl font-bold">Dénomination</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/language/denomination/1">
                            Execrice 1: Dénomination sur confrontation visuelle
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/language/denomination/2">
                            Execrice 2: Dénomination sur définition
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/language/denomination/3">
                            <s className="text-red-500">Execrice 3: Complètement de phrase</s>
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/language/denomination/4">
                            Execrice 4: Dénomination avec amorçage
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};

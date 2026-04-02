import Link from "next/link";

export default function Comprehension() {
    return (
        <div className="p-4">

            <h1 className="text-3xl font-bold">Compréhension</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/comprehension/1">
                            Désignation → mot isolé
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/comprehension/2">
                            Questions oui/non → compréhension propositionnelle simple
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/comprehension/3">
                            Appariement phrase-image → compréhension
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/comprehension/4">
                            Exécution d'ordres → compréhension séquentielle/syntaxique complexe
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
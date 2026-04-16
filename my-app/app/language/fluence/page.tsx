import Link from "next/link";

export default function Fluence() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Fluence</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/language/fluence/1">
                            <s className="text-red-500">Fluence sémantique: Execrice 1</s>
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/language/fluence/2">
                            <s className="text-red-500">Fluence littérale: Execrice 2</s>
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/language/fluence/3">
                            Associations sémantiques: Execrice 3
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    )
}
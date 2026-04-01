import Link from "next/link";

export default function DenominationPage() {

    return (
        <div className="h-screen p-4">

            <h1 className="text-3xl font-bold">Dénomination</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/denomination/1">
                            Execrice 1
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/denomination/2">
                            Execrice 2
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/denomination/3">
                            Execrice 3
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/denomination/4">
                            Execrice 4
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};

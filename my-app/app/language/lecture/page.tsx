import Link from "next/link";

export default function Lecture() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Lecture</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/language/lecture/1">
                            Lecture de mots réguliers
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/language/lecture/2">
                            Lecture de mots irréguliers
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/language/lecture/3">
                            Lecture de pseudo-mots
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/language/lecture/4">
                            Appariement mot écrit-image
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/language/lecture/5">
                            Appariement phrase écrite-image
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
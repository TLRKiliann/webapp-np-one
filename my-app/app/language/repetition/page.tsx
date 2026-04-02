import Link from "next/link";

export default function Repetition() {
    return (
        <div className="p-4">

            <h1 className="text-3xl font-bold">Répétition</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/repetition/1">
                            Intégrité de la voie lexicale + phonologique
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/repetition/2">
                            Mémoire de travail verbale (empan)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/repetition/3">
                            Boucle phonologique pure (sans appui lexical)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/repetition/4">
                            Contourne le manque de fluence via l'hémisphère droit
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
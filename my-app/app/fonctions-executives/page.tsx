import Link from "next/link";

export default function FonctionsExecutivesPage() {
    return (
        <div className="w-auto h-screen bg-zinc-400 m-4">
            
            <h1 className="text-2xl font-bold">Fonctions Executives</h1>

            <p className="my-10">Planifier, s'adapter, inhiber les mauvaises réponses</p>

            <nav>
                <ul className="list-disc">
                    <li className="m-4">
                        <Link href="/fonctions-executives/1">
                            Trail Making B: alterner chiffres et lettres (1-A-2-B...)
                        </Link>
                    </li>
                    <li className="m-4">
                        <Link href="/fonctions-executives/2">
                            Tours de Hanoï simplifiée: déplacer des disques selon des règles
                        </Link>
                    </li>
                    <li className="m-4">
                        <Link href="/fonctions-executives/3">
                            Tri de cartes (WCST adapté): deviner la règle de tri qui change
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    )
}
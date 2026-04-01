import Link from "next/link";

export default function LanguagePage() {
    return (
        <div className="h-screen p-4">
            
            <h1 className="text-3xl font-bold">Language</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/fluence">
                            Fluence: génération de mots (catégorielle, littérale)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/denomination">
                            Dénomination: image → mot (avec ou sans indices)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/comprehension">
                            Compréhension: mot/phrase → image ou action 
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/repetition">
                            Répétition: écoute → reproduction orale
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/lecture">
                            Lecture: mot écrit → lecture orale ou association image 
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/language/ecriture">
                            Écriture: copie, dictée, production spontanée
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
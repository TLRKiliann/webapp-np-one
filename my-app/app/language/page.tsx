import Link from "next/link";

export default function Language() {
    return (
        <div>
            <h1>Language</h1>

            <ul>
                <li>
                    <Link href="/language/fluence">
                        Fluence: génération de mots (catégorielle, littérale)
                    </Link>
                </li>
                <li>
                    <Link href="/language/denomination">
                        Dénomination: image → mot (avec ou sans indices)
                    </Link>
                </li>
                <li>
                    <Link href="/language/comprehension">
                        Compréhension: mot/phrase → image ou action 
                    </Link>
                </li>
                <li>
                    <Link href="/language/repetition">
                        Répétition: écoute → reproduction orale
                    </Link>
                </li>
                <li>
                    <Link href="/language/lecture">
                        Lecture: mot écrit → lecture orale ou association image 
                    </Link>
                </li>
                <li>
                    <Link href="/language/ecriture">
                        Écriture: copie, dictée, production spontanée
                    </Link>
                </li>
            </ul>
        </div>
    )
}
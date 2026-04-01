import Link from "next/link";

export default function Fluence() {
    return (
        <div>
            <h1>Fluence</h1>

            <nav>
                <ul>
                    <li>
                        <Link href="/language/fluence/1">
                            Fluence sémantique: Execrice 1
                        </Link>
                    </li>
                    <li>
                        <Link href="/language/fluence/2">
                            Fluence littérale: Execrice 2
                        </Link>
                    </li>
                    <li>
                        <Link href="/language/fluence/3">
                            Associations sémantiques: Execrice 3
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    )
}
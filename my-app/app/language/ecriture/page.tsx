import Link from "next/link";

export default function Ecriture() {
    return (
        <div>
    
            <h1 className="text-2xl font-bold">Écriture</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/language/ecriture/1">
                            Dictée (dictée de mots réguliers - irréguliers - pseudo-mots)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/language/ecriture/2">
                            Complètement de mots écrits
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/language/ecriture/3">
                            Écriture spontanée
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
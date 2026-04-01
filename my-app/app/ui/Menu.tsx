import Link from "next/link";

export default function Menu() {
    return (
        <nav className="bg-slate-600 dark:bg-slate-700/70">
            <ul className="list-none flex flex-row items-center justify-evenly text-base text-slate-100 font-bold">
                <li className="mb-4">
                    <Link href="/fonctions-executives">Fonctions Executives</Link>
                </li>
                <li className="mb-4">
                    <Link href="/memo-visio-space">Mémoire et Attention Visio Spaciale</Link>
                </li>
                <li className="mb-4">
                    <Link href="/memo-verbale">Mémoire Verbale</Link>
                </li>
                <li className="mb-4">
                    <Link href="/memo-travail">Mémoire de Travail</Link>
                </li>
                <li className="mb-4">
                    <Link href="/attention-selective">Attention Selective</Link>
                </li>
                <li className="mb-4">
                    <Link href="/vitesse-traitement">Vitesse de Traitement de l'Info</Link>
                </li>
            </ul>
        </nav>
    )
}
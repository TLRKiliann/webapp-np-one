import Link from "next/link";

export default function Menu() {
    return (
        <nav className="bg-slate-600/80 dark:bg-slate-700/70">
            <ul className="list-none flex flex-row items-center justify-evenly text-base text-slate-100 font-bold py-4">
                <li>
                    <Link href="/fonctions-executives">Fonctions Executives</Link>
                </li>
                <li>
                    <Link href="/memo-visio-space">Mémoire et Attention Visio Spaciale</Link>
                </li>
                <li>
                    <Link href="/memo-verbale">Mémoire Verbale</Link>
                </li>
                <li>
                    <Link href="/memo-travail">Mémoire de Travail</Link>
                </li>
                <li>
                    <Link href="/vitesse-traitement">Vitesse de Traitement de l'Info</Link>
                </li>
            </ul>
        </nav>
    );
};
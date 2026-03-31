import Link from "next/link";

export default function Menu() {
    return (
        <div className="bg-slate-600 dark:bg-slate-700/70">
            <ul className="flex flex-row items-center justify-evenly">
                <li className="text-base text-slate-100 font-bold my-4">
                    <Link href="/fonctions-executives">Fonctions Executives</Link>
                </li>
                <li className="text-base text-slate-100 font-bold my-4">
                    <Link href="/memo-visio-space">Mémoire et Attention Visio Spaciale</Link>
                </li>
                <li className="text-base text-slate-100 font-bold my-4">
                    <Link href="/memo-verbale">Mémoire Verbale</Link>
                </li>
                <li className="text-base text-slate-100 font-bold my-4">
                    <Link href="/memo-travail">Mémoire de Travail</Link>
                </li>
                <li className="text-base text-slate-100 font-bold my-4">
                    <Link href="/attention-selective">Attention Selective</Link>
                </li>
                <li className="text-base text-slate-100 font-bold my-4">
                    <Link href="/vitesse-traitement">Vitesse de Traitement de l'Info</Link>
                </li>
            </ul>   
        </div>
    )
}
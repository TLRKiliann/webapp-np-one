import Link from "next/link";

export default function MemoTravailPage() {
    return (
        <div className="h-screen p-4">

            <h1 className="text-3xl font-bold">Mémoire de travail</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/boucle-phonologique">
                            Boucle phonologique (verbal/auditif)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/calepin-visuo-spatial">
                            Calepin visuo-spatial (visuel/spatial)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/admin-central">
                            Administrateur central (attention + manipulation)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/buffer-episodique">
                            Buffer épisodique (intégration multimodale)
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
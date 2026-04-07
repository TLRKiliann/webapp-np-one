import Link from "next/link";

export default function MemoTravailPage() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Mémoire de travail</h1>

            <h3 className="text-xl font-bold m-4">
                Principes communs de remédiation MDT
            </h3>

            <ul className="list-disc ml-8">
                <li>Progression par niveaux : augmenter l'empan ou la complexité graduellement</li>
                <li>Feedback immédiat : correction après chaque essai</li>
                <li>Répétition espacée : réintroduire les items à intervalles croissants</li>
                <li>Double modalité : combiner visuel + auditif pour renforcer l'encodage</li>
                <li>Charge attentionnelle contrôlée : isoler une composante avant de les combiner</li>
            </ul>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/memo-travail/boucle-phonologique">
                            Boucle phonologique (verbal/auditif)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/memo-travail/calepin-visuo-spatial">
                            Calepin visuo-spatial (visuel/spatial)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/memo-travail/admin-central">
                            Administrateur central (attention + manipulation)
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/memo-travail/buffer-episodique">
                            Buffer épisodique (intégration multimodale)
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
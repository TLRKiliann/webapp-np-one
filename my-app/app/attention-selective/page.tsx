import Link from "next/link";

export default function AttentionSelectivePage() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Attention sélective</h1>

            <p className="mt-8 ml-4">
                Les exercices de remédiation de l'attention sélective ciblent la 
                capacité à focaliser sur un stimulus pertinent en inhibant les distracteurs.    
            </p>                                                         

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/detection-cibles-visuelles">
                            Détection de cibles visuelles
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/inhibition-distracteurs">
                            Inhibition des distracteurs
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/auditive">
                            Attention sélective auditive
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/texte">
                            Attention sélective dans le texte
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/spatiale">
                            Attention sélective spatiale
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/filtrage-semantique">
                            Filtrage sémantique
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/strategie-remediation">
                            Stratégies de remédiation
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
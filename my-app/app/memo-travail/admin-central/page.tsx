import { AdminCentral } from "@/lib/memo-travail";
import Link from "next/link";

export default function AdministrateurCentralPage() {
    return (
        <div>
            
            <h1 className="text-2xl font-bold">Administrateur central</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/memo-travail/admin-central/1">
                            {AdminCentral.doubleTache.title}: {AdminCentral.doubleTache.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/memo-travail/admin-central/2">
                            {AdminCentral.nback.title}: {AdminCentral.nback.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/memo-travail/admin-central/3">
                            {AdminCentral.majmemo.title}: {AdminCentral.majmemo.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/memo-travail/admin-central/4">
                            {AdminCentral.empanlect.title}: {AdminCentral.empanlect.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/memo-travail/admin-central/5">
                            {AdminCentral.triavecinter.title}: {AdminCentral.triavecinter.description}
                        </Link>
                    </li>

                </ul>
            </nav>

        </div>
    );
};

//   3. Administrateur central (attention + manipulation)

//   ┌────────────────────┬────────────────────────────────────────────────────┐
//   │      Exercice      │                    Description                     │
//   ├────────────────────┼────────────────────────────────────────────────────┤
//   │ Double tâche       │ Réaliser deux tâches simultanées (ex. : compter +  │
//   │                    │ classer)                                           │
//   ├────────────────────┼────────────────────────────────────────────────────┤
//   │ N-back             │ Indiquer si le stimulus actuel est identique à     │
//   │                    │ celui de N étapes avant                            │
//   ├────────────────────┼────────────────────────────────────────────────────┤
//   │ Mise à jour en     │ Mémoriser une liste qui se met à jour, ne garder   │
//   │ mémoire            │ que les X derniers                                 │
//   ├────────────────────┼────────────────────────────────────────────────────┤
//   │ Empan de lecture   │ Lire des phrases + mémoriser le dernier mot de     │
//   │                    │ chacune                                            │
//   ├────────────────────┼────────────────────────────────────────────────────┤
//   │ Tri avec           │ Classer des éléments avec des distracteurs (type   │
//   │ interférence       │ Stroop)                                            │
//   └────────────────────┴────────────────────────────────────────────────────┘

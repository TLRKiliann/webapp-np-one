import Link from "next/link";

export default function BufferEpisodiquePage() {
    return (
        <div className="h-screen p-4">
            
            <h1 className="text-2xl font-bold">Buffer épisodique</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/fonctions-executives/1">
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/fonctions-executives/2">
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/fonctions-executives/3">
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};

//   4. Buffer épisodique (intégration multimodale)

//   ┌───────────────────┬─────────────────────────────────────────────────────┐
//   │     Exercice      │                     Description                     │
//   ├───────────────────┼─────────────────────────────────────────────────────┤
//   │ Rappel de scènes  │ Mémoriser une image complexe et rappeler les        │
//   │                   │ détails                                             │
//   ├───────────────────┼─────────────────────────────────────────────────────┤
//   │ Association       │ Mémoriser des paires mot-image ou mot-mot           │
//   │ paires            │                                                     │
//   ├───────────────────┼─────────────────────────────────────────────────────┤
//   │ Récit court       │ Écouter une histoire courte et rappeler les         │
//   │                   │ éléments                                            │
//   └───────────────────┴─────────────────────────────────────────────────────┘

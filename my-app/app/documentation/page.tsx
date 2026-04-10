export default function DocumentationPage() {
    return (
        <div>
            <div>
                <h1 className="text-2xl font-bold">Documentation</h1>
            </div>

            <div className="m-4">
                <h3 className="text-xl font-bold">1. Profil patient</h3>
            </div>

            <div className="ml-12">
                <nav>
                    <ul className="list-disc text-lg">
                        <li>
                            Type d'AVC (ischémique / hémorragique)
                        </li>
                        <li>
                            Localisation lésionnelle (hémisphère gauche → aphasie / droit → héminégligence)
                        </li>
                        <li>
                            Séquelles identifiées
                        </li>
                        <li>
                            Niveau de sévérité
                        </li>
                    </ul>
                </nav>
            </div>


            <div className="m-4">
                <h3 className="text-xl font-bold">2. Modules activés automatiquement selon le profil</h3>
            </div>

            <div className="ml-12">
                <nav>
                    <ul className="list-disc text-lg">
                        <li>
                            Lésion hémisphère gauche → modules langage en priorité
                        </li>
                        <li>
                            Lésion hémisphère droit → modules attention spatiale, héminégligence
                        </li>
                        <li>                                                                                                         
                            Lésion frontale → modules exécutifs 
                        </li>
                    </ul>
                </nav>
            </div>

            <div className="m-4">
                <h3 className="text-xl font-bold">3. Progression adaptative</h3>
            </div>

            <div className="ml-12">
                <nav>
                    <ul className="list-disc text-lg">
                        <li>
                            Niveaux de difficulté ajustés selon les performances
                        </li>
                        <li>
                            Feedback positif adapté (patients souvent en situation d'échec)
                        </li>
                        <li>
                            Sessions courtes (fatigabilité post-AVC élevée)
                        </li>
                        <li>
                            Fréquence recommandée : 4–6 sessions courtes (15–30 min) par semaine ; éviter la fatigue cognitive.
                        </li>
                        <li>
                            Surveiller la fatigue, l’humeur et la douleur ; arrêter si signes d’épuisement.
                        </li>
                        <li>
                            Adapter aux déficits moteurs, visuels ou aphasiques (utiliser supports visuels, réponses non verbales).
                        </li>
                        <li>
                            Travailler idéalement avec un neuropsychologue ou orthophoniste ; impliquer la famille pour la généralisation.
                        </li>
                    </ul>
                </nav>
            </div>

            <div className="m-4">
                <h3 className="text-xl font-bold">4. Sécurité et précautions</h3>
            </div>

            <div className="ml-12">
                <nav>
                    <ul className="list-disc text-lg">
                        <li>
                            Fréquence recommandée : 4–6 sessions courtes (15–30 min) par semaine ; éviter la fatigue cognitive.
                        </li>
                        <li>
                            Surveiller la fatigue, l’humeur et la douleur ; arrêter si signes d’épuisement.
                        </li>
                        <li>
                            Adapter aux déficits moteurs, visuels ou aphasiques (utiliser supports visuels, réponses non verbales).
                        </li>
                        <li>
                            Travailler idéalement avec un neuropsychologue ou orthophoniste ; impliquer la famille pour la généralisation.
                        </li>
                    </ul>
                </nav>
            </div>

            <div className="m-4">
                <h3 className="text-xl font-bold">5. Suivi pour le thérapeute</h3>
            </div>

            <div className="ml-12">
                <nav>
                    <ul className="list-disc text-lg">
                        <li>
                            Tableau de bord des performances
                        </li>
                        <li>
                            Export des résultats pour le neurologue / orthophoniste / neuropsychologue
                        </li>
                        <li>
                            Comparaison des sessions dans le temps
                        </li>
                    </ul>
                </nav>
            </div>

        </div>
    );
};
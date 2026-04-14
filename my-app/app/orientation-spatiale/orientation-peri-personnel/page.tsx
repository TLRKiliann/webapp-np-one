import Link from "next/link";
import { OrientationPeri } from "@/lib/orientation-spatiale";

export default function OrientationPeriPersonnelPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Orientation dans l'espace péri-personne</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/orientation-peri-personnel/1">
                            {OrientationPeri.relationTopo.title}: {OrientationPeri.relationTopo.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/orientation-peri-personnel/2">
                            {OrientationPeri.copyFigureOrient.title}: {OrientationPeri.copyFigureOrient.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/orientation-peri-personnel/3">
                            {OrientationPeri.bissectionLignes.title}: {OrientationPeri.bissectionLignes.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/orientation-peri-personnel/4">
                            {OrientationPeri.barrageCibles.title}: {OrientationPeri.barrageCibles.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/orientation-peri-personnel/5">
                            {OrientationPeri.reperageSurGrille.title}: {OrientationPeri.reperageSurGrille.description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
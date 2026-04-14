import Link from "next/link";
import { RotaTransMental } from "@/lib/orientation-spatiale";

export default function RotationTransMentalePage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Rotation et transformation mentale</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/rotation-transformation-mentale/1">
                            {RotaTransMental.rotaMentalObj.title}: {RotaTransMental.rotaMentalObj.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/rotation-transformation-mentale/2">
                            {RotaTransMental.perspecSpatiale.title}: {RotaTransMental.perspecSpatiale.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/rotation-transformation-mentale/3">
                            {RotaTransMental.cubeShepard.title}: {RotaTransMental.cubeShepard.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/rotation-transformation-mentale/4">
                            {RotaTransMental.depilageSolides.title}: {RotaTransMental.depilageSolides.description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
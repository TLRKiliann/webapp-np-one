import Link from "next/link";
import { OrientationCorpo } from "@/lib/orientation-spatiale";

export default function OrientationCorpsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Orientation sur le corps (espace corporel)</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/orientation-corps/1">
                            {OrientationCorpo.droiteGaucheSoi.title}: {OrientationCorpo.droiteGaucheSoi.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/orientation-corps/2">
                            {OrientationCorpo.droiteGaucheAutre.title}: {OrientationCorpo.droiteGaucheAutre.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/orientation-corps/3">
                            {OrientationCorpo.schemaCorp.title}: {OrientationCorpo.schemaCorp.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/orientation-corps/4">
                            {OrientationCorpo.imitationPosture.title}: {OrientationCorpo.imitationPosture.description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
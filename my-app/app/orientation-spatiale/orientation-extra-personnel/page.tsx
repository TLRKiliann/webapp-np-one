import Link from "next/link";
import { OrientationExtra } from "@/lib/orientation-spatiale";

export default function OrientationExtraPersonnelPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Orientation dans l'espace extra-personnel (navigation)</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-extra-personnel/1">
                            {OrientationExtra.planLieuFam.title}: {OrientationExtra.planLieuFam.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-extra-personnel/2">
                            {OrientationExtra.lectureCarte.title}: {OrientationExtra.lectureCarte.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-extra-personnel/3">
                            {OrientationExtra.apprenTrajVirtuel.title}: {OrientationExtra.apprenTrajVirtuel.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-extra-personnel/4">
                            {OrientationExtra.orientPointRepere.title}: {OrientationExtra.orientPointRepere.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-extra-personnel/5">
                            {OrientationExtra.estimationDistance.title}: {OrientationExtra.estimationDistance.description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
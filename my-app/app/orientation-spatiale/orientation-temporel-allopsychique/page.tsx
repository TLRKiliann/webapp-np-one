import Link from "next/link";
import { OrientationTempAllo } from "@/lib/orientation-spatiale";

export default function OrientationTemporelAlloPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Orientation temporelle et allopsychique</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-temporel-allopsychique/1">
                            {OrientationTempAllo.orientTempoSpatiale.title}: {OrientationTempAllo.orientTempoSpatiale.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-temporel-allopsychique/2">
                            {OrientationTempAllo.reorderEvents.title}: {OrientationTempAllo.reorderEvents.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/orientation-spatiale/orientation-temporel-allopsychique/3">
                            {OrientationTempAllo.calendarInteractif.title}: {OrientationTempAllo.calendarInteractif.description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};                                      

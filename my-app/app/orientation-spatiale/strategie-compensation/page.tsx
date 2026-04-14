import { StrategieComp } from "@/lib/orientation-spatiale";
import Link from "next/link";

export default function StrategieCompensation() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Stratégie compensatoire</h1>

            <p></p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/strategie-compensation/1">
                            {StrategieComp.ancrageCorpo.title}: {StrategieComp.ancrageCorpo.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/strategie-compensation/2">
                            {StrategieComp.verbaTrajet.title}: {StrategieComp.verbaTrajet.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/strategie-compensation/3">
                            {StrategieComp.pointRepSail.title}: {StrategieComp.pointRepSail.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/orientation-spatiale/strategie-compensation/4">
                            {StrategieComp.exploSytem.title}: {StrategieComp.exploSytem.description}
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
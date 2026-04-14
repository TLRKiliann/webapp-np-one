import { DetectionCiblesVisu } from "@/lib/attention-selective";
import Link from "next/link";

export default function DetectionCiblesVisuellesPage() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Détection de cibles visuelles</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/detection-cibles-visuelles/1">
                            {DetectionCiblesVisu.barrageSimple.title} {DetectionCiblesVisu.barrageSimple.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/detection-cibles-visuelles/2">
                            {DetectionCiblesVisu.barrageDouble.title} {DetectionCiblesVisu.barrageDouble.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/detection-cibles-visuelles/3">
                            {DetectionCiblesVisu.rechVisuSimple.title} {DetectionCiblesVisu.rechVisuSimple.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/detection-cibles-visuelles/4">
                            {DetectionCiblesVisu.rechVisuConjonct.title} {DetectionCiblesVisu.rechVisuConjonct.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/detection-cibles-visuelles/5">
                            {DetectionCiblesVisu.oddOneOut.title} {DetectionCiblesVisu.oddOneOut.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
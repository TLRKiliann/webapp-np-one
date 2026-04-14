import { AttSelectSpatiale } from "@/lib/attention-selective";
import Link from "next/link";

export default function AttSelectpatialePage() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Attention sélective spatiale</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/spatiale/1">
                            {AttSelectSpatiale.paradiPosner.title} {AttSelectSpatiale.paradiPosner.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/spatiale/2">
                            {AttSelectSpatiale.fenAttention.title} {AttSelectSpatiale.fenAttention.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/spatiale/3">
                            {AttSelectSpatiale.exploSystematic.title} {AttSelectSpatiale.exploSystematic.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/spatiale/4">
                            {AttSelectSpatiale.extinctionVisu.title} {AttSelectSpatiale.extinctionVisu.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
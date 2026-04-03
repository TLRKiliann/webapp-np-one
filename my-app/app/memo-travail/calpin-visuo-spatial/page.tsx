import { calpinvisuospatial } from "@/lib/memo-travail";
import Link from "next/link";

export default function CalpinVisuoSpatialPage() {
    return (
        <div className="h-screen p-4">
            
            <h1 className="text-2xl font-bold">Boucle phonologique (verbal/auditif)</h1>

            <p className="my-10">Planifier, s'adapter, inhiber les mauvaises réponses</p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/calpin-visuo-spatial/1">
                            {calpinvisuospatial.empanCorsi.title}: {calpinvisuospatial.empanCorsi.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/calpin-visuo-spatial/2">
                            {calpinvisuospatial.memoPosition.title}: {calpinvisuospatial.memoPosition.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/calpin-visuo-spatial/3">
                            {calpinvisuospatial.rotationMentale.title}: {calpinvisuospatial.rotationMentale.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/calpin-visuo-spatial/4">
                            {calpinvisuospatial.labyrintheMemo.title}: {calpinvisuospatial.labyrintheMemo.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/calpin-visuo-spatial/5">
                            {calpinvisuospatial.matrixPattern.title}: {calpinvisuospatial.matrixPattern.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
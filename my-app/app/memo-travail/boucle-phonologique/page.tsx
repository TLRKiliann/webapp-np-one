import { bouclephonologique } from "@/lib/memo-travail";
import Link from "next/link";

export default function bouclephonologiquePage() {
    return (
        <div className="h-screen p-4">
            
            <h1 className="text-2xl font-bold">Boucle phonologique (verbal/auditif)</h1>

            <p className="my-10">Planifier, s'adapter, inhiber les mauvaises réponses</p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/boucle-phonologique/1">
                            {bouclephonologique.empanEndroit.title}: {bouclephonologique.empanEndroit.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/boucle-phonologique/2">
                            {bouclephonologique.empanEnvers.title}: {bouclephonologique.empanEnvers.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/boucle-phonologique/3">
                            {bouclephonologique.empanMots.title}: {bouclephonologique.empanMots.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/boucle-phonologique/4">
                            {bouclephonologique.rappelSeriel.title}: {bouclephonologique.rappelSeriel.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/memo-travail/boucle-phonologique/5">
                            {bouclephonologique.ecouteDichotic.title}: {bouclephonologique.ecouteDichotic.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
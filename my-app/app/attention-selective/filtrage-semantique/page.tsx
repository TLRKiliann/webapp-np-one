import { FiltrageSemantic } from "@/lib/attention-selective";
import Link from "next/link";

export default function FiltrageSemantiquePage() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Filtrage sémantique</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/filtrage-semantique/1">
                            {FiltrageSemantic.categoriRapide.title} {FiltrageSemantic.categoriRapide.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/filtrage-semantique/2">
                            {FiltrageSemantic.decisionLexiSelect.title} {FiltrageSemantic.decisionLexiSelect.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/filtrage-semantique/3">
                            {FiltrageSemantic.triSelectif.title} {FiltrageSemantic.triSelectif.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/filtrage-semantique/4">
                            {FiltrageSemantic.jugmntSemanticDistra.title} {FiltrageSemantic.jugmntSemanticDistra.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
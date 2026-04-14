import { AttSelectAuditive } from "@/lib/attention-selective";
import Link from "next/link";

export default function AuditivePage() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Attention sélective auditive</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/auditive/1">
                            {AttSelectAuditive.cocktailParty.title} {AttSelectAuditive.cocktailParty.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/auditive/2">
                            {AttSelectAuditive.dectectionMotCible.title} {AttSelectAuditive.dectectionMotCible.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/auditive/3">
                            {AttSelectAuditive.discriAudiAvecB.title} {AttSelectAuditive.discriAudiAvecB.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/attention-selective/auditive/4">
                            {AttSelectAuditive.ecouSelectDicho.title} {AttSelectAuditive.ecouSelectDicho.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
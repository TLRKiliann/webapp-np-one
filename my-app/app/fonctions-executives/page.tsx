import { fonctionsExecutivesLib } from "@/lib/fonction-executives";
import Link from "next/link";

export default function FonctionsExecutivesPage() {
    return (
        <div className="h-screen p-4">
            
            <h1 className="text-2xl font-bold">Fonctions Executives</h1>

            <p className="my-10">Planifier, s'adapter, inhiber les mauvaises réponses</p>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/fonctions-executives/1">
                            {fonctionsExecutivesLib.trailMakingB.title}: {fonctionsExecutivesLib.trailMakingB.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/fonctions-executives/2">
                            {fonctionsExecutivesLib.hanoi.title}: {fonctionsExecutivesLib.hanoi.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-green-500 mb-2">
                        <Link href="/fonctions-executives/3">
                            {fonctionsExecutivesLib.tricartes.title}: {fonctionsExecutivesLib.tricartes.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
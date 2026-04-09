import { DetectionCiblesVisu, InhibitionDistract } from "@/lib/attention-selective";
import Link from "next/link";

export default function InhibitionDistracteursPage() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Inhibition des distracteurs</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/inhibition-distracteurs/1">
                            {InhibitionDistract.stroopCouleurMot.title} {InhibitionDistract.stroopCouleurMot.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/inhibition-distracteurs/2">
                            {InhibitionDistract.stroopSpatial.title} {InhibitionDistract.stroopSpatial.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/inhibition-distracteurs/3">
                            {InhibitionDistract.flankerTask.title} {InhibitionDistract.flankerTask.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/inhibition-distracteurs/4">
                            {InhibitionDistract.simonTask.title} {InhibitionDistract.simonTask.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/inhibition-distracteurs/4">
                            {InhibitionDistract.negativePriming.title} {InhibitionDistract.negativePriming.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
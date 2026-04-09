import { AttSelectText } from "@/lib/attention-selective";
import Link from "next/link";

export default function AttSelectTextPage() {
    return (
        <div>

            <h1 className="text-2xl font-bold">Attention sélective dans le texte</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/texte/1">
                            {AttSelectText.lectureSelect.title} {AttSelectText.lectureSelect.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/texte/2">
                            {AttSelectText.detectionErreurs.title} {AttSelectText.detectionErreurs.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/texte/3">
                            {AttSelectText.surlignageSelect.title} {AttSelectText.surlignageSelect.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-emerald-500 mb-2">
                        <Link href="/attention-selective/texte/4">
                            {AttSelectText.lectureAvecDistract.title} {AttSelectText.lectureAvecDistract.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
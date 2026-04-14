import { BufferEpisodique } from "@/lib/memo-travail";
import Link from "next/link";

export default function BufferEpisodiquePage() {
    return (
        <div>
            
            <h1 className="text-2xl font-bold">Buffer épisodique</h1>

            <nav className="mt-8 ml-8">
                <ul className="list-disc">
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/memo-travail/buffer-episodique/1">
                            {BufferEpisodique.associationPaires.title}: {BufferEpisodique.associationPaires.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/memo-travail/buffer-episodique/2">
                            {BufferEpisodique.rappelScenes.title}: {BufferEpisodique.rappelScenes.description}
                        </Link>
                    </li>
                    <li className="text-xl hover:text-teal-500 dark:hover:text-indigo-400 mb-2">
                        <Link href="/memo-travail/buffer-episodique/3">
                            {BufferEpisodique.recitCourt.title}: {BufferEpisodique.recitCourt.description}
                        </Link>
                    </li>
                </ul>
            </nav>

        </div>
    );
};
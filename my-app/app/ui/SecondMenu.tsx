import Link from "next/link";

export default function SecondMenu() {
    return (
        <nav className="bg-slate-600 dark:bg-slate-700/70">
            <ul className="list-none flex flex-row items-center justify-evenly text-base text-slate-100 font-bold py-4">
                <li>
                    <Link href="/language">Language</Link>
                </li>
                <li>
                    <Link href="/attention-divisee">Attention divisee</Link>
                </li>
                <li>
                    <Link href="/attention-soutenue">Attention soutenue</Link>
                </li>
                <li>
                    <Link href="/attention-selective">Attention selective</Link>
                </li>
                <li>
                    <Link href="/orientation-spatiale">Orientation spaciale</Link>
                </li>
                <li>
                    <Link href="/praxies">Praxies</Link>
                </li>
            </ul>
        </nav>
    )
}
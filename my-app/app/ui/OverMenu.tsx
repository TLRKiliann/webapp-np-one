import Link from "next/link";
import DarkModeToggle from "./DarkModeToggle";

export default function OverMenu() {
    return (
        <nav className="bg-slate-600 dark:bg-slate-700/70">
            <ul className="list-none flex flex-row items-center justify-evenly text-base text-slate-100 font-bold">
                <li className="my-4">
                    <Link href="">
                        Patient
                    </Link>
                </li>
                <li className="my-4">
                    <Link href="">
                        Score
                    </Link>
                </li>
                <li className="my-4">
                    <Link href="">
                        Login
                    </Link>
                </li>
                <li className="my-4">
                    <Link href="">
                        English
                    </Link>
                </li>
                <li className="my-4">
                    <DarkModeToggle />
                </li>
            </ul>
        </nav>
    )
}
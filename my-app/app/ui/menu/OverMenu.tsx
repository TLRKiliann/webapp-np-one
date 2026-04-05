import Link from "next/link";
import DarkModeToggle from "../DarkModeToggle";
import { MdHome } from "react-icons/md";

export default function OverMenu() {
    return (
        <nav className="bg-indigo-950 dark:bg-indigo-950 border-b border-indigo-800">
            <ul className="list-none flex flex-row items-center text-sm text-indigo-100 font-medium tracking-wide px-6">
                <li className="flex flex-1 justify-evenly items-center py-3">
                    <Link href="/" className="hover:text-violet-300 transition-colors duration-200">
                        <MdHome size={20} />
                    </Link>
                    <Link href="" className="hover:text-violet-300 transition-colors duration-200">
                        Patient
                    </Link>
                    <Link href="" className="hover:text-violet-300 transition-colors duration-200">
                        Score
                    </Link>
                </li>
                <li className="flex items-center gap-6 py-3">
                    <Link href="/login" className="hover:text-violet-300 transition-colors duration-200">
                        Login
                    </Link>
                    <Link href="" className="hover:text-violet-300 transition-colors duration-200">
                        EN/FR
                    </Link>
                    <DarkModeToggle />
                </li>
            </ul>
        </nav>
    )
}

import Link from "next/link";
import DarkModeToggle from "../DarkModeToggle";
import { MdHome } from "react-icons/md";
import { auth, signOut } from "@/auth";

export default async function OverMenu() {
    const session = await auth();

    return (
        <nav className="bg-teal-800 dark:bg-slate-950 border-b border-teal-900 dark:border-slate-800">
            <ul className="list-none flex flex-row items-center text-sm text-teal-50 dark:text-slate-200 font-medium tracking-wide px-6 py-3">
                <li className="flex flex-1 justify-around items-center">
                    <Link href="/" className="hover:text-teal-300 dark:hover:text-indigo-400 transition-colors duration-200">
                        <MdHome size={20} />
                    </Link>
                    <Link href="/patient" className="hover:text-teal-300 dark:hover:text-indigo-400 transition-colors duration-200">
                        Patient
                    </Link>
                    <Link href="/scores" className="hover:text-teal-300 dark:hover:text-indigo-400 transition-colors duration-200">
                        Scores
                    </Link>
                    <Link href="/documentation" className="hover:text-teal-300 dark:hover:text-indigo-400 transition-colors duration-200">
                        Documentation
                    </Link>
                </li>
                <li className="flex items-center gap-6">
                    {session ? (
                        <form action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/login" });
                        }}>
                            <button
                                type="submit"
                                className="hover:text-teal-300 dark:hover:text-indigo-400 transition-colors duration-200 cursor-pointer"
                            >
                                Logout
                            </button>
                        </form>
                    ) : (
                        <Link href="/login" className="hover:text-teal-300 dark:hover:text-indigo-400 transition-colors duration-200">
                            Login
                        </Link>
                    )}
                    <Link href="" className="hover:text-teal-300 dark:hover:text-indigo-400 transition-colors duration-200">
                        EN/FR
                    </Link>
                    <DarkModeToggle />
                </li>
            </ul>
        </nav>
    )
}

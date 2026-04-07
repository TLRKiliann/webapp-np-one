import Link from "next/link";
import DarkModeToggle from "../DarkModeToggle";
import { MdHome } from "react-icons/md";
import { auth, signOut } from "@/auth";

export default async function OverMenu() {
    const session = await auth();

    return (
        <nav className="bg-green-800 dark:bg-indigo-950 border-b border-green-800 dark:border-indigo-800">
            <ul className="list-none flex flex-row items-center text-sm text-emerald-50 dark:text-indigo-100 font-medium tracking-wide px-6 py-3">
                <li className="flex flex-1 justify-around items-center">
                    <Link href="/" className="hover:text-emerald-500 dark:hover:text-violet-300 transition-colors duration-200">
                        <MdHome size={20} />
                    </Link>
                    <Link href="/patient" className="hover:text-emerald-500 dark:hover:text-violet-300 transition-colors duration-200">
                        Patient
                    </Link>
                    <Link href="/scores" className="hover:text-emerald-500 dark:hover:text-violet-300 transition-colors duration-200">
                        Score
                    </Link>
                    <Link href="/documentation" className="hover:text-emerald-500 dark:hover:text-violet-300 transition-colors duration-200">
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
                                className="hover:text-emerald-500 dark:hover:text-violet-300 transition-colors duration-200 cursor-pointer"
                            >
                                Logout
                            </button>
                        </form>
                    ) : (
                        <Link href="/login" className="hover:text-emerald-500 dark:hover:text-violet-300 transition-colors duration-200">
                            Login
                        </Link>
                    )}
                    <Link href="" className="hover:text-emerald-500 dark:hover:text-violet-300 transition-colors duration-200">
                        EN/FR
                    </Link>
                    <DarkModeToggle />
                </li>
            </ul>
        </nav>
    )
}

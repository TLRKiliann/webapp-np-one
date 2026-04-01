"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return <span className="w-8 h-5 block" />;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-slate-100 font-bold hover:text-white transition-colors"
            aria-label="Toggle dark mode"
        >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
    );
}

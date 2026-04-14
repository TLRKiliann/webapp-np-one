"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type SignInResult = {
  error?: string;
  status?: number;
  ok?: boolean;
} | undefined;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    }) as SignInResult;

    setLoading(false);

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
    } else {
      router.push("/patient");
      router.refresh();
    }
  }

  return (
    <div className="min-h-[calc(100vh-250px)] flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="w-full max-w-sm p-8 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white text-center">
          Connexion
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="admin@demo.fr"
              required
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              placeholder="admin123"
              required
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-base font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-500 dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:active:bg-indigo-600 rounded-lg py-2 mt-2 transition disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

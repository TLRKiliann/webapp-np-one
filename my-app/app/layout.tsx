import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Neuro-Psy-One",
  description: "WebApp Neuro-Psy pour remédiation cognitive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">
        <div className="bg-zinc-50 font-sans dark:bg-black p-10">
          <main className="w-full h-screen p-4 bg-zinc-400 dark:bg-black">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

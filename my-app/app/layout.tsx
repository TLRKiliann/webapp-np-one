import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import OverMenu from "./ui/OverMenu";
import Menu from "./ui/Menu";
import ThemeProvider from "./ui/ThemeProvider";
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
  description: "WebApp Neuro-Psy de remédiation cognitive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <main className="w-full h-full text-slate-800 dark:text-white bg-white dark:bg-black">
            <OverMenu />
            <Menu />
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

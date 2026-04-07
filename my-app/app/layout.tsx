import type { Metadata } from "next";
import OverMenu from "./ui/menu/OverMenu";
import Menu from "./ui/menu/Menu";
import SecondMenu from "./ui/menu/SecondMenu";
import ThemeProvider from "./ui/ThemeProvider";
import "./globals.css";

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
          <OverMenu />
          <Menu />
          <SecondMenu />
          <main className="w-full min-h-[calc(100vh-135px)] text-emerald-700 dark:text-white bg-white dark:bg-indigo-950 p-4">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

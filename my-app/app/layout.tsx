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
          <main className="w-full h-full text-slate-800 dark:text-white bg-white dark:bg-slate-900">
            <OverMenu />
            <Menu />
            <SecondMenu />
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

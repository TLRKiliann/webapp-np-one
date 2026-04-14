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
          <main className="w-full min-h-[calc(100vh-150px)] text-teal-800 dark:text-indigo-100 bg-[#f8fafc] dark:bg-[#0f0e1a] p-10">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

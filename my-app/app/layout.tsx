import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import Menu from "./ui/Menu";
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
    <html lang="en">
      <body className="min-h-full flex flex-col">
        <main className="w-full h-screen dark:bg-black">
          <Menu />
          {children}
        </main>
      </body>
    </html>
  );
}

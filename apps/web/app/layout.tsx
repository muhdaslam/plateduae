import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Plated",
  description: "Search food by dish, not by restaurant, and compare what it costs nearby.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans text-ink-900">
        <header className="border-b border-ink-300 bg-white">
          <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
            <Link href="/" className="text-xl font-bold tracking-tight text-brand-600">
              Plated
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

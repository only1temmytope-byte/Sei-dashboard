
import "./globals.css";
import React from "react";
import Image from "next/image";

export const metadata = {
  title: "Sei dashboard by Temmy",
  description: "TVL and trending tokens on Sei",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen w-full bg-zinc-50 text-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <header className="mb-6 sm:mb-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="sei logo" width={160} height={36} priority />
              </div>
              <a href="https://www.sei.io/" target="_blank" rel="noreferrer" className="text-xs sm:text-sm text-seired hover:underline font-medium">
                sei website
              </a>
            </div>
            <div className="mt-2 h-1 w-full bg-seired/20 rounded-full"><div className="h-1 w-1/3 bg-seired rounded-full" /></div>
          </header>
          {children}
          <footer className="mt-12 text-xs text-zinc-500 space-y-1">
            <p>data from defillama and geckoterminal.</p>
            <p>built by <a href="https://x.com/only1temmy" target="_blank" rel="noreferrer" className="text-seired hover:underline font-semibold">@only1temmy</a> 🚀</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

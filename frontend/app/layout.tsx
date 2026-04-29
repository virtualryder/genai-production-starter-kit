import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "GenAI Production Starter Kit",
  description:
    "Production-ready RAG pipeline with security guardrails, re-ranking, and agent routing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          {/* Offset for mobile header */}
          <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

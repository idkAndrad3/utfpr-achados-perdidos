import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ToastProvider";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Achados e Perdidos — UTFPR",
  description: "Sistema oficial de Achados e Perdidos da UTFPR",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <Header session={session} />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}

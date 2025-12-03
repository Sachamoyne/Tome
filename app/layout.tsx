import "./globals.css";
import Navbar from "../components/navbar";
import { Playfair_Display, Inter } from "next/font/google";

// Configuration des polices
const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Tome",
  description: "Votre journal de lecture social",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans antialiased">
        <Navbar />
        {/* Correction : suppression du doublon {children} et ajout d'une marge haute pour la navbar sticky */}
        <main className="w-full max-w-5xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
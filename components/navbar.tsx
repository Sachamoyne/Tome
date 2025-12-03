"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Fonction pour styliser le lien actif
  const linkStyle = (path: string) => 
    `text-sm tracking-wide transition-colors duration-200 ${
      pathname === path 
        ? "text-[var(--color-primary)] font-medium" 
        : "text-[var(--color-text)] hover:text-[var(--color-primary)]"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--color-muted)] bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-2xl font-bold tracking-tight text-[var(--color-text)]"
        >
          Tome
        </Link>

        {/* Liens de navigation */}
        <div className="flex items-center gap-8">
          <Link href="/livres" className={linkStyle("/livres")}>
            MES LIVRES
          </Link>
          <Link href="/amis" className={linkStyle("/amis")}>
            AMIS
          </Link>
          <Link href="/profil" className={linkStyle("/profil")}>
            PROFIL
          </Link>
        </div>
      </div>
    </nav>
  );
}
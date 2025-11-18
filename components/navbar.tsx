"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)] font-serif">
      <Link
        href="/"
        className="text-2xl font-semibold tracking-tight text-[var(--color-text)] hover:text-[var(--color-accent)]"
      >
        Livrebox
      </Link>

      <div className="flex flex-row items-center gap-10 text-lg">
        <Link
          href="/livres"
          className="text-[var(--color-text)] hover:text-[var(--color-accent)]"
        >
          Mes livres
        </Link>
        <Link
          href="/amis"
          className="text-[var(--color-text)] hover:text-[var(--color-accent)]"
        >
          Amis
        </Link>
        <Link
          href="/profil"
          className="text-[var(--color-text)] hover:text-[var(--color-accent)]"
        >
          Profil
        </Link>
      </div>
    </nav>
  );
}

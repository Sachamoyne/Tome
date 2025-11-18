import "./globals.css";
import Navbar from "../components/navbar";

export const metadata = {
  title: "Livrebox",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-serif">
        <Navbar />
        <main className="w-full px-8">{children}</main>
          {children}
      </body>
    </html>
  );
}

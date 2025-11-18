"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LivresPage() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchBooks = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setBooks(data || []);
      setLoading(false);
    };

    fetchBooks();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}`
    );
    const data = await res.json();
    setResults(data.items || []);
  };

  const handleAdd = async (book: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const info = book.volumeInfo;

    const { data, error } = await supabase
      .from("books")
      .insert([
        {
          user_id: user.id,
          title: info.title || "Sans titre",
          author: info.authors?.join(", ") || "Auteur inconnu",
          cover_url: info.imageLinks?.thumbnail || null,
          notes: info.description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase.from("posts").insert([
      {
        user_id: user.id,
        book_id: data.id,
        book_title: data.title,
        book_author: data.author,
        book_cover_url: data.cover_url,
        rating: null,
        comment: null,
      },
    ]);

    router.push(`/livres/${data.id}`);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (!error) {
      setBooks(books.filter((b) => b.id !== id));
    }
  };

  if (loading)
    return (
      <p className="text-center text-[var(--color-text)]/50 font-serif py-12">
        Chargement…
      </p>
    );

  return (
    <main className="max-w-7xl mx-auto px-4 pt-10 font-serif">
      <h1 className="text-4xl font-bold mb-6">Mes livres</h1>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="mb-10">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un livre…"
            className="flex-1 px-4 py-3 border border-[var(--color-border)] bg-white/60 text-[var(--color-text)] font-serif rounded-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[var(--color-accent)] text-white font-serif rounded-sm hover:opacity-90 transition-opacity"
          >
            Rechercher
          </button>
        </div>
      </form>

      {/* Résultats de recherche */}
      {results.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-serif font-medium text-[var(--color-text)] mb-4">
            Résultats de recherche
          </h2>
          <div className="flex flex-col gap-4">
            {results.map((book) => {
              const info = book.volumeInfo;
              return (
                <div
                  key={book.id}
                  className="border border-[var(--color-border)] p-4 bg-white/60 flex gap-4 items-center hover:bg-[var(--color-muted)] transition"
                >
                  {info.imageLinks?.thumbnail && (
                    <img
                      src={info.imageLinks.thumbnail}
                      alt={info.title}
                      className="w-16 h-24 object-cover border border-[var(--color-border)]"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-serif font-semibold text-lg text-[var(--color-text)]">
                      {info.title}
                    </p>
                    <p className="font-serif text-sm text-[var(--color-text)]/60 mt-1">
                      {info.authors?.join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(book)}
                    className="px-4 py-2 bg-[var(--color-accent)] text-white font-serif rounded-sm hover:opacity-90 transition-opacity"
                  >
                    Ajouter
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bibliothèque */}
      <h2 className="text-2xl mt-10 mb-4 font-serif">Ma bibliothèque</h2>

      {books.length === 0 ? (
        <p className="text-center text-[var(--color-text)]/50 py-12">
          Aucun livre dans votre bibliothèque.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-6">
          {books.map((book) => (
            <article
              key={book.id}
              className="flex flex-col border border-[var(--color-border)] bg-white/70 rounded-sm shadow hover:shadow-md transition w-full max-w-[260px] mx-autoflex flex-col border border-[var(--color-border)] bg-white/70 rounded-sm shadow hover:shadow-md transition w-[180px] sm:w-[200px] lg:w-[220px] mx-auto"
            >
              {/* Image */}
              <div className="w-full aspect-[2/3] bg-[var(--color-muted)] flex items-center justify-center border-b border-[var(--color-border)]">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[var(--color-text)]/50 text-sm font-serif">
                    Pas d’image
                  </span>
                )}
              </div>


              {/* Contenu */}
              <div className="p-4 flex flex-col gap-2">
                <Link
                  href={`/livres/${book.id}`}
                  className="text-lg font-serif font-semibold hover:text-[var(--color-accent)]"
                >
                  {book.title}
                </Link>

                <p className="text-sm font-serif text-[var(--color-text)]">
                  {book.author}
                </p>

                {book.rating && (
                  <p className="text-sm font-serif mt-1">
                    Note : {book.rating}/5
                  </p>
                )}

                {book.comment && (
                  <p className="text-xs italic font-serif">
                    “{book.comment}”
                  </p>
                )}

                <button
                  onClick={() => handleDelete(book.id)}
                  className="mt-4 self-end px-3 py-1 text-xs border border-[var(--color-border)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] rounded-sm"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {message && (
        <p className="mt-6 text-sm text-[var(--color-accent)]">{message}</p>
      )}
    </main>
  );
}

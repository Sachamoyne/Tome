"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Search, Trash2, BookOpen, Loader2, CheckCircle, Clock } from "lucide-react";

interface LibraryBook {
  post_id: string;
  book_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  rating: number | null;
  comment: string | null;
  status: string; // 'lu' ou 'envie'
}

export default function LivresPage() {
  const router = useRouter();
  
  // États
  const [library, setLibrary] = useState<LibraryBook[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  
  // Onglet actif : 'lu' ou 'envie'
  const [activeTab, setActiveTab] = useState<'lu' | 'envie'>('lu');

  // CHARGEMENT
  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formattedBooks: LibraryBook[] = data.map((post: any) => ({
        post_id: post.id,
        book_id: post.book_id,
        title: post.book_title,
        author: post.book_author,
        cover_url: post.book_cover_url,
        rating: post.rating,
        comment: post.comment,
        status: post.status || 'lu', // Par défaut 'lu' si null
      }));
      setLibrary(formattedBooks);
    }
    setLoading(false);
  };

  // RECHERCHE GOOGLE
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setResults([]);
    
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=fr`
      );
      const data = await res.json();
      setResults(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // AJOUT LIVRE (Avec choix du statut)
  const handleAdd = async (googleBook: any, targetStatus: 'lu' | 'envie') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const googleId = googleBook.id;
    setAddingId(googleId);

    try {
      // 1. Check / Création du Livre Global
      let { data: existingBook } = await supabase
        .from("books")
        .select("id")
        .eq("google_id", googleId)
        .maybeSingle();

      let bookId = existingBook?.id;

      if (!bookId) {
        const info = googleBook.volumeInfo;
        let coverUrl = info.imageLinks?.thumbnail || null;
        if (coverUrl) coverUrl = coverUrl.replace("http://", "https://");

        const { data: newBook, error: createError } = await supabase
          .from("books")
          .insert([{
            title: info.title || "Sans titre",
            author: info.authors?.join(", ") || "Auteur inconnu",
            cover_url: coverUrl,
            description: info.description || "",
            google_id: googleId,
          }])
          .select()
          .single();

        if (createError) throw createError;
        bookId = newBook.id;
      }

      // 2. Création du Post (Lien User-Livre) avec le STATUT
      const info = googleBook.volumeInfo;
      const { error: postError } = await supabase.from("posts").insert([
        {
          user_id: user.id,
          book_id: bookId,
          book_title: info.title,
          book_author: info.authors?.join(", ") || "Inconnu",
          book_cover_url: info.imageLinks?.thumbnail?.replace("http://", "https://") || null,
          status: targetStatus, // Ici on enregistre si c'est 'lu' ou 'envie'
        },
      ]);

      if (postError && postError.code !== '23505') throw postError;

      // 3. Rafraichir la liste locale et rediriger si c'est un livre "Lu" (pour le noter)
      await fetchLibrary();
      setQuery("");
      setResults([]);
      
      // Si c'est "Lu", on va le noter. Si c'est "À lire", on reste sur la liste.
      if (targetStatus === 'lu') {
        router.push(`/livres/${bookId}`);
      } else {
        setActiveTab('envie'); // On bascule sur l'onglet "À lire" pour voir le résultat
      }

    } catch (error: any) {
      console.error("Erreur ajout:", error);
      alert("Erreur : " + error.message);
    } finally {
      setAddingId(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Retirer ce livre ?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (!error) {
      setLibrary(library.filter((item) => item.post_id !== postId));
    }
  };

  // Filtrage pour l'affichage
  const displayedBooks = library.filter(book => book.status === activeTab);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Loader2 className="animate-spin text-[var(--color-primary)] w-8 h-8" />
    </div>
  );

  return (
    <main className="max-w-6xl mx-auto px-4 pt-10 pb-20 font-sans">
      
      {/* --- RECHERCHE --- */}
      <section className="mb-16">
        <h1 className="text-4xl font-serif font-bold mb-8 text-[var(--color-text)]">Bibliothèque</h1>
        
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un nouveau livre..."
            className="w-full pl-5 pr-14 py-4 border border-[var(--color-border)] rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-lg font-serif"
          />
          <button type="submit" disabled={searching} className="absolute right-2 top-2 bottom-2 px-4 bg-[var(--color-text)] text-white rounded-md hover:bg-[var(--color-primary)] transition-colors flex items-center justify-center">
            {searching ? <Loader2 className="animate-spin w-5 h-5"/> : <Search className="w-5 h-5"/>}
          </button>
        </form>

        {/* RÉSULTATS RECHERCHE */}
        {results.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {results.map((book) => {
              const info = book.volumeInfo;
              const isAdding = addingId === book.id;
              
              return (
                <div key={book.id} className="flex gap-4 p-4 border border-[var(--color-border)] bg-white rounded-lg shadow-sm">
                  <div className="flex-shrink-0 w-16 h-24 bg-gray-100 border border-gray-200">
                    {info.imageLinks?.thumbnail && (
                      <img src={info.imageLinks.thumbnail.replace("http://", "https://")} alt={info.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[var(--color-text)] line-clamp-1">{info.title}</h3>
                      <p className="text-sm text-[var(--color-subtle)] line-clamp-1">{info.authors?.join(", ")}</p>
                    </div>
                    
                    {/* LES DEUX BOUTONS D'AJOUT */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAdd(book, 'lu')}
                        disabled={isAdding}
                        className="flex-1 px-3 py-2 bg-[var(--color-text)] text-white text-xs font-bold rounded hover:bg-[var(--color-primary)] disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        J'ai lu
                      </button>
                      <button
                        onClick={() => handleAdd(book, 'envie')}
                        disabled={isAdding}
                        className="flex-1 px-3 py-2 bg-white border border-[var(--color-text)] text-[var(--color-text)] text-xs font-bold rounded hover:bg-[var(--color-bg)] disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        À lire
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- ONGLETS --- */}
      <div className="flex gap-8 border-b border-[var(--color-border)] mb-8">
        <button
          onClick={() => setActiveTab('lu')}
          className={`pb-4 text-lg font-serif transition-colors relative ${
            activeTab === 'lu' 
              ? "text-[var(--color-primary)] font-bold" 
              : "text-[var(--color-subtle)] hover:text-[var(--color-text)]"
          }`}
        >
          Mes livres lus
          <span className="ml-2 text-sm opacity-60">({library.filter(b => b.status === 'lu').length})</span>
          {activeTab === 'lu' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary)]" />}
        </button>

        <button
          onClick={() => setActiveTab('envie')}
          className={`pb-4 text-lg font-serif transition-colors relative ${
            activeTab === 'envie' 
              ? "text-[var(--color-primary)] font-bold" 
              : "text-[var(--color-subtle)] hover:text-[var(--color-text)]"
          }`}
        >
          Ma pile à lire
          <span className="ml-2 text-sm opacity-60">({library.filter(b => b.status === 'envie').length})</span>
          {activeTab === 'envie' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary)]" />}
        </button>
      </div>

      {/* --- GRILLE DE LIVRES --- */}
      {displayedBooks.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-muted)]/20 rounded-lg border border-dashed border-[var(--color-border)]">
          <BookOpen className="w-12 h-12 text-[var(--color-subtle)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--color-text)]/60 text-lg">
            {activeTab === 'lu' ? "Vous n'avez pas encore fini de livre." : "Votre pile à lire est vide."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          {displayedBooks.map((item) => (
            <div key={item.post_id} className="group relative flex flex-col">
              <Link href={`/livres/${item.book_id}`} className="block relative aspect-[2/3] mb-3 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                 {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className={`w-full h-full object-cover rounded-sm border border-[var(--color-border)] ${activeTab === 'envie' ? 'grayscale-[30%]' : ''}`}
                  />
                ) : (
                  <div className="w-full h-full bg-[#EAE5DC] flex items-center justify-center text-[var(--color-text)]/30 border border-[var(--color-border)] rounded-sm">
                    <span className="font-bold text-xl font-serif text-center px-2">{item.title}</span>
                  </div>
                )}
                
                {/* Badge Note (Seulement si lu) */}
                {item.status === 'lu' && item.rating && (
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.rating} ★
                  </div>
                )}

                {/* Badge "À lire" */}
                {item.status === 'envie' && (
                  <div className="absolute top-2 right-2 bg-white/90 text-[var(--color-text)] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    À lire
                  </div>
                )}
              </Link>

              <div className="pr-6">
                 <Link href={`/livres/${item.book_id}`} className="font-bold text-[var(--color-text)] leading-tight hover:underline line-clamp-2">
                  {item.title}
                </Link>
                <p className="text-xs text-[var(--color-subtle)] mt-1 mb-2 line-clamp-1">{item.author}</p>
              </div>

              <button
                onClick={() => handleDelete(item.post_id)}
                className="absolute bottom-0 right-0 p-2 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";

interface LibraryBook {
  post_id: string;
  book_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  rating: number | null;
  comment: string | null;
}

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  // On récupère l'ID depuis l'URL de manière sécurisée
  const id = typeof params?.id === "string" ? params.id : "";

  const [profile, setProfile] = useState<any>(null);
  const [library, setLibrary] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);

    try {
        // 1. Récupérer le profil de l'ami via son ID
        const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // 2. Récupérer ses livres (table 'posts')
        const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        if (postsData) {
          const formattedBooks: LibraryBook[] = postsData.map((post: any) => ({
              post_id: post.id,
              book_id: post.book_id,
              title: post.book_title,
              author: post.book_author,
              cover_url: post.book_cover_url,
              rating: post.rating,
              comment: post.comment,
          }));
          setLibrary(formattedBooks);
        }
    } catch (error) {
        console.error("Erreur chargement profil:", error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Loader2 className="animate-spin text-[var(--color-primary)] w-8 h-8" />
    </div>
  );

  if (!profile) return (
      <div className="text-center py-20 font-serif text-[var(--color-text)]">
        Utilisateur introuvable.
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 pt-10 pb-20 font-sans">
      <button
        onClick={() => router.back()}
        className="text-[var(--color-subtle)] hover:text-[var(--color-text)] mb-8 flex items-center gap-2 text-sm font-medium transition-colors"
      >
        ← Retour
      </button>

      {/* EN-TÊTE DU PROFIL */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-16 border-b border-[var(--color-border)] pb-10">
        <div className="w-24 h-24 rounded-full border-2 border-[var(--color-border)] p-1 bg-white shadow-sm">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full rounded-full bg-[var(--color-muted)] flex items-center justify-center text-2xl font-serif font-bold text-[var(--color-text)]/50">
              {profile.username?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-serif font-bold text-[var(--color-text)]">
            Bibliothèque de {profile.username}
          </h1>
          <p className="text-[var(--color-subtle)] mt-2 font-medium">
            {library.length} livre{library.length > 1 ? "s" : ""} lu{library.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* GRILLE DE LIVRES */}
      {library.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-muted)]/20 rounded-lg border border-dashed border-[var(--color-border)]">
          <BookOpen className="w-12 h-12 text-[var(--color-subtle)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--color-text)]/60 font-serif text-lg">
            {profile.username} n'a pas encore ajouté de livres.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          {library.map((item) => (
            <div key={item.post_id} className="group flex flex-col">
              <Link href={`/livres/${item.book_id}`} className="block relative aspect-[2/3] mb-3 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-sm border border-[var(--color-border)]"
                  />
                ) : (
                  <div className="w-full h-full bg-[#EAE5DC] flex items-center justify-center text-[var(--color-text)]/30 border border-[var(--color-border)] rounded-sm">
                    <span className="font-bold text-sm font-serif text-center px-2">{item.title}</span>
                  </div>
                )}
                
                {/* Badge Note */}
                {item.rating && (
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    {item.rating} ★
                  </div>
                )}
              </Link>

              <div className="pr-2">
                <Link href={`/livres/${item.book_id}`} className="font-bold text-[var(--color-text)] leading-tight hover:underline line-clamp-2 transition-colors">
                  {item.title}
                </Link>
                <p className="text-xs text-[var(--color-subtle)] mt-1 line-clamp-1">{item.author}</p>
                
                {item.comment && (
                   <p className="text-xs text-[var(--color-subtle)] italic mt-2 line-clamp-2 border-l-2 border-[var(--color-primary)] pl-2">
                     "{item.comment}"
                   </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
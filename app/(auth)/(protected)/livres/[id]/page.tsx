"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LivreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [book, setBook] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Utilisateur non connecté.");
      setLoading(false);
      return;
    }

    setUser(user);

    const { data: bookData, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (bookError || !bookData) {
      setError("Livre introuvable.");
      setLoading(false);
      return;
    }

    setBook(bookData);

    const { data: postData } = await supabase
      .from("posts")
      .select("*")
      .eq("book_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    setPost(postData || null);
    setRating(postData?.rating ?? 0);
    setReview(postData?.comment ?? "");

    setLoading(false);
  };

  const upsertPost = async (fields: any) => {
    if (!user || !book) return;

    const payload = {
      user_id: user.id,
      book_id: book.id,
      book_title: book.title,
      book_author: book.author,
      book_cover_url: book.cover_url,
      rating: fields.rating ?? rating ?? null,
      comment: fields.comment ?? review ?? null,
    };

    if (post) {
      await supabase.from("posts").update(payload).eq("id", post.id);
    } else {
      await supabase.from("posts").insert([payload]);
    }

    await loadPage();
  };

  const handlePublishReview = async () => {
    await upsertPost({ comment: review });
    router.push("/livres");
  };

  if (loading)
    return (
      <p className="text-center text-[var(--color-text)]/50 font-serif py-12">
        Chargement…
      </p>
    );

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-10 text-center">
        <p className="text-[var(--color-accent)] mb-4 font-serif">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-[var(--color-accent)] text-white font-serif rounded-sm hover:opacity-90 transition-opacity"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-10">
      <button
        onClick={() => router.back()}
        className="text-[var(--color-text)]/60 hover:text-[var(--color-text)] font-serif mb-6 transition-colors"
      >
        ← Retour
      </button>

      <div className="border border-[var(--color-border)] bg-white/60 p-8 mb-8">
        <div className="flex gap-8">
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-40 h-auto object-cover border border-[var(--color-border)] flex-shrink-0"
            />
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-serif font-semibold text-[var(--color-text)] mb-2">
              {book.title}
            </h1>
            <p className="text-lg font-serif text-[var(--color-text)]/70 mb-6">
              {book.author}
            </p>

            {book.description && (
              <p className="font-serif text-base text-[var(--color-text)]/80 leading-relaxed">
                {book.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="border border-[var(--color-border)] bg-white/60 p-6">
          <h2 className="font-serif font-semibold text-lg text-[var(--color-text)] mb-4">
            Note
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="flex-1"
            />
            <span className="font-serif text-lg text-[var(--color-text)] w-12 text-center">
              {rating}/5
            </span>
            <button
              onClick={() => upsertPost({ rating })}
              className="px-4 py-2 bg-[var(--color-accent)] text-white font-serif rounded-sm hover:opacity-90 transition-opacity"
            >
              Enregistrer
            </button>
          </div>
        </div>

        <div className="border border-[var(--color-border)] bg-white/60 p-6">
          <h2 className="font-serif font-semibold text-lg text-[var(--color-text)] mb-4">
            Avis
          </h2>
          <textarea
            className="w-full px-4 py-3 border border-[var(--color-border)] bg-white text-[var(--color-text)] font-serif rounded-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
            rows={5}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Partagez votre avis sur ce livre..."
          />
          <button
            onClick={handlePublishReview}
            className="mt-4 px-4 py-2 bg-[var(--color-accent)] text-white font-serif rounded-sm hover:opacity-90 transition-opacity"
          >
            Publier l'avis
          </button>
        </div>
      </div>
    </div>
  );
}

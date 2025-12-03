"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StarRating from "@/components/star-rating";

export default function LivreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ID du livre
  const id = typeof params?.id === "string" ? params.id : "";
  // ID de l'utilisateur dont on veut voir l'avis (optionnel)
  const targetUserId = searchParams.get('uid');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [book, setBook] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUserProfile, setTargetUserProfile] = useState<any>(null);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  // Est-ce que je suis en train de regarder mon propre livre ?
  const isMyBook = !targetUserId || (currentUser && targetUserId === currentUser.id);

  useEffect(() => {
    if (id) loadPage();
  }, [id, targetUserId]);

  const loadPage = async () => {
    setLoading(true);
    setError(null);

    // 1. Qui suis-je ?
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Utilisateur non connecté.");
      setLoading(false);
      return;
    }
    setCurrentUser(user);

    // 2. Infos du Livre
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

    // 3. Déterminer quel avis charger (Moi ou l'Ami ?)
    const userIdToFetch = targetUserId || user.id;

    // Récupérer le profil de l'ami si ce n'est pas moi
    if (userIdToFetch !== user.id) {
        const { data: profile } = await supabase.from("profiles").select("username").eq("id", userIdToFetch).single();
        setTargetUserProfile(profile);
    }

    // 4. Récupérer l'avis (Post)
    const { data: postData } = await supabase
      .from("posts")
      .select("*")
      .eq("book_id", id)
      .eq("user_id", userIdToFetch)
      .maybeSingle();

    setPost(postData || null);
    setRating(postData?.rating ?? 0);
    setReview(postData?.comment ?? "");

    setLoading(false);
  };

  const upsertPost = async (fields: any) => {
    if (!isMyBook) return; // Sécurité : on ne modifie pas l'avis des autres !

    const payload = {
      user_id: currentUser.id,
      book_id: book.id,
      book_title: book.title,
      book_author: book.author,
      book_cover_url: book.cover_url,
      rating: fields.rating !== undefined ? fields.rating : rating,
      comment: fields.comment !== undefined ? fields.comment : review,
    };

    if (post) {
      await supabase.from("posts").update(payload).eq("id", post.id);
    } else {
      const { data: newPost } = await supabase.from("posts").insert([payload]).select().single();
      setPost(newPost);
    }
  };

  const handlePublishReview = async () => {
    await upsertPost({ comment: review });
    router.push("/livres");
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-[var(--color-text)]/50 font-serif animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pb-20">
      <button
        onClick={() => router.back()}
        className="text-[var(--color-subtle)] hover:text-[var(--color-text)] font-medium text-sm mb-8 transition-colors flex items-center gap-2"
      >
        ← Retour
      </button>

      {/* HEADER LIVRE */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {book.cover_url && (
          <div className="w-48 flex-shrink-0 mx-auto md:mx-0 shadow-lg rotate-1">
            <img src={book.cover_url} alt={book.title} className="w-full h-auto object-cover border border-[var(--color-border)] bg-[#EAE5DC]" />
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--color-text)] mb-3 leading-tight">{book.title}</h1>
          <p className="text-xl font-serif text-[var(--color-subtle)] mb-6">{book.author}</p>
          {book.description && (
            <div className="prose prose-stone max-w-none">
              <p className="font-sans text-base text-[var(--color-text)]/80 leading-relaxed text-justify md:text-left line-clamp-[8]">
                {book.description.replace(/<[^>]*>?/gm, '')}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* BLOC NOTE */}
        <div className="border border-[var(--color-border)] bg-white p-6 rounded-lg shadow-sm card-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif font-bold text-lg text-[var(--color-text)]">
              {isMyBook ? "Ma note" : `Note de ${targetUserProfile?.username || "l'ami"}`}
            </h2>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${rating > 0 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-muted)] text-[var(--color-subtle)]'}`}>
              {rating > 0 ? `${rating}/5` : "-"}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 gap-3">
            <StarRating 
              rating={rating} 
              readOnly={!isMyBook} // Bloqué si ce n'est pas moi !
              onChange={(newRating) => {
                  if(isMyBook) {
                    setRating(newRating);
                    upsertPost({ rating: newRating });
                  }
              }} 
            />
            {isMyBook && <p className="text-xs text-[var(--color-subtle)] text-center mt-2">Double-cliquez pour une demi-étoile.</p>}
          </div>
        </div>

        {/* BLOC AVIS */}
        <div className="border border-[var(--color-border)] bg-white p-6 rounded-lg shadow-sm card-shadow flex flex-col">
          <h2 className="font-serif font-bold text-lg text-[var(--color-text)] mb-4">
            {isMyBook ? "Mon avis" : `Avis de ${targetUserProfile?.username || "l'ami"}`}
          </h2>
          
          {isMyBook ? (
            // MODE ÉDITION (MOI)
            <>
              <textarea
                className="flex-1 w-full px-4 py-3 border border-[var(--color-muted)] bg-[var(--color-bg)]/30 text-[var(--color-text)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none text-sm leading-relaxed"
                rows={5}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Qu'avez-vous pensé de ce livre ?"
              />
              <button
                onClick={handlePublishReview}
                className="mt-4 w-full px-4 py-3 bg-[var(--color-text)] text-white font-medium rounded-md hover:bg-[var(--color-primary)] transition-all shadow-sm"
              >
                Enregistrer l'avis
              </button>
            </>
          ) : (
            // MODE LECTURE (AMI)
            <div className="flex-1 p-4 bg-[var(--color-bg)]/20 rounded-md border border-[var(--color-muted)]/50 min-h-[150px]">
              {review ? (
                <p className="text-sm text-[var(--color-text)] leading-relaxed italic">"{review}"</p>
              ) : (
                <p className="text-sm text-[var(--color-subtle)] italic text-center mt-10">Aucun avis rédigé pour le moment.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
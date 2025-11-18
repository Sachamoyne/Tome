"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface PostRow {
  id: string;
  user_id: string;
  book_id: string | null;
  book_title: string;
  book_author: string | null;
  book_cover_url: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  username: string | null;
}

export default function HomePage() {
  const [posts, setPosts] = useState<(PostRow & { username: string | null })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeStyle: undefined,
      }),
    []
  );

  useEffect(() => {
    const fetchFeed = async () => {
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

      const { data: follows } = await supabase
        .from("follow")
        .select("followed_id")
        .eq("follower_id", user.id);

      const followedIds = [
        user.id,
        ...(follows?.map((f) => f.followed_id) ?? []),
      ];

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .in("user_id", followedIds)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error(postsError);
        setError("Erreur lors du chargement du flux d'activité.");
        setLoading(false);
        return;
      }

      const postsList = postsData ?? [];

      const userIds = Array.from(new Set(postsList.map((p) => p.user_id)));

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profileMap: Record<string, string | null> = {};
      profilesData?.forEach((p: ProfileRow) => {
        profileMap[p.id] = p.username;
      });

      const combined = postsList.map((p: PostRow) => ({
        ...p,
        username: profileMap[p.user_id] ?? "Utilisateur",
      }));

      setPosts(combined);
      setLoading(false);
    };

    fetchFeed();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-semibold text-gallimard-foreground mb-3 tracking-tight">
          Bienvenue sur Livrebox
        </h1>
        <p className="text-gallimard-foreground/60 font-serif text-lg leading-relaxed">
          Retrouvez ici les activités récentes de vos amis.
        </p>
      </div>

      <h2 className="text-2xl font-serif font-medium text-gallimard-foreground mb-8 border-b border-gallimard-border pb-3">
        Activité de vos amis
      </h2>

      {loading && (
        <p className="text-center text-gallimard-foreground/50 font-serif py-12">
          Chargement…
        </p>
      )}

      {error && (
        <p className="text-center text-gallimard-accent font-serif py-12">
          {error}
        </p>
      )}

      {!loading && posts.length === 0 && (
        <p className="text-center text-gallimard-foreground/50 font-serif py-12">
          Aucune activité récente.
        </p>
      )}

      <ul className="space-y-10">
        {posts.map((post) => {
          const initial = post.username?.charAt(0).toUpperCase() ?? "U";

          return (
            <li key={post.id} className="book-card rounded-sm p-8">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gallimard-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gallimard-accent/10 border border-gallimard-accent/20 flex items-center justify-center text-gallimard-accent font-serif font-medium text-sm flex-shrink-0">
                    {initial}
                  </div>
                  <p className="text-gallimard-foreground font-serif font-medium text-base">
                    {post.username} a partagé une lecture
                  </p>
                </div>

                <p className="text-sm text-gallimard-foreground/50 font-serif whitespace-nowrap ml-4">
                  {formatter.format(new Date(post.created_at))}
                </p>
              </div>

              <div className="flex gap-6 items-start">
                {post.book_cover_url && (
                  <img
                    src={post.book_cover_url}
                    alt={post.book_title}
                    className="w-32 h-48 object-cover rounded-sm shadow-md border border-gallimard-border/50 flex-shrink-0"
                  />
                )}

                <div className="flex-1 space-y-3">
                  <div>
                    <Link
                      href={`/livres/${post.book_id}`}
                      className="text-gallimard-foreground font-serif font-semibold text-xl hover:text-gallimard-accent transition-colors block mb-2"
                    >
                      {post.book_title}
                    </Link>

                    {post.book_author && (
                      <p className="text-gallimard-foreground/60 font-serif text-base">
                        {post.book_author}
                      </p>
                    )}
                  </div>

                  {post.rating && (
                    <p className="text-gallimard-accent font-serif text-base font-medium">
                      Note : {post.rating}/5
                    </p>
                  )}

                  {post.comment && (
                    <div className="mt-4 pt-4 border-t border-gallimard-border/30">
                      <p className="text-gallimard-foreground/70 font-serif italic text-base leading-relaxed">
                        "{post.comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

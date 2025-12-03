"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Star, Loader2, BookOpen, Clock } from "lucide-react";

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
  avatar_url: string | null;
}

interface FeedItem extends PostRow {
  username: string | null;
  avatar_url: string | null;
}

export default function HomePage() {
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Amis uniquement
    const { data: follows } = await supabase
      .from("follow")
      .select("followed_id")
      .eq("follower_id", user.id);

    const friendIds = follows?.map((f) => f.followed_id) ?? [];

    if (friendIds.length === 0) {
      setLoading(false);
      return;
    }

    // 2. Posts récents
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .in("user_id", friendIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsError) {
      setError("Erreur chargement feed.");
      setLoading(false);
      return;
    }

    const rawPosts = postsData ?? [];

    // 3. Filtrer (Dernier post par ami)
    const uniquePosts: PostRow[] = [];
    const seenUsers = new Set<string>();

    for (const post of rawPosts) {
      if (!seenUsers.has(post.user_id)) {
        seenUsers.add(post.user_id);
        uniquePosts.push(post);
      }
    }

    if (uniquePosts.length === 0) {
      setLoading(false);
      return;
    }

    // 4. Profils
    const userIds = uniquePosts.map((p) => p.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);

    const profileMap: Record<string, ProfileRow> = {};
    profilesData?.forEach((p: ProfileRow) => {
      profileMap[p.id] = p;
    });

    const combined = uniquePosts.map((p) => ({
      ...p,
      username: profileMap[p.user_id]?.username ?? "Ami",
      avatar_url: profileMap[p.user_id]?.avatar_url ?? null,
    }));

    setPosts(combined);
    setLoading(false);
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "à l'instant";
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return `il y a ${Math.floor(diffInSeconds / 86400)} j`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 font-sans pb-20">
      <div className="mb-10 text-center border-b border-[var(--color-border)] pb-8">
        <h1 className="text-4xl font-serif font-bold text-[var(--color-text)] mb-2">Tome</h1>
        <p className="text-[var(--color-subtle)]">La dernière lecture de vos amis.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[var(--color-primary)] w-8 h-8" />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-lg border border-[var(--color-border)] card-shadow">
          <BookOpen className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
          <p className="text-[var(--color-text)]/60 text-lg font-serif">C'est calme ici.</p>
          <Link href="/amis" className="mt-4 inline-block text-[var(--color-primary)] font-medium hover:underline">Trouver des amis →</Link>
        </div>
      )}

      <div className="space-y-8">
        {posts.map((post) => {
          const initial = post.username?.charAt(0).toUpperCase() ?? "?";

          return (
            <article key={post.id} className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden card-shadow hover:shadow-md transition-shadow">
              {/* Header Ami */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]/50 bg-[var(--color-bg)]/30">
                <Link href={`/profil-membre/${post.user_id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full border border-[var(--color-border)] p-0.5 bg-white">
                    {post.avatar_url ? (
                      <img src={post.avatar_url} alt={post.username || ""} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-text)]/50 font-bold font-serif">{initial}</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{post.username}</span>
                    <span className="text-xs text-[var(--color-subtle)]">a partagé sa dernière lecture</span>
                  </div>
                </Link>
                <div className="flex items-center gap-1 text-xs text-[var(--color-subtle)]"><Clock className="w-3 h-3" />{timeAgo(post.created_at)}</div>
              </div>

              {/* Contenu Livre avec lien spécial UID */}
              <Link href={`/livres/${post.book_id}?uid=${post.user_id}`} className="block group">
                <div className="p-8 flex flex-col items-center bg-[var(--color-bg)]/10 hover:bg-[var(--color-bg)]/20 transition-colors">
                  <div className="relative w-40 aspect-[2/3] shadow-lg transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
                    {post.book_cover_url ? (
                      <img src={post.book_cover_url} alt={post.book_title} className="w-full h-full object-cover rounded-sm border border-[var(--color-border)]" />
                    ) : (
                      <div className="w-full h-full bg-[#EAE5DC] flex items-center justify-center border border-[var(--color-border)]"><BookOpen className="text-[var(--color-subtle)]" /></div>
                    )}
                    {post.rating && (
                      <div className="absolute -bottom-3 -right-3 bg-white border border-[var(--color-border)] rounded-full px-3 py-1 shadow-sm flex items-center gap-1 z-10">
                        <span className="font-bold text-[var(--color-text)]">{post.rating}</span>
                        <Star className="w-3 h-3 text-[var(--color-primary)] fill-[var(--color-primary)]" />
                      </div>
                    )}
                  </div>
                  <div className="mt-6 text-center max-w-sm">
                    <h2 className="text-xl font-serif font-bold text-[var(--color-text)] leading-tight group-hover:text-[var(--color-primary)] transition-colors">{post.book_title}</h2>
                    <p className="text-sm text-[var(--color-subtle)] mt-1 font-medium">{post.book_author}</p>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
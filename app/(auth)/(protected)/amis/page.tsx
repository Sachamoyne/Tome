"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserPlus, UserMinus, User, Loader2 } from "lucide-react";
import Link from "next/link"; // Ajout de l'import Link

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export default function AmisPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          setError("Erreur lors de la connexion.");
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // 1. Récupérer tous les profils (sauf soi-même)
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .neq("id", currentUser.id);

        if (profilesError) throw profilesError;
        setProfiles(profilesData || []);

        // 2. Récupérer les abonnements
        const { data: followsData, error: followsError } = await supabase
          .from("follow")
          .select("followed_id")
          .eq("follower_id", currentUser.id);

        if (followsError) throw followsError;
        setFollowing(followsData?.map((f) => f.followed_id) || []);
        
      } catch (err: any) {
        setError("Impossible de charger la liste des amis.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFollow = async (followedId: string) => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(followedId);
      
      const { error } = await supabase
        .from("follow")
        .insert([{ follower_id: user.id, followed_id: followedId }]);

      if (error) throw error;

      setFollowing([...following, followedId]);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de l'abonnement.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfollow = async (followedId: string) => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(followedId);
      
      const { error } = await supabase
        .from("follow")
        .delete()
        .eq("follower_id", user.id)
        .eq("followed_id", followedId);

      if (error) throw error;

      setFollowing(following.filter((id) => id !== followedId));
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors du désabonnement.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[var(--color-primary)] w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 pt-10 pb-20 font-sans">
      
      <div className="mb-10 text-center md:text-left border-b border-[var(--color-border)] pb-6">
        <h1 className="text-4xl font-serif font-bold text-[var(--color-text)] mb-2">
          Communauté
        </h1>
        <p className="text-[var(--color-subtle)]">
          Découvrez ce que lisent les autres membres.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-[var(--color-border)] card-shadow">
          <User className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
          <p className="text-[var(--color-text)]/60 text-lg font-serif">
            C'est un peu calme ici...
          </p>
          <p className="text-sm text-[var(--color-subtle)] mt-1">
            Aucun autre membre n'a été trouvé pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => {
            const isFollowing = following.includes(profile.id);
            const isLoading = actionLoading === profile.id;
            const initial = profile.username
              ? profile.username.charAt(0).toUpperCase()
              : "?";

            return (
              <div
                key={profile.id}
                className="group relative flex flex-col items-center p-6 bg-white border border-[var(--color-border)] rounded-lg shadow-sm hover:shadow-md transition-all duration-300 card-shadow"
              >
                {/* ZONE CLIQUABLE : AVATAR + NOM */}
                <Link href={`/membre/${profile.id}`} className="flex flex-col items-center w-full cursor-pointer mb-6">
                  {/* AVATAR */}
                  <div className="mb-4 transition-transform group-hover:scale-105">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username || "User"}
                        className="w-20 h-20 rounded-full object-cover border border-[var(--color-border)] p-1 bg-[var(--color-bg)]"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[var(--color-muted)]/50 flex items-center justify-center text-[var(--color-text)]/40 font-serif font-bold text-2xl border border-[var(--color-border)]">
                        {initial}
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="text-center w-full">
                    <h3 className="font-serif font-bold text-xl text-[var(--color-text)] truncate w-full group-hover:text-[var(--color-primary)] transition-colors">
                      {profile.username || "Membre inconnu"}
                    </h3>
                    <p className="text-xs text-[var(--color-subtle)] uppercase tracking-wider mt-1">
                      Voir la bibliothèque
                    </p>
                  </div>
                </Link>

                {/* BOUTON ACTION (Séparé du Link) */}
                <button
                  onClick={(e) => {
                    e.preventDefault(); // Sécurité
                    isFollowing ? handleUnfollow(profile.id) : handleFollow(profile.id);
                  }}
                  disabled={isLoading}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    isFollowing
                      ? "bg-transparent border border-[var(--color-border)] text-[var(--color-subtle)] hover:border-red-200 hover:text-red-500 hover:bg-red-50"
                      : "bg-[var(--color-text)] text-white hover:bg-[var(--color-primary)] shadow-sm hover:shadow"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" /> Ne plus suivre
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Suivre
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
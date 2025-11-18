"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export default function AmisPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

        if (userError) {
          setError("Erreur lors de la récupération de l'utilisateur.");
          setLoading(false);
          return;
        }

        if (!currentUser) {
          setError("Utilisateur non connecté.");
          setLoading(false);
          return;
        }

        setUser(currentUser);

        const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
          .select("id, username, avatar_url")
          .neq("id", currentUser.id);

        if (profilesError) {
          setError("Erreur lors de la récupération des profils.");
          setLoading(false);
          return;
        }

        setProfiles(profilesData || []);

        const { data: followsData, error: followsError } = await supabase
        .from("follow")
        .select("followed_id")
          .eq("follower_id", currentUser.id);

        if (followsError) {
          setError("Erreur lors de la récupération des abonnements.");
          setLoading(false);
          return;
        }

        setFollowing(followsData?.map((f) => f.followed_id) || []);
        setLoading(false);
      } catch (err) {
        setError("Une erreur inattendue s'est produite.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFollow = async (followedId: string) => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(followedId);
      setError(null);
      setSuccess(null);

      const { error: followError } = await supabase
        .from("follow")
        .insert([{ follower_id: user.id, followed_id: followedId }]);

      if (followError) {
        throw new Error(`Erreur: ${followError.message}`);
      }

      setFollowing([...following, followedId]);
      setSuccess("Vous suivez maintenant cet utilisateur.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'abonnement.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfollow = async (followedId: string) => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(followedId);
      setError(null);
      setSuccess(null);

      const { error: unfollowError } = await supabase
        .from("follow")
        .delete()
        .eq("follower_id", user.id)
        .eq("followed_id", followedId);

      if (unfollowError) {
        throw new Error(`Erreur: ${unfollowError.message}`);
      }

      setFollowing(following.filter((id) => id !== followedId));
      setSuccess("Vous ne suivez plus cet utilisateur.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors du désabonnement.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-10">
        <p className="text-center text-gray-400">Chargement des utilisateurs…</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-10">
        <p className="text-center text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-10 pb-10">
      <h1 className="text-3xl font-bold mb-6 text-white">Amis</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="border border-[#2A3440] bg-[#1C252F] rounded-xl p-6 text-center">
          <p className="text-gray-400">Aucun autre utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="border border-[#2A3440] bg-[#1C252F] rounded-xl overflow-hidden">
          <ul className="divide-y divide-[#2A3440]">
            {profiles.map((profile) => {
              const isFollowing = following.includes(profile.id);
              const isLoading = actionLoading === profile.id;
              const initial = profile.username
                ? profile.username.charAt(0).toUpperCase()
                : "?";

              return (
                <li
                  key={profile.id}
                  className="p-4 hover:bg-[#0B0F19] transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username || "Utilisateur"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#2A3440] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-900/40 flex-shrink-0">
                          {initial}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {profile.username || "Utilisateur sans nom"}
                        </p>
                        <p className="text-sm text-[#9BA7B4] truncate">
                          {profile.username ? `@${profile.username}` : "Sans nom d'utilisateur"}
                        </p>
                      </div>
                    </div>

              <button
                      onClick={() =>
                        isFollowing
                          ? handleUnfollow(profile.id)
                          : handleFollow(profile.id)
                      }
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                        isFollowing
                          ? "bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30"
                          : "bg-[#00A3FF] text-white hover:bg-[#0090e0]"
                      }`}
                    >
                      {isLoading
                        ? "..."
                        : isFollowing
                        ? "Ne plus suivre"
                        : "Suivre"}
              </button>
                  </div>
            </li>
              );
            })}
      </ul>
        </div>
      )}
    </div>
  );
}

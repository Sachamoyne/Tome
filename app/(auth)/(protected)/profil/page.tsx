"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
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

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, bio, avatar_url")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          setError("Erreur lors de la récupération du profil.");
          setLoading(false);
          return;
        }

        setProfile(profileData);
        setUsername(profileData?.username || "");
        setBio(profileData?.bio || "");
        setAvatarUrl(profileData?.avatar_url || null);
        setLoading(false);
      } catch (err) {
        setError("Une erreur inattendue s'est produite.");
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let finalAvatarUrl = profile?.avatar_url || null;

      if (avatarFile) {
        setUploading(true);
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}.${fileExt || "jpg"}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Erreur upload: ${uploadError.message}`);
        }

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        finalAvatarUrl = data.publicUrl;
        setUploading(false);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: username.trim() || null,
          bio: bio.trim() || null,
          avatar_url: finalAvatarUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(`Erreur mise à jour: ${updateError.message}`);
      }

      setProfile({
        ...profile,
        username: username.trim() || null,
        bio: bio.trim() || null,
        avatar_url: finalAvatarUrl,
      });

      setAvatarFile(null);
      setSuccess("Profil mis à jour avec succès !");
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-10">
        <p className="text-center text-gray-400">Chargement du profil…</p>
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

  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  });

  return (
    <div className="max-w-2xl mx-auto px-6 pt-10 pb-10">
      <h1 className="text-3xl font-bold mb-6 text-white">Mon profil</h1>

      <div className="border border-[#2A3440] bg-[#1C252F] rounded-xl p-6 mb-6 space-y-4">
        <h2 className="text-xl font-semibold text-white mb-4">
          Informations actuelles
        </h2>

        <div className="flex items-center gap-4 mb-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-[#2A3440]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#2A3440]">
              <span className="text-2xl text-gray-400">
                {username.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm text-[#9BA7B4] uppercase tracking-wide">
              Avatar
            </p>
            <p className="text-white">
              {avatarUrl ? "Avatar défini" : "Aucun avatar"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-[#9BA7B4] uppercase tracking-wide">
            Nom d'utilisateur
          </p>
          <p className="text-lg text-white">
            {profile?.username || "Non renseigné"}
          </p>
        </div>

        <div>
          <p className="text-sm text-[#9BA7B4] uppercase tracking-wide">Email</p>
          <p className="text-lg text-white">{user?.email}</p>
        </div>

        <div>
          <p className="text-sm text-[#9BA7B4] uppercase tracking-wide">Bio</p>
          <p className="text-lg text-white">
            {profile?.bio || "Aucune bio"}
          </p>
        </div>

        <div>
          <p className="text-sm text-[#9BA7B4] uppercase tracking-wide">
            Date d'inscription
          </p>
          <p className="text-lg text-white">
            {dateFormatter.format(new Date(user?.created_at))}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border border-[#2A3440] bg-[#1C252F] rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Modifier mon profil
        </h2>

        <div>
          <label className="block text-sm text-[#9BA7B4] uppercase tracking-wide mb-2">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-[#0B0F19] border border-[#2A3440] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3FF] transition"
            placeholder="Votre nom d'utilisateur"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm text-[#9BA7B4] uppercase tracking-wide mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 bg-[#0B0F19] border border-[#2A3440] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00A3FF] transition resize-none"
            placeholder="Décrivez-vous en quelques mots..."
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm text-[#9BA7B4] uppercase tracking-wide mb-2">
            Avatar
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="w-full px-4 py-2 bg-[#0B0F19] border border-[#2A3440] rounded-lg text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#00A3FF] file:text-white hover:file:bg-[#0090e0] file:cursor-pointer focus:outline-none focus:border-[#00A3FF] transition"
            disabled={saving || uploading}
          />
          {uploading && (
            <p className="mt-2 text-sm text-[#9BA7B4]">
              Upload en cours...
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full px-4 py-3 bg-[#00A3FF] text-white font-medium rounded-lg hover:bg-[#0090e0] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving || uploading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

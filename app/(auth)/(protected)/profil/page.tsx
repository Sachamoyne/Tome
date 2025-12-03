"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Save, User, BookOpen, LogOut, Camera, Upload } from "lucide-react";
import Link from "next/link";

export default function ProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // État pour l'upload d'image
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Données
  const [user, setUser] = useState<any>(null);
  const [bookCount, setBookCount] = useState(0);
  
  // Champs du formulaire
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // 1. Récupérer le profil
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }

      // 2. Compter les livres lus
      const { count } = await supabase
        .from("posts")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);
      
      setBookCount(count || 0);

    } catch (error: any) {
      console.error("Erreur chargement profil:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour uploader l'image
  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // On crée un nom unique pour éviter les conflits (ID + Timestamp)
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload vers le bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Récupérer l'URL publique
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 3. Mettre à jour l'état local immédiatement
      setAvatarUrl(data.publicUrl);
      setMessage({ type: 'success', text: "Photo téléchargée ! Pensez à sauvegarder." });

    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: "Erreur lors du téléchargement de l'image." });
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setMessage({ type: 'success', text: "Profil mis à jour avec succès !" });
      
      setTimeout(() => setMessage(null), 3000);

    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || "Erreur lors de la mise à jour." });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-[var(--color-text)]">
            Mon Profil
          </h1>
          <p className="text-[var(--color-subtle)] mt-1">
            Gérez vos informations personnelles.
          </p>
        </div>
        
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE : CARTE D'IDENTITÉ */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-[var(--color-border)] shadow-sm card-shadow flex flex-col items-center text-center">
            
            {/* Avatar + Bouton Upload */}
            <div className="relative mb-4 group">
              <div className="w-32 h-32 rounded-full border-2 border-[var(--color-border)] p-1 bg-[var(--color-bg)] overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[var(--color-muted)] flex items-center justify-center text-4xl font-serif font-bold text-[var(--color-text)]/40">
                    {username ? username.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>
              
              {/* Le bouton caché qui déclenche l'input file */}
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-[var(--color-text)] text-white p-2 rounded-full cursor-pointer hover:bg-[var(--color-primary)] transition-colors shadow-md">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4" />}
              </label>
              <input 
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleUploadAvatar}
                disabled={uploading}
                className="hidden"
              />
            </div>
            
            <h2 className="text-xl font-serif font-bold text-[var(--color-text)] break-all">
              {username || user.email}
            </h2>
            <p className="text-xs text-[var(--color-subtle)] mt-1">{user.email}</p>
            
            <div className="mt-6 w-full pt-6 border-t border-[var(--color-muted)]">
              <div className="flex justify-center gap-2 items-center text-[var(--color-text)]">
                <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                <span className="font-bold text-lg">{bookCount}</span>
                <span className="text-sm text-[var(--color-subtle)]">livres lus</span>
              </div>
            </div>

            <Link href="/livres" className="mt-4 text-xs font-semibold text-[var(--color-primary)] hover:underline">
              Voir ma bibliothèque →
            </Link>
          </div>
        </div>

        {/* COLONNE DROITE : FORMULAIRE */}
        <div className="md:col-span-2">
          <div className="bg-white p-8 rounded-lg border border-[var(--color-border)] shadow-sm card-shadow">
            <h3 className="text-xl font-serif font-bold text-[var(--color-text)] mb-6">
              Modifier mes informations
            </h3>

            <div className="space-y-6">
              {/* Pseudo */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-2">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Votre pseudo"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg)]/30 border border-[var(--color-muted)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-[var(--color-text)]"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Quel genre de lecteur êtes-vous ?"
                  rows={4}
                  className="w-full px-4 py-3 bg-[var(--color-bg)]/30 border border-[var(--color-muted)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-[var(--color-text)] resize-none"
                />
              </div>

              {/* Bouton Sauvegarder */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={updateProfile}
                  disabled={saving || uploading}
                  className="px-6 py-3 bg-[var(--color-text)] text-white font-medium rounded-md hover:bg-[var(--color-primary)] transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-70"
                >
                  {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saving ? "Enregistrement..." : "Sauvegarder"}
                </button>

                {message && (
                  <span className={`text-sm font-medium animate-pulse ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {message.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
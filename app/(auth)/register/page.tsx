"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  // Étape 1 - Création du compte
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    setError(error.message);
    return;
  }

  // Étape 2 - Récupérer le user fraîchement créé
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("Utilisateur non récupéré après inscription");
    return;
  }

  console.log("Utilisateur récupéré :", user);

  // Étape 3 - Insertion dans la table profiles
  const { error: insertError } = await supabase.from("profiles").insert([
    {
      id: user.id,
      username,
    },
  ]);

  if (insertError) {
    console.error("Erreur d’insertion profil :", insertError);
    return;
  }

  router.push("/login");
};


  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleRegister} className="w-80 space-y-4">
        <h1 className="text-2xl font-bold text-center">Inscription</h1>

        <input
          placeholder="Nom d’utilisateur"
          className="border p-2 w-full rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="border p-2 w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          S’inscrire
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
}

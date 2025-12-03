"use client";

import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number; // La note actuelle (ex: 4.5)
  onChange: (newRating: number) => void; // Fonction pour mettre à jour la note
  readOnly?: boolean; // Si vrai, on ne peut pas cliquer (juste pour l'affichage)
}

export default function StarRating({ rating = 0, onChange, readOnly = false }: StarRatingProps) {
  // Fonction qui gère la logique "Double clic = 0.5"
  const handleClick = (starValue: number) => {
    if (readOnly) return;

    // Si on clique sur l'étoile qui est DÉJÀ sélectionnée
    if (rating === starValue) {
      // On la passe en demi (ex: 5 -> 4.5)
      onChange(starValue - 0.5);
    } else if (rating === starValue - 0.5) {
        // Si elle était déjà en demi, on repasse en entier (ex: 4.5 -> 5)
        onChange(starValue);
    } else {
      // Sinon, on met la note entière
      onChange(starValue);
    }
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((starValue) => {
        // Calcul pour savoir quelle icône afficher
        const isFull = rating >= starValue;
        const isHalf = rating >= starValue - 0.5 && rating < starValue;
        const isEmpty = !isFull && !isHalf;

        return (
          <button
            key={starValue}
            type="button" // Important pour ne pas soumettre le formulaire
            onClick={() => handleClick(starValue)}
            className={`transition-transform hover:scale-110 focus:outline-none ${
              readOnly ? "cursor-default hover:scale-100" : "cursor-pointer"
            }`}
          >
            <div className="relative">
              {/* Étoile vide (fond gris) toujours là pour la structure */}
              <Star
                className={`w-8 h-8 ${isEmpty ? "text-gray-300" : "text-transparent"}`}
                strokeWidth={1.5}
              />
              
              {/* Étoile Pleine (superposée) */}
              {isFull && (
                <Star
                  className="w-8 h-8 text-[var(--color-primary)] absolute top-0 left-0 fill-[var(--color-primary)]"
                  strokeWidth={1.5}
                />
              )}

              {/* Demi-Étoile (superposée) */}
              {isHalf && (
                <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                   <Star
                    className="w-8 h-8 text-[var(--color-primary)] fill-[var(--color-primary)]"
                    strokeWidth={1.5}
                  />
                </div>
              )}
               {/* Bordure de l'étoile quand c'est une demi (pour compléter le tour) */}
               {isHalf && (
                   <Star
                   className="w-8 h-8 text-[var(--color-primary)] absolute top-0 left-0"
                   strokeWidth={1.5}
                 />
               )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
import { useState, useEffect } from 'react';

export function useFavoriteSounds() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wordsnap_favorite_sounds');
      if (stored) {
        try {
          setFavorites(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse favorite sounds from localStorage", e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  const toggleFavorite = (soundName: string) => {
    setFavorites(prev => {
      const next = prev.includes(soundName) 
        ? prev.filter(s => s !== soundName) 
        : [...prev, soundName];
      if (typeof window !== 'undefined') {
        localStorage.setItem('wordsnap_favorite_sounds', JSON.stringify(next));
      }
      return next;
    });
  };

  return { favorites, toggleFavorite, isLoaded };
}

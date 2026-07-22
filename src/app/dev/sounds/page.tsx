'use client';

import React from 'react';
import { useSound } from '@/contexts/SoundContext';
import { useFavoriteSounds } from '@/hooks/useFavoriteSounds';
import { Button } from '@/components/ui/Button';

export default function SoundsDevPage() {
  const { 
    isMuted, toggleMute, 
    playValidWord, playInvalidWord, playWinner, playHover, playClick,
    playTypeLetter, playDeleteLetter, playCountdown, playHeartLoss,
    playPowerup1, playPowerup2, playPowerup3, playAchievement
  } = useSound();
  
  const { favorites, toggleFavorite, isLoaded } = useFavoriteSounds();

  const soundEffects = [
    { id: 'valid_word', name: 'Valid Word', play: playValidWord, description: 'Ascending chime sound for valid word submission' },
    { id: 'invalid_word', name: 'Invalid Word', play: playInvalidWord, description: 'Retro "bloop bloop" error sound' },
    { id: 'winner', name: 'Winner Fanfare', play: playWinner, description: 'Victory fanfare arpeggio for game winner' },
    { id: 'hover', name: 'Hover Tick', play: playHover, description: 'Subtle mechanical tick on button hover' },
    { id: 'click', name: 'Click Snap', play: playClick, description: 'Crisp mechanical click on button press' },
    { id: 'type_letter', name: 'Type Letter', play: playTypeLetter, description: 'Subtle small note for typing a letter' },
    { id: 'delete_letter', name: 'Delete Letter', play: playDeleteLetter, description: 'Subtle slightly lower note for backspace' },
    { id: 'countdown', name: 'Countdown', play: playCountdown, description: 'Theme for when a round starts (3 low, 1 high)' },
    { id: 'heart_loss', name: 'Heart Loss', play: playHeartLoss, description: 'Retro 8-bit stepped down sound for losing a heart' },
    { id: 'powerup_1', name: 'Powerup: Fast Arpeggio', play: playPowerup1, description: 'Fast ascending arpeggio for a powerup' },
    { id: 'powerup_2', name: 'Powerup: Shimmer', play: playPowerup2, description: 'Shimmering sustain for a powerup' },
    { id: 'powerup_3', name: 'Powerup: Sweep Up', play: playPowerup3, description: 'Resonant sweep up for a powerup' },
    { id: 'achievement', name: 'Achievement', play: playAchievement, description: 'Small glimmery sound effect for achievements' },
  ];

  if (!isLoaded) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold uppercase mb-2">Sound Effects Library</h1>
            <p className="text-lg opacity-80">Developer showcase of all available retro arcade sound effects.</p>
          </div>
          <Button variant={isMuted ? "danger" : "success"} onClick={toggleMute}>
            {isMuted ? 'Unmute All' : 'Mute All'}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {soundEffects.map((sound) => {
            const isFav = favorites.includes(sound.id);
            return (
              <div 
                key={sound.id} 
                className={`
                  p-6 border-4 border-black rounded-brutal shadow-brutal 
                  bg-white transition-all duration-150 ease-brutal
                  hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_#000]
                `}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold font-display uppercase">{sound.name}</h2>
                    <p className="text-sm mt-1 text-gray-700">{sound.description}</p>
                  </div>
                  <button 
                    onClick={() => toggleFavorite(sound.id)}
                    className="text-3xl hover:scale-110 transition-transform focus:outline-none"
                    title={isFav ? "Remove from favorites" : "Add to favorites"}
                  >
                    {isFav ? '⭐' : '☆'}
                  </button>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <Button onClick={() => {
                    // Temporarily unmute if it's muted just to showcase? 
                    // Better to rely on context's mute state so user is aware it's muted.
                    if (isMuted) {
                      alert("Sounds are currently muted! Unmute to hear the preview.");
                    } else {
                      sound.play();
                    }
                  }} variant="primary">
                    Play Sound
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

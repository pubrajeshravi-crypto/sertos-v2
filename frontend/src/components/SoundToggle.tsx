import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundMuted, playSound, setSoundMuted, unlockAudio } from "../lib/sound";

export default function SoundToggle() {
  const [muted, setMuted] = useState(isSoundMuted);

  const toggleSound = async () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setSoundMuted(nextMuted);
    if (!nextMuted) {
      await unlockAudio();
      playSound("tick");
    }
  };

  const Icon = muted ? VolumeX : Volume2;

  return (
    <button
      type="button"
      className="app-sound-toggle glass-pill"
      onClick={toggleSound}
      aria-label={muted ? "Unmute interface sounds" : "Mute interface sounds"}
      aria-pressed={!muted}
      title={muted ? "Unmute interface sounds" : "Mute interface sounds"}
    >
      <Icon size={16} />
      <span>{muted ? "SOUND OFF" : "SOUND ON"}</span>
    </button>
  );
}

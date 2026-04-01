// src/components/cliente/SpotifyMiniPlayer.tsx
// Player Spotify Web Playback SDK - Clicou, tocou!

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack } from "lucide-react";

// Configurações do Spotify
const SPOTIFY_ACCESS_TOKEN = import.meta.env.VITE_SPOTIFY_ACCESS_TOKEN || "";
const PLAYLIST_URI = "spotify:playlist:2PsCOO9XxWzFT7rloVbyfv"; // Rádio WGxperience

// DeclaraçÍo do tipo Spotify para TypeScript
declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayer {
  addListener: (event: string, callback: (state: any) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  getCurrentState: () => Promise<PlayerState | null>;
}

interface PlayerState {
  paused: boolean;
  track_window?: {
    current_track?: {
      name: string;
      artists: { name: string }[];
      album: { images: { url: string }[] };
    };
  };
}

// Ícone do Spotify
const SpotifyIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

// Logo WG mini
const WGLogo = () => (
  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
    <span className="text-[8px] font-normal text-white">WG</span>
  </div>
);

export default function SpotifyMiniPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{ name: string; artist: string; image: string } | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const previousVolume = useRef(0.5);

  // Carregar o SDK do Spotify
  useEffect(() => {
    if (!SPOTIFY_ACCESS_TOKEN) {
      setError("Token Spotify não configurado");
      return;
    }

    // Verificar se o SDK já está carregado
    if (window.Spotify) {
      setIsSDKReady(true);
      return;
    }

    // Carregar o script do SDK
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setIsSDKReady(true);
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  // Inicializar o player quando o SDK estiver pronto
  useEffect(() => {
    if (!isSDKReady || !SPOTIFY_ACCESS_TOKEN || playerRef.current) return;

    const player = new window.Spotify.Player({
      name: "Rádio WGxperience",
      getOAuthToken: (cb) => cb(SPOTIFY_ACCESS_TOKEN),
      volume: 0.5,
    });

    // Listeners de eventos
    player.addListener("ready", (payload: any) => {
      const device_id = payload?.device_id as string | undefined;
      if (!device_id) return;
      console.log("Spotify Player ready with Device ID:", device_id);
      setDeviceId(device_id);
      setError(null);
    });

    player.addListener("not_ready", (payload: any) => {
      const device_id = payload?.device_id as string | undefined;
      if (!device_id) return;
      console.log("Device ID has gone offline:", device_id);
    });

    player.addListener("initialization_error", (payload: any) => {
      const message = payload?.message as string | undefined;
      console.error("Initialization Error:", message);
      setError("Erro ao inicializar player");
    });

    player.addListener("authentication_error", (payload: any) => {
      const message = payload?.message as string | undefined;
      console.error("Authentication Error:", message);
      setError("Token expirado - reconecte");
    });

    player.addListener("account_error", (payload: any) => {
      const message = payload?.message as string | undefined;
      console.error("Account Error:", message);
      setError("Conta Premium necessária");
    });

    player.addListener("player_state_changed", (state: any) => {
      if (!state || typeof state !== "object" || !("paused" in state)) return;
      const playerState = state as PlayerState;

      const track = playerState.track_window?.current_track;
      if (track) {
        setCurrentTrack({
          name: track.name,
          artist: track.artists.map((a) => a.name).join(", "),
          image: track.album.images[0]?.url || "",
        });
      }

      setIsPaused(playerState.paused);
      setIsPlaying(!playerState.paused);
    });

    player.connect().then((success) => {
      if (success) {
        console.log("Spotify Player conectado!");
        playerRef.current = player;
      }
    });
  }, [isSDKReady]);

  // FunçÍo para iniciar a reproduçÍo da playlist
  const startPlaylist = useCallback(async () => {
    if (!deviceId || !SPOTIFY_ACCESS_TOKEN) return;

    try {
      // Transferir reproduçÍo para este dispositivo e iniciar playlist
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${SPOTIFY_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context_uri: PLAYLIST_URI,
          offset: { position: 0 },
          position_ms: 0,
        }),
      });
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      console.error("Erro ao iniciar playlist:", err);
      setError("Erro ao iniciar");
    }
  }, [deviceId]);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.togglePlay();
    } else if (deviceId) {
      await startPlaylist();
    }
  }, [deviceId, startPlaylist]);

  // Próxima faixa
  const nextTrack = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.nextTrack();
    }
  }, []);

  // Faixa anterior
  const prevTrack = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.previousTrack();
    }
  }, []);

  // Controle de volume
  const handleVolumeChange = useCallback(async (newVolume: number) => {
    setVolume(newVolume);
    if (playerRef.current) {
      await playerRef.current.setVolume(newVolume);
    }
    if (newVolume > 0) {
      setIsMuted(false);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (isMuted) {
      await handleVolumeChange(previousVolume.current);
    } else {
      previousVolume.current = volume;
      await handleVolumeChange(0);
    }
    setIsMuted(!isMuted);
  }, [isMuted, volume, handleVolumeChange]);

  // Handler para abrir/fechar player
  const handleTogglePlayer = () => {
    setIsOpen(!isOpen);
    if (!isOpen && deviceId && !isPlaying) {
      // Auto-play quando abre
      startPlaylist();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Se não tem token, mostra versÍo embed simples
  if (!SPOTIFY_ACCESS_TOKEN) {
    return <SpotifyEmbedFallback />;
  }

  return (
    <>
      {/* BotÍo Badge no Header */}
      <button
        type="button"
        onClick={handleTogglePlayer}
        className={`flex items-center gap-2 rounded-full px-3 py-2 transition-all cursor-pointer ${
          isPlaying
            ? "bg-[#1DB954]/20 border border-[#1DB954]/50"
            : "bg-white/10 hover:bg-white/20"
        }`}
        title="Rádio WGxperience - Clique para ouvir"
      >
        <SpotifyIcon size={16} />
        <WGLogo />
        <span className="text-xs text-gray-100 hidden sm:inline">
          {isPlaying ? "Tocando" : "Rádio WGxperience"}
        </span>
        {isPlaying && (
          <div className="flex items-center gap-0.5">
            <span className="w-1 h-3 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-4 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-2 bg-[#1DB954] rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </button>

      {/* Player Flutuante */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#121212] rounded-2xl shadow-2xl overflow-hidden border border-white/10 w-[340px]">
            {/* Header do Player */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1DB954]/20 to-transparent">
              <div className="flex items-center gap-3">
                <SpotifyIcon size={20} />
                <div>
                  <p className="text-white text-sm font-medium">Rádio WGxperience</p>
                  <p className="text-gray-400 text-xs">
                    {error || (deviceId ? "Conectado" : "Conectando...")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white transition"
                title="Fechar player"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info da música atual */}
            {currentTrack && (
              <div className="flex items-center gap-3 px-4 py-3 bg-black/30">
                {currentTrack.image && (
                  <img
                    src={currentTrack.image}
                    alt={currentTrack.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{currentTrack.name}</p>
                  <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
                </div>
              </div>
            )}

            {/* Controles */}
            <div className="px-4 py-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={prevTrack}
                  className="p-2 text-gray-400 hover:text-white transition"
                  title="Anterior"
                >
                  <SkipBack size={20} />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!deviceId}
                  className="p-4 bg-white rounded-full text-black hover:scale-105 transition disabled:opacity-50"
                  title={isPaused ? "Play" : "Pause"}
                >
                  {isPaused || !isPlaying ? <Play size={24} fill="black" /> : <Pause size={24} fill="black" />}
                </button>

                <button
                  type="button"
                  onClick={nextTrack}
                  className="p-2 text-gray-400 hover:text-white transition"
                  title="Próxima"
                >
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Controle de volume */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1 text-gray-400 hover:text-white transition"
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-black/50 text-center">
              <p className="text-[10px] text-gray-500">
                Conta Premium WG Almeida
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop para fechar (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={handleClose}
        />
      )}
    </>
  );
}

// Fallback com embed do Spotify (quando não tem token)
function SpotifyEmbedFallback() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 hover:bg-white/20 transition cursor-pointer"
        title="Rádio WGxperience"
      >
        <SpotifyIcon size={16} />
        <WGLogo />
        <span className="text-xs text-gray-100 hidden sm:inline">Rádio WGxperience</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#121212] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <SpotifyIcon size={20} />
                <span className="text-white text-sm font-medium">Rádio WGxperience</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <iframe
              src="https://open.spotify.com/embed/playlist/2PsCOO9XxWzFT7rloVbyfv?utm_source=generator&theme=0"
              width="340"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Player"
            />
          </div>
        </div>
      )}
    </>
  );
}



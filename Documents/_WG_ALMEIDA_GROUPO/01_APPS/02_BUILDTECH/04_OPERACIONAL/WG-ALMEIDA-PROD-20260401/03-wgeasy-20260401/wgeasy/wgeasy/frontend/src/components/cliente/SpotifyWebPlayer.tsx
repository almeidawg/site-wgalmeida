// src/components/cliente/SpotifyWebPlayer.tsx
// Spotify Web Player com conta WG Premium logada
// Permite tocar músicas sem anúncios e sem pular

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Radio } from 'lucide-react';

// Configurações do Spotify - PREENCHER COM SUAS CREDENCIAIS
const SPOTIFY_CONFIG = {
  // Obter em: https://developer.spotify.com/dashboard
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
  // Token de acesso (gerado pelo backend ou manualmente)
  ACCESS_TOKEN: import.meta.env.VITE_SPOTIFY_ACCESS_TOKEN || '',
  // ID da playlist Rádio WGxperience
  PLAYLIST_ID: '2PsCOO9XxWzFT7rloVbyfv',
  PLAYLIST_URL: 'https://open.spotify.com/playlist/2PsCOO9XxWzFT7rloVbyfv',
};

interface Track {
  name: string;
  artists: string;
  album: string;
  albumArt: string;
  duration: number;
  position: number;
}

interface SpotifyWebPlayerProps {
  onClose?: () => void;
  compact?: boolean;
}

// Nota: Window.Spotify e Window.onSpotifyWebPlaybackSDKReady já declarados em SpotifyMiniPlayer.tsx
interface WebPlaybackState {
  track_window: {
    current_track: {
      name: string;
      artists: { name: string }[];
      album: { name: string; images: { url: string }[] };
      duration_ms: number;
    };
  };
  position: number;
  paused: boolean;
}

interface SpotifyWebSDKPlayer {
  addListener: (event: string, callback: (state: any) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
}

export default function SpotifyWebPlayer({ onClose, compact = false }: SpotifyWebPlayerProps) {
  const playerRef = useRef<SpotifyWebSDKPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar o SDK do Spotify
  useEffect(() => {
    // Se não tiver token, usar embed simples
    if (!SPOTIFY_CONFIG.ACCESS_TOKEN) {
      setError('Token não configurado - usando player embed');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Rádio WGxperience - WG Almeida',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(SPOTIFY_CONFIG.ACCESS_TOKEN);
        },
        volume: 0.5,
      });

      // Listeners de eventos
      spotifyPlayer.addListener('ready', (payload: any) => {
        const device_id = payload?.device_id as string | undefined;
        if (!device_id) return;
        console.log('Spotify Player pronto! Device ID:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener('not_ready', (payload: any) => {
        const device_id = payload?.device_id as string | undefined;
        if (!device_id) return;
        console.log('Device offline:', device_id);
        setIsReady(false);
      });

      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state || typeof state !== 'object' || !("position" in state) || !("paused" in state)) return;
        const playerState = state as WebPlaybackState;

        const track = playerState.track_window.current_track;
        setCurrentTrack({
          name: track.name,
          artists: track.artists.map((a) => a.name).join(', '),
          album: track.album.name,
          albumArt: track.album.images[0]?.url || '',
          duration: track.duration_ms,
          position: playerState.position,
        });
        setIsPlaying(!playerState.paused);
      });

      spotifyPlayer.addListener('initialization_error', (payload: any) => {
        const message = payload?.message as string | undefined;
        console.error('Erro de inicializaçÍo:', message);
        setError('Erro ao inicializar player');
      });

      spotifyPlayer.addListener('authentication_error', (payload: any) => {
        const message = payload?.message as string | undefined;
        console.error('Erro de autenticaçÍo:', message);
        setError('Token expirado - reautenticar');
      });

      spotifyPlayer.addListener('account_error', (payload: any) => {
        const message = payload?.message as string | undefined;
        console.error('Erro de conta:', message);
        setError('Conta Premium necessária');
      });

      spotifyPlayer.connect();
      playerRef.current = spotifyPlayer as unknown as SpotifyWebSDKPlayer;
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  // Iniciar playlist
  const startPlaylist = useCallback(async () => {
    if (!deviceId || !SPOTIFY_CONFIG.ACCESS_TOKEN) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SPOTIFY_CONFIG.ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          context_uri: `spotify:playlist:${SPOTIFY_CONFIG.PLAYLIST_ID}`,
          offset: { position: 0 },
        }),
      });
    } catch (err) {
      console.error('Erro ao iniciar playlist:', err);
    }
  }, [deviceId]);

  // Controles do player
  const togglePlay = () => playerRef.current?.togglePlay();
  const nextTrack = () => playerRef.current?.nextTrack();
  const previousTrack = () => playerRef.current?.previousTrack();

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    playerRef.current?.setVolume(newVolume / 100);
  };

  const toggleMute = () => {
    if (isMuted) {
      playerRef.current?.setVolume(volume / 100);
    } else {
      playerRef.current?.setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  // Se não tiver token configurado, mostrar embed simples
  if (error || !SPOTIFY_CONFIG.ACCESS_TOKEN) {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-[8px] font-normal text-white">WG</span>
            </div>
            <span className="text-white text-sm font-medium">Rádio WGxperience</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <iframe
          title="Spotify Player - Rádio WGxperience"
          src={`https://open.spotify.com/embed/playlist/${SPOTIFY_CONFIG.PLAYLIST_ID}?utm_source=generator&theme=0`}
          width="100%"
          height={compact ? "152" : "352"}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="bg-gray-900"
        />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg text-white">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-[8px] font-normal">WG</span>
          </div>
          <span className="text-sm font-medium">Rádio WGxperience</span>
          {isReady && <Radio className="w-3 h-3 text-green-400 animate-pulse" />}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Player Content */}
      <div className="p-4">
        {!isReady ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Conectando ao Spotify...</p>
            <button
              onClick={startPlaylist}
              className="mt-3 px-4 py-2 bg-green-500 rounded-full text-sm font-medium hover:bg-green-600 transition"
            >
              Iniciar Playlist
            </button>
          </div>
        ) : currentTrack ? (
          <div className="flex items-center gap-4">
            {/* Album Art */}
            <img
              src={currentTrack.albumArt}
              alt={currentTrack.album}
              className="w-16 h-16 rounded-lg shadow-lg"
            />

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentTrack.name}</p>
              <p className="text-sm text-gray-400 truncate">{currentTrack.artists}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400">Pronto para tocar</p>
            <button
              onClick={startPlaylist}
              className="mt-3 px-4 py-2 bg-green-500 rounded-full text-sm font-medium hover:bg-green-600 transition"
            >
              Iniciar Playlist
            </button>
          </div>
        )}

        {/* Controls */}
        {isReady && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button onClick={previousTrack} className="p-2 hover:bg-white/10 rounded-full transition">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="p-3 bg-white rounded-full text-gray-900 hover:scale-105 transition"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="p-2 hover:bg-white/10 rounded-full transition">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Volume */}
        {isReady && (
          <div className="mt-4 flex items-center gap-2">
            <button onClick={toggleMute} className="p-1 hover:bg-white/10 rounded transition">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-black/20 text-center">
        <p className="text-[10px] text-gray-500">
          Conta Premium WG Almeida • Sem anúncios
        </p>
      </div>
    </div>
  );
}



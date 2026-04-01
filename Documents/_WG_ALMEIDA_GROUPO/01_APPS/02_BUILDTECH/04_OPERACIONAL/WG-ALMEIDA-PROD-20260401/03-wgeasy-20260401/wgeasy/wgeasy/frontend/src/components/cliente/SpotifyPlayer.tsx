// src/components/cliente/SpotifyPlayer.tsx
// Rádio WGxperience - Player do Spotify
// BotÍo flutuante com player expandível (músicas completas requerem login no Spotify)

import { useState } from 'react';
import { Radio, X, ExternalLink, LogIn } from 'lucide-react';

interface SpotifyPlayerProps {
  playlistUrl?: string;
}

// URL padrÍo da playlist Rádio WGxperience
const DEFAULT_PLAYLIST_URL = 'https://open.spotify.com/playlist/2PsCOO9XxWzFT7rloVbyfv';

// Extrair ID da playlist do Spotify
function extractPlaylistId(url: string): string | null {
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Logo WG pequeno em SVG
const WGLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
    <text x="2" y="18" fontSize="14" fontWeight="bold" fontFamily="Arial">WG</text>
  </svg>
);

// Ícone do Spotify
const SpotifyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

export default function SpotifyPlayer({ playlistUrl = DEFAULT_PLAYLIST_URL }: SpotifyPlayerProps) {
  const [expanded, setExpanded] = useState(false);
  const playlistId = extractPlaylistId(playlistUrl);

  // URL do embed do Spotify
  const embedUrl = playlistId
    ? `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`
    : null;

  if (!embedUrl) return null;

  return (
    <>
      {/* Player expandido */}
      {expanded && (
        <div className="fixed bottom-20 right-4 z-50 w-[340px] shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SpotifyIcon />
              <WGLogo />
              <span className="text-sm font-medium">Rádio WGxperience</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 hover:bg-white/10 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <iframe
            title="Spotify Player - Rádio WGxperience"
            src={embedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="bg-[#121212]"
          />
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-3 py-2 text-center">
            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <LogIn className="w-3 h-3 text-green-400" />
              Faça login no Spotify para ouvir músicas completas
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// BotÍo flutuante - ESTE É O PRINCIPAL
export function SpotifyFloatingButton() {
  const [showPlayer, setShowPlayer] = useState(false);
  const playlistId = extractPlaylistId(DEFAULT_PLAYLIST_URL);
  // Altura 352 permite interface de login do Spotify
  const embedUrl = playlistId
    ? `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`
    : null;

  return (
    <>
      {/* BotÍo Flutuante */}
      <button
        onClick={() => setShowPlayer(!showPlayer)}
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all duration-300 ${
          showPlayer
            ? 'bg-gray-800 text-white'
            : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700'
        }`}
        title="Rádio WGxperience"
      >
        <SpotifyIcon />
        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-[8px] font-normal">WG</span>
        </div>
        <span className="text-xs font-medium hidden sm:inline">Rádio WGxperience</span>
        {!showPlayer && <Radio className="w-3 h-3 animate-pulse text-green-400" />}
        {showPlayer && <X className="w-3 h-3" />}
      </button>

      {/* Player Modal Expandido */}
      {showPlayer && embedUrl && (
        <div className="fixed bottom-16 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SpotifyIcon />
              <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-[6px] font-normal">WG</span>
              </div>
              <span className="text-xs font-medium">Rádio WGxperience</span>
            </div>
            <a
              href={DEFAULT_PLAYLIST_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Abrir App
            </a>
          </div>

          {/* Spotify Embed - Altura 352 para mostrar interface completa com login */}
          <iframe
            title="Spotify Player - Rádio WGxperience"
            src={embedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="bg-[#121212]"
          />

          {/* Footer com dica */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-3 py-2">
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
              <LogIn className="w-3 h-3 text-green-400" />
              <span>Faça login no Spotify para ouvir músicas completas</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/SpotifyCallbackPage.tsx
// Página de callback para autenticaçÍo Spotify OAuth
// Captura o token e exibe para configuraçÍo

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'c423a2c0af194bb6ba0aff3a67c26dc1';
const REDIRECT_URI = window.location.origin + '/spotify-callback';

export default function SpotifyCallbackPage() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam) {
      setError('AutorizaçÍo negada: ' + errorParam);
      return;
    }

    if (code) {
      // Temos o code, agora precisamos trocar por token
      // Nota: Em produçÍo, isso deveria ser feito no backend
      setLoading(true);
      exchangeCodeForToken(code);
    }
  }, [code, errorParam]);

  const exchangeCodeForToken = async (authCode: string) => {
    try {
      // IMPORTANTE: Em produçÍo, essa troca deve ser feita no backend
      // pois expõe o client_secret
      // Por enquanto, vamos mostrar instruções para fazer manualmente

      setToken(null);
      setError('CODE_RECEIVED');
      setLoading(false);
    } catch (err) {
      setError('Erro ao obter token');
      setLoading(false);
    }
  };

  const startAuth = () => {
    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
      'playlist-read-collaborative',
    ].join('%20');

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}`;

    window.location.href = authUrl;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: text.substring(0, 40) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <h1 className="text-3xl font-normal">Configurar Spotify</h1>
          </div>
          <p className="text-gray-400">Rádio WGxperience - AutenticaçÍo</p>
        </div>

        {loading && (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p>Processando autenticaçÍo...</p>
          </div>
        )}

        {!code && !error && !loading && (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-300 mb-6">
              Clique no botÍo abaixo para autorizar o acesso à conta Spotify Premium da WG.
            </p>
            <button
              onClick={startAuth}
              className="bg-green-500 hover:bg-green-600 text-black font-normal px-8 py-4 rounded-full text-lg transition"
            >
              Conectar com Spotify
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Redirect URI: {REDIRECT_URI}
            </p>
          </div>
        )}

        {error === 'CODE_RECEIVED' && code && (
          <div className="space-y-6">
            <div className="bg-green-900/30 border border-green-500 rounded-xl p-6">
              <h3 className="text-green-400 font-normal text-lg mb-2">AutorizaçÍo OK!</h3>
              <p className="text-gray-300 text-sm">
                O código de autorizaçÍo foi recebido. Agora precisamos trocá-lo por um token de acesso.
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-normal mb-3">Passo 1: Copie o Code</h3>
              <div className="bg-black rounded-lg p-4 font-mono text-sm break-all">
                {code}
              </div>
              <button
                onClick={() => copyToClipboard(code)}
                className="mt-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
              >
                Copiar Code
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-normal mb-3">Passo 2: Execute no Terminal</h3>
              <p className="text-gray-400 text-sm mb-3">
                Cole e execute este comando (substitua SEU_CLIENT_SECRET pelo secret do app):
              </p>
              <div className="bg-black rounded-lg p-4 font-mono text-xs break-all overflow-x-auto">
                {`curl -X POST "https://accounts.spotify.com/api/token" -H "Content-Type: application/x-www-form-urlencoded" -d "grant_type=authorization_code" -d "code=${code}" -d "redirect_uri=${REDIRECT_URI}" -d "client_id=${SPOTIFY_CLIENT_ID}" -d "client_secret=SEU_CLIENT_SECRET"`}
              </div>
              <button
                onClick={() => copyToClipboard(`curl -X POST "https://accounts.spotify.com/api/token" -H "Content-Type: application/x-www-form-urlencoded" -d "grant_type=authorization_code" -d "code=${code}" -d "redirect_uri=${REDIRECT_URI}" -d "client_id=${SPOTIFY_CLIENT_ID}" -d "client_secret=SEU_CLIENT_SECRET"`)}
                className="mt-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
              >
                Copiar Comando
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-normal mb-3">Passo 3: Cole o Access Token no .env</h3>
              <p className="text-gray-400 text-sm mb-3">
                Copie o <code className="bg-black px-1 rounded">access_token</code> da resposta e cole no arquivo <code className="bg-black px-1 rounded">.env</code>:
              </p>
              <div className="bg-black rounded-lg p-4 font-mono text-sm text-green-400">
                VITE_SPOTIFY_ACCESS_TOKEN=seu_access_token_aqui
              </div>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-6">
              <h3 className="text-yellow-400 font-normal mb-2">Importante!</h3>
              <p className="text-gray-300 text-sm">
                O access_token expira em 1 hora. Para produçÍo, você precisará implementar
                refresh automático no backend usando o <code className="bg-black px-1 rounded">refresh_token</code>.
              </p>
            </div>
          </div>
        )}

        {error && error !== 'CODE_RECEIVED' && (
          <div className="bg-red-900/30 border border-red-500 rounded-xl p-6 text-center">
            <h3 className="text-red-400 font-normal text-lg mb-2">Erro</h3>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={startAuth}
              className="mt-4 bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {token && (
          <div className="bg-green-900/30 border border-green-500 rounded-xl p-6">
            <h3 className="text-green-400 font-normal text-lg mb-2">Token Obtido!</h3>
            <p className="text-gray-300 text-sm mb-4">
              Copie este token e cole no arquivo .env como VITE_SPOTIFY_ACCESS_TOKEN
            </p>
            <div className="bg-black rounded-lg p-4 font-mono text-sm break-all">
              {token}
            </div>
            <button
              onClick={() => copyToClipboard(token)}
              className="mt-3 bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded font-normal"
            >
              Copiar Token
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="/area-cliente" className="text-gray-400 hover:text-white text-sm">
            ← Voltar para Área do Cliente
          </a>
        </div>
      </div>
    </div>
  );
}


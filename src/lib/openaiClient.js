/**
 * Cliente OpenAI para a Liz - Assistente Virtual WG Almeida
 * Usa endpoints serverless locais para proteger chaves de API.
 */

const OPENAI_API_BASE = '/api/openai';

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/**
 * Cria uma nova thread de conversa
 */
export async function createThread() {
  const response = await fetch(`${OPENAI_API_BASE}/thread`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao criar thread');
  }

  const data = await response.json();
  return data.threadId;
}

/**
 * Envia mensagem para a Liz (função simplificada)
 */
export async function sendMessageToLiz(threadId, message) {
  const response = await fetch(`${OPENAI_API_BASE}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ threadId, message }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao enviar mensagem para a Liz');
  }

  const data = await response.json();
  return data.text || 'Desculpe, não consegui processar sua mensagem.';
}

/**
 * Sintetiza voz usando OpenAI TTS
 */
export async function synthesizeSpeech(text) {
  try {
    const response = await fetch(`${OPENAI_API_BASE}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error('Erro ao sintetizar voz:', error);
    return null;
  }
}

/**
 * Transcreve áudio usando OpenAI Whisper
 */
export async function transcribeAudio(audioBlob) {
  try {
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioBase64 = arrayBufferToBase64(audioBuffer);

    const response = await fetch(`${OPENAI_API_BASE}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm',
        language: 'pt',
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    return null;
  }
}

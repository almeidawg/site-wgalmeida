/**
 * Cliente OpenAI para a Liz - Assistente Virtual WG Almeida
 * Usa a Assistants API com o assistant treinado
 */

const OPENAI_API_BASE = 'https://api.openai.com/v1';

// ID do Assistant treinado da Liz
const LIZ_ASSISTANT_ID = 'asst_3m25CgWEgD8Nyaq4KjZ1gvtr';

/**
 * Cria uma nova thread de conversa
 */
export async function createThread() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Chave de API da OpenAI não configurada.');
  }

  const response = await fetch(`${OPENAI_API_BASE}/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao criar thread');
  }

  const data = await response.json();
  return data.id;
}

/**
 * Adiciona mensagem à thread
 */
export async function addMessageToThread(threadId, content) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const response = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      role: 'user',
      content: content,
    }),
  });

  if (!response.ok) {
    throw new Error('Erro ao adicionar mensagem');
  }

  return await response.json();
}

/**
 * Executa o assistant na thread e aguarda resposta
 */
export async function runAssistant(threadId) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // Criar run
  const runResponse = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      assistant_id: LIZ_ASSISTANT_ID,
    }),
  });

  if (!runResponse.ok) {
    throw new Error('Erro ao executar assistant');
  }

  const run = await runResponse.json();

  // Aguardar conclusão (polling)
  let status = run.status;
  let attempts = 0;
  const maxAttempts = 30;

  while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statusResponse = await fetch(
      `${OPENAI_API_BASE}/threads/${threadId}/runs/${run.id}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      }
    );

    const statusData = await statusResponse.json();
    status = statusData.status;
    attempts++;
  }

  if (status !== 'completed') {
    throw new Error('Timeout ou erro na execução do assistant');
  }

  // Buscar mensagens
  const messagesResponse = await fetch(
    `${OPENAI_API_BASE}/threads/${threadId}/messages?order=desc&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    }
  );

  const messagesData = await messagesResponse.json();
  const assistantMessage = messagesData.data[0];

  if (assistantMessage && assistantMessage.content[0]) {
    return assistantMessage.content[0].text.value;
  }

  return 'Desculpe, não consegui processar sua mensagem.';
}

/**
 * Envia mensagem para a Liz (função simplificada)
 */
export async function sendMessageToLiz(threadId, message) {
  await addMessageToThread(threadId, message);
  return await runAssistant(threadId);
}

/**
 * Sintetiza voz usando OpenAI TTS
 */
export async function synthesizeSpeech(text) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`${OPENAI_API_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova', // Voz feminina suave
        response_format: 'mp3',
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
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
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

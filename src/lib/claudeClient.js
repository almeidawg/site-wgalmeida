// Cliente para API do Claude (Anthropic Messages API)
export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export async function sendClaudePrompt(prompt, temperature = 0.7) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error('Chave de API da Claude não configurada (VITE_CLAUDE_API_KEY).');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();

  // Extrair texto da resposta
  if (data.content && data.content[0] && data.content[0].text) {
    return data.content[0].text;
  }

  throw new Error('Resposta inesperada da API Claude');
}

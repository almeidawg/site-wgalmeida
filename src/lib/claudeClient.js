// Cliente para Claude via endpoint serverless local
export async function sendClaudePrompt(prompt, temperature = 0.7) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  if (data.text) {
    return data.text;
  }

  throw new Error('Resposta inesperada do endpoint Claude');
}

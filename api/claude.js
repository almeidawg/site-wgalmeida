const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = process.env.CLAUDE_MODEL?.trim() || 'claude-3-5-sonnet-latest';

function parseJsonBody(req) {
  if (!req.body) return {};

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

function ensureConfigured(res) {
  if (!process.env.CLAUDE_API_KEY?.trim()) {
    res.status(503).json({ error: { message: 'CLAUDE_API_KEY not configured' } });
    return false;
  }

  return true;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!ensureConfigured(res)) {
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const body = parseJsonBody(req);
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const temperature = Number(body.temperature);

  if (!prompt) {
    return res.status(400).json({ error: { message: 'prompt is required' } });
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY.trim(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 2048,
        temperature: Number.isFinite(temperature) ? Math.min(Math.max(temperature, 0), 1) : 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error?.message || 'Claude API request failed';
      return res.status(response.status).json({ error: { message } });
    }

    const text = Array.isArray(data?.content)
      ? data.content
          .filter((item) => item?.type === 'text' && typeof item.text === 'string')
          .map((item) => item.text)
          .join('\n\n')
          .trim()
      : '';

    if (!text) {
      return res.status(502).json({ error: { message: 'Claude response did not contain text' } });
    }

    return res.status(200).json({ text, model: data.model || DEFAULT_MODEL });
  } catch (error) {
    return res.status(500).json({ error: { message: error.message || 'Unexpected Claude proxy error' } });
  }
}

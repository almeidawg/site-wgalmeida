const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL = 'https://api.stability.ai/v1';

const NEGATIVE_PROMPT = 'blurry, low quality, distorted, ugly, bad architecture, unrealistic';

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

async function readBlobFromDataUrl(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

function ensureConfigured(res) {
  if (!STABILITY_API_KEY) {
    res.status(503).json({ error: 'STABILITY_API_KEY not configured' });
    return false;
  }

  return true;
}

async function proxyJsonRequest(endpoint, body) {
  const response = await fetch(`${STABILITY_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Stability API request failed');
  }

  return response.json();
}

async function proxyFormRequest(endpoint, formData) {
  const response = await fetch(`${STABILITY_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Stability API request failed');
  }

  return response.json();
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!ensureConfigured(res)) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch(`${STABILITY_API_URL}/user/balance`, {
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText || 'Failed to fetch balance' });
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseJsonBody(req);
  const action = body.action;

  try {
    if (action === 'generate') {
      const {
        prompt,
        width = 1024,
        height = 1024,
        samples = 1,
        steps = 30,
        cfgScale = 7,
        style = 'photographic',
      } = body;

      if (!prompt) {
        return res.status(400).json({ error: 'prompt is required' });
      }

      const data = await proxyJsonRequest(
        '/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: NEGATIVE_PROMPT, weight: -1 },
          ],
          cfg_scale: cfgScale,
          width,
          height,
          samples,
          steps,
          style_preset: style,
        },
      );

      return res.status(200).json(data);
    }

    if (action === 'transform') {
      const {
        imageBase64,
        prompt,
        mimeType = 'image/png',
        strength = 0.35,
        steps = 30,
        cfgScale = 7,
        style = 'photographic',
      } = body;

      if (!imageBase64 || !prompt) {
        return res.status(400).json({ error: 'imageBase64 and prompt are required' });
      }

      const formData = new FormData();
      const imageBlob = await readBlobFromDataUrl(`data:${mimeType};base64,${imageBase64}`);

      formData.append('init_image', imageBlob, `room-visualizer.${mimeType.split('/')[1] || 'png'}`);
      formData.append('text_prompts[0][text]', prompt);
      formData.append('text_prompts[0][weight]', '1');
      formData.append('text_prompts[1][text]', 'blurry, low quality, distorted, ugly');
      formData.append('text_prompts[1][weight]', '-1');
      formData.append('image_strength', String(1 - strength));
      formData.append('cfg_scale', String(cfgScale));
      formData.append('steps', String(steps));
      formData.append('style_preset', style);

      const data = await proxyFormRequest(
        '/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
        formData,
      );

      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

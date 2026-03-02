// Google Analytics 4 — busca sessões e conversões por canal
// Env vars necessárias: GA4_PROPERTY_ID, GOOGLE_SA_CLIENT_EMAIL, GOOGLE_SA_PRIVATE_KEY
// Auth: Google Service Account via JWT (Node.js crypto — sem dependências externas)

import crypto from 'crypto';

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

async function getGoogleToken(clientEmail, privateKey) {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const sig = sign.sign(privateKey, 'base64url');
  const jwt = `${signingInput}.${sig}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token error: ${err}`);
  }
  const data = await resp.json();
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const clientEmail = process.env.GOOGLE_SA_CLIENT_EMAIL?.trim();
  // Handle both actual newlines and escaped \n sequences; strip \r from Windows line endings
  const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/\r/g, '').trim();

  if (!propertyId || !clientEmail || !privateKey) {
    return res.status(200).json({ source: 'no_credentials' });
  }

  try {
    const token = await getGoogleToken(clientEmail, privateKey);

    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const body = {
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'sessions' },
        { name: 'conversions' },
        { name: 'totalUsers' },
      ],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('GA4 API error:', resp.status, err);
      return res.status(200).json({ source: 'api_error', error: err });
    }

    const data = await resp.json();

    const rows = (data.rows || []).map((row) => ({
      channel: row.dimensionValues?.[0]?.value || 'Unknown',
      sessions: Number(row.metricValues?.[0]?.value || 0),
      conversions: Number(row.metricValues?.[1]?.value || 0),
      users: Number(row.metricValues?.[2]?.value || 0),
    }));

    return res.status(200).json({ source: 'google_analytics', rows });
  } catch (err) {
    console.error('GA4 handler error:', err);
    return res.status(200).json({ source: 'error', error: err.message });
  }
}

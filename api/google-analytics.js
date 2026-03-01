// Google Analytics 4 — busca sessões e conversões por canal
// Env vars necessárias: GA4_PROPERTY_ID, GOOGLE_SA_CLIENT_EMAIL, GOOGLE_SA_PRIVATE_KEY
// Auth: Google Service Account via JWT (google-auth-library)

import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GOOGLE_SA_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!propertyId || !clientEmail || !privateKey) {
    return res.status(200).json({ source: 'no_credentials' });
  }

  try {
    const auth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const { token } = await auth.getAccessToken();

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

    // Normalizar rows para { channel, sessions, conversions, users }
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

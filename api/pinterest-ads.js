// Pinterest Ads API — busca gasto e performance do mês
// Env vars necessárias: PINTEREST_ACCESS_TOKEN, PINTEREST_AD_ACCOUNT_ID

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const accountId = process.env.PINTEREST_AD_ACCOUNT_ID;

  if (!token || !accountId) {
    return res.status(200).json({ source: 'no_credentials' });
  }

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const url = `https://api.pinterest.com/v5/ad_accounts/${accountId}/analytics?start_date=${startDate}&end_date=${endDate}&columns=SPEND_IN_DOLLAR,IMPRESSION_1,CLICKTHROUGH_1&granularity=TOTAL`;

  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Pinterest Ads API error:', resp.status, err);
      return res.status(200).json({ source: 'api_error', error: err });
    }

    const data = await resp.json();
    const row = Array.isArray(data) ? data[0] : null;

    return res.status(200).json({
      source: 'pinterest_ads',
      spend: row ? Number(row.SPEND_IN_DOLLAR || 0) : 0,
      impressions: row ? Number(row.IMPRESSION_1 || 0) : 0,
      clicks: row ? Number(row.CLICKTHROUGH_1 || 0) : 0,
      raw: row,
    });
  } catch (err) {
    console.error('Pinterest Ads handler error:', err);
    return res.status(200).json({ source: 'error', error: err.message });
  }
}

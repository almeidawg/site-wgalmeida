// Meta Ads API — busca dados de investimento e performance do mês
// Env vars necessárias: META_ADS_ACCESS_TOKEN, META_AD_ACCOUNT_ID

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const token = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !accountId) {
    return res.status(200).json({ source: 'no_credentials' });
  }

  const datePreset = req.query?.date_preset || 'this_month';
  const url = `https://graph.facebook.com/v20.0/act_${accountId}/insights?fields=spend,impressions,clicks,cpc,cpm,actions&date_preset=${datePreset}&access_token=${encodeURIComponent(token)}`;

  try {
    const resp = await fetch(url);

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Meta Ads API error:', resp.status, err);
      return res.status(200).json({ source: 'api_error', error: err });
    }

    const data = await resp.json();
    const insight = data.data?.[0] || null;

    return res.status(200).json({
      source: 'meta_ads',
      spend: insight ? Number(insight.spend || 0) : 0,
      impressions: insight ? Number(insight.impressions || 0) : 0,
      clicks: insight ? Number(insight.clicks || 0) : 0,
      cpc: insight ? Number(insight.cpc || 0) : 0,
      raw: insight,
    });
  } catch (err) {
    console.error('Meta Ads handler error:', err);
    return res.status(200).json({ source: 'error', error: err.message });
  }
}

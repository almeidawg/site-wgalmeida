// Leads API — GET lista de leads (últimos 90 dias) | PATCH atualiza status
// Tabelas: propostas_solicitadas + contacts no Supabase (service role)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ahlqzzkxuutwoepirpzr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseHeaders = () => ({
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
});

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' });
  }

  // PATCH — atualiza status de um lead
  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, tipo, status } = body || {};

      if (!id || !tipo || !status) {
        return res.status(400).json({ error: 'id, tipo e status são obrigatórios' });
      }

      const table = tipo === 'proposta' ? 'propostas_solicitadas' : 'contacts';
      const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`;

      const resp = await fetch(url, {
        method: 'PATCH',
        headers: { ...supabaseHeaders(), 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        return res.status(400).json({ error: err });
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('PATCH leads error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET — lista leads dos últimos 90 dias
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const headers = supabaseHeaders();

    const [propostasResp, contactsResp] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/propostas_solicitadas?select=id,nome,email,telefone,utm_source,utm_medium,utm_campaign,origem,status,created_at&created_at=gte.${ninetyDaysAgo}&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/contacts?select=id,name,email,phone,utm_source,utm_medium,utm_campaign,origem,status,created_at&created_at=gte.${ninetyDaysAgo}&order=created_at.desc`,
        { headers }
      ),
    ]);

    const propostas = propostasResp.ok ? await propostasResp.json() : [];
    const contacts = contactsResp.ok ? await contactsResp.json() : [];

    const leads = [
      ...propostas.map((p) => ({
        id: p.id,
        nome: p.nome || p.email || '—',
        email: p.email,
        telefone: p.telefone,
        utm_source: p.utm_source,
        utm_medium: p.utm_medium,
        utm_campaign: p.utm_campaign,
        origem: p.origem,
        status: p.status || 'nova',
        created_at: p.created_at,
        tipo: 'proposta',
      })),
      ...contacts.map((c) => ({
        id: c.id,
        nome: c.name || c.email || '—',
        email: c.email,
        telefone: c.phone,
        utm_source: c.utm_source,
        utm_medium: c.utm_medium,
        utm_campaign: c.utm_campaign,
        origem: c.origem,
        status: c.status || 'nova',
        created_at: c.created_at,
        tipo: 'contato',
      })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({ leads });
  } catch (err) {
    console.error('GET leads error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Campaigns API — CRUD para campanhas de landing page com UTM
// GET: lista campanhas | POST: cria | PATCH: atualiza | DELETE: remove

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ahlqzzkxuutwoepirpzr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sbHeaders = () => ({
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' });
  }

  // GET — listar campanhas
  if (req.method === 'GET') {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/campaigns?select=*&order=created_at.desc&limit=100`,
        { headers: sbHeaders() }
      );
      const data = r.ok ? await r.json() : [];
      return res.status(200).json({ campaigns: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

  // POST — criar campanha
  if (req.method === 'POST') {
    try {
      const { nome, landing_page_id, landing_page_label, utm_source, utm_medium, utm_campaign,
              utm_content, texto_titulo, texto_subtitulo, texto_cta, notas } = body;
      if (!nome || !landing_page_id) {
        return res.status(400).json({ error: 'nome e landing_page_id são obrigatórios' });
      }
      const payload = {
        nome, landing_page_id, landing_page_label,
        utm_source: utm_source || '', utm_medium: utm_medium || '',
        utm_campaign: utm_campaign || '', utm_content: utm_content || '',
        texto_titulo: texto_titulo || '', texto_subtitulo: texto_subtitulo || '',
        texto_cta: texto_cta || '', notas: notas || '',
        status: 'rascunho',
        updated_at: new Date().toISOString(),
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/campaigns`, {
        method: 'POST',
        headers: sbHeaders(),
        body: JSON.stringify(payload),
      });
      if (!r.ok) return res.status(400).json({ error: await r.text() });
      const rows = await r.json();
      return res.status(201).json({ campaign: Array.isArray(rows) ? rows[0] : rows });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH — atualizar campanha
  if (req.method === 'PATCH') {
    try {
      const { id, ...fields } = body;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const payload = { ...fields, updated_at: new Date().toISOString() };
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/campaigns?id=eq.${encodeURIComponent(id)}`,
        { method: 'PATCH', headers: sbHeaders(), body: JSON.stringify(payload) }
      );
      if (!r.ok) return res.status(400).json({ error: await r.text() });
      const rows = await r.json();
      return res.status(200).json({ campaign: Array.isArray(rows) ? rows[0] : rows });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE — remover campanha
  if (req.method === 'DELETE') {
    try {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/campaigns?id=eq.${encodeURIComponent(id)}`,
        { method: 'DELETE', headers: { ...sbHeaders(), Prefer: 'return=minimal' } }
      );
      if (!r.ok) return res.status(400).json({ error: await r.text() });
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

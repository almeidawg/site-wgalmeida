import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from '@/lib/motion-lite';
import {
  Search, FileText, TrendingUp, Send, Loader2, Copy, Check,
  BarChart3, Target, Lightbulb, Globe, RefreshCw, Star,
  Share2, ExternalLink, Layers, MessageSquare, Zap, Settings, Eye, EyeOff, Save,
  Users, ChevronDown,
} from 'lucide-react';
import { sendClaudePrompt } from '@/lib/claudeClient';
import SEO from '@/components/SEO';
import { useTranslation } from 'react-i18next';

// ─── Contexto da empresa ──────────────────────────────────────────────────────
const WG_CONTEXT = `
CONTEXTO DA EMPRESA - GRUPO WG ALMEIDA:

SOBRE:
- Empresa com 14 anos de atuação em São Paulo
- Ecossistema integrado: Arquitetura + Engenharia + Marcenaria
- Sistema Turn Key Premium: um time, um contrato, um padrão
- Segmento: Alto padrão residencial e corporativo

REGIÕES DE ATUAÇÃO:
- Brooklin, Vila Nova Conceição, Itaim Bibi, Jardins, Cidade Jardim, Morumbi

DIFERENCIAIS:
- Projetos autorais com viabilidade técnica
- Execução com precisão e controle total
- Mobiliário premium integrado ao projeto
- Do conceito à entrega sob um único padrão

TOM DE VOZ:
- Profissional e confiante
- Técnico mas acessível
- Luxo silencioso (sem exageros)
- Autoridade sem arrogância

PALAVRAS-CHAVE PRINCIPAIS:
- arquitetura alto padrão são paulo
- reforma apartamento alto padrão
- engenharia residencial premium
- marcenaria sob medida sp
- projeto turn key
- arquiteto brooklin / itaim / jardins

SITE: wgalmeida.com.br
`;

// ─── Configuração das plataformas ─────────────────────────────────────────────
const PLATFORM_CONFIG = {
  instagram: {
    name: 'Instagram',
    abbr: 'IG',
    bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    tc: 'text-white',
    url: 'https://business.facebook.com/',
    maxChars: 2200,
    tip: 'Até 2200 chars · 25–30 hashtags · emojis liberados',
  },
  pinterest: {
    name: 'Pinterest',
    abbr: 'P',
    bg: 'bg-red-600',
    tc: 'text-white',
    url: 'https://www.pinterest.com/pin-creation-tool/',
    maxChars: 500,
    tip: 'Palavras-chave visuais · título + desc até 500 chars',
  },
  google: {
    name: 'Google Meu Negócio',
    abbr: 'G',
    bg: 'bg-white border-2 border-gray-200',
    tc: 'text-blue-500',
    url: 'https://business.google.com/',
    maxChars: 1500,
    tip: 'Sem hashtags · inclua wgalmeida.com.br · profissional',
  },
  linkedin: {
    name: 'LinkedIn',
    abbr: 'in',
    bg: 'bg-[#0077B5]',
    tc: 'text-white',
    url: 'https://www.linkedin.com/feed/?shareActive=true',
    maxChars: 3000,
    tip: 'Tom B2B · liderança · 1–3 hashtags',
  },
  houzz: {
    name: 'Houzz',
    abbr: 'Hz',
    bg: 'bg-[#4DBC15]',
    tc: 'text-white',
    url: 'https://pro.houzz.com/',
    maxChars: 1000,
    tip: 'Vocabulário técnico de arquitetura e design',
  },
  homify: {
    name: 'Homify',
    abbr: 'Hf',
    bg: 'bg-[#00BBCC]',
    tc: 'text-white',
    url: 'https://www.homify.com.br/',
    maxChars: 800,
    tip: 'Estilo portfólio · destaque materiais premium',
  },
};

// ─── Campos de configuração por plataforma ───────────────────────────────────
const PLATFORM_FIELDS = {
  instagram: [
    { key: 'handle',            label: 'Handle / @usuário',          placeholder: '@wgalmeida',                                     type: 'text'     },
    { key: 'profileUrl',        label: 'URL do Perfil',               placeholder: 'https://www.instagram.com/wgalmeida',             type: 'url'      },
    { key: 'businessAccountId', label: 'Business Account ID',         placeholder: 'Ex: 17841400459223767',                          type: 'text'     },
    { key: 'accessToken',       label: 'Access Token (Meta Graph API)',placeholder: 'EAAxxxxx... (Meta for Developers)',               type: 'password' },
  ],
  pinterest: [
    { key: 'handle',      label: 'Handle / @usuário',   placeholder: '@wgalmeida',                                         type: 'text'     },
    { key: 'profileUrl',  label: 'URL do Perfil',        placeholder: 'https://br.pinterest.com/wgalmeida',                 type: 'url'      },
    { key: 'adAccountId', label: 'Ad Account ID',        placeholder: 'Ex: 549769837820',                                   type: 'text'     },
    { key: 'accessToken', label: 'Access Token',         placeholder: 'Token de acesso Pinterest API',                      type: 'password' },
  ],
  google: [
    { key: 'locationId',  label: 'Location ID (GMB)',    placeholder: 'locations/1234567890',                               type: 'text'     },
    { key: 'placeId',     label: 'Place ID (Reviews)',   placeholder: 'ChIJxxxxxxxxxxxxxxxxxx',                             type: 'text'     },
    { key: 'profileUrl',  label: 'URL Google Meu Negócio',placeholder: 'https://business.google.com/u/0/...',              type: 'url'      },
    { key: 'apiKey',      label: 'Places API Key',       placeholder: 'AIzaxxxxxxxxxxxxxxxx',                               type: 'password' },
  ],
  linkedin: [
    { key: 'handle',      label: 'Handle da Empresa',    placeholder: 'wg-almeida',                                         type: 'text'     },
    { key: 'profileUrl',  label: 'URL da Página',         placeholder: 'https://www.linkedin.com/company/wg-almeida',       type: 'url'      },
    { key: 'pageId',      label: 'Company Page ID',       placeholder: 'Ex: 98765432',                                      type: 'text'     },
    { key: 'accessToken', label: 'Access Token (OAuth 2.0)',placeholder: 'Token de acesso LinkedIn API',                    type: 'password' },
  ],
  houzz: [
    { key: 'handle',     label: 'Nome no Houzz',         placeholder: 'wg-almeida',                                         type: 'text'     },
    { key: 'profileUrl', label: 'URL do Perfil Pro',      placeholder: 'https://www.houzz.com/pro/wgalmeida',               type: 'url'      },
    { key: 'profileId',  label: 'Profile ID (Houzz Pro)', placeholder: 'ID do perfil profissional',                         type: 'text'     },
  ],
  homify: [
    { key: 'handle',     label: 'Nome no Homify',         placeholder: 'wg-almeida',                                        type: 'text'     },
    { key: 'profileUrl', label: 'URL do Perfil',           placeholder: 'https://www.homify.com.br/professionals/...',      type: 'url'      },
  ],
};

// ─── Parser da resposta social do Claude ─────────────────────────────────────
function parseSocialContent(raw) {
  const result = {
    instagram: '', pinterest_title: '', pinterest_desc: '',
    google: '', linkedin: '', houzz: '', homify: '',
  };
  const markerMap = {
    '### INSTAGRAM': 'instagram',
    '### PINTEREST_TITLE': 'pinterest_title',
    '### PINTEREST_DESC': 'pinterest_desc',
    '### GOOGLE_MEU_NEGOCIO': 'google',
    '### LINKEDIN': 'linkedin',
    '### HOUZZ': 'houzz',
    '### HOMIFY': 'homify',
  };
  const buffers = {
    instagram: [], pinterest_title: [], pinterest_desc: [],
    google: [], linkedin: [], houzz: [], homify: [],
  };
  let currentKey = null;
  for (const line of raw.split('\n')) {
    const key = markerMap[line.trim()];
    if (key !== undefined) {
      currentKey = key;
    } else if (currentKey) {
      buffers[currentKey].push(line);
    }
  }
  for (const [key, buf] of Object.entries(buffers)) {
    result[key] = buf.join('\n').trim();
  }
  return result;
}

// ─── Sub-componente: StarRating ───────────────────────────────────────────────
const StarRating = ({ rating, size = 'sm' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${
          i <= Math.round(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200'
        }`}
      />
    ))}
  </div>
);

// ─── Sub-componente: PlatformCard ─────────────────────────────────────────────
const PlatformCard = ({ platformId, content, onContentChange, copiedId, onCopy, settings }) => {
  const p = PLATFORM_CONFIG[platformId];
  const over = content.length > p.maxChars;
  const publishUrl = settings?.profileUrl || p.url;
  const handle = settings?.handle;
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-100">
        <div className={`w-9 h-9 ${p.bg} rounded-lg flex items-center justify-center text-sm font-bold ${p.tc}`}>
          {p.abbr}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{p.name}</span>
            {handle && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {handle}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{p.tip}</p>
        </div>
        <a
          href={publishUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-wg-orange transition-colors whitespace-nowrap"
        >
          Publicar <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="p-3">
        <textarea
          rows={5}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wg-orange/30 resize-y"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className={`text-xs ${over ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {content.length.toLocaleString('pt-BR')}/{p.maxChars.toLocaleString('pt-BR')}
            {over ? ' — excede o limite' : ''}
          </span>
          <button
            onClick={() => onCopy(content, platformId)}
            className="text-xs flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            {copiedId === platformId
              ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copiado!</>
              : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Defaults das plataformas (dados públicos já configurados) ────────────────
const DEFAULT_PLATFORM_SETTINGS = {
  instagram: {
    handle: '@grupowgalmeida',
    profileUrl: 'https://www.instagram.com/grupowgalmeida',
    businessAccountId: '',
    accessToken: '',
  },
  pinterest: {
    handle: '@wgalmeida',
    profileUrl: 'https://br.pinterest.com/wgalmeida',
    adAccountId: '549769837820',
    accessToken: '',
  },
  google: {
    locationId: '',
    placeId: 'ChIJA6dposNQzpQRNOLWlYgmF7c',
    profileUrl: 'https://business.google.com/',
    apiKey: 'AIzaSyA8xFxv3eKrnek30EVLg2ZSwrCcl8CL0hc',
  },
  linkedin: {
    handle: 'wgalmeida',
    profileUrl: 'https://www.linkedin.com/company/wgalmeida',
    pageId: '',
    accessToken: '',
  },
  houzz: {
    handle: 'wgalmeida',
    profileUrl: 'https://www.houzz.com/user/wgalmeida',
    profileId: '',
  },
  homify: {
    handle: 'grupo-wg-almeida',
    profileUrl: 'https://www.homify.com.br/profissionais/232168/grupo-wg-almeida-arquitetura-engenharia-e-marcenaria-de-alto-padrao',
  },
};

// ─── Componente principal ─────────────────────────────────────────────────────
const Admin = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copiedId, setCopiedId] = useState(null);

  // Dashboard / Reviews
  const [reviews, setReviews] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewResponses, setReviewResponses] = useState({});
  const [responseLoading, setResponseLoading] = useState(null);

  // Publicador Social
  const socialTopicRef = useRef(null);
  const socialNotesRef = useRef(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialContent, setSocialContent] = useState({
    instagram: '', pinterest_title: '', pinterest_desc: '',
    google: '', linkedin: '', houzz: '', homify: '',
  });

  // SEO
  const seoUrlRef = useRef(null);
  const [seoAnalysis, setSeoAnalysis] = useState('');
  const [seoLoading, setSeoLoading] = useState(false);

  // Gerador de Conteúdo
  const [contentType, setContentType] = useState('pagina');
  const contentTopicRef = useRef(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);

  // Consultor
  const questionRef = useRef(null);
  const [consultantResponse, setConsultantResponse] = useState('');
  const [consultantLoading, setConsultantLoading] = useState(false);

  // Leads
  const [leadsData, setLeadsData] = useState(null);
  const [adsData, setAdsData] = useState({ meta: null, google: null, pinterest: null });
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsFilter, setLeadsFilter] = useState('todos');
  const leadsSearchRef = useRef('');

  // Configurações de plataformas — defaults pré-preenchidos + override do localStorage
  const [platformSettings, setPlatformSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wg_admin_platforms') || '{}');
      const merged = {};
      for (const [id, defaults] of Object.entries(DEFAULT_PLATFORM_SETTINGS)) {
        merged[id] = { ...defaults, ...(saved[id] || {}) };
      }
      return merged;
    } catch {
      return DEFAULT_PLATFORM_SETTINGS;
    }
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [visibleTokens, setVisibleTokens] = useState({});

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const handleCopy = useCallback((text, id = 'default') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
  }, []);

  // ─── Avaliações Google ─────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch('/api/google-reviews');
      if (!res.ok) throw new Error('Falha ao buscar avaliações');
      setReviews(await res.json());
    } catch (err) {
      console.error('Reviews fetch error:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' && reviews === null) {
      fetchReviews();
    }
  }, [activeTab, reviews, fetchReviews]);

  const generateReviewResponse = async (review, index) => {
    setResponseLoading(index);
    try {
      const firstName = review.name?.split(' ')[0] || 'Cliente';
      const prompt = `${WG_CONTEXT}
Você é o responsável pelo relacionamento com clientes da WG Almeida.
Gere uma resposta profissional e calorosa para esta avaliação do Google:

AVALIAÇÃO de "${review.name}" (${review.rating}/5 estrelas):
"${review.text}"

REGRAS:
- Máx 150 palavras
- Comece com: "Olá, ${firstName}!"
- Agradeça sinceramente e mencione algo específico do feedback quando possível
- Convide para novos projetos ou indicações
- Tom: profissional, acolhedor, premium
- Assine: Equipe WG Almeida`;
      const resp = await sendClaudePrompt(prompt, 0.7);
      setReviewResponses((prev) => ({ ...prev, [index]: resp }));
    } catch (err) {
      setReviewResponses((prev) => ({ ...prev, [index]: `Erro: ${err.message}` }));
    } finally {
      setResponseLoading(null);
    }
  };

  // ─── Publicador Social ─────────────────────────────────────────────────────
  const generateSocial = async () => {
    const socialTopic = socialTopicRef.current?.value?.trim() || '';
    const socialNotes = socialNotesRef.current?.value?.trim() || '';
    if (!socialTopic) return;
    setSocialLoading(true);
    setSocialContent({ instagram: '', pinterest_title: '', pinterest_desc: '', google: '', linkedin: '', houzz: '', homify: '' });
    try {
      const prompt = `${WG_CONTEXT}
Você é o gerente de marketing digital da WG Almeida.
Crie conteúdo para as 6 plataformas abaixo com base no tema fornecido.

TEMA: ${socialTopic}${socialNotes ? `\nDETALHES: ${socialNotes}` : ''}

Responda EXATAMENTE neste formato (cada seção começa com ### e vai até a próxima):

### INSTAGRAM
[Legenda completa com emojis, hashtags ao final. Até 2200 chars. Use 25–30 hashtags relevantes.]

### PINTEREST_TITLE
[Título do Pin. Máx 100 chars. Descritivo e com palavras-chave.]

### PINTEREST_DESC
[Descrição do Pin. Máx 500 chars. Rica em palavras-chave visuais e de busca.]

### GOOGLE_MEU_NEGOCIO
[Post para Google Meu Negócio. Máx 1500 chars. Sem hashtags. Tom profissional. Inclua: wgalmeida.com.br]

### LINKEDIN
[Post profissional. Máx 1500 chars. Tom B2B e de liderança. Máx 3 hashtags.]

### HOUZZ
[Descrição de projeto/portfólio. Máx 1000 chars. Vocabulário técnico de arquitetura e design de interiores.]

### HOMIFY
[Texto estilo portfólio. Máx 800 chars. Destaque materiais, estilo e diferenciais da WG Almeida.]`;
      const raw = await sendClaudePrompt(prompt, 0.8);
      setSocialContent(parseSocialContent(raw));
    } catch (err) {
      console.error('Social generation error:', err);
    } finally {
      setSocialLoading(false);
    }
  };

  // ─── SEO ──────────────────────────────────────────────────────────────────
  const analyzeSEO = async () => {
    const seoUrl = seoUrlRef.current?.value?.trim() || '';
    if (!seoUrl) return;
    setSeoLoading(true);
    setSeoAnalysis('');
    try {
      const prompt = `${WG_CONTEXT}
TAREFA: Analise a página/seção "${seoUrl}" do site da WG Almeida e forneça recomendações de SEO.

1. **META TAGS RECOMENDADAS**
   - Title tag otimizado (máx 60 caracteres)
   - Meta description (máx 155 caracteres)
   - Keywords principais

2. **ESTRUTURA DE CONTEÚDO**
   - Heading hierarchy (H1, H2, H3)
   - Densidade de palavras-chave ideal

3. **OPORTUNIDADES DE PALAVRAS-CHAVE**
   - Keywords de cauda longa para ranquear
   - Perguntas frequentes do público

4. **MELHORIAS TÉCNICAS**
   - Schema markup recomendado
   - Links internos sugeridos
   - CTAs otimizados

5. **SCORE ESTIMADO E PRIORIDADES**
   - O que fazer primeiro e impacto esperado

Formate de forma clara e acionável.`;
      setSeoAnalysis(await sendClaudePrompt(prompt, 0.7));
    } catch (err) {
      setSeoAnalysis(t('adminPage.seo.error', { message: err.message }));
    } finally {
      setSeoLoading(false);
    }
  };

  // ─── Gerador de Conteúdo ───────────────────────────────────────────────────
  const contentTypeLabels = {
    pagina: t('adminPage.contentTypes.page'),
    blog: t('adminPage.contentTypes.blog'),
    descricao: t('adminPage.contentTypes.description'),
    cta: t('adminPage.contentTypes.cta'),
    social: t('adminPage.contentTypes.social'),
  };

  const generateContent = async () => {
    const contentTopic = contentTopicRef.current?.value?.trim() || '';
    if (!contentTopic) return;
    setContentLoading(true);
    setGeneratedContent('');
    try {
      const deliverable = {
        pagina: '1. Título H1\n2. Subtítulo H2\n3. 3-4 parágrafos\n4. 3 bullet points de benefícios\n5. CTA final',
        blog: '1. Título SEO\n2. Introdução (2 parágrafos)\n3. 3-5 subtítulos H2 com conteúdo\n4. Conclusão com CTA\n5. Meta description',
        descricao: '1. Título do serviço\n2. Descrição curta (2 linhas)\n3. Descrição completa (3 parágrafos)\n4. 5 diferenciais\n5. CTA',
        cta: '1. 5 opções de headline\n2. 5 opções de subtítulo\n3. 5 opções de botão\n4. Sugestão de urgência ética',
        social: '1. 3 versões Instagram\n2. 2 versões LinkedIn\n3. Hashtags relevantes\n4. Sugestão de criativo',
      }[contentType] || '';

      const prompt = `${WG_CONTEXT}
TAREFA: Crie conteúdo otimizado para SEO.
TIPO: ${contentTypeLabels[contentType]}
TEMA: ${contentTopic}

DIRETRIZES:
- Tom da WG Almeida: profissional, confiante, luxo silencioso
- Inclua palavras-chave naturalmente
- Foque em benefícios, não apenas features
- Padrão premium da marca

ENTREGUE:
${deliverable}`;
      setGeneratedContent(await sendClaudePrompt(prompt, 0.8));
    } catch (err) {
      setGeneratedContent(t('adminPage.content.error', { message: err.message }));
    } finally {
      setContentLoading(false);
    }
  };

  // ─── Consultor Estratégico ─────────────────────────────────────────────────
  const askConsultant = async () => {
    const question = questionRef.current?.value?.trim() || '';
    if (!question) return;
    setConsultantLoading(true);
    setConsultantResponse('');
    try {
      const prompt = `${WG_CONTEXT}
Você é um consultor estratégico de marketing digital especializado em arquitetura e construção de alto padrão.

PERGUNTA (WG Almeida):
${question}

Responda como consultor experiente:
- Direto e prático, com exemplos específicos
- Considere o mercado de São Paulo
- Foque em ações que geram resultado
- Sugira métricas para acompanhar`;
      setConsultantResponse(await sendClaudePrompt(prompt, 0.7));
    } catch (err) {
      setConsultantResponse(t('adminPage.consultant.error', { message: err.message }));
    } finally {
      setConsultantLoading(false);
    }
  };

  // ─── Salvar configurações ──────────────────────────────────────────────────
  const savePlatformSettings = () => {
    localStorage.setItem('wg_admin_platforms', JSON.stringify(platformSettings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const updatePlatformSetting = (platformId, field, value) => {
    setPlatformSettings((prev) => ({
      ...prev,
      [platformId]: { ...prev[platformId], [field]: value },
    }));
  };

  const toggleTokenVisibility = (key) => {
    setVisibleTokens((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Leads ────────────────────────────────────────────────────────────────
  const fetchLeadsData = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const [leadsRes, metaRes, gaRes, pinterestRes] = await Promise.allSettled([
        fetch('/api/leads'),
        fetch('/api/meta-ads'),
        fetch('/api/google-analytics'),
        fetch('/api/pinterest-ads'),
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
        setLeadsData(await leadsRes.value.json());
      }

      const metaData = metaRes.status === 'fulfilled' && metaRes.value.ok
        ? await metaRes.value.json() : null;
      const gaData = gaRes.status === 'fulfilled' && gaRes.value.ok
        ? await gaRes.value.json() : null;
      const pinterestData = pinterestRes.status === 'fulfilled' && pinterestRes.value.ok
        ? await pinterestRes.value.json() : null;

      setAdsData({ meta: metaData, google: gaData, pinterest: pinterestData });
    } catch (err) {
      console.error('fetchLeadsData error:', err);
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  const updateLeadStatus = async (id, tipo, novoStatus) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tipo, status: novoStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      setLeadsData((prev) => {
        if (!prev?.leads) return prev;
        return {
          ...prev,
          leads: prev.leads.map((l) =>
            l.id === id && l.tipo === tipo ? { ...l, status: novoStatus } : l
          ),
        };
      });
    } catch (err) {
      console.error('updateLeadStatus error:', err);
    }
  };

  const calcCPL = (spend, count) => {
    if (!spend || !count) return null;
    return (spend / count).toFixed(2);
  };

  const getLeadChannel = (lead) => {
    if (lead.utm_source) return lead.utm_source;
    if (lead.origem && lead.origem !== 'site') return lead.origem;
    return 'orgânico';
  };

  useEffect(() => {
    if (activeTab === 'leads' && leadsData === null) {
      fetchLeadsData();
    }
  }, [activeTab, leadsData, fetchLeadsData]);

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'social', label: 'Publicador Social', icon: Share2 },
    { id: 'seo', label: t('adminPage.tabs.seo'), icon: Search },
    { id: 'content', label: t('adminPage.tabs.content'), icon: FileText },
    { id: 'consultant', label: t('adminPage.tabs.consultant'), icon: TrendingUp },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const quickQuestions = t('adminPage.quickQuestions', { returnObjects: true });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <SEO pathname="/admin" title="Admin WG Almeida" description="Painel administrativo interno" noindex />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-wg-orange rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-wg-black">{t('adminPage.title')}</h1>
                <p className="text-sm text-gray-500">{t('adminPage.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-wg-orange text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Painel de conteúdo */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >

            {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">

                {/* Header avaliações */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <Star className="w-6 h-6 text-wg-orange" />
                  <div>
                    <h2 className="text-lg font-semibold">Avaliações Google</h2>
                    <p className="text-sm text-gray-500">Avaliações em tempo real + respostas com IA</p>
                  </div>
                  <button
                    onClick={fetchReviews}
                    className="ml-auto p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Atualizar"
                  >
                    <RefreshCw className={`w-4 h-4 ${reviewsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {reviewsLoading && (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando avaliações...
                  </div>
                )}

                {/* Resumo de rating */}
                {reviews && !reviewsLoading && (
                  <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="text-4xl font-bold text-yellow-500">
                      {Number(reviews.averageRating).toFixed(1)}
                    </div>
                    <div>
                      <StarRating rating={reviews.averageRating} size="lg" />
                      <p className="text-sm text-gray-500 mt-1">{reviews.reviewCount} avaliações verificadas</p>
                    </div>
                    {reviews.sourceUrl && (
                      <a
                        href={reviews.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Ver no Google <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Lista de avaliações */}
                {reviews?.reviews?.length > 0 && !reviewsLoading && (
                  <div className="space-y-4">
                    {reviews.reviews.map((review, i) => (
                      <div key={review.id || i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-wg-orange text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {review.avatar || review.name?.[0] || 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{review.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <StarRating rating={review.rating} />
                              {review.date && <span className="text-xs text-gray-400">{review.date}</span>}
                            </div>
                          </div>
                        </div>
                        {review.text && (
                          <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
                        )}

                        {/* Resposta gerada por IA */}
                        {reviewResponses[i] && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 relative">
                            <div className="flex items-center gap-1 mb-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-xs font-medium text-blue-600">Resposta sugerida pela IA</span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed pr-8">{reviewResponses[i]}</p>
                            <button
                              onClick={() => handleCopy(reviewResponses[i], `review-${i}`)}
                              className="absolute top-2.5 right-2.5 p-1.5 hover:bg-blue-100 rounded"
                            >
                              {copiedId === `review-${i}`
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
                                : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => generateReviewResponse(review, i)}
                          disabled={responseLoading === i}
                          className="text-xs px-3 py-1.5 bg-wg-orange/10 text-wg-orange rounded-lg hover:bg-wg-orange/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {responseLoading === i
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <MessageSquare className="w-3 h-3" />}
                          {reviewResponses[i] ? 'Regenerar resposta' : 'Gerar resposta com IA'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick links — plataformas */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Acesso rápido às plataformas</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Object.entries(PLATFORM_CONFIG).map(([id, p]) => (
                      <a
                        key={id}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-wg-orange/40 hover:bg-wg-orange/5 transition-all group"
                      >
                        <div className={`w-10 h-10 ${p.bg} rounded-xl flex items-center justify-center text-sm font-bold ${p.tc}`}>
                          {p.abbr}
                        </div>
                        <span className="text-xs text-gray-500 group-hover:text-gray-700 text-center leading-tight">
                          {p.name.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Quick links — ferramentas */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Ferramentas & Links do site</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Site Principal', url: 'https://wgalmeida.com.br' },
                      { label: 'Projetos', url: 'https://wgalmeida.com.br/projetos' },
                      { label: 'Blog', url: 'https://wgalmeida.com.br/blog' },
                      { label: 'Solicite Proposta', url: 'https://wgalmeida.com.br/solicite-proposta' },
                      { label: 'Google Analytics', url: 'https://analytics.google.com' },
                      { label: 'Search Console', url: 'https://search.google.com/search-console' },
                      { label: 'Google Meu Negócio', url: 'https://business.google.com' },
                    ].map(({ label, url }) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        {label} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ LEADS ═══════════════════════════════════════════════════════ */}
            {activeTab === 'leads' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <Users className="w-6 h-6 text-wg-orange" />
                  <div>
                    <h2 className="text-lg font-semibold">Painel de Leads</h2>
                    <p className="text-sm text-gray-500">Últimos 90 dias · canal de origem · CPL por fonte</p>
                  </div>
                  <button
                    onClick={fetchLeadsData}
                    className="ml-auto p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Atualizar"
                  >
                    <RefreshCw className={`w-4 h-4 ${leadsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {leadsLoading && (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando leads...
                  </div>
                )}

                {!leadsLoading && leadsData && (() => {
                  const allLeads = leadsData.leads || [];
                  const propostas = allLeads.filter((l) => l.tipo === 'proposta');
                  const contatos = allLeads.filter((l) => l.tipo === 'contato');

                  // Agrupa por canal
                  const byChannel = {};
                  allLeads.forEach((l) => {
                    const ch = getLeadChannel(l);
                    if (!byChannel[ch]) byChannel[ch] = [];
                    byChannel[ch].push(l);
                  });

                  const metaLeads = allLeads.filter((l) =>
                    ['instagram', 'facebook', 'meta', 'paid_social'].includes(
                      (l.utm_source || l.utm_medium || '').toLowerCase()
                    )
                  );
                  const paidSearchLeads = allLeads.filter((l) =>
                    ['google', 'cpc', 'paid_search'].includes(
                      (l.utm_source || l.utm_medium || '').toLowerCase()
                    )
                  );
                  const organicLeads = allLeads.filter((l) =>
                    !l.utm_source || ['organic', 'site', 'orgânico'].includes((l.utm_source || '').toLowerCase())
                  );
                  const pinterestLeads = allLeads.filter((l) =>
                    ['pinterest'].includes((l.utm_source || '').toLowerCase())
                  );

                  const metaSpend = adsData.meta?.spend || 0;
                  const gaRows = adsData.google?.rows || [];
                  const pinterestSpend = adsData.pinterest?.spend || 0;

                  const totalCPL = calcCPL(
                    metaSpend + pinterestSpend,
                    metaLeads.length + pinterestLeads.length
                  );

                  // Filtro
                  const searchTerm = leadsSearchRef.current?.value?.toLowerCase() || '';
                  const visibleLeads = allLeads.filter((l) => {
                    if (leadsFilter === 'proposta' && l.tipo !== 'proposta') return false;
                    if (leadsFilter === 'contato' && l.tipo !== 'contato') return false;
                    if (searchTerm && !(
                      l.nome?.toLowerCase().includes(searchTerm) ||
                      l.email?.toLowerCase().includes(searchTerm) ||
                      l.utm_source?.toLowerCase().includes(searchTerm)
                    )) return false;
                    return true;
                  });

                  return (
                    <>
                      {/* KPIs — 2 colunas */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Resumo geral */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Este período (90 dias)</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-2xl font-bold text-wg-black">{allLeads.length}</p>
                              <p className="text-xs text-gray-500">leads totais</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-wg-orange">{propostas.length}</p>
                              <p className="text-xs text-gray-500">propostas</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{contatos.length}</p>
                              <p className="text-xs text-gray-500">contatos</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">
                                {totalCPL ? `R$${totalCPL}` : '—'}
                              </p>
                              <p className="text-xs text-gray-500">CPL médio (pago)</p>
                            </div>
                          </div>
                        </div>

                        {/* KPIs por canal */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Por canal</p>
                          {[
                            {
                              label: 'Meta (Instagram/FB)',
                              leads: metaLeads.length,
                              spend: metaSpend,
                              color: 'from-purple-500 via-pink-500 to-orange-400',
                              hasData: adsData.meta?.source !== 'no_credentials',
                            },
                            {
                              label: 'Google Ads (Paid Search)',
                              leads: paidSearchLeads.length,
                              spend: 0,
                              color: 'from-blue-500 to-blue-400',
                              hasData: false,
                              gaRows: gaRows.filter((r) =>
                                r.channel?.toLowerCase().includes('paid search')
                              ),
                            },
                            {
                              label: 'Orgânico / Direto',
                              leads: organicLeads.length,
                              spend: 0,
                              color: 'from-green-500 to-green-400',
                              hasData: true,
                              noSpend: true,
                            },
                            {
                              label: 'Pinterest Ads',
                              leads: pinterestLeads.length,
                              spend: pinterestSpend,
                              color: 'from-red-500 to-red-400',
                              hasData: adsData.pinterest?.source !== 'no_credentials',
                            },
                          ].map((ch) => (
                            <div key={ch.label} className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-lg">
                              <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${ch.color} flex-shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-700 truncate">{ch.label}</p>
                                <p className="text-xs text-gray-400">
                                  {ch.noSpend ? 'R$0 gasto' :
                                    ch.hasData ? `R$${Number(ch.spend).toFixed(2)} gasto` :
                                    'aguardando credenciais'}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-wg-black">{ch.leads}</p>
                                <p className="text-xs text-gray-400">leads</p>
                              </div>
                              {!ch.noSpend && !ch.hasData && (
                                <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">sem token</span>
                              )}
                              {ch.hasData && !ch.noSpend && ch.spend > 0 && (
                                <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
                                  CPL R${calcCPL(ch.spend, ch.leads) || '—'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Filtros + busca */}
                      <div className="flex flex-wrap items-center gap-2">
                        {['todos', 'proposta', 'contato'].map((f) => (
                          <button
                            key={f}
                            onClick={() => setLeadsFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              leadsFilter === f
                                ? 'bg-wg-orange text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {f === 'todos' ? 'Todos' : f === 'proposta' ? 'Propostas' : 'Contatos'}
                          </button>
                        ))}
                        <input
                          ref={leadsSearchRef}
                          type="text"
                          placeholder="Buscar por nome, email, canal..."
                          onChange={() => setLeadsFilter((f) => f)} // força re-render
                          className="ml-auto px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-orange/30 w-56"
                        />
                      </div>

                      {/* Tabela de leads */}
                      <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Data</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Nome</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Canal</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Tipo</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Origem</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleLeads.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                                  Nenhum lead encontrado
                                </td>
                              </tr>
                            )}
                            {visibleLeads.slice(0, 50).map((lead) => (
                              <tr key={`${lead.tipo}-${lead.id}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-2 px-3 text-xs text-gray-400 whitespace-nowrap">
                                  {lead.created_at
                                    ? new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                                    : '—'}
                                </td>
                                <td className="py-2 px-3">
                                  <p className="font-medium text-wg-black truncate max-w-[140px]">{lead.nome}</p>
                                  <p className="text-xs text-gray-400 truncate max-w-[140px]">{lead.email}</p>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    {getLeadChannel(lead)}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    lead.tipo === 'proposta'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {lead.tipo === 'proposta' ? 'Proposta' : 'Contato'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-xs text-gray-500 max-w-[120px] truncate">
                                  {lead.utm_campaign || lead.origem || '—'}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="relative group inline-block">
                                    <select
                                      value={lead.status || 'nova'}
                                      onChange={(e) => updateLeadStatus(lead.id, lead.tipo, e.target.value)}
                                      className={`text-xs pl-2 pr-6 py-1 rounded-full border appearance-none cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-wg-orange/30 ${
                                        {
                                          nova: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                          contato: 'bg-blue-50 text-blue-700 border-blue-200',
                                          visita: 'bg-purple-50 text-purple-700 border-purple-200',
                                          proposta: 'bg-orange-50 text-orange-700 border-orange-200',
                                          fechado: 'bg-green-50 text-green-700 border-green-200',
                                          perdido: 'bg-red-50 text-red-700 border-red-200',
                                        }[lead.status] || 'bg-gray-50 text-gray-700 border-gray-200'
                                      }`}
                                    >
                                      {['nova', 'contato', 'visita', 'proposta', 'fechado', 'perdido'].map((s) => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                      ))}
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-current opacity-60" />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {visibleLeads.length > 50 && (
                          <p className="text-xs text-gray-400 text-center py-2">
                            Mostrando 50 de {visibleLeads.length} leads
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ══ PUBLICADOR SOCIAL ═══════════════════════════════════════════ */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <Share2 className="w-6 h-6 text-wg-orange" />
                  <div>
                    <h2 className="text-lg font-semibold">Publicador Social</h2>
                    <p className="text-sm text-gray-500">
                      Gere conteúdo otimizado para 6 plataformas de uma vez
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tema / Assunto *</label>
                    <input
                      ref={socialTopicRef}
                      type="text"
                      defaultValue=""
                      placeholder="Ex: Apartamento 180m² concluído no Itaim Bibi"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detalhes (opcional)</label>
                    <input
                      ref={socialNotesRef}
                      type="text"
                      defaultValue=""
                      placeholder="Ex: Estilo contemporâneo, mármore branco, 3 suítes"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                    />
                  </div>
                </div>

                <button
                  onClick={generateSocial}
                  disabled={socialLoading}
                  className="w-full py-3 bg-wg-orange text-white rounded-xl hover:bg-wg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {socialLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando para todas as plataformas...</>
                    : <><Zap className="w-4 h-4" /> Gerar para todas as plataformas</>}
                </button>

                {/* Conteúdo gerado por plataforma */}
                {!socialLoading && (socialContent.instagram || socialContent.google) && (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm font-medium text-gray-600">
                      Conteúdo gerado — edite e copie para cada plataforma:
                    </p>

                    {/* Instagram */}
                    <PlatformCard
                      platformId="instagram"
                      content={socialContent.instagram}
                      onContentChange={(v) => setSocialContent((p) => ({ ...p, instagram: v }))}
                      copiedId={copiedId}
                      onCopy={handleCopy}
                      settings={platformSettings.instagram}
                    />

                    {/* Pinterest (título + descrição separados) */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-100">
                        <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">P</div>
                        <div className="flex-1">
                          <span className="font-medium text-sm">Pinterest</span>
                          <p className="text-xs text-gray-500">{PLATFORM_CONFIG.pinterest.tip}</p>
                        </div>
                        <a
                          href={PLATFORM_CONFIG.pinterest.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-wg-orange transition-colors"
                        >
                          Publicar <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="p-3 space-y-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">
                            Título ({socialContent.pinterest_title.length}/100)
                          </label>
                          <div className="relative">
                            <input
                              value={socialContent.pinterest_title}
                              onChange={(e) => setSocialContent((p) => ({ ...p, pinterest_title: e.target.value }))}
                              className="w-full pr-10 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                            />
                            <button
                              onClick={() => handleCopy(socialContent.pinterest_title, 'p_title')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                            >
                              {copiedId === 'p_title'
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
                                : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">
                            Descrição ({socialContent.pinterest_desc.length}/{PLATFORM_CONFIG.pinterest.maxChars})
                          </label>
                          <div className="relative">
                            <textarea
                              rows={4}
                              value={socialContent.pinterest_desc}
                              onChange={(e) => setSocialContent((p) => ({ ...p, pinterest_desc: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wg-orange/30 resize-y"
                            />
                            <button
                              onClick={() => handleCopy(socialContent.pinterest_desc, 'p_desc')}
                              className="absolute top-2 right-2 p-1"
                            >
                              {copiedId === 'p_desc'
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
                                : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Google, LinkedIn, Houzz, Homify */}
                    {['google', 'linkedin', 'houzz', 'homify'].map((pid) => (
                      <PlatformCard
                        key={pid}
                        platformId={pid}
                        content={socialContent[pid]}
                        onContentChange={(v) => setSocialContent((p) => ({ ...p, [pid]: v }))}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        settings={platformSettings[pid]}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ ANÁLISE SEO ══════════════════════════════════════════════════ */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <BarChart3 className="w-6 h-6 text-wg-orange" />
                  <div>
                    <h2 className="text-lg font-semibold">{t('adminPage.seo.title')}</h2>
                    <p className="text-sm text-gray-500">{t('adminPage.seo.subtitle')}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    ref={seoUrlRef}
                    type="text"
                    defaultValue=""
                    onKeyDown={(e) => e.key === 'Enter' && analyzeSEO()}
                    placeholder={t('adminPage.seo.placeholder')}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                  />
                  <button
                    onClick={analyzeSEO}
                    disabled={seoLoading}
                    className="px-6 py-3 bg-wg-orange text-white rounded-xl hover:bg-wg-orange/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {seoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {t('adminPage.seo.analyze')}
                  </button>
                </div>
                {seoAnalysis && (
                  <div className="relative">
                    <button
                      onClick={() => handleCopy(seoAnalysis, 'seo')}
                      className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg"
                    >
                      {copiedId === 'seo'
                        ? <Check className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                    <div className="bg-gray-50 rounded-xl p-6 prose prose-sm max-w-none whitespace-pre-wrap">
                      {seoAnalysis}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ GERADOR DE CONTEÚDO ══════════════════════════════════════════ */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <FileText className="w-6 h-6 text-wg-orange" />
                  <div>
                    <h2 className="text-lg font-semibold">{t('adminPage.content.title')}</h2>
                    <p className="text-sm text-gray-500">{t('adminPage.content.subtitle')}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('adminPage.content.typeLabel')}</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                    >
                      <option value="pagina">{t('adminPage.contentTypes.page')}</option>
                      <option value="blog">{t('adminPage.contentTypes.blog')}</option>
                      <option value="descricao">{t('adminPage.contentTypes.description')}</option>
                      <option value="cta">{t('adminPage.contentTypes.cta')}</option>
                      <option value="social">{t('adminPage.contentTypes.social')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('adminPage.content.topicLabel')}</label>
                    <input
                      ref={contentTopicRef}
                      type="text"
                      defaultValue=""
                      placeholder={t('adminPage.content.topicPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                    />
                  </div>
                </div>
                <button
                  onClick={generateContent}
                  disabled={contentLoading}
                  className="w-full py-3 bg-wg-orange text-white rounded-xl hover:bg-wg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {contentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {t('adminPage.content.generate')}
                </button>
                {generatedContent && (
                  <div className="relative">
                    <button
                      onClick={() => handleCopy(generatedContent, 'content')}
                      className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg"
                    >
                      {copiedId === 'content'
                        ? <Check className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                    <div className="bg-gray-50 rounded-xl p-6 prose prose-sm max-w-none whitespace-pre-wrap">
                      {generatedContent}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ CONSULTOR ESTRATÉGICO ════════════════════════════════════════ */}
            {activeTab === 'consultant' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <Target className="w-6 h-6 text-wg-orange" />
                  <div>
                    <h2 className="text-lg font-semibold">{t('adminPage.consultant.title')}</h2>
                    <p className="text-sm text-gray-500">{t('adminPage.consultant.subtitle')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Array.isArray(quickQuestions) ? quickQuestions : []).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { if (questionRef.current) questionRef.current.value = q; }}
                      className="text-xs text-left px-3 py-2 bg-gray-100 hover:bg-wg-orange/10 rounded-lg transition-colors text-gray-600 hover:text-wg-orange"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={questionRef}
                  defaultValue=""
                  placeholder={t('adminPage.consultant.placeholder')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30 resize-none"
                />
                <button
                  onClick={askConsultant}
                  disabled={consultantLoading}
                  className="w-full py-3 bg-wg-orange text-white rounded-xl hover:bg-wg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {consultantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('adminPage.consultant.submit')}
                </button>
                {consultantResponse && (
                  <div className="relative">
                    <button
                      onClick={() => handleCopy(consultantResponse, 'consultant')}
                      className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg"
                    >
                      {copiedId === 'consultant'
                        ? <Check className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                    <div className="bg-gray-50 rounded-xl p-6 prose prose-sm max-w-none whitespace-pre-wrap">
                      {consultantResponse}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ CONFIGURAÇÕES ═══════════════════════════════════════════════ */}
            {activeTab === 'configuracoes' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <Settings className="w-6 h-6 text-wg-orange" />
                  <div>
                    <h2 className="text-lg font-semibold">Configurações de Plataformas</h2>
                    <p className="text-sm text-gray-500">
                      Vincule suas contas para que os botões "Publicar" abram o perfil correto.
                      Os dados são salvos localmente neste navegador.
                    </p>
                  </div>
                </div>

                {/* Cards por plataforma */}
                <div className="space-y-5">
                  {Object.entries(PLATFORM_FIELDS).map(([platformId, fields]) => {
                    const p = PLATFORM_CONFIG[platformId];
                    const saved = platformSettings[platformId] || {};
                    const hasAnyValue = fields.some((f) => saved[f.key]);
                    return (
                      <div key={platformId} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Cabeçalho da plataforma */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                          <div className={`w-9 h-9 ${p.bg} rounded-lg flex items-center justify-center text-sm font-bold ${p.tc}`}>
                            {p.abbr}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium">{p.name}</span>
                            {hasAnyValue && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Configurado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Campos */}
                        <div className="p-4 grid sm:grid-cols-2 gap-3">
                          {fields.map((field) => {
                            const tokenKey = `${platformId}_${field.key}`;
                            const isPassword = field.type === 'password';
                            const isVisible = visibleTokens[tokenKey];
                            return (
                              <div key={field.key}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {field.label}
                                  {isPassword && (
                                    <span className="ml-1 text-gray-400 font-normal">(criptografado localmente)</span>
                                  )}
                                </label>
                                <div className="relative">
                                  <input
                                    type={isPassword && !isVisible ? 'password' : 'text'}
                                    defaultValue={saved[field.key] || ''}
                                    onBlur={(e) => updatePlatformSetting(platformId, field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wg-orange/30 ${isPassword ? 'pr-9' : ''}`}
                                  />
                                  {isPassword && (
                                    <button
                                      type="button"
                                      onClick={() => toggleTokenVisibility(tokenKey)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      {isVisible
                                        ? <EyeOff className="w-3.5 h-3.5" />
                                        : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Aviso de segurança */}
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  <span>⚠️</span>
                  <span>
                    Os dados são salvos apenas no <strong>localStorage deste navegador</strong> e nunca enviados para
                    servidores externos. Access Tokens com permissão de escrita devem ser tratados como senhas.
                    Para publicação automatizada, configure as chaves como variáveis de ambiente no Vercel.
                  </span>
                </div>

                {/* Botão salvar */}
                <button
                  onClick={savePlatformSettings}
                  className="w-full py-3 bg-wg-orange text-white rounded-xl hover:bg-wg-orange/90 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  {settingsSaved
                    ? <><Check className="w-4 h-4" /> Configurações salvas!</>
                    : <><Save className="w-4 h-4" /> Salvar configurações</>}
                </button>
              </div>
            )}

          </motion.div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <Globe className="w-4 h-4 inline mr-1" />
            {t('adminPage.footer')}
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;

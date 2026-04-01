// ============================================================
// SMART TAGS: Cronograma
// Padroniza identificaçÍo de tarefas por hashtag, núcleo, categoria e origem.
// ============================================================

export type SmartTagKey =
  | "arquitetura"
  | "engenharia"
  | "marcenaria"
  | "produto"
  | "material"
  | "servico"
  | "compra"
  | "fornecedor"
  | "contratacao"
  | "checklist"
  | "nota"
  | "contrato"
  | "financeiro";

export type FaseExecucaoKey =
  | "planejamento"
  | "demolicao"
  | "infraestrutura"
  | "instalacoes"
  | "acabamentos"
  | "montagem"
  | "compras"
  | "entrega"
  | "outros";

export interface SmartTagMeta {
  key: SmartTagKey;
  label: string;
  hashtag: `#${string}`;
  color: string;
  code: string;
}

export interface SmartTagResult {
  primary: SmartTagMeta;
  tags: SmartTagMeta[];
  codigoPadrao: string;
}

const FASE_ORDEM: Array<{ key: string; peso: number; termos: string[] }> = [
  { key: "planejamento", peso: 100, termos: ["planejamento", "briefing", "levantamento", "projeto"] },
  { key: "demolicao", peso: 200, termos: ["demolicao", "demolir", "retirada", "remocao"] },
  { key: "infraestrutura", peso: 300, termos: ["alvenaria", "estrutura", "hidraul", "eletric", "infra"] },
  { key: "instalacoes", peso: 400, termos: ["instalacao", "tubulacao", "fios", "cabeamento"] },
  { key: "acabamentos", peso: 500, termos: ["revestimento", "pintura", "forro", "gesso", "acabamento"] },
  { key: "montagem", peso: 600, termos: ["marcenaria", "mobiliario", "montagem", "moveis"] },
  { key: "compras", peso: 700, termos: ["compra", "pedido", "fornecedor", "material", "produto"] },
  { key: "entrega", peso: 800, termos: ["vistoria", "entrega", "finalizacao", "finalizacao"] },
];

const FASE_LABEL: Record<FaseExecucaoKey, string> = {
  planejamento: "Planejamento",
  demolicao: "DemoliçÍo",
  infraestrutura: "Infraestrutura",
  instalacoes: "Instalações",
  acabamentos: "Acabamentos",
  montagem: "Montagem",
  compras: "Compras",
  entrega: "Entrega",
  outros: "Outros",
};

const TAG_META: Record<SmartTagKey, SmartTagMeta> = {
  arquitetura: { key: "arquitetura", label: "Arquitetura", hashtag: "#arquitetura", color: "#5E9B94", code: "ARQ" },
  engenharia: { key: "engenharia", label: "Engenharia", hashtag: "#engenharia", color: "#2B4580", code: "ENG" },
  marcenaria: { key: "marcenaria", label: "Marcenaria", hashtag: "#marcenaria", color: "#8B5E3C", code: "MRC" },
  produto: { key: "produto", label: "Produto", hashtag: "#produto", color: "#7C3AED", code: "PRD" },
  material: { key: "material", label: "Material", hashtag: "#material", color: "#0EA5E9", code: "MAT" },
  servico: { key: "servico", label: "Serviço", hashtag: "#servico", color: "#F25C26", code: "SRV" },
  compra: { key: "compra", label: "Compra", hashtag: "#compra", color: "#F59E0B", code: "CMP" },
  fornecedor: { key: "fornecedor", label: "Fornecedor", hashtag: "#fornecedor", color: "#A855F7", code: "FOR" },
  contratacao: { key: "contratacao", label: "ContrataçÍo", hashtag: "#contratacao", color: "#DC2626", code: "CTR" },
  checklist: { key: "checklist", label: "Checklist", hashtag: "#checklist", color: "#16A34A", code: "CHK" },
  nota: { key: "nota", label: "Nota", hashtag: "#nota", color: "#2563EB", code: "NOT" },
  contrato: { key: "contrato", label: "Contrato", hashtag: "#contrato", color: "#4B5563", code: "CON" },
  financeiro: { key: "financeiro", label: "Financeiro", hashtag: "#financeiro", color: "#059669", code: "FIN" },
};

const HASHTAG_TO_KEY: Record<string, SmartTagKey> = Object.fromEntries(
  Object.values(TAG_META).map((t) => [t.hashtag, t.key])
);

function sanitize(input?: string | null): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function extrairHashtags(texto?: string | null): string[] {
  const matches = (texto || "").toLowerCase().match(/#[a-z0-9_]+/g);
  return matches || [];
}

function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function inferByConteudo(conteudo: string): SmartTagKey[] {
  const tags: SmartTagKey[] = [];
  if (conteudo.includes("arquitet")) tags.push("arquitetura");
  if (conteudo.includes("engenhari") || conteudo.includes("eletric") || conteudo.includes("hidraul")) tags.push("engenharia");
  if (conteudo.includes("marcen")) tags.push("marcenaria");
  if (conteudo.includes("produto")) tags.push("produto");
  if (conteudo.includes("material")) tags.push("material");
  if (conteudo.includes("servic") || conteudo.includes("execu")) tags.push("servico");
  if (conteudo.includes("compr") || conteudo.includes("pedido")) tags.push("compra");
  if (conteudo.includes("fornecedor")) tags.push("fornecedor");
  if (conteudo.includes("contrat")) tags.push("contratacao");
  if (conteudo.includes("[checklist-item:")) tags.push("checklist");
  if (conteudo.includes("[nota-item:")) tags.push("nota");
  if (conteudo.includes("[contrato-item:")) tags.push("contrato");
  if (conteudo.includes("financeir")) tags.push("financeiro");
  return tags;
}

export function resolverSmartTags(params: {
  titulo?: string | null;
  descricao?: string | null;
  nucleo?: string | null;
  categoria?: string | null;
  ordem?: number | null;
}): SmartTagResult {
  const titulo = sanitize(params.titulo);
  const descricao = sanitize(params.descricao);
  const nucleo = sanitize(params.nucleo);
  const categoria = sanitize(params.categoria);
  const conteudo = [titulo, descricao, categoria].filter(Boolean).join(" ");

  const tags: SmartTagKey[] = [];

  for (const hash of [...extrairHashtags(params.titulo), ...extrairHashtags(params.descricao)]) {
    const key = HASHTAG_TO_KEY[hash];
    if (key) tags.push(key);
  }

  if (nucleo.includes("arquitet")) tags.push("arquitetura");
  if (nucleo.includes("engenhari")) tags.push("engenharia");
  if (nucleo.includes("marcen")) tags.push("marcenaria");

  tags.push(...inferByConteudo(conteudo));

  if (tags.includes("produto") || tags.includes("material")) {
    tags.push("compra", "fornecedor");
  }
  if (tags.includes("servico") && !tags.includes("fornecedor")) {
    tags.push("contratacao");
  }

  const unique = dedupe(tags);
  const primaryKey = unique[0] || (nucleo.includes("arquitet") ? "arquitetura" : nucleo.includes("marcen") ? "marcenaria" : "engenharia");
  const primary = TAG_META[primaryKey];
  const metas = dedupe([primaryKey, ...unique]).map((k) => TAG_META[k]);
  const ordem = params.ordem && params.ordem > 0 ? String(params.ordem).padStart(3, "0") : "000";
  const codigoPadrao = `${primary.code}-${ordem}`;

  return {
    primary,
    tags: metas,
    codigoPadrao,
  };
}

export function calcularOrdemExecucaoInteligente(params: {
  ordemBase?: number | null;
  nucleo?: string | null;
  categoria?: string | null;
  tipo?: string | null;
  titulo?: string | null;
  descricao?: string | null;
}): number {
  const ordemBase = params.ordemBase && params.ordemBase > 0 ? params.ordemBase : 1;
  const conteudo = sanitize(
    [params.nucleo, params.categoria, params.tipo, params.titulo, params.descricao]
      .filter(Boolean)
      .join(" ")
  );

  let fasePeso = 900;
  for (const fase of FASE_ORDEM) {
    if (fase.termos.some((t) => conteudo.includes(t))) {
      fasePeso = fase.peso;
      break;
    }
  }

  // Preserva a ordem original dentro da fase detectada
  return fasePeso * 1000 + ordemBase;
}

export function detectarFaseExecucaoInteligente(params: {
  nucleo?: string | null;
  categoria?: string | null;
  tipo?: string | null;
  titulo?: string | null;
  descricao?: string | null;
}): { key: FaseExecucaoKey; label: string; peso: number } {
  const conteudo = sanitize(
    [params.nucleo, params.categoria, params.tipo, params.titulo, params.descricao]
      .filter(Boolean)
      .join(" ")
  );

  for (const fase of FASE_ORDEM) {
    if (fase.termos.some((t) => conteudo.includes(t))) {
      const key = fase.key as FaseExecucaoKey;
      return { key, label: FASE_LABEL[key], peso: fase.peso };
    }
  }

  return { key: "outros", label: FASE_LABEL.outros, peso: 900 };
}

export function gerarHashtagsFluxo(params: {
  nucleo?: string | null;
  categoria?: string | null;
  tipo?: string | null;
  origem?: "contrato" | "checklist" | "nota";
}): string[] {
  const tags = resolverSmartTags({
    titulo: params.tipo || "",
    descricao: `${params.origem ? `#${params.origem} ` : ""}${params.categoria || ""}`,
    nucleo: params.nucleo,
    categoria: params.categoria,
  }).tags.map((t) => t.hashtag);

  if (params.origem === "contrato") tags.push("#contrato");
  if (params.origem === "checklist") tags.push("#checklist");
  if (params.origem === "nota") tags.push("#nota");

  return dedupe(tags);
}

export function adicionarHashtagsSeAusente(textoBase: string, hashtags: string[]): string {
  const existentes = new Set(extrairHashtags(textoBase));
  const adicionais = hashtags.filter((h) => !existentes.has(h));
  if (adicionais.length === 0) return textoBase;
  return `${textoBase} ${adicionais.join(" ")}`.trim();
}


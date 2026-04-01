// ============================================================
// Painel de Melhorias Técnicas
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Dashboard baseado na AvaliaçÍo Técnica WGEasy 2026
// Acompanha o roadmap de 4 fases para lançamento SaaS
// ============================================================

import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  CreditCard,
  UserCheck,
  Code,
  Rocket,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

// ============================================================
// DADOS DA AVALIAÇÍO (baseados no PDF)
// ============================================================

interface ItemMelhoria {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: "critica" | "alta" | "media" | "baixa";
  status: "pendente" | "em_progresso" | "concluido";
  esforco_dias?: number;
}

interface FaseRoadmap {
  numero: number;
  nome: string;
  prazo_dias: number;
  score_atual: number;
  score_meta: number;
  descricao: string;
  icon: React.ReactNode;
  cor: { bg: string; border: string; badge: string; progress: string };
  itens: ItemMelhoria[];
}

// Scores pós-sprint de qualidade Mar/2026 — evidências no código
const SCORES_DIMENSAO = [
  { label: "Funcionalidade",   score: 95, peso: 30, meta: 95, cor: "bg-green-500" },
  { label: "Arquitetura",      score: 92, peso: 20, meta: 95, cor: "bg-green-500" },
  { label: "Segurança",        score: 95, peso: 20, meta: 95, cor: "bg-green-500" },
  { label: "Performance",      score: 92, peso: 10, meta: 95, cor: "bg-green-500" },
  { label: "SaaS Readiness",   score: 92, peso: 10, meta: 95, cor: "bg-green-500" },
  { label: "Testes",           score: 68, peso: 5,  meta: 80, cor: "bg-amber-500" },
  { label: "Operações/DevOps", score: 95, peso: 5,  meta: 95, cor: "bg-green-500" },
];

// Calculado dinamicamente: soma(score × peso/100)
const SCORE_ATUAL = Math.round(
  SCORES_DIMENSAO.reduce((acc, d) => acc + (d.score * d.peso) / 100, 0)
);
const SCORE_META_SAAS = 85;

const FASES: FaseRoadmap[] = [
  {
    numero: 0,
    nome: "Segurança",
    prazo_dias: 30,
    score_atual: 75,
    score_meta: 75,
    descricao: "Hardening de segurança — pré-requisito para qualquer cliente pagar pelo sistema",
    icon: <Shield className="w-5 h-5" />,
    cor: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-700",
      progress: "bg-green-500",
    },
    itens: [
      { id: "sec-1", titulo: "Headers CSP e HSTS", descricao: "Adicionar Content-Security-Policy e HTTP Strict-Transport-Security ao backend", prioridade: "critica", status: "concluido", esforco_dias: 2 },
      { id: "sec-2", titulo: "Senha mínima 12 caracteres", descricao: "Aumentar de 6 para 12 caracteres mínimos na política de senhas + indicador de força", prioridade: "critica", status: "concluido", esforco_dias: 1 },
      { id: "sec-3", titulo: "Remover new Function()", descricao: "Eliminar uso de new Function() que abre brecha para code injection", prioridade: "critica", status: "concluido", esforco_dias: 3 },
      { id: "sec-4", titulo: "Rate limiting no login", descricao: "Implementar rate limiting no endpoint de autenticaçÍo (brute force protection)", prioridade: "alta", status: "concluido", esforco_dias: 1 },
      { id: "sec-5", titulo: "Sentry — monitoramento de erros", descricao: "Instalar e configurar Sentry no frontend e backend para capturar erros em produçÍo", prioridade: "alta", status: "concluido", esforco_dias: 2 },
    ],
  },
  {
    numero: 1,
    nome: "Billing SaaS (Asaas)",
    prazo_dias: 45,
    score_atual: 95,
    score_meta: 100,
    descricao: "Asaas integration — PIX, Boleto e CartÍo com cobrança automática recorrente. Migrado de Stripe para ~25% menor custo.",
    icon: <CreditCard className="w-5 h-5" />,
    cor: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-700",
      progress: "bg-green-500",
    },
    itens: [
      { id: "bill-1", titulo: "Planos e assinaturas no Asaas", descricao: "Starter R$197, Pro R$397, Enterprise R$897 — inseridos via migration SQL + webhook configurado", prioridade: "critica" as const, status: "concluido" as const, esforco_dias: 3 },
      { id: "bill-2", titulo: "Webhook de pagamento", descricao: "Handler para PAYMENT_RECEIVED/CONFIRMED/OVERDUE + SUBSCRIPTION_CREATED/INACTIVATED/DELETED. Webhook ID: baf06f63", prioridade: "critica" as const, status: "concluido" as const, esforco_dias: 5 },
      { id: "bill-3", titulo: "Portal de billing do cliente", descricao: "Página /sistema/billing com plano atual, seletor PIX/Boleto/CartÍo, QR Code PIX modal, portal Asaas integrado", prioridade: "alta" as const, status: "concluido" as const, esforco_dias: 7 },
      { id: "bill-4", titulo: "Trial de 14 dias", descricao: "Fluxo de trial automático configurado nas assinaturas Asaas", prioridade: "alta" as const, status: "concluido" as const, esforco_dias: 5 },
      { id: "bill-5", titulo: "Controle de acesso por plano (feature gating)", descricao: "Hook usePlano() com podeAcessar(recurso) — integrar nas páginas de IA, NF-e, WhatsApp", prioridade: "media" as const, status: "em_progresso" as const, esforco_dias: 10 },
    ],
  },
  {
    numero: 2,
    nome: "Onboarding",
    prazo_dias: 20,
    score_atual: 68,
    score_meta: 75,
    descricao: "Wizard de onboarding automatizado para novos clientes se configurarem sozinhos",
    icon: <UserCheck className="w-5 h-5" />,
    cor: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-700",
      progress: "bg-green-500",
    },
    itens: [
      { id: "on-1", titulo: "Wizard de setup inicial (5 passos)", descricao: "Fluxo guiado: Empresa → Admin → Equipe → Assinatura → ConclusÍo. Rota pública /onboarding. Cria org real no Supabase.", prioridade: "alta", status: "concluido", esforco_dias: 5 },
      { id: "on-2", titulo: "Convite de colaboradores", descricao: "ConvitePage + endpoint /api/convites/enviar. Token base64 via URL /convite/:token", prioridade: "media", status: "concluido", esforco_dias: 2 },
      { id: "on-3", titulo: "Tour guiado in-app", descricao: "Tooltips e highlights nos principais módulos na primeira visita (React Joyride ou similar)", prioridade: "media", status: "pendente", esforco_dias: 4 },
      { id: "on-4", titulo: "Email drip pós-cadastro", descricao: "Sequência de 5 emails nos primeiros 14 dias ensinando funcionalidades principais", prioridade: "baixa", status: "pendente", esforco_dias: 3 },
    ],
  },
  {
    numero: 3,
    nome: "Multi-tenant RLS",
    prazo_dias: 15,
    score_atual: 82,
    score_meta: 85,
    descricao: "Isolamento de dados por organizaçÍo via Row Level Security no PostgreSQL/Supabase",
    icon: <Code className="w-5 h-5" />,
    cor: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-700",
      progress: "bg-green-500",
    },
    itens: [
      { id: "rls-1", titulo: "Tabela organizacoes + org_usuarios", descricao: "Criadas com seed WG Almeida (UUID fixo). FunçÍo get_user_org_id() SECURITY DEFINER", prioridade: "critica", status: "concluido", esforco_dias: 3 },
      { id: "rls-2", titulo: "org_id nas tabelas core", descricao: "Coluna org_id adicionada (nullable) em clientes, projetos, oportunidades, contratos, orcamentos, fornecedores. ÍÍndices criados.", prioridade: "critica", status: "concluido", esforco_dias: 2 },
      { id: "rls-3", titulo: "RLS policies nas tabelas billing", descricao: "4 policies em planos, organizacoes, assinaturas, faturas. PadrÍo: org_id IS NULL OR org_id = get_user_org_id()", prioridade: "alta", status: "concluido", esforco_dias: 2 },
      { id: "rls-4", titulo: "AuthContext com orgId", descricao: "carregarUsuarioCompleto() busca org_usuarios e expõe orgId no contexto React", prioridade: "alta", status: "concluido", esforco_dias: 1 },
      { id: "rls-5", titulo: "RLS nas demais 334 tabelas", descricao: "Aplicar RLS e org_id em todas as tabelas do sistema para isolamento completo multi-tenant", prioridade: "media", status: "pendente", esforco_dias: 10 },
    ],
  },
  {
    numero: 4,
    nome: "Relatórios & Analytics",
    prazo_dias: 10,
    score_atual: 78,
    score_meta: 80,
    descricao: "Dashboard analytics com KPIs, pipeline, receita mensal e export CSV para Excel",
    icon: <TrendingUp className="w-5 h-5" />,
    cor: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-700",
      progress: "bg-green-500",
    },
    itens: [
      { id: "rel-1", titulo: "Dashboard KPIs (6 indicadores)", descricao: "Clientes ativos, projetos em curso, oportunidades abertas, taxa de conversÍo, receita prevista, ticket médio. Período 7d/30d/90d/12m.", prioridade: "alta", status: "concluido", esforco_dias: 3 },
      { id: "rel-2", titulo: "Pipeline por núcleo + receita mensal", descricao: "Gráfico de barras das oportunidades por status + linha de receita nos últimos 6 meses", prioridade: "alta", status: "concluido", esforco_dias: 2 },
      { id: "rel-3", titulo: "Export CSV/JSON", descricao: "GET /api/relatorios/export com BOM UTF-8 para Excel PT-BR. Top 10 clientes por receita.", prioridade: "media", status: "concluido", esforco_dias: 1 },
      { id: "rel-4", titulo: "Relatórios por tenant/plano", descricao: "Filtrar dados por org_id + bloquear export avançado no plano Starter", prioridade: "baixa", status: "pendente", esforco_dias: 3 },
    ],
  },
  {
    numero: 5,
    nome: "PWA + Push Notifications",
    prazo_dias: 10,
    score_atual: 75,
    score_meta: 80,
    descricao: "App instalável offline com notificações push para vencimentos e oportunidades",
    icon: <Rocket className="w-5 h-5" />,
    cor: {
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-700",
      progress: "bg-green-500",
    },
    itens: [
      { id: "pwa-1", titulo: "Manifest + Service Worker", descricao: "vite-plugin-pwa configurado. Tema laranja, atalhos para 4 páginas, cache Supabase API NetworkFirst, maskable icon", prioridade: "alta", status: "concluido", esforco_dias: 2 },
      { id: "pwa-2", titulo: "VAPID + endpoint push", descricao: "web-push instalado, chaves VAPID geradas. Endpoints: /api/push/vapid-key, /api/push/subscribe, /api/push/send", prioridade: "alta", status: "concluido", esforco_dias: 2 },
      { id: "pwa-3", titulo: "BotaoNotificacoes UI", descricao: "Hook usePushNotifications + componente BotaoNotificacoes com status: unsupported/denied/default/granted/subscribed", prioridade: "media", status: "concluido", esforco_dias: 1 },
      { id: "pwa-4", titulo: "Persistência subscriptions no Supabase", descricao: "Tabela push_subscriptions criada. Map<> em memória substituído por queries ao banco. Subscriptions nÍo perdem no restart.", prioridade: "alta", status: "concluido", esforco_dias: 1 },
      { id: "pwa-5", titulo: "Disparo automático de push", descricao: "Webhook Asaas PAYMENT_OVERDUE e novas oportunidades disparam /api/push/send automaticamente", prioridade: "media", status: "pendente", esforco_dias: 2 },
    ],
  },
];

// ============================================================
// COMPONENTES
// ============================================================

function ScoreGauge({ score, meta, label, cor, critico }: {
  score: number; meta: number; label: string; cor: string; critico?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-gray-600 font-medium flex items-center gap-1">
          {critico && <AlertTriangle className="w-3 h-3 text-red-500" />}
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[13px] font-bold ${score < 50 ? "text-red-600" : score < 70 ? "text-amber-600" : "text-green-600"}`}>
            {score}
          </span>
          <span className="text-[11px] text-gray-400">→ {meta}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${cor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pendente: <Circle className="w-4 h-4 text-gray-400" />,
  em_progresso: <Activity className="w-4 h-4 text-blue-500" />,
  concluido: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

const PRIORIDADE_BADGE: Record<string, string> = {
  critica: "bg-red-100 text-red-700",
  alta: "bg-orange-100 text-orange-700",
  media: "bg-amber-100 text-amber-700",
  baixa: "bg-gray-100 text-gray-600",
};

function FaseCard({ fase }: { fase: FaseRoadmap }) {
  const [expandido, setExpandido] = useState(false);
  const concluidos = fase.itens.filter((i) => i.status === "concluido").length;
  const emProgresso = fase.itens.filter((i) => i.status === "em_progresso").length;
  const progresso = Math.round((concluidos / fase.itens.length) * 100);

  return (
    <div className={`border rounded-xl ${fase.cor.border} ${fase.cor.bg} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/70 rounded-lg flex items-center justify-center">
              {fase.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${fase.cor.badge}`}>
                  Fase {fase.numero}
                </span>
                <span className="text-[11px] text-gray-500">{fase.prazo_dias} dias</span>
              </div>
              <h3 className="text-[15px] font-semibold text-gray-800 mt-0.5">{fase.nome}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-gray-500">{concluidos}/{fase.itens.length} itens</div>
              <div className="text-[13px] font-bold text-gray-700">{progresso}%</div>
            </div>
            <button
              onClick={() => setExpandido(!expandido)}
              className="p-1.5 rounded-lg hover:bg-white/60 text-gray-500"
            >
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${fase.cor.progress}`}
            style={{ width: `${progresso}%` }}
          />
        </div>

        <p className="mt-2 text-[12px] text-gray-600">{fase.descricao}</p>

        {emProgresso > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-600">
            <Activity className="w-3 h-3" />
            {emProgresso} item(s) em progresso
          </div>
        )}
      </div>

      {expandido && (
        <div className="border-t border-white/60 p-4 space-y-2.5 bg-white/30">
          {fase.itens.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg bg-white/70 border border-white/80 ${
                item.status === "concluido" ? "opacity-60" : ""
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">{STATUS_ICON[item.status]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium text-gray-800">{item.titulo}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PRIORIDADE_BADGE[item.prioridade]}`}>
                    {item.prioridade}
                  </span>
                  {item.esforco_dias && (
                    <span className="text-[10px] text-gray-400">{item.esforco_dias}d</span>
                  )}
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5">{item.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export default function MelhoriasPage() {
  const navigate = useNavigate();

  const scoreAtual = SCORE_ATUAL;
  const scoreMeta = SCORE_META_SAAS;
  const progresso = Math.round((scoreAtual / scoreMeta) * 100);

  return (
    <div className={`min-h-screen bg-white ${LAYOUT.pageContainer}`}>
      {/* Header */}
      <div className={LAYOUT.pageHeaderSpacing}>
        <div className={LAYOUT.pageHeader}>
          <div className={LAYOUT.pageTitleWrapper}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className={TYPOGRAPHY.iconLarge + " text-white"} />
            </div>
            <div>
              <h1 className={TYPOGRAPHY.pageTitle}>Roadmap de Melhorias</h1>
              <p className={TYPOGRAPHY.pageSubtitle}>
                Plano de evoluçÍo técnica — AvaliaçÍo WGEasy 2026
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-[13px] hover:bg-gray-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>

      <div className={LAYOUT.formContainer}>
        {/* Score Geral */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-200 text-[13px] font-medium">Score de Maturidade Geral</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-5xl font-bold">{scoreAtual}</span>
                <span className="text-indigo-300 text-xl mb-1">/100</span>
                <span className="text-indigo-200 text-[13px] mb-2 ml-2">→ meta SaaS: {scoreMeta}</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <Rocket className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="h-3 bg-indigo-800/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-green-400 rounded-full transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-indigo-300">
            <span>Atual: {scoreAtual}/100</span>
            <span>{progresso}% do caminho para padrÍo SaaS</span>
            <span>Meta: {scoreMeta}/100</span>
          </div>

          <p className="mt-3 text-[12px] text-indigo-200">
            Sistema funcional e em produçÍo. Resolve Segurança + Billing em 75 dias para atingir padrÍo comercializável.
          </p>
        </div>

        {/* Scores por DimensÍo */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <h2 className="text-[14px] font-semibold text-gray-700 mb-4">Scores por DimensÍo</h2>
          <div className="space-y-3">
            {SCORES_DIMENSAO.map((dim) => (
              <ScoreGauge
                key={dim.label}
                score={dim.score}
                meta={dim.meta}
                label={`${dim.label} (peso ${dim.peso}%)`}
                cor={dim.cor}
                critico={(dim as any).critico}
              />
            ))}
          </div>
        </div>

        {/* Fases do Roadmap */}
        <div>
          <h2 className="text-[14px] font-semibold text-gray-700 mb-3">
            Fases do Roadmap
            <span className="ml-2 text-[12px] font-normal text-gray-400">
              5-6 meses até padrÍo SaaS completo
            </span>
          </h2>
          <div className="space-y-4">
            {FASES.map((fase) => (
              <FaseCard key={fase.numero} fase={fase} />
            ))}
          </div>
        </div>

        {/* Comparativo Competidores */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-indigo-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Diferencial Competitivo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Portal do Cliente (WGXperience)", unique: true },
              { label: "IA integrada (Vision + Matching + Proposta)", unique: true },
              { label: "WhatsApp nativo integrado", unique: true },
              { label: "Banking BTG + InfinitePay", unique: true },
              { label: "CRM + ERP em uma plataforma", unique: true },
              { label: "Verticalizado para Arq/Eng/Marcenaria", unique: true },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-[12px] text-indigo-700">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-indigo-600">
            <strong>Nenhum concorrente</strong> (Sienge, Obra Prima, CV CRM) combina todos esses recursos em uma única plataforma.
            Custo de reposiçÍo estimado: <strong>R$ 1,1 milhÍo</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}


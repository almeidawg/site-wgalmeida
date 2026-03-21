import { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================================
// EventOS — DEMO INTERATIVO COMPLETO
// Telas funcionais: Dashboard | Projetos | Cronograma | Equipe | Financeiro
// Dados reais do ecossistema UMAUMA
// ============================================================================

// -- DADOS DO ECOSSISTEMA --
const AGENCIES = [
  { id: "haute", name: "Haute", color: "#C9A96E", focus: "Corporativo" },
  { id: "fishfire", name: "Fishfire", color: "#FF6B35", focus: "Festivais" },
  { id: "briefing", name: "Briefing", color: "#E8475F", focus: "Música" },
  { id: "cigarra", name: "Cigarra", color: "#7ED957", focus: "Influenciadores" },
  { id: "efeito", name: "Efeito", color: "#FF47D1", focus: "LGBTQIAP+" },
  { id: "hush", name: "Hush", color: "#DAA520", focus: "High End" },
  { id: "nowa9", name: "Nowa9", color: "#00BCD4", focus: "Trade Marketing" },
  { id: "newblood", name: "New Blood", color: "#FF1744", focus: "Jovem" },
  { id: "nozy", name: "Nozy", color: "#AA66CC", focus: "Conteúdo" },
  { id: "rancho", name: "Rancho", color: "#8B4513", focus: "Experiências" },
  { id: "stage", name: "Stage", color: "#FFD700", focus: "Universitário" },
  { id: "soundsfood", name: "Sounds Food", color: "#FF8C00", focus: "Restaurantes" },
  { id: "supersounds", name: "Super Sounds", color: "#1DB954", focus: "Shows" },
  { id: "tunnel", name: "Tunnel", color: "#6C63FF", focus: "Branding" },
];

const TEAM_MEMBERS = [
  { id: "t1", name: "Ana Beatriz", role: "Diretora de Produção", agency: "haute", avatar: "AB", status: "active", skills: ["Produção", "Gestão", "Logística"], allocated: 3 },
  { id: "t2", name: "Lucas Ferreira", role: "Produtor Sênior", agency: "fishfire", avatar: "LF", status: "active", skills: ["Festivais", "Palco", "Som"], allocated: 2 },
  { id: "t3", name: "Marina Costa", role: "Gerente de Projetos", agency: "haute", avatar: "MC", status: "active", skills: ["PMO", "Orçamento", "Cronograma"], allocated: 4 },
  { id: "t4", name: "Rafael Santos", role: "Dir. Artístico", agency: "briefing", avatar: "RS", status: "active", skills: ["Curadoria", "Lineup", "Artistas"], allocated: 2 },
  { id: "t5", name: "Juliana Lima", role: "Head Comercial", agency: "haute", avatar: "JL", status: "active", skills: ["Vendas", "Patrocínio", "Negociação"], allocated: 3 },
  { id: "t6", name: "Pedro Oliveira", role: "Produtor", agency: "efeito", avatar: "PO", status: "active", skills: ["Produção", "Cenografia", "Iluminação"], allocated: 1 },
  { id: "t7", name: "Camila Dias", role: "Social Media", agency: "cigarra", avatar: "CD", status: "active", skills: ["Conteúdo", "Influenciadores", "PR"], allocated: 2 },
  { id: "t8", name: "Bruno Almeida", role: "Designer", agency: "tunnel", avatar: "BA", status: "active", skills: ["Branding", "3D", "Motion"], allocated: 3 },
  { id: "t9", name: "Fernanda Rocha", role: "Freelancer — Bartender", agency: "soundsfood", avatar: "FR", status: "freelancer", skills: ["Bar", "Coquetelaria", "Eventos"], allocated: 1 },
  { id: "t10", name: "Thiago Mendes", role: "Freelancer — Técnico Som", agency: "supersounds", avatar: "TM", status: "freelancer", skills: ["PA", "Sonorização", "Técnico"], allocated: 2 },
  { id: "t11", name: "Isabela Nunes", role: "Coord. Trade", agency: "nowa9", avatar: "IN", status: "active", skills: ["Trade", "Ativação", "PDV"], allocated: 2 },
  { id: "t12", name: "Gabriel Souza", role: "Produtor Jr", agency: "stage", avatar: "GS", status: "active", skills: ["Universitário", "Produção", "Logística"], allocated: 1 },
];

const PROJECTS = [
  { id: "p1", name: "iFood Arena SP 2026", agency: "haute", client: "iFood", status: "production", progress: 72, revenue: 850000, cost: 510000, team: ["t1", "t3", "t5", "t8"], startDate: "2026-01-15", endDate: "2026-04-20", priority: "high" },
  { id: "p2", name: "Carnaval na Cidade SP", agency: "fishfire", client: "Ambev", status: "post", progress: 95, revenue: 1200000, cost: 780000, team: ["t2", "t6", "t10"], startDate: "2026-01-10", endDate: "2026-03-05", priority: "high" },
  { id: "p3", name: "Numanice São Paulo", agency: "supersounds", client: "Ludmilla", status: "planning", progress: 35, revenue: 620000, cost: 280000, team: ["t4", "t10"], startDate: "2026-03-01", endDate: "2026-06-15", priority: "high" },
  { id: "p4", name: "Brand Activation Ambev", agency: "nowa9", client: "Ambev", status: "budget", progress: 20, revenue: 180000, cost: 95000, team: ["t11", "t7"], startDate: "2026-04-01", endDate: "2026-05-30", priority: "medium" },
  { id: "p5", name: "Festival Universitário INSPER", agency: "stage", client: "INSPER", status: "production", progress: 55, revenue: 340000, cost: 190000, team: ["t12", "t2"], startDate: "2026-02-20", endDate: "2026-04-10", priority: "medium" },
  { id: "p6", name: "Pride Experience 2026", agency: "efeito", client: "Magazine Luiza", status: "briefing", progress: 10, revenue: 450000, cost: 0, team: ["t6"], startDate: "2026-05-01", endDate: "2026-07-30", priority: "medium" },
  { id: "p7", name: "Hush Sunset Series", agency: "hush", client: "Chandon", status: "proposal", progress: 15, revenue: 280000, cost: 0, team: ["t1", "t8"], startDate: "2026-04-15", endDate: "2026-06-30", priority: "low" },
  { id: "p8", name: "Rebranding Restaurante Spot", agency: "tunnel", client: "Spot", status: "production", progress: 60, revenue: 95000, cost: 42000, team: ["t8"], startDate: "2026-02-01", endDate: "2026-03-30", priority: "medium" },
  { id: "p9", name: "New Blood Festival", agency: "newblood", client: "Próprio", status: "planning", progress: 25, revenue: 520000, cost: 180000, team: ["t2", "t4", "t10"], startDate: "2026-05-15", endDate: "2026-08-20", priority: "high" },
  { id: "p10", name: "Sounds Food — Casa Nova", agency: "soundsfood", client: "Interno", status: "production", progress: 40, revenue: 200000, cost: 120000, team: ["t9"], startDate: "2026-03-01", endDate: "2026-05-15", priority: "medium" },
];

const STATUSES = {
  briefing: { label: "Briefing", color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  proposal: { label: "Proposta", color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
  budget: { label: "Orçamento", color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  planning: { label: "Planejamento", color: "#34D399", bg: "rgba(52,211,153,0.1)" },
  production: { label: "Produção", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  event: { label: "Evento", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  post: { label: "Pós-evento", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
};

const PIPELINE_ORDER = ["briefing", "proposal", "budget", "planning", "production", "event", "post"];

// -- GANTT DATA --
const GANTT_TASKS = [
  { id: "g1", project: "p1", name: "Briefing & Proposta", start: 0, duration: 3, status: "done" },
  { id: "g2", project: "p1", name: "Aprovação Orçamento", start: 3, duration: 2, status: "done" },
  { id: "g3", project: "p1", name: "Contratação Fornecedores", start: 5, duration: 3, status: "done" },
  { id: "g4", project: "p1", name: "Cenografia & Montagem", start: 7, duration: 4, status: "active" },
  { id: "g5", project: "p1", name: "Comunicação & PR", start: 6, duration: 5, status: "active" },
  { id: "g6", project: "p1", name: "Lineup Musical", start: 4, duration: 4, status: "done" },
  { id: "g7", project: "p1", name: "Operação Dia D", start: 11, duration: 2, status: "pending" },
  { id: "g8", project: "p1", name: "Desmontagem & Relatório", start: 13, duration: 2, status: "pending" },
  { id: "g9", project: "p5", name: "Planejamento Acadêmico", start: 0, duration: 2, status: "done" },
  { id: "g10", project: "p5", name: "Parcerias Universitárias", start: 2, duration: 3, status: "active" },
  { id: "g11", project: "p5", name: "Produção & Logística", start: 4, duration: 4, status: "pending" },
  { id: "g12", project: "p5", name: "Evento + Pós", start: 8, duration: 2, status: "pending" },
];

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"];

// ============================================================================
// UTILITY
// ============================================================================
function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
}

function getAgency(id) {
  return AGENCIES.find(a => a.id === id) || AGENCIES[0];
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

// -- DASHBOARD --
function DashboardTab({ selectedAgency }) {
  const filtered = selectedAgency === "all" ? PROJECTS : PROJECTS.filter(p => p.agency === selectedAgency);
  const totalRevenue = filtered.reduce((s, p) => s + p.revenue, 0);
  const totalCost = filtered.reduce((s, p) => s + p.cost, 0);
  const avgProgress = Math.round(filtered.reduce((s, p) => s + p.progress, 0) / (filtered.length || 1));
  const margin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1) : 0;
  const teamCount = [...new Set(filtered.flatMap(p => p.team))].length;

  const statusCounts = {};
  filtered.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Receita Total", value: formatCurrency(totalRevenue), change: "+22%", up: true, accent: "#F59E0B" },
          { label: "Custo Total", value: formatCurrency(totalCost), change: "-5%", up: true, accent: "#EF4444" },
          { label: "Margem", value: `${margin}%`, change: "+1.8pp", up: true, accent: "#10B981" },
          { label: "Projetos", value: filtered.length, change: `${avgProgress}% média`, up: true, accent: "#6366F1" },
          { label: "Equipe Alocada", value: teamCount, change: "pessoas", up: true, accent: "#06B6D4" },
        ].map((kpi, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
            <p className="text-xs text-white/30 mb-1">{kpi.label}</p>
            <p className="text-2xl font-black text-white">{kpi.value}</p>
            <span className={`text-xs font-medium ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>{kpi.change}</span>
          </div>
        ))}
      </div>

      {/* Status distribution */}
      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
        <h3 className="text-sm font-bold text-white/50 mb-4">Pipeline de Projetos</h3>
        <div className="flex gap-2 items-end h-32">
          {PIPELINE_ORDER.map(status => {
            const count = statusCounts[status] || 0;
            const height = count > 0 ? Math.max(20, (count / filtered.length) * 100) : 4;
            const s = STATUSES[status];
            return (
              <div key={status} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-white/60">{count}</span>
                <div className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80" style={{ height: `${height}%`, background: s.color, minHeight: "4px" }} />
                <span className="text-[10px] text-white/25 text-center">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Projects list */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.02] text-xs text-white/25 font-medium">
          <span className="col-span-3">Projeto</span>
          <span className="col-span-2">Agência</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-2">Progresso</span>
          <span className="col-span-2 text-right">Receita</span>
          <span className="col-span-2 text-right">Margem</span>
        </div>
        {filtered.map(p => {
          const ag = getAgency(p.agency);
          const st = STATUSES[p.status];
          const m = p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue * 100).toFixed(0) : "—";
          return (
            <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center">
              <div className="col-span-3">
                <p className="text-sm font-semibold text-white/80 truncate">{p.name}</p>
                <p className="text-xs text-white/25">{p.client}</p>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: ag.color }} />
                <span className="text-xs text-white/40">{ag.name}</span>
              </div>
              <div className="col-span-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: st.color }} />
                </div>
                <span className="text-xs text-white/30 w-8 text-right">{p.progress}%</span>
              </div>
              <span className="col-span-2 text-sm text-white/50 text-right font-medium">{formatCurrency(p.revenue)}</span>
              <span className={`col-span-2 text-sm text-right font-bold ${Number(m) > 30 ? "text-emerald-400" : Number(m) > 15 ? "text-amber-400" : "text-red-400"}`}>{m}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -- KANBAN --
function KanbanTab({ selectedAgency }) {
  const filtered = selectedAgency === "all" ? PROJECTS : PROJECTS.filter(p => p.agency === selectedAgency);

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 min-w-[1200px] pb-4">
        {PIPELINE_ORDER.map(status => {
          const cards = filtered.filter(p => p.status === status);
          const st = STATUSES[status];
          return (
            <div key={status} className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: st.color }} />
                <span className="text-xs font-bold text-white/50">{st.label}</span>
                <span className="text-xs text-white/20 ml-auto">{cards.length}</span>
              </div>
              <div className="space-y-3">
                {cards.map(p => {
                  const ag = getAgency(p.agency);
                  return (
                    <div key={p.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-grab active:cursor-grabbing group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: ag.color }} />
                          <span className="text-[10px] text-white/30 font-medium">{ag.name}</span>
                        </div>
                        {p.priority === "high" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/10 text-red-400 font-bold">ALTA</span>}
                      </div>
                      <h4 className="text-sm font-bold text-white/80 leading-tight mb-1">{p.name}</h4>
                      <p className="text-xs text-white/25 mb-3">{p.client}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: st.color }} />
                        </div>
                        <span className="text-[10px] text-white/20">{p.progress}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1.5">
                          {p.team.slice(0, 3).map(tid => {
                            const member = TEAM_MEMBERS.find(t => t.id === tid);
                            return member ? (
                              <div key={tid} className="w-5 h-5 rounded-full bg-white/10 border border-[#0A0A0B] flex items-center justify-center text-[8px] font-bold text-white/50">{member.avatar}</div>
                            ) : null;
                          })}
                          {p.team.length > 3 && <div className="w-5 h-5 rounded-full bg-white/5 border border-[#0A0A0B] flex items-center justify-center text-[8px] text-white/30">+{p.team.length - 3}</div>}
                        </div>
                        <span className="text-[10px] text-white/15">{p.startDate?.slice(5)}</span>
                      </div>
                    </div>
                  );
                })}
                {cards.length === 0 && (
                  <div className="p-4 rounded-xl border border-dashed border-white/5 text-center">
                    <span className="text-xs text-white/15">Nenhum projeto</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -- GANTT TIMELINE --
function GanttTab({ selectedAgency }) {
  const filteredProjects = selectedAgency === "all" ? ["p1", "p5"] : PROJECTS.filter(p => p.agency === selectedAgency).map(p => p.id);
  const tasks = GANTT_TASKS.filter(t => filteredProjects.includes(t.project));
  const totalWeeks = 16;

  const statusColors = {
    done: { bar: "#10B981", text: "text-emerald-400" },
    active: { bar: "#F59E0B", text: "text-amber-400" },
    pending: { bar: "#374151", text: "text-white/20" },
  };

  // Group by project
  const grouped = {};
  tasks.forEach(t => {
    if (!grouped[t.project]) grouped[t.project] = [];
    grouped[t.project].push(t);
  });

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-4">
        {Object.entries(statusColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: val.bar }} />
            <span className="text-xs text-white/30 capitalize">{key === "done" ? "Concluído" : key === "active" ? "Em andamento" : "Pendente"}</span>
          </div>
        ))}
        <span className="text-xs text-white/15 ml-auto">Semanas → (hover para detalhes)</span>
      </div>

      {/* Gantt */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        {/* Week headers */}
        <div className="flex border-b border-white/5">
          <div className="w-56 flex-shrink-0 px-4 py-2 bg-white/[0.02]">
            <span className="text-xs text-white/20 font-medium">Tarefa</span>
          </div>
          <div className="flex-1 flex">
            {Array.from({ length: totalWeeks }, (_, i) => (
              <div key={i} className="flex-1 py-2 text-center border-l border-white/[0.03]">
                <span className="text-[10px] text-white/15">S{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {Object.entries(grouped).map(([projectId, projectTasks]) => {
          const project = PROJECTS.find(p => p.id === projectId);
          const ag = getAgency(project?.agency);
          return (
            <div key={projectId}>
              {/* Project header */}
              <div className="flex items-center px-4 py-2 bg-white/[0.01] border-b border-white/[0.03]">
                <div className="w-2 h-2 rounded-full mr-2" style={{ background: ag.color }} />
                <span className="text-xs font-bold text-white/50">{project?.name}</span>
              </div>
              {/* Tasks */}
              {projectTasks.map(task => {
                const sc = statusColors[task.status];
                return (
                  <div key={task.id} className="flex items-center border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                    <div className="w-56 flex-shrink-0 px-4 py-3">
                      <span className={`text-xs font-medium ${sc.text}`}>{task.name}</span>
                    </div>
                    <div className="flex-1 flex items-center relative py-3">
                      {/* Grid lines */}
                      {Array.from({ length: totalWeeks }, (_, i) => (
                        <div key={i} className="flex-1 h-full border-l border-white/[0.02]" />
                      ))}
                      {/* Bar */}
                      <div
                        className="absolute h-6 rounded-md transition-all group-hover:h-7 group-hover:opacity-90"
                        style={{
                          left: `${(task.start / totalWeeks) * 100}%`,
                          width: `${(task.duration / totalWeeks) * 100}%`,
                          background: sc.bar,
                          opacity: task.status === "pending" ? 0.3 : 0.7,
                        }}
                      >
                        <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-white/80 truncate">
                          {task.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Month markers */}
      <div className="flex">
        <div className="w-56 flex-shrink-0" />
        <div className="flex-1 flex">
          {MONTHS.slice(0, 4).map((m, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-xs text-white/20 font-medium">{m} 2026</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -- TEAM --
function TeamTab({ selectedAgency }) {
  const filtered = selectedAgency === "all" ? TEAM_MEMBERS : TEAM_MEMBERS.filter(t => t.agency === selectedAgency);
  const [view, setView] = useState("grid");

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-white/40">CLT: {filtered.filter(t => t.status === "active").length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs text-white/40">Freelancer: {filtered.filter(t => t.status === "freelancer").length}</span>
          </div>
        </div>
        <div className="flex bg-white/5 rounded-lg p-0.5">
          {["grid", "list"].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === v ? "bg-white/10 text-white/80" : "text-white/30"}`}>
              {v === "grid" ? "Cards" : "Lista"}
            </button>
          ))}
        </div>
      </div>

      {/* Team grid */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(member => {
            const ag = getAgency(member.agency);
            const allocatedProjects = PROJECTS.filter(p => p.team.includes(member.id));
            const load = member.allocated > 3 ? "high" : member.allocated > 1 ? "medium" : "low";
            const loadColors = { high: "text-red-400 bg-red-400/10", medium: "text-amber-400 bg-amber-400/10", low: "text-emerald-400 bg-emerald-400/10" };
            return (
              <div key={member.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: ag.color + "20", color: ag.color }}>
                    {member.avatar}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${member.status === "freelancer" ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400"}`}>
                    {member.status === "freelancer" ? "FREE" : "CLT"}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white/80">{member.name}</h4>
                <p className="text-xs text-white/30 mt-0.5">{member.role}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: ag.color }} />
                  <span className="text-[10px] text-white/25">{ag.name}</span>
                </div>
                {/* Skills */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {member.skills.map((s, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/25">{s}</span>
                  ))}
                </div>
                {/* Load indicator */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.03]">
                  <span className="text-[10px] text-white/20">Alocação</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-1.5 h-3 rounded-sm ${i <= member.allocated ? "bg-white/30" : "bg-white/5"}`} />
                      ))}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${loadColors[load]}`}>
                      {member.allocated} proj
                    </span>
                  </div>
                </div>
                {/* Allocated projects */}
                {allocatedProjects.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {allocatedProjects.slice(0, 2).map(proj => (
                      <div key={proj.id} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full" style={{ background: STATUSES[proj.status]?.color }} />
                        <span className="text-[10px] text-white/20 truncate">{proj.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          {filtered.map(member => {
            const ag = getAgency(member.agency);
            return (
              <div key={member.id} className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: ag.color + "20", color: ag.color }}>{member.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80">{member.name}</p>
                  <p className="text-xs text-white/30">{member.role}</p>
                </div>
                <span className="text-xs text-white/25">{ag.name}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1 h-3 rounded-sm ${i <= member.allocated ? "bg-amber-400/50" : "bg-white/5"}`} />
                  ))}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${member.status === "freelancer" ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400"}`}>
                  {member.status === "freelancer" ? "FREE" : "CLT"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -- FINANCIAL --
function FinancialTab({ selectedAgency }) {
  const filtered = selectedAgency === "all" ? PROJECTS : PROJECTS.filter(p => p.agency === selectedAgency);

  const byAgency = {};
  filtered.forEach(p => {
    if (!byAgency[p.agency]) byAgency[p.agency] = { revenue: 0, cost: 0, projects: 0 };
    byAgency[p.agency].revenue += p.revenue;
    byAgency[p.agency].cost += p.cost;
    byAgency[p.agency].projects++;
  });

  const totalRevenue = filtered.reduce((s, p) => s + p.revenue, 0);
  const totalCost = filtered.reduce((s, p) => s + p.cost, 0);

  return (
    <div className="space-y-6">
      {/* Revenue vs Cost bars by agency */}
      <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-bold text-white/50 mb-6">Receita × Custo por Agência</h3>
        <div className="space-y-4">
          {Object.entries(byAgency).sort((a, b) => b[1].revenue - a[1].revenue).map(([agId, data]) => {
            const ag = getAgency(agId);
            const margin = data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue * 100).toFixed(0) : 0;
            const revenueWidth = (data.revenue / totalRevenue) * 100;
            const costWidth = totalRevenue > 0 ? (data.cost / totalRevenue) * 100 : 0;
            return (
              <div key={agId} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded" style={{ background: ag.color }} />
                    <span className="text-sm font-semibold text-white/60 group-hover:text-white/80 transition-colors">{ag.name}</span>
                    <span className="text-xs text-white/20">{data.projects} proj</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">{formatCurrency(data.revenue)}</span>
                    <span className={`text-xs font-bold ${Number(margin) > 30 ? "text-emerald-400" : "text-amber-400"}`}>{margin}%</span>
                  </div>
                </div>
                <div className="relative h-5 bg-white/[0.02] rounded-lg overflow-hidden">
                  <div className="absolute h-full rounded-lg opacity-70" style={{ width: `${revenueWidth}%`, background: ag.color }} />
                  <div className="absolute h-full rounded-lg bg-red-500/20" style={{ width: `${costWidth}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-white/30" /><span className="text-xs text-white/25">Receita</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded bg-red-500/30" /><span className="text-xs text-white/25">Custo</span></div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-emerald-400/[0.05] border border-emerald-400/10 text-center">
          <p className="text-xs text-emerald-400/60">Lucro Bruto</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(totalRevenue - totalCost)}</p>
        </div>
        <div className="p-5 rounded-xl bg-amber-400/[0.05] border border-amber-400/10 text-center">
          <p className="text-xs text-amber-400/60">Ticket Médio</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(totalRevenue / (filtered.length || 1))}</p>
        </div>
        <div className="p-5 rounded-xl bg-violet-400/[0.05] border border-violet-400/10 text-center">
          <p className="text-xs text-violet-400/60">ROI</p>
          <p className="text-2xl font-black text-violet-400 mt-1">{totalCost > 0 ? ((totalRevenue / totalCost - 1) * 100).toFixed(0) : 0}%</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "kanban", label: "Projetos", icon: "📋" },
  { id: "gantt", label: "Cronograma", icon: "📅" },
  { id: "team", label: "Equipe", icon: "👥" },
  { id: "financial", label: "Financeiro", icon: "💰" },
];

export default function EventOSDemo() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAgency, setSelectedAgency] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const TabContent = useMemo(() => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab selectedAgency={selectedAgency} />;
      case "kanban": return <KanbanTab selectedAgency={selectedAgency} />;
      case "gantt": return <GanttTab selectedAgency={selectedAgency} />;
      case "team": return <TeamTab selectedAgency={selectedAgency} />;
      case "financial": return <FinancialTab selectedAgency={selectedAgency} />;
      default: return null;
    }
  }, [activeTab, selectedAgency]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        * { font-family: 'Outfit', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-56" : "w-16"} flex-shrink-0 border-r border-white/5 bg-white/[0.01] flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-amber-400/20 flex-shrink-0">U</div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white/90 tracking-tight">EventOS</h1>
              <p className="text-[10px] text-white/25 truncate">grupo UMAUMA</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-amber-400/10 text-amber-400"
                  : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
              }`}
            >
              <span className="text-base flex-shrink-0">{tab.icon}</span>
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Agency filter */}
        {sidebarOpen && (
          <div className="p-3 border-t border-white/5">
            <p className="text-[10px] text-white/20 font-medium mb-2 px-2">AGÊNCIA</p>
            <div className="space-y-0.5 max-h-48 overflow-y-auto scrollbar-hide">
              <button
                onClick={() => setSelectedAgency("all")}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                  selectedAgency === "all" ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/50"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-violet-400" />
                <span>Todas (consolidado)</span>
              </button>
              {AGENCIES.map(ag => (
                <button
                  key={ag.id}
                  onClick={() => setSelectedAgency(ag.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                    selectedAgency === ag.id ? "bg-white/10 text-white/80" : "text-white/25 hover:text-white/40"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ag.color }} />
                  <span className="truncate">{ag.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapse */}
        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="p-3 border-t border-white/5 text-white/20 hover:text-white/40 transition-colors text-xs text-center"
        >
          {sidebarOpen ? "← Recolher" : "→"}
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white/80">
              {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            {selectedAgency !== "all" && (
              <span className="text-xs px-2.5 py-1 rounded-full border font-medium" style={{
                borderColor: getAgency(selectedAgency).color + "30",
                color: getAgency(selectedAgency).color,
                background: getAgency(selectedAgency).color + "10",
              }}>
                {getAgency(selectedAgency).name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/20 mono">DEMO — dados simulados</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
          {TabContent}
        </div>

        {/* Footer */}
        <footer className="px-6 py-2 border-t border-white/[0.03] flex justify-between items-center">
          <span className="text-[10px] text-white/10 mono">EventOS v0.1 — WG build.tech × UMAUMA</span>
          <span className="text-[10px] text-white/10">14 agências · 10 projetos · 12 membros</span>
        </footer>
      </main>
    </div>
  );
}


// ============================================================
// CadastrosPage - Módulo Unificado de Cadastros
// Sistema WG Easy - Grupo WG Almeida
// Consolida Clientes, Colaboradores, Especificadores e Fornecedores
// ============================================================

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Users, Briefcase, Award, User, Plus } from "lucide-react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import PessoasList from "@/components/pessoas/PessoasList";
import { BotaoGerarLink } from "@/components/cadastro-link/GerarLinkCadastroModal";
import type { TipoCadastro } from "@/lib/cadastroLinkApi";

type TabType = "clientes" | "parceiros" | "especificadores";

const TABS = [
  {
    id: "clientes" as TabType,
    label: "Clientes",
    icon: Users,
    tipo: "CLIENTE" as const,
    descricao: "GestÍo unificada de clientes do Grupo WG Almeida.",
    novoPath: "/pessoas/clientes/novo",
    color: "#F25C26",
  },
  {
    id: "parceiros" as TabType,
    label: "Colab. & Forn.",
    icon: Briefcase,
    tipo: ["COLABORADOR", "FORNECEDOR"] as const,
    descricao: "GestÍo unificada de colaboradores e fornecedores com tags por tipo.",
    novoPath: "/pessoas/colaboradores/novo",
    color: "#2B4580",
  },
  {
    id: "especificadores" as TabType,
    label: "Especificadores",
    icon: Award,
    tipo: "ESPECIFICADOR" as const,
    descricao: "Arquitetos, engenheiros e profissionais que especificam WG.",
    novoPath: "/pessoas/especificadores/novo",
    color: "#5E9B94",
  },
];

export default function CadastrosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || "clientes");

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className={`min-h-screen bg-white ${LAYOUT.pageContainer} py-4 sm:py-6`} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header */}
      <div className={LAYOUT.pageHeaderSpacing}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}dd)`,
              }}
            >
              <User className={`${TYPOGRAPHY.iconLarge} text-white`} />
            </div>
            <div>
              <h1 className={TYPOGRAPHY.pageTitle} style={{ fontWeight: 200 }}>Cadastros</h1>
              <p className={TYPOGRAPHY.pageSubtitle}>
                Gestao unificada de pessoas do Grupo WG Almeida
              </p>
            </div>
          </div>

          {/* Botoes de acao */}
          <div className={LAYOUT.pageActions}>
            {currentTab.id === "parceiros" ? (
              <>
                <BotaoGerarLink
                  tipo={"COLABORADOR" as TipoCadastro}
                  className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-lg ${TYPOGRAPHY.cardTitle} hover:opacity-90 transition-all shadow-lg`}
                  style={{ background: "linear-gradient(135deg, #2B4580, #2B4580dd)" }}
                />
                <BotaoGerarLink
                  tipo={"FORNECEDOR" as TipoCadastro}
                  className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-lg ${TYPOGRAPHY.cardTitle} hover:opacity-90 transition-all shadow-lg`}
                  style={{ background: "linear-gradient(135deg, #8B5E3C, #8B5E3Cdd)" }}
                />
                <button
                  onClick={() => navigate("/pessoas/colaboradores/novo")}
                  className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-lg ${TYPOGRAPHY.cardTitle} hover:opacity-90 transition-all shadow-lg`}
                  style={{
                    background: `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}dd)`,
                  }}
                >
                  <Plus className={TYPOGRAPHY.iconMedium} />
                  <span className="hidden sm:inline">Novo Colaborador</span>
                  <span className="sm:hidden">+ Colab</span>
                </button>
                <button
                  onClick={() => navigate("/pessoas/fornecedores/novo")}
                  className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-lg ${TYPOGRAPHY.cardTitle} hover:opacity-90 transition-all shadow-lg`}
                  style={{
                    background: "linear-gradient(135deg, #8B5E3C, #8B5E3Cdd)",
                  }}
                >
                  <Plus className={TYPOGRAPHY.iconMedium} />
                  <span className="hidden sm:inline">Novo Fornecedor</span>
                  <span className="sm:hidden">+ Forn</span>
                </button>
              </>
            ) : (
              <>
                <BotaoGerarLink
                  tipo={currentTab.tipo.toString().toUpperCase() as TipoCadastro}
                  className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-lg ${TYPOGRAPHY.cardTitle} hover:opacity-90 transition-all shadow-lg`}
                  style={{ background: `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}dd)` }}
                />
                <button
                  onClick={() => navigate(currentTab.novoPath)}
                  className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-lg ${TYPOGRAPHY.cardTitle} hover:opacity-90 transition-all shadow-lg`}
                  style={{
                    background: `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}dd)`,
                  }}
                >
                  <Plus className={TYPOGRAPHY.iconMedium} />
                  <span className="hidden sm:inline">Novo Cadastro</span>
                  <span className="sm:hidden">Novo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`${LAYOUT.tabsWrapper} mb-4 sm:mb-6`}>
        <div className="bg-white rounded-xl p-1 border border-gray-100 shadow-sm inline-flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 ${TYPOGRAPHY.cardTitle} rounded-lg transition-all whitespace-nowrap
                  ${isActive
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }
                `}
                style={isActive ? { backgroundColor: tab.color } : {}}
              >
                <Icon className={TYPOGRAPHY.iconSmall} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <PessoasList
        key={currentTab.id}
        tipo={currentTab.tipo as any}
        titulo={currentTab.label}
        descricao={currentTab.descricao}
        novoPath={currentTab.novoPath}
        corModulo={currentTab.color}
        ocultarBotoesHeader
        resolverPath={(pessoa, acao) => {
          if (currentTab.id !== "parceiros") {
            if (acao === "novo") return currentTab.novoPath;
            if (acao === "editar") return currentTab.novoPath.replace("/novo", `/editar/${pessoa.id}`);
            return currentTab.novoPath.replace("/novo", `/${pessoa.id}`);
          }
          const basePath =
            pessoa.tipo === "FORNECEDOR"
              ? "/pessoas/fornecedores/novo"
              : "/pessoas/colaboradores/novo";
          if (acao === "novo") return basePath;
          if (acao === "editar") return basePath.replace("/novo", `/editar/${pessoa.id}`);
          return basePath.replace("/novo", `/${pessoa.id}`);
        }}
      />
    </div>
  );
}


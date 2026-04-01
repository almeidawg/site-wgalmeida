// src/pages/pessoas/PessoaPanelPage.tsx
// Painel 360 integrado com Supabase
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { WGTabBar, WGTabItem } from "@/components/ui/WGTabBar";
import { PessoaActions } from "@/components/pessoas/PessoaActions";
import type { Pessoa } from "@/types/pessoas";
import { obterPessoa } from "@/lib/pessoasApi";

// Importar abas
import { InfoTab } from "./painel/InfoTab";
import { DocumentosTab } from "./painel/DocumentosTab";
import { PropostasTab } from "./painel/PropostasTab";
import { ContratosTab } from "./painel/ContratosTab";
import { ObrasTab } from "./painel/ObrasTab";
import { HistoricoTab } from "./painel/HistoricoTab";

const TABS: WGTabItem[] = [
  { key: "info", label: "Informações" },
  { key: "documentos", label: "Documentos" },
  { key: "propostas", label: "Propostas" },
  { key: "contratos", label: "Contratos" },
  { key: "obras", label: "Obras & Cronograma" },
  { key: "historico", label: "Histórico" },
];

export const PessoaPanelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>("info");
  const [pessoa, setPessoa] = useState<Pessoa | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        // IntegraçÍo com Supabase
        const data = await obterPessoa(id);

        if (!data) {
          setNotFound(true);
          return;
        }

        setPessoa(data);
      } catch (e) {
        console.error("[PessoaPanelPage] Erro ao carregar pessoa:", e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const renderTabContent = () => {
    if (!pessoa) return null;

    switch (activeTab) {
      case "info":
        return <InfoTab pessoa={pessoa} />;
      case "documentos":
        return <DocumentosTab pessoaId={pessoa.id} />;
      case "propostas":
        return <PropostasTab pessoaId={pessoa.id} />;
      case "contratos":
        return <ContratosTab pessoaId={pessoa.id} />;
      case "obras":
        return <ObrasTab pessoaId={pessoa.id} />;
      case "historico":
        return <HistoricoTab pessoaId={pessoa.id} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6">
          <div className="h-8 w-40 bg-gray-200 rounded mb-4" />
          <div className="h-32 bg-white rounded-2xl shadow-sm" />
        </div>
      </div>
    );
  }

  if (notFound || !pessoa) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6 text-center">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">
            Pessoa nÍo encontrada
          </h1>
          <p className="text-gray-500 mb-4">
            NÍo localizamos esse cadastro. Verifique o link ou tente novamente.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-lg hover:bg-black"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const avatarLetter = pessoa.nome ? pessoa.nome.charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              ← Voltar
            </button>

            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-normal">
                {avatarLetter}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-normal text-gray-900">
                    {pessoa.nome}
                  </h1>
                  {pessoa.ativo && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700">
                      Ativo
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                  {pessoa.tipo && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {pessoa.tipo}
                    </span>
                  )}
                  {pessoa.cargo && <span>{pessoa.cargo}</span>}
                  {pessoa.unidade && <span>· {pessoa.unidade}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Ações rápidas */}
          <PessoaActions
            id={pessoa.id}
            nome={pessoa.nome}
            email={pessoa.email ?? undefined}
            telefone={pessoa.telefone ?? undefined}
            driveFolderUrl={undefined}
          />
        </div>
      </div>

      {/* Tabs */}
      <WGTabBar
        items={TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Conteúdo da aba */}
      <div className="p-4 sm:p-6">{renderTabContent()}</div>
    </div>
  );
};


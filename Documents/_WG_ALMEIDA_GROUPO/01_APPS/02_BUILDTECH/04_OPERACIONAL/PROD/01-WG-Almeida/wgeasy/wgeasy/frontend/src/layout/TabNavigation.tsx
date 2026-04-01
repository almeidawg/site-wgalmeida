import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { buscarTituloRegistro } from "../services/tabTitleService";

interface Tab {
  title: string;
  path: string;
  loading?: boolean;
}

// Mapeamento de rotas para títulos genéricos (fallback inicial)
const titulosFallback: Record<string, string> = {
  "pessoas/clientes": "Cliente",
  "pessoas/colaboradores": "Colaborador",
  "pessoas/fornecedores": "Fornecedor",
  "pessoas/especificadores": "Especificador",
  "contratos": "Contrato",
  "cronograma/projects": "Projeto",
  "cronograma/projeto": "Projeto",
  "orcamentos": "Orçamento",
  "compras": "Compra",
  "assistencia": "Assistência",
  "usuarios": "Usuário",
  "tarefas": "Tarefa",
  "obras": "Obra",
};

export function TabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [active, setActive] = useState("");

  // FunçÍo para gerar título inicial (síncrono)
  const gerarTituloInicial = useCallback((path: string): { titulo: string; rotaBase: string | null; uuid: string | null } => {
    const parts = path.split("/").filter(Boolean);

    if (parts.length === 0) {
      return { titulo: "Dashboard", rotaBase: null, uuid: null };
    }

    const lastPart = parts[parts.length - 1];
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastPart);

    if (isUUID && parts.length >= 2) {
      const rotaBase = parts.slice(0, -1).join("/");
      const tituloFallback = titulosFallback[rotaBase];

      if (tituloFallback) {
        return { titulo: tituloFallback, rotaBase, uuid: lastPart };
      }

      // Fallback: usar a penúltima parte da URL
      const penultimaParte = parts[parts.length - 2];
      return {
        titulo: penultimaParte.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        rotaBase,
        uuid: lastPart,
      };
    }

    // Para rotas sem UUID
    return {
      titulo: lastPart.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      rotaBase: null,
      uuid: null,
    };
  }, []);

  // FunçÍo para atualizar título de uma aba específica
  const atualizarTitulo = useCallback((path: string, novoTitulo: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.path === path ? { ...tab, title: novoTitulo, loading: false } : tab
      )
    );
  }, []);

  // Buscar título real do registro
  const buscarTituloReal = useCallback(
    async (path: string, rotaBase: string, uuid: string) => {
      try {
        const nomeReal = await buscarTituloRegistro(rotaBase, uuid);
        atualizarTitulo(path, nomeReal);
      } catch (error) {
        console.warn("[TabNavigation] Erro ao buscar título:", error);
      }
    },
    [atualizarTitulo]
  );

  useEffect(() => {
    const current = location.pathname;

    setTabs((prev) => {
      // Verificar se a aba já existe
      if (prev.some((t) => t.path === current)) {
        return prev;
      }

      // Gerar título inicial
      const { titulo, rotaBase, uuid } = gerarTituloInicial(current);

      // Se tem UUID, marcar como loading e buscar nome real
      if (rotaBase && uuid) {
        // Agendar busca do título real (fora do setState)
        setTimeout(() => buscarTituloReal(current, rotaBase, uuid), 0);
        return [...prev, { title: titulo, path: current, loading: true }];
      }

      return [...prev, { title: titulo, path: current }];
    });

    setActive(current);
  }, [location.pathname, gerarTituloInicial, buscarTituloReal]);

  function fecharAba(path: string) {
    const novaLista = tabs.filter((t) => t.path !== path);

    setTabs(novaLista);

    // Se fechar a aba ativa, ir para a última restante
    if (path === active && novaLista.length > 0) {
      navigate(novaLista[novaLista.length - 1].path);
    } else if (novaLista.length === 0) {
      navigate("/");
    }
  }

  function fecharTodas() {
    setTabs([]);
    navigate("/");
  }

  return (
    <div className="wg-tabs-container">
      <div className="wg-tabs-header">
        <div className="wg-tabs-scroll">
          {tabs.map((tab) => (
            <div
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`wg-tab-item ${tab.path === active ? "wg-tab-active" : ""}`}
            >
              <span className={tab.loading ? "wg-tab-loading" : ""}>
                {tab.title}
              </span>

              <button
                type="button"
                className="wg-tab-close"
                title={`Fechar ${tab.title}`}
                aria-label={`Fechar ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  fecharAba(tab.path);
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Ações rápidas */}
        <div className="wg-tabs-actions">
          <button type="button" onClick={fecharTodas}>
            Fechar tudo
          </button>
        </div>
      </div>
    </div>
  );
}

export default TabNavigation;


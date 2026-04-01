import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/auth/AuthContext";
import "@/styles/obra-detalhes.css";

type Obra = {
  id: string;
  nome: string;
  descricao: string | null;
  endereco: string | null;
  status: string | null;
  data_prevista_entrega: string | null;
  data_inicio: string | null;
  criado_em: string | null;
  empresa_id: string | null;
  responsavel_id: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  em_planejamento: "Em planejamento",
  planejamento: "Planejamento",
  em_execucao: "Em execuçÍo",
  concluida: "Concluída",
};

export default function ObraDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [obra, setObra] = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setErro("Obra nÍo encontrada.");
      setLoading(false);
      return;
    }

    async function carregar() {
      setLoading(true);
      setErro(null);

      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .eq("id", id)
        .limit(1)
        .single();

      if (error) {
        console.error("Erro ao buscar obra:", error);
        setErro("NÍo foi possível carregar os dados da obra.");
        setObra(null);
      } else {
        setObra(data as Obra);
      }

      setLoading(false);
    }

    carregar();
  }, [id]);

  const statusTexto =
    obra?.status && STATUS_LABEL[obra.status]
      ? STATUS_LABEL[obra.status]
      : obra?.status ?? "Sem status";

  function formatarData(valor: string | null | undefined) {
    if (!valor) return "-";
    const d = parseDataLocal(valor);
    if (Number.isNaN(d.getTime())) return valor;
    return d.toLocaleDateString("pt-BR");
  }

  function parseDataLocal(data: string) {
    const isoSemHora = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoSemHora) {
      const [, ano, mes, dia] = isoSemHora;
      return new Date(Number(ano), Number(mes) - 1, Number(dia));
    }
    return new Date(data);
  }

  return (
    <div className="obra-detalhes-page">
      <div className="obra-detalhes-header">
        <button className="obra-voltar text-[14px]" onClick={() => navigate("/cronograma/projects")}>
          ← Voltar para obras
        </button>

        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-[#3B82F6]">{obra?.nome ?? "Detalhes da obra"}</h1>
          {obra && (
            <span className={`obra-status-pill status-${obra.status ?? "default"}`}>
              {statusTexto}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="obra-card">
          <p className="text-[16px] text-gray-600">Carregando informações da obra...</p>
        </div>
      )}

      {!loading && erro && (
        <div className="obra-card erro">
          <p className="text-[16px] text-red-600">{erro}</p>
        </div>
      )}

      {!loading && obra && (
        <>
          {/* Card principal com dados da obra */}
          <section className="obra-card obra-card-principal">
            <div className="obra-card-header">
              <h2 className="text-[20px] font-normal text-gray-900">Informações gerais</h2>
              {user && (
                <button className="obra-acao-secundaria text-[14px]" disabled>
                  Editar (em breve)
                </button>
              )}
            </div>

            <div className="obra-grid">
              <div className="obra-info-bloco">
                <span className="obra-info-label text-[12px] text-gray-500">Endereço</span>
                <p className="obra-info-valor text-[16px]">
                  {obra.endereco || "NÍo informado"}
                </p>
              </div>

              <div className="obra-info-bloco">
                <span className="obra-info-label text-[12px] text-gray-500">Data prevista de entrega</span>
                <p className="obra-info-valor text-[16px]">
                  {formatarData(obra.data_prevista_entrega)}
                </p>
              </div>

              <div className="obra-info-bloco">
                <span className="obra-info-label text-[12px] text-gray-500">Início da obra</span>
                <p className="obra-info-valor text-[16px]">
                  {formatarData(obra.data_inicio)}
                </p>
              </div>

              <div className="obra-info-bloco">
                <span className="obra-info-label text-[12px] text-gray-500">Criada em</span>
                <p className="obra-info-valor text-[16px]">
                  {formatarData(obra.criado_em)}
                </p>
              </div>
            </div>

            <div className="obra-descricao">
              <span className="obra-info-label text-[12px] text-gray-500">DescriçÍo</span>
              <p className="obra-info-valor text-[16px]">
                {obra.descricao || "Nenhuma descriçÍo cadastrada."}
              </p>
            </div>
          </section>

          {/* Card de ações / módulos vinculados */}
          <section className="obra-card obra-card-modulos">
            <div className="obra-card-header">
              <h2 className="text-[20px] font-normal text-gray-900">Módulos da obra</h2>
              <span className="obra-modulos-sub text-[12px] text-gray-500">
                Em breve, toda a operaçÍo conectada aqui.
              </span>
            </div>

            <div className="obra-modulos-grid">
              <button
                className="obra-modulo-botao text-[14px]"
                onClick={() => navigate(`/obras/${obra.id}`)}
              >
                🧭 Etapas da obra
                <span className="text-[12px] text-gray-500">Planejamento, execuçÍo e entrega.</span>
              </button>

              <button
                className="obra-modulo-botao text-[14px]"
                onClick={() => navigate("/marcenaria")}
              >
                🪚 Marcenaria
                <span className="text-[12px] text-gray-500">Ambientes, peças e status de produçÍo.</span>
              </button>

              <button
                className="obra-modulo-botao text-[14px]"
                onClick={() => navigate("/upload")}
              >
                📎 Anexos e documentos
                <span className="text-[12px] text-gray-500">PDFs, contratos, plantas e relatórios.</span>
              </button>

              <button
                className="obra-modulo-botao text-[14px]"
                onClick={() => navigate("/financeiro")}
              >
                💰 Financeiro
                <span className="text-[12px] text-gray-500">Custos, receitas e fluxo da obra.</span>
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}


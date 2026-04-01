import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabaseClient";
import { OportunidadeModal } from "@/components/oportunidades/OportunidadeModal";
import { ESTAGIOS, type Estagio, CORES_NUCLEOS, type Nucleo } from "@/constants/oportunidades";
import OportunidadeCard, { OportunidadeUI } from "@/components/oportunidades/OportunidadeCard";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

type Oportunidade = {
  id: string;
  titulo: string;
  estagio: Estagio;
  valor_estimado: number | null;
  previsao_fechamento: string | null;
  origem: string | null;
  descricao: string | null;
  observacoes: string | null;
  clientes?: { id: string; nome: string } | null;
  nucleos?: Array<{ nucleo: Nucleo; valor: number | null }>;
  data_fechamento?: string | null;
  data_medicao?: string | null;
  prazo_executivo?: string | null;
  data_assinatura_executivo?: string | null;
};

type OportunidadeRow = {
  id: string;
  titulo: string | null;
  estagio: Estagio;
  valor_estimado: number | null;
  previsao_fechamento: string | null;
  origem: string | null;
  descricao: string | null;
  observacoes: string | null;
  cliente_id: string | null;
  data_fechamento?: string | null;
  data_medicao?: string | null;
  prazo_executivo?: string | null;
  data_assinatura_executivo?: string | null;
};

type ClienteRow = {
  id: string;
  nome: string | null;
  email?: string | null;
  telefone?: string | null;
};

type NucleoRow = {
  oportunidade_id: string;
  nucleo: Nucleo;
  valor: number | null;
};

const NUCLEO = "Marcenaria";
const CORES = CORES_NUCLEOS[NUCLEO];

export default function MarcenariaOportunidadesKanbanPage() {
  const navigate = useNavigate();
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<Oportunidade | null>(null);

  async function carregarOportunidades() {
    setLoading(true);

    // Query 1: Buscar todas as oportunidades
    const { data: oportRaw, error: oportError } = await supabase
      .from("oportunidades")
      .select("*")
      .order("criado_em", { ascending: false });

    const oportData = (oportRaw || []) as OportunidadeRow[];

    if (oportError) {
      console.error("Erro ao carregar oportunidades", oportError);
      setLoading(false);
      return;
    }

    // Query 2: Buscar todos os clientes relevantes
    const clienteIds = oportData
      .map((op) => op.cliente_id)
      .filter((id): id is string => Boolean(id));

    let clientesMap: Record<string, ClienteRow> = {};

    if (clienteIds.length > 0) {
      const { data: clientesRaw } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone")
        .in("id", clienteIds);

      const clientesData = (clientesRaw || []) as ClienteRow[];

      if (clientesData.length > 0) {
        clientesMap = clientesData.reduce((acc: Record<string, ClienteRow>, cliente) => {
          acc[cliente.id] = cliente;
          return acc;
        }, {} as Record<string, ClienteRow>);
      }
    }

    // Query 3: Buscar núcleos para cada oportunidade
    const { data: nucleosRaw } = await supabase
      .from("oportunidades_nucleos")
      .select("oportunidade_id, nucleo, valor");

    const nucleosData = (nucleosRaw || []) as NucleoRow[];

    // Combinar dados e filtrar apenas oportunidades do núcleo Marcenaria
    const oportunidadesComDados = oportData
      .map((op) => ({
        ...op,
        clientes: op.cliente_id ? clientesMap[op.cliente_id] : null,
        nucleos: nucleosData.filter((n) => n.oportunidade_id === op.id),
        data_fechamento: op.data_fechamento || op.previsao_fechamento,
        data_medicao: op.data_medicao,
        prazo_executivo: op.prazo_executivo,
        data_assinatura_executivo: op.data_assinatura_executivo,
      }))
      .filter((op) =>
        op.nucleos.some((n) => n.nucleo === NUCLEO)
      );

    setOportunidades(oportunidadesComDados as Oportunidade[]);
    setLoading(false);
  }

  useEffect(() => {
    carregarOportunidades();
  }, []);

  async function atualizarEstagio(id: string, novoEstagio: Estagio) {
    // AtualizaçÍo otimista
    setOportunidades((prev) =>
      prev.map((op) =>
        op.id === id ? { ...op, estagio: novoEstagio } : op
      )
    );

    // Registrar no histórico
    const oportAnterior = oportunidades.find((op) => op.id === id);
    if (oportAnterior && oportAnterior.estagio !== novoEstagio) {
      await supabase.from("oportunidades_historico").insert({
        oportunidade_id: id,
        estagio_anterior: oportAnterior.estagio,
        estagio_novo: novoEstagio,
        observacao: `Movido via Kanban - ${NUCLEO}`,
      });
    }

    const { error } = await supabase
      .from("oportunidades")
      .update({ estagio: novoEstagio })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar estágio", error);
      carregarOportunidades();
    }

    // Se chegou em Fechamento, criar contrato automaticamente
    if (novoEstagio === "Fechamento" && oportAnterior) {
      await criarContratosAutomaticamente(oportAnterior);
    }
  }

  // Criar contratos automaticamente quando oportunidade é fechada
  async function criarContratosAutomaticamente(oportunidade: Oportunidade) {
    try {
      // Buscar núcleos da oportunidade
      const nucleos = oportunidade.nucleos || [];

      // Filtrar apenas o núcleo atual (Marcenaria)
      const nucleosParaCriar = nucleos.filter(n => n.nucleo === NUCLEO);

      if (nucleosParaCriar.length === 0) {
        if (import.meta.env.DEV) console.log(`Oportunidade sem núcleo ${NUCLEO}, nÍo será criado contrato`);
        return;
      }

      // Buscar dados completos da oportunidade incluindo cliente_id
      const { data: oportCompleta } = await supabase
        .from("oportunidades")
        .select("cliente_id, valor_estimado")
        .eq("id", oportunidade.id)
        .single();

      if (!oportCompleta?.cliente_id) {
        console.error("Oportunidade sem cliente definido");
        return;
      }

      // Criar contrato para o núcleo Marcenaria
      for (const nucleo of nucleosParaCriar) {
        // Verificar se já existe contrato para esta oportunidade + núcleo
        const { data: contratoExistente } = await supabase
          .from("contratos")
          .select("id")
          .eq("oportunidade_id", oportunidade.id)
          .eq("unidade_negocio", nucleo.nucleo.toLowerCase())
          .limit(1)
          .maybeSingle();

        if (contratoExistente) {
          if (import.meta.env.DEV) console.log(`ℹ️ Contrato já existe para ${nucleo.nucleo}, pulando...`);
          continue;
        }

        const contratoData = {
          oportunidade_id: oportunidade.id,
          cliente_id: oportCompleta.cliente_id,
          titulo: oportunidade.titulo,
          descricao: oportunidade.descricao || "",
          tipo_contrato: nucleo.nucleo.toLowerCase(),
          unidade_negocio: nucleo.nucleo.toLowerCase() as "arquitetura" | "engenharia" | "marcenaria",
          valor_total: nucleo.valor || oportCompleta.valor_estimado || 0,
          status: "aguardando_assinatura",
          data_inicio: new Date().toISOString().split('T')[0],
        };

        if (import.meta.env.DEV) console.log(`📝 Criando contrato para ${nucleo.nucleo}:`, contratoData);

        const { data: novoContrato, error: contratoError } = await supabase
          .from("contratos")
          .insert(contratoData)
          .select()
          .single();

        if (contratoError) {
          console.error(`❌ Erro ao criar contrato para ${nucleo.nucleo}:`, {
            code: contratoError.code,
            message: contratoError.message,
            details: contratoError.details,
            hint: contratoError.hint,
            contratoData,
          });
        } else {
          if (import.meta.env.DEV) console.log(`✅ Contrato criado automaticamente para ${nucleo.nucleo}:`, novoContrato?.numero || novoContrato?.id);
        }
      }
    } catch (error) {
      console.error("Erro ao criar contratos automaticamente:", error);
    }
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const origem = source.droppableId as Estagio;
    const destino = destination.droppableId as Estagio;

    if (origem === destino) return;

    atualizarEstagio(draggableId, destino);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: CORES.primary }}
          ></div>
          <p className="text-[16px] text-gray-600">Carregando oportunidades de {NUCLEO}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <div className={LAYOUT.pageHeader}>
        <div>
          <h1
            className={TYPOGRAPHY.pageTitle}
            style={{ color: "#8B5E3C" }}
          >
            Pipeline de Oportunidades - {NUCLEO}
          </h1>
          <p className={`${TYPOGRAPHY.pageSubtitle} mt-1`}>
            Arraste os cards para alterar o estagio
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/oportunidades/kanban/arquitetura")}
            className="px-3 sm:px-4 py-2 rounded-lg text-[14px] font-medium transition-all shadow-sm hover:shadow-md border border-[#F25C26] text-[#F25C26] bg-white hover:bg-[#FFF4EE]"
          >
            Arquitetura
          </button>
          <button
            onClick={() => navigate("/oportunidades/kanban/engenharia")}
            className="px-3 sm:px-4 py-2 rounded-lg text-[14px] font-medium transition-all shadow-sm hover:shadow-md border border-[#F25C26] text-[#F25C26] bg-white hover:bg-[#FFF4EE]"
          >
            Engenharia
          </button>
          <button
            onClick={() => navigate("/oportunidades/kanban/marcenaria")}
            className="px-3 sm:px-4 py-2 rounded-lg text-[14px] font-medium transition-all shadow-sm hover:shadow-md border border-[#F25C26] bg-[#F25C26] text-white"
          >
            Marcenaria
          </button>
          <button
            onClick={() => (window.location.href = "/oportunidades/novo")}
            className="px-4 py-2 bg-[#F25C26] text-white rounded-lg text-[14px] hover:bg-[#DD4F1D] transition-all shadow-sm hover:shadow-md"
          >
            + Nova Oportunidade
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4">
          {ESTAGIOS.map((estagio) => {
            const col = oportunidades.filter((op) => op.estagio === estagio);

            return (
              <Droppable droppableId={estagio} key={estagio}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-[#F9F9F9] border rounded-xl p-3 sm:p-4 flex flex-col transition-all min-h-[500px] flex-1 min-w-[220px] ${
                      snapshot.isDraggingOver
                        ? "bg-white shadow-lg"
                        : "border-[#E5E5E5]"
                    }`}
                    style={
                      snapshot.isDraggingOver
                        ? { borderColor: CORES.border }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                      <h2 className={TYPOGRAPHY.sectionTitle + " uppercase tracking-wide"}>
                        {estagio}
                      </h2>
                      <span
                        className={TYPOGRAPHY.badge + " text-white"}
                        style={{ backgroundColor: "#8B5E3C" }}
                      >
                        {col.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                      {col.map((op, idx) => (
                        <Draggable key={op.id} draggableId={op.id} index={idx}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={snap.isDragging ? "ring-2 ring-[#C9A86A] shadow-2xl rounded-xl" : ""}
                              style={prov.draggableProps.style}
                            >
                              <OportunidadeCard
                                mode="kanban"
                                nucleo="marcenaria"
                                oportunidade={{
                                  ...(op as OportunidadeUI),
                                }}
                                onClick={() => setSelecionada(op)}
                                onEdit={() => navigate(`/oportunidades/editar/${op.id}`)}
                                onDelete={async () => {
                                  if (confirm("Deseja realmente excluir a oportunidade?")) {
                                    await supabase.from("oportunidades").delete().eq("id", op.id);
                                    carregarOportunidades();
                                  }
                                }}
                                onPdf={undefined}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}

                      {col.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">
                          Nenhuma oportunidade
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {selecionada && (
        <OportunidadeModal
          oportunidade={selecionada}
          onClose={() => setSelecionada(null)}
          onUpdated={carregarOportunidades}
          onChangeStage={atualizarEstagio}
        />
      )}
    </div>
  );
}


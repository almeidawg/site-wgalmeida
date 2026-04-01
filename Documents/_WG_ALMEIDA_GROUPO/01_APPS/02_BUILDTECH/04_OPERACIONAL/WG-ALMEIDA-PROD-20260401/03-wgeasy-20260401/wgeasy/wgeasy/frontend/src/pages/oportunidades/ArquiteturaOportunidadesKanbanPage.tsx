import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { OportunidadeModal } from "@/components/oportunidades/OportunidadeModal";
import {
  ESTAGIOS,
  type Estagio,
  type Nucleo,
} from "@/constants/oportunidades";
import OportunidadeCard, {
  OportunidadeClienteUI,
  OportunidadeUI,
} from "@/components/oportunidades/OportunidadeCard";
import { gerarPdfOportunidade } from "@/utils/gerarPdfOportunidade";
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
  cliente?: OportunidadeClienteUI | null;
  nucleos?: Array<{ nucleo: Nucleo; valor: number | null }>;
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
  data_inicio_projeto?: string | null;
  prazo_briefing?: string | null;
  prazo_anteprojeto?: string | null;
  prazo_projeto_executivo?: string | null;
  data_liberacao_obra?: string | null;
  data_inicio_obra?: string | null;
  data_medicao?: string | null;
  prazo_executivo?: string | null;
  data_assinatura_executivo?: string | null;
};

type ClienteRow = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  unidade: string | null;
  avatar_url: string | null;
  foto_url: string | null;
};

type NucleoRow = {
  oportunidade_id: string;
  nucleo: Nucleo;
  valor: number | null;
};

export default function OportunidadesKanbanPage() {
  const navigate = useNavigate();
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<Oportunidade | null>(null);

  async function carregarOportunidades() {
    setLoading(true);

    // 1) Oportunidades
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

    // 2) Clientes completos
    const clienteIds = oportData
      .map((op) => op.cliente_id)
      .filter((id): id is string => Boolean(id));

    let clientesMap: Record<string, OportunidadeClienteUI> = {};

    if (clienteIds.length > 0) {
      const { data: clientesRaw } = await supabase
        .from("pessoas")
        .select(
          "id, nome, email, telefone, cargo, unidade, avatar_url, foto_url"
        )
        .in("id", clienteIds);

      const clientesData = (clientesRaw || []) as ClienteRow[];

      if (clientesData.length > 0) {
        clientesMap = clientesData.reduce(
          (acc: Record<string, OportunidadeClienteUI>, cli) => {
            acc[cli.id] = {
              id: cli.id,
              nome: cli.nome || "Cliente sem nome",
              email: cli.email,
              telefone: cli.telefone,
              cargo: cli.cargo,
              unidade: cli.unidade,
              avatar_url: cli.avatar_url,
              foto_url: cli.foto_url,
            };
            return acc;
          },
          {}
        );
      }
    }

    // 3) Núcleos
    const { data: nucleosRaw } = await supabase
      .from("oportunidades_nucleos")
      .select("oportunidade_id, nucleo, valor");

    const nucleosData = (nucleosRaw || []) as NucleoRow[];

    // 4) Combinar tudo
    const oportunidadesComDados = oportData.map((op) => ({
      id: op.id,
      titulo: op.titulo,
      estagio: op.estagio as Estagio,
      valor_estimado: op.valor_estimado,
      previsao_fechamento: op.previsao_fechamento,
      origem: op.origem,
      descricao: op.descricao,
      observacoes: op.observacoes,
      cliente: op.cliente_id ? clientesMap[op.cliente_id] || null : null,
      nucleos: nucleosData.filter((n) => n.oportunidade_id === op.id),
      data_fechamento: op.data_fechamento || op.previsao_fechamento,
      data_inicio_projeto: op.data_inicio_projeto,
      prazo_briefing: op.prazo_briefing,
      prazo_anteprojeto: op.prazo_anteprojeto,
      prazo_projeto_executivo: op.prazo_projeto_executivo,
      data_liberacao_obra: op.data_liberacao_obra,
      data_inicio_obra: op.data_inicio_obra,
      data_medicao: op.data_medicao,
      prazo_executivo: op.prazo_executivo,
      data_assinatura_executivo: op.data_assinatura_executivo,
    }));

    setOportunidades(oportunidadesComDados as Oportunidade[]);
    setLoading(false);
  }

  useEffect(() => {
    carregarOportunidades();
  }, []);

  async function atualizarEstagio(id: string, novoEstagio: Estagio) {
    setOportunidades((prev) =>
      prev.map((op) => (op.id === id ? { ...op, estagio: novoEstagio } : op))
    );

    const oportAnterior = oportunidades.find((op) => op.id === id);

    if (oportAnterior && oportAnterior.estagio !== novoEstagio) {
      await supabase.from("oportunidades_historico").insert({
        oportunidade_id: id,
        estagio_anterior: oportAnterior.estagio,
        estagio_novo: novoEstagio,
        observacao: `Movido via Kanban`,
      });
    }

    const { error } = await supabase
      .from("oportunidades")
      .update({ estagio: novoEstagio })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar estágio", error);
      carregarOportunidades();
      return;
    }

    if (novoEstagio === "Fechamento" && oportAnterior) {
      await criarContratosAutomaticamente(oportAnterior);
    }
  }

  async function criarContratosAutomaticamente(oportunidade: Oportunidade) {
    try {
      const nucleos = oportunidade.nucleos || [];

      if (nucleos.length === 0) {
        if (import.meta.env.DEV) console.log(
          "Oportunidade sem núcleos definidos, nÍo será criado contrato"
        );
        return;
      }

      const { data: oportCompleta } = await supabase
        .from("oportunidades")
        .select("cliente_id, valor_estimado, descricao, titulo")
        .eq("id", oportunidade.id)
        .single();

      if (!oportCompleta || !oportCompleta.cliente_id) {
        console.error("Oportunidade sem cliente definido");
        return;
      }

      for (const nucleo of nucleos) {
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
          titulo: oportCompleta.titulo,
          descricao: oportCompleta.descricao || "",
          tipo_contrato: nucleo.nucleo.toLowerCase(),
          unidade_negocio:
            nucleo.nucleo.toLowerCase() as "arquitetura" | "engenharia" | "marcenaria",
          valor_total: nucleo.valor || oportCompleta.valor_estimado || 0,
          status: "aguardando_assinatura",
          data_inicio: new Date().toISOString().split("T")[0],
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
          if (import.meta.env.DEV) console.log(
            `✅ Contrato criado automaticamente para ${nucleo.nucleo}:`,
            novoContrato?.numero || novoContrato?.id
          );
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A1A] mx-auto mb-4"></div>
          <p className="text-[16px] text-gray-600">Carregando oportunidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <div className={LAYOUT.pageHeader}>
        <div>
          <h1 className={`${TYPOGRAPHY.pageTitle} text-[#5E9B94]`}>
            Pipeline de Oportunidades - Arquitetura
          </h1>
          <p className={`${TYPOGRAPHY.pageSubtitle} mt-1`}>
            Arraste os cards para alterar o estagio
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/oportunidades/kanban/arquitetura")}
            className="px-3 sm:px-4 py-2 rounded-lg text-[14px] font-medium transition-all shadow-sm hover:shadow-md border border-[#F25C26] bg-[#F25C26] text-white"
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
            className="px-3 sm:px-4 py-2 rounded-lg text-[14px] font-medium transition-all shadow-sm hover:shadow-md border border-[#F25C26] text-[#F25C26] bg-white hover:bg-[#FFF4EE]"
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
                        ? "bg-white border-[#C9A86A] shadow-lg"
                        : "border-[#E5E5E5]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                      <h2 className={TYPOGRAPHY.sectionTitle + " uppercase tracking-wide"}>
                        {estagio}
                      </h2>
                      <span className={TYPOGRAPHY.badge + " bg-[#5E9B94] text-white"}>
                        {col.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                      {col.map((op, idx) => (
                        <Draggable
                          key={op.id}
                          draggableId={op.id}
                          index={idx}
                        >
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`${
                                snap.isDragging
                                  ? "ring-2 ring-[#C9A86A] shadow-2xl rounded-xl"
                                  : ""
                              }`}
                            >
                              <OportunidadeCard
                                mode="kanban"
                                oportunidade={{
                                  ...op,
                                } as OportunidadeUI}
                                nucleo="arquitetura"
                                onClick={() => setSelecionada(op)}
                                onEdit={() =>
                                  navigate(`/oportunidades/editar/${op.id}`)
                                }
                                onDelete={async () => {
                                  if (
                                    confirm("Deseja realmente excluir a oportunidade?")
                                  ) {
                                    await supabase
                                      .from("oportunidades")
                                      .delete()
                                      .eq("id", op.id);
                                    carregarOportunidades();
                                  }
                                }}
                                onPdf={async () => {
                                  const clientePdf = op.cliente
                                    ? {
                                        nome: op.cliente.nome,
                                        email: op.cliente.email ?? undefined,
                                        telefone: op.cliente.telefone ?? undefined,
                                        cargo: op.cliente.cargo ?? undefined,
                                        unidade: op.cliente.unidade ?? undefined,
                                        avatar_url: op.cliente.avatar_url ?? undefined,
                                        foto_url: op.cliente.foto_url ?? undefined,
                                      }
                                    : { nome: "Cliente" };

                                  await gerarPdfOportunidade({
                                    oportunidade: {
                                      id: op.id,
                                      titulo: op.titulo,
                                      estagio: op.estagio,
                                      origem: op.origem ?? undefined,
                                      valor_estimado: op.valor_estimado ?? undefined,
                                      previsao_fechamento: op.previsao_fechamento ?? undefined,
                                      descricao: op.descricao ?? undefined,
                                      observacoes: op.observacoes ?? undefined,
                                      nucleos: op.nucleos?.map((n) => ({
                                        nucleo: n.nucleo,
                                        valor: n.valor ?? undefined,
                                      })),
                                    },
                                    cliente: clientePdf,
                                  });
                                }}
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


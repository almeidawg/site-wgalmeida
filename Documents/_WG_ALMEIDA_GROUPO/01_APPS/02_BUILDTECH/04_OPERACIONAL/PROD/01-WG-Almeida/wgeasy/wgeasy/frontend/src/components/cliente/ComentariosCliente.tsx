// src/components/cliente/ComentariosCliente.tsx
// Quadro de comentarios do cliente que viram itens de checklist
// Os comentarios aparecem nos cards da equipe interna

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Reply
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import MentionInput, { extrairMencoesDoTexto } from "@/components/common/MentionInput";
import { formatarData } from "@/lib/utils";

// Tipos
interface ComentarioCliente {
  id: string;
  cliente_id: string;
  contrato_id?: string;
  projeto_id?: string;
  texto: string;
  status: "pendente" | "em_andamento" | "concluido" | "arquivado";
  nucleo?: "arquitetura" | "engenharia" | "marcenaria" | "geral";
  prioridade?: "baixa" | "normal" | "alta" | "urgente";
  resposta_equipe?: string;
  respondido_por?: string;
  respondido_em?: string;
  criado_em: string;
  atualizado_em?: string;
}

interface Props {
  clienteId: string;
  contratoId?: string;
  projetoId?: string;
  podeComentarem?: boolean;
}

const STATUS_CONFIG = {
  pendente: { icon: Circle, color: "text-gray-400", bg: "bg-gray-100", label: "Pendente" },
  em_andamento: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", label: "Em andamento" },
  concluido: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", label: "Concluido" },
  arquivado: { icon: AlertCircle, color: "text-gray-400", bg: "bg-gray-50", label: "Arquivado" },
};

export default function ComentariosCliente({
  clienteId,
  contratoId,
  projetoId,
  podeComentarem = true
}: Props) {
  const { toast } = useToast();
  const [comentarios, setComentarios] = useState<ComentarioCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoComentario, setNovoComentario] = useState("");
  const nucleoSelecionado = "geral";
  const [enviando, setEnviando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const carregarComentarios = useCallback(async () => {
    try {
      type SolicitacaoRow = {
        id: string;
        pessoa_id: string;
        contrato_id?: string | null;
        projeto_id?: string | null;
        mensagem?: string | null;
        status?: string | null;
        nucleo?: string | null;
        prioridade?: string | null;
        resposta?: string | null;
        respondido_por?: string | null;
        respondido_em?: string | null;
        created_at: string;
        updated_at?: string | null;
      };
      // Buscar da tabela solicitacoes_cliente
      let query = supabase
        .from("solicitacoes_cliente")
        .select("*")
        .eq("pessoa_id", clienteId)
        .order("created_at", { ascending: false });

      if (contratoId) {
        query = query.eq("contrato_id", contratoId);
      }

      const { data, error } = await query;

      if (error) {
        // Se a tabela não existe, mostrar lista vazia sem erro
        if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log("Tabela solicitacoes_cliente não encontrada - execute a migration");
          setComentarios([]);
          return;
        }
        throw error;
      }

      // Mapear campos da tabela para o formato esperado
      const comentariosMapeados = (data || []).map((item: SolicitacaoRow) => ({
        id: item.id,
        cliente_id: item.pessoa_id,
        contrato_id: item.contrato_id || undefined,
        texto: item.mensagem || '',
        status: (["pendente", "em_andamento", "concluido", "arquivado"].includes(String(item.status))
          ? (item.status as "pendente" | "em_andamento" | "concluido" | "arquivado")
          : "pendente"),
        nucleo: (["arquitetura", "engenharia", "marcenaria", "geral"].includes(String(item.nucleo))
          ? (item.nucleo as "arquitetura" | "engenharia" | "marcenaria" | "geral")
          : "geral"),
        prioridade: (["baixa", "normal", "alta", "urgente"].includes(String(item.prioridade))
          ? (item.prioridade as "baixa" | "normal" | "alta" | "urgente")
          : "normal"),
        resposta_equipe: item.resposta || undefined,
        respondido_por: item.respondido_por || undefined,
        respondido_em: item.respondido_em || undefined,
        criado_em: item.created_at,
        atualizado_em: item.updated_at || undefined,
      }));

      setComentarios(comentariosMapeados);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Erro ao carregar comentarios:", errorMessage);
      setComentarios([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId, contratoId]);

  // Carregar comentarios
  useEffect(() => {
    carregarComentarios();

    // Subscrever a mudancas em tempo real
    const channel = supabase
      .channel('solicitacoes_cliente_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes_cliente',
          filter: `pessoa_id=eq.${clienteId}`
        },
        () => {
          carregarComentarios();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [carregarComentarios, clienteId]);

  const enviarComentario = async () => {
    if (!novoComentario.trim()) return;

    setEnviando(true);
    try {
      // Inserir solicitaçÍo na tabela solicitacoes_cliente
      const { data: comentarioData, error } = await supabase
        .from("solicitacoes_cliente")
        .insert({
          pessoa_id: clienteId,
          contrato_id: contratoId || null,
          projeto_id: projetoId || null,
          mensagem: novoComentario.trim(),
          nucleo: nucleoSelecionado,
          status: "pendente",
          prioridade: "normal",
          referencia_tipo: contratoId ? 'contrato' : (projetoId ? 'projeto' : 'cliente'),
          referencia_id: contratoId || projetoId || clienteId
        })
        .select()
        .single();

      if (error) {
        // Se a tabela não existe, informar ao usuário
        if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('does not exist')) {
          toast({
            title: "Funcionalidade em configuraçÍo",
            description: "O sistema de solicitações está sendo configurado. Execute a migration no banco de dados.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Buscar nome do cliente para a notificaçÍo
      const { data: clienteData } = await supabase
        .from("pessoas")
        .select("nome")
        .eq("id", clienteId)
        .single();

      const nomeCliente = clienteData?.nome || "Cliente";
      const nucleoLabel = nucleoSelecionado.charAt(0).toUpperCase() + nucleoSelecionado.slice(1);

      // Criar notificaçÍo para admins sobre nova postagem do cliente
      await supabase.from("notificacoes_sistema").insert({
        tipo: "comentario_cliente",
        titulo: `Nova mensagem de ${nomeCliente}`,
        mensagem: `[${nucleoLabel}] ${novoComentario.trim().substring(0, 100)}${novoComentario.trim().length > 100 ? "..." : ""}`,
        referencia_tipo: "comentario_cliente",
        referencia_id: comentarioData?.id || null,
        para_todos_admins: true,
        url_acao: contratoId ? `/sistema/contratos/${contratoId}` : `/sistema/clientes/${clienteId}`,
        texto_acao: "Ver mensagem"
      });

      const mencoes = new Set<string>(extrairMencoesDoTexto(novoComentario));
      if (mencoes.size > 0) {
        await criarNotificacoesDeMencao(mencoes, comentarioData?.id || null);
      }

      setNovoComentario("");
      toast({
        title: "Comentario enviado!",
        description: "A equipe WG Almeida recebeu sua mensagem.",
      });
      carregarComentarios();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Erro ao enviar comentario:", errorMessage);
      toast({
        title: "Erro ao enviar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  // Filtrar comentarios
  const comentariosFiltrados = comentarios.filter(c => {
    if (filtroStatus === "todos") return c.status !== "arquivado";
    return c.status === filtroStatus;
  });

  // Agrupar por status
  const pendentes = comentarios.filter(c => c.status === "pendente").length;
  const emAndamento = comentarios.filter(c => c.status === "em_andamento").length;
  const concluidos = comentarios.filter(c => c.status === "concluido").length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  const criarNotificacoesDeMencao = async (
    mencoes: Set<string>,
    comentarioId: string | null
  ) => {
    try {
      if (mencoes.size === 0) return;

      const ids = Array.from(mencoes);

      const { data: usuariosData } = await supabase
        .from("usuarios")
        .select(`
          id,
          pessoa_id,
          pessoas:pessoa_id (
            id,
            nome
          )
        `)
        .in("id", ids)
        .eq("ativo", true);

      const destinatarios: Array<{ pessoaId: string; nome: string }> = [];
      const encontrados = new Set<string>();

      usuariosData?.forEach((usuario) => {
        const pessoa = Array.isArray(usuario.pessoas) ? usuario.pessoas[0] : usuario.pessoas;
        if (usuario?.pessoa_id) {
          destinatarios.push({
            pessoaId: usuario.pessoa_id,
            nome: pessoa?.nome || usuario.pessoa_id,
          });
          encontrados.add(usuario.id);
        }
      });

      const restantes = ids.filter((id) => !encontrados.has(id));
      if (restantes.length > 0) {
        const { data: pessoasData } = await supabase
          .from("pessoas")
          .select("id, nome")
          .in("id", restantes)
          .eq("ativo", true);

        pessoasData?.forEach((pessoa) => {
          destinatarios.push({
            pessoaId: pessoa.id,
            nome: pessoa.nome || pessoa.id,
          });
        });
      }

      if (destinatarios.length === 0) return;

      const { data: clienteData } = await supabase
        .from("pessoas")
        .select("nome")
        .eq("id", clienteId)
        .single();

      const autorNome = clienteData?.nome || "Cliente";

      await Promise.all(
        destinatarios.map((target) =>
          supabase.from("notificacoes_sistema").insert({
            tipo: "comentario_cliente",
            titulo: `${autorNome} mencionou você`,
            mensagem: "Nova solicitaçÍo no Comentários do Cliente",
            referencia_tipo: "comentario_cliente",
            referencia_id: comentarioId,
            para_todos_admins: false,
            pessoa_id: target.pessoaId,
            url_acao: contratoId ? `/sistema/contratos/${contratoId}` : `/sistema/clientes/${clienteId}`,
            texto_acao: "Ver mensagem",
          })
        )
      );
    } catch (error) {
      console.error("Erro ao criar notificações de mençÍo:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-wg-primary to-[#5E9B94] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-normal text-white">Seus Comentarios</h2>
              <p className="text-white/80 text-xs">Envie solicitacoes e acompanhe o status</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-2.5 py-1 bg-white/20 rounded-full text-xs text-white flex items-center gap-1">
              <Circle className="w-3 h-3" />
              {pendentes}
            </div>
            <div className="px-2.5 py-1 bg-amber-400/30 rounded-full text-xs text-white flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {emAndamento}
            </div>
            <div className="px-2.5 py-1 bg-green-400/30 rounded-full text-xs text-white flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {concluidos}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de novo comentario */}
      {podeComentarem && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            <div className="flex-1">
              <MentionInput
                value={novoComentario}
                onChange={setNovoComentario}
                placeholder="Digite sua solicitacao, duvida ou sugestao... (use @ para mencionar)"
                rows={2}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wg-primary focus:border-transparent resize-none text-sm"
                disabled={enviando}
                onlyColaboradores
              />
            </div>
            <button
              onClick={enviarComentario}
              disabled={!novoComentario.trim() || enviando}
              className="px-4 bg-wg-primary text-white rounded-lg font-medium hover:bg-wg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {enviando ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="p-3 border-b border-gray-100 flex gap-2">
        {[
          { value: "todos", label: "Todos" },
          { value: "pendente", label: "Pendentes" },
          { value: "em_andamento", label: "Em andamento" },
          { value: "concluido", label: "Concluidos" },
        ].map(filtro => (
          <button
            key={filtro.value}
            onClick={() => setFiltroStatus(filtro.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filtroStatus === filtro.value
                ? "bg-wg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {/* Lista de comentarios */}
      <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {comentariosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum comentario encontrado</p>
              <p className="text-xs mt-1">Envie sua primeira solicitacao acima</p>
            </div>
          ) : (
            comentariosFiltrados.map((comentario) => {
              const statusConfig = STATUS_CONFIG[comentario.status];
              const StatusIcon = statusConfig.icon;
              return (
                <motion.div
                  key={comentario.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex gap-3">
                    {/* Icone de Status */}
                    <div className={`w-8 h-8 rounded-full ${statusConfig.bg} flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header do comentario */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatarData(comentario.criado_em, "medio")}
                        </span>
                      </div>

                      {/* Texto do comentario */}
                      <p className="text-sm text-gray-700 mb-2">{comentario.texto}</p>

                      {/* Resposta da equipe */}
                      {comentario.resposta_equipe && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Reply className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">
                              Resposta da Equipe WG
                            </span>
                            {comentario.respondido_em && (
                              <span className="text-[10px] text-blue-500">
                                {formatarData(comentario.respondido_em, "curto")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-800">{comentario.resposta_equipe}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}



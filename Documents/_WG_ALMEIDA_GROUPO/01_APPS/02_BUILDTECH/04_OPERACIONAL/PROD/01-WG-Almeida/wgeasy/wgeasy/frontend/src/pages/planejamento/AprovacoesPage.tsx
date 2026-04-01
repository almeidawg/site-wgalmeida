/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ==========================================
// APROVAÇÕES
// Sistema WG Easy - Grupo WG Almeida
// Central de aprovações de orçamentos, compras e solicitações
// ==========================================

import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { formatarMoeda, formatarData } from "@/lib/utils";
import EnviarParaClienteModal from "./components/EnviarParaClienteModal";
import Avatar from "@/components/common/Avatar";

interface ItemPendente {
  id: string;
  tipo: "orcamento" | "compra" | "solicitacao" | "solicitacao_material" | "proposta";
  titulo: string;
  descricao?: string;
  valor: number;
  data_criacao: string;
  solicitante?: string;
  cliente?: string;
  cliente_avatar_url?: string;
  cliente_foto_url?: string;
  cliente_avatar?: string;
  status: string;
  urgencia: "baixa" | "media" | "alta";
  itens_count?: number; // para pedidos de materiais
}

interface EstatisticasAprovacao {
  total_pendentes: number;
  propostas_pendentes: number;
  orcamentos_pendentes: number;
  compras_pendentes: number;
  solicitacoes_pendentes: number;
  materiais_pendentes: number;
  propostas_aprovadas: number;
  valor_vendidos: number;
  valor_em_negociacao: number;
  valor_total_pendente: number;
}

function isPropostaPendente(item: ItemPendente): boolean {
  return item.tipo === "proposta" && item.status === "enviada";
}

function isPendente(item: ItemPendente): boolean {
  if (item.tipo === "proposta") return isPropostaPendente(item);
  return true;
}

export default function AprovacoesPage() {
  const [itens, setItens] = useState<ItemPendente[]>([]);
  const { toast } = useToast();
  const [estatisticas, setEstatisticas] = useState<EstatisticasAprovacao>({
    total_pendentes: 0,
    propostas_pendentes: 0,
    orcamentos_pendentes: 0,
    compras_pendentes: 0,
    solicitacoes_pendentes: 0,
    materiais_pendentes: 0,
    propostas_aprovadas: 0,
    valor_vendidos: 0,
    valor_em_negociacao: 0,
    valor_total_pendente: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>("todos");
  const [clientesExpandidos, setClientesExpandidos] = useState<Set<string>>(new Set());

  // Estados do modal de envio para cliente
  const [modalEnviarAberto, setModalEnviarAberto] = useState(false);
  const [itemParaEnviar, setItemParaEnviar] = useState<ItemPendente | null>(null);

  useEffect(() => {
    carregarPendentes();
  }, []);

  async function carregarPendentes() {
    try {
      setLoading(true);
      const itensPendentes: ItemPendente[] = [];

      // Buscar orçamentos pendentes (status=enviado) sem join (evita erro de FK)
      const { data: orcamentos, error: errOrc } = await supabase
        .from("orcamentos")
        .select("id, titulo, valor_total, criado_em, cliente_id, status")
        .eq("status", "enviado")
        .order("criado_em", { ascending: false })
        .limit(50);

      if (!errOrc && orcamentos && orcamentos.length > 0) {
        // Buscar nomes dos clientes separadamente
        const clienteIds = [...new Set(orcamentos.map(o => o.cliente_id).filter(Boolean))];
        let clientesMap: Record<string, { nome: string; avatar_url?: string; foto_url?: string; avatar?: string }> = {};
        if (clienteIds.length > 0) {
          const { data: clientes } = await supabase
            .from("pessoas")
            .select("id, nome, avatar_url, foto_url, avatar")
            .in("id", clienteIds);
          if (clientes) {
            clientesMap = Object.fromEntries(
              clientes.map(c => [c.id, {
                nome: c.nome || "Cliente",
                avatar_url: c.avatar_url || undefined,
                foto_url: c.foto_url || undefined,
                avatar: c.avatar || undefined,
              }])
            );
          }
        }

        orcamentos.forEach((orc: any) => {
          const clienteInfo = orc.cliente_id ? clientesMap[orc.cliente_id] : null;
          const clienteNome = clienteInfo?.nome || undefined;
          itensPendentes.push({
            id: orc.id,
            tipo: "orcamento",
            titulo: orc.titulo || "Orçamento sem título",
            descricao: `Cliente: ${clienteNome || "NÍo informado"}`,
            valor: orc.valor_total || 0,
            data_criacao: orc.criado_em,
            cliente: clienteNome,
            cliente_avatar_url: clienteInfo?.avatar_url,
            cliente_foto_url: clienteInfo?.foto_url,
            cliente_avatar: clienteInfo?.avatar,
            status: "pendente",
            urgencia: "media",
          });
        });
      }

      // Buscar pedidos de compra pendentes (query simples, sem join)
      try {
        const { data: compras } = await supabase
          .from("pedidos_compra")
          .select("id, numero, descricao, valor_total, data_pedido, status, fornecedor_id")
          .eq("status", "pendente")
          .order("data_pedido", { ascending: false })
          .limit(50);

        if (compras && compras.length > 0) {
          compras.forEach((comp: any) => {
            itensPendentes.push({
              id: comp.id,
              tipo: "compra",
              titulo: `Pedido #${comp.numero || comp.id.slice(0, 8)}`,
              descricao: comp.descricao || "Pedido de compra",
              valor: comp.valor_total || 0,
              data_criacao: comp.data_pedido,
              status: comp.status,
              urgencia: "alta",
            });
          });
        }
      } catch (e) {
        if (import.meta.env.DEV) console.log("Tabela pedidos_compra nÍo disponível");
      }

      // Buscar solicitações de depósito pendentes (query simples)
      try {
        const { data: solicitacoes } = await supabase
          .from("financeiro_solicitacoes")
          .select("id, descricao, valor, created_at, status")
          .eq("status", "pendente")
          .order("created_at", { ascending: false })
          .limit(50);

        if (solicitacoes && solicitacoes.length > 0) {
          solicitacoes.forEach((sol: any) => {
            itensPendentes.push({
              id: sol.id,
              tipo: "solicitacao",
              titulo: sol.descricao || "SolicitaçÍo de Depósito",
              descricao: "SolicitaçÍo financeira pendente",
              valor: sol.valor || 0,
              data_criacao: sol.created_at,
              status: sol.status,
              urgencia: "baixa",
            });
          });
        }
      } catch (e) {
        if (import.meta.env.DEV) console.log("Tabela financeiro_solicitacoes nÍo disponível");
      }

      // Buscar projetos de compras pendentes (pedidos de materiais de obra)
      try {
        const { data: projetosCompras } = await supabase
          .from("projetos_compras")
          .select("id, codigo, nome, cliente_nome, endereco, status, created_at")
          .eq("status", "PENDENTE")
          .order("created_at", { ascending: false })
          .limit(50);

        if (projetosCompras && projetosCompras.length > 0) {
          // Buscar valor total de cada projeto
          for (const proj of projetosCompras) {
            const { data: itensProj } = await supabase
              .from("projeto_lista_compras")
              .select("valor_total")
              .eq("projeto_id", proj.id);

            const valorTotal = itensProj?.reduce((acc, i) => acc + (i.valor_total || 0), 0) || 0;
            const totalItens = itensProj?.length || 0;

            itensPendentes.push({
              id: proj.id,
              tipo: "compra",
              titulo: `${proj.codigo} - ${proj.nome}`,
              descricao: `${proj.cliente_nome}${proj.endereco ? ` | ${proj.endereco}` : ""} (${totalItens} itens)`,
              valor: valorTotal,
              data_criacao: proj.created_at,
              cliente: proj.cliente_nome,
              status: "pendente",
              urgencia: "alta",
            });
          }
        }
      } catch (e) {
        if (import.meta.env.DEV) console.log("Tabela projetos_compras nÍo disponível");
      }

      // Buscar itens de lista de compras pendentes de aprovaçÍo (itens individuais)
      try {
        const { data: listaCompras } = await supabase
          .from("projeto_lista_compras")
          .select("id, codigo, descricao, valor_total, created_at, status, projeto_id")
          .eq("status", "PENDENTE")
          .is("projeto_id", null) // Apenas itens órfÍos (sem projeto vinculado)
          .order("created_at", { ascending: false })
          .limit(50);

        if (listaCompras && listaCompras.length > 0) {
          listaCompras.forEach((item: any) => {
            itensPendentes.push({
              id: item.id,
              tipo: "compra",
              titulo: `Material #${item.codigo || item.id.slice(0, 8)}`,
              descricao: item.descricao || "Item de material",
              valor: item.valor_total || 0,
              data_criacao: item.created_at,
              status: item.status?.toLowerCase() || "pendente",
              urgencia: "media",
            });
          });
        }
      } catch (e) {
        if (import.meta.env.DEV) console.log("Tabela projeto_lista_compras nÍo disponível");
      }

      // Buscar pedidos de materiais do colaborador (tabela pedidos_materiais)
      try {
        const { data: pedidosMateriais } = await supabase
          .from("pedidos_materiais")
          .select("id, descricao, itens, prioridade, created_at, status, projeto_id, criado_por")
          .eq("status", "enviado")
          .order("created_at", { ascending: false })
          .limit(50);

        if (pedidosMateriais && pedidosMateriais.length > 0) {
          // Buscar dados de projetos/contratos para obter nomes de clientes
          const projetoIds = [...new Set(pedidosMateriais.map(p => p.projeto_id).filter(Boolean))];
          let projetosMap: Record<string, { numero: string; cliente_nome: string }> = {};

          if (projetoIds.length > 0) {
            const { data: contratos } = await supabase
              .from("contratos")
              .select("id, numero, cliente:pessoas!contratos_cliente_id_fkey(nome)")
              .in("id", projetoIds);

            if (contratos) {
              projetosMap = Object.fromEntries(
                contratos.map(c => [c.id, {
                  numero: c.numero || "",
                  cliente_nome: (c.cliente as any)?.nome || ""
                }])
              );
            }
          }

          pedidosMateriais.forEach((pm: any) => {
            const projetoInfo = pm.projeto_id ? projetosMap[pm.projeto_id] : null;
            const itensCount = Array.isArray(pm.itens) ? pm.itens.length : 0;

            itensPendentes.push({
              id: pm.id,
              tipo: "solicitacao_material",
              titulo: pm.descricao || "Pedido de Materiais",
              descricao: projetoInfo
                ? `${projetoInfo.cliente_nome} | ${itensCount} item(ns)`
                : `${itensCount} item(ns) solicitado(s)`,
              valor: 0, // Pedido de materiais ainda nÍo tem valor definido
              data_criacao: pm.created_at,
              cliente: projetoInfo?.cliente_nome,
              status: "pendente",
              urgencia: pm.prioridade === "urgente" ? "alta" : pm.prioridade === "baixa" ? "baixa" : "media",
              itens_count: itensCount,
            });
          });
        }
      } catch (e) {
        if (import.meta.env.DEV) console.log("Tabela pedidos_materiais nÍo disponível");
      }

      // Buscar propostas enviadas (aguardando aprovaçÍo do cliente)
      try {
        const { data: propostas } = await supabase
          .from("propostas")
          .select("id, numero, titulo, valor_total, criado_em, cliente_id, status, nucleo")
          .in("status", ["enviada", "aprovada"])
          .order("criado_em", { ascending: false })
          .limit(50);

        if (propostas && propostas.length > 0) {
          const clienteIdsP = [...new Set(propostas.map((p: any) => p.cliente_id).filter(Boolean))];
        let clientesMapP: Record<string, { nome: string; avatar_url?: string; foto_url?: string; avatar?: string }> = {};
        if (clienteIdsP.length > 0) {
          const { data: clientes } = await supabase
            .from("pessoas")
            .select("id, nome, avatar_url, foto_url, avatar")
            .in("id", clienteIdsP);
          if (clientes) {
            clientesMapP = Object.fromEntries(
              clientes.map((c: any) => [c.id, {
                nome: c.nome || "Cliente",
                avatar_url: c.avatar_url || undefined,
                foto_url: c.foto_url || undefined,
                avatar: c.avatar || undefined,
              }])
            );
          }
        }

        propostas.forEach((prop: any) => {
          const clienteInfo = prop.cliente_id ? clientesMapP[prop.cliente_id] : null;
          const clienteNome = clienteInfo?.nome || null;
          itensPendentes.push({
            id: prop.id,
            tipo: "proposta",
              titulo: prop.titulo || `Proposta ${prop.numero || ""}`,
              descricao: `Cliente: ${clienteNome || "NÍo informado"}${prop.nucleo ? ` · Núcleo: ${prop.nucleo}` : ""}`,
            valor: prop.valor_total || 0,
            data_criacao: prop.criado_em,
            cliente: clienteNome || undefined,
            cliente_avatar_url: clienteInfo?.avatar_url,
            cliente_foto_url: clienteInfo?.foto_url,
            cliente_avatar: clienteInfo?.avatar,
            status: prop.status || "enviada",
            urgencia: prop.status === "aprovada" ? "baixa" : "alta",
          });
          });
        }
      } catch (e) {
        if (import.meta.env.DEV) console.log("Tabela propostas nÍo disponível");
      }

      // Ordenar por data (mais recentes primeiro)
      itensPendentes.sort((a, b) =>
        new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
      );

      setItens(itensPendentes);

      // Calcular estatísticas
      const itensSomentePendentes = itensPendentes.filter(isPendente);
      const propostasAprovadas = itensPendentes.filter(
        (i) => i.tipo === "proposta" && i.status === "aprovada"
      );
      const valorEmNegociacao = itensSomentePendentes.reduce((sum, i) => sum + i.valor, 0);
      const valorVendidos = propostasAprovadas.reduce((sum, i) => sum + i.valor, 0);
      const stats: EstatisticasAprovacao = {
        total_pendentes: itensSomentePendentes.length,
        propostas_pendentes: itensSomentePendentes.filter(i => i.tipo === "proposta").length,
        orcamentos_pendentes: itensSomentePendentes.filter(i => i.tipo === "orcamento").length,
        compras_pendentes: itensSomentePendentes.filter(i => i.tipo === "compra").length,
        solicitacoes_pendentes: itensSomentePendentes.filter(i => i.tipo === "solicitacao").length,
        materiais_pendentes: itensSomentePendentes.filter(i => i.tipo === "solicitacao_material").length,
        propostas_aprovadas: propostasAprovadas.length,
        valor_vendidos: valorVendidos,
        valor_em_negociacao: valorEmNegociacao,
        valor_total_pendente: valorEmNegociacao,
      };
      setEstatisticas(stats);

    } catch (error) {
      console.error("Erro ao carregar pendências:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAprovar(item: ItemPendente) {
    if (!confirm(`Aprovar "${item.titulo}"?`)) return;

    try {
      // Aprovar proposta → atualiza status (contrato será criado pelo cliente via link público)
      if (item.tipo === "proposta") {
        const { error } = await supabase
          .from("propostas")
          .update({ status: "aprovada", updated_at: new Date().toISOString() })
          .eq("id", item.id);

        if (error) throw error;

        toast({ title: "Sucesso", description: "Proposta aprovada com sucesso! O contrato será gerado automaticamente." });
        carregarPendentes();
        return;
      }

      // Verificar se é um projeto de compras (pelo formato do título)
      const isProjetoCompras = item.titulo.startsWith("PC-");

      if (isProjetoCompras) {
        // Aprovar projeto de compras
        const { error } = await supabase
          .from("projetos_compras")
          .update({ status: "APROVADO", updated_at: new Date().toISOString() })
          .eq("id", item.id);

        if (error) throw error;

        // Atualizar status dos itens também
        await supabase
          .from("projeto_lista_compras")
          .update({ status: "APROVADO", data_aprovacao: new Date().toISOString() })
          .eq("projeto_id", item.id);

        toast({ title: "Sucesso", description: "Projeto de compras aprovado com sucesso!" });
      } else if (item.tipo === "solicitacao_material") {
        // Aprovar pedido de materiais do colaborador
        const { error } = await supabase
          .from("pedidos_materiais")
          .update({ status: "em_orcamento" })
          .eq("id", item.id);

        if (error) throw error;

        toast({ title: "Sucesso", description: "Pedido de materiais aprovado! Status alterado para 'Em Orçamento'." });
      } else {
        let tabela = "";
        let novoStatus = "aprovado";

        switch (item.tipo) {
          case "compra":
            tabela = "pedidos_compra";
            break;
          case "solicitacao":
            tabela = "financeiro_solicitacoes";
            break;
          default:
            toast({ variant: "destructive", title: "Erro", description: "Tipo de item nÍo suporta aprovaçÍo direta." });
            return;
        }

        const { error } = await supabase
          .from(tabela)
          .update({ status: novoStatus })
          .eq("id", item.id);

        if (error) throw error;

        toast({ title: "Sucesso", description: "Item aprovado com sucesso!" });
      }

      carregarPendentes();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao aprovar item." });
    }
  }

  async function handleRejeitar(item: ItemPendente) {
    const motivo = prompt("Motivo da rejeiçÍo (opcional):");
    if (motivo === null) return; // Cancelou

    try {
      // Rejeitar proposta
      if (item.tipo === "proposta") {
        const updateData: Record<string, any> = {
          status: "rejeitada",
          updated_at: new Date().toISOString(),
        };
        if (motivo) updateData.observacoes_internas = motivo;

        const { error } = await supabase
          .from("propostas")
          .update(updateData)
          .eq("id", item.id);

        if (error) throw error;

        toast({ title: "Sucesso", description: "Proposta rejeitada." });
        carregarPendentes();
        return;
      }

      // Verificar se é um projeto de compras (pelo formato do título)
      const isProjetoCompras = item.titulo.startsWith("PC-");

      if (isProjetoCompras) {
        // Rejeitar projeto de compras
        const { error } = await supabase
          .from("projetos_compras")
          .update({
            status: "CANCELADO",
            updated_at: new Date().toISOString(),
            observacoes: motivo || undefined,
          })
          .eq("id", item.id);

        if (error) throw error;

        toast({ title: "Sucesso", description: "Projeto de compras rejeitado." });
      } else if (item.tipo === "solicitacao_material") {
        // Rejeitar pedido de materiais do colaborador
        const updateData: { status: string; observacoes?: string } = { status: "recusado" };
        if (motivo) updateData.observacoes = motivo;

        const { error } = await supabase
          .from("pedidos_materiais")
          .update(updateData)
          .eq("id", item.id);

        if (error) throw error;

        toast({ title: "Sucesso", description: "Pedido de materiais rejeitado." });
      } else {
        let tabela = "";
        let novoStatus = "rejeitado";

        switch (item.tipo) {
          case "compra":
            tabela = "pedidos_compra";
            break;
          case "solicitacao":
            tabela = "financeiro_solicitacoes";
            break;
          default:
            toast({ variant: "destructive", title: "Erro", description: "Tipo de item nÍo suporta rejeiçÍo direta." });
            return;
        }

        const { error } = await supabase
          .from(tabela)
          .update({
            status: novoStatus,
            observacoes: motivo || undefined
          })
          .eq("id", item.id);

        if (error) throw error;

        toast({ title: "Sucesso", description: "Item rejeitado." });
      }

      carregarPendentes();
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao rejeitar item." });
    }
  }

  async function handleExcluir(item: ItemPendente) {
    if (!confirm(`Excluir "${item.titulo}"?\n\nEsta açÍo nÍo pode ser desfeita.`)) return;

    try {
      let tabela = "";

      switch (item.tipo) {
        case "proposta":
          tabela = "propostas";
          break;
        case "orcamento":
          tabela = "orcamentos";
          break;
        case "compra":
          tabela = "pedidos_compra";
          break;
        case "solicitacao":
          tabela = "financeiro_solicitacoes";
          break;
        case "solicitacao_material":
          tabela = "pedidos_materiais";
          break;
        default:
          toast({ variant: "destructive", title: "Erro", description: "Tipo de item nÍo suporta exclusÍo." });
          return;
      }

      const { error } = await supabase
        .from(tabela)
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Item excluído com sucesso!" });
      carregarPendentes();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir item. Verifique se nÍo há dependências." });
    }
  }

  // Filtrar itens
  const itensFiltrados = itens.filter(item => {
    if (filtroTipo !== "todos" && item.tipo !== filtroTipo) return false;
    if (filtroUrgencia !== "todos" && item.urgencia !== filtroUrgencia) return false;
    return true;
  });

  const gruposPorCliente = useMemo(() => {
    const map = new Map<string, {
      cliente: string;
      itens: ItemPendente[];
      valorTotal: number;
      cliente_avatar_url?: string;
      cliente_foto_url?: string;
      cliente_avatar?: string;
    }>();

    itensFiltrados.forEach((item) => {
      const cliente = item.cliente?.trim() || "Sem cliente";
      const grupoAtual = map.get(cliente);

      if (grupoAtual) {
        grupoAtual.itens.push(item);
        grupoAtual.valorTotal += item.valor || 0;
        if (!grupoAtual.cliente_avatar_url && item.cliente_avatar_url) grupoAtual.cliente_avatar_url = item.cliente_avatar_url;
        if (!grupoAtual.cliente_foto_url && item.cliente_foto_url) grupoAtual.cliente_foto_url = item.cliente_foto_url;
        if (!grupoAtual.cliente_avatar && item.cliente_avatar) grupoAtual.cliente_avatar = item.cliente_avatar;
      } else {
        map.set(cliente, {
          cliente,
          itens: [item],
          valorTotal: item.valor || 0,
          cliente_avatar_url: item.cliente_avatar_url,
          cliente_foto_url: item.cliente_foto_url,
          cliente_avatar: item.cliente_avatar,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.itens.length - a.itens.length);
  }, [itensFiltrados]);

  useEffect(() => {
    const currentClientes = new Set(gruposPorCliente.map((g) => g.cliente));
    setClientesExpandidos((prev) => {
      const filtered = [...prev].filter((c) => currentClientes.has(c));
      if (filtered.length === prev.size) return prev; // sem mudança, evita re-render
      return new Set(filtered);
    });
  }, [gruposPorCliente]);

  function toggleCliente(cliente: string) {
    setClientesExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(cliente)) {
        next.delete(cliente);
      } else {
        next.add(cliente);
      }
      return next;
    });
  }

  function getTipoLabel(tipo: string) {
    switch (tipo) {
      case "proposta": return "Proposta";
      case "orcamento": return "Orçamento";
      case "compra": return "Pedido de Compra";
      case "solicitacao": return "SolicitaçÍo";
      case "solicitacao_material": return "Pedido de Materiais";
      default: return tipo;
    }
  }

  function getTipoColor(tipo: string) {
    switch (tipo) {
      case "proposta": return "bg-orange-100 text-orange-800";
      case "orcamento": return "bg-blue-100 text-blue-800";
      case "compra": return "bg-purple-100 text-purple-800";
      case "solicitacao": return "bg-amber-100 text-amber-800";
      case "solicitacao_material": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getUrgenciaColor(urgencia: string) {
    switch (urgencia) {
      case "alta": return "bg-red-100 text-red-800";
      case "media": return "bg-yellow-100 text-yellow-800";
      case "baixa": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusLabel(item: ItemPendente) {
    if (item.tipo === "proposta" && item.status === "aprovada") return "Aprovada";
    return "Pendente";
  }

  function getStatusColor(item: ItemPendente) {
    if (item.tipo === "proposta" && item.status === "aprovada") return "bg-emerald-100 text-emerald-800";
    return "bg-amber-100 text-amber-800";
  }

  function getLinkDetalhe(item: ItemPendente) {
    switch (item.tipo) {
      case "proposta": return `/propostas/${item.id}/visualizar`;
      case "orcamento": return `/planejamento/orcamentos/${item.id}`;
      case "compra": return `/compras/${item.id}`;
      case "solicitacao": return `/financeiro/solicitacoes`;
      case "solicitacao_material": return `/colaborador/materiais`; // Por enquanto redireciona para lista geral
      default: return "#";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-wg-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pendências...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900 mb-2">
            Central de Aprovações
          </h1>
          <p className="text-[12px] text-gray-600">
            Gerencie aprovacoes de propostas, orcamentos, pedidos de compra e solicitacoes
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] text-gray-600">Total Pendentes</p>
                <p className="text-[20px] font-normal text-gray-900">{estatisticas.total_pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] text-gray-600">Propostas</p>
                <p className="text-[20px] font-normal text-orange-600">{estatisticas.propostas_pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] text-gray-600">Orçamentos</p>
                <p className="text-[20px] font-normal text-blue-600">{estatisticas.orcamentos_pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] text-gray-600">Compras</p>
                <p className="text-[20px] font-normal text-purple-600">{estatisticas.compras_pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] text-gray-600">Solicitações</p>
                <p className="text-[20px] font-normal text-amber-600">{estatisticas.solicitacoes_pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] text-gray-600">Materiais</p>
                <p className="text-[20px] font-normal text-green-600">{estatisticas.materiais_pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-lg shadow p-6 text-white">
            <div>
              <p className="text-[12px] opacity-90">Vendidos</p>
              <p className="text-[20px] font-normal">{formatarMoeda(estatisticas.valor_vendidos)}</p>
              <p className="text-[12px] opacity-90 mt-1">{estatisticas.propostas_aprovadas} aprovado(s)</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-wg-primary to-wg-primary/80 rounded-lg shadow p-6 text-white">
            <div>
              <p className="text-[12px] opacity-90">Em NegociaçÍo</p>
              <p className="text-[20px] font-normal">{formatarMoeda(estatisticas.valor_em_negociacao)}</p>
              <p className="text-[12px] opacity-90 mt-1">{estatisticas.total_pendentes} pendente(s)</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="filtro-tipo" className="block text-[12px] font-medium text-gray-700 mb-1">Tipo</label>
              <select
                id="filtro-tipo"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary"
              >
                <option value="todos">Todos</option>
                <option value="proposta">Propostas</option>
                <option value="orcamento">Orçamentos</option>
                <option value="compra">Pedidos de Compra</option>
                <option value="solicitacao">Solicitações</option>
                <option value="solicitacao_material">Pedidos de Materiais</option>
              </select>
            </div>

            <div>
              <label htmlFor="filtro-urgencia" className="block text-[12px] font-medium text-gray-700 mb-1">Urgência</label>
              <select
                id="filtro-urgencia"
                value={filtroUrgencia}
                onChange={(e) => setFiltroUrgencia(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary"
              >
                <option value="todos">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFiltroTipo("todos");
                  setFiltroUrgencia("todos");
                }}
                className="px-4 py-2 text-[14px] text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Pendências */}
        {itensFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-[18px] font-normal text-gray-700 mb-2">
              Nenhuma pendencia encontrada
            </h2>
            <p className="text-gray-500">
              {filtroTipo !== "todos" || filtroUrgencia !== "todos"
                ? "Tente ajustar os filtros para ver mais itens"
                : "Todas as aprovações estÍo em dia!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {gruposPorCliente.map((grupo) => {
              const expandido = clientesExpandidos.has(grupo.cliente);

              return (
                <div key={grupo.cliente} className="bg-white rounded-lg shadow border border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleCliente(grupo.cliente)}
                    className="w-full px-4 py-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${expandido ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <Avatar
                        nome={grupo.cliente}
                        avatar_url={grupo.cliente_avatar_url}
                        foto_url={grupo.cliente_foto_url}
                        avatar={grupo.cliente_avatar}
                        size="sm"
                      />
                      <div className="text-left">
                        <p className="text-[14px] font-medium text-gray-900">{grupo.cliente}</p>
                        <p className="text-[12px] text-gray-500">{grupo.itens.length} item(ns)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-500">Total</p>
                      <p className="text-[16px] font-medium text-gray-900">{formatarMoeda(grupo.valorTotal)}</p>
                    </div>
                  </button>

                  {expandido && (
                    <div className="space-y-4 p-4">
                      {grupo.itens.map((item) => (
                        <div
                          key={`${item.tipo}-${item.id}`}
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Info Principal */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(item.tipo)}`}>
                                  {getTipoLabel(item.tipo)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item)}`}>
                                  {getStatusLabel(item)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgenciaColor(item.urgencia)}`}>
                                  {item.urgencia.charAt(0).toUpperCase() + item.urgencia.slice(1)}
                                </span>
                              </div>

                              <h3 className="text-lg font-normal text-gray-900 mb-1">
                                {item.titulo}
                              </h3>

                              {item.descricao && (
                                <p className="text-sm text-gray-600 mb-2">{item.descricao}</p>
                              )}

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatarData(item.data_criacao)}
                                </span>
                              </div>
                            </div>

                            {/* Valor */}
                            <div className="text-right">
                              <p className="text-[12px] text-gray-500">Valor</p>
                              <p className="text-[20px] font-normal text-gray-900">{formatarMoeda(item.valor)}</p>
                            </div>

                            {/* Ações */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Link
                                to={getLinkDetalhe(item)}
                                className="px-4 py-2 text-[14px] font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-center"
                              >
                                Ver Detalhes
                              </Link>

                              {item.tipo !== "orcamento" && isPendente(item) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleAprovar(item)}
                                    className="px-4 py-2 text-[14px] font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                                  >
                                    Aprovar
                                  </button>

                                  {/* BotÍo Copiar Link Público - apenas para propostas */}
                                  {item.tipo === "proposta" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const url = `${window.location.origin}/proposta/${item.id}/visualizar`;
                                        navigator.clipboard.writeText(url).then(() => {
                                          toast({ title: "Link público copiado!" });
                                        });
                                      }}
                                      className="px-4 py-2 text-[14px] font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
                                    >
                                      Copiar Link
                                    </button>
                                  )}

                                  {/* BotÍo Enviar para Cliente - apenas para pedidos de materiais */}
                                  {item.tipo === "solicitacao_material" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setItemParaEnviar(item);
                                        setModalEnviarAberto(true);
                                      }}
                                      className="px-4 py-2 text-[14px] font-medium text-white bg-primary rounded-lg hover:bg-primary-dark"
                                    >
                                      Enviar p/ Cliente
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRejeitar(item)}
                                    className="px-4 py-2 text-[14px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                                  >
                                    Rejeitar
                                  </button>
                                </>
                              )}

                              {/* BotÍo Excluir - disponível para todos os tipos */}
                              <button
                                type="button"
                                onClick={() => handleExcluir(item)}
                                className="px-4 py-2 text-[14px] font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 hover:text-gray-800"
                                title="Excluir item"
                              >
                                <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legenda */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-normal text-gray-700 mb-3">Legenda de Urgência</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-gray-600">Alta - Requer açÍo imediata</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-gray-600">Média - AçÍo em até 48h</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-gray-600">Baixa - Sem prazo definido</span>
            </div>
          </div>
        </div>

      {/* Modal de Envio para Cliente */}
      {itemParaEnviar && (
        <EnviarParaClienteModal
          isOpen={modalEnviarAberto}
          onClose={() => {
            setModalEnviarAberto(false);
            setItemParaEnviar(null);
          }}
          pedidoId={itemParaEnviar.id}
          pedidoTitulo={itemParaEnviar.titulo}
          clienteNome={itemParaEnviar.cliente}
          onEnviado={() => {
            carregarPendentes();
          }}
        />
      )}
    </div>
  );
}



/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/cliente/AreaClientePage.tsx
// Área do cliente - Dashboard Premium WG Easy
// VersÍo completa com todos os módulos

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { usePermissoesCliente } from "@/hooks/usePermissoesUsuario";
import { useImpersonation } from "@/hooks/useImpersonation";
import ImpersonationBar from "@/components/ui/ImpersonationBar";
import {
  Calendar,
  FileText,
  FileCheck,
  DollarSign,
  Upload,
  MessageSquare,
  Monitor,
  ExternalLink,
  Layers,
  Clock,
  CheckCircle2,
  Bell,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Heart,
  Palette,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Componentes do cliente (versÍo simplificada)
import AprovacoesPendentes from "@/components/cliente/AprovacoesPendentes";
import AssistenciaTecnicaCliente from "@/components/cliente/AssistenciaTecnicaCliente";
import MoodboardResumoCliente from "@/components/cliente/MoodboardResumoCliente";
import ItensContratados from "@/components/cliente/ItensContratados";
import InfoContratoCliente from "@/components/cliente/InfoContratoCliente";
import ComentariosCliente from "@/components/cliente/ComentariosCliente";
import DiarioObra from "@/components/cliente/DiarioObra";
import PastasClienteDrive from "@/components/cliente/PastasClienteDrive";
import DriveExplorerApple from "@/components/cliente/DriveExplorerApple";
import ControleCobrancas from "@/components/cliente/ControleCobrancas";
import SpotifyPlayer, { SpotifyFloatingButton } from "@/components/cliente/SpotifyPlayer";

// Componentes de Onboarding/Checklist por núcleo
import OnboardingArquitetura from "@/components/cliente/OnboardingArquitetura";
import OnboardingEngenharia from "@/components/cliente/OnboardingEngenharia";
import OnboardingMarcenaria from "@/components/cliente/OnboardingMarcenaria";
import ContratacoesClienteBloco from "@/components/cliente/ContratacoesClienteBloco";
import CronogramaCliente from "@/components/cliente/CronogramaCliente";
import TarefasCliente from "@/components/cliente/TarefasCliente";

import "@/styles/dashboard.css";

export default function AreaClientePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const permissoes = usePermissoesCliente();

  const {
    isImpersonating,
    impersonatedUser,
    canImpersonate,
    stopImpersonation,
    loading: impersonationLoading,
  } = useImpersonation();

  const clienteIdParam = searchParams.get("cliente_id");

  const [clienteInfo, setClienteInfo] = useState<{
    primeiroNome: string;
    nomeCompleto: string;
    genero: 'M' | 'F' | null;
    avatar: string | null;
    oportunidadeId: string;
    contratoId: string | null;
    pessoaId: string;
    nucleosContratados: string[];
    dataInicioWg: string | null;
    enderecoObra: string | null;
    telefone: string | null;
    email: string | null;
  } | null>(null);

  const [stats, setStats] = useState({
    totalEtapas: 0,
    etapasConcluidas: 0,
    atividadesPendentes: 0, // aberto + em_andamento (não concluídas)
    proximaEtapa: '',
    diasRestantes: 0,
  });
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({
    arquitetura: 0,
    engenharia: 0,
    marcenaria: 0,
    jornada: 0,
    acabamentos: 0,
    cronograma: 0,
  });
  const [sectionResumo, setSectionResumo] = useState<Record<string, { total: number; pendentes: number; concluidas: number }>>({
    arquitetura: { total: 0, pendentes: 0, concluidas: 0 },
    engenharia: { total: 0, pendentes: 0, concluidas: 0 },
    marcenaria: { total: 0, pendentes: 0, concluidas: 0 },
    jornada: { total: 0, pendentes: 0, concluidas: 0 },
    acabamentos: { total: 0, pendentes: 0, concluidas: 0 },
    cronograma: { total: 0, pendentes: 0, concluidas: 0 },
  });
  const [refreshTick, setRefreshTick] = useState(0);

  // Seções colapsáveis (jornada começa recolhida)
  const [secoesColapsadas, setSecoesColapsadas] = useState<Record<string, boolean>>({
    arquitetura: true,
    engenharia: true,
    marcenaria: true,
    jornada: true,
    acabamentos: true,
    cronograma: true,
  });
  const toggleSecao = (secao: string) =>
    setSecoesColapsadas((prev) => ({ ...prev, [secao]: !prev[secao] }));

  const carregandoRef = useRef(false);
  const ultimoPessoaIdRef = useRef<string | null>(null);
  const jaCarregouRef = useRef(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const tentativasRef = useRef(0);

  const pessoaIdAlvo = useMemo(() => {
    if (isImpersonating && impersonatedUser) {
      return impersonatedUser.id;
    }
    if (clienteIdParam && canImpersonate) {
      return clienteIdParam;
    }
    return null;
  }, [isImpersonating, impersonatedUser, clienteIdParam, canImpersonate]);

  const carregarDadosCliente = useCallback(async () => {
    if (carregandoRef.current) return;
    if (tentativasRef.current >= 3) {
      setErroCarregamento('Falha ao carregar após múltiplas tentativas');
      return;
    }

    try {
      carregandoRef.current = true;
      tentativasRef.current += 1;
      setErroCarregamento(null);

      let pessoaId: string | null = pessoaIdAlvo;

      if (!pessoaId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setErroCarregamento('Usuário não autenticado. Faça login para continuar.');
          carregandoRef.current = false;
          jaCarregouRef.current = true;
          return;
        }

        const { data: usuario } = await supabase
          .from('usuarios')
          .select('pessoa_id, tipo_usuario')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (usuario) {
          pessoaId = usuario.pessoa_id;
        } else {
          const { data: pessoa } = await supabase
            .from('pessoas')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();

          if (pessoa) {
            pessoaId = pessoa.id;
          } else if (clienteIdParam && canImpersonate) {
            // SEGURANÇA: Só permite usar cliente_id da URL se o usuário for ADMIN/MASTER
            pessoaId = clienteIdParam;
          } else {
            setErroCarregamento('Seu cadastro não foi encontrado. Entre em contato com o suporte.');
            carregandoRef.current = false;
            jaCarregouRef.current = true;
            return;
          }
        }
      }

      if (!pessoaId) {
        setErroCarregamento('ID do cliente não informado');
        carregandoRef.current = false;
        jaCarregouRef.current = true;
        return;
      }

      if (pessoaId === ultimoPessoaIdRef.current && jaCarregouRef.current) {
        carregandoRef.current = false;
        return;
      }
      ultimoPessoaIdRef.current = pessoaId;

      const { data: pessoa, error: pessoaError } = await supabase
        .from('pessoas')
        .select('id, nome, genero, avatar_url, data_inicio_wg, telefone, email, obra_logradouro, obra_numero, obra_bairro, obra_cidade, obra_estado')
        .eq('id', pessoaId)
        .maybeSingle();

      if (pessoaError || !pessoa) {
        setErroCarregamento(`Cliente não encontrado (ID: ${pessoaId.slice(0, 8)}...)`);
        jaCarregouRef.current = true;
        return;
      }

      let oportunidade: any = null;
      {
        const { data: oportunidadeData } = await supabase
          .from('oportunidades')
          .select('id, nucleo')
          .eq('cliente_id', pessoa.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        oportunidade = oportunidadeData;
      }

      const { data: contrato } = await supabase
        .from('contratos')
        .select('id, unidade_negocio')
        .eq('cliente_id', pessoa.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const adicionarNucleo = (lista: string[], valor?: string | null) => {
        const txt = String(valor || "").toLowerCase().trim();
        if (!txt) return;
        if (txt.includes("eng")) {
          if (!lista.includes("engenharia")) lista.push("engenharia");
          return;
        }
        if (txt.includes("marc")) {
          if (!lista.includes("marcenaria")) lista.push("marcenaria");
          return;
        }
        if (txt.includes("arq")) {
          if (!lista.includes("arquitetura")) lista.push("arquitetura");
        }
      };

      // Buscar núcleos contratados
      let nucleosContratados: string[] = [];
      if (contrato?.id) {
        const { data: nucleosData } = await supabase
          .from('contratos_nucleos')
          .select('nucleo')
          .eq('contrato_id', contrato.id);

        if (nucleosData) {
          for (const n of nucleosData as Array<{ nucleo: string }>) {
            adicionarNucleo(nucleosContratados, n.nucleo);
          }
        }
      }

      // Fallback: se não há núcleos na tabela, tentar inferir pelo contrato
      if (nucleosContratados.length === 0) {
        const unidadeNegocio = String((contrato as any)?.unidade_negocio || '').toLowerCase();
        adicionarNucleo(nucleosContratados, unidadeNegocio);
      }

      // Fallback adicional: inferir pelos núcleos da oportunidade quando não há contrato
      if (nucleosContratados.length === 0) {
        const nucleoOportunidade = String((oportunidade as any)?.nucleo || "").toLowerCase();
        adicionarNucleo(nucleosContratados, nucleoOportunidade);
      }

      // Fallback adicional: propostas aprovadas do cliente (mesmo sem contrato ativo)
      try {
        const { data: propostasAprovadas } = await supabase
          .from("propostas")
          .select("id")
          .eq("cliente_id", pessoa.id)
          .in("status", ["aprovada", "aprovado", "aceita"]);

        const propostaIds = (propostasAprovadas || []).map((p: any) => p.id).filter(Boolean);
        if (propostaIds.length > 0) {
          const consultaItensPrincipal = await supabase
            .from("propostas_itens")
            .select("id, nucleo, descricao, descricao_customizada, tipo")
            .in("proposta_id", propostaIds);

          let itensProposta: any[] = consultaItensPrincipal.data || [];
          if (consultaItensPrincipal.error) {
            const consultaItensFallback = await supabase
              .from("propostas_itens")
              .select("id, descricao, descricao_customizada, tipo")
              .in("proposta_id", propostaIds);
            itensProposta = consultaItensFallback.data || [];
          }

          for (const item of itensProposta as any[]) {
            adicionarNucleo(nucleosContratados, item.nucleo);
            if (!item.nucleo) {
              const texto = `${item.descricao_customizada || item.descricao || ""} ${item.tipo || ""}`.toLowerCase();
              if (texto.includes("marcen")) adicionarNucleo(nucleosContratados, "marcenaria");
              if (texto.includes("arquitet") || texto.includes("arq")) adicionarNucleo(nucleosContratados, "arquitetura");
              if (texto.includes("engenh") || texto.includes("obra")) adicionarNucleo(nucleosContratados, "engenharia");
            }
          }
        }
      } catch {
        // não bloqueia o carregamento da área do cliente em ambientes com schema divergente
      }

      // Arquitetura é base da jornada visual do cliente; mantém o bloco disponível.
      if (!nucleosContratados.includes("arquitetura")) {
        nucleosContratados.push("arquitetura");
      }

      // Extrair primeiro e segundo nome
      const nomes = pessoa.nome.split(' ').filter((n: string) => n.length > 0);
      const primeiroNome = nomes.length >= 2 ? `${nomes[0]} ${nomes[1]}` : nomes[0] || 'Cliente';

      // Montar endereço da obra
      let enderecoObra: string | null = null;
      if (pessoa.obra_logradouro) {
        const partes = [
          pessoa.obra_logradouro,
          pessoa.obra_numero,
          pessoa.obra_bairro,
          pessoa.obra_cidade,
          pessoa.obra_estado,
        ].filter(Boolean);
        enderecoObra = partes.join(', ');
      }

      setClienteInfo({
        primeiroNome,
        nomeCompleto: pessoa.nome,
        genero: pessoa.genero || null,
        avatar: pessoa.avatar_url || null,
        oportunidadeId: oportunidade?.id || `CLIENTE-${pessoa.id}`,
        contratoId: contrato?.id || null,
        pessoaId: pessoa.id,
        nucleosContratados,
        dataInicioWg: pessoa.data_inicio_wg || null,
        enderecoObra,
        telefone: pessoa.telefone || null,
        email: pessoa.email || null,
      });

      jaCarregouRef.current = true;

      // Carregar estatísticas reais consolidadas (cronograma + checklists + solicitações)
      const progressoNucleos: Record<string, { total: number; concluidas: number }> = {
        arquitetura: { total: 0, concluidas: 0 },
        engenharia: { total: 0, concluidas: 0 },
        marcenaria: { total: 0, concluidas: 0 },
      };

      const normalizarNucleo = (valor?: string | null): "arquitetura" | "engenharia" | "marcenaria" | "geral" => {
        const n = String(valor || "").toLowerCase();
        if (n.includes("eng")) return "engenharia";
        if (n.includes("marc")) return "marcenaria";
        if (n.includes("arq")) return "arquitetura";
        return "geral";
      };

      const inferirNucleoPorTexto = (texto?: string | null): "arquitetura" | "engenharia" | "marcenaria" | "geral" => {
        const t = String(texto || "").toLowerCase();
        if (t.includes("engenharia") || t.includes("obra") || t.includes("ar condicionado")) return "engenharia";
        if (t.includes("marcenaria") || t.includes("mobili")) return "marcenaria";
        if (t.includes("arquitetura") || t.includes("layout") || t.includes("acabamento")) return "arquitetura";
        return "geral";
      };

      let projetosCliente: any[] = [];
      if (contrato?.id) {
        const { data } = await supabase
          .from("projetos")
          .select("id")
          .eq("contrato_id", contrato.id);
        projetosCliente = data || [];
      }
      if (projetosCliente.length === 0) {
        const { data } = await supabase
          .from("projetos")
          .select("id")
          .eq("cliente_id", pessoa.id);
        projetosCliente = data || [];
      }
      if (projetosCliente.length === 0 && oportunidade?.id) {
        try {
          const { data } = await supabase
            .from("projetos")
            .select("id")
            .eq("oportunidade_id", oportunidade.id);
          projetosCliente = data || [];
        } catch {
          // Ambientes sem coluna oportunidade_id em projetos
        }
      }
      const projetoIds = (projetosCliente || []).map((p: any) => p.id);

      let cronogramaTotal = 0;
      let cronogramaConcluido = 0;
      let diasRestantes = 0;
      let proximaEtapa = "—";

      if (projetoIds.length > 0) {
        const { data: tarefasCronograma } = await supabase
          .from("cronograma_tarefas")
          .select("titulo, status, progresso, ordem, data_termino, nucleo")
          .in("projeto_id", projetoIds)
          .order("ordem", { ascending: true });

        const tarefas = (tarefasCronograma || []) as any[];
        cronogramaTotal = tarefas.length;
        cronogramaConcluido = tarefas.filter((t) => t.status === "concluido" || Number(t.progresso || 0) >= 100).length;
        const pendentesCronograma = tarefas.filter((t) => t.status !== "concluido" && Number(t.progresso || 0) < 100);
        proximaEtapa = pendentesCronograma[0]?.titulo || "Projeto finalizado";

        const dataFimMax = tarefas
          .map((t) => t.data_termino)
          .filter(Boolean)
          .sort()
          .pop();
        if (dataFimMax) {
          const hoje = new Date();
          const fim = new Date(`${String(dataFimMax).slice(0, 10)}T00:00:00`);
          diasRestantes = Math.max(0, Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));
        }

        for (const tarefa of tarefas) {
          const nucleoTarefa = normalizarNucleo(tarefa.nucleo);
          if (nucleoTarefa === "geral") continue;
          progressoNucleos[nucleoTarefa].total += 1;
          if (tarefa.status === "concluido" || Number(tarefa.progresso || 0) >= 100) {
            progressoNucleos[nucleoTarefa].concluidas += 1;
          }
        }
      }

      let checklistsLegacy: any[] = [];
      if (contrato?.id) {
        const { data } = await supabase
          .from("checklists")
          .select(`
            titulo,
            checklist_itens (concluido, percentual_concluido, texto, secao)
          `)
          .or(`and(vinculo_tipo.eq.contrato,vinculo_id.eq.${contrato.id}),and(vinculo_tipo.eq.cliente,vinculo_id.eq.${pessoa.id})`);
        checklistsLegacy = data || [];
      } else if (oportunidade?.id) {
        const { data } = await supabase
          .from("checklists")
          .select(`
            titulo,
            checklist_itens (concluido, percentual_concluido, texto, secao)
          `)
          .or(`and(vinculo_tipo.eq.cliente,vinculo_id.eq.${pessoa.id}),and(vinculo_tipo.eq.oportunidade,vinculo_id.eq.${oportunidade.id})`);
        checklistsLegacy = data || [];
      } else {
        const { data } = await supabase
          .from("checklists")
          .select(`
            titulo,
            checklist_itens (concluido, percentual_concluido, texto, secao)
          `)
          .eq("vinculo_tipo", "cliente")
          .eq("vinculo_id", pessoa.id);
        checklistsLegacy = data || [];
      }

      const itensLegacy = (checklistsLegacy || []).flatMap((c: any) =>
        (c.checklist_itens || []).map((i: any) => ({ ...i, checklist_titulo: c.titulo }))
      );
      const checklistLegacyTotal = itensLegacy.length;
      const checklistLegacyConcluido = itensLegacy.filter((i: any) => i.concluido || Number(i.percentual_concluido || 0) >= 100).length;

      for (const item of itensLegacy) {
        const secao = normalizarNucleo(item.secao || item.checklist_titulo || item.texto);
        const nucleoItem = secao === "geral" ? inferirNucleoPorTexto(item.texto || item.checklist_titulo) : secao;
        if (nucleoItem === "geral") continue;
        progressoNucleos[nucleoItem].total += 1;
        if (item.concluido || Number(item.percentual_concluido || 0) >= 100) {
          progressoNucleos[nucleoItem].concluidas += 1;
        }
      }

      let checklistClienteTotal = 0;
      let checklistClienteConcluido = 0;
      if (oportunidade?.id) {
        const { data: checklistsCliente } = await supabase
          .from("cliente_checklists")
          .select("nome, cliente_checklist_items (texto, concluido)")
          .eq("oportunidade_id", oportunidade.id);

        const itensCliente = (checklistsCliente || []).flatMap((c: any) =>
          (c.cliente_checklist_items || []).map((i: any) => ({ ...i, checklist_nome: c.nome }))
        );
        checklistClienteTotal = itensCliente.length;
        checklistClienteConcluido = itensCliente.filter((i: any) => i.concluido).length;

        for (const item of itensCliente) {
          const nucleoItem = inferirNucleoPorTexto(`${item.checklist_nome || ""} ${item.texto || ""}`);
          if (nucleoItem === "geral") continue;
          progressoNucleos[nucleoItem].total += 1;
          if (item.concluido) progressoNucleos[nucleoItem].concluidas += 1;
        }
      }

      let solicitacoesQuery = supabase
        .from("solicitacoes_cliente")
        .select("status, nucleo")
        .eq("pessoa_id", pessoa.id);

      if (contrato?.id) {
        solicitacoesQuery = solicitacoesQuery.eq("contrato_id", contrato.id);
      }
      const { data: solicitacoes } = await solicitacoesQuery;

      const solicitacoesTotal = (solicitacoes || []).length;
      const solicitacoesConcluidas = (solicitacoes || []).filter((s: any) =>
        s.status === "concluido" || s.status === "arquivado"
      ).length;

      for (const s of solicitacoes || []) {
        const nucleoSolicitacao = normalizarNucleo((s as any).nucleo);
        if (nucleoSolicitacao === "geral") continue;
        progressoNucleos[nucleoSolicitacao].total += 1;
        if ((s as any).status === "concluido" || (s as any).status === "arquivado") {
          progressoNucleos[nucleoSolicitacao].concluidas += 1;
        }
      }

      const totalTarefas =
        cronogramaTotal +
        checklistLegacyTotal +
        checklistClienteTotal +
        solicitacoesTotal;
      const tarefasConcluidas =
        cronogramaConcluido +
        checklistLegacyConcluido +
        checklistClienteConcluido +
        solicitacoesConcluidas;
      const tarefasPendentes = Math.max(0, totalTarefas - tarefasConcluidas);

      let progressoAcabamentos = 0;
      if (contrato?.id) {
        const { data: moodboard } = await supabase
          .from("cliente_moodboards")
          .select("id")
          .eq("contrato_id", contrato.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (moodboard?.id) {
          const { data: etapasMoodboard } = await supabase
            .from("etapas_escolha")
            .select("status")
            .eq("contrato_id", contrato.id);
          const totalEtapasMoodboard = (etapasMoodboard || []).length;
          const concluidasMoodboard = (etapasMoodboard || []).filter((e: any) => e.status === "concluida").length;
          progressoAcabamentos = totalEtapasMoodboard > 0
            ? Math.round((concluidasMoodboard / totalEtapasMoodboard) * 100)
            : 0;
        }
      }

      const progressoNucleoPercent = (nucleo: "arquitetura" | "engenharia" | "marcenaria") => {
        const base = progressoNucleos[nucleo];
        return base.total > 0 ? Math.round((base.concluidas / base.total) * 100) : 0;
      };

      // Sempre mescla núcleos detectados por dados reais para evitar sumiço de blocos.
      const nucleosPorDados = (["arquitetura", "engenharia", "marcenaria"] as const)
        .filter((nucleo) => progressoNucleos[nucleo].total > 0);
      const nucleosFinais = [...new Set([...nucleosContratados, ...nucleosPorDados])];
      if (nucleosFinais.length > 0) {
        setClienteInfo((prev) => (prev ? { ...prev, nucleosContratados: nucleosFinais } : prev));
      }

      setStats({
        totalEtapas: totalTarefas,
        etapasConcluidas: tarefasConcluidas,
        atividadesPendentes: tarefasPendentes,
        proximaEtapa,
        diasRestantes,
      });

      setSectionProgress({
        arquitetura: progressoNucleoPercent("arquitetura"),
        engenharia: progressoNucleoPercent("engenharia"),
        marcenaria: progressoNucleoPercent("marcenaria"),
        jornada: totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0,
        acabamentos: progressoAcabamentos,
        cronograma: cronogramaTotal > 0 ? Math.round((cronogramaConcluido / cronogramaTotal) * 100) : 0,
      });
      setSectionResumo({
        arquitetura: {
          total: progressoNucleos.arquitetura.total,
          concluidas: progressoNucleos.arquitetura.concluidas,
          pendentes: Math.max(0, progressoNucleos.arquitetura.total - progressoNucleos.arquitetura.concluidas),
        },
        engenharia: {
          total: progressoNucleos.engenharia.total,
          concluidas: progressoNucleos.engenharia.concluidas,
          pendentes: Math.max(0, progressoNucleos.engenharia.total - progressoNucleos.engenharia.concluidas),
        },
        marcenaria: {
          total: progressoNucleos.marcenaria.total,
          concluidas: progressoNucleos.marcenaria.concluidas,
          pendentes: Math.max(0, progressoNucleos.marcenaria.total - progressoNucleos.marcenaria.concluidas),
        },
        jornada: {
          total: totalTarefas,
          concluidas: tarefasConcluidas,
          pendentes: tarefasPendentes,
        },
        acabamentos: {
          total: 0,
          concluidas: 0,
          pendentes: 0,
        },
        cronograma: {
          total: cronogramaTotal,
          concluidas: cronogramaConcluido,
          pendentes: Math.max(0, cronogramaTotal - cronogramaConcluido),
        },
      });
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    } finally {
      carregandoRef.current = false;
    }
  }, [pessoaIdAlvo]);

  useEffect(() => {
    if (permissoes.loading || impersonationLoading) return;
    carregarDadosCliente();
  }, [permissoes.loading, impersonationLoading, carregarDadosCliente]);

  useEffect(() => {
    if (!clienteInfo?.pessoaId) return;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        setRefreshTick((v) => v + 1);
        carregarDadosCliente();
      }, 350);
    };

    const channel = supabase
      .channel(`area-cliente-realtime-${clienteInfo.pessoaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cronograma_tarefas" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "checklist_itens" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "checklists" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "notas_sistema" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, [clienteInfo?.pessoaId, carregarDadosCliente]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!clienteInfo && !erroCarregamento && !permissoes.loading && !impersonationLoading) {
        setErroCarregamento('Tempo limite excedido. Verifique sua conexÍo e tente novamente.');
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [clienteInfo, erroCarregamento, permissoes.loading, impersonationLoading]);

  function getSaudacao(): string {
    const hora = new Date().getHours();
    let periodo = 'Bom dia';
    if (hora >= 12 && hora < 18) periodo = 'Boa tarde';
    if (hora >= 18) periodo = 'Boa noite';
    return periodo;
  }

  function getIniciais(): string {
    if (!clienteInfo) return 'C';
    return clienteInfo.nomeCompleto
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  // Progresso geral = razÍo direta entre etapas concluídas e total de etapas.
  // Mantém consistência com o texto "X de Y etapas".
  const progressoGeral = useMemo(() => {
    if (stats.totalEtapas === 0) return 0;
    return Math.round((stats.etapasConcluidas / stats.totalEtapas) * 100);
  }, [stats]);

  // Callback para componentes filhos reportarem seu progresso real
  const handleProgressoBloco = useCallback((secao: string, valor: number) => {
    setSectionProgress(prev => {
      if (prev[secao] === valor) return prev;
      return { ...prev, [secao]: valor };
    });
  }, []);

  const handleResumoBloco = useCallback((
    secao: string,
    resumo: { total: number; pendentes: number; concluidas: number }
  ) => {
    setSectionResumo((prev) => {
      const atual = prev[secao];
      if (
        atual &&
        atual.total === resumo.total &&
        atual.pendentes === resumo.pendentes &&
        atual.concluidas === resumo.concluidas
      ) {
        return prev;
      }
      return { ...prev, [secao]: resumo };
    });
  }, []);

  const renderHeaderColapsavel = (secao: string, titulo: string) => (
    <button
      type="button"
      onClick={() => toggleSecao(secao)}
      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-colors mb-2 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-600 uppercase tracking-[0.15em]">{titulo}</p>
          <div className="mt-2 relative">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#fb7185] transition-all duration-500"
                style={{ width: `${sectionProgress[secao] || 0}%` }}
              />
            </div>
            {sectionResumo[secao]?.total > 0 && (
              <div className="absolute -top-2 left-0 right-0 flex items-center justify-between px-1 pointer-events-none">
                {Array.from({ length: Math.min(sectionResumo[secao].total, 12) }).map((_, idx) => {
                  const ordem = idx + 1;
                  const concluida = ordem <= (sectionResumo[secao].concluidas || 0);
                  const atual = ordem === (sectionResumo[secao].concluidas || 0) + 1;
                  return (
                    <span
                      key={`${secao}-etapa-${ordem}`}
                      className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center border ${
                        concluida
                          ? "bg-green-500 border-green-500 text-white"
                          : atual
                          ? "bg-wg-primary border-wg-primary text-white"
                          : "bg-white border-gray-300 text-gray-500"
                      }`}
                    >
                      {ordem}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            {sectionProgress[secao] || 0}% concluído · {sectionResumo[secao]?.pendentes || 0} de {sectionResumo[secao]?.total || 0} pendentes
          </p>
        </div>
        <div className="pt-0.5">
          {secoesColapsadas[secao] ? (
            <ChevronDown className="w-5 h-5 text-gray-300" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-300" />
          )}
        </div>
      </div>
    </button>
  );

  const handleExitImpersonation = () => {
    stopImpersonation();
    navigate('/');
  };

  // KPIs do Cliente
  const kpiCards = useMemo(() => [
    {
      label: "Progresso do Projeto",
      value: `${progressoGeral}%`,
      trend: `${stats.etapasConcluidas} de ${stats.totalEtapas} etapas`,
      accent: "from-[#ff8f3f] to-[#ff622d]",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      label: "Próxima Etapa",
      value: (stats.proximaEtapa || "—").replace(/@\w+/g, '').replace(/\s{2,}/g, ' ').trim() || "—",
      trend: "Em andamento",
      accent: "from-[#4f46e5] to-[#7c3aed]",
      icon: <Layers className="w-4 h-4" />,
    },
    {
      label: "Tempo Estimado",
      value: `${stats.diasRestantes} dias`,
      trend: "Para conclusÍo",
      accent: "from-[#0ea5e9] to-[#14b8a6]",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: "Atividades Pendentes",
      value: `${stats.atividadesPendentes}`,
      trend: stats.atividadesPendentes > 0 ? "Em aberto/andamento" : "Nenhuma pendente",
      accent: "from-[#111827] to-[#374151]",
      icon: <Bell className="w-4 h-4" />,
    },
  ], [progressoGeral, stats]);

  // Erro
  if (erroCarregamento) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl text-gray-900 mb-2">Erro ao carregar</h2>
          <p className="text-[13px] text-gray-500 mb-6">{erroCarregamento}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                tentativasRef.current = 0;
                jaCarregouRef.current = false;
                setErroCarregamento(null);
                carregarDadosCliente();
              }}
              className="w-full px-4 py-2 bg-primary text-white text-[12px] rounded-lg hover:bg-[#d94d1a] transition-colors"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 border border-gray-200 text-[12px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (permissoes.loading || impersonationLoading || !clienteInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F25C26] mb-4"></div>
          <p className="text-gray-600">Carregando suas informações...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isImpersonating && impersonatedUser && (
        <ImpersonationBar
          userName={impersonatedUser.nome}
          userType="CLIENTE"
          onExit={handleExitImpersonation}
        />
      )}

      <div className={`min-h-screen bg-gray-50 area-cliente-typography ${isImpersonating ? 'pt-16' : ''}`}>
        <div className={`pb-16 space-y-8 ${LAYOUT.pageContainer}`}>
          {/* Hero Section Premium */}
          <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-gray-800 to-gray-900 text-white p-6 md:p-8 shadow-lg overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.07]">
              <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-orange-500/50 rounded-full blur-2xl" />
            </div>

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  {clienteInfo.avatar ? (
                    <img
                      src={clienteInfo.avatar}
                      alt={clienteInfo.nomeCompleto}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-white/20 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-xl md:text-2xl border-2 border-white/20 shadow-lg">
                      {getIniciais()}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/50">WG EASY · ÁREA DO CLIENTE</p>
                  <h1 className="text-2xl md:text-3xl leading-tight">
                    {getSaudacao()}, <span className="text-orange-400">{clienteInfo.primeiroNome}</span>
                  </h1>
                  <p className="text-[12px] text-white/60 whitespace-nowrap">Acompanhe o andamento do seu projeto em tempo real.</p>
                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-white/50">
                    {clienteInfo.enderecoObra && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-orange-400/70" />
                        <span className="truncate max-w-[280px]">{clienteInfo.enderecoObra}</span>
                      </div>
                    )}
                    {clienteInfo.dataInicioWg && (
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3 h-3 text-orange-400/70" />
                        <span>Com a WG desde {new Date(clienteInfo.dataInicioWg + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.07] p-4 backdrop-blur-md min-w-[240px] space-y-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Progresso geral</div>
                <div className="text-3xl">{progressoGeral}%</div>
                <p className="text-[11px] text-white/60">{stats.etapasConcluidas} de {stats.totalEtapas} etapas concluídas</p>
                <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#fb7185] transition-all duration-500"
                    style={{ width: `${progressoGeral}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* KPIs */}
          <section className={LAYOUT.gridCards}>
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl bg-gradient-to-br ${card.accent} text-white p-4 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">{card.label}</p>
                  <div className="p-1.5 rounded-full bg-white/[0.08]">{card.icon}</div>
                </div>
                <div className="text-lg md:text-xl truncate">{card.value}</div>
                <p className="mt-0.5 text-[11px] text-white/60">{card.trend}</p>
              </div>
            ))}
          </section>

          {/* ============================================================ */}
          {/* SEÇÍO: ACOMPANHAMENTO DO PROJETO (Checklists por núcleo) */}
          {/* ============================================================ */}
          <section className={LAYOUT.sectionGap}>
            <div className="grid gap-6 lg:grid-cols-1">
              {/* Arquitetura - colapsável */}
              {clienteInfo.nucleosContratados.includes('arquitetura') && (
                <div>
                  {renderHeaderColapsavel("arquitetura", "Arquitetura")}
                  {!secoesColapsadas.arquitetura && (
                    <OnboardingArquitetura
                      key={`arq-${clienteInfo.pessoaId}-${refreshTick}`}
                      contratoId={clienteInfo.contratoId || undefined}
                      oportunidadeId={clienteInfo.oportunidadeId}
                      clienteId={clienteInfo.pessoaId}
                      podeEditar={canImpersonate}
                      onProgressChange={(v) => handleProgressoBloco("arquitetura", v)}
                      onResumoChange={(resumo) => handleResumoBloco("arquitetura", resumo)}
                    />
                  )}
                </div>
              )}
              {/* Engenharia - colapsável */}
              {clienteInfo.nucleosContratados.includes('engenharia') && (
                <div>
                  {renderHeaderColapsavel("engenharia", "Engenharia")}
                  {!secoesColapsadas.engenharia && (
                    <div className="space-y-3">
                      <OnboardingEngenharia
                        key={`eng-${clienteInfo.pessoaId}-${refreshTick}`}
                        contratoId={clienteInfo.contratoId || undefined}
                        oportunidadeId={clienteInfo.oportunidadeId}
                        clienteId={clienteInfo.pessoaId}
                        podeEditar={canImpersonate}
                        onProgressChange={(v) => handleProgressoBloco("engenharia", v)}
                        onResumoChange={(resumo) => handleResumoBloco("engenharia", resumo)}
                      />
                      <ContratacoesClienteBloco
                        contratoId={clienteInfo.contratoId || undefined}
                        clienteId={clienteInfo.pessoaId}
                        nucleo="engenharia"
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Marcenaria - colapsável */}
              {clienteInfo.nucleosContratados.includes('marcenaria') && (
                <div>
                  {renderHeaderColapsavel("marcenaria", "Marcenaria")}
                  {!secoesColapsadas.marcenaria && (
                    <div className="space-y-3">
                      <OnboardingMarcenaria
                        key={`marc-${clienteInfo.pessoaId}-${refreshTick}`}
                        contratoId={clienteInfo.contratoId || undefined}
                        oportunidadeId={clienteInfo.oportunidadeId}
                        clienteId={clienteInfo.pessoaId}
                        podeEditar={canImpersonate}
                        onProgressChange={(v) => handleProgressoBloco("marcenaria", v)}
                        onResumoChange={(resumo) => handleResumoBloco("marcenaria", resumo)}
                      />
                      <ContratacoesClienteBloco
                        contratoId={clienteInfo.contratoId || undefined}
                        clienteId={clienteInfo.pessoaId}
                        nucleo="marcenaria"
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Jornada - colapsável, recolhido por padrÍo */}
              <div>
                {renderHeaderColapsavel("jornada", "Jornada")}
                {!secoesColapsadas.jornada && (
                  <TarefasCliente
                    key={`jornada-${clienteInfo.pessoaId}-${refreshTick}`}
                    clienteId={clienteInfo.pessoaId}
                    podeEditar={canImpersonate}
                    onProgressChange={(v) => handleProgressoBloco("jornada", v)}
                    onResumoChange={(resumo) => handleResumoBloco("jornada", resumo)}
                  />
                )}
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* SEÇÍO: MEUS ACABAMENTOS (MOODBOARD) */}
          {/* ============================================================ */}
          <section className={LAYOUT.cardGap}>
            {renderHeaderColapsavel("acabamentos", "Escolha seus Acabamentos")}
            {!secoesColapsadas.acabamentos && (
              <MoodboardResumoCliente
                key={`acab-${clienteInfo.pessoaId}-${refreshTick}`}
                contratoId={clienteInfo.contratoId || undefined}
                clienteId={clienteInfo.pessoaId}
                onProgressChange={(v) => handleProgressoBloco("acabamentos", v)}
                onResumoChange={(resumo) => handleResumoBloco("acabamentos", resumo)}
              />
            )}
          </section>

          {/* ============================================================ */}
          {/* ============================================================ */}
          {/* SEÇÍO: CRONOGRAMA DO CLIENTE */}
          {/* ============================================================ */}
          {permissoes.podeVerCronograma && (
            <section>
              {renderHeaderColapsavel("cronograma", "Cronograma do Projeto")}
              {!secoesColapsadas.cronograma && (
                <CronogramaCliente
                  key={`cron-${clienteInfo.pessoaId}-${refreshTick}`}
                  clienteId={clienteInfo.pessoaId}
                  contratoId={clienteInfo.contratoId || undefined}
                  onProgressChange={(v) => handleProgressoBloco("cronograma", v)}
                  onResumoChange={(resumo) => handleResumoBloco("cronograma", resumo)}
                />
              )}
            </section>
          )}

          {/* ============================================================ */}
          {/* SEÇÍO: DIÁRIO DE OBRA */}
          {/* ============================================================ */}
          <section>
            <DiarioObra
              clienteId={clienteInfo.pessoaId}
              contratoId={clienteInfo.contratoId || undefined}
              oportunidadeId={clienteInfo.oportunidadeId}
            />
          </section>

          {/* ============================================================ */}
          {/* SEÇÍO: PASTA DO PROJETO - Explorador estilo Apple */}
          {/* ============================================================ */}
          <section>
            <DriveExplorerApple clienteId={clienteInfo.pessoaId} />
          </section>

          {/* ============================================================ */}
          {/* SEÇÍO 2: CONTRATO */}
          {/* ============================================================ */}
          {clienteInfo.contratoId && permissoes.podeVerContratos && (
            <InfoContratoCliente contratoId={clienteInfo.contratoId} />
          )}

          {/* SEÇÍO 3: CONTROLE, COMENTÁRIOS E ASSISTÊNCIA (Grid 3 colunas) */}
          {/* ============================================================ */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Controle Financeiro */}
            <ControleCobrancas
              clienteId={clienteInfo.pessoaId}
              contratoId={clienteInfo.contratoId || undefined}
            />

            {/* Seus Comentários */}
            {permissoes.podeComentarem && (
              <ComentariosCliente
                clienteId={clienteInfo.pessoaId}
                contratoId={clienteInfo.contratoId || undefined}
                podeComentarem={permissoes.podeComentarem}
              />
            )}

            {/* Assistência Técnica */}
            <AssistenciaTecnicaCliente
              clienteId={clienteInfo.pessoaId}
              contratoId={clienteInfo.contratoId || undefined}
            />
          </section>

          {/* ============================================================ */}
          {/* SEÇÍO 3: ITENS CONTRATADOS (Quantitativos) */}
          {/* ============================================================ */}
          {clienteInfo.contratoId && permissoes.podeVerContratos && (
            <ItensContratados
              contratoId={clienteInfo.contratoId}
              mostrarValores={permissoes.podeVerValores}
            />
          )}

          {/* ============================================================ */}
          {/* SEÇÍO 4: APROVAÇÕES PENDENTES */}
          {/* ============================================================ */}
          <AprovacoesPendentes
            clienteId={clienteInfo.pessoaId}
            contratoId={clienteInfo.contratoId || undefined}
            onAprovar={carregarDadosCliente}
          />

          {/* Footer */}
          <section className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 text-center">
            <p className="text-[12px] text-gray-500">
              Dúvidas sobre seu projeto? Entre em contato com seu consultor WG Almeida.
            </p>
            <a
              href={`https://wa.me/${import.meta.env.VITE_WG_WHATSAPP_SUPORTE || "5511999999999"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500 text-white rounded-full text-[12px] hover:bg-green-600 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Falar no WhatsApp
            </a>
          </section>

          {/* Player Spotify */}
          <SpotifyPlayer />
          <SpotifyFloatingButton />
        </div>
      </div>
    </>
  );
}



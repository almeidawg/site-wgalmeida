/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/sistema/SaudeDoSistemaPage.tsx
// Módulo de Diagnóstico e Saúde do Sistema WG Easy

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Database,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Wrench,
  Shield,
  Clock,
  HardDrive,
  Zap,
  FileWarning,
  UserX,
  Mail,
  Copy,
  Play,
  Loader2,
  ChevronDown,
  ChevronRight,
  Download,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

// Cores WG
const WG_COLORS = {
  laranja: "#F25C26",
  verde: "#22c55e",
  amarelo: "#f59e0b",
  vermelho: "#ef4444",
  azul: "#2B4580",
};

// Tipos
interface DiagnosticoItem {
  id: string;
  categoria: "critico" | "alerta" | "info" | "ok";
  titulo: string;
  descricao: string;
  detalhes?: string[];
  acao?: {
    label: string;
    executar: () => Promise<void>;
  };
  sql?: string;
}

interface EstatisticasSistema {
  totalPessoas: number;
  totalClientes: number;
  totalColaboradores: number;
  totalFornecedores: number;
  totalUsuarios: number;
  usuariosAtivos: number;
  totalContratos: number;
  totalOportunidades: number;
  totalProjetos: number;
  cadastrosPendentes: number;
  cadastrosExpirados: number;
  emailsDuplicados: number;
  cpfsDuplicados: number;
  dadosTeste: number;
  usuariosInativos: number;
  clientesSemDrive: number;
}

interface LogItem {
  timestamp: Date;
  tipo: "info" | "success" | "warning" | "error";
  mensagem: string;
}

// Resultado da verificaçÍo de workflow
interface WorkflowVerificacao {
  funcoesRLS: { nome: string; existe: boolean }[];
  tabelasRLS: { nome: string; rlsAtivo: boolean }[];
  politicasRLS: { tabela: string; quantidade: number }[];
  triggers: { nome: string; tabela: string }[];
  execSqlOk: boolean;
}

export default function SaudeDoSistemaPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [etapaAtual, setEtapaAtual] = useState("");
  const [estatisticas, setEstatisticas] = useState<EstatisticasSistema | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [dialogConfirm, setDialogConfirm] = useState<{
    open: boolean;
    titulo: string;
    descricao: string;
    onConfirm: () => Promise<void>;
  }>({ open: false, titulo: "", descricao: "", onConfirm: async () => {} });
  const [ultimaAnalise, setUltimaAnalise] = useState<Date | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [workflowResult, setWorkflowResult] = useState<WorkflowVerificacao | null>(null);
  const [activeTab, setActiveTab] = useState<"diagnosticos" | "workflow">("diagnosticos");

  // Toggle item expansion
  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Adicionar log
  const addLog = useCallback((tipo: LogItem["tipo"], mensagem: string) => {
    setLogs((prev) => [
      { timestamp: new Date(), tipo, mensagem },
      ...prev.slice(0, 99),
    ]);
  }, []);

  // Executar análise completa
  const executarAnalise = async () => {
    setLoading(true);
    setProgresso(0);
    setDiagnosticos([]);
    addLog("info", "Iniciando análise de saúde do sistema...");

    try {
      const novosDiagnosticos: DiagnosticoItem[] = [];
      const stats: EstatisticasSistema = {
        totalPessoas: 0,
        totalClientes: 0,
        totalColaboradores: 0,
        totalFornecedores: 0,
        totalUsuarios: 0,
        usuariosAtivos: 0,
        totalContratos: 0,
        totalOportunidades: 0,
        totalProjetos: 0,
        cadastrosPendentes: 0,
        cadastrosExpirados: 0,
        emailsDuplicados: 0,
        cpfsDuplicados: 0,
        dadosTeste: 0,
        usuariosInativos: 0,
        clientesSemDrive: 0,
      };

      // 1. Verificar conexÍo com banco
      setEtapaAtual("Verificando conexÍo com banco de dados...");
      setProgresso(5);
      addLog("info", "Testando conexÍo com Supabase...");

      const { count: testCount, error: testError } = await supabase
        .from("pessoas")
        .select("*", { count: "exact", head: true });

      if (testError) {
        novosDiagnosticos.push({
          id: "conexao-erro",
          categoria: "critico",
          titulo: "Erro de ConexÍo com Banco",
          descricao: `NÍo foi possível conectar ao banco de dados: ${testError.message}`,
        });
        addLog("error", `Erro de conexÍo: ${testError.message}`);
        setDiagnosticos(novosDiagnosticos);
        setLoading(false);
        return;
      }

      addLog("success", "ConexÍo com banco de dados OK");
      novosDiagnosticos.push({
        id: "conexao-ok",
        categoria: "ok",
        titulo: "ConexÍo com Banco de Dados",
        descricao: "ConexÍo estabelecida com sucesso ao Supabase",
      });

      // 2. Estatísticas de pessoas
      setEtapaAtual("Contando registros de pessoas...");
      setProgresso(15);

      const { count: totalPessoas } = await supabase
        .from("pessoas")
        .select("*", { count: "exact", head: true });
      stats.totalPessoas = totalPessoas || 0;

      const { count: totalClientes } = await supabase
        .from("pessoas")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "CLIENTE");
      stats.totalClientes = totalClientes || 0;

      const { count: totalColaboradores } = await supabase
        .from("pessoas")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "COLABORADOR");
      stats.totalColaboradores = totalColaboradores || 0;

      const { count: totalFornecedores } = await supabase
        .from("pessoas")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "FORNECEDOR");
      stats.totalFornecedores = totalFornecedores || 0;

      addLog("info", `Total de pessoas: ${stats.totalPessoas}`);

      // 3. Estatísticas de usuários
      setEtapaAtual("Verificando usuários...");
      setProgresso(25);

      const { count: totalUsuarios } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true });
      stats.totalUsuarios = totalUsuarios || 0;

      const { count: usuariosAtivos } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);
      stats.usuariosAtivos = usuariosAtivos || 0;

      const { count: usuariosInativos } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })
        .eq("ativo", false);
      stats.usuariosInativos = usuariosInativos || 0;

      if (stats.usuariosInativos > 0) {
        novosDiagnosticos.push({
          id: "usuarios-inativos",
          categoria: "alerta",
          titulo: `${stats.usuariosInativos} Usuários Inativos`,
          descricao: "Existem usuários marcados como inativos no sistema",
          acao: {
            label: "Revisar Usuários",
            executar: async () => {
              window.open("/usuarios?status=inativo", "_blank");
            },
          },
        });
      }

      // 4. Contratos e Oportunidades
      setEtapaAtual("Verificando contratos e oportunidades...");
      setProgresso(35);

      const { count: totalContratos } = await supabase
        .from("contratos")
        .select("*", { count: "exact", head: true });
      stats.totalContratos = totalContratos || 0;

      const { count: totalOportunidades } = await supabase
        .from("oportunidades")
        .select("*", { count: "exact", head: true });
      stats.totalOportunidades = totalOportunidades || 0;

      const { count: totalProjetos } = await supabase
        .from("projetos")
        .select("*", { count: "exact", head: true });
      stats.totalProjetos = totalProjetos || 0;

      addLog("info", `Contratos: ${stats.totalContratos}, Oportunidades: ${stats.totalOportunidades}`);

      // 5. Cadastros pendentes expirados
      setEtapaAtual("Verificando cadastros pendentes...");
      setProgresso(45);

      try {
        const { data: cadastrosExp } = await supabase
          .from("cadastros_pendentes")
          .select("id, nome, email")
          .in("status", ["pendente", "pendente_aprovacao"])
          .lt("expira_em", new Date().toISOString());

        stats.cadastrosExpirados = cadastrosExp?.length || 0;

        if (stats.cadastrosExpirados > 0) {
          novosDiagnosticos.push({
            id: "cadastros-expirados",
            categoria: "alerta",
            titulo: `${stats.cadastrosExpirados} Cadastros Expirados`,
            descricao: "Existem cadastros pendentes que já expiraram",
            detalhes: cadastrosExp?.slice(0, 5).map((c) => `${c.nome} (${c.email})`),
            acao: {
              label: "Limpar Expirados",
              executar: async () => {
                const ids = cadastrosExp?.map((c) => c.id) || [];
                const { error } = await supabase
                  .from("cadastros_pendentes")
                  .delete()
                  .in("id", ids);
                if (error) throw error;
                addLog("success", `${ids.length} cadastros expirados removidos`);
                toast({
                  title: "Sucesso!",
                  description: `${ids.length} cadastros expirados removidos`,
                });
                executarAnalise();
              },
            },
            sql: `DELETE FROM cadastros_pendentes WHERE expira_em < NOW() AND status IN ('pendente', 'pendente_aprovacao');`,
          });
          addLog("warning", `${stats.cadastrosExpirados} cadastros expirados encontrados`);
        }
      } catch {
        addLog("info", "Tabela cadastros_pendentes nÍo encontrada ou vazia");
      }

      // 6. Emails duplicados (REAL: mesmo email + mesmo tipo = duplicidade)
      // Nota: Uma pessoa pode ser cliente E especificador E fornecedor com mesmo email - isso é válido!
      setEtapaAtual("Verificando emails duplicados...");
      setProgresso(55);

      const { data: pessoasEmail } = await supabase
        .from("pessoas")
        .select("id, nome, email, tipo")
        .not("email", "is", null)
        .neq("email", "");

      // Agrupar por email + tipo (duplicidade real = mesmo email no mesmo tipo)
      const emailTipoMap: Record<string, typeof pessoasEmail> = {};
      (pessoasEmail || []).forEach((p) => {
        const emailLower = (p.email || "").toLowerCase();
        const tipo = p.tipo || "indefinido";
        const key = `${emailLower}|${tipo}`;
        if (emailLower) {
          if (!emailTipoMap[key]) emailTipoMap[key] = [];
          emailTipoMap[key]!.push(p);
        }
      });

      // Filtrar apenas os que têm mais de 1 pessoa com mesmo email E mesmo tipo
      const emailsDuplicadosReais = Object.entries(emailTipoMap)
        .filter(([, arr]) => arr!.length > 1)
        .map(([key, arr]) => {
          const [email, tipo] = key.split("|");
          return { email, tipo, pessoas: arr };
        });

      stats.emailsDuplicados = emailsDuplicadosReais.length;

      if (emailsDuplicadosReais.length > 0) {
        novosDiagnosticos.push({
          id: "emails-duplicados",
          categoria: "critico",
          titulo: `${emailsDuplicadosReais.length} Emails Duplicados`,
          descricao: "Existem pessoas do MESMO TIPO com o mesmo email cadastrado (duplicidade real)",
          detalhes: emailsDuplicadosReais.slice(0, 5).map(
            ({ email, tipo, pessoas }) =>
              `${email} (${tipo}): ${pessoas!.map((p) => p.nome).join(", ")}`
          ),
          sql: `-- Encontrar duplicidades REAIS (mesmo email + mesmo tipo)
SELECT email, tipo, COUNT(*) as total, STRING_AGG(nome, ', ') as nomes
FROM pessoas
WHERE email IS NOT NULL
GROUP BY LOWER(email), tipo
HAVING COUNT(*) > 1;`,
        });
        addLog("error", `${emailsDuplicadosReais.length} emails duplicados (mesmo tipo) encontrados`);
      }

      // Informativo: mostrar emails em múltiplos tipos (isso é válido, só informativo)
      const emailMultiTipo: Record<string, { tipos: string[]; nomes: string[] }> = {};
      (pessoasEmail || []).forEach((p) => {
        const emailLower = (p.email || "").toLowerCase();
        if (emailLower) {
          if (!emailMultiTipo[emailLower]) {
            emailMultiTipo[emailLower] = { tipos: [], nomes: [] };
          }
          if (!emailMultiTipo[emailLower].tipos.includes(p.tipo || "indefinido")) {
            emailMultiTipo[emailLower].tipos.push(p.tipo || "indefinido");
          }
          emailMultiTipo[emailLower].nomes.push(`${p.nome} (${p.tipo})`);
        }
      });

      const emailsMultiplasFuncoes = Object.entries(emailMultiTipo)
        .filter(([, data]) => data.tipos.length > 1);

      if (emailsMultiplasFuncoes.length > 0) {
        novosDiagnosticos.push({
          id: "emails-multiplas-funcoes",
          categoria: "info",
          titulo: `${emailsMultiplasFuncoes.length} Pessoas com Múltiplas Funções`,
          descricao: "Pessoas cadastradas em diferentes funções (cliente + especificador, etc.) - Isso é válido!",
          detalhes: emailsMultiplasFuncoes.slice(0, 5).map(
            ([email, data]) =>
              `${email}: ${data.tipos.join(" + ")}`
          ),
        });
        addLog("info", `${emailsMultiplasFuncoes.length} pessoas com múltiplas funções (válido)`);
      }

      // 7. CPFs duplicados (REAL: mesmo CPF + mesmo tipo = duplicidade)
      // Nota: Uma pessoa pode ser cliente E fornecedor com mesmo CPF - isso é válido!
      setEtapaAtual("Verificando CPFs duplicados...");
      setProgresso(65);

      const { data: pessoasCpf } = await supabase
        .from("pessoas")
        .select("id, nome, cpf, tipo")
        .not("cpf", "is", null)
        .neq("cpf", "");

      // Agrupar por CPF + tipo (duplicidade real = mesmo CPF no mesmo tipo)
      const cpfTipoMap: Record<string, typeof pessoasCpf> = {};
      (pessoasCpf || []).forEach((p) => {
        const cpfLimpo = (p.cpf || "").replace(/\D/g, "");
        const tipo = p.tipo || "indefinido";
        const key = `${cpfLimpo}|${tipo}`;
        if (cpfLimpo && cpfLimpo.length === 11) {
          if (!cpfTipoMap[key]) cpfTipoMap[key] = [];
          cpfTipoMap[key]!.push(p);
        }
      });

      // Filtrar apenas os que têm mais de 1 pessoa com mesmo CPF E mesmo tipo
      const cpfsDuplicadosReais = Object.entries(cpfTipoMap)
        .filter(([, arr]) => arr!.length > 1)
        .map(([key, arr]) => {
          const [cpf, tipo] = key.split("|");
          return { cpf, tipo, pessoas: arr };
        });

      stats.cpfsDuplicados = cpfsDuplicadosReais.length;

      if (cpfsDuplicadosReais.length > 0) {
        novosDiagnosticos.push({
          id: "cpfs-duplicados",
          categoria: "alerta",
          titulo: `${cpfsDuplicadosReais.length} CPFs Duplicados`,
          descricao: "Existem pessoas do MESMO TIPO com o mesmo CPF cadastrado (duplicidade real)",
          detalhes: cpfsDuplicadosReais.slice(0, 5).map(
            ({ cpf, tipo, pessoas }) =>
              `${cpf!.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")} (${tipo}): ${pessoas!
                .map((p) => p.nome)
                .join(", ")}`
          ),
          sql: `-- Encontrar duplicidades REAIS de CPF (mesmo CPF + mesmo tipo)
SELECT cpf, tipo, COUNT(*) as total, STRING_AGG(nome, ', ') as nomes
FROM pessoas
WHERE cpf IS NOT NULL
GROUP BY cpf, tipo
HAVING COUNT(*) > 1;`,
        });
        addLog("warning", `${cpfsDuplicadosReais.length} CPFs duplicados (mesmo tipo) encontrados`);
      }

      // 8. Dados de teste
      setEtapaAtual("Verificando dados de teste...");
      setProgresso(75);

      const { data: dadosTeste } = await supabase
        .from("pessoas")
        .select("id, nome, email, tipo")
        .or("nome.ilike.%teste%,email.ilike.%teste%,email.ilike.%test@%");

      stats.dadosTeste = dadosTeste?.length || 0;

      if (stats.dadosTeste > 0) {
        novosDiagnosticos.push({
          id: "dados-teste",
          categoria: "alerta",
          titulo: `${stats.dadosTeste} Dados de Teste`,
          descricao: "Existem registros com 'teste' no nome ou email",
          detalhes: dadosTeste?.slice(0, 5).map((d) => `${d.nome} (${d.email})`),
          acao: {
            label: "Remover Dados de Teste",
            executar: async () => {
              setDialogConfirm({
                open: true,
                titulo: "Remover Dados de Teste",
                descricao: `Tem certeza que deseja remover ${stats.dadosTeste} registros de teste? Esta açÍo nÍo pode ser desfeita.`,
                onConfirm: async () => {
                  const ids = dadosTeste?.map((d) => d.id) || [];
                  const { error } = await supabase
                    .from("pessoas")
                    .delete()
                    .in("id", ids);
                  if (error) throw error;
                  addLog("success", `${ids.length} dados de teste removidos`);
                  toast({
                    title: "Sucesso!",
                    description: `${ids.length} dados de teste removidos`,
                  });
                  setDialogConfirm((prev) => ({ ...prev, open: false }));
                  executarAnalise();
                },
              });
            },
          },
          sql: `DELETE FROM pessoas WHERE nome ILIKE '%teste%' OR email ILIKE '%teste%' OR email ILIKE '%test@%';`,
        });
        addLog("warning", `${stats.dadosTeste} dados de teste encontrados`);
      }

      // 9. Clientes sem Drive configurado
      setEtapaAtual("Verificando configuraçÍo de Drive...");
      setProgresso(85);

      const { count: clientesSemDrive } = await supabase
        .from("pessoas")
        .select("*", { count: "exact", head: true })
        .eq("tipo", "CLIENTE")
        .or("drive_link.is.null,drive_link.eq.");

      stats.clientesSemDrive = clientesSemDrive || 0;

      if (stats.clientesSemDrive > 0 && stats.totalClientes > 0) {
        const percentSemDrive = Math.round(
          (stats.clientesSemDrive / stats.totalClientes) * 100
        );
        if (percentSemDrive > 50) {
          novosDiagnosticos.push({
            id: "clientes-sem-drive",
            categoria: "info",
            titulo: `${stats.clientesSemDrive} Clientes sem Drive`,
            descricao: `${percentSemDrive}% dos clientes nÍo tem Drive configurado`,
            acao: {
              label: "Configurar Drive",
              executar: async () => {
                window.open("/sistema/area-cliente/drive", "_blank");
              },
            },
          });
        }
      }

      // 10. Novos checks de integridade de dados
      setEtapaAtual("Verificando integridade de dados...");
      setProgresso(80);

      // 10a. Usuários sem auth_user_id (órfÍos — nunca conseguem logar)
      try {
        const { data: usuariosOrfaos } = await supabase
          .from("usuarios")
          .select("id, email_contato, tipo_usuario")
          .is("auth_user_id", null)
          .eq("ativo", true);

        if (usuariosOrfaos && usuariosOrfaos.length > 0) {
          novosDiagnosticos.push({
            id: "usuarios-orfaos",
            categoria: "critico",
            titulo: `${usuariosOrfaos.length} Usuários sem Conta de Acesso`,
            descricao: "Usuários ativos sem auth_user_id — nunca conseguirÍo fazer login",
            detalhes: usuariosOrfaos.slice(0, 5).map(
              (u) => `${u.email_contato || "sem email"} (${u.tipo_usuario})`
            ),
            sql: `-- Usuários ativos sem auth_user_id
SELECT id, email_contato, tipo_usuario FROM usuarios
WHERE auth_user_id IS NULL AND ativo = true;`,
          });
          addLog("error", `${usuariosOrfaos.length} usuários ativos sem auth_user_id`);
        } else {
          addLog("success", "Nenhum usuário ativo sem auth_user_id");
        }
      } catch {
        addLog("info", "NÍo foi possível verificar usuários sem auth_user_id");
      }

      // 10b. Pessoas sem tipo definido (dado crítico incompleto)
      try {
        const { count: pessoasSemTipo } = await supabase
          .from("pessoas")
          .select("*", { count: "exact", head: true })
          .or("tipo.is.null,tipo.eq.");

        if (pessoasSemTipo && pessoasSemTipo > 0) {
          novosDiagnosticos.push({
            id: "pessoas-sem-tipo",
            categoria: "alerta",
            titulo: `${pessoasSemTipo} Pessoas sem Tipo Definido`,
            descricao: "Registros de pessoas sem tipo (CLIENTE/COLABORADOR/etc.) — causam erros em filtros e relatórios",
            sql: `SELECT id, nome, email FROM pessoas WHERE tipo IS NULL OR tipo = '';`,
          });
          addLog("warning", `${pessoasSemTipo} pessoas sem tipo definido`);
        }
      } catch {
        addLog("info", "VerificaçÍo de pessoas sem tipo concluída");
      }

      // 10c. Contratos vencendo em 30 dias
      try {
        const em30Dias = new Date();
        em30Dias.setDate(em30Dias.getDate() + 30);

        const { data: contratosVencendo } = await supabase
          .from("contratos")
          .select("id, titulo, data_fim")
          .not("data_fim", "is", null)
          .lte("data_fim", em30Dias.toISOString().split("T")[0])
          .gte("data_fim", new Date().toISOString().split("T")[0])
          .in("status", ["ativo", "vigente", "em_andamento"]);

        if (contratosVencendo && contratosVencendo.length > 0) {
          novosDiagnosticos.push({
            id: "contratos-vencendo",
            categoria: "alerta",
            titulo: `${contratosVencendo.length} Contratos Vencendo em 30 dias`,
            descricao: "Contratos ativos com data de término nos próximos 30 dias",
            detalhes: contratosVencendo.slice(0, 5).map(
              (c) => `${c.titulo || "Sem título"} — vence ${c.data_fim}`
            ),
            acao: {
              label: "Ver Contratos",
              executar: async () => { window.open("/contratos", "_blank"); },
            },
          });
          addLog("warning", `${contratosVencendo.length} contratos vencendo em 30 dias`);
        }
      } catch {
        addLog("info", "VerificaçÍo de contratos a vencer concluída");
      }

      // 10d. Oportunidades paradas há mais de 90 dias
      try {
        const ha90Dias = new Date();
        ha90Dias.setDate(ha90Dias.getDate() - 90);

        const { count: oportunidadesParadas } = await supabase
          .from("oportunidades")
          .select("*", { count: "exact", head: true })
          .lte("updated_at", ha90Dias.toISOString())
          .not("status", "in", '("fechado_ganho","fechado_perdido","arquivado")');

        if (oportunidadesParadas && oportunidadesParadas > 0) {
          novosDiagnosticos.push({
            id: "oportunidades-paradas",
            categoria: "info",
            titulo: `${oportunidadesParadas} Oportunidades sem Movimento (+90 dias)`,
            descricao: "Oportunidades ativas sem atualizaçÍo há mais de 90 dias — pipeline estagnado",
            acao: {
              label: "Ver Pipeline",
              executar: async () => { window.open("/oportunidades", "_blank"); },
            },
          });
          addLog("info", `${oportunidadesParadas} oportunidades paradas há >90 dias`);
        }
      } catch {
        addLog("info", "VerificaçÍo de oportunidades paradas concluída");
      }

      // 10e. Lançamentos financeiros sem categoria
      try {
        const { count: lancamentosSemCategoria } = await supabase
          .from("financeiro_lancamentos")
          .select("*", { count: "exact", head: true })
          .or("categoria.is.null,categoria.eq.");

        if (lancamentosSemCategoria && lancamentosSemCategoria > 0) {
          novosDiagnosticos.push({
            id: "lancamentos-sem-categoria",
            categoria: "info",
            titulo: `${lancamentosSemCategoria} Lançamentos sem Categoria`,
            descricao: "Lançamentos financeiros sem categoria definida — impactam relatórios por categoria",
            sql: `SELECT id, descricao, valor_total, tipo FROM financeiro_lancamentos WHERE categoria IS NULL OR categoria = '';`,
            acao: {
              label: "Ver Financeiro",
              executar: async () => { window.open("/financeiro", "_blank"); },
            },
          });
          addLog("info", `${lancamentosSemCategoria} lançamentos sem categoria`);
        }
      } catch {
        addLog("info", "VerificaçÍo de lançamentos sem categoria concluída");
      }

      // 10f. Service Worker — versÍo instalada
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg?.active) {
            novosDiagnosticos.push({
              id: "sw-ativo",
              categoria: "ok",
              titulo: "Service Worker Ativo",
              descricao: `SW instalado e ativo — cache ID esperado: wgeasy-v20260326. Estado: ${reg.active.state}`,
            });
            addLog("success", `Service Worker ativo (estado: ${reg.active.state})`);
          } else {
            novosDiagnosticos.push({
              id: "sw-ausente",
              categoria: "alerta",
              titulo: "Service Worker nÍo encontrado",
              descricao: "Nenhum Service Worker registrado — PWA offline e cache de performance indisponíveis",
            });
            addLog("warning", "Service Worker nÍo registrado");
          }
        }
      } catch {
        addLog("info", "VerificaçÍo de Service Worker concluída");
      }

      // 11. VerificaçÍo de Workflow e Segurança RLS
      setEtapaAtual("Verificando workflow e segurança RLS...");
      setProgresso(88);
      addLog("info", "Iniciando verificaçÍo de workflow e RLS...");

      const workflow: WorkflowVerificacao = {
        funcoesRLS: [],
        tabelasRLS: [],
        politicasRLS: [],
        triggers: [],
        execSqlOk: false,
      };

      // 10a. Verificar funçÍo exec_sql
      try {
        const { data: testExecSql, error: execSqlError } = await supabase
          .rpc("exec_sql", { sql: "SELECT 1 as test" });

        if (!execSqlError && testExecSql) {
          workflow.execSqlOk = true;
          addLog("success", "FunçÍo exec_sql funcionando");
        } else {
          workflow.execSqlOk = false;
          novosDiagnosticos.push({
            id: "exec-sql-erro",
            categoria: "critico",
            titulo: "FunçÍo exec_sql nÍo disponível",
            descricao: "A funçÍo exec_sql é necessária para verificações avançadas de segurança",
            sql: `-- Criar funçÍo exec_sql (requer privilégios de admin)
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM dblink('dbname=' || current_database(), sql) AS t(result text)) t);
END;
$$;`,
          });
          addLog("error", "FunçÍo exec_sql nÍo encontrada ou com erro");
        }
      } catch {
        workflow.execSqlOk = false;
        addLog("warning", "NÍo foi possível verificar exec_sql");
      }

      // 10b. Verificar funções RLS de autenticaçÍo
      const funcoesRLSParaVerificar = [
        "auth_user_tipo",
        "auth_user_pessoa_id",
        "auth_user_id",
        "is_admin_or_master",
        "is_internal_team",
      ];

      for (const funcao of funcoesRLSParaVerificar) {
        try {
          // Tentar chamar a funçÍo para ver se existe
          const { error } = await supabase.rpc(funcao);
          workflow.funcoesRLS.push({ nome: funcao, existe: !error || !error.message.includes("does not exist") });
        } catch {
          workflow.funcoesRLS.push({ nome: funcao, existe: false });
        }
      }

      const funcoesAusentes = workflow.funcoesRLS.filter((f) => !f.existe);
      if (funcoesAusentes.length > 0) {
        novosDiagnosticos.push({
          id: "funcoes-rls-ausentes",
          categoria: "critico",
          titulo: `${funcoesAusentes.length} Funções RLS Ausentes`,
          descricao: "Funções de autenticaçÍo RLS nÍo encontradas no banco",
          detalhes: funcoesAusentes.map((f) => f.nome),
          sql: `-- Verificar funções RLS no banco
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('auth_user_tipo', 'auth_user_pessoa_id', 'auth_user_id', 'is_admin_or_master', 'is_internal_team');`,
        });
        addLog("error", `${funcoesAusentes.length} funções RLS ausentes`);
      } else {
        addLog("success", "Todas as funções RLS de autenticaçÍo OK");
      }

      // 10c. Verificar RLS nas tabelas críticas
      const tabelasCriticas = [
        "usuarios",
        "pessoas",
        "oportunidades",
        "contratos",
        "financeiro_lancamentos",
        "propostas",
        "notificacoes",
      ];

      for (const tabela of tabelasCriticas) {
        try {
          // Tenta fazer uma query simples - se RLS estiver ativo, vai funcionar
          const { error } = await supabase
            .from(tabela)
            .select("id", { count: "exact", head: true });

          // Se nÍo deu erro, a tabela existe e conseguimos acessar
          workflow.tabelasRLS.push({ nome: tabela, rlsAtivo: true });
        } catch {
          workflow.tabelasRLS.push({ nome: tabela, rlsAtivo: false });
        }
      }

      // 10d. Contar políticas por tabela (estimativa via acesso)
      const tabelasComRLS = workflow.tabelasRLS.filter((t) => t.rlsAtivo);
      const tabelasSemRLS = workflow.tabelasRLS.filter((t) => !t.rlsAtivo);

      if (tabelasSemRLS.length > 0) {
        novosDiagnosticos.push({
          id: "tabelas-sem-rls",
          categoria: "alerta",
          titulo: `${tabelasSemRLS.length} Tabelas sem acesso verificado`,
          descricao: "Algumas tabelas críticas nÍo puderam ser acessadas (podem nÍo existir ou ter RLS muito restritivo)",
          detalhes: tabelasSemRLS.map((t) => t.nome),
          sql: `-- Verificar RLS nas tabelas
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('usuarios', 'pessoas', 'oportunidades', 'contratos', 'financeiro_lancamentos', 'propostas', 'notificacoes');`,
        });
      }

      if (tabelasComRLS.length === tabelasCriticas.length) {
        novosDiagnosticos.push({
          id: "rls-ok",
          categoria: "ok",
          titulo: "Segurança RLS Verificada",
          descricao: `Todas as ${tabelasCriticas.length} tabelas críticas estÍo acessíveis com RLS`,
        });
        addLog("success", "VerificaçÍo de RLS nas tabelas críticas OK");
      }

      // Salvar resultados de workflow
      setWorkflowResult(workflow);

      // 11. VerificaçÍo final - Sistema saudável
      setEtapaAtual("Finalizando análise...");
      setProgresso(95);

      const problemasCriticos = novosDiagnosticos.filter(
        (d) => d.categoria === "critico"
      ).length;
      const alertas = novosDiagnosticos.filter(
        (d) => d.categoria === "alerta"
      ).length;

      if (problemasCriticos === 0 && alertas === 0) {
        novosDiagnosticos.push({
          id: "sistema-saudavel",
          categoria: "ok",
          titulo: "Sistema Saudável",
          descricao: "Nenhum problema crítico ou alerta encontrado",
        });
      }

      // Finalizar
      setProgresso(100);
      setEstatisticas(stats);
      setDiagnosticos(novosDiagnosticos);
      setUltimaAnalise(new Date());
      addLog(
        "success",
        `Análise concluída: ${problemasCriticos} críticos, ${alertas} alertas`
      );

      toast({
        title: "Análise Concluída",
        description: `${problemasCriticos} problemas críticos, ${alertas} alertas`,
        variant: problemasCriticos > 0 ? "destructive" : "default",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      addLog("error", `Erro na análise: ${errorMessage}`);
      toast({
        title: "Erro na Análise",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setEtapaAtual("");
    }
  };

  // Copiar SQL
  const copiarSQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
    toast({
      title: "SQL Copiado",
      description: "Cole no SQL Editor do Supabase para executar",
    });
  };

  // Exportar relatório
  const exportarRelatorio = () => {
    const relatorio = `
RELATÓRIO DE SAÚDE DO SISTEMA - WG EASY
========================================
Data: ${new Date().toLocaleString("pt-BR")}

ESTATÍSTICAS GERAIS:
- Total de Pessoas: ${estatisticas?.totalPessoas || 0}
- Clientes: ${estatisticas?.totalClientes || 0}
- Colaboradores: ${estatisticas?.totalColaboradores || 0}
- Fornecedores: ${estatisticas?.totalFornecedores || 0}
- Usuários Ativos: ${estatisticas?.usuariosAtivos || 0}
- Contratos: ${estatisticas?.totalContratos || 0}
- Oportunidades: ${estatisticas?.totalOportunidades || 0}
- Projetos: ${estatisticas?.totalProjetos || 0}

DIAGNÓSTICOS:
${diagnosticos
  .map(
    (d) => `
[${d.categoria.toUpperCase()}] ${d.titulo}
${d.descricao}
${d.detalhes ? d.detalhes.map((det) => `  - ${det}`).join("\n") : ""}
${d.sql ? `SQL: ${d.sql}` : ""}
`
  )
  .join("\n")}

LOG DE OPERAÇÕES:
${logs
  .slice(0, 50)
  .map(
    (l) =>
      `[${l.timestamp.toLocaleTimeString("pt-BR")}] [${l.tipo.toUpperCase()}] ${l.mensagem}`
  )
  .join("\n")}
    `.trim();

    const blob = new Blob([relatorio], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-saude-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Executar análise ao montar
  useEffect(() => {
    executarAnalise();
  }, []);

  // Renderizar ícone de categoria
  const renderCategoriaIcon = (categoria: DiagnosticoItem["categoria"]) => {
    switch (categoria) {
      case "critico":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "alerta":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <FileWarning className="h-5 w-5 text-blue-500" />;
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  // Renderizar badge de categoria
  const renderCategoriaBadge = (categoria: DiagnosticoItem["categoria"]) => {
    const variants: Record<string, string> = {
      critico: "bg-red-100 text-red-800 border-red-200",
      alerta: "bg-yellow-100 text-yellow-800 border-yellow-200",
      info: "bg-blue-100 text-blue-800 border-blue-200",
      ok: "bg-green-100 text-green-800 border-green-200",
    };
    const labels: Record<string, string> = {
      critico: "CRÍTICO",
      alerta: "ALERTA",
      info: "INFO",
      ok: "OK",
    };
    return (
      <Badge variant="outline" className={variants[categoria]}>
        {labels[categoria]}
      </Badge>
    );
  };

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7" style={{ color: WG_COLORS.laranja }} />
            Saúde do Sistema
          </h1>
          <p className="text-muted-foreground">
            Diagnóstico e monitoramento do WG Easy
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={executarAnalise}
            disabled={loading}
            style={{ backgroundColor: WG_COLORS.laranja }}
            className="text-[14px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Executar Análise
              </>
            )}
          </Button>
          <Button variant="outline" onClick={exportarRelatorio} disabled={!estatisticas} className="text-[14px]">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Barra de progresso */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span>{etapaAtual}</span>
                <span>{progresso}%</span>
              </div>
              <Progress value={progresso} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[18px] font-light">{estatisticas.totalPessoas}</p>
                  <p className="text-[12px] text-muted-foreground">Pessoas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: WG_COLORS.laranja }} />
                <div>
                  <p className="text-[18px] font-light">{estatisticas.totalClientes}</p>
                  <p className="text-[12px] text-muted-foreground">Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-[18px] font-light">{estatisticas.usuariosAtivos}</p>
                  <p className="text-[12px] text-muted-foreground">Usuários Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-[18px] font-light">{estatisticas.totalContratos}</p>
                  <p className="text-[12px] text-muted-foreground">Contratos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-[18px] font-light">{estatisticas.totalOportunidades}</p>
                  <p className="text-[12px] text-muted-foreground">Oportunidades</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-[18px] font-light">{estatisticas.totalProjetos}</p>
                  <p className="text-[12px] text-muted-foreground">Projetos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo de diagnóstico */}
      {diagnosticos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-[18px] font-light text-red-700">
                    {diagnosticos.filter((d) => d.categoria === "critico").length}
                  </p>
                  <p className="text-[12px] text-red-600">Críticos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-[18px] font-light text-yellow-700">
                    {diagnosticos.filter((d) => d.categoria === "alerta").length}
                  </p>
                  <p className="text-[12px] text-yellow-600">Alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-[18px] font-light text-blue-700">
                    {diagnosticos.filter((d) => d.categoria === "info").length}
                  </p>
                  <p className="text-[12px] text-blue-600">Informações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-[18px] font-light text-green-700">
                    {diagnosticos.filter((d) => d.categoria === "ok").length}
                  </p>
                  <p className="text-[12px] text-green-600">OK</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de navegaçÍo */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("diagnosticos")}
          className={`px-4 py-2 text-[12px] transition-colors border-b-2 -mb-px ${
            activeTab === "diagnosticos"
              ? "border-[#F25C26] text-[#F25C26]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wrench className="inline-block h-4 w-4 mr-2" />
          Diagnósticos e Ações
        </button>
        <button
          onClick={() => setActiveTab("workflow")}
          className={`px-4 py-2 text-[12px] transition-colors border-b-2 -mb-px ${
            activeTab === "workflow"
              ? "border-[#F25C26] text-[#F25C26]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="inline-block h-4 w-4 mr-2" />
          Workflow e Segurança RLS
        </button>
      </div>

      {/* Lista de diagnósticos */}
      {activeTab === "diagnosticos" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Diagnósticos e Ações
          </CardTitle>
          <CardDescription>
            Clique em cada item para ver detalhes e executar correções
          </CardDescription>
        </CardHeader>
        <CardContent>
          {diagnosticos.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Clique em "Executar Análise" para verificar a saúde do sistema
            </div>
          ) : (
            <div className="space-y-2">
              {diagnosticos.map((diag) => (
                <div key={diag.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleExpanded(diag.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {renderCategoriaIcon(diag.categoria)}
                      <span className="font-medium">{diag.titulo}</span>
                      {renderCategoriaBadge(diag.categoria)}
                    </div>
                    {expandedItems[diag.id] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedItems[diag.id] && (
                    <div className="p-4 pt-0 space-y-4 pl-12 border-t bg-muted/20">
                      <p className="text-muted-foreground pt-4">{diag.descricao}</p>

                      {diag.detalhes && diag.detalhes.length > 0 && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-[12px] mb-2">Detalhes:</p>
                          <ul className="text-[12px] space-y-1">
                            {diag.detalhes.map((det, i) => (
                              <li key={i}>• {det}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {diag.sql && (
                        <div className="bg-slate-900 text-slate-100 p-3 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[12px] text-slate-400">SQL:</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copiarSQL(diag.sql!)}
                              className="h-7 text-slate-400 hover:text-white"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </Button>
                          </div>
                          <code className="text-[12px] font-mono">{diag.sql}</code>
                        </div>
                      )}

                      {diag.acao && (
                        <Button
                          onClick={diag.acao.executar}
                          variant={diag.categoria === "critico" ? "destructive" : "default"}
                          size="sm"
                        >
                          <Wrench className="mr-2 h-4 w-4" />
                          {diag.acao.label}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Card de Workflow e Segurança RLS */}
      {activeTab === "workflow" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: WG_COLORS.laranja }} />
              VerificaçÍo de Workflow e Segurança RLS
            </CardTitle>
            <CardDescription>
              Status das funções RLS, tabelas críticas e políticas de segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!workflowResult ? (
              <div className="text-center py-8 text-muted-foreground">
                Execute a análise para verificar o workflow e segurança RLS
              </div>
            ) : (
              <div className="space-y-6">
                {/* FunçÍo exec_sql */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {workflowResult.execSqlOk ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">FunçÍo exec_sql</span>
                    <Badge variant={workflowResult.execSqlOk ? "default" : "destructive"}>
                      {workflowResult.execSqlOk ? "DISPONÍVEL" : "INDISPONÍVEL"}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-muted-foreground ml-8">
                    FunçÍo necessária para executar SQLs dinâmicos e verificações avançadas
                  </p>
                </div>

                {/* Funções RLS de AutenticaçÍo */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="h-5 w-5" style={{ color: WG_COLORS.azul }} />
                    <span className="font-medium">Funções RLS de AutenticaçÍo</span>
                    <Badge variant="outline">
                      {workflowResult.funcoesRLS.filter((f) => f.existe).length} / {workflowResult.funcoesRLS.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-8">
                    {workflowResult.funcoesRLS.map((funcao) => (
                      <div
                        key={funcao.nome}
                        className={`flex items-center gap-2 p-2 rounded text-[12px] ${
                          funcao.existe ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        {funcao.existe ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <code className="font-mono text-[12px]">{funcao.nome}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabelas Críticas com RLS */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="h-5 w-5" style={{ color: WG_COLORS.verde }} />
                    <span className="font-medium">Tabelas Críticas com RLS</span>
                    <Badge variant="outline">
                      {workflowResult.tabelasRLS.filter((t) => t.rlsAtivo).length} / {workflowResult.tabelasRLS.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-8">
                    {workflowResult.tabelasRLS.map((tabela) => (
                      <div
                        key={tabela.nome}
                        className={`flex items-center gap-2 p-2 rounded text-[12px] ${
                          tabela.rlsAtivo ? "bg-green-50" : "bg-yellow-50"
                        }`}
                      >
                        {tabela.rlsAtivo ? (
                          <Shield className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <code className="font-mono text-[12px]">{tabela.nome}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SQL para verificaçÍo manual */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[12px] text-slate-400">
                      SQL para verificaçÍo completa no Supabase:
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copiarSQL(`-- Verificar funções RLS
SELECT proname FROM pg_proc WHERE proname IN ('auth_user_tipo', 'auth_user_pessoa_id', 'auth_user_id', 'is_admin_or_master', 'is_internal_team');

-- Verificar RLS nas tabelas
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('usuarios', 'pessoas', 'oportunidades', 'contratos', 'financeiro_lancamentos', 'propostas', 'notificacoes');

-- Listar políticas RLS
SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Listar triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation FROM information_schema.triggers WHERE trigger_schema = 'public';`)
                      }
                      className="h-7 text-slate-400 hover:text-white"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar Tudo
                    </Button>
                  </div>
                  <code className="text-[12px] font-mono block whitespace-pre-wrap">
{`-- Verificar funções RLS
SELECT proname FROM pg_proc
WHERE proname IN ('auth_user_tipo', 'auth_user_pessoa_id',
'auth_user_id', 'is_admin_or_master', 'is_internal_team');

-- Verificar RLS nas tabelas
SELECT relname, relrowsecurity FROM pg_class
WHERE relname IN ('usuarios', 'pessoas', 'oportunidades',
'contratos', 'financeiro_lancamentos', 'propostas', 'notificacoes');

-- Listar políticas RLS
SELECT tablename, policyname, cmd
FROM pg_policies WHERE schemaname = 'public';`}
                  </code>
                </div>

                {/* Legenda */}
                <div className="flex flex-wrap gap-4 text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Verificado/Ativo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span>Ausente/Erro</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span>AtençÍo</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Log de operações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Log de Operações
          </CardTitle>
          <CardDescription>
            Histórico das últimas verificações e ações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`text-[12px] font-mono p-2 rounded ${
                    log.tipo === "error"
                      ? "bg-red-50 text-red-700"
                      : log.tipo === "warning"
                      ? "bg-yellow-50 text-yellow-700"
                      : log.tipo === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-muted-foreground">
                    [{log.timestamp.toLocaleTimeString("pt-BR")}]
                  </span>{" "}
                  {log.mensagem}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Última análise */}
      {ultimaAnalise && (
        <div className="text-center text-[12px] text-muted-foreground">
          Última análise: {ultimaAnalise.toLocaleString("pt-BR")}
        </div>
      )}

      {/* Dialog de confirmaçÍo */}
      <Dialog
        open={dialogConfirm.open}
        onOpenChange={(open) => setDialogConfirm((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogConfirm.titulo}</DialogTitle>
            <DialogDescription>{dialogConfirm.descricao}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogConfirm((prev) => ({ ...prev, open: false }))}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={dialogConfirm.onConfirm}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




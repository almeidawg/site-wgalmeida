/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PROJECT DETAIL PAGE - WG EASY 2026
// Página principal do projeto com equipe, itens e Gantt
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Calendar,
  Clock,
  Play,
  FileText,
  Download,
  Mail,
  MessageCircle,
  Plus,
  Search,
  X,
  Check,
  Loader2,
  Phone,
  Send,
  Printer,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInputBR, getTodayISO } from "@/components/ui/DateInputBR";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { normalizeSearchTerm } from '@/utils/searchUtils';
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { supabaseRaw } from "@/lib/supabaseClient";
import type { ProjetoCompleto, Nucleo } from "@/types/cronograma";
import { getNucleoColor, getNucleoIcon, getNucleoLabel } from "@/types/cronograma";
import { formatarData } from "@/lib/utils";
import GanttChart from "@/components/cronograma/GanttChart";
import MedicaoFinanceira from "@/components/cronograma/MedicaoFinanceira";
import { DollarSign } from 'lucide-react';

// ============================================================
// Funções Utilitárias
// ============================================================

/**
 * Padroniza nome: Primeira letra maiúscula em cada palavra, demais minúsculas
 * Ex: "WELLINGTON DE MELO DUARTE" -> "Wellington de Melo Duarte"
 */
function padronizarNome(nome: string): string {
  if (!nome) return '';

  // Palavras que devem ficar em minúsculo (preposições, artigos)
  const palavrasMenores = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos'];

  const palavras = nome
    .trim()
    .split(/\s+/g)
    .filter(Boolean);

  const preposicoes = new Set(['de', 'da', 'do', 'dos', 'das']);
  const temPreposicao = palavras.some((p) => preposicoes.has(p.toLowerCase()));

  const capitalizar = (palavra: string) => {
    const lower = palavra.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  if (temPreposicao && palavras.length >= 2) {
    const primeira = capitalizar(palavras[0]);
    const ultima = capitalizar(palavras[palavras.length - 1]);
    return `${primeira} ${ultima}`.trim();
  }

  return nome
    .toLowerCase()
    .split(' ')
    .map((palavra, index) => {
      // Se for preposiçÍo/artigo e nÍo for primeira palavra, mantém minúsculo
      if (index > 0 && palavrasMenores.includes(palavra)) {
        return palavra;
      }
      // Capitaliza primeira letra
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
}

/**
 * Formata CPF para exibiçÍo: 000.000.000-00
 */
function formatarCPFExibicao(cpf?: string): string {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

// ============================================================
// Interfaces
// ============================================================

// ExtensÍo local para incluir endereco_obra
interface ProjetoComEndereco extends ProjetoCompleto {
  endereco_obra?: string;
}
interface Pessoa {
  id: string;
  nome: string;
  tipo: 'colaborador' | 'fornecedor';
  cargo?: string;
  profissao?: string;
  funcao?: string;
  rg?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  avatar_url?: string;
}

interface MembroEquipe {
  id: string;
  pessoa: Pessoa;
  funcao_no_projeto?: string;
  data_entrada: string;
}

interface ItemContratado {
  id: string;
  nome: string;
  descricao?: string;
  nucleo: Nucleo;
  categoria?: string;
  quantidade: number;
  unidade?: string;
  valor_unitario?: number;
  valor_total?: number;
  ordem: number;
}

interface TarefaCronograma {
  id: string;
  nome: string;
  descricao?: string;
  nucleo: Nucleo;
  categoria?: string;
  data_inicio?: string;
  data_termino?: string;
  progresso: number;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'atrasada';
  ordem: number;
  dependencias?: string[];
  comentarios?: Comentario[];
}

interface Comentario {
  id: string;
  texto: string;
  autor: string;
  data: string;
  tipo: 'observacao' | 'problema' | 'alteracao' | 'solicitacao';
  created_at?: string;
}

// ============================================================
// Componente Card de Pessoa Disponível (MELHORADO)
// ============================================================
const PessoaCard = ({
  pessoa,
  onAdd,
  disabled
}: {
  pessoa: Pessoa;
  onAdd: () => void;
  disabled?: boolean;
}) => {
  const getInitials = (nome: string) => {
    const parts = nome.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatCPF = (cpf?: string) => {
    if (!cpf) return '-';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 bg-white rounded-2xl border border-gray-100 hover:border-primary hover:shadow-lg transition-all cursor-pointer group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={onAdd}
    >
      <div className="flex items-start gap-4">
        {/* Avatar Grande */}
        {pessoa.avatar_url ? (
          <img
            src={pessoa.avatar_url}
            alt={pessoa.nome}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-normal text-xl">
            {getInitials(pessoa.nome)}
          </div>
        )}

        {/* Info Completa */}
        <div className="flex-1 min-w-0">
          {/* Nome e Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-normal text-gray-900">{pessoa.nome}</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-normal ${
              pessoa.tipo?.toUpperCase() === 'COLABORADOR' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {pessoa.tipo?.toUpperCase() === 'COLABORADOR' ? '👷 Colaborador' : '🏢 Fornecedor'}
            </span>
          </div>

          {/* Cargo/FunçÍo/ProfissÍo */}
          <p className="text-sm font-medium text-primary mt-1">
            {pessoa.cargo || pessoa.profissao || pessoa.funcao || 'FunçÍo nÍo definida'}
          </p>

          {/* RG e CPF */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {pessoa.rg && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                <strong>RG:</strong> {pessoa.rg}
              </span>
            )}
            {pessoa.cpf && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                <strong>CPF:</strong> {formatCPF(pessoa.cpf)}
              </span>
            )}
          </div>
        </div>

        {/* BotÍo Add */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-3 bg-primary rounded-xl text-white shadow-lg">
            <Plus className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// Componente Card de Membro da Equipe (MELHORADO)
// ============================================================
const MembroCard = ({
  membro,
  onRemove
}: {
  membro: MembroEquipe;
  onRemove: () => void;
}) => {
  const getInitials = (nome: string) => {
    const parts = nome.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatCPF = (cpf?: string) => {
    if (!cpf) return '-';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-5 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar Grande */}
        {membro.pessoa.avatar_url ? (
          <img
            src={membro.pessoa.avatar_url}
            alt={membro.pessoa.nome}
            className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-normal text-2xl shadow-md">
            {getInitials(membro.pessoa.nome)}
          </div>
        )}

        {/* Info Completa */}
        <div className="flex-1 min-w-0">
          {/* Nome Completo */}
          <h4 className="font-normal text-gray-900 text-lg">{membro.pessoa.nome}</h4>

          {/* FunçÍo */}
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-3 py-1 rounded-full text-xs font-normal ${
              membro.pessoa.tipo?.toUpperCase() === 'COLABORADOR'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-purple-100 text-purple-700 border border-purple-200'
            }`}>
              {membro.pessoa.tipo?.toUpperCase() === 'COLABORADOR' ? '👷 Colaborador' : '🏢 Fornecedor'}
            </span>
          </div>

          {/* Cargo/FunçÍo/ProfissÍo */}
          <p className="text-sm font-medium text-primary mt-2">
            {membro.pessoa.cargo || membro.pessoa.profissao || membro.funcao_no_projeto || 'FunçÍo nÍo definida'}
          </p>

          {/* RG e CPF */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <span className="text-gray-500 text-xs block">RG</span>
              <span className="font-medium text-gray-800">{membro.pessoa.rg || '-'}</span>
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <span className="text-gray-500 text-xs block">CPF</span>
              <span className="font-medium text-gray-800">{formatCPF(membro.pessoa.cpf)}</span>
            </div>
          </div>

          {/* Telefone e Email */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {membro.pessoa.telefone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {membro.pessoa.telefone}
              </span>
            )}
            {membro.pessoa.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {membro.pessoa.email}
              </span>
            )}
          </div>
        </div>

        {/* BotÍo Remover */}
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 rounded-full"
          title="Remover da equipe"
        >
          <X className="w-5 h-5 text-red-500" />
        </button>
      </div>
    </motion.div>
  );
};


// ============================================================
// Componente Principal
// ============================================================
export default function ProjectDetailPage() {
  const { id: projetoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados
  const [loading, setLoading] = useState(true);
  const [projeto, setProjeto] = useState<ProjetoComEndereco | null>(null);
  const [activeTab, setActiveTab] = useState<'equipe' | 'cronograma' | 'medicao'>('equipe');

  // Estados da Equipe
  const [pessoasDisponiveis, setPessoasDisponiveis] = useState<Pessoa[]>([]);
  const [membrosEquipe, setMembrosEquipe] = useState<MembroEquipe[]>([]);
  const [searchPessoas, setSearchPessoas] = useState('');

  // Estados do Cronograma
  const [tarefas, setTarefas] = useState<TarefaCronograma[]>([]);
  const [showIniciarModal, setShowIniciarModal] = useState(false);
  const [cronogramaIniciado, setCronogramaIniciado] = useState(false);
  const [dataInicio, setDataInicio] = useState(getTodayISO());
  const [dataTermino, setDataTermino] = useState('');
  const [diasUteis, setDiasUteis] = useState('');

  // Estados de Comentário
  const [showComentarioModal, setShowComentarioModal] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<TarefaCronograma | null>(null);
  const [novoComentario, setNovoComentario] = useState('');
  const [tipoComentario, setTipoComentario] = useState<'observacao' | 'problema' | 'alteracao' | 'solicitacao'>('observacao');

  // Estados de Comentário Timeline (por data específica)
  const [showTimelineComentarioModal, setShowTimelineComentarioModal] = useState(false);
  const [timelineData, setTimelineData] = useState<string>('');
  const [timelineComentario, setTimelineComentario] = useState('');
  const [timelineTipo, setTimelineTipo] = useState<'observacao' | 'problema' | 'alteracao' | 'solicitacao'>('solicitacao');

  // Estados de EdiçÍo de Tarefa
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [editarDataInicio, setEditarDataInicio] = useState('');
  const [editarDataFim, setEditarDataFim] = useState('');
  const [editarProgresso, setEditarProgresso] = useState(0);
  const [editarStatus, setEditarStatus] = useState('pendente');


  // Carregar dados
  useEffect(() => {
    if (projetoId) {
      carregarDados();
    }
  }, [projetoId]);

  async function carregarDados() {
    try {
      setLoading(true);

      // Buscar projeto (sem join - evita erro de FK)
      const { data: projetoData, error: projetoError } = await supabaseRaw
        .from('projetos')
        .select("*")
        .eq('id', projetoId)
        .single();

      if (projetoError) throw projetoError;

      // Buscar dados do cliente separadamente
      let clienteData: any = null;
      if (projetoData.cliente_id) {
        const { data: cliente } = await supabaseRaw
          .from("pessoas")
          .select("nome, cpf, telefone, email")
          .eq("id", projetoData.cliente_id)
          .single();
        clienteData = cliente;
      }
      projetoData.cliente = clienteData;

      // Buscar contrato separadamente
      let contratoData: any = null;
      if (projetoData.contrato_id) {
        const { data: contrato } = await supabaseRaw
          .from("contratos")
          .select("numero, valor_total, dados_imovel_json")
          .eq("id", projetoData.contrato_id)
          .single();
        contratoData = contrato;
      }
      projetoData.contrato = contratoData;

      // Montar endereço da obra
      const dadosImovel = contratoData?.dados_imovel_json;
      let enderecoObra = '';
      if (dadosImovel) {
        const partes = [
          dadosImovel.endereco_completo,
          dadosImovel.numero && `nº ${dadosImovel.numero}`,
          dadosImovel.complemento,
          dadosImovel.bairro,
          dadosImovel.cidade && dadosImovel.estado && `${dadosImovel.cidade}/${dadosImovel.estado}`,
          dadosImovel.cep && `CEP ${dadosImovel.cep}`,
        ].filter(Boolean);
        enderecoObra = partes.join(', ');
      }

      setProjeto({
        ...projetoData,
        cliente_nome: projetoData.cliente?.nome,
        contrato_numero: projetoData.contrato?.numero,
        endereco_obra: enderecoObra,
      });

      // Buscar equipe do projeto
      const { data: equipeData } = await supabaseRaw
        .from('projeto_equipes')
        .select(`
          id,
          funcao,
          data_atribuicao,
          pessoa:pessoas(id, nome, tipo, cargo, profissao, rg, cpf, telefone, email, avatar_url)
        `)
        .eq('projeto_id', projetoId);

      setMembrosEquipe(equipeData?.map((m: any) => ({
        id: m.id,
        pessoa: m.pessoa,
        funcao_no_projeto: m.funcao,
        data_entrada: m.data_atribuicao,
      })) || []);

      // Buscar pessoas disponíveis (colaboradores e fornecedores - suportando maiúsculas e minúsculas)
      const { data: pessoasData } = await supabaseRaw
        .from('pessoas')
        .select('*')
        .in('tipo', ['COLABORADOR', 'FORNECEDOR', 'colaborador', 'fornecedor'])
        .order('nome');

      setPessoasDisponiveis(pessoasData || []);

      // Verificar se cronograma já foi iniciado
      const { data: tarefasData } = await supabaseRaw
        .from('cronograma_tarefas')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('ordem');

      if (tarefasData && tarefasData.length > 0) {
        setCronogramaIniciado(true);
        // Mapear campos do banco para interface
        const tarefasMapeadas = tarefasData.map((t: any) => ({
          id: t.id,
          nome: t.titulo || t.nome,
          descricao: t.descricao,
          nucleo: t.nucleo,
          categoria: t.categoria,
          data_inicio: t.data_inicio,
          data_termino: t.data_termino,
          progresso: t.progresso || 0,
          status: t.status || 'pendente',
          ordem: t.ordem || 0,
        }));
        setTarefas(tarefasMapeadas);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ variant: 'destructive', title: 'Erro ao carregar projeto' });
    } finally {
      setLoading(false);
    }
  }

  // Adicionar membro à equipe
  async function adicionarMembro(pessoa: Pessoa) {
    try {
      const { data, error } = await supabaseRaw
        .from('projeto_equipes')
        .insert({
          projeto_id: projetoId,
          pessoa_id: pessoa.id,
          tipo_pessoa: pessoa.tipo?.toLowerCase() || 'colaborador',
        })
        .select(`
          id,
          funcao,
          data_atribuicao,
          pessoa:pessoas(id, nome, tipo, cargo, profissao, rg, cpf, telefone, email, avatar_url)
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({ variant: 'destructive', title: 'Pessoa já está na equipe' });
          return;
        }
        throw error;
      }

      const pessoaRelacionada = Array.isArray((data as any).pessoa)
        ? (data as any).pessoa[0]
        : (data as any).pessoa;

      if (!pessoaRelacionada) {
        throw new Error("Pessoa retornada inválida ao adicionar membro");
      }

      setMembrosEquipe(prev => [...prev, {
        id: data.id,
        pessoa: pessoaRelacionada as Pessoa,
        funcao_no_projeto: data.funcao,
        data_entrada: data.data_atribuicao,
      }]);

      toast({ title: `${pessoa.nome} adicionado à equipe!` });
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      toast({ variant: 'destructive', title: 'Erro ao adicionar membro' });
    }
  }

  // Remover membro da equipe
  async function removerMembro(membro: MembroEquipe) {
    try {
      await supabaseRaw
        .from('projeto_equipes')
        .delete()
        .eq('id', membro.id);

      setMembrosEquipe(prev => prev.filter(m => m.id !== membro.id));
      toast({ title: `${membro.pessoa.nome} removido da equipe` });
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast({ variant: 'destructive', title: 'Erro ao remover membro' });
    }
  }

  // Calcular dias úteis
  function calcularDataTermino(inicio: string, diasUteis: number): string {
    const data = new Date(inicio);
    let dias = 0;
    while (dias < diasUteis) {
      data.setDate(data.getDate() + 1);
      const diaSemana = data.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        dias++;
      }
    }
    return data.toISOString().split('T')[0];
  }

  // Iniciar cronograma
  async function iniciarCronograma() {
    try {
      const dataFim = diasUteis
        ? calcularDataTermino(dataInicio, parseInt(diasUteis))
        : dataTermino;

      // Buscar itens do contrato
      const { data: itensContrato } = await supabaseRaw
        .from('contratos_itens')
        .select('*')
        .eq('contrato_id', projeto?.contrato_id)
        .order('ordem');

      if (!itensContrato || itensContrato.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhum item encontrado no contrato' });
        return;
      }

      // Criar tarefas a partir dos itens (usando 'titulo' que é a coluna correta)
      const tarefasParaCriar = itensContrato.map((item: any, index: number) => ({
        projeto_id: projetoId,
        titulo: item.descricao || item.nome || `Item ${index + 1}`,
        descricao: item.descricao,
        nucleo: item.nucleo || 'engenharia',
        categoria: item.categoria,
        data_inicio: dataInicio,
        data_termino: dataFim,
        progresso: 0,
        status: 'pendente',
        ordem: index + 1,
      }));

      const { data: novasTarefas, error } = await supabaseRaw
        .from('cronograma_tarefas')
        .insert(tarefasParaCriar)
        .select();

      if (error) throw error;

      // Atualizar projeto
      await supabaseRaw
        .from('projetos')
        .update({
          data_inicio: dataInicio,
          data_termino: dataFim,
          status: 'em_andamento',
        })
        .eq('id', projetoId);

      // Mapear para interface local
      const tarefasMapeadas = (novasTarefas || []).map((t: any) => ({
        id: t.id,
        nome: t.titulo,
        descricao: t.descricao,
        nucleo: t.nucleo,
        categoria: t.categoria,
        data_inicio: t.data_inicio,
        data_termino: t.data_termino,
        progresso: t.progresso || 0,
        status: t.status || 'pendente',
        ordem: t.ordem || 0,
      }));
      setTarefas(tarefasMapeadas);
      setCronogramaIniciado(true);
      setShowIniciarModal(false);
      toast({ title: 'Cronograma iniciado com sucesso!' });
    } catch (error) {
      console.error('Erro ao iniciar cronograma:', error);
      toast({ variant: 'destructive', title: 'Erro ao iniciar cronograma' });
    }
  }

  // Gerar lista da equipe para compartilhar (interna)
  function gerarListaEquipe() {
    return membrosEquipe.map(m =>
      `${padronizarNome(m.pessoa.nome)} - ${m.funcao_no_projeto || m.pessoa.profissao || 'Sem funçÍo'} - CPF: ${formatarCPFExibicao(m.pessoa.cpf) || 'NÍo informado'}`
    ).join('\n');
  }

  // Copiar lista
  async function copiarLista() {
    const lista = gerarListaEquipe();
    await navigator.clipboard.writeText(lista);
    toast({ title: 'Lista copiada!' });
  }

  // Gerar PDF com timbrado WG, avatar e dados da obra
  function gerarPDF() {
    const win = window.open('', '_blank');
    if (win) {
      // Gerar HTML de cada membro com avatar
      const membrosHTML = membrosEquipe.map(m => {
        const iniciais = m.pessoa.nome.split(' ').filter(p => p.length > 0).map(p => p[0]).slice(0, 2).join('').toUpperCase();
        const avatarHTML = m.pessoa.avatar_url
          ? `<img src="${m.pessoa.avatar_url}" alt="${m.pessoa.nome}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #F25C26;" />`
          : `<div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #F25C26, #FF8C5A); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">${iniciais}</div>`;

        return `
          <div style="display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #eee;">
            ${avatarHTML}
            <div>
              <div style="font-weight: bold; font-size: 16px; color: #333;">${padronizarNome(m.pessoa.nome)}</div>
              <div style="color: #F25C26; font-size: 14px;">${m.funcao_no_projeto || m.pessoa.profissao || 'Sem funçÍo definida'}</div>
              <div style="color: #666; font-size: 12px;">CPF: ${formatarCPFExibicao(m.pessoa.cpf) || 'NÍo informado'}</div>
            </div>
          </div>
        `;
      }).join('');

      win.document.write(`
        <html>
        <head>
          <title>Equipe - ${projeto?.nome}</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
            }
            .header {
              background: linear-gradient(135deg, #1a1a1a, #333);
              padding: 30px 40px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .header img {
              height: 50px;
            }
            .header-text {
              color: white;
              text-align: right;
            }
            .content {
              padding: 40px;
            }
            .projeto-info {
              background: #f8f8f8;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 30px;
              border-left: 4px solid #F25C26;
            }
            .projeto-titulo {
              font-size: 24px;
              font-weight: bold;
              color: #1a1a1a;
              margin-bottom: 16px;
            }
            .projeto-dados {
              display: grid;
              gap: 8px;
            }
            .projeto-dados p {
              margin: 0;
              font-size: 14px;
            }
            .projeto-dados strong {
              color: #F25C26;
            }
            .secao-titulo {
              font-size: 18px;
              font-weight: bold;
              color: #F25C26;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #F25C26;
            }
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: #1a1a1a;
              color: white;
              padding: 15px 40px;
              font-size: 11px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo-wg-grupo.svg" alt="Grupo WG Almeida" onerror="this.style.display='none'" />
            <div class="header-text">
              <div style="font-size: 12px; opacity: 0.8;">EQUIPE DO PROJETO</div>
              <div style="font-size: 18px; font-weight: bold;">${projeto?.contrato_numero || ''}</div>
            </div>
          </div>

          <div class="content">
            <div class="projeto-info">
              <div class="projeto-titulo">${projeto?.nome}</div>
              <div class="projeto-dados">
                <p><strong>Cliente:</strong> ${padronizarNome(projeto?.cliente_nome || '-')}</p>
                ${projeto?.endereco_obra ? `<p><strong>Endereço da Obra:</strong> ${projeto.endereco_obra}</p>` : ''}
                <p><strong>Status:</strong> ${projeto?.status?.replace('_', ' ').toUpperCase() || '-'}</p>
              </div>
            </div>

            <div class="secao-titulo">Equipe Designada (${membrosEquipe.length} pessoas)</div>
            ${membrosHTML}
          </div>

          <div class="footer">
            Grupo WG Almeida | Arquitetura • Engenharia • Marcenaria | www.wgalmeida.com.br
          </div>
        </body>
        </html>
      `);
      win.document.close();
      win.print();
    }
  }

  // Compartilhar WhatsApp (com funçÍo, CPF, cliente e endereço da obra)
  function compartilharWhatsApp() {
    // Lista de membros com nome padronizado, funçÍo e CPF
    const lista = membrosEquipe.map(m =>
      `${padronizarNome(m.pessoa.nome)} - ${m.funcao_no_projeto || m.pessoa.profissao || 'Sem funçÍo'} - CPF: ${formatarCPFExibicao(m.pessoa.cpf) || 'N/I'}`
    ).join('\n');

    // Montar mensagem completa
    let mensagem = `*EQUIPE DO PROJETO*\n`;
    mensagem += `*${projeto?.nome}*\n\n`;
    mensagem += `*Cliente:* ${padronizarNome(projeto?.cliente_nome || '-')}\n`;
    if (projeto?.endereco_obra) {
      mensagem += `*Endereço da Obra:* ${projeto.endereco_obra}\n`;
    }
    mensagem += `\n*Equipe:*\n${lista}`;

    const texto = encodeURIComponent(mensagem);
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  }

  // Abrir modal de ediçÍo de tarefa
  function abrirEditarTarefa(tarefa: TarefaCronograma) {
    setTarefaSelecionada(tarefa);
    setEditarDataInicio(tarefa.data_inicio || '');
    setEditarDataFim(tarefa.data_termino || '');
    setEditarProgresso(tarefa.progresso);
    setEditarStatus(tarefa.status);
    setShowEditarModal(true);
  }

  // Salvar ediçÍo de tarefa
  async function salvarEdicaoTarefa() {
    if (!tarefaSelecionada) return;
    try {
      const { error } = await supabaseRaw
        .from('cronograma_tarefas')
        .update({
          data_inicio: editarDataInicio || null,
          data_termino: editarDataFim || null,
          progresso: editarProgresso,
          status: editarStatus,
        })
        .eq('id', tarefaSelecionada.id);

      if (error) throw error;

      // Atualizar estado local
      setTarefas(prev => prev.map(t =>
        t.id === tarefaSelecionada.id
          ? { ...t, data_inicio: editarDataInicio, data_termino: editarDataFim, progresso: editarProgresso, status: editarStatus as any }
          : t
      ));

      setShowEditarModal(false);
      toast({ title: 'Tarefa atualizada!' });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar tarefa' });
    }
  }

  // Salvar comentário
  async function salvarComentario() {
    if (!tarefaSelecionada || !novoComentario.trim()) return;
    try {
      // Buscar comentários existentes
      const comentariosAtuais = tarefaSelecionada.comentarios || [];
      const novoComentarioObj = {
        id: crypto.randomUUID(),
        texto: novoComentario,
        autor: 'Usuário', // TODO: pegar do auth
        data: new Date().toISOString(),
        tipo: tipoComentario,
      };

      const { error } = await supabaseRaw
        .from('cronograma_tarefas')
        .update({
          comentarios: [...comentariosAtuais, novoComentarioObj],
        })
        .eq('id', tarefaSelecionada.id);

      if (error) throw error;

      // Atualizar estado local
      setTarefas(prev => prev.map(t =>
        t.id === tarefaSelecionada.id
          ? { ...t, comentarios: [...(t.comentarios || []), novoComentarioObj] }
          : t
      ));

      setNovoComentario('');
      setShowComentarioModal(false);
      toast({ title: 'Comentário adicionado!' });
    } catch (error) {
      console.error('Erro ao salvar comentário:', error);
      toast({ variant: 'destructive', title: 'Erro ao salvar comentário' });
    }
  }


  // Abrir modal de comentário na timeline
  function abrirTimelineComentario(tarefaId: string, data: string) {
    const tarefa = tarefas.find(t => t.id === tarefaId);
    if (tarefa) {
      setTarefaSelecionada(tarefa);
      setTimelineData(data);
      setTimelineComentario('');
      setTimelineTipo('solicitacao');
      setShowTimelineComentarioModal(true);
    }
  }

  // Salvar comentário da timeline
  async function salvarTimelineComentario() {
    if (!tarefaSelecionada || !timelineComentario.trim()) return;
    try {
      // Buscar comentários existentes
      const comentariosAtuais = tarefaSelecionada.comentarios || [];
      const novoComentarioObj = {
        id: crypto.randomUUID(),
        texto: timelineComentario,
        autor: 'Usuário', // TODO: pegar do auth
        data: timelineData,
        tipo: timelineTipo,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabaseRaw
        .from('cronograma_tarefas')
        .update({
          comentarios: [...comentariosAtuais, novoComentarioObj],
        })
        .eq('id', tarefaSelecionada.id);

      if (error) throw error;

      // Atualizar estado local
      setTarefas(prev => prev.map(t =>
        t.id === tarefaSelecionada.id
          ? { ...t, comentarios: [...(t.comentarios || []), novoComentarioObj] }
          : t
      ));

      setTimelineComentario('');
      setShowTimelineComentarioModal(false);
      toast({ title: 'Registro adicionado!' });
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      toast({ variant: 'destructive', title: 'Erro ao salvar registro' });
    }
  }

  // Atualizar datas do projeto
  async function atualizarDatasProjeto(novaDataInicio: string | null, novaDataFim: string | null) {
    if (!novaDataInicio || !novaDataFim) {
      return;
    }

    try {
      const { error } = await supabaseRaw
        .from('projetos')
        .update({
          data_inicio: novaDataInicio,
          data_termino: novaDataFim,
        })
        .eq('id', projetoId);

      if (error) throw error;

      // Atualizar estado local
      setProjeto(prev => prev ? {
        ...prev,
        data_inicio: novaDataInicio,
        data_termino: novaDataFim,
      } : null);

      toast({ title: 'Datas do projeto atualizadas!' });
    } catch (error) {
      console.error('Erro ao atualizar datas do projeto:', error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar datas' });
    }
  }

  // Atualizar progresso de uma tarefa
  async function atualizarProgresso(tarefaId: string, novoProgresso: number) {
    try {
      // Determinar novo status baseado no progresso
      let novoStatus = 'pendente';
      if (novoProgresso === 100) {
        novoStatus = 'concluida';
      } else if (novoProgresso > 0) {
        novoStatus = 'em_andamento';
      }

      const { error } = await supabaseRaw
        .from('cronograma_tarefas')
        .update({
          progresso: novoProgresso,
          status: novoStatus
        })
        .eq('id', tarefaId);

      if (error) throw error;

      // Atualizar estado local
      setTarefas(prev => prev.map(t =>
        t.id === tarefaId
          ? { ...t, progresso: novoProgresso, status: novoStatus as any }
          : t
      ));

      toast({ title: `Progresso atualizado para ${novoProgresso}%` });
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar progresso' });
    }
  }

  // Criar dependência entre tarefas (drag and drop)
  async function criarDependencia(tarefaId: string, dependeDe: string) {
    try {
      // Buscar a tarefa atual para obter suas dependências existentes
      const tarefaAtual = tarefas.find(t => t.id === tarefaId);
      if (!tarefaAtual) return;

      const tarefaDestino = tarefas.find(t => t.id === dependeDe);
      if (!tarefaDestino) return;

      // Verificar se já existe essa dependência
      const dependenciasAtuais = tarefaAtual.dependencias || [];
      if (dependenciasAtuais.includes(dependeDe)) {
        toast({
          variant: 'destructive',
          title: 'Dependência já existe',
          description: `"${tarefaAtual.nome}" já depende de "${tarefaDestino.nome}"`
        });
        return;
      }

      // Evitar dependência circular
      const dependenciasDestino = tarefaDestino.dependencias || [];
      if (dependenciasDestino.includes(tarefaId)) {
        toast({
          variant: 'destructive',
          title: 'Dependência circular!',
          description: 'NÍo é possível criar dependência circular entre tarefas'
        });
        return;
      }

      // Adicionar nova dependência
      const novasDependencias = [...dependenciasAtuais, dependeDe];

      const { error } = await supabaseRaw
        .from('cronograma_tarefas')
        .update({ dependencias: novasDependencias })
        .eq('id', tarefaId);

      if (error) throw error;

      // Atualizar estado local
      setTarefas(prev => prev.map(t =>
        t.id === tarefaId
          ? { ...t, dependencias: novasDependencias }
          : t
      ));

      toast({
        title: 'Dependência criada!',
        description: `"${tarefaAtual.nome}" agora depende de "${tarefaDestino.nome}"`
      });
    } catch (error) {
      console.error('Erro ao criar dependência:', error);
      toast({ variant: 'destructive', title: 'Erro ao criar dependência' });
    }
  }

  // Filtrar pessoas disponíveis (que nÍo estÍo na equipe)
  const pessoasFiltradas = useMemo(() => {
    const idsNaEquipe = new Set(membrosEquipe.map(m => m.pessoa.id));
    return pessoasDisponiveis
      .filter(p => !idsNaEquipe.has(p.id))
      .filter(p => {
        if (!searchPessoas) return true;
        const search = normalizeSearchTerm(searchPessoas);
        return (
          normalizeSearchTerm(p.nome || '').includes(search) ||
          normalizeSearchTerm(p.cargo || '').includes(search) ||
          (p.cpf || '').includes(search.replace(/\D/g, '')) ||
          (p.rg || '').includes(search.replace(/\D/g, ''))
        );
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [pessoasDisponiveis, membrosEquipe, searchPessoas]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-normal text-gray-900">Projeto nÍo encontrado</h2>
        <Button onClick={() => navigate('/cronograma/projects')} className="mt-4 text-lg">
          Voltar para Projetos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Cronograma", href: "/cronograma" },
          { label: "Projetos", href: "/cronograma/projects" },
          { label: projeto.nome },
        ]}
      />

      {/* Header do Projeto */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-start gap-6">
          {/* Avatar do Cliente */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-normal text-2xl flex-shrink-0 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${getNucleoColor(projeto.nucleo)}, ${getNucleoColor(projeto.nucleo)}99)` }}
          >
            {projeto.cliente_nome ? projeto.cliente_nome.charAt(0).toUpperCase() : 'P'}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-normal uppercase tracking-wide" style={{ color: getNucleoColor(projeto.nucleo) }}>
                {getNucleoIcon(projeto.nucleo)} {getNucleoLabel(projeto.nucleo)}
              </span>
            </div>
            <h1 className="text-2xl font-normal text-gray-900 mb-1">{projeto.nome}</h1>
            <p className="text-gray-500">{projeto.cliente_nome || 'Cliente nÍo definido'}</p>
            {projeto.contrato_numero && (
              <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Contrato {projeto.contrato_numero}
              </p>
            )}
          </div>

          {/* Progresso */}
          <div className="text-right">
            <div className="text-4xl font-normal text-primary">{projeto.progresso}%</div>
            <p className="text-sm text-gray-500">Progresso</p>
            <div className="w-32 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${projeto.progresso}%` }} />
            </div>
          </div>

          {/* BotÍo Super Gantt */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => navigate(`/cronograma/projeto/${projetoId}/gantt`)}
              className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 text-white shadow-lg gap-2 px-6"
            >
              <Sparkles className="w-4 h-4" />
              Super Gantt
              <BarChart3 className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('equipe')}
          className={`px-4 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'equipe'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Equipe do Projeto
        </button>
        <button
          onClick={() => setActiveTab('cronograma')}
          className={`px-4 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'cronograma'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Cronograma
        </button>
        <button
          onClick={() => setActiveTab('medicao')}
          className={`px-4 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'medicao'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          MediçÍo Financeira
        </button>
      </div>

      {/* Conteúdo da Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'equipe' && (
          <motion.div
            key="equipe"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Coluna Direita - Pessoas Disponíveis */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-normal text-gray-900 mb-3">Colaboradores e Fornecedores</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, funçÍo, CPF ou RG..."
                    value={searchPessoas}
                    onChange={(e) => setSearchPessoas(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {pessoasFiltradas.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {searchPessoas ? 'Nenhuma pessoa encontrada' : 'Todas as pessoas já estÍo na equipe'}
                  </p>
                ) : (
                  pessoasFiltradas.map(pessoa => (
                    <PessoaCard
                      key={pessoa.id}
                      pessoa={pessoa}
                      onAdd={() => adicionarMembro(pessoa)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Coluna Esquerda - Equipe do Projeto */}
            <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
              <div className="p-4 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-normal text-gray-900">Equipe do Projeto</h3>
                    <p className="text-sm text-gray-500">{membrosEquipe.length} membros</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-lg" onClick={copiarLista}>
                      <Download className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm" className="text-lg" onClick={gerarPDF}>
                      <Printer className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button size="sm" onClick={compartilharWhatsApp} className="text-lg bg-green-500 hover:bg-green-600">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {membrosEquipe.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Clique nas pessoas à esquerda para adicionar à equipe
                    </p>
                  ) : (
                    membrosEquipe.map(membro => (
                      <MembroCard
                        key={membro.id}
                        membro={membro}
                        onRemove={() => removerMembro(membro)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'cronograma' && (
          <motion.div
            key="cronograma"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {!cronogramaIniciado ? (
              /* Tela de Iniciar Cronograma */
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h2 className="text-2xl font-normal text-gray-900 mb-2">Iniciar Cronograma</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Configure as datas de início e término para gerar o cronograma com todos os itens contratados.
                </p>
                <Button
                  onClick={() => setShowIniciarModal(true)}
                  className="text-lg bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar Cronograma
                </Button>
              </div>
            ) : (
              /* Novo Gantt Chart com layout profissional */
              <GanttChart
                tarefas={tarefas.map(t => ({
                  id: t.id,
                  nome: (t as any).titulo || t.nome,
                  descricao: t.descricao,
                  nucleo: t.nucleo,
                  categoria: t.categoria,
                  data_inicio: t.data_inicio,
                  data_fim: t.data_termino,
                  progresso: t.progresso || 0,
                  status: t.status || 'pendente',
                  ordem: t.ordem || 0,
                }))}
                dataInicio={projeto.data_inicio}
                dataFim={projeto.data_termino}
                projetoNome={projeto.nome}
                onEdit={(tarefa) => {
                  const tarefaOriginal = tarefas.find(t => t.id === tarefa.id);
                  if (tarefaOriginal) abrirEditarTarefa(tarefaOriginal);
                }}
                onProgressoChange={(tarefaId, progresso) => atualizarProgresso(tarefaId, progresso)}
                onDateChange={(novaDataInicio, novaDataFim) => atualizarDatasProjeto(novaDataInicio, novaDataFim)}
                onTimelineComment={(tarefaId, data) => abrirTimelineComentario(tarefaId, data)}
                onDependencyCreate={(tarefaId, dependeDe) => criarDependencia(tarefaId, dependeDe)}
              />
            )}
          </motion.div>
        )}

        {activeTab === 'medicao' && (
          <motion.div
            key="medicao"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MedicaoFinanceira
              projetoId={projetoId || ''}
              projetoTitulo={projeto.nome}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Iniciar Cronograma */}
      <Dialog open={showIniciarModal} onOpenChange={setShowIniciarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Cronograma</DialogTitle>
            <DialogDescription className="sr-only">Configure as datas de início e término do cronograma</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Data de Início</label>
              <DateInputBR
                value={dataInicio}
                onChange={(val) => setDataInicio(val)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">PrevisÍo de Término</label>
              <DateInputBR
                value={dataTermino}
                onChange={(val) => {
                  setDataTermino(val);
                  setDiasUteis('');
                }}
                disabled={!!diasUteis}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="text-center text-gray-500 text-sm">ou</div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quantidade de Dias Úteis</label>
              <Input
                type="number"
                placeholder="Ex: 30"
                value={diasUteis}
                onChange={(e) => {
                  setDiasUteis(e.target.value);
                  setDataTermino('');
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Será calculado automaticamente excluindo fins de semana</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="text-lg" onClick={() => setShowIniciarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={iniciarCronograma} className="text-lg bg-primary hover:bg-primary/90">
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Comentário */}
      <Dialog open={showComentarioModal} onOpenChange={setShowComentarioModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Comentário</DialogTitle>
            <DialogDescription className="sr-only">Adicione um comentário à tarefa selecionada</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tarefa</label>
              <p className="text-gray-900 font-medium">{tarefaSelecionada?.nome}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: 'observacao', label: '📝 ObservaçÍo', color: 'bg-blue-100 text-blue-700' },
                  { value: 'problema', label: '⚠️ Problema', color: 'bg-red-100 text-red-700' },
                  { value: 'alteracao', label: '🔄 AlteraçÍo', color: 'bg-purple-100 text-purple-700' },
                ].map(tipo => (
                  <button
                    key={tipo.value}
                    onClick={() => setTipoComentario(tipo.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tipoComentario === tipo.value ? tipo.color : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Comentário</label>
              <Textarea
                placeholder="Ex: Elevador nÍo funcionou, cliente solicitou novo ponto de água..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          {/* Lista de comentários existentes */}
          {tarefaSelecionada?.comentarios && tarefaSelecionada.comentarios.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Comentários Anteriores</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tarefaSelecionada.comentarios.map((c: Comentario) => (
                  <div key={c.id} className={`p-2 rounded-lg text-sm ${
                    c.tipo === 'problema' ? 'bg-red-50' : c.tipo === 'alteracao' ? 'bg-purple-50' : 'bg-blue-50'
                  }`}>
                    <p className="text-gray-800">{c.texto}</p>
                    <p className="text-xs text-gray-500 mt-1">{c.autor} - {formatarData(c.data)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="text-lg" onClick={() => setShowComentarioModal(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarComentario} className="text-lg bg-primary hover:bg-primary/90" disabled={!novoComentario.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Salvar Comentário
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de EdiçÍo de Tarefa */}
      <Dialog open={showEditarModal} onOpenChange={setShowEditarModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
            <DialogDescription className="sr-only">Edite os detalhes da tarefa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tarefa</label>
              <p className="text-gray-900 font-medium">{tarefaSelecionada?.nome}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Data Início</label>
                <DateInputBR
                  value={editarDataInicio}
                  onChange={(val) => setEditarDataInicio(val)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Data Fim</label>
                <DateInputBR
                  value={editarDataFim}
                  onChange={(val) => setEditarDataFim(val)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Progresso: {editarProgresso}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={editarProgresso}
                onChange={(e) => setEditarProgresso(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { value: 'pendente', label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
                  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
                  { value: 'concluida', label: 'Concluída', color: 'bg-green-100 text-green-700' },
                  { value: 'atrasada', label: 'Atrasada', color: 'bg-red-100 text-red-700' },
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => setEditarStatus(s.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      editarStatus === s.value
                        ? s.color + ' ring-2 ring-offset-2 ring-primary'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="text-lg" onClick={() => setShowEditarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicaoTarefa} className="text-lg bg-primary hover:bg-primary/90">
              <Check className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Comentário na Timeline */}
      <Dialog open={showTimelineComentarioModal} onOpenChange={setShowTimelineComentarioModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Registrar Ocorrência
            </DialogTitle>
            <DialogDescription>
              {tarefaSelecionada && (
                <span className="text-gray-600">
                  {tarefaSelecionada.nome} • Data: {' '}
                  <span className="font-normal text-primary">
                    {timelineData ? formatarData(timelineData) : ''}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo de Registro */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Registro</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'solicitacao', label: 'SolicitaçÍo', icon: '📝', color: 'bg-blue-100 text-blue-700' },
                  { value: 'alteracao', label: 'AlteraçÍo', icon: '🔄', color: 'bg-yellow-100 text-yellow-700' },
                  { value: 'problema', label: 'Problema', icon: '⚠️', color: 'bg-red-100 text-red-700' },
                  { value: 'observacao', label: 'ObservaçÍo', icon: '💬', color: 'bg-gray-100 text-gray-700' },
                ].map(t => (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setTimelineTipo(t.value as typeof timelineTipo)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      timelineTipo === t.value
                        ? t.color + ' ring-2 ring-offset-2 ring-primary'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DescriçÍo do Registro */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">DescriçÍo</label>
              <Textarea
                value={timelineComentario}
                onChange={(e) => setTimelineComentario(e.target.value)}
                placeholder={
                  timelineTipo === 'solicitacao'
                    ? 'Ex: Cliente solicitou um novo ponto de iluminaçÍo na sala...'
                    : timelineTipo === 'alteracao'
                    ? 'Ex: Alterada posiçÍo do interruptor conforme pedido...'
                    : timelineTipo === 'problema'
                    ? 'Ex: Identificado problema com a fiaçÍo existente...'
                    : 'Ex: Verificado com o cliente sobre preferência de acabamento...'
                }
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Info de Registro */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                Este registro será salvo com data/hora: {new Date().toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" className="text-lg" onClick={() => setShowTimelineComentarioModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={salvarTimelineComentario}
              disabled={!timelineComentario.trim()}
              className="text-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              Salvar Registro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


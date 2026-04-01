/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ========================================
// PAGINA DE IMPORTACAO INTELIGENTE DE EXTRATOS
// Com preview editavel e classificacao por IA
// ========================================

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  Download,
  RefreshCw,
  ArrowRight,
  Check,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { parseExtrato, type LinhaExtrato, type ResultadoParsing } from '@/services/extratoParserService';
import {
  classificarLinhas,
  verificarDuplicatas,
  salvarPadraoAprendido,
  calcularMetricasValidacao,
  limparCacheReferencias,
  validarImportacao,
  type ClassificacaoIA,
  type MetricasValidacao,
  type ResultadoValidacao,
} from '@/services/extratoIAService';
import { supabase } from '@/lib/supabaseClient';
import { downloadFinanceiroTemplate } from '@/lib/templates/financeiroTemplate';
import { toast } from 'sonner';
import { formatarData, formatarMoeda } from '@/lib/utils';

interface ItemImportacao extends LinhaExtrato {
  index: number;
  classificacao: ClassificacaoIA | null;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'duplicado' | 'a_definir';
  duplicata_de: string | null;
  selecionado: boolean;
  centro_custo_id?: string;
  nucleo?: string;
  pessoa_id?: string;
  pessoa_nome?: string;
  conta_id?: string;
  conta_nome?: string;
  categoria_id?: string;
  projeto_id?: string;
  contrato_id?: string;
  status_lancamento?: string;
  auto_contrato?: boolean;
  auto_categoria?: boolean;
  auto_projeto?: boolean;
  auto_pessoa?: boolean;
  auto_conta?: boolean;
  auto_centro_custo?: boolean;
  auto_nucleo?: boolean;
}

// FunçÍo auxiliar para extrair favorecido da descriçÍo
function extrairFavorecidoDaDescricao(descricao: string): string | null {
  if (!descricao) return null;

  // Padrões comuns de favorecido em extratos bancários
  const padroes = [
    /Pix\s+(?:enviado|recebido)\s+(?:para|de)\s+(.+?)(?:\s+-|\s+\d{11}|\s+QR|\s+0{3,}|$)/i,
    /TED\s+(?:enviada?|recebida?)\s+(?:para|de)\s+(.+?)(?:\s+-|$)/i,
    /Pagamento\s+de\s+boleto\s+(?:enviado\s+)?(?:para\s+)?(.+?)$/i,
    /(?:PIX|TED|DOC)\s+[-:]\s*(.+?)(?:\s+[-*]|$)/i,
  ];

  for (const padrao of padroes) {
    const match = descricao.match(padrao);
    if (match && match[1]) {
      const favorecido = match[1].trim();
      if (favorecido.length > 3) {
        return favorecido;
      }
    }
  }
  return null;
}

type LookupItem = Record<string, unknown> & { id?: string };

interface CategoriaFinanceira extends LookupItem {
  id: string;
  nome: string;
  tipo: string;
}

interface ProjetoResumo extends LookupItem {
  id: string;
  nome: string;
  numero?: string;
}

interface CentroCusto extends LookupItem {
  id: string;
  nome: string;
}

interface ContratoReferencia extends LookupItem {
  id: string;
  numero?: string;
  titulo?: string;
  cliente_nome?: string;
}

interface PessoaSimplificada extends LookupItem {
  id: string;
  nome: string;
  tipo: string;
  cpf?: string;
  cnpj?: string;
}

interface ContaBancariaReferencia extends LookupItem {
  id: string;
  nome: string;
  numero?: string;
  banco?: string;
  agencia?: string;
}

type Etapa = 'upload' | 'processando' | 'preview' | 'importando' | 'concluido';

interface Estatisticas {
  total: number;
  aprovados: number;
  rejeitados: number;
  duplicados: number;
  aDefinir: number;
  valorEntradas: number;
  valorSaidas: number;
}

export default function ImportarExtratoPage() {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultadoParsing, setResultadoParsing] = useState<ResultadoParsing | null>(null);
  const [itens, setItens] = useState<ItemImportacao[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [contratosRef, setContratosRef] = useState<ContratoReferencia[]>([]);
  const [nucleos] = useState<string[]>(["ARQUITETURA", "ENGENHARIA", "MARCENARIA", "GERAL"]);
  const [pessoas, setPessoas] = useState<PessoaSimplificada[]>([]);
  const [contas, setContas] = useState<ContaBancariaReferencia[]>([]);
  const [categoriasDespesa, setCategoriasDespesa] = useState<CategoriaFinanceira[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');

  // Configurações avançadas de IA
  const [promptPersonalizado, setPromptPersonalizado] = useState<string>("");
  const [templateFormat, setTemplateFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [mostrarConfigIA, setMostrarConfigIA] = useState(false);
  const [errosImportacao, setErrosImportacao] = useState<string[]>([]);
  const [metricasIA, setMetricasIA] = useState<MetricasValidacao | null>(null);
  const [classificacoesMap, setClassificacoesMap] = useState<Map<number, ClassificacaoIA>>(new Map());
  const [duplicatasMap, setDuplicatasMap] = useState<Map<number, string>>(new Map());
  const [validacao, setValidacao] = useState<ResultadoValidacao | null>(null);

  // Carregar dados de referencia
  useEffect(() => {
    carregarDadosReferencia();
  }, []);

  const carregarDadosReferencia = async () => {
    try {
      const [catRes, projRes, ccRes, pessoasRes, contasRes, contratosRes] = await Promise.all([
        supabase
          .from('fin_categories')
          .select('id, name, kind, ativo')
          .eq('ativo', true)
          .order('name'),
        supabase.from('projetos').select('id, nome, numero').order('nome').limit(100),
        supabase.from('financeiro_centros_custo').select('id, nome').order('nome').limit(200),
        supabase.from('pessoas')
          .select('id, nome, tipo, cpf, cnpj')
          .in('tipo', [
            'CLIENTE',
            'FORNECEDOR',
            'COLABORADOR',
            'ESPECIFICADOR',
            'PRESTADOR',
            'fornecedor',
            'colaborador',
            'especificador',
            'prestador',
            'cliente',
          ])
          .order('nome')
          .limit(500),
        supabase.from('contas_bancarias').select('id, nome, banco, agencia').order('nome').limit(200),
        supabase.from('contratos').select('id, numero, titulo').order('created_at', { ascending: false }).limit(200),
      ]);

      console.info('[Importacao][Supabase] categorias:', catRes.error || (catRes.data || []).length);
      console.info('[Importacao][Supabase] projetos:', projRes.error || (projRes.data || []).length);
      console.info('[Importacao][Supabase] centros_custo:', ccRes.error || (ccRes.data || []).length);
      console.info('[Importacao][Supabase] pessoas:', pessoasRes.error || (pessoasRes.data || []).length);
      console.info('[Importacao][Supabase] contas:', contasRes.error || (contasRes.data || []).length);
      console.info('[Importacao][Supabase] contratos:', contratosRes.error || (contratosRes.data || []).length);

      const categoriasData: CategoriaFinanceira[] = (catRes.data || []).map((categoria: any) => ({
        id: categoria.id,
        nome: categoria.name,
        tipo: categoria.kind === 'income' ? 'entrada' : 'saida',
      }));
      setCategorias(categoriasData);
      setCategoriasDespesa(
        categoriasData.filter((c) => {
          const t = (c.tipo || '').toString().toLowerCase();
          return t.includes('despesa') || t.includes('saida') || t.includes('pagar') || t.includes('expense');
        })
      );
      setProjetos(projRes.data || []);
      setCentrosCusto(ccRes.data || []);
      setPessoas(pessoasRes.data || []);
      setContas(contasRes.data || []);
      setContratosRef((contratosRes.data || []));
    } catch (error) {
      console.error('Erro ao carregar dados de referencia:', error);
    }
  };

  // Estatisticas
  const estatisticas: Estatisticas = {
    total: itens.length,
    aprovados: itens.filter(i => i.status === 'aprovado').length,
    rejeitados: itens.filter(i => i.status === 'rejeitado').length,
    duplicados: itens.filter(i => i.status === 'duplicado').length,
    aDefinir: itens.filter(i => i.status === 'a_definir' || i.status === 'pendente').length,
    valorEntradas: itens.filter(i => i.tipo === 'entrada' && i.status !== 'rejeitado').reduce((s, i) => s + i.valor, 0),
    valorSaidas: itens.filter(i => i.tipo === 'saida' && i.status !== 'rejeitado').reduce((s, i) => s + i.valor, 0),
  };

  // Métricas de match calculadas pelo serviço de IA (mais precisas)
  const metricasMatch = useMemo(() => {
    // Priorizar métricas da IA se disponíveis
    if (metricasIA) {
      return {
        categorias: metricasIA.match_categoria,
        projetos: metricasIA.match_projeto,
        pessoas: metricasIA.match_pessoa,
        contas: metricasIA.match_conta,
        centros: metricasIA.match_centro_custo,
        nucleosMatch: metricasIA.match_nucleo,
        total: metricasIA.total_linhas,
        confiancaMedia: metricasIA.confianca_media,
        linhasValidas: metricasIA.linhas_validas,
        duplicatas: metricasIA.duplicatas_encontradas,
        periodoInicio: metricasIA.periodo_inicio,
        periodoFim: metricasIA.periodo_fim,
        valorEntradas: metricasIA.valor_total_entradas,
        valorSaidas: metricasIA.valor_total_saidas,
      };
    }

    // Fallback para cálculo local
    if (!itens.length) return null;
    const total = itens.length;
    const pct = (v: number) => Math.round((v / total) * 100);
    const categorias = pct(itens.filter(i => i.classificacao?.categoria_id || i.categoria_id).length);
    const projetos = pct(itens.filter(i => i.classificacao?.projeto_id || i.projeto_id).length);
    const pessoas = pct(itens.filter(i => i.classificacao?.pessoa_id || i.pessoa_id).length);
    const contas = pct(itens.filter(i => Boolean(i.conta_id)).length);
    const centros = pct(itens.filter(i => Boolean(i.centro_custo_id)).length);
    const nucleosMatch = pct(itens.filter(i => i.nucleo).length);
    const somaConfianca = itens.reduce((s, i) => s + (i.classificacao?.confianca || 0), 0);
    return {
      categorias,
      projetos,
      pessoas,
      contas,
      centros,
      nucleosMatch,
      total,
      confiancaMedia: total > 0 ? Math.round(somaConfianca / total) : 0,
      linhasValidas: itens.filter(i => i.data && i.valor > 0 && i.descricao).length,
      duplicatas: itens.filter(i => i.status === 'duplicado').length,
      periodoInicio: null,
      periodoFim: null,
      valorEntradas: estatisticas.valorEntradas,
      valorSaidas: estatisticas.valorSaidas,
    };
  }, [itens, metricasIA, estatisticas]);

  // Upload de arquivo
  const handleFileSelect = useCallback(async (file: File) => {
    setArquivo(file);
    setEtapa('processando');
    setProgresso(0);
    setMensagemProgresso('Lendo arquivo...');

    try {
      // 1. Parse do arquivo
      setProgresso(20);
      const resultado = await parseExtrato(file);
      setResultadoParsing(resultado);

      if (!resultado.sucesso || resultado.linhas.length === 0) {
        setErrosImportacao(resultado.erros);
        toast.error('NÍo foi possível processar o arquivo', {
          description: 'Verifique os erros abaixo e tente novamente.',
        });
        setEtapa('upload');
        return;
      }

      // Limpar erros anteriores se sucesso
      setErrosImportacao([]);

      // 2. ClassificaçÍo por IA (usando serviço melhorado com Levenshtein)
      setProgresso(40);
      setMensagemProgresso(`Classificando ${resultado.linhas.length} transações com IA...`);

      // Limpar cache para garantir dados frescos
      limparCacheReferencias();
      const classificacoes = await classificarLinhas(resultado.linhas, promptPersonalizado || undefined);
      setClassificacoesMap(classificacoes);

      // 3. Verificar duplicatas
      setProgresso(60);
      setMensagemProgresso('Verificando duplicatas...');
      const duplicatas = await verificarDuplicatas(resultado.linhas);
      setDuplicatasMap(duplicatas);

      // 4. Calcular métricas de validaçÍo (do serviço de IA)
      setProgresso(75);
      setMensagemProgresso('Calculando métricas de validaçÍo...');
      const metricas = calcularMetricasValidacao(resultado.linhas, classificacoes, duplicatas);
      setMetricasIA(metricas);
      console.info('[Importacao][Metricas]', metricas);

      // 5. ValidaçÍo automática
      setProgresso(80);
      setMensagemProgresso('Validando dados...');
      const resultadoValidacao = validarImportacao(resultado.linhas, classificacoes, {
        exigirCategoria: false,
        exigirProjeto: false,
        exigirFavorecido: false,
        diasMaximoPassado: 365,
        permitirFuturo: false,
      });
      setValidacao(resultadoValidacao);
      console.info('[Importacao][Validacao]', resultadoValidacao);

      // 5. Criar itens para preview (usando classificações do serviço de IA)
      setProgresso(85);
      setMensagemProgresso('Preparando preview...');

      // FunçÍo auxiliar para mapear status
      const mapStatus = (valor?: string | null) => {
        if (!valor) return undefined;
        const v = valor.toUpperCase();
        if (v.includes('PAGO')) return 'pago';
        if (v.includes('PEND')) return 'pendente';
        if (v.includes('PREV')) return 'previsto';
        if (v.includes('PARC')) return 'parcial';
        if (v.includes('ATRAS')) return 'atrasado';
        if (v.includes('CANC')) return 'cancelado';
        return undefined;
      };

      const itensProcessados: ItemImportacao[] = resultado.linhas.map((linha, index) => {
        const classificacaoIA = classificacoes.get(index);
        const duplicadaDe = duplicatas.get(index) || null;

        // Usar classificaçÍo da IA como base (já faz match inteligente com Levenshtein)
        const classificacao: ClassificacaoIA = classificacaoIA || {
          categoria_id: null,
          categoria_sugerida: null,
          projeto_id: null,
          projeto_sugerido: null,
          contrato_id: null,
          contrato_sugerido: null,
          pessoa_id: null,
          pessoa_sugerida: null,
          centro_custo_id: null,
          centro_custo_sugerido: null,
          nucleo: null,
          conta_id: null,
          conta_sugerida: null,
          confianca: 0,
          motivo: 'NÍo identificado',
          descricao_formatada: linha.descricao,
          match_scores: { categoria: 0, projeto: 0, pessoa: 0, centro_custo: 0, conta: 0, nucleo: 0 },
        };

        const confianca = classificacao.confianca || 0;
        const statusLinha = mapStatus(linha.status_lancamento);

        // Determinar status do item
        let status: ItemImportacao['status'] = 'pendente';
        if (duplicadaDe) {
          status = 'duplicado';
        } else if (confianca >= 80) {
          status = 'aprovado';
        } else if (confianca < 50) {
          status = 'a_definir';
        }

        // Obter scores individuais para flags auto_*
        const scores = classificacao.match_scores || { categoria: 0, projeto: 0, pessoa: 0, centro_custo: 0, conta: 0, nucleo: 0 };

        return {
          ...linha,
          index,
          classificacao,
          status,
          duplicata_de: duplicadaDe,
          selecionado: status === 'aprovado',
          // Usar valores da classificaçÍo IA (já otimizados)
          categoria_id: classificacao.categoria_id || undefined,
          projeto_id: classificacao.projeto_id || undefined,
          pessoa_id: classificacao.pessoa_id || undefined,
          conta_id: classificacao.conta_id || undefined,
          centro_custo_id: classificacao.centro_custo_id || undefined,
          contrato_id: classificacao.contrato_id || undefined,
          nucleo: classificacao.nucleo || linha.nucleo || undefined,
          conta_nome: classificacao.conta_sugerida || linha.conta_nome || undefined,
          pessoa_nome: classificacao.pessoa_sugerida || linha.pessoa_nome || undefined,
          status_lancamento: statusLinha || linha.status_lancamento || undefined,
          // Flags indicando se foi match automático (score > 0)
          auto_contrato: !!classificacao.contrato_id,
          auto_categoria: scores.categoria > 0,
          auto_projeto: scores.projeto > 0,
          auto_pessoa: scores.pessoa > 0,
          auto_conta: scores.conta > 0,
          auto_centro_custo: scores.centro_custo > 0,
          auto_nucleo: scores.nucleo > 0,
        };
      });

      // Log de métricas de match para diagnóstico
      const resumoAuto = itensProcessados.reduce(
        (acc, item) => {
          if (item.auto_categoria) acc.categorias++;
          if (item.auto_projeto) acc.projetos++;
          if (item.auto_pessoa) acc.pessoas++;
          if (item.auto_conta) acc.contas++;
          if (item.auto_centro_custo) acc.centros++;
          if (item.auto_nucleo) acc.nucleos++;
          return acc;
        },
        { categorias: 0, projetos: 0, pessoas: 0, contas: 0, centros: 0, nucleos: 0 }
      );
      console.info('[Importacao][Match]', {
        total: itensProcessados.length,
        ...resumoAuto,
      });

      setItens(itensProcessados);
      setProgresso(100);
      setEtapa('preview');
      toast.success(`${resultado.linhas.length} transacoes processadas!`);

    } catch (error: unknown) {
      console.error('Erro ao processar arquivo:', error);
      const description = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao processar arquivo', { description });
      setEtapa('upload');
    }
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Atualizar item
  const atualizarItem = (index: number, changes: Partial<ItemImportacao>) => {
    setItens(prev => prev.map((item, i) =>
      i === index ? { ...item, ...changes } : item
    ));
  };

  // Ações em lote
  const aprovarTodos = () => {
    setItens(prev => prev.map(item =>
      item.status !== 'duplicado' ? { ...item, status: 'aprovado', selecionado: true } : item
    ));
  };

  const rejeitarDuplicados = () => {
    setItens(prev => prev.map(item =>
      item.status === 'duplicado' ? { ...item, status: 'rejeitado', selecionado: false } : item
    ));
  };

  const inverterSelecao = () => {
    setItens(prev => prev.map(item => ({
      ...item,
      selecionado: !item.selecionado,
    })));
  };

  const parseParcela = (parcela?: string | null): { numero: number | null; total: number | null } => {
    if (!parcela) return { numero: null, total: null };
    const match = parcela.match(/(\d+)\s*[/\\-]\s*(\d+)/);
    if (match) {
      return {
        numero: parseInt(match[1], 10),
        total: parseInt(match[2], 10),
      };
    }
    const numero = parseInt(parcela, 10);
    return isNaN(numero) ? { numero: null, total: null } : { numero, total: null };
  };

  // Importar para lançamentos
  const importarLancamentos = async () => {
    const itensAprovados = itens.filter(i => i.status === 'aprovado' || i.selecionado);

    if (itensAprovados.length === 0) {
      toast.warning('Nenhum item selecionado para importaçÍo');
      return;
    }

    setEtapa('importando');
    setProgresso(0);
    setMensagemProgresso('Criando registro de importaçÍo...');

    try {
      // 1. Criar registro de importacao
      const { data: importacao, error: errImportacao } = await supabase
        .from('financeiro_importacoes')
        .insert({
          nome_arquivo: arquivo?.name || 'extrato.xlsx',
          tipo_arquivo: arquivo?.name.split('.').pop() || 'xlsx',
          tamanho_bytes: arquivo?.size || 0,
          status: 'processando',
          total_linhas: itens.length,
          data_inicio: resultadoParsing?.dataInicio,
          data_fim: resultadoParsing?.dataFim,
        })
        .select()
        .single();

      if (errImportacao) throw errImportacao;

      // 2. Importar cada lancamento
      let importados = 0;
      let erros = 0;

      for (let i = 0; i < itensAprovados.length; i++) {
        const item = itensAprovados[i];
        setProgresso(Math.round((i / itensAprovados.length) * 100));
        setMensagemProgresso(`Importando ${i + 1} de ${itensAprovados.length}...`);

        try {
          // Criar lançamento
          const parcelaInfo = parseParcela(item.parcela);
          const statusLanc = item.status_lancamento || 'pago';
          const vencimento = item.data_vencimento || item.data;
          const dataPagamento = item.data_pagamento || (statusLanc === 'pago' ? item.data : null);

          // Extrair favorecido da descriçÍo se nÍo tiver pessoa_nome
          const favorecidoNome = item.pessoa_nome || extrairFavorecidoDaDescricao(item.descricao);

          // Se temos nome mas nÍo pessoa_id, tentar criar pessoa
          let pessoaIdFinal = item.classificacao?.pessoa_id || item.pessoa_id || null;
          if (!pessoaIdFinal && favorecidoNome) {
            // Tentar criar pessoa automaticamente
            const { data: novaPessoa } = await supabase
              .from('pessoas')
              .insert({
                nome: favorecidoNome,
                tipo: item.tipo === 'saida' ? 'FORNECEDOR' : 'CLIENTE',
                ativo: true
              })
              .select('id')
              .single();
            if (novaPessoa) {
              pessoaIdFinal = novaPessoa.id;
            }
          }

          const { error: errLanc } = await supabase
            .from('financeiro_lancamentos')
            .insert({
              data_competencia: item.data,
              vencimento,
              data_pagamento: dataPagamento,
              descricao: item.classificacao?.descricao_formatada || item.descricao,
              valor_total: item.valor,
              tipo: item.tipo, // 'entrada' ou 'saida'
              status: statusLanc,
              categoria_id: item.classificacao?.categoria_id || item.categoria_id || null,
              projeto_id: item.classificacao?.projeto_id || item.projeto_id || null,
              contrato_id: item.classificacao?.contrato_id || item.contrato_id || null,
              pessoa_id: pessoaIdFinal,
              favorecido_id: pessoaIdFinal,
              favorecido_nome: favorecidoNome || null,
              centro_custo_id: item.centro_custo_id || null,
              nucleo: item.nucleo || null,
              conta_id: item.conta_id || null,
              documento_numero: item.documento || null,
              numero_parcelas: parcelaInfo.total || null,
              parcela_numero: parcelaInfo.numero || null,
              observacoes: item.observacoes || null,
              origem: 'importacao',
              classificado_auto: true,
              confianca_classificacao: item.classificacao?.confianca || 0,
            });

          if (errLanc) {
            console.error('Erro ao importar lançamento:', errLanc);
            erros++;
          } else {
            importados++;

            // Salvar padrao aprendido se tiver alta confianca
            if (item.classificacao && item.classificacao.confianca >= 80) {
              await salvarPadraoAprendido(item.descricao, {
                categoria_id: item.classificacao.categoria_id || undefined,
                projeto_id: item.classificacao.projeto_id || undefined,
                contrato_id: item.classificacao.contrato_id || undefined,
                pessoa_id: item.classificacao.pessoa_id || undefined,
              });
            }
          }
        } catch (e) {
          erros++;
        }
      }

      // 3. Atualizar registro de importacao
      await supabase
        .from('financeiro_importacoes')
        .update({
          status: 'concluido',
          linhas_importadas: importados,
          linhas_erro: erros,
          linhas_duplicadas: itens.filter(i => i.status === 'duplicado').length,
          processado_em: new Date().toISOString(),
        })
        .eq('id', importacao.id);

      setProgresso(100);
      setEtapa('concluido');
      toast.success(`ImportaçÍo concluída! ${importados} lançamentos criados.`);

    } catch (error: unknown) {
      console.error('Erro na importaçÍo:', error);
      const description = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro na importaçÍo', { description });
      setEtapa('preview');
    }
  };

  // Reiniciar
  const reiniciar = () => {
    setEtapa('upload');
    setArquivo(null);
    setResultadoParsing(null);
    setItens([]);
    setProgresso(0);
    setMensagemProgresso('');
    setErrosImportacao([]);
    setMetricasIA(null);
    setClassificacoesMap(new Map());
    setDuplicatasMap(new Map());
    setValidacao(null);
    limparCacheReferencias(); // Limpar cache para próxima importaçÍo
  };

  // Formatar valor - usando formatarMoeda centralizado
  const formatarValor = (valor: number) => {
    return formatarMoeda(valor);
  };

  // Cor do status
  const corStatus = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'duplicado': return 'bg-orange-100 text-orange-800';
      case 'a_definir': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categoriasDoTipo = (tipo: 'entrada' | 'saida') => {
    const filtradas = categorias.filter((c) => {
      const t = (c.tipo || '').toString().toLowerCase();
      return tipo === 'entrada'
        ? t.includes('entrada') || t.includes('receita')
        : t.includes('saida') || t.includes('despesa') || t.includes('pagar');
    });
    return filtradas.length > 0 ? filtradas : categorias;
  };

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Importar Extrato Bancário</h1>
          <p className="text-[12px] text-gray-600">ImportaçÍo inteligente com classificaçÍo automática por IA</p>
        </div>
        {etapa !== 'upload' && (
          <Button variant="outline" onClick={reiniciar}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Nova ImportaçÍo
          </Button>
        )}
      </div>

      {/* ETAPA 1: UPLOAD */}
      {etapa === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload do Extrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-gray-600" htmlFor="template-format">
                  Formato do modelo
                </label>
                <select
                  id="template-format"
                  value={templateFormat}
                  onChange={(e) => setTemplateFormat(e.target.value as 'xlsx' | 'csv')}
                  className="px-3 py-2 border border-gray-200 rounded-md text-[12px] bg-white"
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => downloadFinanceiroTemplate(templateFormat)}
              >
                <Download className="w-4 h-4" />
                Baixar modelo (campos completos)
              </Button>
              <p className="text-[12px] text-gray-600">
                Campos: data, descriçÍo, valor, tipo, núcleo, categoria, projeto, contrato, pessoa, status, forma_pagamento,
                conta_bancaria, documento, centro_custo, parcela, data_vencimento, data_pagamento, observações.
              </p>
            </div>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-[20px] font-light text-gray-900 mb-2">
                Arraste o arquivo do extrato aqui
              </h3>
              <p className="text-[12px] text-gray-600 mb-4">
                ou clique para selecionar um arquivo
              </p>
              <p className="text-[12px] text-gray-500">
                Formatos aceitos: Excel (.xlsx, .xls), CSV, OFX, PDF
              </p>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv,.ofx,.pdf"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {/* Configurações avançadas de IA */}
            <div className="mt-6 border rounded-lg">
              <button
                type="button"
                onClick={() => setMostrarConfigIA(!mostrarConfigIA)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span className="text-[13px] font-light text-gray-700">Configurações Avançadas de IA</span>
                </div>
                {mostrarConfigIA ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {mostrarConfigIA && (
                <div className="p-4 pt-0 space-y-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="promptPersonalizado" className="text-[12px] text-gray-700">
                      Prompt Personalizado para ClassificaçÍo
                    </Label>
                    <Textarea
                      id="promptPersonalizado"
                      value={promptPersonalizado}
                      onChange={(e) => setPromptPersonalizado(e.target.value)}
                      placeholder="Ex: Classifique as transações considerando que pagamentos para 'CONSTRUTORA XYZ' sÍo relacionados ao projeto 'Obra Residencial'. Despesas com 'LEROY' sÍo materiais de construçÍo..."
                      className="min-h-[100px] text-[12px]"
                    />
                    <p className="text-xs text-gray-500">
                      Use este campo para dar instruções específicas à IA sobre como classificar suas transações.
                      Mencione nomes de fornecedores, projetos específicos ou regras de categorizaçÍo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Painel de Erros */}
            {errosImportacao.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-[14px] font-light text-red-800 mb-2">Erro ao processar arquivo</h4>
                    <ul className="list-disc list-inside space-y-1 text-[12px] text-red-700">
                      {errosImportacao.map((erro, i) => (
                        <li key={i}>{erro}</li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-[12px] text-red-600">Dicas para resolver:</p>
                      <ul className="list-disc list-inside space-y-1 text-[12px] text-red-600 mt-1">
                        <li>Verifique se o arquivo tem colunas de <strong>Data</strong>, <strong>DescriçÍo</strong> e <strong>Valor</strong></li>
                        <li>O formato de data deve ser DD/MM/AAAA ou DD/MM/AA</li>
                        <li>O valor pode usar vírgula ou ponto (ex: 1.234,56 ou 1234.56)</li>
                        <li>Certifique-se que os dados começam na primeira planilha</li>
                        <li>Tente exportar do banco em formato OFX (mais confiável)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <p className="text-[12px] font-light text-blue-900">Excel</p>
                <p className="text-xs text-blue-600">.xlsx, .xls</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <p className="text-[12px] font-light text-green-900">CSV</p>
                <p className="text-xs text-green-600">.csv</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <p className="text-[12px] font-light text-purple-900">OFX</p>
                <p className="text-xs text-purple-600">.ofx</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-red-600 mb-2" />
                <p className="text-[12px] font-light text-red-900">PDF</p>
                <p className="text-xs text-red-600">IA Vision</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2: PROCESSANDO */}
      {etapa === 'processando' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Brain className="w-16 h-16 mx-auto text-primary animate-pulse mb-4" />
              <h3 className="text-[20px] font-light text-gray-900 mb-2">
                Processando com Inteligencia Artificial
              </h3>
              <p className="text-[12px] text-gray-600 mb-6">{mensagemProgresso}</p>
              <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="text-[12px] text-gray-500 mt-2">{progresso}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3: PREVIEW */}
      {etapa === 'preview' && (
        <>
          {/* Estatisticas */}
          <div className="grid grid-cols-6 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="p-4 text-center">
                <p className="text-[18px] font-light text-blue-700">{estatisticas.total}</p>
                <p className="text-[12px] text-blue-600">Total</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="p-4 text-center">
                <p className="text-[18px] font-light text-green-700">{estatisticas.aprovados}</p>
                <p className="text-[12px] text-green-600">Aprovados</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              <CardContent className="p-4 text-center">
                <p className="text-[18px] font-light text-orange-700">{estatisticas.duplicados}</p>
                <p className="text-[12px] text-orange-600">Duplicados</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50">
              <CardContent className="p-4 text-center">
                <p className="text-[18px] font-light text-yellow-700">{estatisticas.aDefinir}</p>
                <p className="text-[12px] text-yellow-600">A Definir</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50">
              <CardContent className="p-4 text-center">
                <p className="text-[18px] font-light text-emerald-700">{formatarValor(estatisticas.valorEntradas)}</p>
                <p className="text-[12px] text-emerald-600">Entradas</p>
              </CardContent>
            </Card>
          <Card className="bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-[18px] font-light text-red-700">{formatarValor(estatisticas.valorSaidas)}</p>
              <p className="text-[12px] text-red-600">Saidas</p>
            </CardContent>
          </Card>
        </div>

          {metricasMatch && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  Métricas de ClassificaçÍo Inteligente
                  {metricasMatch.confiancaMedia !== undefined && (
                    <Badge variant={metricasMatch.confiancaMedia >= 70 ? 'default' : 'secondary'}>
                      Confiança média: {metricasMatch.confiancaMedia}%
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[12px] text-gray-500 mb-2">Match automático por campo</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Categoria', valor: metricasMatch.categorias, cor: 'bg-emerald-500' },
                      { label: 'Projeto', valor: metricasMatch.projetos, cor: 'bg-blue-500' },
                      { label: 'Favorecido', valor: metricasMatch.pessoas, cor: 'bg-purple-500' },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className="w-24 text-gray-700 text-xs">{m.label}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${m.cor} transition-all duration-500`}
                            style={{ width: `${m.valor}%` }}
                          />
                        </div>
                        <span className={`w-12 text-right text-[12px] ${m.valor >= 70 ? 'text-green-600' : m.valor >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {m.valor}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-2">Centro de Custo / Conta / Núcleo</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Centro Custo', valor: metricasMatch.centros, cor: 'bg-orange-500' },
                      { label: 'Conta', valor: metricasMatch.contas, cor: 'bg-cyan-500' },
                      { label: 'Núcleo', valor: metricasMatch.nucleosMatch, cor: 'bg-pink-500' },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className="w-24 text-gray-700 text-xs">{m.label}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${m.cor} transition-all duration-500`}
                            style={{ width: `${m.valor}%` }}
                          />
                        </div>
                        <span className={`w-12 text-right text-[12px] ${m.valor >= 70 ? 'text-green-600' : m.valor >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {m.valor}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg text-xs text-gray-700 border border-gray-200">
                  <p className="text-[12px] font-light text-gray-900 mb-2 flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    Motor de Matching
                  </p>
                  <ul className="list-none space-y-1 text-[12px]">
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Levenshtein + tokenizaçÍo
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Keywords de 19+ categorias
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Padrões aprendidos
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ExtraçÍo de favorecido
                    </li>
                  </ul>
                  {metricasMatch.periodoInicio && metricasMatch.periodoFim && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500">
                      Período: {formatarData(metricasMatch.periodoInicio + 'T00:00:00')} a {formatarData(metricasMatch.periodoFim + 'T00:00:00')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado da ValidaçÍo Automática */}
          {validacao && (validacao.erros.length > 0 || validacao.avisos.length > 0 || validacao.sugestoes.length > 0) && (
            <Card className={validacao.erros.length > 0 ? 'border-red-300 bg-red-50' : validacao.avisos.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-blue-300 bg-blue-50'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {validacao.erros.length > 0 ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-700">ValidaçÍo com Erros</span>
                    </>
                  ) : validacao.avisos.length > 0 ? (
                    <>
                      <Brain className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-700">ValidaçÍo com Avisos</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700">Sugestões de Melhoria</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs space-y-3">
                {validacao.erros.length > 0 && (
                  <div>
                    <p className="text-[12px] text-red-700 mb-1">Erros ({validacao.erros.length}):</p>
                    <ul className="list-disc list-inside text-red-600 space-y-0.5 max-h-24 overflow-auto">
                      {validacao.erros.slice(0, 5).map((erro, i) => (
                        <li key={i}>{erro}</li>
                      ))}
                      {validacao.erros.length > 5 && (
                        <li className="text-[12px]">...e mais {validacao.erros.length - 5} erros</li>
                      )}
                    </ul>
                  </div>
                )}
                {validacao.avisos.length > 0 && (
                  <div>
                    <p className="text-[12px] text-yellow-700 mb-1">Avisos ({validacao.avisos.length}):</p>
                    <ul className="list-disc list-inside text-yellow-700 space-y-0.5 max-h-24 overflow-auto">
                      {validacao.avisos.slice(0, 5).map((aviso, i) => (
                        <li key={i}>{aviso}</li>
                      ))}
                      {validacao.avisos.length > 5 && (
                        <li className="text-[12px]">...e mais {validacao.avisos.length - 5} avisos</li>
                      )}
                    </ul>
                  </div>
                )}
                {validacao.sugestoes.length > 0 && (
                  <div>
                    <p className="text-[12px] text-blue-700 mb-1">Sugestões:</p>
                    <ul className="list-disc list-inside text-blue-600 space-y-0.5">
                      {validacao.sugestoes.map((sug, i) => (
                        <li key={i}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Resumo de detalhes */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  {validacao.detalhes.possivelDuplicata.length > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-orange-100 border-orange-300">
                      {validacao.detalhes.possivelDuplicata.length} possíveis duplicatas
                    </Badge>
                  )}
                  {validacao.detalhes.linhasSemCategoria.length > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-yellow-100 border-yellow-300">
                      {validacao.detalhes.linhasSemCategoria.length} sem categoria
                    </Badge>
                  )}
                  {validacao.detalhes.linhasSemProjeto.length > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-gray-100 border-gray-300">
                      {validacao.detalhes.linhasSemProjeto.length} sem projeto
                    </Badge>
                  )}
                  {validacao.detalhes.datasFuturas.length > 0 && (
                    <Badge variant="outline" className="text-[10px] bg-red-100 border-red-300">
                      {validacao.detalhes.datasFuturas.length} datas futuras
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acoes em lote */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={aprovarTodos}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aprovar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={rejeitarDuplicados}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar Duplicados
                  </Button>
                  <Button variant="outline" size="sm" onClick={inverterSelecao}>
                    <Copy className="w-4 h-4 mr-2" />
                    Inverter SeleçÍo
                  </Button>
                </div>
                <Button onClick={importarLancamentos} disabled={validacao?.erros && validacao.erros.length > 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Importar {itens.filter(i => i.selecionado).length} Lançamentos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de itens */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={itens.every(i => i.selecionado)}
                          onCheckedChange={(checked) => {
                            setItens(prev => prev.map(item => ({ ...item, selecionado: !!checked })));
                          }}
                        />
                      </TableHead>
                      <TableHead className="w-24">Data</TableHead>
                      <TableHead>DescriçÍo</TableHead>
                      <TableHead className="w-32 text-right">Valor</TableHead>
                      <TableHead className="w-28">Categoria</TableHead>
                      <TableHead className="w-32">Centro de Custo</TableHead>
                      <TableHead className="w-28">Núcleo</TableHead>
                      <TableHead className="w-32">Projeto</TableHead>
                      <TableHead className="w-32">Favorecido</TableHead>
                      <TableHead className="w-32">Conta</TableHead>
                      <TableHead className="w-20 text-center">Confiança</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow
                        key={index}
                        className={item.status === 'rejeitado' ? 'opacity-50' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={item.selecionado}
                            onCheckedChange={(checked) => atualizarItem(index, { selecionado: !!checked })}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[12px]">
                          {formatarData(item.data + 'T00:00:00')}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="truncate text-[12px]">{item.classificacao?.descricao_formatada || item.descricao}</p>
                            {item.classificacao?.motivo && (
                              <p className="text-xs text-gray-400 truncate">{item.classificacao.motivo}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-mono ${item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.tipo === 'entrada' ? '+' : '-'}{formatarValor(item.valor)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.classificacao?.categoria_id || ''}
                            onValueChange={(value) => {
                              atualizarItem(index, {
                                classificacao: {
                                  ...item.classificacao!,
                                  categoria_id: value,
                                },
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriasDoTipo(item.tipo).concat(categoriasDespesa).map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.centro_custo_id || ''}
                            onValueChange={(value) => atualizarItem(index, { centro_custo_id: value })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Centro de custo" />
                            </SelectTrigger>
                            <SelectContent>
                              {centrosCusto.map((cc) => (
                                <SelectItem key={cc.id} value={cc.id}>
                                  {String(cc.nome || cc.codigo || 'Centro')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.nucleo || ''}
                            onValueChange={(value) => atualizarItem(index, { nucleo: value })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Núcleo" />
                            </SelectTrigger>
                            <SelectContent>
                              {nucleos.map((n) => (
                                <SelectItem key={n} value={n}>
                                  {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.classificacao?.projeto_id || ''}
                            onValueChange={(value) => {
                              atualizarItem(index, {
                                classificacao: {
                                  ...item.classificacao!,
                                  projeto_id: value,
                                },
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {projetos.map(proj => (
                                <SelectItem key={proj.id} value={proj.id}>
                                  {proj.nome || proj.numero}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.pessoa_id || ''}
                            onValueChange={(value) => atualizarItem(index, { pessoa_id: value })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Favorecido / Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {pessoas
                                .filter((p) => ['COLABORADOR', 'FORNECEDOR', 'ESPECIFICADOR', 'PRESTADOR', 'fornecedor', 'colaborador', 'especificador', 'prestador'].includes((p.tipo || '').toString()))
                                .map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.nome} ({p.tipo})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.conta_id || ''}
                            onValueChange={(value) => atualizarItem(index, { conta_id: value })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Conta / Carteira" />
                            </SelectTrigger>
                            <SelectContent>
                              {contas.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nome || c.numero || 'Conta'} {c.banco ? `- ${c.banco}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant={item.classificacao?.confianca && item.classificacao.confianca >= 80 ? 'default' : 'secondary'}
                              className={
                                item.classificacao?.confianca && item.classificacao.confianca >= 80
                                  ? 'bg-green-500'
                                  : item.classificacao?.confianca && item.classificacao.confianca >= 50
                                  ? 'bg-yellow-500'
                                  : ''
                              }
                            >
                              {item.classificacao?.confianca || 0}%
                            </Badge>
                            {/* Mini indicadores de match por campo */}
                            {item.classificacao?.match_scores && (
                              <div className="flex gap-0.5" title="Scores: Cat/Proj/Pessoa">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    item.classificacao.match_scores.categoria > 70 ? 'bg-emerald-500' :
                                    item.classificacao.match_scores.categoria > 0 ? 'bg-yellow-400' : 'bg-gray-200'
                                  }`}
                                  title={`Categoria: ${item.classificacao.match_scores.categoria}%`}
                                />
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    item.classificacao.match_scores.projeto > 70 ? 'bg-blue-500' :
                                    item.classificacao.match_scores.projeto > 0 ? 'bg-yellow-400' : 'bg-gray-200'
                                  }`}
                                  title={`Projeto: ${item.classificacao.match_scores.projeto}%`}
                                />
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    item.classificacao.match_scores.pessoa > 70 ? 'bg-purple-500' :
                                    item.classificacao.match_scores.pessoa > 0 ? 'bg-yellow-400' : 'bg-gray-200'
                                  }`}
                                  title={`Pessoa: ${item.classificacao.match_scores.pessoa}%`}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={corStatus(item.status)}>
                            {item.status === 'aprovado' && 'Aprovado'}
                            {item.status === 'rejeitado' && 'Rejeitado'}
                            {item.status === 'duplicado' && 'Duplicado'}
                            {item.status === 'a_definir' && 'A Definir'}
                            {item.status === 'pendente' && 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => atualizarItem(index, { status: 'aprovado', selecionado: true })}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => atualizarItem(index, { status: 'rejeitado', selecionado: false })}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ETAPA 4: IMPORTANDO */}
      {etapa === 'importando' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Importando Lançamentos
              </h3>
              <p className="text-gray-500 mb-6">{mensagemProgresso}</p>
              <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{progresso}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 5: CONCLUIDO */}
      {etapa === 'concluido' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-[20px] font-medium text-gray-900 mb-2">
                ImportaçÍo Concluída!
              </h3>
              <p className="text-gray-500 mb-6">
                {estatisticas.aprovados} lançamentos foram importados com sucesso.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={reiniciar}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nova ImportaçÍo
                </Button>
                <Button onClick={() => window.location.href = '/financeiro/lancamentos'}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ver Lançamentos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


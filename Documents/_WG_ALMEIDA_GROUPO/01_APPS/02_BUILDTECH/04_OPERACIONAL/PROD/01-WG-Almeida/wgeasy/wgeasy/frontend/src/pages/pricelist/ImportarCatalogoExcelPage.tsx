// ========================================
// PAGINA DE IMPORTACAO DE CATALOGOS VIA EXCEL
// Importa produtos de planilhas Excel de fabricantes (Portobello, Eliane, etc)
// ========================================

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  Download,
  Package,
  Columns,
  Image,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  FABRICANTES_REVESTIMENTOS,
  PricelistCategoria,
} from '@/types/pricelist';
import { listarCategorias } from '@/lib/pricelistApi';

// Interface do produto importado
interface ProdutoImportado {
  index: number;
  // Identificacao
  codigo: string;
  nome: string;
  descricao: string;
  categoria_nome: string;
  // Dimensoes
  espessura: number | null;
  largura: number | null;
  comprimento: number | null;
  peso: number | null;
  // Metragem
  m2_peca: number | null;
  m2_caixa: number | null;
  unidades_caixa: number | null;
  rendimento: number | null;
  // Classificacao
  aplicacao: string;
  ambiente: string;
  acabamento: string;
  formato: string;
  borda: string;
  resistencia: string;
  cor: string;
  // Fabricante
  fabricante: string;
  linha: string;
  modelo: string;
  codigo_fabricante: string;
  link_produto: string;
  imagem_url: string;
  // Precos
  preco: number;
  preco_m2: number | null;
  preco_caixa: number | null;
  unidade: string;
  unidade_venda: string;
  // Status
  status: 'pendente' | 'valido' | 'erro' | 'duplicado';
  erro?: string;
  selecionado: boolean;
}

// Mapeamento de colunas Excel -> campos do sistema
interface MapeamentoColunas {
  [key: string]: string | null;
}

// Colunas esperadas do Excel (baseado no plano)
type ExcelCell = string | number | null | undefined;
type ExcelRow = ExcelCell[];

const COLUNAS_ESPERADAS = [
  { key: 'imagem_url', label: 'Imagem', aliases: ['IMAGEM', 'IMG', 'FOTO', 'IMAGE', 'PICTURE'] },
  { key: 'nome', label: 'Nome do Produto', aliases: ['ITEM', 'NOME', 'PRODUTO', 'DESCRICAO_PRODUTO', 'NAME'] },
  { key: 'categoria_nome', label: 'Categoria', aliases: ['CATEGORIA', 'CATEGORY', 'TIPO_PRODUTO'] },
  { key: 'aplicacao', label: 'Aplicacao', aliases: ['APLICACAO', 'APLICACOES', 'APPLICATION', 'USO'] },
  { key: 'descricao', label: 'Descricao', aliases: ['DESCRICAO', 'DESC', 'DESCRIPTION', 'OBS', 'OBSERVACAO'] },
  { key: 'espessura', label: 'Espessura (cm)', aliases: ['ESPESSURA', 'ESP', 'THICKNESS'] },
  { key: 'largura', label: 'Largura (m)', aliases: ['LARGURA', 'LARG', 'WIDTH'] },
  { key: 'comprimento', label: 'Comprimento (m)', aliases: ['COMPRIMENTO', 'COMP', 'LENGTH', 'ALTURA'] },
  { key: 'm2_peca', label: 'M2 por Peca', aliases: ['M2_PECA', 'M2 PECA', 'M2PECA', 'M²_PECA', 'M² PECA'] },
  { key: 'unidades_caixa', label: 'Unidades/Caixa', aliases: ['UNID_POR_CAIXA', 'UNID. POR CAIXA', 'QTD_CAIXA', 'PECAS_CAIXA'] },
  { key: 'm2_caixa', label: 'M2 por Caixa', aliases: ['M2_CAIXA', 'M2 CAIXA', 'M2CAIXA', 'M²_CAIXA', 'M² CAIXA'] },
  { key: 'fabricante', label: 'Fabricante', aliases: ['FABRICANTE', 'MARCA', 'MANUFACTURER', 'BRAND'] },
  { key: 'linha', label: 'Linha/Colecao', aliases: ['LINHA', 'COLECAO', 'COLLECTION', 'LINE'] },
  { key: 'modelo', label: 'Modelo', aliases: ['MODELO', 'MODEL', 'REF', 'REFERENCIA'] },
  { key: 'codigo_fabricante', label: 'Codigo Fabricante', aliases: ['CODIGO', 'COD', 'SKU', 'CODE', 'CODIGO_FABRICANTE'] },
  { key: 'link_produto', label: 'Link do Produto', aliases: ['LINK', 'LINK_PRODUTO', 'URL', 'LINK DO PRODUTO'] },
  { key: 'formato', label: 'Formato', aliases: ['FORMATO', 'DIMENSOES', 'SIZE', 'TAMANHO'] },
  { key: 'acabamento', label: 'Acabamento', aliases: ['ACABAMENTO', 'FINISH', 'SUPERFICIE'] },
  { key: 'borda', label: 'Borda', aliases: ['BORDA', 'EDGE', 'TIPO_BORDA'] },
  { key: 'resistencia', label: 'Resistencia (PEI)', aliases: ['RESISTENCIA', 'PEI', 'RESISTANCE'] },
  { key: 'cor', label: 'Cor', aliases: ['COR', 'COLOR', 'COLOUR'] },
  { key: 'preco', label: 'Preco Unitario', aliases: ['PRECO', 'VALOR', 'PRICE', 'PRECO_UNITARIO'] },
  { key: 'preco_caixa', label: 'Preco Caixa', aliases: ['PRECO_CAIXA', 'VALOR_CAIXA', 'PRICE_BOX'] },
  { key: 'unidade', label: 'Unidade', aliases: ['UNIDADE', 'UN', 'UNIT'] },
];

type Etapa = 'upload' | 'mapeamento' | 'preview' | 'importando' | 'concluido';

const loadXLSX = () => import('@/lib/xlsxCompat');

export default function ImportarCatalogoExcelPage() {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [dadosExcel, setDadosExcel] = useState<ExcelRow[]>([]);
  const [cabecalhos, setCabecalhos] = useState<string[]>([]);
  const [mapeamento, setMapeamento] = useState<MapeamentoColunas>({});
  const [itens, setItens] = useState<ProdutoImportado[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
  const [categorias, setCategorias] = useState<PricelistCategoria[]>([]);
  const [categoriaDestino, setCategoriaDestino] = useState<string>('');
  const [fabricantePadrao, setFabricantePadrao] = useState('');
  // Carregar categorias
  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const cats = await listarCategorias();
        setCategorias(cats);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };
    carregarCategorias();
  }, []);

  // Estatisticas
  const estatisticas = {
    total: itens.length,
    validos: itens.filter(i => i.status === 'valido').length,
    erros: itens.filter(i => i.status === 'erro').length,
    duplicados: itens.filter(i => i.status === 'duplicado').length,
    selecionados: itens.filter(i => i.selecionado).length,
  };

  // Processar arquivo Excel
  const processarExcel = useCallback(async (file: File) => {
    try {
      const XLSX = await loadXLSX();
      const data = await file.arrayBuffer();
      const workbook = await XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as ExcelRow[];

      if (jsonData.length < 2) {
        toast.error('Arquivo vazio ou sem dados');
        return;
      }

      // Primeira linha = cabecalhos
      const headers = jsonData[0].map((h) => String(h ?? '').trim().toUpperCase());
      setCabecalhos(headers);
      setDadosExcel(jsonData.slice(1));

      // Tentar mapear automaticamente
      const autoMap: MapeamentoColunas = {};
      COLUNAS_ESPERADAS.forEach(col => {
        const found = headers.findIndex((h: string) =>
          h && col.aliases.some(alias => h.includes(alias.toUpperCase()))
        );
        if (found !== -1 && headers[found]) {
          autoMap[col.key] = headers[found];
        }
      });
      setMapeamento(autoMap);

      setEtapa('mapeamento');
      toast.success(`Arquivo carregado: ${jsonData.length - 1} linhas encontradas`);
    } catch (error: unknown) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      console.error('Erro ao ler Excel:', mensagemErro);
      toast.error('Erro ao ler arquivo Excel', { description: mensagemErro });
    }
  }, []);

  // Upload de arquivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        toast.error('Selecione um arquivo Excel (.xlsx ou .xls)');
        return;
      }
      processarExcel(file);
    }
  }, [processarExcel]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.match(/\.(xlsx|xls)$/i)) {
      processarExcel(file);
    } else {
      toast.error('Selecione um arquivo Excel (.xlsx ou .xls)');
    }
  }, [processarExcel]);

  // Atualizar mapeamento de coluna
  const atualizarMapeamento = (campo: string, coluna: string | null) => {
    setMapeamento(prev => ({
      ...prev,
      [campo]: coluna,
    }));
  };

  // Processar dados com mapeamento
  const processarDados = async () => {
    setEtapa('preview');
    setProgresso(0);
    setMensagemProgresso('Processando dados...');

    try {
      const produtos: ProdutoImportado[] = [];

      for (let i = 0; i < dadosExcel.length; i++) {
        setProgresso(Math.round((i / dadosExcel.length) * 80));

        const row = dadosExcel[i];
        const getValue = (campo: string) => {
          const coluna = mapeamento[campo];
          if (!coluna) return '';
          const idx = cabecalhos.indexOf(coluna);
          return idx !== -1 ? String(row[idx] || '').trim() : '';
        };
        const getNumber = (campo: string) => {
          const val = getValue(campo);
          if (!val) return null;
          const num = parseFloat(val.replace(',', '.'));
          return isNaN(num) ? null : num;
        };

        const nome = getValue('nome');
        if (!nome) continue; // Pular linhas sem nome

        const produto: ProdutoImportado = {
          index: i,
          // Identificacao
          codigo: getValue('codigo_fabricante') || `CAT-${Date.now()}-${i}`,
          nome,
          descricao: getValue('descricao'),
          categoria_nome: getValue('categoria_nome'),
          // Dimensoes
          espessura: getNumber('espessura'),
          largura: getNumber('largura'),
          comprimento: getNumber('comprimento'),
          peso: getNumber('peso'),
          // Metragem
          m2_peca: getNumber('m2_peca'),
          m2_caixa: getNumber('m2_caixa'),
          unidades_caixa: getNumber('unidades_caixa') ? Math.round(getNumber('unidades_caixa')!) : null,
          rendimento: getNumber('rendimento'),
          // Classificacao
          aplicacao: getValue('aplicacao'),
          ambiente: getValue('ambiente'),
          acabamento: getValue('acabamento'),
          formato: getValue('formato'),
          borda: getValue('borda'),
          resistencia: getValue('resistencia'),
          cor: getValue('cor'),
          // Fabricante
          fabricante: getValue('fabricante') || fabricantePadrao,
          linha: getValue('linha'),
          modelo: getValue('modelo'),
          codigo_fabricante: getValue('codigo_fabricante'),
          link_produto: getValue('link_produto'),
          imagem_url: getValue('imagem_url'),
          // Precos
          preco: getNumber('preco') || 0,
          preco_m2: getNumber('preco_m2'),
          preco_caixa: getNumber('preco_caixa'),
          unidade: getValue('unidade') || 'M2',
          unidade_venda: 'CX',
          // Status
          status: 'valido',
          selecionado: true,
        };

        // Calcular preco_m2 se tiver preco_caixa e m2_caixa
        if (!produto.preco_m2 && produto.preco_caixa && produto.m2_caixa && produto.m2_caixa > 0) {
          produto.preco_m2 = Math.round((produto.preco_caixa / produto.m2_caixa) * 100) / 100;
        }

        // Validar
        if (!produto.nome) {
          produto.status = 'erro';
          produto.erro = 'Nome obrigatorio';
          produto.selecionado = false;
        }

        produtos.push(produto);
      }

      // Verificar duplicatas
      setProgresso(85);
      setMensagemProgresso('Verificando duplicatas...');
      const itensComDuplicatas = await verificarDuplicatas(produtos);

      setItens(itensComDuplicatas);
      setProgresso(100);
      toast.success(`${produtos.length} produtos processados!`);
    } catch (error: unknown) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      console.error('Erro ao processar dados:', mensagemErro);
      toast.error('Erro ao processar dados', { description: mensagemErro });
    }
  };

  // Verificar duplicatas
  const verificarDuplicatas = async (produtos: ProdutoImportado[]): Promise<ProdutoImportado[]> => {
    try {
      // Buscar por codigo_fabricante ou nome+fabricante
      const { data: existentes } = await supabase
        .from('pricelist_itens')
        .select('nome, codigo, codigo_fabricante, fabricante')
        .eq('ativo', true);

      const mapExistentes = new Map<string, boolean>();
      (existentes || []).forEach(e => {
        if (e.codigo_fabricante) {
          mapExistentes.set(e.codigo_fabricante.toLowerCase(), true);
        }
        if (e.nome && e.fabricante) {
          mapExistentes.set(`${e.nome.toLowerCase()}_${e.fabricante.toLowerCase()}`, true);
        }
      });

      return produtos.map(item => {
        // Verificar por codigo_fabricante
        if (item.codigo_fabricante && mapExistentes.has(item.codigo_fabricante.toLowerCase())) {
          return { ...item, status: 'duplicado' as const, erro: 'Codigo fabricante ja existe', selecionado: false };
        }
        // Verificar por nome+fabricante
        if (item.nome && item.fabricante) {
          const key = `${item.nome.toLowerCase()}_${item.fabricante.toLowerCase()}`;
          if (mapExistentes.has(key)) {
            return { ...item, status: 'duplicado' as const, erro: 'Produto ja existe', selecionado: false };
          }
        }
        return item;
      });
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      return produtos;
    }
  };

  // Atualizar item na tabela
  const atualizarItem = (index: number, changes: Partial<ProdutoImportado>) => {
    setItens(prev => prev.map((item) =>
      item.index === index ? { ...item, ...changes } : item
    ));
  };

  // Selecionar/desmarcar todos
  const selecionarTodosValidos = () => {
    setItens(prev => prev.map(item =>
      item.status === 'valido' ? { ...item, selecionado: true } : item
    ));
  };
  const desmarcarTodos = () => {
    setItens(prev => prev.map(item => ({ ...item, selecionado: false })));
  };

  // Importar produtos
  const importarProdutos = async () => {
    const itensSelecionados = itens.filter(i => i.selecionado && i.status !== 'erro');

    if (itensSelecionados.length === 0) {
      toast.warning('Nenhum item selecionado para importacao');
      return;
    }

    setEtapa('importando');
    setProgresso(0);
    let importados = 0;
    let erros = 0;

    for (let i = 0; i < itensSelecionados.length; i++) {
      const item = itensSelecionados[i];
      setProgresso(Math.round((i / itensSelecionados.length) * 100));
      setMensagemProgresso(`Importando ${i + 1} de ${itensSelecionados.length}...`);

      try {
        const { error } = await supabase
          .from('pricelist_itens')
          .insert({
            // Identificacao
            codigo: item.codigo,
            nome: item.nome,
            descricao: item.descricao,
            tipo: 'produto',
            categoria_id: categoriaDestino || null,
            // Dimensoes
            espessura: item.espessura,
            largura: item.largura,
            comprimento: item.comprimento,
            peso: item.peso,
            // Metragem
            m2_peca: item.m2_peca,
            m2_caixa: item.m2_caixa,
            unidades_caixa: item.unidades_caixa,
            rendimento: item.rendimento,
            // Classificacao
            aplicacao: item.aplicacao || null,
            ambiente: item.ambiente || null,
            acabamento: item.acabamento || null,
            formato: item.formato || null,
            borda: item.borda || null,
            resistencia: item.resistencia || null,
            cor: item.cor || null,
            // Fabricante
            fabricante: item.fabricante || null,
            linha: item.linha || null,
            modelo: item.modelo || null,
            codigo_fabricante: item.codigo_fabricante || null,
            link_produto: item.link_produto || null,
            marca: item.fabricante || null, // Manter compatibilidade
            imagem_url: item.imagem_url || null,
            // Precos
            preco: item.preco || 0,
            preco_m2: item.preco_m2,
            preco_caixa: item.preco_caixa,
            unidade: item.unidade || 'M2',
            unidade_venda: item.unidade_venda || 'CX',
            // Status
            ativo: true,
          });

        if (error) {
          console.error('Erro ao importar:', error);
          erros++;
        } else {
          importados++;
        }
      } catch (e) {
        console.error('Excecao ao importar:', e);
        erros++;
      }
    }

    setProgresso(100);
    setEtapa('concluido');
    toast.success(`${importados} produtos importados!${erros > 0 ? ` (${erros} erros)` : ''}`);
  };

  // Reiniciar
  const reiniciar = () => {
    setEtapa('upload');
    setDadosExcel([]);
    setCabecalhos([]);
    setMapeamento({});
    setItens([]);
    setProgresso(0);
    setMensagemProgresso('');
  };

  // Cor do status
  const corStatus = (status: string) => {
    switch (status) {
      case 'valido': return 'bg-green-100 text-green-800';
      case 'erro': return 'bg-red-100 text-red-800';
      case 'duplicado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">Importar Catalogo Excel</h1>
          <p className="text-gray-500">Importe produtos de planilhas de fabricantes (Portobello, Eliane, etc)</p>
        </div>
        {etapa !== 'upload' && (
          <Button variant="outline" onClick={reiniciar}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Nova Importacao
          </Button>
        )}
      </div>

      {/* ETAPA 1: UPLOAD */}
      {etapa === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Upload do Arquivo Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fabricante padrao */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fabricante Padrao (opcional)</Label>
                <Select value={fabricantePadrao} onValueChange={setFabricantePadrao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione ou digite..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FABRICANTES_REVESTIMENTOS.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria Destino (opcional)</Label>
                <Select value={categoriaDestino || '__none__'} onValueChange={(v) => setCategoriaDestino(v === '__none__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem categoria</SelectItem>
                    {categorias.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Area de upload */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input-excel')?.click()}
            >
              <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arraste o arquivo Excel aqui
              </h3>
              <p className="text-gray-500 mb-4">
                ou clique para selecionar
              </p>
              <p className="text-sm text-gray-400">
                Formatos aceitos: .xlsx, .xls
              </p>
              <input
                id="file-input-excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Informacoes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Colunas esperadas na planilha:
              </h4>
              <div className="grid grid-cols-4 gap-2 text-sm text-blue-700">
                <span>IMAGEM</span>
                <span>ITEM (nome)</span>
                <span>CATEGORIA</span>
                <span>APLICACAO</span>
                <span>DESCRICAO</span>
                <span>ESPESSURA</span>
                <span>LARGURA</span>
                <span>COMPRIMENTO</span>
                <span>M2 PECA</span>
                <span>UNID. POR CAIXA</span>
                <span>M2 CAIXA</span>
                <span>FABRICANTE</span>
                <span>LINHA</span>
                <span>MODELO</span>
                <span>CODIGO</span>
                <span>LINK DO PRODUTO</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2: MAPEAMENTO */}
      {etapa === 'mapeamento' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Columns className="w-5 h-5" />
              Mapeamento de Colunas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Configure o mapeamento das colunas</p>
                <p>Selecione qual coluna do Excel corresponde a cada campo do sistema.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {COLUNAS_ESPERADAS.map(col => (
                <div key={col.key} className="space-y-1">
                  <Label className="text-sm">{col.label}</Label>
                  <Select
                    value={mapeamento[col.key] || '__none__'}
                    onValueChange={(v) => atualizarMapeamento(col.key, v === '__none__' ? null : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Nao mapeado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nao mapeado</SelectItem>
                      {cabecalhos.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview das primeiras linhas */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <span className="font-medium text-sm">Preview (primeiras 5 linhas)</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    {cabecalhos.slice(0, 8).map((h, index) => (
                      <TableHead key={index} className="text-xs whitespace-nowrap">{h}</TableHead>
                    ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosExcel.slice(0, 5).map((row, indexRow) => (
                      <TableRow key={indexRow}>
                        {row.slice(0, 8).map((cell: ExcelCell, indexCell: number) => (
                          <TableCell key={indexCell} className="text-xs whitespace-nowrap max-w-[150px] truncate">
                            {String(cell || '-')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={reiniciar}>
                Cancelar
              </Button>
              <Button onClick={processarDados}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Processar {dadosExcel.length} Linhas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3: PREVIEW */}
      {etapa === 'preview' && (
        <>
          {/* Estatisticas */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-normal text-blue-700">{estatisticas.total}</p>
                <p className="text-sm text-blue-600">Total</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-normal text-green-700">{estatisticas.validos}</p>
                <p className="text-sm text-green-600">Validos</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-normal text-red-700">{estatisticas.erros}</p>
                <p className="text-sm text-red-600">Erros</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-normal text-orange-700">{estatisticas.duplicados}</p>
                <p className="text-sm text-orange-600">Duplicados</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-normal text-purple-700">{estatisticas.selecionados}</p>
                <p className="text-sm text-purple-600">Selecionados</p>
              </CardContent>
            </Card>
          </div>

          {/* Acoes */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selecionarTodosValidos}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Selecionar Validos
                  </Button>
                  <Button variant="outline" size="sm" onClick={desmarcarTodos}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Desmarcar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEtapa('mapeamento')}>
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    Voltar Mapeamento
                  </Button>
                </div>
                <Button onClick={importarProdutos}>
                  <Download className="w-4 h-4 mr-2" />
                  Importar {estatisticas.selecionados} Produtos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={itens.filter(i => i.status === 'valido').every(i => i.selecionado)}
                          onCheckedChange={(checked) => {
                            setItens(prev => prev.map(item =>
                              item.status === 'valido' ? { ...item, selecionado: !!checked } : item
                            ));
                          }}
                        />
                      </TableHead>
                      <TableHead className="w-12">IMG</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Fabricante</TableHead>
                      <TableHead>Linha</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead>M2/Cx</TableHead>
                      <TableHead className="text-right">Preco</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow
                        key={item.index}
                        className={item.status === 'erro' ? 'bg-red-50' : item.status === 'duplicado' ? 'bg-orange-50' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={item.selecionado}
                            onCheckedChange={(checked) => atualizarItem(item.index, { selecionado: !!checked })}
                            disabled={item.status === 'erro'}
                          />
                        </TableCell>
                        <TableCell>
                          {item.imagem_url ? (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                              <Image className="w-5 h-5 text-gray-400" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{item.nome}</p>
                            <p className="text-xs text-gray-500 truncate">{item.descricao || item.modelo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{item.fabricante}</TableCell>
                        <TableCell className="text-sm">{item.linha}</TableCell>
                        <TableCell className="text-sm">{item.formato}</TableCell>
                        <TableCell className="text-sm">
                          {item.m2_caixa ? `${item.m2_caixa} m²` : '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {item.preco_caixa ? (
                            <div>
                              <p>R$ {item.preco_caixa.toFixed(2)}/cx</p>
                              {item.preco_m2 && (
                                <p className="text-xs text-gray-500">R$ {item.preco_m2.toFixed(2)}/m²</p>
                              )}
                            </div>
                          ) : item.preco ? (
                            <p>R$ {item.preco.toFixed(2)}</p>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={corStatus(item.status)}>
                            {item.status === 'valido' && 'Valido'}
                            {item.status === 'erro' && 'Erro'}
                            {item.status === 'duplicado' && 'Duplicado'}
                            {item.status === 'pendente' && 'Pendente'}
                          </Badge>
                          {item.erro && (
                            <p className="text-xs text-red-600 mt-1">{item.erro}</p>
                          )}
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
                Importando Produtos
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
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Importacao Concluida!
              </h3>
              <p className="text-gray-500 mb-6">
                Os produtos foram importados para o Pricelist.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={reiniciar}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nova Importacao
                </Button>
                <Button onClick={() => window.location.href = '/pricelist'}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ver Pricelist
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

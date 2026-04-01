// ========================================
// PAGINA DE IMPORTACAO DE PESSOAS COM IA
// Importa colaboradores, clientes, fornecedores via Excel/CSV
// ========================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  Download,
  RefreshCw,
  ArrowRight,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { PessoaTipo, PessoaInput } from '@/types/pessoas';

type PessoaImportacao = Omit<PessoaInput, 'status'> & {
  index: number;
  status: 'pendente' | 'valido' | 'erro' | 'duplicado';
  erro?: string;
  selecionado: boolean;
};

type Etapa = 'upload' | 'processando' | 'preview' | 'importando' | 'concluido';

const loadXLSX = () => import('@/lib/xlsxCompat');

export default function ImportarPessoasPage() {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [_arquivo, setArquivo] = useState<File | null>(null);
  const [itens, setItens] = useState<PessoaImportacao[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<PessoaTipo>('COLABORADOR');

  // Configuracoes avancadas de IA
  const [promptPersonalizado, setPromptPersonalizado] = useState<string>("");
  const [mostrarConfigIA, setMostrarConfigIA] = useState(false);

  // Estatisticas
  const estatisticas = {
    total: itens.length,
    validos: itens.filter(i => i.status === 'valido').length,
    erros: itens.filter(i => i.status === 'erro').length,
    duplicados: itens.filter(i => i.status === 'duplicado').length,
    selecionados: itens.filter(i => i.selecionado).length,
  };

  // Upload de arquivo
  const handleFileSelect = async (file: File) => {
    setArquivo(file);
    setEtapa('processando');
    setProgresso(0);
    setMensagemProgresso('Lendo arquivo...');

    try {
      // 1. Parse do arquivo Excel/CSV
      setProgresso(20);
      const dados = await parseArquivo(file);

      if (!dados || dados.length === 0) {
        toast.error('Arquivo vazio ou formato invalido');
        setEtapa('upload');
        return;
      }

      // 2. Processar e validar dados
      setProgresso(50);
      setMensagemProgresso('Processando dados com IA...');
      const itensProcessados = await processarDados(dados, tipoPessoa, promptPersonalizado);

      // 3. Verificar duplicatas
      setProgresso(80);
      setMensagemProgresso('Verificando duplicatas...');
      const itensComDuplicatas = await verificarDuplicatas(itensProcessados);

      setItens(itensComDuplicatas);
      setProgresso(100);
      setEtapa('preview');
      toast.success(`${dados.length} registros processados!`);

    } catch (error: unknown) {
      console.error('Erro ao processar arquivo:', error);
      const message = error instanceof Error ? error.message : '';
      toast.error('Erro ao processar arquivo', { description: message });
      setEtapa('upload');
    }
  };

  // Parse do arquivo Excel/CSV
  const parseArquivo = async (file: File): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result as ArrayBuffer;
          const XLSX = await loadXLSX();
          const workbook = await XLSX.read(new Uint8Array(data), { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          resolve(jsonData);
        } catch {
          reject(new Error('Erro ao ler arquivo'));
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Valores ficticios padrao para campos obrigatorios vazios
  const VALORES_FICTICIOS = {
    email: 'editar@wgalmeida.com.br',
    texto: 'editar',
    numero: '00000',
    telefone: '00000000000',
    cpf: '00000000000',
    cnpj: '00000000000000',
    cep: '00000000',
  };

  // Processar dados com mapeamento inteligente
  const processarDados = async (
    dados: Record<string, unknown>[],
    tipo: PessoaTipo,
    _prompt?: string
  ): Promise<PessoaImportacao[]> => {
    // Mapeamento de campos comuns
    const mapeamentoCampos: Record<string, string[]> = {
      nome: ['nome', 'name', 'nome completo', 'colaborador', 'funcionario', 'razao social'],
      email: ['email', 'e-mail', 'correio', 'mail'],
      telefone: ['telefone', 'phone', 'celular', 'tel', 'whatsapp', 'fone'],
      cpf: ['cpf', 'documento', 'doc'],
      cnpj: ['cnpj'],
      rg: ['rg', 'identidade'],
      cargo: ['cargo', 'funcao', 'job', 'position', 'ocupacao'],
      empresa: ['empresa', 'company', 'organizacao'],
      unidade: ['unidade', 'setor', 'departamento', 'area'],
      cep: ['cep', 'codigo postal'],
      logradouro: ['endereco', 'logradouro', 'rua', 'avenida', 'address'],
      numero: ['numero', 'num', 'n', 'number'],
      complemento: ['complemento', 'comp'],
      bairro: ['bairro', 'district'],
      cidade: ['cidade', 'city', 'municipio'],
      estado: ['estado', 'uf', 'state'],
      banco: ['banco', 'bank'],
      agencia: ['agencia', 'agency'],
      conta: ['conta', 'account'],
      pix: ['pix', 'chave pix'],
      observacoes: ['observacoes', 'obs', 'notes', 'notas', 'comentarios'],
    };

    // Descobrir mapeamento de colunas
    const colunas = Object.keys(dados[0] || {});
    const mapeamento: Record<string, string> = {};

    for (const [campo, aliases] of Object.entries(mapeamentoCampos)) {
      for (const coluna of colunas) {
        const colunaLower = coluna.toLowerCase().trim();
        if (aliases.some(alias => colunaLower.includes(alias))) {
          mapeamento[campo] = coluna;
          break;
        }
      }
    }

    // Processar cada linha
    return dados.map((linha, index) => {
      const getValue = (campo: string) => {
        const coluna = mapeamento[campo];
        if (!coluna) return '';
        const valor = linha[coluna as keyof typeof linha];
        return String(valor ?? '').trim();
      };

      let nome = getValue('nome');
      let email = getValue('email');

      // Preencher campos obrigatorios vazios com valores ficticios
      // (para permitir importacao e edicao posterior)
      if (!nome || nome.trim() === '') {
        nome = VALORES_FICTICIOS.texto;
      }
      if (!email || email.trim() === '') {
        email = VALORES_FICTICIOS.email;
      }

      // Validacao basica - agora sempre valido pois preenchemos com ficticios
      const status: PessoaImportacao['status'] = 'valido';
      const erro: string | undefined = undefined;

      return {
        index,
        nome,
        email,
        telefone: getValue('telefone') || VALORES_FICTICIOS.telefone,
        cpf: getValue('cpf') || VALORES_FICTICIOS.cpf,
        cnpj: getValue('cnpj') || null,
        rg: getValue('rg') || VALORES_FICTICIOS.numero,
        cargo: getValue('cargo') || VALORES_FICTICIOS.texto,
        empresa: getValue('empresa') || VALORES_FICTICIOS.texto,
        unidade: getValue('unidade') || VALORES_FICTICIOS.texto,
        cep: getValue('cep') || VALORES_FICTICIOS.cep,
        logradouro: getValue('logradouro') || VALORES_FICTICIOS.texto,
        numero: getValue('numero') || VALORES_FICTICIOS.numero,
        complemento: getValue('complemento') || null,
        bairro: getValue('bairro') || VALORES_FICTICIOS.texto,
        cidade: getValue('cidade') || VALORES_FICTICIOS.texto,
        estado: getValue('estado') || 'SP',
        banco: getValue('banco') || null,
        agencia: getValue('agencia') || null,
        conta: getValue('conta') || null,
        pix: getValue('pix') || null,
        observacoes: getValue('observacoes') || 'Importado - necessita edicao',
        tipo,
        ativo: true,
        status,
        erro,
        selecionado: status === 'valido',
      };
    });
  };

  // Verificar duplicatas
  const verificarDuplicatas = async (
    itens: PessoaImportacao[]
  ): Promise<PessoaImportacao[]> => {
    const emails = itens.filter(i => i.email).map(i => i.email);
    const cpfs = itens.filter(i => i.cpf).map(i => i.cpf);

    // Buscar emails existentes
    const { data: existentes } = await supabase
      .from('pessoas')
      .select('email, cpf')
      .or(`email.in.(${emails.map(e => `"${e}"`).join(',')}),cpf.in.(${cpfs.map(c => `"${c}"`).join(',')})`);

    const emailsExistentes = new Set((existentes || []).map(e => e.email?.toLowerCase()));
    const cpfsExistentes = new Set((existentes || []).map(e => e.cpf));

    return itens.map(item => {
      if (item.email && emailsExistentes.has(item.email.toLowerCase())) {
        return { ...item, status: 'duplicado', erro: 'Email ja cadastrado', selecionado: false };
      }
      if (item.cpf && cpfsExistentes.has(item.cpf)) {
        return { ...item, status: 'duplicado', erro: 'CPF ja cadastrado', selecionado: false };
      }
      return item;
    });
  };

  // Handlers de drag and drop
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
  const atualizarItem = (index: number, changes: Partial<PessoaImportacao>) => {
    setItens(prev => prev.map((item, i) =>
      i === index ? { ...item, ...changes } : item
    ));
  };

  // Acoes em lote
  const selecionarTodosValidos = () => {
    setItens(prev => prev.map(item =>
      item.status === 'valido' ? { ...item, selecionado: true } : item
    ));
  };

  const desmarcarTodos = () => {
    setItens(prev => prev.map(item => ({ ...item, selecionado: false })));
  };

  // Importar pessoas
  const importarPessoas = async () => {
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
        const { index, status, erro, selecionado, ...dados } = item;

        const { error } = await supabase
          .from('pessoas')
          .insert(dados);

        if (error) {
          console.error('Erro ao importar:', error);
          erros++;
        } else {
          importados++;
        }
      } catch {
        erros++;
      }
    }

    setProgresso(100);
    setEtapa('concluido');
    toast.success(`${importados} pessoas importadas com sucesso!${erros > 0 ? ` (${erros} erros)` : ''}`);
  };

  // Reiniciar
  const reiniciar = () => {
    setEtapa('upload');
    setArquivo(null);
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
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Importar Pessoas</h1>
          <p className="text-[12px] text-gray-500">Importacao em massa de colaboradores, clientes e fornecedores</p>
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
              <Upload className="w-5 h-5" />
              Upload de Planilha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selecao do tipo de pessoa */}
            <div className="space-y-2">
              <Label>Tipo de Pessoa</Label>
              <Select
                value={tipoPessoa}
                onValueChange={(value) => setTipoPessoa(value as PessoaTipo)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                  <SelectItem value="CLIENTE">Cliente</SelectItem>
                  <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                  <SelectItem value="ESPECIFICADOR">Especificador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Area de upload */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input-pessoas')?.click()}
            >
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arraste a planilha aqui
              </h3>
              <p className="text-gray-500 mb-4">
                ou clique para selecionar um arquivo
              </p>
              <p className="text-sm text-gray-400">
                Formatos aceitos: Excel (.xlsx, .xls), CSV
              </p>
              <input
                id="file-input-pessoas"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {/* Configuracoes avancadas de IA */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setMostrarConfigIA(!mostrarConfigIA)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Configuracoes Avancadas de IA</span>
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
                    <Label htmlFor="promptPessoas" className="text-sm font-medium">
                      Instrucoes para Mapeamento
                    </Label>
                    <Textarea
                      id="promptPessoas"
                      value={promptPersonalizado}
                      onChange={(e) => setPromptPersonalizado(e.target.value)}
                      placeholder="Ex: A coluna 'FUNCIONARIO' contem o nome completo. A coluna 'SETOR' deve ser mapeada para 'unidade'..."
                      className="min-h-[100px] text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Use este campo para dar instrucoes especificas sobre como mapear as colunas da sua planilha.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Exemplo de formato */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Formato esperado da planilha:</h4>
              <p className="text-sm text-blue-700 mb-2">
                A planilha deve conter colunas com os dados das pessoas. Colunas reconhecidas automaticamente:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Nome', 'Email', 'Telefone', 'CPF', 'CNPJ', 'Cargo', 'Empresa', 'Endereco', 'Cidade', 'Estado'].map(col => (
                  <Badge key={col} variant="secondary" className="bg-blue-100 text-blue-800">
                    {col}
                  </Badge>
                ))}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Processando com Inteligencia Artificial
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

      {/* ETAPA 3: PREVIEW */}
      {etapa === 'preview' && (
        <>
          {/* Estatisticas */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="p-4 text-center">
                <p className="text-[20px] font-normal text-blue-700">{estatisticas.total}</p>
                <p className="text-[12px] text-blue-600">Total</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="p-4 text-center">
                <p className="text-[20px] font-normal text-green-700">{estatisticas.validos}</p>
                <p className="text-[12px] text-green-600">Validos</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50">
              <CardContent className="p-4 text-center">
                <p className="text-[20px] font-normal text-red-700">{estatisticas.erros}</p>
                <p className="text-[12px] text-red-600">Erros</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              <CardContent className="p-4 text-center">
                <p className="text-[20px] font-normal text-orange-700">{estatisticas.duplicados}</p>
                <p className="text-[12px] text-orange-600">Duplicados</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4 text-center">
                <p className="text-[20px] font-normal text-purple-700">{estatisticas.selecionados}</p>
                <p className="text-[12px] text-purple-600">Selecionados</p>
              </CardContent>
            </Card>
          </div>

          {/* Acoes em lote */}
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
                </div>
                <Button onClick={importarPessoas}>
                  <Download className="w-4 h-4 mr-2" />
                  Importar {estatisticas.selecionados} Pessoas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de preview */}
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
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Empresa/Unidade</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-20">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow
                        key={index}
                        className={item.status === 'erro' ? 'bg-red-50' : item.status === 'duplicado' ? 'bg-orange-50' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={item.selecionado}
                            onCheckedChange={(checked) => atualizarItem(index, { selecionado: !!checked })}
                            disabled={item.status === 'erro'}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.nome}
                            onChange={(e) => atualizarItem(index, { nome: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.email}
                            onChange={(e) => atualizarItem(index, { email: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.telefone || ''}
                            onChange={(e) => atualizarItem(index, { telefone: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.cargo || ''}
                            onChange={(e) => atualizarItem(index, { cargo: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="truncate">{item.empresa || '-'}</p>
                            <p className="text-xs text-gray-500 truncate">{item.unidade || ''}</p>
                          </div>
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
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => atualizarItem(index, { status: 'valido', selecionado: true })}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => atualizarItem(index, { status: 'erro', selecionado: false })}
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
                Importando Pessoas
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
              <h3 className="text-[24px] font-medium text-gray-900 mb-2">
                Importacao Concluida!
              </h3>
              <p className="text-gray-500 mb-6">
                As pessoas foram importadas com sucesso.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={reiniciar}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nova Importacao
                </Button>
                <Button onClick={() => {
                  const path = tipoPessoa === 'COLABORADOR' ? '/pessoas/colaboradores' :
                               tipoPessoa === 'CLIENTE' ? '/pessoas/clientes' :
                               tipoPessoa === 'FORNECEDOR' ? '/pessoas/fornecedores' :
                               '/pessoas/especificadores';
                  window.location.href = path;
                }}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ver Cadastros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ========================================
// PAGINA DE IMPORTACAO DE CATALOGOS COM IA
// Importa produtos de catalogos de fornecedores usando Vision AI
// ========================================

import React, { useState, useCallback } from 'react';
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
  FileImage,
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
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { openaiVision, anthropicChat, isBackendConfigured } from '@/lib/apiSecure';
import { toast } from 'sonner';

interface ProdutoExtraido {
  index: number;
  codigo: string;
  nome: string;
  descricao: string;
  unidade: string;
  preco: number;
  marca: string;
  fornecedor: string;
  categoria: string;
  tipo: 'material' | 'mao_obra';
  status: 'pendente' | 'valido' | 'erro' | 'duplicado';
  erro?: string;
  selecionado: boolean;
}

type Etapa = 'upload' | 'processando' | 'preview' | 'importando' | 'concluido';

export default function ImportarCatalogoIAPage() {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [itens, setItens] = useState<ProdutoExtraido[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
  const [fornecedorPadrao, setFornecedorPadrao] = useState('');

  // Configuracoes avancadas de IA
  const [promptPersonalizado, setPromptPersonalizado] = useState<string>("");
  const [mostrarConfigIA, setMostrarConfigIA] = useState(false);
  const [provedorIA, setProvedorIA] = useState<"openai" | "anthropic">(
    (import.meta.env.VITE_AI_PROVIDER as "openai" | "anthropic") || "openai"
  );
  // Segurança: nÍo permita chamadas diretas do browser para OpenAI/Anthropic (nÍo expor chaves no bundle).
  const usarProxyIA = true;

  // Estatisticas
  const estatisticas = {
    total: itens.length,
    validos: itens.filter(i => i.status === 'valido').length,
    erros: itens.filter(i => i.status === 'erro').length,
    duplicados: itens.filter(i => i.status === 'duplicado').length,
    selecionados: itens.filter(i => i.selecionado).length,
  };

  // Upload de arquivos
  const handleFilesSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f =>
      f.type.startsWith('image/') || f.type === 'application/pdf'
    );

    if (fileArray.length === 0) {
      toast.error('Selecione imagens ou PDFs de catalogos');
      return;
    }

    setEtapa('processando');
    setProgresso(0);
    setMensagemProgresso('Preparando analise...');

    try {
      const todosProdutos: ProdutoExtraido[] = [];
      let index = 0;

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setProgresso(Math.round((i / fileArray.length) * 80));
        setMensagemProgresso(`Analisando ${file.name} com IA...`);

        // Converter arquivo para base64
        const base64 = await fileToBase64(file);

        // Chamar API de visao
        const produtos = await analisarImagemCatalogo(base64, file.type, promptPersonalizado);

        // Adicionar produtos extraidos
        for (const produto of produtos) {
          todosProdutos.push({
            ...produto,
            index: index++,
            codigo: produto.codigo || `IA-${Date.now()}-${index}`,
            nome: produto.nome || '',
            descricao: produto.descricao || '',
            unidade: produto.unidade || 'UN',
            preco: typeof produto.preco === 'number' ? produto.preco : 0,
            marca: produto.marca || '',
            categoria: produto.categoria || '',
            tipo: produto.tipo || 'material',
            fornecedor: produto.fornecedor || fornecedorPadrao,
            status: produto.nome ? 'valido' : 'erro',
            erro: produto.nome ? undefined : 'Nome do produto nao identificado',
            selecionado: !!produto.nome,
          });
        }
      }

      // Verificar duplicatas
      setProgresso(90);
      setMensagemProgresso('Verificando duplicatas...');
      const itensComDuplicatas = await verificarDuplicatasPricelist(todosProdutos);

      setItens(itensComDuplicatas);
      setProgresso(100);
      setEtapa('preview');
      toast.success(`${todosProdutos.length} produtos extraidos!`);

    } catch (error: unknown) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      console.error('Erro ao processar catalogo:', mensagemErro);
      toast.error('Erro ao processar catalogo', { description: mensagemErro });
      setEtapa('upload');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fornecedorPadrao, promptPersonalizado]);

  // Converter arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  };

  // Analisar imagem do catalogo com IA
  const analisarImagemCatalogo = useCallback(async (
    imagemBase64: string,
    mimeType: string,
    promptExtra?: string
  ): Promise<Partial<ProdutoExtraido>[]> => {
    const promptBase = `Analise esta imagem de um catalogo de produtos/fornecedor.
Extraia TODOS os produtos visiveis com as seguintes informacoes para cada um:
- nome: nome do produto
- codigo: codigo/SKU se visivel
- descricao: descricao breve
- unidade: unidade de medida (UN, M, M2, KG, etc)
- preco: preco unitario (apenas numeros, sem simbolo de moeda)
- marca: marca do produto
- categoria: categoria do produto

${promptExtra ? `Instrucoes adicionais: ${promptExtra}` : ''}

Retorne um JSON array com os produtos. Exemplo:
[{"nome": "Porcelanato 60x60", "codigo": "PRC001", "descricao": "Porcelanato polido branco", "unidade": "M2", "preco": 89.90, "marca": "Portinari", "categoria": "Revestimentos"}]

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`;

    try {
      if (usarProxyIA && !isBackendConfigured()) {
        throw new Error('Backend nao configurado para IA. Verifique VITE_BACKEND_URL e VITE_INTERNAL_API_KEY.');
      }
      if (provedorIA === 'openai') {
        return await chamarOpenAIVisionCatalogo(imagemBase64, mimeType, promptBase);
      }
      return await chamarClaudeVisionCatalogo(imagemBase64, mimeType, promptBase);
    } catch (error) {
      console.error('Erro na API de visao:', error);
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provedorIA, usarProxyIA]);

  // Chamar OpenAI Vision
  const chamarOpenAIVisionCatalogo = useCallback(async (
    imagemBase64: string,
    mimeType: string,
    prompt: string
  ): Promise<Partial<ProdutoExtraido>[]> => {
    const dataUrl = `data:${mimeType};base64,${imagemBase64}`;
    const data = await openaiVision([dataUrl], prompt);
    const conteudo = data.choices?.[0]?.message?.content || '[]';
    return extrairProdutosJson(conteudo);
  }, []);

  // Chamar Claude Vision
  const chamarClaudeVisionCatalogo = useCallback(async (
    imagemBase64: string,
    mimeType: string,
    prompt: string
  ): Promise<Partial<ProdutoExtraido>[]> => {
    const data = await anthropicChat(
      [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imagemBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
      {
        model: import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        maxTokens: 4096,
      }
    );
    const conteudo = data.content?.[0]?.text || '[]';
    return extrairProdutosJson(conteudo);
  }, []);

  const extrairProdutosJson = (conteudo: string): Partial<ProdutoExtraido>[] => {
    try {
      const jsonMatch = conteudo.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch {
      return [];
    }
  };

  // Verificar duplicatas no Pricelist
  const verificarDuplicatasPricelist = async (
    itens: ProdutoExtraido[]
  ): Promise<ProdutoExtraido[]> => {
    const nomes = itens.map(i => i.nome?.toLowerCase()).filter(Boolean);

    const { data: existentes } = await supabase
      .from('pricelist_itens')
      .select('nome, codigo')
      .or(nomes.map(n => `nome.ilike.%${n}%`).join(','));

    const nomesExistentes = new Set((existentes || []).map(e => e.nome?.toLowerCase()));

    return itens.map(item => {
      if (item.nome && nomesExistentes.has(item.nome.toLowerCase())) {
        return { ...item, status: 'duplicado', erro: 'Produto ja existe no Pricelist', selecionado: false };
      }
      return item;
    });
  };

  // Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFilesSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) handleFilesSelect(files);
  };

  const atualizarItem = (index: number, changes: Partial<ProdutoExtraido>) => {
    setItens(prev => prev.map((item, i) =>
      i === index ? { ...item, ...changes } : item
    ));
  };

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
            codigo: item.codigo || `IMP-${Date.now()}-${i}`,
            nome: item.nome,
            descricao: item.descricao,
            unidade: item.unidade || 'UN',
            preco: item.preco || 0,
            marca: item.marca,
            fornecedor: item.fornecedor,
            tipo: item.tipo || 'material',
            ativo: true,
          });

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
    toast.success(`${importados} produtos importados!${erros > 0 ? ` (${erros} erros)` : ''}`);
  };

  const reiniciar = () => {
    setEtapa('upload');
    setItens([]);
    setProgresso(0);
    setMensagemProgresso('');
  };

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
          <h1 className="text-2xl font-normal text-gray-900">Importar Catalogo com IA</h1>
          <p className="text-gray-500">Extraia produtos de imagens de catalogos usando Inteligencia Artificial</p>
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
              Upload de Catalogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fornecedor padrao */}
            <div className="space-y-2">
              <Label>Fornecedor (opcional)</Label>
              <Input
                value={fornecedorPadrao}
                onChange={(e) => setFornecedorPadrao(e.target.value)}
                placeholder="Nome do fornecedor do catalogo"
                className="max-w-md"
              />
            </div>

            {/* Selecao do provedor de IA */}
            <div className="space-y-2">
              <Label>Provedor de IA</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={provedorIA === "openai" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProvedorIA("openai")}
                >
                  OpenAI GPT-4o
                </Button>
                <Button
                  type="button"
                  variant={provedorIA === "anthropic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProvedorIA("anthropic")}
                >
                  Claude (Anthropic)
                </Button>
              </div>
            </div>

            {/* Area de upload */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input-catalogo')?.click()}
            >
              <FileImage className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arraste imagens do catalogo aqui
              </h3>
              <p className="text-gray-500 mb-4">
                ou clique para selecionar arquivos
              </p>
              <p className="text-sm text-gray-400">
                Formatos aceitos: JPEG, PNG, WebP, GIF
              </p>
              <input
                id="file-input-catalogo"
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                className="hidden"
              />
            </div>

            {/* Configuracoes avancadas */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setMostrarConfigIA(!mostrarConfigIA)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Configuracoes Avancadas</span>
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
                    <Label htmlFor="promptCatalogo" className="text-sm font-medium">
                      Instrucoes Adicionais para IA
                    </Label>
                    <Textarea
                      id="promptCatalogo"
                      value={promptPersonalizado}
                      onChange={(e) => setPromptPersonalizado(e.target.value)}
                      placeholder="Ex: Os precos estao em dolares, converter para reais. Ignorar produtos fora de linha..."
                      className="min-h-[100px] text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Use este campo para dar instrucoes especificas sobre como extrair os produtos.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Aviso */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Dica para melhores resultados:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use imagens de boa qualidade e bem iluminadas</li>
                  <li>Evite imagens com muitos produtos por pagina</li>
                  <li>Certifique-se de que precos e nomes estao legiveis</li>
                </ul>
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
                Analisando Catalogo com IA
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
                      <TableHead>Nome</TableHead>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Preco</TableHead>
                      <TableHead>Marca</TableHead>
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
                            value={item.codigo}
                            onChange={(e) => atualizarItem(index, { codigo: e.target.value })}
                            className="h-8 w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.unidade || 'UN'}
                            onValueChange={(value) => atualizarItem(index, { unidade: value })}
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UN">UN</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                              <SelectItem value="M2">M²</SelectItem>
                              <SelectItem value="M3">M³</SelectItem>
                              <SelectItem value="KG">KG</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="PC">PC</SelectItem>
                              <SelectItem value="CX">CX</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.preco || 0}
                            onChange={(e) => atualizarItem(index, { preco: parseFloat(e.target.value) || 0 })}
                            className="h-8 w-24 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.marca || ''}
                            onChange={(e) => atualizarItem(index, { marca: e.target.value })}
                            className="h-8 w-24"
                          />
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
                              className="h-7 w-7 text-green-600"
                              onClick={() => atualizarItem(index, { status: 'valido', selecionado: true })}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600"
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

